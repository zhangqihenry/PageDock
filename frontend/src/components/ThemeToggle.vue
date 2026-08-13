<script setup>
import { useThemeStore } from '../stores/theme.js';
import { useLocaleStore } from '../stores/locale.js';

const theme = useThemeStore();
const locale = useLocaleStore();
</script>

<template>
  <button
    type="button"
    class="icon-button"
    :aria-label="locale.t('nav.toggleTheme')"
    :title="locale.t('nav.toggleTheme')"
    @click="theme.toggle()"
  >
    <svg v-if="theme.theme === 'dark'" viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <radialGradient id="moonBody" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stop-color="#f6f2e8" />
          <stop offset="60%" stop-color="#d3cdba" />
          <stop offset="100%" stop-color="#a29a86" />
        </radialGradient>
      </defs>
      <path
        d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 1 0 10.5 10.5Z"
        fill="url(#moonBody)"
        stroke="#8b8271"
        stroke-width="0.6"
      />
      <circle cx="10.6" cy="9.6" r="0.85" fill="#93896f" opacity="0.65" />
      <circle cx="14.1" cy="14.4" r="1.2" fill="#93896f" opacity="0.55" />
      <circle cx="9.1" cy="13.9" r="0.55" fill="#93896f" opacity="0.5" />
    </svg>
    <svg v-else viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <radialGradient id="sunBody" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#ffe28a" />
          <stop offset="55%" stop-color="#ffb347" />
          <stop offset="100%" stop-color="#e07f22" />
        </radialGradient>
      </defs>
      <g stroke="#c97a1f" stroke-width="1.1" stroke-linecap="round" opacity="0.65">
        <path
          d="M12 2v2.4M12 19.6V22M22 12h-2.4M4.4 12H2M19.07 4.93l-1.7 1.7M6.63 17.37l-1.7 1.7M19.07 19.07l-1.7-1.7M6.63 6.63l-1.7-1.7"
        />
      </g>
      <circle cx="12" cy="12" r="5.4" fill="url(#sunBody)" stroke="#c97a1f" stroke-width="0.75" />
    </svg>
  </button>
</template>
