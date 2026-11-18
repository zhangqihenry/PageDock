<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import { useCatalogStore } from '../stores/catalog.js';
import { useLocaleStore } from '../stores/locale.js';
import LocaleToggle from './LocaleToggle.vue';
import SettingsModal from './SettingsModal.vue';
import BrandMark from './ui/BrandMark.vue';
import Icon from './ui/Icon.vue';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const catalog = useCatalogStore();
const locale = useLocaleStore();

const settingsOpen = ref(false);
const scrollY = ref(0);

const showBackAndLogout = computed(
  () => route.name === 'admin' && auth.authenticated,
);

// The same button both signs in and opens the admin area, so its label has
// to follow the session — calling it "Log in" while already signed in reads
// as if the session were lost.
const adminButtonLabel = computed(() =>
  locale.t(auth.authenticated ? 'nav.manage' : 'nav.admin'),
);

const brandTitle = computed(() => catalog.settings.title || 'PageDock');
// On the catalog the big hero title already names the page, so the
// header's copy only fades in once that hero has scrolled away.
const brandTitleShown = computed(() => route.name !== 'home' || scrollY.value > 120);

function onScroll() {
  scrollY.value = window.scrollY;
}

onMounted(() => {
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll);
});

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
  <header class="header" :class="{ 'is-scrolled': scrollY > 4 }">
    <div class="header-inner container">
      <RouterLink class="brand" to="/" :aria-label="brandTitle">
        <BrandMark class="brand-mark" />
        <span class="brand-title" :class="{ 'is-shown': brandTitleShown }" aria-hidden="true">
          {{ brandTitle }}
        </span>
      </RouterLink>

      <div class="header-actions">
        <button
          type="button"
          class="icon-btn"
          :aria-label="locale.t('nav.settings')"
          :title="locale.t('nav.settings')"
          @click="settingsOpen = true"
        >
          <Icon name="settings" />
        </button>

        <LocaleToggle />

        <span class="header-divider" aria-hidden="true"></span>

        <template v-if="showBackAndLogout">
          <RouterLink
            class="btn btn-sm btn-ghost"
            to="/"
            :aria-label="locale.t('nav.backToCatalog')"
            :title="locale.t('nav.backToCatalog')"
          >
            <Icon name="arrow-left" />
            <span>{{ locale.t('nav.backToCatalog') }}</span>
          </RouterLink>
          <button
            type="button"
            class="btn btn-sm"
            :aria-label="locale.t('nav.logout')"
            :title="locale.t('nav.logout')"
            @click="handleLogout"
          >
            <Icon name="log-out" />
            <span>{{ locale.t('nav.logout') }}</span>
          </button>
        </template>
        <button
          v-else
          type="button"
          class="btn btn-sm"
          :aria-label="adminButtonLabel"
          @click="handleAdminClick"
        >
          <Icon v-if="auth.authenticated" name="dashboard" />
          <span>{{ adminButtonLabel }}</span>
        </button>
      </div>
    </div>

    <SettingsModal :open="settingsOpen" @close="settingsOpen = false" />
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: var(--z-header);
  border-bottom: var(--border-width) solid transparent;
  transition: background-color var(--dur-base) var(--ease-standard),
    border-color var(--dur-base) var(--ease-standard),
    box-shadow var(--dur-base) var(--ease-standard);
}

.header.is-scrolled {
  border-bottom-color: var(--border);
  background: var(--glass);
  box-shadow: var(--shadow-xs);
  backdrop-filter: saturate(1.6) blur(var(--blur-glass));
  -webkit-backdrop-filter: saturate(1.6) blur(var(--blur-glass));
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  height: var(--header-height);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
  border-radius: var(--radius-sm);
  color: var(--ink);
  text-decoration: none;
}

.brand-mark {
  width: var(--size-brand);
  height: var(--size-brand);
  transition: transform var(--dur-base) var(--ease-spring);
}

.brand:hover .brand-mark {
  transform: rotate(-6deg) scale(1.05);
}

.brand-title {
  overflow: hidden;
  font-size: var(--text-base);
  font-weight: var(--weight-bold);
  letter-spacing: var(--tracking-tight);
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 0;
  transform: translateY(var(--space-1));
  transition: opacity var(--dur-base) var(--ease-out),
    transform var(--dur-base) var(--ease-out);
}

.brand-title.is-shown {
  opacity: 1;
  transform: none;
}

.header-actions {
  display: flex;
  flex: none;
  align-items: center;
  gap: var(--space-1);
}

.header-divider {
  width: var(--border-width);
  height: var(--space-5);
  margin-inline: var(--space-1-5);
  background: var(--border);
}

@media (max-width: 560px) {
  .brand-title {
    display: none;
  }

  /* Text buttons fold to icons where an icon exists. */
  .header-actions .btn:has(svg) span {
    display: none;
  }

  .header-actions .btn:has(svg) {
    width: var(--control-sm);
    padding: 0;
  }

  .header-divider {
    margin-inline: var(--space-1);
  }
}
</style>
