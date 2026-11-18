<script setup>
import { computed } from 'vue';
import { COLOR_THEMES, useColorThemeStore } from '../stores/colorTheme.js';
import {
  GRID_COLUMNS_MAX,
  GRID_COLUMNS_MIN,
  ROW_PADDING_MAX,
  ROW_PADDING_MIN,
  TILE_HEIGHT_MAX,
  TILE_HEIGHT_MIN,
  useDisplayStore,
} from '../stores/display.js';
import { useLocaleStore } from '../stores/locale.js';
import { useThemeStore } from '../stores/theme.js';
import { useTypographyStore } from '../stores/typography.js';
import { COLOR_THEME_HUES, previewColors } from '../theme/colorThemePalette.js';
import { rangeFill, withViewTransition } from '../utils/motion.js';
import TypographySettingGroup from './TypographySettingGroup.vue';
import BaseModal from './ui/BaseModal.vue';
import Icon from './ui/Icon.vue';
import Segmented from './ui/Segmented.vue';

defineProps({
  open: { type: Boolean, default: false },
});
const emit = defineEmits(['close']);

const theme = useThemeStore();
const display = useDisplayStore();
const colorTheme = useColorThemeStore();
useTypographyStore(); // registers the store; groups below read/write it directly
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

// Typography groups, split by where they sit relative to the layout
// toggle — TOP always shows (title/subtitle/page count are above the
// list either way), TABLE/GRID are layout-specific, FOOTER always shows
// at the end. See TypographySettingGroup.vue for what each key means.
const TOP_TYPOGRAPHY_GROUPS = [
  {
    titleKey: 'typography.groupH1',
    font: 'h1Font',
    size: 'h1Size',
    before: 'h1SpaceBefore',
    after: 'h1SpaceAfter',
  },
  {
    titleKey: 'typography.groupSubtitle',
    font: 'subtitleFont',
    size: 'subtitleSize',
    before: 'subtitleSpaceBefore',
    after: 'subtitleSpaceAfter',
  },
];
const TABLE_TYPOGRAPHY_GROUPS = [
  { titleKey: 'typography.groupListIndex', size: 'rowIndexSize' },
  { titleKey: 'typography.groupListTitle', font: 'listTitleFont', size: 'listTitleSize' },
  { titleKey: 'typography.groupListDesc', font: 'listDescFont', size: 'listDescSize' },
];
const GRID_TYPOGRAPHY_GROUPS = [
  { titleKey: 'typography.groupTileTitle', font: 'tileTitleFont', size: 'tileTitleSize' },
  { titleKey: 'typography.groupTileDesc', font: 'tileDescFont', size: 'tileDescSize' },
];
const FOOTER_TYPOGRAPHY_GROUP = {
  titleKey: 'typography.groupFooter',
  font: 'footerFont',
  size: 'footerSize',
};

const themeOptions = computed(() => [
  { value: 'light', label: locale.t('displaySettings.themeLight') },
  { value: 'dark', label: locale.t('displaySettings.themeDark') },
]);
const layoutOptions = computed(() => [
  { value: 'table', label: locale.t('displaySettings.layoutTable') },
  { value: 'grid', label: locale.t('displaySettings.layoutGrid') },
]);

// Light/dark and color-theme switches repaint the whole page at once, so
// they crossfade (where the browser supports it) instead of snapping.
function setTheme(value) {
  if (theme.theme !== value) {
    withViewTransition(() => theme.toggle());
  }
}

function setColorTheme(id) {
  if (colorTheme.theme !== id) {
    withViewTransition(() => colorTheme.setTheme(id));
  }
}

function close() {
  emit('close');
}
</script>

