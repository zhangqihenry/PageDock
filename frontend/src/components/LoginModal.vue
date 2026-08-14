<script setup>
import { nextTick, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import { useLocaleStore } from '../stores/locale.js';
import { describeError } from '../utils/errors.js';

const auth = useAuthStore();
const locale = useLocaleStore();
const router = useRouter();

const username = ref('');
const password = ref('');
const error = ref('');
const submitting = ref(false);
const usernameInput = ref(null);

watch(
  () => auth.loginModalOpen,
  async (open) => {
    if (!open) {
      return;
    }
    username.value = '';
    password.value = '';
    error.value = '';
    submitting.value = false;
    await nextTick();
    usernameInput.value?.focus();
  },
);

async function submit() {
  if (submitting.value) {
    return;
  }
  submitting.value = true;
  error.value = '';
  try {
    await auth.login(username.value, password.value);
    const redirectTo = auth.postLoginRedirect;
    auth.closeLoginModal();
    router.push(redirectTo);
  } catch (err) {
    error.value = describeError(err, locale);
  } finally {
    submitting.value = false;
  }
}

function close() {
  if (submitting.value) {
    return;
  }
  auth.closeLoginModal();
}

function onKeydown(event) {
  if (event.key === 'Escape') {
    close();
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="auth.loginModalOpen"
      class="modal-backdrop"
      @click.self="close"
      @keydown="onKeydown"
    >
      <div
        class="modal-card card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
      >
        <button
          type="button"
          class="icon-button modal-close"
          :aria-label="locale.t('common.cancel')"
          @click="close"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <h2 id="login-modal-title">{{ locale.t('login.title') }}</h2>
        <p class="muted">{{ locale.t('login.subtitle') }}</p>

        <p v-if="error" class="alert alert-error" role="alert">{{ error }}</p>

        <form class="stack" @submit.prevent="submit">
          <label>
            {{ locale.t('login.usernameLabel') }}
            <input
              ref="usernameInput"
              v-model="username"
              autocomplete="username"
              required
            />
          </label>
          <label>
            {{ locale.t('login.passwordLabel') }}
            <input
              v-model="password"
              type="password"
              autocomplete="current-password"
              required
            />
          </label>
          <button type="submit" class="btn-solid btn-block" :disabled="submitting">
            {{ locale.t('login.submit') }}
          </button>
        </form>
      </div>
    </div>
  </Teleport>
</template>
