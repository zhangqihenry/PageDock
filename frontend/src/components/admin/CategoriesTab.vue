<script setup>
import { onMounted, ref } from 'vue';
import { api } from '../../api/client.js';
import { useAuthStore } from '../../stores/auth.js';
import { useCatalogStore } from '../../stores/catalog.js';
import { useLocaleStore } from '../../stores/locale.js';
import { describeError } from '../../utils/errors.js';

const auth = useAuthStore();
const catalog = useCatalogStore();
const locale = useLocaleStore();

// Each row keeps the saved name next to the one being typed, so a row's
// save button only lights up once its name actually changed.
const categories = ref([]);
const pageCounts = ref(new Map());
const loaded = ref(false);
const busy = ref(false);
const error = ref('');
const message = ref('');
const newName = ref('');
let messageTimer = null;

async function load() {
  error.value = '';
  // The sites listing carries the categories too, plus every page's
  // (already resolved) category for the per-row counts.
  const data = await api.get('/admin/sites');
  categories.value = data.categories.map((category) => ({
    ...category,
    draft: category.name,
  }));
  const counts = new Map();
  for (const site of data.sites) {
    counts.set(site.categoryId, (counts.get(site.categoryId) || 0) + 1);
  }
  pageCounts.value = counts;
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

// Every change refreshes this list and the homepage's copy, whose tabs
// come from the same categories.
async function run(action, successKey) {
  if (busy.value) return;
  busy.value = true;
  error.value = '';
  try {
    await action();
    await Promise.all([load(), catalog.fetch()]);
    flash(successKey);
    return true;
  } catch (err) {
    error.value = describeError(err, locale);
    return false;
  } finally {
    busy.value = false;
  }
}

async function add() {
  const added = await run(
    () => api.post('/admin/categories', { name: newName.value }, { csrfToken: auth.csrfToken }),
    'categories.added',
  );
  if (added) newName.value = '';
}

function rename(category) {
  return run(
    () => api.patch(
      `/admin/categories/${category.id}`,
      { name: category.draft },
      { csrfToken: auth.csrfToken },
    ),
    'categories.renamed',
  );
}

function move(index, offset) {
  const ids = categories.value.map((category) => category.id);
  [ids[index], ids[index + offset]] = [ids[index + offset], ids[index]];
  return run(
    () => api.put('/admin/categories/order', { ids }, { csrfToken: auth.csrfToken }),
    'categories.reordered',
  );
}

function remove(category) {
  return run(
    () => api.delete(`/admin/categories/${category.id}`, { csrfToken: auth.csrfToken }),
    'categories.deleted',
  );
}
</script>

<template>
  <div>
    <p class="panel-meta muted">{{ locale.t('categories.hint') }}</p>

    <p v-if="error" class="alert alert-error" role="alert">{{ error }}</p>
    <p v-else-if="message" class="alert alert-success" role="status">{{ message }}</p>

    <p v-if="!loaded" class="muted">{{ locale.t('common.loading') }}</p>

    <template v-else>
      <ol class="category-list">
        <li v-for="(category, index) in categories" :key="category.id" class="category-row">
          <form class="category-rename" @submit.prevent="rename(category)">
            <input
              v-model="category.draft"
              :aria-label="locale.t('categories.nameLabel')"
              maxlength="30"
              required
            />
            <button
              type="submit"
              class="btn"
              :disabled="busy || category.draft.trim() === category.name"
            >{{ locale.t('common.save') }}</button>
          </form>
          <span class="category-count muted">{{
            locale.t('categories.pageCount', { count: pageCounts.get(category.id) || 0 })
          }}</span>
          <div class="category-actions">
            <button
              type="button"
              class="btn"
              :disabled="busy || index === 0"
              :aria-label="locale.t('categories.moveUp')"
              :title="locale.t('categories.moveUp')"
              @click="move(index, -1)"
            >↑</button>
            <button
              type="button"
              class="btn"
              :disabled="busy || index === categories.length - 1"
              :aria-label="locale.t('categories.moveDown')"
              :title="locale.t('categories.moveDown')"
              @click="move(index, 1)"
            >↓</button>
            <button
              type="button"
              class="btn btn-danger"
              :disabled="busy || categories.length === 1"
              @click="remove(category)"
            >{{ locale.t('table.delete') }}</button>
          </div>
        </li>
      </ol>

      <form class="category-add" @submit.prevent="add">
        <label>
          {{ locale.t('categories.newLabel') }}
          <input
            v-model="newName"
            :placeholder="locale.t('categories.newPlaceholder')"
            maxlength="30"
            required
          />
        </label>
        <button type="submit" class="btn-solid" :disabled="busy">
          {{ locale.t('categories.add') }}
        </button>
      </form>
    </template>
  </div>
</template>

<style scoped>
.category-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.category-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem 1rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  padding: 0.75rem 1rem;
}

.category-rename {
  display: flex;
  flex: 1 1 16rem;
  align-items: center;
  gap: 0.6rem;
}

.category-rename input {
  margin-top: 0;
}

.category-row button {
  flex-shrink: 0;
  white-space: nowrap;
}

.category-count {
  font-family: var(--font-sans);
  font-size: 0.8rem;
  font-variant-numeric: tabular-nums;
}

.category-actions {
  display: flex;
  gap: 0.4rem;
  margin-left: auto;
}

.category-add {
  display: flex;
  align-items: flex-end;
  gap: 0.6rem;
  margin-top: 1.4rem;
}

.category-add label {
  flex: 1;
}

.category-add input {
  margin-top: 0.4rem;
}

.category-add .btn-solid {
  font-size: var(--type-control);
  line-height: 1.5;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
