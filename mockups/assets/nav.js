// Unified mockup navigation — injected on every page.
// Reads data-concept ("1".."5" or "gallery") and data-page
// ("dashboard"|"builder"|"fields") from <body>, and renders one
// sticky 40px bar: concept switcher + page switcher + gallery link.
(function () {
  var SLUG = { '2': 'command', '3': 'workspace', '4': 'bento', '5': 'console' };
  var CONCEPTS = [
    { id: '1', label: 'Sidebar' },
    { id: '2', label: 'Command' },
    { id: '3', label: 'Workspace' },
    { id: '4', label: 'Bento' },
    { id: '5', label: 'Console' }
  ];
  var PAGES = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'builder', label: 'Builder' },
    { id: 'fields', label: 'Field Library' }
  ];

  var inConcepts = location.pathname.indexOf('/concepts/') !== -1;
  function up(p) { return (inConcepts ? '../' : '') + p; }

  // URL of a given concept + page. Concept 1 lives at mockups root
  // (dashboard.html…); concepts 2-5 live in concepts/.
  function href(conceptId, page) {
    page = page || 'dashboard';
    if (conceptId === '1') return up(page + '.html');
    var file = 'concept-' + conceptId + '-' + SLUG[conceptId] + '-' + page + '.html';
    return (inConcepts ? '' : 'concepts/') + file;
  }

  var curConcept = document.body.getAttribute('data-concept') || 'gallery';
  var curPage = document.body.getAttribute('data-page') || 'dashboard';
  var isGallery = curConcept === 'gallery';

  // styles
  var css = '\
.ntpnav{position:sticky;top:0;z-index:9000;display:flex;align-items:center;gap:14px;height:40px;padding:0 14px;\
  background:#0b0c10;color:#c7ccd6;font:600 12.5px/1 "Inter",system-ui,sans-serif;border-bottom:1px solid #1c1f27}\
.ntpnav .nb{display:flex;align-items:center;gap:8px;font-weight:700;color:#fff}\
.ntpnav .nb .d{width:9px;height:9px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#0f9b8e)}\
.ntpnav .grp{display:flex;align-items:center;gap:2px;background:#15171d;border-radius:8px;padding:3px}\
.ntpnav .grp.pages{background:#101b1a}\
.ntpnav a{padding:5px 10px;border-radius:6px;color:#9aa1ad;text-decoration:none;white-space:nowrap}\
.ntpnav a:hover{background:#22252e;color:#fff}\
.ntpnav a.on{background:#2d3140;color:#fff}\
.ntpnav .grp.pages a.on{background:#0f9b8e;color:#04130f}\
.ntpnav .lbl{color:#5b616d;font-weight:700;text-transform:uppercase;letter-spacing:.06em;font-size:10px}\
.ntpnav .sp{flex:1}\
.ntpnav .gal{padding:5px 11px;border-radius:7px;border:1px solid #2a2e38;color:#c7ccd6}\
.ntpnav .gal:hover{background:#22252e;color:#fff}\
@media(max-width:920px){.ntpnav .lbl{display:none}.ntpnav a{padding:5px 8px}}\
.mockbar,.conceptbar{display:none!important}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  // build
  var conceptLinks = CONCEPTS.map(function (c) {
    var on = c.id === curConcept ? ' on' : '';
    return '<a class="cc' + on + '" href="' + href(c.id, isGallery ? 'dashboard' : curPage) + '">' +
      '<b style="color:inherit;font-weight:800">' + c.id + '</b> ' + c.label + '</a>';
  }).join('');

  var pageGroup = '';
  if (!isGallery) {
    var pageLinks = PAGES.map(function (p) {
      var on = p.id === curPage ? ' on' : '';
      return '<a class="' + on.trim() + '" href="' + href(curConcept, p.id) + '">' + p.label + '</a>';
    }).join('');
    pageGroup = '<span class="lbl">Pages</span><div class="grp pages">' + pageLinks + '</div>';
  }

  var bar = document.createElement('div');
  bar.className = 'ntpnav';
  bar.innerHTML =
    '<span class="nb"><span class="d"></span>Tracewell · Mockups</span>' +
    '<span class="lbl">Concept</span><div class="grp">' + conceptLinks + '</div>' +
    pageGroup +
    '<span class="sp"></span>' +
    '<a class="gal" href="' + up('concepts.html') + '">▦ All concepts</a>';

  document.body.insertBefore(bar, document.body.firstChild);
})();
