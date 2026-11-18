<script setup>
import { nextTick, onBeforeUnmount, ref, useId, watch } from 'vue';
import { useLocaleStore } from '../../stores/locale.js';
import Icon from './Icon.vue';

// The one dialog shell (docs/design-system.md, "Modal"): teleported,
// scrim + panel transition, Escape / scrim click to close, focus moved in
// on open, trapped while open and restored on close, page scroll locked.
// On phone widths the panel becomes a bottom sheet.
const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  size: { type: String, default: 'sm' }, // 'sm' | 'md'
  // While true (a request in flight) the dialog refuses to close.
  busy: { type: Boolean, default: false },
});
const emit = defineEmits(['close']);

const locale = useLocaleStore();
const titleId = useId();
const descId = useId();
const panel = ref(null);
let returnFocusTo = null;

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function close() {
  if (!props.busy) {
    emit('close');
  }
}

function onKeydown(event) {
  if (event.key === 'Escape') {
    event.stopPropagation();
    close();
    return;
  }
  if (event.key !== 'Tab' || !panel.value) {
    return;
  }
  const items = [...panel.value.querySelectorAll(FOCUSABLE)].filter(
    (el) => el.offsetParent !== null,
  );
  if (items.length === 0) {
    event.preventDefault();
    return;
  }
  const first = items[0];
  const last = items[items.length - 1];
  if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.value)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function lockScroll(locked) {
  document.documentElement.style.overflow = locked ? 'hidden' : '';
}

watch(
  () => props.open,
  async (open, wasOpen) => {
    if (open === Boolean(wasOpen)) {
      return;
    }
    if (open) {
      returnFocusTo = document.activeElement;
      lockScroll(true);
      await nextTick();
      // Content may focus its own first field (login, edit); only take
      // focus to the panel itself if nothing inside claimed it.
      requestAnimationFrame(() => {
        if (panel.value && !panel.value.contains(document.activeElement)) {
          panel.value.focus();
        }
      });
    } else {
      lockScroll(false);
      if (returnFocusTo && typeof returnFocusTo.focus === 'function') {
        returnFocusTo.focus();
      }
      returnFocusTo = null;
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  if (props.open) {
    lockScroll(false);
  }
});
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="modal-scrim" @click.self="close" @keydown="onKeydown">
        <div
          ref="panel"
          class="modal-panel"
          :class="`modal-${size}`"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          :aria-describedby="description ? descId : undefined"
          tabindex="-1"
        >
          <header class="modal-head">
            <div class="modal-head-text">
              <h2 :id="titleId" class="modal-title">{{ title }}</h2>
              <p v-if="description" :id="descId" class="modal-desc">
                <slot name="description">{{ description }}</slot>
              </p>
            </div>
            <button
              type="button"
              class="icon-btn modal-close"
              :aria-label="locale.t('common.close')"
              :title="locale.t('common.close')"
              @click="close"
            >
              <Icon name="x" />
            </button>
          </header>
          <div class="modal-body">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-scrim {
  position: fixed;
  inset: 0;
  z-index: var(--z-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--overlay);
  padding: var(--space-6);
  backdrop-filter: blur(var(--blur-scrim));
  -webkit-backdrop-filter: blur(var(--blur-scrim));
}

.modal-panel {
  display: flex;
  flex-direction: column;
  width: min(100%, var(--modal-sm));
  max-height: min(88vh, 54rem);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-xl);
  background: var(--surface);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

.modal-panel:focus {
  outline: none;
}

.modal-md {
  width: min(100%, var(--modal-md));
}

.modal-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-6) var(--space-6) var(--space-4);
}

.modal-head-text {
  display: grid;
  gap: var(--space-1);
  min-width: 0;
}

.modal-title {
  margin: 0;
  font-size: var(--text-xl);
  font-weight: var(--weight-bold);
}

.modal-desc {
  margin: 0;
  color: var(--ink-muted);
  font-size: var(--text-sm);
  overflow-wrap: anywhere;
}

.modal-close {
  margin: calc(var(--space-2) * -1) calc(var(--space-2) * -1) 0 0;
}

.modal-body {
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0 var(--space-6) var(--space-6);
}

/* Transition: scrim fades, panel rises and settles from 97%. */
.modal-enter-active,
.modal-leave-active {
  transition: opacity var(--dur-slow) var(--ease-out);
}

.modal-leave-active {
  transition-duration: var(--dur-base);
  transition-timing-function: var(--ease-in);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-panel {
  transition: transform var(--dur-slow) var(--ease-out);
}

.modal-leave-active .modal-panel {
  transition: transform var(--dur-base) var(--ease-in);
}

.modal-enter-from .modal-panel,
.modal-leave-to .modal-panel {
  transform: translateY(var(--enter-distance)) scale(0.97);
}

/* Phone: bottom sheet. */
@media (max-width: 560px) {
  .modal-scrim {
    align-items: flex-end;
    padding: 0;
  }

  .modal-panel,
  .modal-md {
    width: 100%;
    max-height: 92vh;
    border-width: var(--border-width) 0 0;
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
    padding-bottom: env(safe-area-inset-bottom);
  }

  .modal-head {
    padding: var(--space-5) var(--space-5) var(--space-3);
  }

  .modal-body {
    padding: 0 var(--space-5) var(--space-6);
  }

  .modal-enter-from .modal-panel,
  .modal-leave-to .modal-panel {
    transform: translateY(100%);
  }
}

@media (max-width: 560px) and (prefers-reduced-motion: reduce) {
  .modal-enter-from .modal-panel,
  .modal-leave-to .modal-panel {
    transform: none;
  }
}
</style>
