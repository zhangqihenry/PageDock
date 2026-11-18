<script setup>
import { computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import { useLocaleStore } from '../stores/locale.js';
import Segmented from '../components/ui/Segmented.vue';
import SitesTab from '../components/admin/SitesTab.vue';
import UploadTab from '../components/admin/UploadTab.vue';
import CategoriesTab from '../components/admin/CategoriesTab.vue';
import SettingsTab from '../components/admin/SettingsTab.vue';

// Login has no route of its own — it's a modal on the homepage. Landing
// here signed out redirects back to `/` and opens that modal, remembering
// to bounce back here once login succeeds.
const auth = useAuthStore();
const locale = useLocaleStore();
const route = useRoute();
const router = useRouter();

const TABS = ['sites', 'upload', 'categories', 'settings'];
const TAB_LABEL_KEYS = {
  sites: 'admin.tabSites',
  upload: 'admin.tabUpload',
  categories: 'admin.tabCategories',
  settings: 'admin.tabSettings',
};
const TAB_COMPONENTS = {
  sites: SitesTab,
  upload: UploadTab,
  categories: CategoriesTab,
  settings: SettingsTab,
};

const activeTab = computed(() => {
  const requested = route.query.tab;
  return TABS.includes(requested) ? requested : 'sites';
});

const tabOptions = computed(() =>
  TABS.map((tab) => ({ value: tab, label: locale.t(TAB_LABEL_KEYS[tab]) })),
);

function selectTab(tab) {
  router.replace({ path: '/_pagedock', query: tab === 'sites' ? {} : { tab } });
}

function guard() {
  if (auth.ready && !auth.authenticated) {
    auth.openLoginModal('/_pagedock');
    router.replace('/');
  }
}

onMounted(guard);
watch(() => auth.ready, guard);
</script>

<template>
  <main class="container page admin">
    <div v-if="!auth.ready" class="admin-loading" aria-busy="true">
      <span class="sr-only" role="status">{{ locale.t('common.loading') }}</span>
      <span class="skeleton skeleton-title" aria-hidden="true"></span>
    </div>

    <template v-else-if="auth.authenticated">
      <header class="page-head enter-rise">
        <h1 class="page-title">{{ locale.t('admin.heading') }}</h1>
      </header>

      <Segmented
        class="admin-tabs enter-rise"
        style="--i: 1"
        :model-value="activeTab"
        :options="tabOptions"
        mode="tabs"
        variant="underline"
        id-prefix="admin-tab"
        controls="admin-panel"
        :aria-label="locale.t('admin.heading')"
        @update:model-value="selectTab"
      />

      <section
        id="admin-panel"
        class="admin-panel"
        role="tabpanel"
        :aria-labelledby="`admin-tab-${activeTab}`"
      >
        <Transition name="swap" mode="out-in">
          <component
            :is="TAB_COMPONENTS[activeTab]"
            :key="activeTab"
            @uploaded="selectTab('sites')"
          />
        </Transition>
      </section>
    </template>
  </main>
</template>

<style scoped>
.admin-tabs {
  margin-bottom: var(--space-6);
}
</style>
