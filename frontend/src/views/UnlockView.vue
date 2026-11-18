<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '../api/client.js';
import { useAuthStore } from '../stores/auth.js';
import { useLocaleStore } from '../stores/locale.js';
import { describeError } from '../utils/errors.js';
import Icon from '../components/ui/Icon.vue';

const route = useRoute();
const auth = useAuthStore();
const locale = useLocaleStore();
const pathId = computed(() => String(route.params.pathId));
const title = ref('');
const password = ref('');
const passwordInput = ref(null);
const error = ref('');
const ready = ref(false);
const submitting = ref(false);

watch(pathId, async (id) => {
  ready.value = false;
  error.value = '';
  password.value = '';
  try {
    const data = await api.get(`/site-access/${encodeURIComponent(id)}`);
    title.value = data.title;
    if (!data.passwordProtected) {
      window.location.replace(`/${encodeURIComponent(id)}/`);
      return;
    }
    ready.value = true;
    await nextTick();
    passwordInput.value?.focus();
  } catch (err) {
    error.value = describeError(err, locale);
  }
}, { immediate: true });

async function unlock() {
  if (submitting.value) return;
  submitting.value = true;
  error.value = '';
  try {
    await auth.fetchSession();
    const data = await api.post(`/site-access/${encodeURIComponent(pathId.value)}`, {
      password: password.value,
      returnTo: (typeof route.query.returnTo === 'string' ? route.query.returnTo : `/${pathId.value}/`) + window.location.hash,
    }, { csrfToken: auth.csrfToken });
    password.value = '';
    window.location.replace(data.returnTo);
  } catch (err) {
    error.value = describeError(err, locale);
    submitting.value = false;
    passwordInput.value?.focus();
  }
}
</script>

<template>
  <main class="container page-narrow page unlock">
    <section class="card card-pad unlock-card enter-rise" aria-labelledby="unlock-title">
      <span class="unlock-icon" aria-hidden="true"><Icon name="lock" /></span>
      <p class="eyebrow">{{ locale.t('catalog.protected') }}</p>
      <h1 id="unlock-title" class="unlock-title">{{ locale.t('unlock.heading') }}</h1>
      <p v-if="title" class="unlock-site">{{ title }}</p>
      <p class="unlock-copy">{{ locale.t('unlock.hint') }}</p>
      <p v-if="error" class="alert alert-error" role="alert">{{ error }}</p>
        <!-- No transition here: the field must exist right away so it can
             take focus as soon as the page is ready. -->
        <form v-if="ready" class="stack unlock-form" @submit.prevent="unlock">
          <label class="field">
            {{ locale.t('form.sitePassword') }}
            <input ref="passwordInput" v-model="password" type="password" autocomplete="current-password" required />
          </label>
          <button class="btn btn-primary btn-lg btn-block" type="submit" :disabled="submitting" :aria-busy="submitting">
            <span v-if="submitting" class="spinner" aria-hidden="true"></span>
            {{ locale.t(submitting ? 'unlock.submitting' : 'unlock.submit') }}
          </button>
        </form>
        <div v-else-if="!error" class="unlock-loading" aria-busy="true">
          <span class="sr-only" role="status">{{ locale.t('common.loading') }}</span>
          <span class="skeleton skeleton-input" aria-hidden="true"></span>
          <span class="skeleton skeleton-input" aria-hidden="true"></span>
        </div>
    </section>
  </main>
</template>

<style scoped>
.unlock-card {
  display: grid;
  gap: var(--space-2);
  margin-top: clamp(var(--space-4), 6vw, var(--space-12));
  overflow-wrap: anywhere;
}

.unlock-icon {
  display: grid;
  place-items: center;
  width: var(--space-12);
  height: var(--space-12);
  margin-bottom: var(--space-2);
  border-radius: var(--radius-lg);
  background: var(--accent-soft);
  color: var(--accent);
}

.unlock-icon svg {
  width: var(--icon-lg);
  height: var(--icon-lg);
}

.unlock-title {
  margin: 0;
  font-size: var(--text-2xl);
  font-weight: var(--weight-bold);
}

.unlock-site {
  margin: 0;
  color: var(--ink);
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-snug);
}

.unlock-copy {
  margin: 0 0 var(--space-3);
  color: var(--ink-muted);
}

.unlock-form,
.unlock-loading {
  margin-top: var(--space-1);
}

.unlock-loading {
  display: grid;
  gap: var(--space-3);
}

.skeleton-input {
  height: var(--control-lg);
  border-radius: var(--radius-md);
}
</style>
