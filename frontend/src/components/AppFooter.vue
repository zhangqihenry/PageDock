<script setup>
import { computed } from 'vue';
import { useCatalogStore } from '../stores/catalog.js';
import { useLocaleStore } from '../stores/locale.js';
import { resolveFontStack, useTypographyStore } from '../stores/typography.js';

const catalog = useCatalogStore();
const locale = useLocaleStore();
const typography = useTypographyStore();

const footerStyle = computed(() => ({
  fontFamily: resolveFontStack(typography.footerFont),
  fontSize: `${typography.footerSize}px`,
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
    </div>
  </footer>
</template>
