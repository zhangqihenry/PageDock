<script setup>
import { onMounted, ref } from 'vue';
import { api } from '../../api/client.js';
import { useAuthStore } from '../../stores/auth.js';
import { useCatalogStore } from '../../stores/catalog.js';
import { useLocaleStore } from '../../stores/locale.js';
import { describeError } from '../../utils/errors.js';
import { formatBytes, formatUploadedAt } from '../../utils/format.js';
import SiteEditModal from './SiteEditModal.vue';

const auth = useAuthStore();
const catalog = useCatalogStore();
const locale = useLocaleStore();

const sites = ref([]);
const loaded = ref(false);
const error = ref('');
const message = ref('');
const savingOrder = ref(false);
const editingSite = ref(null);
let messageTimer = null;

async function load() {
  error.value = '';
  const data = await api.get('/admin/sites');
  sites.value = data.sites;
  loaded.value = true;
}

onMounted(() => {
  load().catch((err) => {
    error.value = describeError(err, locale);
  });
});

function flash(key) {
  message.value = locale.t(key);
  window.clearTimeout(messageTimer);
  messageTimer = window.setTimeout(() => {
    message.value = '';
  }, 4000);
}

async function saveSortOrder() {
  savingOrder.value = true;
  error.value = '';
  try {
    await api.post(
      '/admin/sites/sort-order',
      {
        entries: sites.value.map((site) => ({
          pathId: site.pathId,
          sortOrder: site.sortOrder,
        })),
      },
      { csrfToken: auth.csrfToken },
    );
    await Promise.all([load(), catalog.fetch()]);
    flash('admin.sortOrderSaved');
  } catch (err) {
    error.value = describeError(err, locale);
  } finally {
    savingOrder.value = false;
  }
}

async function toggleVisibility(site) {
  error.value = '';
  try {
    const updated = await api.post(
      `/admin/sites/${site.pathId}/visibility`,
      { enabled: !site.enabled },
      { csrfToken: auth.csrfToken },
    );
    site.enabled = updated.enabled;
    await catalog.fetch();
    flash(updated.enabled ? 'admin.enabled' : 'admin.disabled');
  } catch (err) {
    error.value = describeError(err, locale);
  }
}

async function remove(site) {
  error.value = '';
  try {
    await api.delete(`/admin/sites/${site.pathId}`, { csrfToken: auth.csrfToken });
    sites.value = sites.value.filter((entry) => entry.pathId !== site.pathId);
    await catalog.fetch();
    flash('admin.deleted');
  } catch (err) {
    error.value = describeError(err, locale);
  }
}

function openEdit(site) {
  editingSite.value = site;
}

async function handleSaved() {
  editingSite.value = null;
  await Promise.all([load(), catalog.fetch()]);
  flash('admin.updated');
}
</script>

<template>
  <div>
    <div class="panel-heading">
      <h2>{{ locale.t('admin.tabSites') }}</h2>
      <p v-if="loaded" class="muted">
        {{ locale.t('catalog.tally', { count: sites.length }) }}
      </p>
    </div>

    <p v-if="error" class="alert alert-error" role="alert">{{ error }}</p>
    <p v-else-if="message" class="alert alert-success" role="status">{{ message }}</p>

    <p v-if="!loaded" class="muted">{{ locale.t('common.loading') }}</p>

    <div v-else-if="sites.length === 0" class="empty">
      <p>{{ locale.t('admin.emptyState') }}</p>
    </div>

    <template v-else>
      <div class="site-list">
        <article
          v-for="site in sites"
          :key="site.pathId"
          class="site-card"
          :class="{ 'is-disabled': !site.enabled }"
        >
          <div class="site-card-head">
            <span class="site-card-title">{{ site.title }}</span>
            <span class="site-card-path mono">/{{ site.pathId }}/</span>
            <span
              class="site-status-badge"
              :class="{ 'is-disabled': !site.enabled }"
            >{{ locale.t(site.enabled ? 'table.enabledStatus' : 'table.disabledStatus') }}</span>
          </div>

          <p class="site-card-desc">
            {{ site.description || locale.t('common.noDescription') }}
          </p>

          <div class="site-card-meta">
            <span>{{
              site.version
                ? locale.t('common.versionTag', { version: site.version })
                : locale.t('common.noVersion')
            }}</span>
            <span>{{ formatUploadedAt(site.uploadedAt) }}</span>
            <span>{{ formatBytes(site.sizeBytes) }}</span>
          </div>

          <div class="site-card-foot">
            <label class="site-order-field">
              {{ locale.t('table.sortOrder') }}
              <input
                v-model.number="site.sortOrder"
                type="number"
                min="0"
                step="1"
                inputmode="numeric"
              />
            </label>
            <div class="site-card-actions">
              <a
                v-if="site.enabled"
                class="btn"
                :href="`/${site.pathId}/`"
                target="_blank"
                rel="noopener"
              >{{ locale.t('table.open') }}</a>
              <span v-else class="btn btn-disabled" aria-disabled="true">{{
                locale.t('table.open')
              }}</span>
              <button type="button" class="btn" @click="openEdit(site)">
                {{ locale.t('table.edit') }}
              </button>
              <button type="button" class="btn" @click="toggleVisibility(site)">
                {{ locale.t(site.enabled ? 'table.disable' : 'table.enable') }}
              </button>
              <button type="button" class="btn btn-danger" @click="remove(site)">
                {{ locale.t('table.delete') }}
              </button>
            </div>
          </div>
        </article>
      </div>

      <div class="sort-order-save">
        <button type="button" class="btn" :disabled="savingOrder" @click="saveSortOrder">
          {{ locale.t('table.saveOrder') }}
        </button>
      </div>
    </template>

    <SiteEditModal :site="editingSite" @close="editingSite = null" @saved="handleSaved" />
  </div>
</template>

<style scoped>
.sort-order-save {
  display: flex;
  justify-content: flex-end;
  margin-top: 1.1rem;
}
</style>
