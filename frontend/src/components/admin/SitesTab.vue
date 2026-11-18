<script setup>
import { computed, onMounted, ref } from 'vue';
import { api } from '../../api/client.js';
import { useAuthStore } from '../../stores/auth.js';
import { useCatalogStore } from '../../stores/catalog.js';
import { useLocaleStore } from '../../stores/locale.js';
import { useToastStore } from '../../stores/toast.js';
import { describeError } from '../../utils/errors.js';
import { formatBytes, formatUploadedAt } from '../../utils/format.js';
import Icon from '../ui/Icon.vue';
import SiteEditModal from './SiteEditModal.vue';

const auth = useAuthStore();
const catalog = useCatalogStore();
const locale = useLocaleStore();
const toast = useToastStore();

const sites = ref([]);
const categories = ref([]);
// Mirrors the homepage: category names only matter once there are two.
const categoryNames = computed(() =>
  categories.value.length >= 2
    ? new Map(categories.value.map((category) => [category.id, category.name]))
    : new Map(),
);
const loaded = ref(false);
const error = ref('');
const savingOrder = ref(false);
const editingSite = ref(null);

async function load() {
  error.value = '';
  const data = await api.get('/admin/sites');
  sites.value = data.sites;
  categories.value = data.categories;
  loaded.value = true;
}

onMounted(() => {
  load().catch((err) => {
    error.value = describeError(err, locale);
  });
});

function flash(key) {
  toast.push(locale.t(key));
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

// A plain link rather than a fetch: the endpoint answers with
// Content-Disposition: attachment, and the admin session cookie is scoped to
// /_pagedock, so the browser's own download handling does the whole job.
function exportHref(site) {
  return `/_pagedock/api/admin/sites/${site.pathId}/export`;
}

function openHref(site) {
  return site.type === 'link' && !site.passwordProtected ? site.linkUrl : `/${site.pathId}/`;
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
  <div class="sites-tab">
    <p v-if="loaded" class="panel-meta">
      {{ locale.t('catalog.tally', { count: sites.length }) }}
    </p>

    <p v-if="error" class="alert alert-error" role="alert">{{ error }}</p>

    <div v-if="!loaded" class="site-stack" aria-busy="true">
      <span class="sr-only" role="status">{{ locale.t('common.loading') }}</span>
      <div v-for="n in 3" :key="n" class="card site-card" aria-hidden="true">
        <span class="skeleton skeleton-title"></span>
        <span class="skeleton skeleton-line"></span>
      </div>
    </div>

    <div v-else-if="sites.length === 0" class="empty-state">
      <span class="empty-state-icon"><Icon name="inbox" /></span>
      <p>{{ locale.t('admin.emptyState') }}</p>
    </div>

    <template v-else>
      <TransitionGroup tag="div" name="list" class="site-stack">
        <article
          v-for="(site, index) in sites"
          :key="site.pathId"
          class="card site-card enter-rise"
          :class="{ 'is-disabled': !site.enabled }"
          :style="{ '--i': index }"
        >
          <div class="site-card-head">
            <h3 class="site-card-title">{{ site.title }}</h3>
            <div class="site-card-badges">
              <span
                class="badge badge-dot"
                :class="site.enabled ? 'badge-positive' : ''"
              >{{ locale.t(site.enabled ? 'table.enabledStatus' : 'table.disabledStatus') }}</span>
              <span v-if="categoryNames.has(site.categoryId)" class="badge">
                <Icon name="tag" />{{ categoryNames.get(site.categoryId) }}
              </span>
              <span v-if="site.passwordProtected" class="badge badge-accent">
                <Icon name="lock" />{{ locale.t('catalog.protected') }}
              </span>
              <span v-if="site.type === 'link'" class="badge badge-info">
                <Icon name="link" />{{ locale.t('table.linkBadge') }}
              </span>
            </div>
          </div>

          <p class="site-card-path mono">/{{ site.pathId }}/</p>

          <p class="site-card-desc">
            {{ site.description || locale.t('common.noDescription') }}
          </p>

          <div class="site-card-meta">
            <span>{{
              site.version
                ? locale.t('common.versionTag', { version: site.version })
                : locale.t('common.noVersion')
            }}</span>
            <span class="tabular">{{ formatUploadedAt(site.uploadedAt) }}</span>
            <span v-if="site.type === 'link'" class="mono meta-url">{{ site.linkUrl }}</span>
            <span v-else class="tabular">{{ formatBytes(site.sizeBytes) }}</span>
          </div>

          <div class="site-card-foot">
            <label class="order-field">
              {{ locale.t('table.sortOrder') }}
              <input
                v-model.number="site.sortOrder"
                class="input order-input"
                type="number"
                min="0"
                step="1"
                inputmode="numeric"
              />
            </label>
            <div class="site-card-actions">
              <a
                v-if="site.enabled"
                class="btn btn-sm"
                :href="openHref(site)"
                target="_blank"
                rel="noopener noreferrer"
              ><Icon name="arrow-up-right" />{{ locale.t('table.open') }}</a>
              <span v-else class="btn btn-sm" aria-disabled="true">
                <Icon name="arrow-up-right" />{{ locale.t('table.open') }}
              </span>
              <button type="button" class="btn btn-sm" @click="openEdit(site)">
                <Icon name="pencil" />{{ locale.t('table.edit') }}
              </button>
              <a
                v-if="site.type !== 'link'"
                class="btn btn-sm"
                :href="exportHref(site)"
              ><Icon name="download" />{{
                locale.t(site.sourceKind === 'zip' ? 'table.exportZip' : 'table.exportHtml')
              }}</a>
              <button type="button" class="btn btn-sm" @click="toggleVisibility(site)">
                <Icon :name="site.enabled ? 'eye-off' : 'eye'" />
                {{ locale.t(site.enabled ? 'table.disable' : 'table.enable') }}
              </button>
              <button type="button" class="btn btn-sm btn-danger" @click="remove(site)">
                <Icon name="trash" />{{ locale.t('table.delete') }}
              </button>
            </div>
          </div>
        </article>
      </TransitionGroup>

      <div class="sort-bar">
        <button
          type="button"
          class="btn btn-primary"
          :disabled="savingOrder"
          :aria-busy="savingOrder"
          @click="saveSortOrder"
        >
          <span v-if="savingOrder" class="spinner" aria-hidden="true"></span>
          {{ locale.t('table.saveOrder') }}
        </button>
      </div>
    </template>

    <SiteEditModal
      :site="editingSite"
      :categories="categories"
      @close="editingSite = null"
      @saved="handleSaved"
    />
  </div>
</template>

<style scoped>
.panel-meta {
  margin: 0 0 var(--space-4);
  color: var(--ink-muted);
  font-size: var(--text-sm);
}

.site-stack {
  display: grid;
  gap: var(--space-3);
}

.site-card {
  display: grid;
  gap: var(--space-2);
  padding: var(--space-5);
  transition: opacity var(--dur-base) var(--ease-standard),
    border-color var(--dur-fast) var(--ease-standard),
    box-shadow var(--dur-base) var(--ease-standard);
}

.site-card:hover {
  border-color: var(--border-strong);
  box-shadow: var(--shadow-md);
}

.site-card.is-disabled {
  background: color-mix(in srgb, var(--surface) 60%, var(--surface-muted));
}

.site-card.is-disabled .site-card-title,
.site-card.is-disabled .site-card-desc {
  color: var(--ink-faint);
}

.site-card-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2) var(--space-3);
}

