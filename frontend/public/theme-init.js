// Applied before Vue mounts so there's no flash of the wrong theme on load.
// Must stay a same-origin external file, not an inline <script> block — the
// CSP the backend sends (script-src 'self') blocks inline script execution.
(function () {
  try {
    var stored = window.localStorage.getItem('pagedock-theme');
    if (stored === 'dark' || stored === 'light') {
      document.documentElement.setAttribute('data-theme', stored);
    }
  } catch (err) {
    /* localStorage unavailable (private mode, etc.) — fall back to the
       default theme */
  }
})();
