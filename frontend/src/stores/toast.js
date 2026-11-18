import { defineStore } from 'pinia';

// Transient confirmations (docs/design-system.md, "Toast"): "saved",
// "deleted", "enabled"… Errors are never toasts — they stay inline next to
// whatever caused them, until the next attempt.
const DEFAULT_TIMEOUT_MS = 3600;
let nextId = 1;
const timers = new Map();

export const useToastStore = defineStore('toast', {
  state: () => ({
    items: [],
  }),
  actions: {
    push(message, { tone = 'success', timeout = DEFAULT_TIMEOUT_MS } = {}) {
      const id = nextId++;
      // Only the newest few stay on screen; older ones step aside.
      this.items = [...this.items.slice(-2), { id, message, tone }];
      timers.set(id, window.setTimeout(() => this.dismiss(id), timeout));
      return id;
    },
    dismiss(id) {
      window.clearTimeout(timers.get(id));
      timers.delete(id);
      this.items = this.items.filter((item) => item.id !== id);
    },
  },
});
