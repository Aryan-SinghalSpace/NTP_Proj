// Mockup chrome: theme toggle + active-nav, shared across all screens.
(function () {
  var KEY = 'ntp-mock-theme-v2';
  var VALID = { signature: 1, clean: 1, warm: 1 };
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  var theme = (saved && VALID[saved]) ? saved : 'signature';

  function apply(t) {
    document.documentElement.className = 'theme-' + t;
    try { localStorage.setItem(KEY, t); } catch (e) {}
    document.querySelectorAll('.seg button[data-theme]').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-theme') === t);
    });
  }

  // Apply ASAP (class is also set inline in <html> to avoid flash).
  apply(theme);

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.seg button[data-theme]');
    if (btn) apply(btn.getAttribute('data-theme'));
  });

  // Highlight current screen in the mock toolbar.
  document.addEventListener('DOMContentLoaded', function () {
    var file = (location.pathname.split('/').pop() || 'index.html');
    document.querySelectorAll('.mb-nav a').forEach(function (a) {
      var href = a.getAttribute('href');
      a.classList.toggle('active', href === file);
    });
  });
})();
