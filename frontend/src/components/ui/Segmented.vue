<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

// One control for every "pick one of a few" choice (docs/design-system.md,
// "Tabs & segmented control"), with a single indicator that slides to the
// active option.
//   mode="tabs"  → role=tablist, roving tabindex, ←/→/Home/End move and
//                  select; pair with a role=tabpanel whose id is `controls`
//                  and aria-labelledby `${idPrefix}-${value}`.
//   mode="group" → plain toggle buttons with aria-pressed.
//   variant="pill" (filled thumb) | "underline" (section tabs).
const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  options: { type: Array, required: true }, // [{ value, label }]
  mode: { type: String, default: 'group' },
  variant: { type: String, default: 'pill' },
  ariaLabel: { type: String, default: '' },
  idPrefix: { type: String, default: '' },
  controls: { type: String, default: '' },
  // Stretch options to share the full width equally.
  block: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue']);

const root = ref(null);
const buttons = ref([]);
const indicator = ref({ x: 0, y: 0, w: 0, h: 0 });
// The indicator only animates after its first placement, so it never
// slides in from the corner on mount.
const ready = ref(false);
const isTabs = computed(() => props.mode === 'tabs');
const activeIndex = computed(() =>
  props.options.findIndex((option) => option.value === props.modelValue),
);

function optionId(option) {
  return props.idPrefix ? `${props.idPrefix}-${option.value}` : undefined;
}

function measure() {
  const el = buttons.value[activeIndex.value];
  if (!el) {
    indicator.value = { ...indicator.value, w: 0 };
    return;
  }
  indicator.value = {
    x: el.offsetLeft,
    y: el.offsetTop,
    w: el.offsetWidth,
    h: el.offsetHeight,
  };
  if (!ready.value) {
    requestAnimationFrame(() => {
      ready.value = true;
    });
  }
}

function select(option, { focus = false } = {}) {
  emit('update:modelValue', option.value);
  if (focus) {
    nextTick(() => {
      const el = buttons.value[props.options.indexOf(option)];
      el?.focus();
    });
  }
}

function onKeydown(event, index) {
  if (!isTabs.value) {
    return;
  }
  const count = props.options.length;
  let next;
  if (event.key === 'ArrowRight') next = (index + 1) % count;
  else if (event.key === 'ArrowLeft') next = (index + count - 1) % count;
  else if (event.key === 'Home') next = 0;
  else if (event.key === 'End') next = count - 1;
  else return;
  event.preventDefault();
  select(props.options[next], { focus: true });
}

let observer = null;
onMounted(() => {
  measure();
  observer = new ResizeObserver(() => measure());
  observer.observe(root.value);
  buttons.value.forEach((el) => el && observer.observe(el));
  document.fonts?.ready.then(measure);
});

onBeforeUnmount(() => observer?.disconnect());

watch(
  () => [props.modelValue, props.options.map((option) => option.label).join('\u0000')],
  async ([value], [previousValue]) => {
    await nextTick();
    if (observer) {
      observer.disconnect();
      observer.observe(root.value);
      buttons.value.forEach((el) => el && observer.observe(el));
    }
    measure();
    // Keep a newly chosen option visible when the strip scrolls sideways
    // (scrolls the strip only — never the page).
    const el = buttons.value[activeIndex.value];
    if (value !== previousValue && el && root.value.scrollWidth > root.value.clientWidth) {
      const left = el.offsetLeft - (root.value.clientWidth - el.offsetWidth) / 2;
      root.value.scrollTo({ left, behavior: 'smooth' });
    }
  },
);
</script>

<template>
  <div
    ref="root"
    class="seg"
    :class="[`seg-${variant}`, { 'seg-block': block, 'is-ready': ready }]"
    :role="isTabs ? 'tablist' : 'group'"
    :aria-label="ariaLabel || undefined"
  >
    <span
      class="seg-indicator"
      aria-hidden="true"
      :style="{
        width: `${indicator.w}px`,
        height: variant === 'pill' ? `${indicator.h}px` : undefined,
        transform: `translate(${indicator.x}px, ${variant === 'pill' ? indicator.y : 0}px)`,
        opacity: indicator.w ? 1 : 0,
      }"
    ></span>
    <button
      v-for="(option, index) in options"
      :id="optionId(option)"
      :key="option.value"
      ref="buttons"
      type="button"
      class="seg-option"
      :class="{ 'is-active': option.value === modelValue }"
      :role="isTabs ? 'tab' : undefined"
      :aria-selected="isTabs ? option.value === modelValue : undefined"
      :aria-pressed="isTabs ? undefined : option.value === modelValue"
      :aria-controls="isTabs && controls ? controls : undefined"
      :tabindex="isTabs ? (option.value === modelValue ? 0 : -1) : undefined"
      @click="select(option)"
      @keydown="onKeydown($event, index)"
    >
      <slot name="option" :option="option">{{ option.label }}</slot>
    </button>
  </div>
</template>

<style scoped>
.seg {
  position: relative;
  display: inline-flex;
  max-width: 100%;
  overflow-x: auto;
  scrollbar-width: none;
}

.seg::-webkit-scrollbar {
  display: none;
}

.seg-indicator {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

.is-ready .seg-indicator {
  transition: transform var(--dur-base) var(--ease-out),
    width var(--dur-base) var(--ease-out),
    height var(--dur-base) var(--ease-out),
    opacity var(--dur-fast) var(--ease-standard);
}

.seg-option {
  position: relative;
  z-index: var(--z-raised);
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  gap: var(--space-1-5);
  color: var(--ink-muted);
  font-weight: var(--weight-semibold);
  white-space: nowrap;
  transition: color var(--dur-fast) var(--ease-standard);
}

.seg-option:hover {
  color: var(--ink);
}

.seg-option.is-active {
  color: var(--ink);
}

.seg-option:focus-visible {
  outline-offset: calc(var(--focus-width) * -1);
}

/* Pill: a sunken track with a raised thumb. */
.seg-pill {
  gap: var(--space-0-5);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface-sunken);
  padding: var(--space-0-5);
}

.seg-pill .seg-indicator {
  border-radius: var(--radius-sm);
  background: var(--thumb);
  box-shadow: var(--shadow-sm), 0 0 0 var(--border-width) var(--border);
}

.seg-pill .seg-option {
  min-height: var(--control-sm);
  border-radius: var(--radius-sm);
  padding: 0 var(--space-4);
  font-size: var(--text-sm);
}

/* Underline: section tabs over a hairline. */
.seg-underline {
  gap: var(--space-6);
  width: 100%;
  box-shadow: inset 0 calc(var(--border-width) * -1) 0 var(--border);
}

.seg-underline .seg-indicator {
  top: auto;
  bottom: 0;
  height: var(--stroke);
  border-radius: var(--radius-pill);
  background: var(--accent);
}

.seg-underline .seg-option {
  min-height: var(--control-lg);
  padding: 0 var(--space-0-5);
  font-size: var(--text-base);
}

.seg-block {
  display: flex;
  width: 100%;
}

.seg-block .seg-option {
  flex: 1 1 0;
}

@media (max-width: 560px) {
  .seg-underline {
    gap: var(--space-5);
  }
}
</style>
