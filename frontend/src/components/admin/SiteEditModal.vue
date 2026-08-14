<script setup>
import { nextTick, reactive, ref, watch } from 'vue';
import { api } from '../../api/client.js';
import { useAuthStore } from '../../stores/auth.js';
import { useLocaleStore } from '../../stores/locale.js';
import { describeError } from '../../utils/errors.js';

const props = defineProps({
  site: { type: Object, default: null },
});
const emit = defineEmits(['close', 'saved']);

const auth = useAuthStore();
const locale = useLocaleStore();

const form = reactive({ title: '', version: '', description: '' });
const fileInput = ref(null);
const submitting = ref(false);
const error = ref('');
const titleInput = ref(null);

watch(
  () => props.site,
  async (site) => {
    if (!site) {
      return;
    }
    form.title = site.title;
    form.version = site.version;
    form.description = site.description;
    error.value = '';
    submitting.value = false;
    if (fileInput.value) {
      fileInput.value.value = '';
    }
    await nextTick();
    titleInput.value?.focus();
  },
  { immediate: true },
);

async function submit() {
  if (submitting.value || !props.site) {
    return;
  }
  submitting.value = true;
  error.value = '';
  try {
    const body = new FormData();
    body.append('title', form.title);
    body.append('version', form.version);
    body.append('description', form.description);
    const file = fileInput.value?.files?.[0];
    if (file) {
      body.append('siteFile', file);
    }

    await api.patch(`/admin/sites/${props.site.pathId}`, body, {
      csrfToken: auth.csrfToken,
    });
    emit('saved');
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
  emit('close');
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
      v-if="site"
      class="modal-backdrop"
      @click.self="close"
      @keydown="onKeydown"
    >
      <div
        class="modal-card card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-modal-title"
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

        <h2 id="edit-modal-title">{{ locale.t('edit.heading') }}</h2>
        <p class="muted mono">/{{ site.pathId }}/</p>

        <p v-if="error" class="alert alert-error" role="alert">{{ error }}</p>

        <form class="stack" @submit.prevent="submit">
          <label>
            {{ locale.t('form.titleLabel') }}
            <input ref="titleInput" v-model="form.title" maxlength="100" required />
          </label>
          <label>
            {{ locale.t('form.versionLabel') }}
            <input
              v-model="form.version"
              :placeholder="locale.t('form.versionPlaceholder')"
              maxlength="40"
            />
          </label>
          <label>
            {{ locale.t('common.description') }}
            <textarea
              v-model="form.description"
              :placeholder="locale.t('form.descriptionPlaceholder')"
              maxlength="300"
              rows="3"
            ></textarea>
          </label>
          <label>
            {{ locale.t('edit.replaceFileLabel') }}
            <input ref="fileInput" type="file" accept=".html,.zip" />
          </label>
          <p class="muted edit-hint">{{ locale.t('edit.replaceFileHint') }}</p>
          <button type="submit" class="btn-solid btn-block" :disabled="submitting">
            {{ locale.t('edit.save') }}
          </button>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.edit-hint {
  margin-top: -0.5rem;
  font-size: 0.82rem;
  line-height: 1.5;
}
</style>
