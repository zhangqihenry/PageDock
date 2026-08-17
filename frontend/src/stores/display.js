import { defineStore } from 'pinia';

const STORAGE_KEY = 'pagedock-display';

export const ROW_PADDING_MIN = 0.5;
export const ROW_PADDING_MAX = 2;
export const ROW_PADDING_DEFAULT = 1.125;
export const GRID_COLUMNS_MIN = 2;
export const GRID_COLUMNS_MAX = 5;
export const GRID_COLUMNS_DEFAULT = 3;
export const TILE_HEIGHT_MIN = 200;
export const TILE_HEIGHT_MAX = 700;
export const TILE_HEIGHT_DEFAULT = 500;

const DEFAULTS = Object.freeze({
  layout: 'grid',
  rowPadding: ROW_PADDING_DEFAULT,
  gridColumns: GRID_COLUMNS_DEFAULT,
  tileHeight: TILE_HEIGHT_DEFAULT,
});

function clamp(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, n));
}

function readStored() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULTS };
    }
    const parsed = JSON.parse(raw);
    return {
      layout: parsed.layout === 'table' ? 'table' : 'grid',
      rowPadding: clamp(
        parsed.rowPadding,
        ROW_PADDING_MIN,
        ROW_PADDING_MAX,
        DEFAULTS.rowPadding,
      ),
      gridColumns: Math.round(
        clamp(
          parsed.gridColumns,
          GRID_COLUMNS_MIN,
          GRID_COLUMNS_MAX,
          DEFAULTS.gridColumns,
        ),
      ),
      tileHeight: Math.round(
        clamp(parsed.tileHeight, TILE_HEIGHT_MIN, TILE_HEIGHT_MAX, DEFAULTS.tileHeight),
      ),
    };
  } catch {
    return { ...DEFAULTS };
  }
}

function persist(state) {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        layout: state.layout,
        rowPadding: state.rowPadding,
        gridColumns: state.gridColumns,
        tileHeight: state.tileHeight,
      }),
    );
  } catch {
    /* localStorage unavailable — preference just won't persist */
  }
}

// How each visitor prefers to browse the catalog — list vs. grid, and a
// density knob for whichever is active. Purely a local display preference
// (like the theme toggle), not something the admin configures site-wide.
export const useDisplayStore = defineStore('display', {
  state: () => readStored(),
  actions: {
    setLayout(layout) {
      this.layout = layout === 'table' ? 'table' : 'grid';
      persist(this);
    },
    setRowPadding(value) {
      this.rowPadding = clamp(
        value,
        ROW_PADDING_MIN,
        ROW_PADDING_MAX,
        ROW_PADDING_DEFAULT,
      );
      persist(this);
    },
    setGridColumns(value) {
      this.gridColumns = Math.round(
        clamp(value, GRID_COLUMNS_MIN, GRID_COLUMNS_MAX, GRID_COLUMNS_DEFAULT),
      );
      persist(this);
    },
    setTileHeight(value) {
      this.tileHeight = Math.round(
        clamp(value, TILE_HEIGHT_MIN, TILE_HEIGHT_MAX, TILE_HEIGHT_DEFAULT),
      );
      persist(this);
    },
  },
});
