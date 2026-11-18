<script setup>
import { computed } from 'vue';
import { NUMERIC_RANGES, useTypographyStore } from '../stores/typography.js';
import { useLocaleStore } from '../stores/locale.js';
import { rangeFill } from '../utils/motion.js';
import Segmented from './ui/Segmented.vue';

// Each prop is a key into the typography store (or null to omit that row) —
// SettingsModal passes a small config object per element (h1, subtitle,
// footer, etc.) so this one component covers every "font / size / space
// before / space after" combination without repeating the markup per group.
const props = defineProps({
  titleKey: { type: String, required: true },
  font: { type: String, default: null },
  size: { type: String, default: null },
  before: { type: String, default: null },
  after: { type: String, default: null },
});

const typography = useTypographyStore();
const locale = useLocaleStore();

const fontOptions = computed(() => [
  { value: 'sans', label: locale.t('typography.fontSans') },
  { value: 'serif', label: locale.t('typography.fontSerif') },
]);

// [store key, label key, slider step] for each numeric row this group has.
const ranges = computed(() =>
  [
    [props.size, 'typography.fontSize', 1],
    [props.before, 'typography.spaceBefore', 2],
    [props.after, 'typography.spaceAfter', 2],
  ].filter(([key]) => key),
);
</script>

<template>
  <div class="type-group panel-inset" role="group" :aria-label="locale.t(titleKey)">
    <h4 class="type-group-title">{{ locale.t(titleKey) }}</h4>

    <div v-if="font" class="setting-row">
      <span class="setting-label">{{ locale.t('typography.font') }}</span>
      <Segmented
        :model-value="typography[font]"
        :options="fontOptions"
        :aria-label="`${locale.t(titleKey)} · ${locale.t('typography.font')}`"
        block
        @update:model-value="typography.setFont(font, $event)"
      />
    </div>

    <label v-for="[key, labelKey, step] in ranges" :key="key" class="setting-row">
      <span class="setting-label">{{ locale.t(labelKey) }}</span>
      <span class="range-control">
        <input
          type="range"
          :min="NUMERIC_RANGES[key].min"
          :max="NUMERIC_RANGES[key].max"
          :step="step"
          :value="typography[key]"
          :style="{ '--range-fill': rangeFill(typography[key], NUMERIC_RANGES[key].min, NUMERIC_RANGES[key].max) }"
          @input="typography.setNumeric(key, $event.target.valueAsNumber)"
        />
        <span class="range-value mono">{{ typography[key] }}px</span>
      </span>
    </label>
  </div>
</template>

<style scoped>
.type-group-title {
  margin: 0 0 var(--space-1);
  color: var(--ink);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-normal);
}
</style>
