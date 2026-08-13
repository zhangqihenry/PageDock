import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';

// Admin's three tabs (sites/upload/settings) are driven by a `?tab=` query
// param inside AdminView rather than separate routes here — see the plan.
// Editing a site is a modal within the Sites tab, not a route either.
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    {
      path: '/_pagedock',
      name: 'admin',
      component: () => import('../views/AdminView.vue'),
    },
    { path: '/_pagedock/:pathMatch(.*)*', redirect: '/_pagedock' },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
    },
  ],
});

export default router;
