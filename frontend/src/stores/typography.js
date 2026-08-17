import { defineStore } from 'pinia';

const STORAGE_KEY = 'pagedock-typography';

// Every "font" choice in the settings modal is one of these two stacks —
// exact order as specified, including the legacy Windows Chinese serif
// fallback names and the escaped-unicode "宋体" entry some old systems
// only recognize in that form.
export const SERIF_STACK =
  'Georgia, "Times New Roman", PMingLiu, PMingLiu-ExtB, "新細明體", SimSun, NSimSun, "宋体", "\\5b8b\\4f53", "新宋体", serif';
export const SANS_STACK =
  'Helvetica, Tahoma, Arial, "PingFang SC", "Noto Sans CJK", "Microsoft YaHei", "微软雅黑", sans-serif';

export function resolveFontStack(choice) {
  return choice === 'serif' ? SERIF_STACK : SANS_STACK;
}

// [key, min, max, default] — every size/spacing knob in the settings
// modal, all in px. Grouped by the element they belong to; see
// SettingsModal.vue's TYPOGRAPHY_GROUPS for how these render.
const NUMERIC_FIELDS = [
  ['h1Size', 20, 64, 36],
  ['h1SpaceBefore', 0, 80, 32],
  ['h1SpaceAfter', 0, 48, 8],
  ['subtitleSize', 10, 24, 14],
  ['subtitleSpaceBefore', 0, 48, 8],
  ['subtitleSpaceAfter', 0, 48, 16],
  ['rowIndexSize', 10, 20, 13],
  ['listTitleSize', 12, 28, 16],
  ['listDescSize', 10, 20, 13],
  ['tileTitleSize', 12, 28, 16],
  ['tileDescSize', 10, 20, 13],
  ['footerSize', 8, 16, 10],
];

// Every font-family choice in the settings modal — all default to the
// sans stack, matching the rest of the flat design system.
const FONT_FIELDS = [
  'h1Font',
  'subtitleFont',
  'listTitleFont',
  'listDescFont',
  'tileTitleFont',
  'tileDescFont',
  'footerFont',
];

export const NUMERIC_RANGES = Object.fromEntries(
  NUMERIC_FIELDS.map(([key, min, max, def]) => [key, { min, max, def }]),
);
export const FONT_KEYS = FONT_FIELDS;

const DEFAULTS = Object.freeze({
  ...Object.fromEntries(NUMERIC_FIELDS.map(([key, , , def]) => [key, def])),
  ...Object.fromEntries(FONT_FIELDS.map((key) => [key, 'sans'])),
});

function clampNumeric(key, value) {
  const { min, max, def } = NUMERIC_RANGES[key];
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return def;
  }
  return Math.round(Math.min(max, Math.max(min, n)));
}

function readStored() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULTS };
    }
    const parsed = JSON.parse(raw);
    const state = { ...DEFAULTS };
    NUMERIC_FIELDS.forEach(([key]) => {
      state[key] = clampNumeric(key, parsed[key]);
    });
    FONT_FIELDS.forEach((key) => {
      state[key] = parsed[key] === 'serif' ? 'serif' : 'sans';
    });
    return state;
  } catch {
    return { ...DEFAULTS };
  }
}

function persist(state) {
  try {
    const toStore = {};
    NUMERIC_FIELDS.forEach(([key]) => {
      toStore[key] = state[key];
    });
    FONT_FIELDS.forEach((key) => {
      toStore[key] = state[key];
    });
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch {
    /* localStorage unavailable — preference just won't persist */
  }
}

// Visitor-local typography preferences for the catalog page (title,
// subtitle, list/grid item text, footer) — same "local display
// preference" model as theme/display, not an admin-wide setting.
export const useTypographyStore = defineStore('typography', {
  state: () => readStored(),
  actions: {
    setNumeric(key, value) {
      if (!(key in NUMERIC_RANGES)) {
        return;
      }
      this[key] = clampNumeric(key, value);
      persist(this);
    },
    setFont(key, value) {
      if (!FONT_FIELDS.includes(key)) {
        return;
      }
      this[key] = value === 'serif' ? 'serif' : 'sans';
      persist(this);
    },
  },
});
