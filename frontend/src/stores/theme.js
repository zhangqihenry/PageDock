import { defineStore } from 'pinia';

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
      try {
        window.localStorage.setItem(STORAGE_KEY, this.theme);
      } catch {
        /* localStorage unavailable — theme just won't persist */
      }
    },
  },
});
