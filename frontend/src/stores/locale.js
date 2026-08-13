import { defineStore } from 'pinia';
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  resolveLocale,
  translate,
} from '../i18n/dictionaries.js';

const STORAGE_KEY = 'pagedock-lang';

function readStoredLocale() {
  try {
    return resolveLocale(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return DEFAULT_LOCALE;
  }
}

export const useLocaleStore = defineStore('locale', {
  state: () => ({
    locale: readStoredLocale(),
  }),
  getters: {
    // Usage: localeStore.t('errorCode.SITE_NOT_FOUND') or
    // localeStore.t('nav.versionLabel', { version: '0.9.0' }).
    t: (state) => (key, params) => translate(state.locale, key, params),
  },
  actions: {
    setLocale(locale) {
      this.locale = resolveLocale(locale);
      try {
        window.localStorage.setItem(STORAGE_KEY, this.locale);
      } catch {
        /* localStorage unavailable — preference just won't persist */
      }
    },
    toggle() {
      this.setLocale(this.locale === 'en' ? 'zh' : 'en');
    },
  },
});

export { SUPPORTED_LOCALES };