<template>
  <BaseModal
    :open="open"
    size="md"
    :title="locale.t('displaySettings.modalTitle')"
    @close="close"
  >
    <div class="settings">
      <section class="settings-section">
        <div class="setting-row">
          <span class="setting-label">{{ locale.t('displaySettings.appearance') }}</span>
          <Segmented
            :model-value="theme.theme"
            :options="themeOptions"
            :aria-label="locale.t('displaySettings.appearance')"
            block
            @update:model-value="setTheme"
          />
        </div>
      </section>

      <section class="settings-section">
        <h3 class="settings-heading">{{ locale.t('displaySettings.colorTheme') }}</h3>
        <div class="swatches" role="group" :aria-label="locale.t('displaySettings.colorTheme')">
          <button
            v-for="opt in colorThemeOptions"
            :key="opt.id"
            type="button"
            class="swatch-item"
            :class="{ 'is-active': colorTheme.theme === opt.id }"
            :aria-pressed="colorTheme.theme === opt.id"
            :title="locale.t(opt.labelKey)"
            @click="setColorTheme(opt.id)"
          >
            <span
              class="swatch"
              :style="{ '--swatch-bg': opt.bg, '--swatch-accent': opt.accent }"
            >
              <Icon v-if="colorTheme.theme === opt.id" name="check" class="swatch-check" />
            </span>
            <span class="swatch-label">{{ locale.t(opt.labelKey) }}</span>
          </button>
        </div>
      </section>

      <section class="settings-section">
        <h3 class="settings-heading">{{ locale.t('typography.sectionTitle') }}</h3>

        <TypographySettingGroup
          v-for="group in TOP_TYPOGRAPHY_GROUPS"
          :key="group.titleKey"
          v-bind="group"
        />

        <div class="panel-inset">
          <div class="setting-row">
            <span class="setting-label">{{ locale.t('displaySettings.layout') }}</span>
            <Segmented
              :model-value="display.layout"
              :options="layoutOptions"
              :aria-label="locale.t('displaySettings.layout')"
              block
              @update:model-value="display.setLayout"
            />
          </div>

          <div v-if="display.layout === 'table'" class="setting-row">
            <label class="setting-label" for="row-padding-range">
              {{ locale.t('displaySettings.rowSpacing') }}
            </label>
            <div class="range-control">
              <span class="range-hint">{{ locale.t('displaySettings.rowSpacingCompact') }}</span>
              <input
                id="row-padding-range"
                type="range"
                :min="ROW_PADDING_MIN"
                :max="ROW_PADDING_MAX"
                step="0.125"
                :value="display.rowPadding"
                :style="{ '--range-fill': rangeFill(display.rowPadding, ROW_PADDING_MIN, ROW_PADDING_MAX) }"
                @input="display.setRowPadding($event.target.valueAsNumber)"
              />
              <span class="range-hint">{{ locale.t('displaySettings.rowSpacingSpacious') }}</span>
            </div>
          </div>

          <template v-else>
            <div class="setting-row">
              <label class="setting-label" for="grid-columns-range">
                {{ locale.t('displaySettings.columnsLabel') }}
              </label>
              <div class="range-control">
                <input
                  id="grid-columns-range"
                  type="range"
                  :min="GRID_COLUMNS_MIN"
                  :max="GRID_COLUMNS_MAX"
                  step="1"
                  :value="display.gridColumns"
                  :style="{ '--range-fill': rangeFill(display.gridColumns, GRID_COLUMNS_MIN, GRID_COLUMNS_MAX) }"
                  @input="display.setGridColumns($event.target.valueAsNumber)"
                />
                <span class="range-value mono">{{ display.gridColumns }}</span>
              </div>
            </div>

            <div class="setting-row">
              <label class="setting-label" for="tile-height-range">
                {{ locale.t('displaySettings.tileHeight') }}
              </label>
              <div class="range-control">
                <input
                  id="tile-height-range"
                  type="range"
                  :min="TILE_HEIGHT_MIN"
                  :max="TILE_HEIGHT_MAX"
                  step="10"
                  :value="display.tileHeight"
                  :style="{ '--range-fill': rangeFill(display.tileHeight, TILE_HEIGHT_MIN, TILE_HEIGHT_MAX) }"
                  @input="display.setTileHeight($event.target.valueAsNumber)"
                />
                <span class="range-value mono">{{ display.tileHeight }}px</span>
              </div>
            </div>
          </template>
        </div>

        <TypographySettingGroup
          v-for="group in display.layout === 'table' ? TABLE_TYPOGRAPHY_GROUPS : GRID_TYPOGRAPHY_GROUPS"
          :key="group.titleKey"
          v-bind="group"
        />

        <TypographySettingGroup v-bind="FOOTER_TYPOGRAPHY_GROUP" />
      </section>
    </div>
  </BaseModal>
</template>

<style scoped>
.settings {
  display: grid;
  gap: var(--space-5);
}

.settings-section {
  display: grid;
  gap: var(--space-3);
}

.settings-section + .settings-section {
  border-top: var(--border-width) solid var(--border);
  padding-top: var(--space-5);
}

.settings-heading {
  margin: 0;
  color: var(--ink-faint);
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

/* ---------- Color swatches ---------- */

.swatches {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(var(--space-16), 1fr));
  gap: var(--space-1);
  max-height: 14rem;
  margin: calc(var(--space-1) * -1);
  padding: var(--space-1);
  overflow-y: auto;
}

.swatch-item {
  display: grid;
  justify-items: center;
  gap: var(--space-1-5);
  min-width: 0;
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-0-5);
  color: var(--ink-muted);
  font-size: var(--text-2xs);
  font-weight: var(--weight-medium);
  transition: background-color var(--dur-fast) var(--ease-standard),
    color var(--dur-fast) var(--ease-standard);
}

.swatch-item:hover {
  background: var(--surface-muted);
  color: var(--ink);
}

.swatch-item.is-active {
  color: var(--ink);
  font-weight: var(--weight-semibold);
}

.swatch-item:focus-visible {
  outline-offset: calc(var(--focus-width) * -1);
}

/* Filled with that theme's real --bg and ringed with its real --accent —
   both from the same formula the theme applies, never an approximation. */
.swatch {
  display: grid;
  place-items: center;
  width: var(--space-8);
  height: var(--space-8);
  border: var(--ring-width) solid var(--swatch-accent, var(--border));
  border-radius: 50%;
  background: var(--swatch-bg, var(--surface));
  box-shadow: 0 0 0 var(--border-width) var(--border);
  color: var(--swatch-accent);
  transition: transform var(--dur-base) var(--ease-spring),
    box-shadow var(--dur-fast) var(--ease-standard);
}

.swatch-item:hover .swatch {
  transform: scale(1.08);
}

.swatch-item.is-active .swatch {
  box-shadow: 0 0 0 var(--stroke) var(--surface), 0 0 0 calc(var(--stroke) * 2) var(--ink);
}

.swatch-check {
  width: var(--icon-sm);
  height: var(--icon-sm);
  stroke-width: 3;
  animation: pop var(--dur-base) var(--ease-spring) both;
}

@keyframes pop {
  from {
    opacity: 0;
    transform: scale(0.6);
  }
}

.swatch-label {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
