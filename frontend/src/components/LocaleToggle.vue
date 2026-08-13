<script setup>
import { useLocaleStore } from '../stores/locale.js';

const locale = useLocaleStore();
const label = () =>
  locale.locale === 'en' ? '切换到中文' : 'Switch to English';
</script>

<template>
  <button
    type="button"
    class="icon-button lang-button"
    :aria-label="label()"
    :title="label()"
    @click="locale.toggle()"
  >
    {{ locale.locale === 'en' ? '中' : 'EN' }}
  </button>
</template>
