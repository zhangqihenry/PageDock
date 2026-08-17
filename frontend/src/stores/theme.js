import { defineStore } from 'pinia';
import { reapplyColorTheme } from './colorTheme.js';

const STORAGE_KEY = 'pagedock-theme';

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

// The inline script in index.html already applies a stored theme before
// Vue mounts (to avoid a flash of the wrong theme), so the store's initial
// state just reads whatever attribute is already on <html>.
export const useThemeStore = defineStore('theme', {
  state: () => ({
    theme:
      document.documentElement.getAttribute('data-theme') === 'dark'
        ? 'dark'
        : 'light',
  }),
  actions: {
    toggle() {
      this.theme = this.theme === 'dark' ? 'light' : 'dark';
      applyTheme(this.theme);
      // The active color theme (if any) has separate light/dark numbers —
      // re-run it now that data-theme has changed, or it'd keep showing
      // the old mode's values.
      reapplyColorTheme();
      try {
        window.localStorage.setItem(STORAGE_KEY, this.theme);
      } catch {
        /* localStorage unavailable — theme just won't persist */
      }
    },
  },
});
