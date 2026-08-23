<script setup>
import { onMounted, reactive, ref } from 'vue';
import { api } from '../../api/client.js';
import { useAuthStore } from '../../stores/auth.js';
import { useCatalogStore } from '../../stores/catalog.js';
import { useLocaleStore } from '../../stores/locale.js';
import { describeError } from '../../utils/errors.js';
import { formatBytes } from '../../utils/format.js';

const emit = defineEmits(['uploaded']);

const auth = useAuthStore();
const catalog = useCatalogStore();
const locale = useLocaleStore();

const form = reactive({
  mode: 'file',
  title: '',
  pathId: '',
  version: '',
  description: '',
  linkUrl: '',
  overwrite: 'false',
});
const fileInput = ref(null);
const submitting = ref(false);
const error = ref('');
const limits = ref(null);

onMounted(async () => {
  try {
    const data = await api.get('/admin/sites');
    limits.value = data.limits;
  } catch {
    // The limits hint is a nice-to-have — a failed fetch here shouldn't
    // block the upload form itself from being usable.
  }
});

function resetForm() {
  Object.assign(form, {
    title: '',
    pathId: '',
    version: '',
    description: '',
    linkUrl: '',
    overwrite: 'false',
  });
  if (fileInput.value) {
    fileInput.value.value = '';
  }
}

async function submit() {
  const isLink = form.mode === 'link';
  const file = fileInput.value?.files?.[0];
  if (!isLink && !file) {
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
    if (isLink) {
      body.append('type', 'link');
      body.append('linkUrl', form.linkUrl.trim());
    } else {
      body.append('siteFile', file);
    }

    await api.post('/admin/sites', body, { csrfToken: auth.csrfToken });
    await catalog.fetch();
    resetForm();
    emit('uploaded');
  } catch (err) {
    error.value = describeError(err, locale);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div>
    <p v-if="limits" class="panel-meta muted">
      {{
        locale.t('admin.limits', {
          upload: formatBytes(limits.maxUploadBytes),
          extracted: formatBytes(limits.maxExtractedBytes),
          files: limits.maxZipFiles,
        })
      }}
    </p>

    <div class="segmented" role="group">
      <button
        type="button"
        class="segmented-option"
        :class="{ 'is-active': form.mode === 'file' }"
        @click="form.mode = 'file'"
      >
        {{ locale.t('form.modeFile') }}
      </button>
      <button
        type="button"
        class="segmented-option"
        :class="{ 'is-active': form.mode === 'link' }"
        @click="form.mode = 'link'"
      >
        {{ locale.t('form.modeLink') }}
      </button>
    </div>

    <p v-if="error" class="alert alert-error" role="alert">{{ error }}</p>

    <form class="upload-grid" @submit.prevent="submit">
      <label>
        {{ locale.t('form.titleLabel') }}
        <input
          v-model="form.title"
          :placeholder="locale.t('form.titlePlaceholder')"
          maxlength="100"
          required
        />
      </label>
      <label>
        {{ locale.t('form.pathLabel') }}
        <input
          v-model="form.pathId"
          :placeholder="locale.t('form.pathPlaceholder')"
          pattern="[A-Za-z0-9_\-]{1,64}"
          maxlength="64"
          required
        />
      </label>
      <label v-if="form.mode === 'file'">
        {{ locale.t('form.fileLabel') }}
        <input ref="fileInput" type="file" accept=".html,.zip" required />
      </label>
      <label v-else>
        {{ locale.t('form.linkUrlLabel') }}
        <input
          v-model="form.linkUrl"
          type="url"
          :placeholder="locale.t('form.linkUrlPlaceholder')"
          maxlength="2000"
          required
        />
      </label>
      <label>
        {{ locale.t('form.versionLabel') }}
        <input
          v-model="form.version"
          :placeholder="locale.t('form.versionPlaceholder')"
          maxlength="40"
        />
      </label>
      <label class="field-wide">
        {{ locale.t('common.description') }}
        <textarea
          v-model="form.description"
          :placeholder="locale.t('form.descriptionPlaceholder')"
          maxlength="300"
          rows="3"
        ></textarea>
      </label>
      <fieldset class="fieldset-plain field-wide">
        <legend>{{ locale.t('form.overwriteLegend') }}</legend>
        <label class="radio-option">
          <input v-model="form.overwrite" type="radio" value="false" />
          {{ locale.t('form.overwriteCancel') }}
        </label>
        <label class="radio-option">
          <input v-model="form.overwrite" type="radio" value="true" />
          {{ locale.t('form.overwriteReplace') }}
        </label>
      </fieldset>
      <button type="submit" class="btn-solid" :disabled="submitting">
        {{ locale.t('form.submitUpload') }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.segmented {
  margin-bottom: 1.25rem;
}
</style>
