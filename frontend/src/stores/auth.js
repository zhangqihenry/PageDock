import { defineStore } from 'pinia';
import { api } from '../api/client.js';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    authenticated: false,
    csrfToken: '',
    // Whether fetchSession() has resolved at least once — lets callers
    // avoid flashing a "please log in" state before the first check lands.
    ready: false,
    // Login is a modal on the homepage, not a route — this is the shared
    // open/close + "where to go after a successful login" state for it.
    loginModalOpen: false,
    postLoginRedirect: '/',
  }),
  actions: {
    openLoginModal(redirectTo = '/') {
      this.postLoginRedirect = redirectTo;
      this.loginModalOpen = true;
    },

    closeLoginModal() {
      this.loginModalOpen = false;
    },

    async fetchSession() {
      const data = await api.get('/auth/session');
      this.authenticated = data.authenticated;
      this.csrfToken = data.csrfToken;
      this.ready = true;
      return data;
    },

    async login(username, password) {
      if (!this.ready) {
        await this.fetchSession();
      }
      const data = await api.post(
        '/auth/login',
        { username, password },
        { csrfToken: this.csrfToken },
      );
      this.authenticated = data.authenticated;
      this.csrfToken = data.csrfToken;
      return data;
    },

    async logout() {
      await api.post('/auth/logout', undefined, { csrfToken: this.csrfToken });
      this.authenticated = false;
      // Logging out destroys the session (and its CSRF token) server-side —
      // pick up the fresh one for whatever request comes next.
      await this.fetchSession();
    },
  },
});
