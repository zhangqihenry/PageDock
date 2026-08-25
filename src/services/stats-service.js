import fs from 'node:fs/promises';
import path from 'node:path';

const STATS_FILE = 'stats.json';
const DAY_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// Only the last 7 daily buckets are ever displayed; keeping a month of
// them leaves room for a longer window later while still bounding the
// file. The all-time total is a plain counter, so pruning old buckets
// never loses it.
const RETAINED_DAYS = 30;
const WINDOW_DAYS = 7;

// Views arrive far faster than they need to be durable — writing the file
// on every request would mean a disk write per asset-less page load. The
// counters live in memory and are flushed at most once per interval, so a
// crash costs at most this much counting, never a corrupted file.
const FLUSH_INTERVAL_MS = 5_000;

// Days are bucketed in the server's local time, which in Docker means UTC
// unless the container sets TZ — see the README's note on TZ.
function dayKey(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  );
}

function dayKeyBefore(date, daysAgo) {
  const shifted = new Date(date);
  shifted.setDate(shifted.getDate() - daysAgo);
  return dayKey(shifted);
}

function toCount(value) {
  return Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

async function readStoredStats(statsPath) {
  try {
    const raw = await fs.readFile(statsPath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT' || error instanceof SyntaxError) {
      return null;
    }
    throw error;
  }
}

// Page-view counting for the public surface: the catalog homepage and the
// documents of published sites. Every view counts, including repeat visits
// from the same person on the same day — this is traffic, not unique
// visitors, so nothing about who the visitor is gets read or stored.
export function createStatsService(config) {
  const statsPath = path.join(config.dataDir, STATS_FILE);

  let total = 0;
  let days = new Map();
  let dirty = false;
  let flushTimer = null;
  let writeChain = Promise.resolve();

  async function initialize() {
    const stored = await readStoredStats(statsPath);
    total = toCount(stored?.total);
    days = new Map(
      Object.entries(stored?.days || {})
        .filter(([key, value]) => DAY_KEY_PATTERN.test(key) && toCount(value))
        .map(([key, value]) => [key, toCount(value)]),
    );
  }

  // Buckets are keyed by date, so a plain descending sort keeps the newest.
  function prune() {
    if (days.size <= RETAINED_DAYS) {
      return;
    }
    const kept = [...days.entries()]
      .sort(([left], [right]) => right.localeCompare(left))
      .slice(0, RETAINED_DAYS);
    days = new Map(kept);
  }

  function persist() {
    prune();
    const payload = {
      schemaVersion: 1,
      total,
      days: Object.fromEntries(
        [...days.entries()].sort(([left], [right]) => right.localeCompare(left)),
      ),
    };
    // Serialized behind writeChain so two flushes can never interleave
    // their writes to the same file.
    writeChain = writeChain.then(() =>
      fs.writeFile(statsPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8'),
    );
    return writeChain;
  }

  async function flush() {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    if (!dirty) {
      await writeChain;
      return;
    }
    dirty = false;
    await persist();
  }

  function scheduleFlush() {
    dirty = true;
    if (flushTimer) {
      return;
    }
    flushTimer = setTimeout(() => {
      flushTimer = null;
      flush().catch((error) => {
        console.error(`PageDock failed to save view stats: ${error.message}`);
      });
    }, FLUSH_INTERVAL_MS);
    // A pending counter write is never a reason to hold the process open.
    flushTimer.unref?.();
  }

  function record() {
    const key = dayKey(new Date());
    days.set(key, (days.get(key) || 0) + 1);
    total += 1;
    scheduleFlush();
  }

  function summary() {
    const now = new Date();
    let recent = 0;
    for (let daysAgo = 0; daysAgo < WINDOW_DAYS; daysAgo += 1) {
      recent += days.get(dayKeyBefore(now, daysAgo)) || 0;
    }
    return { today: days.get(dayKey(now)) || 0, week: recent, total };
  }

  return { initialize, record, summary, flush };
}

export { RETAINED_DAYS, WINDOW_DAYS };
