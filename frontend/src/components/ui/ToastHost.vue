<script setup>
import { useLocaleStore } from '../../stores/locale.js';
import { useToastStore } from '../../stores/toast.js';
import Icon from './Icon.vue';

const toast = useToastStore();
const locale = useLocaleStore();
</script>

<template>
  <Teleport to="body">
    <!-- The live region is always present so screen readers pick up each
         message as it's added. -->
    <div class="toast-region" role="status" aria-live="polite">
      <TransitionGroup name="toast">
        <div v-for="item in toast.items" :key="item.id" class="toast" :class="`toast-${item.tone}`">
          <span class="toast-icon" aria-hidden="true">
            <Icon :name="item.tone === 'success' ? 'check' : 'x'" />
          </span>
          <span class="toast-message">{{ item.message }}</span>
          <button
            type="button"
            class="toast-close"
            :aria-label="locale.t('common.close')"
            @click="toast.dismiss(item.id)"
          >
            <Icon name="x" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-region {
  position: fixed;
  right: 0;
  bottom: calc(var(--space-6) + env(safe-area-inset-bottom));
  left: 0;
  z-index: var(--z-toast);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding-inline: var(--gutter);
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  max-width: min(100%, var(--content-narrow));
  border-radius: var(--radius-lg);
  background: var(--inverse-bg);
  padding: var(--space-2) var(--space-2) var(--space-2) var(--space-3);
  color: var(--inverse-ink);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  box-shadow: var(--shadow-lg);
  pointer-events: auto;
}

.toast-icon {
  display: grid;
  flex: none;
  place-items: center;
  width: var(--size-badge);
  height: var(--size-badge);
  border-radius: 50%;
  background: var(--positive);
  color: var(--surface);
}

.toast-error .toast-icon {
  background: var(--danger);
}

.toast-icon svg {
  width: var(--space-3);
  height: var(--space-3);
  stroke-width: 3;
}

.toast-message {
  flex: 1;
  line-height: var(--leading-snug);
}

.toast-close {
  display: grid;
  flex: none;
  place-items: center;
  width: var(--control-sm);
  height: var(--control-sm);
  border-radius: var(--radius-sm);
  color: inherit;
  opacity: 0.6;
  transition: opacity var(--dur-fast) var(--ease-standard),
    background-color var(--dur-fast) var(--ease-standard);
}

.toast-close:hover {
  background: color-mix(in srgb, var(--inverse-ink) 12%, transparent);
  opacity: 1;
}

.toast-close svg {
  width: var(--icon-sm);
  height: var(--icon-sm);
}

.toast-move,
.toast-enter-active {
  transition: opacity var(--dur-slow) var(--ease-out),
    transform var(--dur-slow) var(--ease-spring);
}

.toast-leave-active {
  transition: opacity var(--dur-fast) var(--ease-in),
    transform var(--dur-fast) var(--ease-in);
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(calc(var(--enter-distance) * 1.6)) scale(0.96);
}

.toast-leave-to {
  opacity: 0;
  transform: scale(0.96);
}
</style>
