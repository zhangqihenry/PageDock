<script setup>
import { onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import { useLocaleStore } from '../stores/locale.js';

// Login has no route of its own — it's a modal on the homepage. Landing
// here signed out redirects back to `/` and opens that modal, remembering
// to bounce back here once login succeeds.
const auth = useAuthStore();
const locale = useLocaleStore();
const router = useRouter();

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
    <p v-else-if="auth.authenticated">
      已登录 — 后台管理选项卡还没做，下一阶段补上。
    </p>
  </main>
</template>
