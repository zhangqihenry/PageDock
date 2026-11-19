<!-- PageDock's mark — pages resting above calm water (see "Logo" in
     docs/design-system.md). Drawn on a 64-unit grid; the tile and ink
     follow the active color theme, so it never needs a per-theme variant.
     Keep this geometry identical to frontend/public/favicon.svg and
     docs/assets/logo-*.svg. -->
<template>
  <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" class="brand-mark-svg">
    <rect width="64" height="64" rx="18" fill="var(--accent)" />
    <rect x="25" y="12" width="21" height="27" rx="3.5" fill="var(--accent-ink)" fill-opacity=".42" />
    <path
      d="M21.5 18H32l7 7v17.5a3.5 3.5 0 0 1-3.5 3.5h-14a3.5 3.5 0 0 1-3.5-3.5v-21a3.5 3.5 0 0 1 3.5-3.5Z"
      fill="var(--accent-ink)"
    />
    <path d="M32 18v5.5a1.5 1.5 0 0 0 1.5 1.5H39Z" fill="var(--accent)" fill-opacity=".55" />
    <path
      d="M14 52c4-2.4 8-2.4 12 0s8 2.4 12 0 8-2.4 12 0"
      fill="none"
      stroke="var(--accent-ink)"
      stroke-width="3.4"
      stroke-linecap="round"
    />
  </svg>
</template>
