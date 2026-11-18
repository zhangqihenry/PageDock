<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { api } from '../../api/client.js';
import { useAuthStore } from '../../stores/auth.js';
import { useCatalogStore } from '../../stores/catalog.js';
import { useLocaleStore } from '../../stores/locale.js';
import { useToastStore } from '../../stores/toast.js';
import { describeError } from '../../utils/errors.js';
import { formatBytes } from '../../utils/format.js';
import FileDrop from '../ui/FileDrop.vue';
import Segmented from '../ui/Segmented.vue';
import PasswordFields from './PasswordFields.vue';

const emit = defineEmits(['uploaded']);

const auth = useAuthStore();
const catalog = useCatalogStore();
const locale = useLocaleStore();
const toast = useToastStore();

const form = reactive({
  mode: 'file',
  title: '',
  pathId: '',
  version: '',
  description: '',
  linkUrl: '',
  overwrite: 'false',
  passwordProtected: false,
  password: '',
  categoryId: '',
});
const file = ref(null);
const submitting = ref(false);
const error = ref('');
const limits = ref(null);
const categories = ref([]);

const modeOptions = computed(() => [
  { value: 'file', label: locale.t('form.modeFile') },
  { value: 'link', label: locale.t('form.modeLink') },
]);

onMounted(async () => {
  try {
    const data = await api.get('/admin/sites');
    limits.value = data.limits;
    categories.value = data.categories;
    form.categoryId = defaultCategoryId();
  } catch {
    // The limits hint and category picker are nice-to-haves — a failed
    // fetch here shouldn't block the upload form itself from being usable;
    // the server files the page under the first category.
  }
});

// Blank tells the server "keep the replaced page's category", so it's
// only offered (and preselected) while overwriting is on.
function defaultCategoryId() {
  return form.overwrite === 'true' ? '' : categories.value[0]?.id ?? '';
}

watch(
  () => form.overwrite,
  () => {
    form.categoryId = defaultCategoryId();
  },
);

function resetForm() {
  Object.assign(form, {
    title: '',
    pathId: '',
    version: '',
    description: '',
    linkUrl: '',
    overwrite: 'false',
    passwordProtected: false,
    password: '',
  });
  form.categoryId = defaultCategoryId();
  file.value = null;
}

