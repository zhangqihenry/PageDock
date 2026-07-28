(function () {
  try {
    var stored = window.localStorage.getItem('pagedock-theme');
    if (stored === 'dark' || stored === 'light') {
      document.documentElement.setAttribute('data-theme', stored);
    }
  } catch (err) {
    /* localStorage unavailable (private mode, etc.) — fall back to default theme */
  }
})();
