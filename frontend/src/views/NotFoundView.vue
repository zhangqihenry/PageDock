<script setup>
import Icon from '../components/ui/Icon.vue';
import { useLocaleStore } from '../stores/locale.js';

const locale = useLocaleStore();
</script>

<template>
  <main class="container page not-found">
    <section class="not-found-body">
      <span class="not-found-icon enter-rise" aria-hidden="true"><Icon name="compass" /></span>
      <p class="not-found-code tabular enter-rise" style="--i: 1">404</p>
      <h1 class="not-found-title enter-rise" style="--i: 2">{{ locale.t('notFound.title') }}</h1>
      <p class="not-found-message enter-rise" style="--i: 3">{{ locale.t('notFound.message') }}</p>
      <RouterLink class="btn btn-primary btn-lg enter-rise" style="--i: 4" to="/">
        <Icon name="arrow-left" />{{ locale.t('notFound.backLink') }}
      </RouterLink>
    </section>
  </main>
</template>

<style scoped>
.not-found-body {
  display: grid;
  justify-items: center;
  gap: var(--space-2);
  max-width: var(--content-narrow);
  margin: clamp(var(--space-4), 8vw, var(--space-16)) auto 0;
  text-align: center;
}

.not-found-icon {
  display: grid;
  place-items: center;
  width: var(--space-12);
  height: var(--space-12);
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--accent);
}

.not-found-icon svg {
  width: var(--icon-lg);
  height: var(--icon-lg);
}

.not-found-code {
  margin: var(--space-2) 0 0;
  background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 35%, var(--ink-faint)));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-size: calc(var(--text-display) * 2);
  font-weight: var(--weight-bold);
  letter-spacing: var(--tracking-tight);
  line-height: 1;
}

.not-found-title {
  margin: 0;
  font-size: var(--text-2xl);
  font-weight: var(--weight-bold);
}

.not-found-message {
  margin: 0 0 var(--space-4);
  color: var(--ink-muted);
}
</style>