async function submit() {
  const isLink = form.mode === 'link';
  if (!isLink && !file.value) {
    error.value = locale.t('errorCode.NO_FILE');
    return;
  }
  if (isLink && !form.linkUrl.trim()) {
    error.value = locale.t('errorCode.LINK_URL_REQUIRED');
    return;
  }

  submitting.value = true;
  error.value = '';
  try {
    const body = new FormData();
    body.append('title', form.title);
    body.append('pathId', form.pathId);
    body.append('version', form.version);
    body.append('description', form.description);
    body.append('overwrite', form.overwrite);
    body.append('categoryId', form.categoryId);
    // Unchecked sends nothing, so replacing a protected page keeps its
    // password; removing protection is done from the edit dialog.
    if (form.passwordProtected) {
      body.append('passwordProtected', 'true');
      body.append('password', form.password);
    }
    if (isLink) {
      body.append('type', 'link');
      body.append('linkUrl', form.linkUrl.trim());
    } else {
      body.append('siteFile', file.value);
    }

    await api.post('/admin/sites', body, { csrfToken: auth.csrfToken });
    await catalog.fetch();
    resetForm();
    toast.push(locale.t('admin.uploaded'));
    emit('uploaded');
  } catch (err) {
    error.value = describeError(err, locale);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="upload-tab">
    <div class="upload-top">
      <Segmented
        v-model="form.mode"
        :options="modeOptions"
        :aria-label="locale.t('admin.tabUpload')"
      />
      <p v-if="limits" class="upload-limits">
        {{
          locale.t('admin.limits', {
            upload: formatBytes(limits.maxUploadBytes),
            extracted: formatBytes(limits.maxExtractedBytes),
            files: limits.maxZipFiles,
          })
        }}
      </p>
    </div>

    <p v-if="error" class="alert alert-error" role="alert">{{ error }}</p>

    <form class="card card-pad upload-form" @submit.prevent="submit">
      <Transition name="swap" mode="out-in">
        <FileDrop
          v-if="form.mode === 'file'"
          key="file"
          v-model="file"
          class="field-wide"
          :label="locale.t('form.fileLabel')"
          :hint="locale.t('form.dropHint')"
          accept=".html,.zip"
          required
        />
        <label v-else key="link" class="field field-wide">
          {{ locale.t('form.linkUrlLabel') }}
          <input
            v-model="form.linkUrl"
            type="url"
            :placeholder="locale.t('form.linkUrlPlaceholder')"
            maxlength="2000"
            required
          />
        </label>
      </Transition>
      <label class="field">
        {{ locale.t('form.titleLabel') }}
        <input
          v-model="form.title"
          :placeholder="locale.t('form.titlePlaceholder')"
          maxlength="100"
          required
        />
      </label>
      <label class="field">
        {{ locale.t('form.pathLabel') }}
        <input
          v-model="form.pathId"
          :placeholder="locale.t('form.pathPlaceholder')"
          pattern="[A-Za-z0-9_\-]{1,64}"
          maxlength="64"
          aria-describedby="path-hint"
        />
        <span id="path-hint" class="field-hint">{{ locale.t('form.pathHint') }}</span>
      </label>
      <label class="field">
        {{ locale.t('form.versionLabel') }}
        <input
          v-model="form.version"
          :placeholder="locale.t('form.versionPlaceholder')"
          maxlength="40"
        />
      </label>
      <label v-if="categories.length >= 2" class="field">
        {{ locale.t('form.categoryLabel') }}
        <select v-model="form.categoryId">
          <option v-if="form.overwrite === 'true'" value="">
            {{ locale.t('form.categoryKeep') }}
          </option>
          <option v-for="category in categories" :key="category.id" :value="category.id">
            {{ category.name }}
          </option>
        </select>
      </label>
      <label class="field field-wide">
        {{ locale.t('common.description') }}
        <textarea
          v-model="form.description"
          :placeholder="locale.t('form.descriptionPlaceholder')"
          maxlength="300"
          rows="3"
        ></textarea>
      </label>
      <PasswordFields v-model:enabled="form.passwordProtected" v-model:password="form.password" />
      <fieldset class="fieldset field-wide">
        <legend>{{ locale.t('form.overwriteLegend') }}</legend>
        <div class="choice-row">
          <label class="check">
            <input v-model="form.overwrite" type="radio" value="false" />
            {{ locale.t('form.overwriteCancel') }}
          </label>
          <label class="check">
            <input v-model="form.overwrite" type="radio" value="true" />
            {{ locale.t('form.overwriteReplace') }}
          </label>
        </div>
        <Transition name="fade">
          <span v-if="form.overwrite === 'true' && !form.passwordProtected" class="field-hint">
            {{ locale.t('form.overwriteKeepsProtection') }}
          </span>
        </Transition>
      </fieldset>
      <div class="form-actions field-wide">
        <button
          type="submit"
          class="btn btn-primary btn-lg"
          :disabled="submitting"
          :aria-busy="submitting"
        >
          <span v-if="submitting" class="spinner" aria-hidden="true"></span>
          {{ locale.t('form.submitUpload') }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.upload-top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.upload-limits {
  margin: 0;
  color: var(--ink-faint);
  font-size: var(--text-xs);
}

.upload-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
  gap: var(--space-5) var(--space-4);
}

.field-wide {
  grid-column: 1 / -1;
}

.choice-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-6);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  border-top: var(--border-width) solid var(--border);
  padding-top: var(--space-5);
}

@media (max-width: 640px) {
  .upload-form {
    grid-template-columns: minmax(0, 1fr);
  }

  .form-actions .btn {
    width: 100%;
  }
}
</style>
