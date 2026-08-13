<script setup>
import { useLocaleStore } from '../stores/locale.js';

const locale = useLocaleStore();
</script>

<template>
  <main class="wrap">
    <section class="card not-found-card">
      <p class="not-found-code">404</p>
      <h1>{{ locale.t('notFound.title') }}</h1>
      <p class="muted">{{ locale.t('notFound.message') }}</p>
      <RouterLink class="btn btn-solid" to="/">{{
        locale.t('notFound.backLink')
      }}</RouterLink>
    </section>
  </main>
</template>

<style scoped>
.not-found-card {
  max-width: 26rem;
  margin: clamp(2rem, 8vw, 5rem) auto 0;
  padding: 2.5rem;
  text-align: center;
}

.not-found-code {
  margin-bottom: 0.4rem;
  color: var(--accent);
  font-family: var(--font-voice);
  font-size: 3.2rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums lining-nums;
}

.not-found-card h1 {
  margin-bottom: 0.5rem;
}

.not-found-card .btn {
  margin-top: 1.5rem;
}
</style>
