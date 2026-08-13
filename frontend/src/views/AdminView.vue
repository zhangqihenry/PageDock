<script setup>
import { onMounted, ref } from 'vue';
import { useAuthStore } from '../stores/auth.js';

// Placeholder wiring for Phase 3 — proves the auth store/session check
// works end to end. The real tabbed layout (Sites/Upload/Settings) and the
// login modal land in the next phases.
const auth = useAuthStore();
const checking = ref(true);

onMounted(async () => {
  await auth.fetchSession();
  checking.value = false;
});
</script>

<template>
  <main>
    <p v-if="checking">…</p>
    <p v-else-if="!auth.authenticated">未登录（登录弹窗还没做，下一阶段补上）。</p>
    <p v-else>已登录 — 后台管理选项卡还没做，下一阶段补上。</p>
  </main>
</template>
