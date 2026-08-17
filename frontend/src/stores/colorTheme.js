import { defineStore } from 'pinia';
import { COLOR_THEME_HUES, PALETTE_KEYS, computePalette } from '../theme/colorThemePalette.js';

const STORAGE_KEY = 'pagedock-color-theme';

// 'default' is the original neutral black/white/red look and needs no
// inline overrides — every other id applies computePalette()'s tokens
// directly on <html>.style. Order here is also the order the swatches
// render in.
export const COLOR_THEMES = ['default', ...COLOR_THEME_HUES.map((entry) => entry.id)];

function currentMode() {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

function readStoredId() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return COLOR_THEMES.includes(stored) ? stored : 'default';
  } catch {
    return 'default';
  }
}

function applyColorTheme(id) {
  const rootStyle = document.documentElement.style;
  const entry = COLOR_THEME_HUES.find((theme) => theme.id === id);
  if (!entry) {
    PALETTE_KEYS.forEach((key) => rootStyle.removeProperty(key));
    return;
  }
  const palette = computePalette(entry.hue, currentMode());
  Object.entries(palette).forEach(([key, value]) => rootStyle.setProperty(key, value));
}

// A color theme's dark variant uses different numbers than its light one
// (it's not just an inverted filter), so flipping light/dark needs to
// recompute and re-apply whichever color theme is currently active —
// theme.js calls this right after it flips data-theme.
export function reapplyColorTheme() {
  applyColorTheme(readStoredId());
}

// Same persistence pattern as theme.js/display.js — the inline script in
// index.html already applies a stored color theme before Vue mounts, so
// this just needs to agree with localStorage, not re-apply anything itself.
export const useColorThemeStore = defineStore('colorTheme', {
  state: () => ({
    theme: readStoredId(),
  }),
  actions: {
    setTheme(id) {
      this.theme = COLOR_THEMES.includes(id) ? id : 'default';
      applyColorTheme(this.theme);
      try {
        window.localStorage.setItem(STORAGE_KEY, this.theme);
      } catch {
        /* localStorage unavailable — theme just won't persist */
      }
    },
  },
});
