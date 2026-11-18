<script setup>
import { nextTick, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import { useLocaleStore } from '../stores/locale.js';
import { describeError } from '../utils/errors.js';
import BaseModal from './ui/BaseModal.vue';

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
</script>

<template>
  <BaseModal
    :open="auth.loginModalOpen"
    :title="locale.t('login.title')"
    :description="locale.t('login.subtitle')"
    :busy="submitting"
    @close="close"
  >
    <p v-if="error" class="alert alert-error" role="alert">{{ error }}</p>

    <form class="stack" @submit.prevent="submit">
      <label class="field">
        {{ locale.t('login.usernameLabel') }}
        <input
          ref="usernameInput"
          v-model="username"
          autocomplete="username"
          required
        />
      </label>
      <label class="field">
        {{ locale.t('login.passwordLabel') }}
        <input
          v-model="password"
          type="password"
          autocomplete="current-password"
          required
        />
      </label>
      <button
        type="submit"
        class="btn btn-primary btn-lg btn-block login-submit"
        :disabled="submitting"
        :aria-busy="submitting"
      >
        <span v-if="submitting" class="spinner" aria-hidden="true"></span>
        {{ locale.t('login.submit') }}
      </button>
    </form>
  </BaseModal>
</template>

<style scoped>
.login-submit {
  margin-top: var(--space-2);
}
</style>