.site-card-title {
  margin: 0;
  font-size: var(--text-md);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-normal);
  overflow-wrap: anywhere;
}

.site-card-badges {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.site-card-path {
  margin: 0;
  color: var(--ink-faint);
  font-size: var(--text-xs);
}

.site-card-desc {
  margin: 0;
  color: var(--ink-muted);
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
  overflow-wrap: anywhere;
  white-space: pre-line;
}

.site-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1) var(--space-4);
  color: var(--ink-faint);
  font-size: var(--text-xs);
}

.meta-url {
  max-width: min(100%, var(--content-narrow));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.site-card-foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-top: var(--space-2);
  border-top: var(--border-width) solid var(--border);
  padding-top: var(--space-4);
}

.order-field {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--ink-muted);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
}

.order-input {
  width: var(--space-20);
  min-height: var(--control-sm);
  border-radius: var(--radius-sm);
  padding-block: 0;
  text-align: center;
}

.site-card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1-5);
}

/* Sticks to the bottom of the viewport while the list scrolls, so saving a
   new order never needs a trip to the end of the page. */
.sort-bar {
  position: sticky;
  bottom: var(--space-4);
  z-index: var(--z-raised);
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-4);
  pointer-events: none;
}

.sort-bar .btn {
  box-shadow: var(--shadow-md);
  pointer-events: auto;
}

@media (max-width: 640px) {
  .site-card {
    padding: var(--space-4);
  }

  .site-card-foot {
    flex-direction: column;
    align-items: stretch;
  }

  .site-card-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .site-card-actions .btn-danger {
    grid-column: 1 / -1;
  }

  .sort-bar .btn {
    width: 100%;
  }
}
</style>
