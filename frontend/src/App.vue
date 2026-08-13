<script setup>
import { onMounted } from 'vue';
import AppHeader from './components/AppHeader.vue';
import LoginModal from './components/LoginModal.vue';
import { useAuthStore } from './stores/auth.js';
import { useCatalogStore } from './stores/catalog.js';

const auth = useAuthStore();
const catalog = useCatalogStore();

// Both the header (version tag, admin button) and most views need these,
// so fetch them once here instead of duplicating calls per view.
onMounted(() => {
  catalog.fetch();
  auth.fetchSession();
});
</script>

<template>
  <AppHeader />
  <RouterView />
  <LoginModal />
</template>
