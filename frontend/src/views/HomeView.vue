<script setup>
import { onMounted } from 'vue';
import { useCatalogStore } from '../stores/catalog.js';
import { useLocaleStore } from '../stores/locale.js';

// Placeholder wiring for Phase 3 — proves the catalog store/API round trip
// works end to end. The real Blog-style layout (hero title/subtitle, login
// modal, header) lands in the next phase.
const catalog = useCatalogStore();
const locale = useLocaleStore();

onMounted(() => {
  catalog.fetch();
});
</script>

<template>
  <main>
    <p v-if="!catalog.loaded">{{ locale.t('common.loading') }}</p>
    <template v-else>
      <h1>{{ catalog.settings.title }}</h1>
      <p>{{ catalog.settings.subtitle }}</p>
      <p>{{ catalog.sites.length }}</p>
      <ul>
        <li v-for="site in catalog.sites" :key="site.pathId">
          <a :href="`/${site.pathId}/`" target="_blank" rel="noopener">
            {{ site.title }}
          </a>
        </li>
      </ul>
    </template>
  </main>
</template>
