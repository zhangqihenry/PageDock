// Data + formula shared by the color-theme store (applies it to the page)
// and SettingsModal (previews it on each swatch) — one source of truth, so
// a swatch's color can never drift from what selecting it actually looks
// like. Every theme is just a hue; light/dark both run the same recipe
// (see computePalette) so all ~36 themes keep the same contrast
// relationships as each other and as the plain default look.
//
// IMPORTANT: public/theme-init.js re-implements this same table + formula
// in plain (non-module) JS so it can apply the stored theme before Vue
// mounts, without a flash of the wrong color. Keep both in sync.
export const COLOR_THEME_HUES = [
  { id: 'dustyrose', hue: 0 },
  { id: 'terracotta', hue: 10 },
  { id: 'clay', hue: 20 },
  { id: 'caramel', hue: 30 },
  { id: 'sand', hue: 40 },
  { id: 'mustard', hue: 50 },
  { id: 'oat', hue: 60 },
  { id: 'olive', hue: 70 },
  { id: 'moss', hue: 80 },
  { id: 'matcha', hue: 90 },
  { id: 'sage', hue: 100 },
  { id: 'ashgreen', hue: 110 },
  { id: 'pine', hue: 120 },
  { id: 'mintgrey', hue: 130 },
  { id: 'celadon', hue: 140 },
  { id: 'bamboo', hue: 150 },
  { id: 'lake', hue: 160 },
  { id: 'pewter', hue: 170 },
  { id: 'mistyteal', hue: 180 },
  { id: 'paleblue', hue: 190 },
  { id: 'mist', hue: 200 },
  { id: 'slate', hue: 210 },
  { id: 'indigo', hue: 220 },
  { id: 'denim', hue: 230 },
  { id: 'navygrey', hue: 240 },
  { id: 'dusk', hue: 250 },
  { id: 'periwinkle', hue: 260 },
  { id: 'lavender', hue: 270 },
  { id: 'lilac', hue: 280 },
  { id: 'ashpurple', hue: 290 },
  { id: 'grape', hue: 300 },
  { id: 'berry', hue: 310 },
  { id: 'rosemauve', hue: 320 },
  { id: 'dustymauve', hue: 330 },
  { id: 'rouge', hue: 340 },
  { id: 'coral', hue: 350 },
];

// The plain neutral look with the red accent — not hue-based, so it's kept
// as its own fixed pair rather than run through the formula below. These
// two values must match --bg/--accent in assets/tokens.css.
export const DEFAULT_PALETTE = {
  light: { bg: '#fafaf9', accent: '#c1121f' },
  dark: { bg: '#0e0f12', accent: '#ff6a52' },
};

// Every custom property a color theme touches — used to clear all of them
// when switching back to 'default', so no stale inline override lingers.
// These are exactly the keys marked [T] in assets/tokens.css; everything
// else (status colors, shadows, derived glass/glow) is never themed.
export const PALETTE_KEYS = [
  '--bg',
  '--surface',
  '--surface-muted',
  '--surface-sunken',
  '--ink',
  '--ink-muted',
  '--ink-faint',
  '--border',
  '--border-strong',
  '--accent',
  '--accent-hover',
  '--accent-ink',
  '--accent-soft',
  '--focus-ring',
];

// "静泊 Quiet Dock" recipe (docs/design-system.md, "Color themes"): the hue
// only tints — neutrals stay low-saturation so every one of the 36 themes
// keeps the same contrast steps as the default look; only the accent
// carries real chroma.
export function computePalette(hue, mode) {
  if (mode === 'dark') {
    return {
      '--bg': `hsl(${hue}, 14%, 7%)`,
      '--surface': `hsl(${hue}, 13%, 10.5%)`,
      '--surface-muted': `hsl(${hue}, 12%, 14.5%)`,
      '--surface-sunken': `hsl(${hue}, 14%, 5.5%)`,
      '--ink': `hsl(${hue}, 14%, 94%)`,
      '--ink-muted': `hsl(${hue}, 9%, 68%)`,
      '--ink-faint': `hsl(${hue}, 7%, 49%)`,
      '--border': `hsl(${hue}, 11%, 17%)`,
      '--border-strong': `hsl(${hue}, 9%, 27%)`,
      '--accent': `hsl(${hue}, 62%, 72%)`,
      '--accent-hover': `hsl(${hue}, 70%, 79%)`,
      '--accent-ink': `hsl(${hue}, 35%, 10%)`,
      '--accent-soft': `hsla(${hue}, 62%, 72%, 0.13)`,
      '--focus-ring': `hsla(${hue}, 62%, 72%, 0.42)`,
    };
  }
  return {
    '--bg': `hsl(${hue}, 24%, 97.5%)`,
    '--surface': `hsl(${hue}, 30%, 99.6%)`,
    '--surface-muted': `hsl(${hue}, 20%, 94.5%)`,
    '--surface-sunken': `hsl(${hue}, 20%, 95.5%)`,
    '--ink': `hsl(${hue}, 22%, 13%)`,
    '--ink-muted': `hsl(${hue}, 9%, 38%)`,
    '--ink-faint': `hsl(${hue}, 7%, 54%)`,
    '--border': `hsl(${hue}, 16%, 90%)`,
    '--border-strong': `hsl(${hue}, 12%, 79%)`,
    '--accent': `hsl(${hue}, 44%, 40%)`,
    '--accent-hover': `hsl(${hue}, 48%, 33%)`,
    '--accent-ink': '#ffffff',
    '--accent-soft': `hsla(${hue}, 44%, 40%, 0.09)`,
    '--focus-ring': `hsla(${hue}, 60%, 48%, 0.32)`,
  };
}

// bg/accent preview used by a swatch — a small subset of computePalette()
// (or DEFAULT_PALETTE for 'default'), always matching the real applied
// values exactly since it's the same data and the same formula.
export function previewColors(id, hue, mode) {
  if (id === 'default') {
    return DEFAULT_PALETTE[mode];
  }
  const palette = computePalette(hue, mode);
  return { bg: palette['--bg'], accent: palette['--accent'] };
}
