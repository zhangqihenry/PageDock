<script setup>
import { onMounted } from 'vue';
import AppHeader from './components/AppHeader.vue';
import AppFooter from './components/AppFooter.vue';
import LoginModal from './components/LoginModal.vue';
import { useAuthStore } from './stores/auth.js';
import { useCatalogStore } from './stores/catalog.js';

const auth = useAuthStore();
const catalog = useCatalogStore();

// Both the header/footer (version, admin button) and most views need
// these, so fetch them once here instead of duplicating calls per view.
onMounted(() => {
  catalog.fetch();
  auth.fetchSession();
});
</script>

<template>
  <div class="app-shell">
    <AppHeader />
    <div class="app-body">
      <RouterView />
    </div>
    <AppFooter />
  </div>
  <LoginModal />
</template>

<style scoped>
.app-shell {
  display: flex;
  min-height: 100vh;
  flex-direction: column;
}

.app-body {
  flex: 1;
}
</style>
