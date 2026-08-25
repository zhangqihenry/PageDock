<script setup>
import { computed } from 'vue';
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
</script>

<template>
  <footer class="site-footer">
    <div class="site-footer-inner">
      <p class="site-footer-text" :style="footerStyle">
        <a
          class="site-footer-link"
          href="https://github.com/zhangqihenry/PageDock"
          target="_blank"
          rel="noopener noreferrer"
        >{{ locale.t('footer.poweredBy') }}</a>
        <span class="site-footer-dot" aria-hidden="true">&middot;</span>
        <a
          v-if="catalog.meta.version"
          class="site-footer-link mono"
          :href="`https://github.com/zhangqihenry/PageDock/releases/tag/v${catalog.meta.version}`"
          target="_blank"
          rel="noopener noreferrer"
          :title="locale.t('nav.versionLabel', { version: catalog.meta.version })"
        >v{{ catalog.meta.version }}</a>
        <span class="site-footer-dot" aria-hidden="true">&middot;</span>
        <a
          class="site-footer-link"
          href="https://github.com/zhangqihenry"
          target="_blank"
          rel="noopener noreferrer"
          :title="locale.t('nav.githubProfile')"
        >{{ locale.t('footer.author') }}</a>
      </p>
      <p
        v-if="catalog.loaded"
        class="site-footer-text site-footer-visits"
        :style="footerStyle"
      >
        <span>{{ locale.t('footer.visits') }}</span>
        <span class="site-footer-dot" aria-hidden="true">&middot;</span>
        <span>{{ locale.t('footer.visitsToday', { count: visits.today }) }}</span>
        <span class="site-footer-dot" aria-hidden="true">&middot;</span>
        <span>{{ locale.t('footer.visitsWeek', { count: visits.week }) }}</span>
        <span class="site-footer-dot" aria-hidden="true">&middot;</span>
        <span>{{ locale.t('footer.visitsTotal', { count: visits.total }) }}</span>
      </p>
    </div>
  </footer>
</template>
