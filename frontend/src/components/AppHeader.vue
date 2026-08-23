<script setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import { useLocaleStore } from '../stores/locale.js';
import LocaleToggle from './LocaleToggle.vue';
import SettingsModal from './SettingsModal.vue';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const locale = useLocaleStore();

const settingsOpen = ref(false);

const showBackAndLogout = computed(
  () => route.name === 'admin' && auth.authenticated,
);

// The same button both signs in and opens the admin area, so its label has
// to follow the session — calling it "Log in" while already signed in reads
// as if the session were lost.
const adminButtonLabel = computed(() =>
  locale.t(auth.authenticated ? 'nav.manage' : 'nav.admin'),
);

function handleAdminClick() {
  if (auth.authenticated) {
    router.push('/_pagedock');
  } else {
    auth.openLoginModal('/_pagedock');
  }
}

async function handleLogout() {
  await auth.logout();
  router.push('/');
}
</script>

<template>
  <header class="bar">
    <div class="bar-inner">
      <button
        type="button"
        class="icon-button"
        :aria-label="locale.t('nav.settings')"
        :title="locale.t('nav.settings')"
        @click="settingsOpen = true"
      >
        <!-- "settings" icon from Lucide (https://lucide.dev, ISC license) —
             path verified verbatim against lucide-static's published SVG. -->
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path
            d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"
          />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>

      <LocaleToggle />

      <template v-if="showBackAndLogout">
        <RouterLink class="btn" to="/">{{ locale.t('nav.backToCatalog') }}</RouterLink>
        <button type="button" class="btn" @click="handleLogout">
          {{ locale.t('nav.logout') }}
        </button>
      </template>
      <button v-else type="button" class="btn" @click="handleAdminClick">
        {{ adminButtonLabel }}
      </button>
    </div>

    <SettingsModal :open="settingsOpen" @close="settingsOpen = false" />
  </header>
</template>
