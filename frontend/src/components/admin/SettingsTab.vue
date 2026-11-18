<script setup>
import { reactive, ref } from 'vue';
import { api } from '../../api/client.js';
import { useAuthStore } from '../../stores/auth.js';
import { useCatalogStore } from '../../stores/catalog.js';
import { useLocaleStore } from '../../stores/locale.js';
import { useToastStore } from '../../stores/toast.js';
import { describeError } from '../../utils/errors.js';

const auth = useAuthStore();
const catalog = useCatalogStore();
const locale = useLocaleStore();
const toast = useToastStore();

const form = reactive({
  title: catalog.settings.title,
  subtitle: catalog.settings.subtitle,
});
const saving = ref(false);
const error = ref('');

async function submit() {
  saving.value = true;
  error.value = '';
  try {
    await api.put(
      '/admin/settings',
      { title: form.title, subtitle: form.subtitle },
      { csrfToken: auth.csrfToken },
    );
    await catalog.fetch();
    toast.push(locale.t('settings.saved'));
  } catch (err) {
    error.value = describeError(err, locale);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="settings-tab">
    <p v-if="error" class="alert alert-error" role="alert">{{ error }}</p>

    <form class="card card-pad stack" @submit.prevent="submit">
      <label class="field">
        {{ locale.t('settings.titleLabel') }}
        <input
          v-model="form.title"
          :placeholder="locale.t('settings.titlePlaceholder')"
          maxlength="100"
          required
        />
      </label>
      <label class="field">
        {{ locale.t('settings.subtitleLabel') }}
        <textarea
          v-model="form.subtitle"
          :placeholder="locale.t('settings.subtitlePlaceholder')"
          maxlength="300"
          rows="3"
        ></textarea>
      </label>
      <div class="form-actions">
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="saving"
          :aria-busy="saving"
        >
          <span v-if="saving" class="spinner" aria-hidden="true"></span>
          {{ locale.t('common.save') }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.form-actions {
  display: flex;
  justify-content: flex-end;
  border-top: var(--border-width) solid var(--border);
  padding-top: var(--space-4);
}
</style>
