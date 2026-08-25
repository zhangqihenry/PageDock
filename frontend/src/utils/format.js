// Ported from the old src/utils/{date,file-size}.js. The API now returns
// raw uploadedAt (ISO string) and sizeBytes (number) instead of
// pre-formatted strings, so formatting happens here at render time.

export function formatUploadedAt(isoString) {
  const date = new Date(isoString);
  const pad = (value) => String(value).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** index;
  const precision = index === 0 || value >= 10 ? 0 : 1;
  return `${value.toFixed(precision)} ${units[index]}`;
}

// Page-view counters. Grouping is fixed to en-US so the thousands
// separator looks the same in both UI languages.
export function formatCount(value) {
  const count = Number(value);
  if (!Number.isFinite(count) || count <= 0) {
    return '0';
  }
  return Math.round(count).toLocaleString('en-US');
}
