<script setup>
import { computed } from 'vue';
import { COLOR_THEMES, useColorThemeStore } from '../stores/colorTheme.js';
import {
  GRID_COLUMNS_MAX,
  GRID_COLUMNS_MIN,
  ROW_PADDING_MAX,
  ROW_PADDING_MIN,
  useDisplayStore,
} from '../stores/display.js';
import { useLocaleStore } from '../stores/locale.js';
import { useThemeStore } from '../stores/theme.js';
import { COLOR_THEME_HUES, previewColors } from '../theme/colorThemePalette.js';

defineProps({
  open: { type: Boolean, default: false },
});
const emit = defineEmits(['close']);

const theme = useThemeStore();
const display = useDisplayStore();
const colorTheme = useColorThemeStore();
const locale = useLocaleStore();

const HUE_BY_ID = Object.fromEntries(COLOR_THEME_HUES.map((entry) => [entry.id, entry.hue]));

// Each swatch's bg/accent come from previewColors(), the exact same
// formula the store applies to the real page — never an approximation —
// and recompute whenever the light/dark mode changes, since a color
// theme's dark variant isn't just its light one darkened.
const colorThemeOptions = computed(() =>
  COLOR_THEMES.map((id) => {
    const { bg, accent } = previewColors(id, HUE_BY_ID[id], theme.theme);
    return { id, bg, accent, labelKey: `colorTheme.${id}` };
  }),
);

function setTheme(value) {
  if (theme.theme !== value) {
    theme.toggle();
  }
}

function close() {
  emit('close');
}

function onKeydown(event) {
  if (event.key === 'Escape') {
    close();
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="modal-backdrop"
      @click.self="close"
      @keydown="onKeydown"
    >
      <div
        class="modal-card card settings-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
      >
        <button
          type="button"
          class="icon-button modal-close"
          :aria-label="locale.t('common.cancel')"
          @click="close"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <h2 id="settings-modal-title">{{ locale.t('displaySettings.modalTitle') }}</h2>

        <div class="settings-section">
          <span class="settings-label">{{ locale.t('displaySettings.appearance') }}</span>
          <div class="segmented" role="group">
            <button
              type="button"
              class="segmented-option"
              :class="{ 'is-active': theme.theme === 'light' }"
              @click="setTheme('light')"
            >
              {{ locale.t('displaySettings.themeLight') }}
            </button>
            <button
              type="button"
              class="segmented-option"
              :class="{ 'is-active': theme.theme === 'dark' }"
              @click="setTheme('dark')"
            >
              {{ locale.t('displaySettings.themeDark') }}
            </button>
          </div>
        </div>

        <div class="settings-section">
          <span class="settings-label">{{ locale.t('displaySettings.colorTheme') }}</span>
          <div class="swatch-row" role="group">
            <button
              v-for="opt in colorThemeOptions"
              :key="opt.id"
              type="button"
              class="swatch-item"
              :class="{ 'is-active': colorTheme.theme === opt.id }"
              :aria-pressed="colorTheme.theme === opt.id"
              :title="locale.t(opt.labelKey)"
              @click="colorTheme.setTheme(opt.id)"
            >
              <span
                class="swatch"
                :style="{ '--swatch-bg': opt.bg, '--swatch-accent': opt.accent }"
              ></span>
              <span class="swatch-label">{{ locale.t(opt.labelKey) }}</span>
            </button>
          </div>
        </div>

        <div class="settings-section">
          <span class="settings-label">{{ locale.t('displaySettings.layout') }}</span>
          <div class="segmented" role="group">
            <button
              type="button"
              class="segmented-option"
              :class="{ 'is-active': display.layout === 'table' }"
              @click="display.setLayout('table')"
            >
              {{ locale.t('displaySettings.layoutTable') }}
            </button>
            <button
              type="button"
              class="segmented-option"
              :class="{ 'is-active': display.layout === 'grid' }"
              @click="display.setLayout('grid')"
            >
              {{ locale.t('displaySettings.layoutGrid') }}
            </button>
          </div>
        </div>

        <div v-if="display.layout === 'table'" class="settings-section">
          <label class="settings-label" for="row-padding-range">
            {{ locale.t('displaySettings.rowSpacing') }}
          </label>
          <div class="settings-range">
            <span class="settings-range-hint">{{
              locale.t('displaySettings.rowSpacingCompact')
            }}</span>
            <input
              id="row-padding-range"
              type="range"
              :min="ROW_PADDING_MIN"
              :max="ROW_PADDING_MAX"
              step="0.125"
              :value="display.rowPadding"
              @input="display.setRowPadding($event.target.valueAsNumber)"
            />
            <span class="settings-range-hint">{{
              locale.t('displaySettings.rowSpacingSpacious')
            }}</span>
          </div>
        </div>

        <div v-else class="settings-section">
          <label class="settings-label" for="grid-columns-range">
            {{ locale.t('displaySettings.columnsLabel') }}
          </label>
          <div class="settings-range">
            <input
              id="grid-columns-range"
              type="range"
              :min="GRID_COLUMNS_MIN"
              :max="GRID_COLUMNS_MAX"
              step="1"
              :value="display.gridColumns"
              @input="display.setGridColumns($event.target.valueAsNumber)"
            />
            <span class="settings-range-value mono">{{ display.gridColumns }}</span>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
