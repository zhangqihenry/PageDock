<script setup>
import { NUMERIC_RANGES, useTypographyStore } from '../stores/typography.js';
import { useLocaleStore } from '../stores/locale.js';

// Each prop is a key into the typography store (or null to omit that row) —
// SettingsModal passes a small config object per element (h1, subtitle,
// footer, etc.) so this one component covers every "font / size / space
// before / space after" combination without repeating the markup per group.
defineProps({
  titleKey: { type: String, required: true },
  font: { type: String, default: null },
  size: { type: String, default: null },
  before: { type: String, default: null },
  after: { type: String, default: null },
});

const typography = useTypographyStore();
const locale = useLocaleStore();
</script>

<template>
  <div class="settings-section">
    <h3 class="settings-group-title">{{ locale.t(titleKey) }}</h3>

    <div v-if="font" class="settings-subrow">
      <span class="settings-label">{{ locale.t('typography.font') }}</span>
      <div class="segmented" role="group">
        <button
          type="button"
          class="segmented-option"
          :class="{ 'is-active': typography[font] === 'sans' }"
          @click="typography.setFont(font, 'sans')"
        >
          {{ locale.t('typography.fontSans') }}
        </button>
        <button
          type="button"
          class="segmented-option"
          :class="{ 'is-active': typography[font] === 'serif' }"
          @click="typography.setFont(font, 'serif')"
        >
          {{ locale.t('typography.fontSerif') }}
        </button>
      </div>
    </div>

    <div v-if="size" class="settings-subrow">
      <span class="settings-label">{{ locale.t('typography.fontSize') }}</span>
      <div class="settings-range">
        <input
          type="range"
          :min="NUMERIC_RANGES[size].min"
          :max="NUMERIC_RANGES[size].max"
          step="1"
          :value="typography[size]"
          @input="typography.setNumeric(size, $event.target.valueAsNumber)"
        />
        <span class="settings-range-value mono">{{ typography[size] }}px</span>
      </div>
    </div>

    <div v-if="before" class="settings-subrow">
      <span class="settings-label">{{ locale.t('typography.spaceBefore') }}</span>
      <div class="settings-range">
        <input
          type="range"
          :min="NUMERIC_RANGES[before].min"
          :max="NUMERIC_RANGES[before].max"
          step="2"
          :value="typography[before]"
          @input="typography.setNumeric(before, $event.target.valueAsNumber)"
        />
        <span class="settings-range-value mono">{{ typography[before] }}px</span>
      </div>
    </div>

    <div v-if="after" class="settings-subrow">
      <span class="settings-label">{{ locale.t('typography.spaceAfter') }}</span>
      <div class="settings-range">
        <input
          type="range"
          :min="NUMERIC_RANGES[after].min"
          :max="NUMERIC_RANGES[after].max"
          step="2"
          :value="typography[after]"
          @input="typography.setNumeric(after, $event.target.valueAsNumber)"
        />
        <span class="settings-range-value mono">{{ typography[after] }}px</span>
      </div>
    </div>
  </div>
</template>
