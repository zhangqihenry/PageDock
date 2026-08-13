<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import { useCatalogStore } from '../stores/catalog.js';
import { useLocaleStore } from '../stores/locale.js';
import ThemeToggle from './ThemeToggle.vue';
import LocaleToggle from './LocaleToggle.vue';
import logo from '../assets/logo.png';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const catalog = useCatalogStore();
const locale = useLocaleStore();

const isHome = computed(() => route.name === 'home');
const showBackAndLogout = computed(
  () => route.name === 'admin' && auth.authenticated,
);
const releaseUrl = computed(
  () =>
    `https://github.com/zhangqihenry/PageDock/releases/tag/v${catalog.meta.version}`,
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
    <RouterLink class="mark" to="/">
      <img class="mark-logo" :src="logo" alt="PageDock" />
    </RouterLink>
    <div class="bar-actions">
      <template v-if="isHome">
        <a
          class="version-tag mono"
          :href="releaseUrl"
          target="_blank"
          rel="noopener noreferrer"
          :title="locale.t('nav.versionLabel', { version: catalog.meta.version })"
        >v{{ catalog.meta.version }}</a>
        <a
          class="icon-button"
          href="https://github.com/zhangqihenry"
          target="_blank"
          rel="noopener noreferrer"
          :title="locale.t('nav.githubProfile')"
          :aria-label="locale.t('nav.githubProfile')"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path
              d="M12 .5C5.73.5.98 5.24.98 11.52c0 5.02 3.26 9.28 7.78 10.78.57.1.78-.25.78-.55 0-.27-.01-1.16-.02-2.11-3.17.69-3.84-1.35-3.84-1.35-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.75 1.18 1.75 1.18 1.02 1.75 2.68 1.24 3.33.95.1-.74.4-1.24.72-1.53-2.53-.29-5.19-1.27-5.19-5.63 0-1.24.44-2.26 1.17-3.06-.12-.29-.51-1.45.11-3.02 0 0 .96-.31 3.14 1.17a10.9 10.9 0 0 1 5.72 0c2.18-1.48 3.14-1.17 3.14-1.17.62 1.57.23 2.73.11 3.02.73.8 1.17 1.82 1.17 3.06 0 4.37-2.66 5.34-5.2 5.62.41.36.77 1.06.77 2.14 0 1.55-.01 2.79-.01 3.17 0 .3.2.66.79.55 4.51-1.5 7.77-5.76 7.77-10.78C23.02 5.24 18.27.5 12 .5Z"
            ></path>
          </svg>
        </a>
      </template>

      <ThemeToggle />
      <LocaleToggle />

      <template v-if="showBackAndLogout">
        <RouterLink class="btn" to="/">{{ locale.t('nav.backToCatalog') }}</RouterLink>
        <button type="button" class="btn" @click="handleLogout">
          {{ locale.t('nav.logout') }}
        </button>
      </template>
      <button v-else type="button" class="btn" @click="handleAdminClick">
        {{ locale.t('nav.admin') }}
      </button>
    </div>
  </header>
</template>
