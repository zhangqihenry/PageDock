<script setup>
import { onMounted, ref } from 'vue';
import { api } from '../../api/client.js';
import { useAuthStore } from '../../stores/auth.js';
import { useCatalogStore } from '../../stores/catalog.js';
import { useLocaleStore } from '../../stores/locale.js';
import { useToastStore } from '../../stores/toast.js';
import { describeError } from '../../utils/errors.js';
import Icon from '../ui/Icon.vue';

const auth = useAuthStore();
const catalog = useCatalogStore();
const locale = useLocaleStore();
const toast = useToastStore();

// Each row keeps the saved name next to the one being typed, so a row's
// save button only appears once its name actually changed.
const categories = ref([]);
const pageCounts = ref(new Map());
const loaded = ref(false);
const busy = ref(false);
const error = ref('');
const newName = ref('');

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
  toast.push(locale.t(key));
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
  <div class="categories-tab">
    <p class="panel-meta">{{ locale.t('categories.hint') }}</p>

    <p v-if="error" class="alert alert-error" role="alert">{{ error }}</p>

    <div v-if="!loaded" class="card cat-list" aria-busy="true">
      <span class="sr-only" role="status">{{ locale.t('common.loading') }}</span>
      <div v-for="n in 3" :key="n" class="cat-row" aria-hidden="true">
        <span class="skeleton skeleton-title"></span>
      </div>
    </div>

    <template v-else>
      <TransitionGroup tag="ol" name="list" class="card cat-list">
        <li
          v-for="(category, index) in categories"
          :key="category.id"
          class="cat-row"
        >
          <span class="cat-index tabular" aria-hidden="true">{{ index + 1 }}</span>
          <form class="cat-rename" @submit.prevent="rename(category)">
            <input
              v-model="category.draft"
              class="input"
              :aria-label="locale.t('categories.nameLabel')"
              maxlength="30"
              required
            />
            <Transition name="fade">
              <button
                v-if="category.draft.trim() !== category.name"
                type="submit"
                class="btn btn-sm btn-primary"
                :disabled="busy"
              >{{ locale.t('common.save') }}</button>
            </Transition>
          </form>
          <span class="badge tabular">{{
            locale.t('categories.pageCount', { count: pageCounts.get(category.id) || 0 })
          }}</span>
          <div class="cat-actions">
            <button
              type="button"
              class="icon-btn icon-btn-sm"
              :disabled="busy || index === 0"
              :aria-label="locale.t('categories.moveUp')"
              :title="locale.t('categories.moveUp')"
              @click="move(index, -1)"
            ><Icon name="chevron-up" /></button>
            <button
              type="button"
              class="icon-btn icon-btn-sm"
              :disabled="busy || index === categories.length - 1"
              :aria-label="locale.t('categories.moveDown')"
              :title="locale.t('categories.moveDown')"
              @click="move(index, 1)"
            ><Icon name="chevron-down" /></button>
            <button
              type="button"
              class="icon-btn icon-btn-sm icon-btn-danger"
              :disabled="busy || categories.length === 1"
              :aria-label="`${locale.t('table.delete')} · ${category.name}`"
              :title="locale.t('table.delete')"
              @click="remove(category)"
            ><Icon name="trash" /></button>
          </div>
        </li>
      </TransitionGroup>

      <form class="card cat-add" @submit.prevent="add">
        <label class="field">
          {{ locale.t('categories.newLabel') }}
          <input
            v-model="newName"
            :placeholder="locale.t('categories.newPlaceholder')"
            maxlength="30"
            required
          />
        </label>
        <button type="submit" class="btn btn-primary" :disabled="busy">
          <Icon name="plus" />{{ locale.t('categories.add') }}
        </button>
      </form>
    </template>
  </div>
</template>

<style scoped>
.panel-meta {
  margin: 0 0 var(--space-4);
  color: var(--ink-muted);
  font-size: var(--text-sm);
}

.cat-list {
  margin: 0;
  padding: var(--space-1-5);
  list-style: none;
}

.cat-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
  background: var(--surface);
}

.cat-row + .cat-row {
  box-shadow: 0 calc(var(--border-width) * -1) 0 var(--border);
}

.cat-index {
  flex: none;
  width: var(--space-5);
  color: var(--ink-faint);
  font-size: var(--text-sm);
  text-align: center;
}

.cat-rename {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
}

.cat-rename .input {
  min-height: var(--control-sm);
  border-color: transparent;
  background: transparent;
  font-weight: var(--weight-medium);
}

.cat-rename .input:hover {
  border-color: var(--border);
}

.cat-rename .input:focus {
  background: var(--surface-sunken);
}

.cat-actions {
  display: flex;
  flex: none;
  gap: var(--space-0-5);
}

.cat-add {
  display: flex;
  align-items: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-4);
  padding: var(--space-4) var(--space-5);
}

.cat-add .field {
  flex: 1;
}

@media (max-width: 560px) {
  .cat-row {
    flex-wrap: wrap;
  }

  .cat-rename {
    flex-basis: calc(100% - var(--space-8));
  }

  .cat-row .badge {
    margin-left: var(--space-8);
  }

  .cat-actions {
    margin-left: auto;
  }

  .cat-add {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
