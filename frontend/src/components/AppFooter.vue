<script setup>
import { computed, onBeforeUnmount, onMounted } from 'vue';
import { useCatalogStore } from '../stores/catalog.js';
import { useLocaleStore } from '../stores/locale.js';
import { resolveFontStack, useTypographyStore } from '../stores/typography.js';
import { formatCount } from '../utils/format.js';

const catalog = useCatalogStore();
const locale = useLocaleStore();
const typography = useTypographyStore();

const footerStyle = computed(() => ({
  fontFamily: resolveFontStack(typography.footerFont),
  fontSize: `${typography.footerSize}px`,
}));

// Counters render only once the catalog has answered — a flash of
// "今日 0" before the numbers arrive reads as a broken counter.
const visits = computed(() => ({
  today: formatCount(catalog.stats.today),
  week: formatCount(catalog.stats.week),
  total: formatCount(catalog.stats.total),
}));

// The counters arrive with the catalog once per page load, so a tab left
// open (or restored from the back/forward cache) would keep showing the
// numbers from when it was opened. Re-read them while the page is in view
// and the moment it comes back into view.
const REFRESH_INTERVAL_MS = 60_000;
let refreshTimer = null;

function refreshStats() {
  if (!catalog.loaded || document.visibilityState !== 'visible') {
    return;
  }
  // A failed refresh just keeps the last numbers on screen.
  catalog.refreshStats().catch(() => {});
}

function onVisibilityChange() {
  if (document.visibilityState === 'visible') {
    refreshStats();
  }
}

function onPageShow(event) {
  if (event.persisted) {
    refreshStats();
  }
}

onMounted(() => {
  refreshTimer = setInterval(refreshStats, REFRESH_INTERVAL_MS);
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('pageshow', onPageShow);
});

onBeforeUnmount(() => {
  clearInterval(refreshTimer);
  document.removeEventListener('visibilitychange', onVisibilityChange);
  window.removeEventListener('pageshow', onPageShow);
});
</script>

<template>
  <footer class="footer">
    <div class="footer-inner container" :style="footerStyle">
      <p class="footer-line">
        <a
          class="footer-link"
          href="https://github.com/zhangqihenry/PageDock"
          target="_blank"
          rel="noopener noreferrer"
        >{{ locale.t('footer.poweredBy') }}</a>
        <span class="footer-dot" aria-hidden="true"></span>
        <a
          v-if="catalog.meta.version"
          class="footer-link mono"
          :href="`https://github.com/zhangqihenry/PageDock/releases/tag/v${catalog.meta.version}`"
          target="_blank"
          rel="noopener noreferrer"
          :title="locale.t('nav.versionLabel', { version: catalog.meta.version })"
        >v{{ catalog.meta.version }}</a>
        <span class="footer-dot" aria-hidden="true"></span>
        <a
          class="footer-link"
          href="https://github.com/zhangqihenry"
          target="_blank"
          rel="noopener noreferrer"
          :title="locale.t('nav.githubProfile')"
        >{{ locale.t('footer.author') }}</a>
      </p>
      <Transition name="fade">
        <p v-if="catalog.loaded" class="footer-line footer-visits">
          <span>{{ locale.t('footer.visits') }}</span>
          <span class="footer-dot" aria-hidden="true"></span>
          <span>{{ locale.t('footer.visitsToday', { count: visits.today }) }}</span>
          <span class="footer-dot" aria-hidden="true"></span>
          <span>{{ locale.t('footer.visitsWeek', { count: visits.week }) }}</span>
          <span class="footer-dot" aria-hidden="true"></span>
          <span>{{ locale.t('footer.visitsTotal', { count: visits.total }) }}</span>
        </p>
      </Transition>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  margin-top: var(--space-8);
}

.footer-inner {
  display: grid;
  gap: var(--space-1-5);
  border-top: var(--border-width) solid var(--border);
  padding-block: var(--space-6) var(--space-8);
  color: var(--ink-faint);
  line-height: var(--leading-snug);
  text-align: center;
}

.footer-line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--space-1) var(--space-2);
  margin: 0;
}

.footer-link {
  border-radius: var(--radius-xs);
  color: var(--ink-faint);
  text-decoration: none;
  transition: color var(--dur-fast) var(--ease-standard);
}

.footer-link:hover {
  color: var(--accent);
}

.footer-dot {
  width: var(--size-dot);
  height: var(--size-dot);
  border-radius: 50%;
  background: currentColor;
  opacity: 0.6;
}

.footer-visits {
  opacity: 0.8;
  font-variant-numeric: tabular-nums;
}
</style>
