import { defineStore } from 'pinia';
import { api } from '../api/client.js';

// Public homepage data — the enabled site list, the admin-customizable
// title/subtitle, and the page-view counters the footer shows. Shared
// between HomeView and Admin's Settings tab (which prefills its form from
// here and re-fetches after a save) so both stay in sync from one source
// of truth instead of duplicating fetch logic.
export const useCatalogStore = defineStore('catalog', {
  state: () => ({
    sites: [],
    settings: { title: '', subtitle: '' },
    meta: { version: '' },
    stats: { today: 0, week: 0, total: 0 },
    loaded: false,
  }),
  actions: {
    async fetch() {
      const data = await api.get('/catalog');
      this.sites = data.sites;
      this.settings = data.settings;
      this.meta = data.meta;
      // Older servers don't send counters; leave the zeros in place rather
      // than blanking the state the footer reads.
      if (data.stats) {
        this.stats = data.stats;
      }
      this.loaded = true;
      return data;
    },
  },
});
