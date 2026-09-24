<script setup>
import { computed, onMounted, ref } from 'vue';
import { useCatalogStore } from '../stores/catalog.js';
import { useDisplayStore } from '../stores/display.js';
import { useLocaleStore } from '../stores/locale.js';
import { resolveFontStack, useTypographyStore } from '../stores/typography.js';
import { formatUploadedAt } from '../utils/format.js';

const catalog = useCatalogStore();
const display = useDisplayStore();
const typography = useTypographyStore();
const locale = useLocaleStore();
const activeTab = ref('regular');
const visibleSites = computed(() => catalog.sites.filter(
  (site) => Boolean(site.passwordProtected) === (activeTab.value === 'protected'),
));
const tabs = ['regular', 'protected'];

function moveTab(event, index) {
  let next = index;
  if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
  else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
  else if (event.key === 'Home') next = 0;
  else if (event.key === 'End') next = tabs.length - 1;
  else return;
  event.preventDefault();
  activeTab.value = tabs[next];
  document.getElementById(`catalog-tab-${tabs[next]}`)?.focus();
}

onMounted(() => {
  if (!catalog.loaded) {
    catalog.fetch();
  }
});

function siteHref(site) {
  return site.type === 'link' && !site.passwordProtected ? site.linkUrl : `/${site.pathId}/`;
}

// .wrap's usual top padding is meant for pages without their own hero
// spacing control — on the home page --h1-space-before (bound on .intro
// below) replaces it entirely, so a value of 0 there can put the title
// flush against the header rule as the setting promises.
const wrapStyle = { paddingTop: 0 };

const introStyle = computed(() => ({
  '--h1-space-before': `${typography.h1SpaceBefore}px`,
}));
const h1Style = computed(() => ({
  fontFamily: resolveFontStack(typography.h1Font),
  fontSize: `${typography.h1Size}px`,
  marginBottom: `${typography.h1SpaceAfter}px`,
}));
const subtitleStyle = computed(() => ({
  fontFamily: resolveFontStack(typography.subtitleFont),
  fontSize: `${typography.subtitleSize}px`,
  marginTop: `${typography.subtitleSpaceBefore}px`,
  marginBottom: `${typography.subtitleSpaceAfter}px`,
}));

const listStyle = computed(() => ({
  '--row-pad-block': `${display.rowPadding}rem`,
  '--row-index-size': `${typography.rowIndexSize}px`,
  '--row-title-font': resolveFontStack(typography.listTitleFont),
  '--row-title-size': `${typography.listTitleSize}px`,
  '--row-desc-font': resolveFontStack(typography.listDescFont),
  '--row-desc-size': `${typography.listDescSize}px`,
}));
const gridStyle = computed(() => ({
  '--grid-cols': display.gridColumns,
  '--tile-height': `${display.tileHeight}px`,
  '--tile-title-font': resolveFontStack(typography.tileTitleFont),
  '--tile-title-size': `${typography.tileTitleSize}px`,
  '--tile-desc-font': resolveFontStack(typography.tileDescFont),
  '--tile-desc-size': `${typography.tileDescSize}px`,
}));
// The grid layout's tiles are already fully bordered cards, so the hero's
// bottom rule would just double up against the first row of tiles — only
// keep it when there's an actual table to draw a header-style line above.
const showIntroDivider = computed(
  () => catalog.sites.length === 0 || display.layout === 'table',
);
</script>

<template>
  <main class="wrap" :style="wrapStyle">
    <template v-if="catalog.loaded">
      <section
        class="intro"
        :class="{ 'has-divider': showIntroDivider }"
        :style="introStyle"
      >
        <h1 :style="h1Style">{{ catalog.settings.title }}</h1>
        <p class="lede" :style="subtitleStyle">{{ catalog.settings.subtitle }}</p>
      </section>

      <div class="catalog-tabs segmented" role="tablist" :aria-label="locale.t('catalog.tabsLabel')">
        <button
          v-for="(tab, index) in tabs"
          :id="`catalog-tab-${tab}`"
          :key="tab"
          type="button"
          role="tab"
          class="segmented-option"
          :class="{ 'is-active': activeTab === tab }"
          :aria-selected="activeTab === tab"
          aria-controls="catalog-panel"
          :tabindex="activeTab === tab ? 0 : -1"
          @click="activeTab = tab"
          @keydown="moveTab($event, index)"
        >{{ locale.t(`catalog.${tab}`) }}</button>
      </div>

      <div id="catalog-panel" role="tabpanel" :aria-labelledby="`catalog-tab-${activeTab}`" tabindex="0">
        <section v-if="visibleSites.length === 0" class="empty">
          <p>{{ locale.t(catalog.sites.length === 0 ? 'catalog.empty' : `catalog.empty${activeTab === 'protected' ? 'Protected' : 'Regular'}`) }}</p>
        </section>

        <section
          v-else-if="display.layout === 'table'"
          class="list"
          :style="listStyle"
          :aria-label="locale.t('catalog.listLabel')"
        >
          <a
            v-for="(site, index) in visibleSites"
            :key="site.pathId"
            class="row"
            :href="siteHref(site)"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span class="row-index">{{ String(index + 1).padStart(2, '0') }}</span>
            <span class="row-main">
              <span class="row-title">
                {{ site.title }}
                <svg
                  v-if="site.type === 'link'"
                  class="external-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  :aria-label="locale.t('catalog.externalLink')"
                >
                  <path d="M7 17L17 7M17 7H9M17 7V15" />
                </svg>
              </span>
              <span class="row-desc">{{
                site.description || locale.t('common.noDescription')
              }}</span>
              <span class="row-meta">
                <span v-if="site.version" class="mono">{{
                  locale.t('common.versionTag', { version: site.version })
                }}</span>
                <span>{{ formatUploadedAt(site.uploadedAt) }}</span>
              </span>
            </span>
            <span class="row-path mono">/{{ site.pathId }}/</span>
            <span class="row-open">{{ locale.t('catalog.open') }}</span>
          </a>
        </section>

        <section
          v-else
          class="grid"
          :style="gridStyle"
          :aria-label="locale.t('catalog.listLabel')"
        >
          <a
            v-for="site in visibleSites"
            :key="site.pathId"
            class="tile"
            :href="siteHref(site)"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span class="tile-title">
              {{ site.title }}
              <svg
                v-if="site.type === 'link'"
                class="external-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
                stroke-linejoin="round"
                :aria-label="locale.t('catalog.externalLink')"
              >
                <path d="M7 17L17 7M17 7H9M17 7V15" />
              </svg>
            </span>
            <span class="tile-desc">{{
              site.description || locale.t('common.noDescription')
            }}</span>
            <span class="tile-foot">
              <span class="tile-meta">
                <span v-if="site.version" class="mono">{{
                  locale.t('common.versionTag', { version: site.version })
                }}</span>
                <span>{{ formatUploadedAt(site.uploadedAt) }}</span>
              </span>
              <span class="tile-path mono">/{{ site.pathId }}/</span>
            </span>
          </a>
        </section>

        <p class="tally">
          {{ locale.t('catalog.tally', { count: visibleSites.length }) }}
        </p>
      </div>
    </template>

    <p v-else class="muted">{{ locale.t('common.loading') }}</p>
  </main>
</template>

<style scoped>
.catalog-tabs { margin-block: 1.25rem; }
.catalog-tabs button { font-size: var(--type-control); line-height: 1.5; }
</style>
