<script setup>
import { useLocaleStore } from '../stores/locale.js';

const locale = useLocaleStore();
</script>

<template>
  <main>
    <h1>{{ locale.t('notFound.title') }}</h1>
    <p>{{ locale.t('notFound.message') }}</p>
    <RouterLink to="/">{{ locale.t('notFound.backLink') }}</RouterLink>
  </main>
</template>
