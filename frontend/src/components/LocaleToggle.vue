<script setup>
import { useLocaleStore } from '../stores/locale.js';

const locale = useLocaleStore();
const label = () =>
  locale.locale === 'en' ? '切换到中文' : 'Switch to English';
</script>

<template>
  <button
    type="button"
    class="icon-btn locale-toggle"
    :aria-label="label()"
    :title="label()"
    @click="locale.toggle()"
  >
    <Transition name="fade" mode="out-in">
      <span :key="locale.locale">{{ locale.locale === 'en' ? '中' : 'EN' }}</span>
    </Transition>
  </button>
</template>

<style scoped>
.locale-toggle {
  font-size: var(--text-xs);
  font-weight: var(--weight-bold);
  letter-spacing: var(--tracking-wide);
}
</style>
