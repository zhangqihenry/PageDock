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

// The plain black/white/red look — not hue-based, so it's kept as its own
// fixed pair rather than run through the formula below.
export const DEFAULT_PALETTE = {
  light: { bg: '#ffffff', accent: '#c1121f' },
  dark: { bg: '#101114', accent: '#ff6a52' },
};

// Every custom property a color theme touches — used to clear all of them
// when switching back to 'default', so no stale inline override lingers.
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

export function computePalette(hue, mode) {
  if (mode === 'dark') {
    return {
      '--bg': `hsl(${hue}, 16%, 11%)`,
      '--surface': `hsl(${hue}, 16%, 14%)`,
      '--surface-muted': `hsl(${hue}, 16%, 17%)`,
      '--surface-sunken': `hsl(${hue}, 16%, 17%)`,
      '--ink': `hsl(${hue}, 12%, 92%)`,
      '--ink-muted': `hsl(${hue}, 10%, 68%)`,
      '--ink-faint': `hsl(${hue}, 9%, 48%)`,
      '--border': `hsl(${hue}, 14%, 23%)`,
      '--border-strong': `hsl(${hue}, 12%, 92%)`,
      '--accent': `hsl(${hue}, 52%, 64%)`,
      '--accent-hover': `hsl(${hue}, 55%, 70%)`,
      '--accent-ink': `hsl(${hue}, 25%, 14%)`,
      '--accent-soft': `hsla(${hue}, 52%, 64%, 0.16)`,
      '--focus-ring': `hsla(${hue}, 52%, 64%, 0.4)`,
    };
  }
  return {
    '--bg': `hsl(${hue}, 22%, 94%)`,
    '--surface': `hsl(${hue}, 16%, 97%)`,
    '--surface-muted': `hsl(${hue}, 20%, 91%)`,
    '--surface-sunken': `hsl(${hue}, 18%, 90%)`,
    '--ink': `hsl(${hue}, 18%, 22%)`,
    '--ink-muted': `hsl(${hue}, 13%, 42%)`,
    '--ink-faint': `hsl(${hue}, 11%, 60%)`,
    '--border': `hsl(${hue}, 16%, 84%)`,
    '--border-strong': `hsl(${hue}, 18%, 22%)`,
    '--accent': `hsl(${hue}, 36%, 40%)`,
    '--accent-hover': `hsl(${hue}, 38%, 33%)`,
    '--accent-ink': '#ffffff',
    '--accent-soft': `hsla(${hue}, 36%, 40%, 0.1)`,
    '--focus-ring': `hsla(${hue}, 36%, 40%, 0.35)`,
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
