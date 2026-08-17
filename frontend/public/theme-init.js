// Applied before Vue mounts so there's no flash of the wrong theme/color on
// load. Must stay a same-origin external file, not an inline <script>
// block — the CSP the backend sends (script-src 'self') blocks inline
// script execution. Plain script (not a module), so it can't import the
// real palette module — HUES + the hsl() formula below are a hand-kept
// copy of src/theme/colorThemePalette.js. Keep both in sync.
(function () {
  var HUES = {
    dustyrose: 0, terracotta: 10, clay: 20, caramel: 30, sand: 40,
    mustard: 50, oat: 60, olive: 70, moss: 80, matcha: 90,
    sage: 100, ashgreen: 110, pine: 120, mintgrey: 130, celadon: 140,
    bamboo: 150, lake: 160, pewter: 170, mistyteal: 180, paleblue: 190,
    mist: 200, slate: 210, indigo: 220, denim: 230, navygrey: 240,
    dusk: 250, periwinkle: 260, lavender: 270, lilac: 280, ashpurple: 290,
    grape: 300, berry: 310, rosemauve: 320, dustymauve: 330, rouge: 340,
    coral: 350,
  };

  function applyPalette(hue, mode) {
    var root = document.documentElement.style;
    var set = function (name, value) {
      root.setProperty(name, value);
    };
    if (mode === 'dark') {
      set('--bg', 'hsl(' + hue + ', 16%, 11%)');
      set('--surface', 'hsl(' + hue + ', 16%, 14%)');
      set('--surface-muted', 'hsl(' + hue + ', 16%, 17%)');
      set('--surface-sunken', 'hsl(' + hue + ', 16%, 17%)');
      set('--ink', 'hsl(' + hue + ', 12%, 92%)');
      set('--ink-muted', 'hsl(' + hue + ', 10%, 68%)');
      set('--ink-faint', 'hsl(' + hue + ', 9%, 48%)');
      set('--border', 'hsl(' + hue + ', 14%, 23%)');
      set('--border-strong', 'hsl(' + hue + ', 12%, 92%)');
      set('--accent', 'hsl(' + hue + ', 52%, 64%)');
      set('--accent-hover', 'hsl(' + hue + ', 55%, 70%)');
      set('--accent-ink', 'hsl(' + hue + ', 25%, 14%)');
      set('--accent-soft', 'hsla(' + hue + ', 52%, 64%, 0.16)');
      set('--focus-ring', 'hsla(' + hue + ', 52%, 64%, 0.4)');
    } else {
      set('--bg', 'hsl(' + hue + ', 22%, 94%)');
      set('--surface', 'hsl(' + hue + ', 16%, 97%)');
      set('--surface-muted', 'hsl(' + hue + ', 20%, 91%)');
      set('--surface-sunken', 'hsl(' + hue + ', 18%, 90%)');
      set('--ink', 'hsl(' + hue + ', 18%, 22%)');
      set('--ink-muted', 'hsl(' + hue + ', 13%, 42%)');
      set('--ink-faint', 'hsl(' + hue + ', 11%, 60%)');
      set('--border', 'hsl(' + hue + ', 16%, 84%)');
      set('--border-strong', 'hsl(' + hue + ', 18%, 22%)');
      set('--accent', 'hsl(' + hue + ', 36%, 40%)');
      set('--accent-hover', 'hsl(' + hue + ', 38%, 33%)');
      set('--accent-ink', '#ffffff');
      set('--accent-soft', 'hsla(' + hue + ', 36%, 40%, 0.1)');
      set('--focus-ring', 'hsla(' + hue + ', 36%, 40%, 0.35)');
    }
  }

  var mode = 'light';
  try {
    var storedTheme = window.localStorage.getItem('pagedock-theme');
    if (storedTheme === 'dark' || storedTheme === 'light') {
      document.documentElement.setAttribute('data-theme', storedTheme);
      mode = storedTheme;
    }
  } catch (err) {
    /* localStorage unavailable (private mode, etc.) — fall back to the
       default theme */
  }

  try {
    var storedColor = window.localStorage.getItem('pagedock-color-theme');
    if (storedColor && Object.prototype.hasOwnProperty.call(HUES, storedColor)) {
      applyPalette(HUES[storedColor], mode);
    }
  } catch (err) {
    /* localStorage unavailable — fall back to the default color theme */
  }
})();
