<script setup>
import { nextTick, reactive, ref, watch } from 'vue';
import { api } from '../../api/client.js';
import { useAuthStore } from '../../stores/auth.js';
import { useLocaleStore } from '../../stores/locale.js';
import { describeError } from '../../utils/errors.js';
import BaseModal from '../ui/BaseModal.vue';
import FileDrop from '../ui/FileDrop.vue';
import PasswordFields from './PasswordFields.vue';

const props = defineProps({
  site: { type: Object, default: null },
  categories: { type: Array, default: () => [] },
});
const emit = defineEmits(['close', 'saved']);

const auth = useAuthStore();
const locale = useLocaleStore();

const form = reactive({ title: '', version: '', description: '', linkUrl: '', passwordProtected: false, password: '', categoryId: '' });
const file = ref(null);
const submitting = ref(false);
const error = ref('');
const titleInput = ref(null);
// The modal keeps showing the last site while its close transition plays,
// after `site` itself has already gone back to null.
const shown = ref(null);

watch(
  () => props.site,
  async (site) => {
    if (!site) {
      return;
    }
    shown.value = site;
    form.title = site.title;
    form.version = site.version;
    form.description = site.description;
    form.linkUrl = site.linkUrl || '';
    form.passwordProtected = Boolean(site.passwordProtected);
    form.password = '';
    form.categoryId = site.categoryId;
    error.value = '';
    submitting.value = false;
    file.value = null;
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
    body.append('passwordProtected', String(form.passwordProtected));
    if (form.passwordProtected) body.append('password', form.password);
    body.append('categoryId', form.categoryId);
    if (props.site.type === 'link') {
      body.append('linkUrl', form.linkUrl);
    } else if (file.value) {
      body.append('siteFile', file.value);
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
</script>

<template>
  <BaseModal
    :open="Boolean(site)"
    size="md"
    :title="locale.t('edit.heading')"
    :description="shown ? `/${shown.pathId}/` : ''"
    :busy="submitting"
    @close="close"
  >
    <template v-if="shown">
      <p v-if="error" class="alert alert-error" role="alert">{{ error }}</p>

      <form class="stack" @submit.prevent="submit">
        <label class="field">
          {{ locale.t('form.titleLabel') }}
          <input ref="titleInput" v-model="form.title" maxlength="100" required />
        </label>
        <label class="field">
          {{ locale.t('form.versionLabel') }}
          <input
            v-model="form.version"
            :placeholder="locale.t('form.versionPlaceholder')"
            maxlength="40"
          />
        </label>
        <label class="field">
          {{ locale.t('common.description') }}
          <textarea
            v-model="form.description"
            :placeholder="locale.t('form.descriptionPlaceholder')"
            maxlength="300"
            rows="3"
          ></textarea>
        </label>
        <label v-if="categories.length >= 2" class="field">
          {{ locale.t('form.categoryLabel') }}
          <select v-model="form.categoryId">
            <option v-for="category in categories" :key="category.id" :value="category.id">
              {{ category.name }}
            </option>
          </select>
        </label>
        <label v-if="shown.type === 'link'" class="field">
          {{ locale.t('form.linkUrlLabel') }}
          <input
            v-model="form.linkUrl"
            type="url"
            :placeholder="locale.t('form.linkUrlPlaceholder')"
            maxlength="2000"
            required
          />
        </label>
        <div v-else class="replace-file">
          <FileDrop
            v-model="file"
            :label="locale.t('edit.replaceFileLabel')"
            :hint="locale.t('form.dropHint')"
            accept=".html,.zip"
          />
          <p class="field-hint">{{ locale.t('edit.replaceFileHint') }}</p>
        </div>
        <PasswordFields
          v-model:enabled="form.passwordProtected"
          v-model:password="form.password"
          :can-keep-password="shown.passwordProtected"
        />
        <button
          type="submit"
          class="btn btn-primary btn-lg btn-block"
          :disabled="submitting"
          :aria-busy="submitting"
        >
          <span v-if="submitting" class="spinner" aria-hidden="true"></span>
          {{ locale.t('edit.save') }}
        </button>
      </form>
    </template>
  </BaseModal>
</template>

<style scoped>
.replace-file {
  display: grid;
  gap: var(--space-2);
}

.replace-file .field-hint {
  margin: 0;
}
</style>
