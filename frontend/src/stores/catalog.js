import { defineStore } from 'pinia';
import { api } from '../api/client.js';

// Public homepage data — the enabled site list plus the admin-customizable
// title/subtitle. Shared between HomeView and Admin's Settings tab (which
// prefills its form from here and re-fetches after a save) so both stay in
// sync from one source of truth instead of duplicating fetch logic.
export const useCatalogStore = defineStore('catalog', {
  state: () => ({
    sites: [],
    settings: { title: '', subtitle: '' },
    meta: { version: '' },
    loaded: false,
  }),
  actions: {
    async fetch() {
      const data = await api.get('/catalog');
      this.sites = data.sites;
      this.settings = data.settings;
      this.meta = data.meta;
      this.loaded = true;
      return data;
    },
  },
});
