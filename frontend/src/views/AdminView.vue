<script setup>
import { computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import { useLocaleStore } from '../stores/locale.js';
import SitesTab from '../components/admin/SitesTab.vue';
import UploadTab from '../components/admin/UploadTab.vue';
import SettingsTab from '../components/admin/SettingsTab.vue';

// Login has no route of its own — it's a modal on the homepage. Landing
// here signed out redirects back to `/` and opens that modal, remembering
// to bounce back here once login succeeds.
const auth = useAuthStore();
const locale = useLocaleStore();
const route = useRoute();
const router = useRouter();

const TABS = ['sites', 'upload', 'settings'];

const activeTab = computed(() => {
  const requested = route.query.tab;
  return TABS.includes(requested) ? requested : 'sites';
});

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
  <main class="wrap">
    <p v-if="!auth.ready" class="muted">{{ locale.t('common.loading') }}</p>

    <template v-else-if="auth.authenticated">
      <nav class="admin-tabs" aria-label="admin sections">
        <button
          type="button"
          class="admin-tab"
          :class="{ 'is-active': activeTab === 'sites' }"
          @click="selectTab('sites')"
        >
          {{ locale.t('admin.tabSites') }}
        </button>
        <button
          type="button"
          class="admin-tab"
          :class="{ 'is-active': activeTab === 'upload' }"
          @click="selectTab('upload')"
        >
          {{ locale.t('admin.tabUpload') }}
        </button>
        <button
          type="button"
          class="admin-tab"
          :class="{ 'is-active': activeTab === 'settings' }"
          @click="selectTab('settings')"
        >
          {{ locale.t('admin.tabSettings') }}
        </button>
      </nav>

      <section class="admin-panel">
        <SitesTab v-if="activeTab === 'sites'" />
        <UploadTab v-else-if="activeTab === 'upload'" @uploaded="selectTab('sites')" />
        <SettingsTab v-else-if="activeTab === 'settings'" />
      </section>
    </template>
  </main>
</template>
