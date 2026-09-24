<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '../api/client.js';
import { useAuthStore } from '../stores/auth.js';
import { useLocaleStore } from '../stores/locale.js';
import { describeError } from '../utils/errors.js';

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
  <main class="wrap unlock-wrap">
    <section class="card unlock-card" aria-labelledby="unlock-title">
      <p class="unlock-label muted">{{ locale.t('catalog.protected') }}</p>
      <h1 id="unlock-title">{{ locale.t('unlock.heading') }}</h1>
      <p v-if="title" class="unlock-site">{{ title }}</p>
      <p class="unlock-copy muted">{{ locale.t('unlock.hint') }}</p>
      <p v-if="error" class="alert alert-error" role="alert">{{ error }}</p>
      <form v-if="ready" class="stack" @submit.prevent="unlock">
        <label>
          {{ locale.t('form.sitePassword') }}
          <input ref="passwordInput" v-model="password" type="password" autocomplete="current-password" required />
        </label>
        <button class="btn-solid" type="submit" :disabled="submitting">
          {{ locale.t(submitting ? 'unlock.submitting' : 'unlock.submit') }}
        </button>
      </form>
      <p v-else-if="!error" class="muted">{{ locale.t('common.loading') }}</p>
    </section>
  </main>
</template>

<style scoped>
.unlock-wrap { max-width: 30rem; }
.unlock-card { padding: clamp(1.25rem, 5vw, 2.25rem); overflow-wrap: anywhere; }
.unlock-label { font-size: var(--type-helper); line-height: 1.5; font-weight: 600; }
h1 { font-size: var(--type-page-title); font-weight: 700; line-height: 1.25; }
.unlock-site { font-size: var(--type-section-title); font-weight: 600; line-height: 1.4; }
.unlock-copy { font-size: var(--type-body); line-height: 1.6; }
label, input, button { font-size: var(--type-control); line-height: 1.5; }
</style>
