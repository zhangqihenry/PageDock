// Motion helpers shared by components (docs/design-system.md, "Motion").
// CSS handles almost everything through the duration tokens, which
// collapse under prefers-reduced-motion; this file only covers the bits
// that start from JavaScript.

export function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
}

// Crossfades the whole page across a sudden global change (light/dark,
// color theme) with the View Transitions API where available. Falls back
// to applying the change directly — never blocks it.
export function withViewTransition(update) {
  if (prefersReducedMotion() || typeof document.startViewTransition !== 'function') {
    update();
    return;
  }
  document.startViewTransition(update);
}

// Percentage of a range input's track to paint as "filled" — fed to the
// --range-fill custom property the shared range styles read.
export function rangeFill(value, min, max) {
  const span = Number(max) - Number(min);
  if (!(span > 0)) {
    return '0%';
  }
  const ratio = (Number(value) - Number(min)) / span;
  return `${Math.min(100, Math.max(0, ratio * 100))}%`;
}
