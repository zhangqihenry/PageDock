<script setup>
import { computed, onMounted } from 'vue';
import { useCatalogStore } from '../stores/catalog.js';
import { useDisplayStore } from '../stores/display.js';
import { useLocaleStore } from '../stores/locale.js';
import { formatUploadedAt } from '../utils/format.js';

const catalog = useCatalogStore();
const display = useDisplayStore();
const locale = useLocaleStore();

onMounted(() => {
  if (!catalog.loaded) {
    catalog.fetch();
  }
});

function siteHref(site) {
  return site.type === 'link' ? site.linkUrl : `/${site.pathId}/`;
}

const listStyle = computed(() => ({ '--row-pad-block': `${display.rowPadding}rem` }));
const gridStyle = computed(() => ({ '--grid-cols': display.gridColumns }));
// The grid layout's tiles are already fully bordered cards, so the hero's
// bottom rule would just double up against the first row of tiles — only
// keep it when there's an actual table to draw a header-style line above.
const showIntroDivider = computed(
  () => catalog.sites.length === 0 || display.layout === 'table',
);
</script>

<template>
  <main class="wrap">
    <template v-if="catalog.loaded">
      <section class="intro" :class="{ 'has-divider': showIntroDivider }">
        <h1>{{ catalog.settings.title }}</h1>
        <p class="lede">{{ catalog.settings.subtitle }}</p>
        <p class="tally">
          {{ locale.t('catalog.tally', { count: catalog.sites.length }) }}
        </p>
      </section>

      <section v-if="catalog.sites.length === 0" class="empty">
        <p>{{ locale.t('catalog.empty') }}</p>
      </section>

      <section
        v-else-if="display.layout === 'table'"
        class="list"
        :style="listStyle"
        :aria-label="locale.t('catalog.listLabel')"
      >
        <a
          v-for="(site, index) in catalog.sites"
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
          v-for="site in catalog.sites"
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
    </template>

    <p v-else class="muted">{{ locale.t('common.loading') }}</p>
  </main>
</template>
