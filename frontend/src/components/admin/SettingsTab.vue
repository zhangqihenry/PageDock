<script setup>
import { reactive, ref } from 'vue';
import { api } from '../../api/client.js';
import { useAuthStore } from '../../stores/auth.js';
import { useCatalogStore } from '../../stores/catalog.js';
import { useLocaleStore } from '../../stores/locale.js';
import { describeError } from '../../utils/errors.js';

const auth = useAuthStore();
const catalog = useCatalogStore();
const locale = useLocaleStore();

const form = reactive({
  title: catalog.settings.title,
  subtitle: catalog.settings.subtitle,
});
const saving = ref(false);
const error = ref('');
const saved = ref(false);

async function submit() {
  saving.value = true;
  error.value = '';
  saved.value = false;
  try {
    await api.put(
      '/admin/settings',
      { title: form.title, subtitle: form.subtitle },
      { csrfToken: auth.csrfToken },
    );
    await catalog.fetch();
    saved.value = true;
  } catch (err) {
    error.value = describeError(err, locale);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div>
    <p v-if="error" class="alert alert-error" role="alert">{{ error }}</p>
    <p v-else-if="saved" class="alert alert-success" role="status">
      {{ locale.t('settings.saved') }}
    </p>

    <form class="stack" @submit.prevent="submit">
      <label>
        {{ locale.t('settings.titleLabel') }}
        <input
          v-model="form.title"
          :placeholder="locale.t('settings.titlePlaceholder')"
          maxlength="100"
          required
        />
      </label>
      <label>
        {{ locale.t('settings.subtitleLabel') }}
        <textarea
          v-model="form.subtitle"
          :placeholder="locale.t('settings.subtitlePlaceholder')"
          maxlength="300"
          rows="3"
        ></textarea>
      </label>
      <button type="submit" class="btn-solid" :disabled="saving">
        {{ locale.t('common.save') }}
      </button>
    </form>
  </div>
</template>
