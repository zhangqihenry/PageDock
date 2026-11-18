<script setup>
import { ref, watch } from 'vue';
import { formatBytes } from '../../utils/format.js';
import Icon from './Icon.vue';

// File picker as a drop zone (docs/design-system.md, "Fields"). The real
// <input type="file"> covers the whole zone (transparent), so click, drag
// & drop, keyboard and native `required` validation all stay the
// browser's own. v-model is the chosen File (or null).
const props = defineProps({
  modelValue: { type: Object, default: null },
  label: { type: String, required: true },
  hint: { type: String, default: '' },
  accept: { type: String, default: '' },
  required: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue']);

const input = ref(null);
const dragging = ref(false);

function onChange() {
  emit('update:modelValue', input.value?.files?.[0] ?? null);
}

// The parent clears the selection by setting the model back to null.
watch(
  () => props.modelValue,
  (file) => {
    if (!file && input.value) {
      input.value.value = '';
    }
  },
);
</script>

<template>
  <label class="field">
    {{ label }}
    <span class="drop" :class="{ 'is-dragging': dragging, 'has-file': modelValue }">
      <input
        ref="input"
        class="drop-input"
        type="file"
        :accept="accept"
        :required="required"
        @change="onChange"
        @dragenter="dragging = true"
        @dragleave="dragging = false"
        @drop="dragging = false"
      />
      <span class="drop-icon" aria-hidden="true">
        <Icon :name="modelValue ? 'file' : 'upload'" />
      </span>
      <span class="drop-text">
        <span class="drop-title">{{ modelValue ? modelValue.name : hint }}</span>
        <span v-if="modelValue" class="drop-meta mono">{{ formatBytes(modelValue.size) }}</span>
        <span v-else-if="accept" class="drop-meta mono">{{ accept.split(',').join(' · ') }}</span>
      </span>
    </span>
  </label>
</template>

<style scoped>
.drop {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-height: 4.5rem;
  border: var(--border-width) dashed var(--border-strong);
  border-radius: var(--radius-lg);
  background: var(--surface-sunken);
  padding: var(--space-3) var(--space-4);
  font-weight: var(--weight-regular);
  transition: border-color var(--dur-fast) var(--ease-standard),
    background-color var(--dur-fast) var(--ease-standard),
    box-shadow var(--dur-fast) var(--ease-standard);
}

.drop:hover,
.drop.is-dragging {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.drop:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 var(--ring-width) var(--focus-ring);
}

.drop.has-file {
  border-style: solid;
  border-color: var(--border);
  background: var(--surface);
}

.drop-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.drop-icon {
  display: grid;
  flex: none;
  place-items: center;
  width: var(--control-md);
  height: var(--control-md);
  border-radius: var(--radius-md);
  background: var(--accent-soft);
  color: var(--accent);
  transition: transform var(--dur-base) var(--ease-spring);
}

.drop:hover .drop-icon,
.drop.is-dragging .drop-icon {
  transform: translateY(var(--lift));
}

.drop-icon svg {
  width: var(--icon-md);
  height: var(--icon-md);
}

.drop-text {
  display: grid;
  gap: var(--space-0-5);
  min-width: 0;
}

.drop-title {
  overflow: hidden;
  color: var(--ink);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.drop-meta {
  color: var(--ink-faint);
  font-size: var(--text-xs);
}
</style>
