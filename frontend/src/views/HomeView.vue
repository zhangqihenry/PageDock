<script setup>
import { onMounted } from 'vue';
import { useCatalogStore } from '../stores/catalog.js';
import { useLocaleStore } from '../stores/locale.js';
import { formatUploadedAt } from '../utils/format.js';

const catalog = useCatalogStore();
const locale = useLocaleStore();

onMounted(() => {
  if (!catalog.loaded) {
    catalog.fetch();
  }
});
</script>

<template>
  <main class="wrap">
    <template v-if="catalog.loaded">
      <section class="intro">
        <h1>{{ catalog.settings.title }}</h1>
        <p class="lede">{{ catalog.settings.subtitle }}</p>
        <p class="tally">
          {{ locale.t('catalog.tally', { count: catalog.sites.length }) }}
        </p>
      </section>

      <section v-if="catalog.sites.length === 0" class="empty">
        <p>{{ locale.t('catalog.empty') }}</p>
      </section>

      <section v-else class="list" :aria-label="locale.t('catalog.listLabel')">
        <a
          v-for="(site, index) in catalog.sites"
          :key="site.pathId"
          class="row"
          :href="`/${site.pathId}/`"
          target="_blank"
          rel="noopener"
        >
          <span class="row-index">{{ String(index + 1).padStart(2, '0') }}</span>
          <span class="row-main">
            <span class="row-title">{{ site.title }}</span>
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
    </template>

    <p v-else class="muted">{{ locale.t('common.loading') }}</p>
  </main>
</template>
