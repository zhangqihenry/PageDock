(function () {
  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      window.localStorage.setItem('pagedock-theme', theme);
    } catch (err) {
      /* localStorage unavailable — theme just won't persist */
    }
  }

  document.addEventListener('click', function (event) {
    var toggle = event.target.closest('[data-theme-toggle]');
    if (!toggle) return;
    setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
  });
})();
