/* Yoga-Kursplaner – Oberfläche, Speicherung, Aktionen */
const KEY = 'yogaplaner.v1';
const $ = s => document.querySelector(s);
const todayIso = () => new Date().toISOString().slice(0, 10);

function defaults() { return { v: 1, courses: [], ratings: {}, customEx: [], exEdits: {}, vocab: {}, sequences: seqDefaults(), seqImp: [], songs: songDefaults(), textTpl: [], settings: { apiKey: '', model: 'claude-sonnet-5-5', email: '', recipients: [] } }; }
function loadState() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && Array.isArray(s.courses)) return Object.assign(defaults(), s, { settings: Object.assign(defaults().settings, s.settings || {}) }); } catch (e) { }
  return defaults();
}
let state = loadState(), saveT;
function save() {
  clearTimeout(saveT);
  saveT = setTimeout(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      // Google Sheets Backup
      if (typeof saveToGoogleSheets === 'function' && state.courses && state.courses.length > 0) {
        state.courses.forEach(course => {
          if (course.sessions) {
            course.sessions.forEach(session => {
              saveToGoogleSheets(
                course.name + ' - ' + (session.name || 'Sitzung'),
                course.level || 'gemischt',
                course.motto?.preset || 'Allgemein',
                JSON.stringify({ course: course.name, session: session.name, total: session.T })
              );
            });
          }
        });
      }
    } catch (e) { toast('Speichern im Browser nicht möglich – bitte Backup herunterladen.'); }
  }, 150);
}
const ui = {
  view: 'courses', courseId: null, tab: 'plan', open: new Set(['set', 'ovw']), sel: null, bopen: new Set(),
  doc: { ueb: true, std: true, blatt: true, blatt2: false, alt: false, uebw: false, detail: false, spick: false, hands: false, detS: false, mat: false, geb: false, katall: false, anaS: false, anaP: false, sel: 'all' },
  cat: { q: '', cat: '', lvl: '', geb: '', st: '', k_reg: '', k_mus: '', k_atm: '', k_auf: '', k_sup: '', k_mat: '', k_pos: '', k_dir: '', k_wirk: '', k_en: '', k_chakra: '', k_ziel: '' }, exOpen: new Set(),
  newEx: { n: '', c: 'stand', lv: 1, m: 2, pose: 'stand', tags: '', x: [], e: '' },
  exEdit: null, exDraft: null, exDraftKat: {}, exDraftAuto: [], exDraftAll: false
};
const cur = () => state.courses.find(c => c.id === ui.courseId);
// Vorgaben-Felder im Entwurf der KI-generierten Stunde (Präfix „a:“, Container mit data-aid) wirken auf ui.aiGen.c statt auf das geöffnete Programm
const aiDraftC = () => (ui.aiGen && ui.aiGen.c) || null;
const frameC = el => (el && el.closest && el.closest('[data-aid]') && aiDraftC()) || cur();
const idxOf = (c, s) => c.sessions.indexOf(s);

// ---------- Programm-Objekte (Programm = alle Einzelstunden, Rahmen = Vorgaben des Programms) ----------
function defaultCourse(over) {
  return Object.assign({
    id: uid(), name: 'Neues Programm', created: todayIso(), count: 10, start: todayIso(), rhythm: 'weekly', days: [], pauses: '', durMode: 'einzeln', total: 75, durs: splitTotal(75), st: [], reg: [],
    status: 'vorgeplant', bm: {}, level: 'sen', breath: 'gemischt', kraft: true, kraftN: 1, mantra: 'immer', mobi: 'sitz', shakti: 0, shaktiMode: 'aus', einlOn: 1, schlussOn: 1, shavaOn: 1, ausglOn: 1, gebrechen: [], showAlt: false, email: state.settings.email || '',
    motto: { einzel: 'keine', mode: '', preset: 'alltag', free: '', eigen: '' }, seed: Math.floor(Math.random() * 1e9), sessions: [], dirty: false, template: false
  }, over || {});
}
function defaultCourseFixed(over) { const c = defaultCourse(over); if (over && over.durs) { if (!(over.total > 0)) c.total = durKeys(c).reduce((x, k) => x + (+c.durs[k] || 0), 0); fitDurs(c, 'norm'); } else { c.durs = splitTotal(c.total); fitDurs(c, 'total'); } return c; }
const BUILTIN = [
  { name: 'Senioren Herbst–Winter (15 Stunden, nach Vorlage)', over: { count: 15, start: '2026-09-22', pauses: '27.10.2026; 22.12.2026 bis 05.01.2027', level: 'sen', total: 75, breath: 'gemischt', kraft: true, motto: { einzel: 'auto', mode: 'uebermotto', preset: 'herbstwinter', free: '', eigen: '' } } },
  { name: 'Anfänger Frühling (10 Stunden)', over: { count: 10, level: 'anf', total: 60, breath: 'atem', kraft: false, motto: { einzel: 'auto', mode: 'uebermotto', preset: 'fruehling', free: '', eigen: '' } } },
  { name: 'Gemischte Gruppe Sommer (10 Stunden)', over: { count: 10, level: 'gemischt', total: 75, breath: 'atem_wahr', kraft: true, showAlt: true, motto: { einzel: 'auto', mode: 'uebermotto', preset: 'sommer', free: '', eigen: '' } } }
];
function cloneCourse(src, over) {
  const c = JSON.parse(JSON.stringify(src));
  c.id = uid(); c.sessions.forEach(s => { s.id = uid(); });
  return Object.assign(c, over || {});
}

// ---------- Helfer ----------
const getP = (o, p) => p.split('.').reduce((a, k) => a == null ? a : a[k], o);
function setP(o, p, v) { const ks = p.split('.'), last = ks.pop(); ks.reduce((a, k) => a[k] == null ? (a[k] = {}) : a[k], o)[last] = v; }
function resolve(f) {
  const p = f.split(':');
  if (p[0] === 'c') return { o: cur(), p: p.slice(1).join(':') };
  if (p[0] === 'a') return { o: aiDraftC(), p: p.slice(1).join(':') };
  if (p[0] === 's') { const c = cur(); return { o: c && c.sessions.find(x => x.id === p[1]), p: p.slice(2).join(':') }; }
  if (p[0] === 'u') return { o: ui, p: p[1] };
  if (p[0] === 'g') return { o: state.settings, p: p[1] };
  return {};
}
const opt = (v, l, cur_) => `<option value="${esc(v)}"${String(v) === String(cur_) ? ' selected' : ''}>${esc(l)}</option>`;
function sel(f, opts, cur_, extra) { return `<select data-f="${f}" ${extra || ''}>${opts.map(o => opt(o[0], o[1], cur_)).join('')}</select>`; }
function inp(f, type, v, extra) { const i = `<input type="${type}" data-f="${f}" value="${esc(v)}" ${type === 'number' ? 'data-num="1"' : ''} ${extra || ''}>`; return type === 'date' ? `<span class="dwrap"><span class="wdl">${esc(WDAY[(parseDate(v) || { getUTCDay: () => -1 }).getUTCDay()] || '')}</span>${i}</span>` : i; }
// Wochentag neben Datumsfeldern aktuell halten
document.addEventListener('change', e => { const t = e.target; if (t && t.type === 'date' && t.previousElementSibling && t.previousElementSibling.classList.contains('wdl')) { const d = parseDate(t.value); t.previousElementSibling.textContent = d ? WDAY[d.getUTCDay()] : ''; } }, true);
const fld = (l, h, cls) => `<div class="fld ${cls || ''}"><label>${l}</label>${h}</div>`;
function toast(msg, ms) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), ms || 3500); }
function download(name, text, mime) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: mime || 'text/plain' })); a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
// Sicherheitsabfrage ohne Browser-Dialog (confirm() wird in manchen Umgebungen unterdrückt): erster Klick scharf schalten, zweiter Klick bestätigt
let armed = { key: null, timer: null, el: null, html: '' };
function disarm() { clearTimeout(armed.timer); if (armed.el && document.contains(armed.el)) { armed.el.innerHTML = armed.html; armed.el.classList.remove('armed'); } armed = { key: null, timer: null, el: null, html: '' }; }
function confirmTwice(el, key, msg, label) {
  if (armed.key === key) { disarm(); return true; }
  disarm(); armed.key = key;
  if (el && el.tagName === 'BUTTON') { armed.el = el; armed.html = el.innerHTML; el.textContent = label || '⚠ Wirklich löschen?'; el.classList.add('armed'); }
  toast(msg + ' – zur Bestätigung nochmal klicken.', 4500);
  armed.timer = setTimeout(disarm, 4500); return false;
}
const fileName = s => s.replace(/[^\wäöüÄÖÜß\- ]+/g, '').trim().replace(/\s+/g, '_') || 'Kurs';

// ---------- Views ----------
function render() {
  const y = window.scrollY, f = document.activeElement, fk = f && f.dataset && f.dataset.f, pos = f && f.selectionStart;
  let body = '';
  if (ui.view === 'courses') body = viewCourses();
  else if (ui.view === 'course' && cur()) body = viewCourse(cur());
  else if (ui.view === 'singles') body = viewSingles();
  else if (ui.view === 'catalog') body = viewCatalog();
  else if (ui.view === 'sequences') body = viewSequences();
  else if (ui.view === 'player') body = viewPlayers(ui.plTab === 'playDet' ? 'playDet' : 'playMin');
  else if (ui.view === 'seqcat') body = viewSeqCatalog();
  else if (ui.view === 'mantras') body = viewMantras();
  else if (ui.view === 'songs') body = viewSongs();
  else if (ui.view === 'texts') body = viewTexts();
  else if (ui.view === 'email') body = renderEmailView();
  else if (ui.view === 'settings') body = viewSettings();
  else { ui.view = 'courses'; body = viewCourses(); }
  $('#app').innerHTML = nav() + '<main>' + body + '</main>';
  if (ui.view === 'course' && ui.tab === 'doc') { const dp = document.getElementById('docPreview'); if (dp) { try { paginateDoc(dp); } catch (e) { console.error(e); } } }
  hlAll();
  window.scrollTo(0, y);
  if (fk && f.dataset.live) { const n = document.querySelector(`[data-f="${fk}"]`); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) { } } }
}
// Schlüsselwörter im Editor farbig hinterlegen (Spiegel-Ebene hinter dem Textfeld)
function hlUpdate(ta) {
  const bd = ta.previousElementSibling; if (!bd || !bd.classList.contains('hlbd')) return;
  if (ta.offsetParent === null) return; // ausgeblendet (zugeklappt): wird beim Aufklappen neu berechnet
  ta.style.overflow = 'hidden'; ta.style.resize = 'none'; ta.style.height = 'auto'; ta.style.height = (ta.scrollHeight + 4) + 'px'; // Textfeld wächst mit dem Text – kein Scrollen
  const cs = getComputedStyle(ta), sObj = ta.dataset.sid && (() => { try { return sessionOf(ta.dataset.sid).s; } catch (e) { return null; } })();
  ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'borderTopWidth', 'borderLeftWidth', 'textAlign'].forEach(p => { bd.style[p] = cs[p]; });
  bd.style.borderStyle = 'solid'; bd.style.borderColor = 'transparent'; bd.style.borderRightWidth = cs.borderRightWidth; bd.style.borderBottomWidth = cs.borderBottomWidth;
  bd.style.width = ta.offsetWidth + 'px'; bd.style.height = ta.offsetHeight + 'px';
  bd.innerHTML = kwHtml(ta.value, sObj, '<mark>', '</mark>') + '\n'; bd.scrollTop = ta.scrollTop;
}
function hlAll() { document.querySelectorAll('.hlw textarea').forEach(hlUpdate); }
document.addEventListener('input', e => { if (e.target && e.target.matches && e.target.matches('.hlw textarea')) hlUpdate(e.target); }, true);
window.addEventListener('resize', () => { clearTimeout(hlAll.t); hlAll.t = setTimeout(hlAll, 120); });
document.addEventListener('scroll', e => { const t = e.target; if (t && t.matches && t.matches('.hlw textarea') && t.previousElementSibling) t.previousElementSibling.scrollTop = t.scrollTop; }, true);
function refreshFields() {
  document.querySelectorAll('[data-f]').forEach(el => {
    if (el === document.activeElement) return;
    const r = resolve(el.dataset.f); if (!r.o) return; const v = getP(r.o, r.p);
    if (el.type === 'checkbox') el.checked = !!v; else if (el.type === 'radio') el.checked = String(v) === el.value; else el.value = v == null ? '' : v;
  });
  hlAll();
  const b = $('#dirtyBanner'); if (b && cur()) b.classList.toggle('hide', !cur().dirty);
  const c = cur(); if (c) c.sessions.forEach(s => { const t = $('#tot-' + s.id); if (t) t.textContent = sessionTotal(s); });
  document.querySelectorAll('.tw[data-twk]').forEach(n => { const s = c && c.sessions.find(x => x.id === n.dataset.sid); if (s) n.textContent = twText(s, n.dataset.twk); });
}
// Piktogramme der Kopfzeile (Linien-Symbole)
const HI = {
  textvorl: '<path d="M6 3.5h8.5L18 7v13.5H6z"/><path d="M14 3.5V7h4"/><path d="M9 11.5h6M9 14.5h6M9 17.5h3.5"/>',
  prog: '<path d="M4 6h16v13H4z"/><path d="M4 10h16M8 3v4M16 3v4"/><path d="M8 14h3M13 14h3"/>',
  player: '<circle cx="12" cy="12" r="8.5"/><path d="M10 8.5v7l5.5-3.5z"/>',
  stunde: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2"/>',
  katalog: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  rahmen: '<path d="M5 7h9M18 7h1M5 17h2M11 17h8M5 12h5M14 12h5"/><circle cx="16" cy="7" r="2"/><circle cx="9" cy="17" r="2"/><circle cx="12" cy="12" r="2"/>',
  plan: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6l1.2 1.2L7 5M4 12l1.2 1.2L7 11M4 18l1.2 1.2L7 17"/>',
  ausgabe: '<path d="M7 9V4h10v5"/><rect x="4" y="9" width="16" height="8" rx="2"/><path d="M7 14h10v6H7z"/>',
  uebersicht: '<rect x="4" y="5" width="16" height="4" rx="1"/><rect x="4" y="11" width="16" height="4" rx="1"/><path d="M4 18h10"/>',
  analyse: '<circle cx="12" cy="12" r="8"/><path d="M12 4v8l6 4"/>',
  panalyse: '<path d="M5 20V10M10 20V5M15 20v-7M20 20V8"/>',
  sequenz: '<rect x="3.5" y="5" width="4.5" height="4.5" rx="1"/><rect x="10" y="5" width="4.5" height="4.5" rx="1"/><rect x="16.5" y="5" width="4" height="4.5" rx="1"/><path d="M5.5 14.5h13M5.5 19h8"/>',
  seqkat: '<path d="M4 5h6v6H4zM14 5h6v6h-6z"/><path d="M4 15h16M4 19h10"/>',
  mantra: '<path d="M4 12h2M8 8v8M12 5v14M16 8v8M20 12h-2"/>',
  lied: '<path d="M9 18V5l10-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
  email: '<path d="M4 4h16v12H4z"/><path d="M20 4l-8 5L4 4"/>',
  zahnrad: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>'
};
const hicon = k => `<svg class="hi" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${HI[k]}</svg>`;
function nav() {
  const c = ui.view === 'course' ? cur() : null, isS = isSingle(c);
  const b = (v, l, ic) => `<button class="tab${ui.view === v || (ui.view === 'course' && ((v === 'singles' && isS) || (v === 'courses' && !isS))) ? ' on' : ''}" data-a="nav" data-v="${v}">${hicon(ic)}<span>${l}</span></button>`;
  if (c && !['frame', 'sessions', 'doc', 'overview', 'sessionAn', 'programAn'].includes(ui.tab)) ui.tab = 'frame';
  if (isS && ['overview', 'programAn'].includes(ui.tab)) ui.tab = 'frame';
  const st = (v, l, n, ic) => `<button class="tab stp${ui.tab === v ? ' on' : ''}" data-a="tab" data-v="${v}"><span class="tn">${n}</span>${hicon(ic)}<span>${l}</span></button>`;
  const ov = (v, l, ic) => `<button class="tab stp ovb${ui.tab === v ? ' on' : ''}" data-a="tab" data-v="${v}">${hicon(ic)}<span>${l}</span></button>`;
  let ctx = '';
  if (c) {
    const kind = isS ? 'Einzelstunde' : 'Programm', badge = `<button class="hbadge" data-a="nav" data-v="${isS ? 'singles' : 'courses'}" title="${isS ? 'Zur Übersicht aller Einzelstunden' : 'Zur Übersicht aller Programme'}">${hicon(isS ? 'stunde' : 'prog')}<b>${kind.toUpperCase()}</b>${c.template ? '<i class="hvl">★ Vorlage</i>' : ''}<span class="hback">‹ Übersicht</span></button>`;
    const steps = isS
      ? st('frame', 'Vorgaben', 1, 'rahmen') + st('sessions', 'Einzelstundenplanung', 2, 'plan') + st('doc', 'Ausgabe / Versand', 3, 'ausgabe') + '<span class="hsep"></span>' + ov('sessionAn', 'Einzelstundenanalyse', 'analyse')
      : st('frame', 'Rahmenplanung', 1, 'rahmen') + st('sessions', 'Einzelstundenplanung', 2, 'plan') + st('doc', 'Ausgabe / Versand', 3, 'ausgabe') + '<span class="hsep"></span>' + ov('overview', 'Stundenübersicht', 'uebersicht') + ov('sessionAn', 'Einzelstundenanalyse', 'analyse') + ov('programAn', 'Programmanalyse', 'panalyse');
    ctx = `<div class="hctx ${isS ? 'is-single' : 'is-prog'}">${badge}<span class="hsteps">${steps}</span></div>`;
  }
  if (!c && (ui.view === 'courses' || ui.view === 'singles')) {
    const isP = ui.view === 'courses', cnt = n => `<i class="hcnt">${n}</i>`;
    const tab = (k, l) => `<button class="tab stp${((isP ? ui.pTab : ui.sTab) || 'list') === k ? ' on' : ''}" data-a="${isP ? 'ptab' : 'stab'}" data-v="${k}">${l}</button>`;
    const act = (k, l, extra) => `<button class="hact${((isP ? ui.pTab : ui.sTab) || 'list') === k ? ' on' : ''}" ${extra}>${l}</button>`;
    const nl = state.courses.filter(x => isP ? (!x.template && !x.single) : (x.single && !x.template)).length, nt = state.courses.filter(x => x.template && (isP ? !x.single : x.single)).length + (isP ? BUILTIN.length : 0);
    ctx = `<div class="hctx is-actions">${tab('list', (isP ? 'Vorhandene Programme' : 'Vorhandene Einzelstunden') + cnt(nl))}<span class="hsep"></span>`
      + (isP ? `<button class="hact" data-a="newCourse">＋ Neues Programm</button>${act('fromTpl', '＋ Programm aus Vorlagen' + cnt(nt), 'data-a="ptab" data-v="fromTpl"')}${act('aiProg', '✨ Programm KI-generiert', 'data-a="ptab" data-v="aiProg"')}${act('build', '＋ Programm aus Einzelstunden', 'data-a="ptab" data-v="build"')}`
        : `<button class="hact" data-a="newSingle">＋ Neue Einzelstunde</button>${act('fromTpl', '＋ Einzelstunde aus Vorlage' + cnt(nt), 'data-a="stab" data-v="fromTpl"')}<button class="hact" data-a="newEmptyTpl" title="Neue Einzelstunden-Vorlage ohne vorausgewählte Übungen anlegen">＋ Leere Vorlage</button>${act('aiGen', '✨ KI-generierte Stunde', 'data-a="stab" data-v="aiGen"')}`) + '</div>';
  }
  if (!c && ui.view === 'player') {
    const pk = ui.plTab === 'playDet' ? 'playDet' : 'playMin', pb = (k, l) => `<button class="hact${pk === k ? ' on' : ''}" data-a="plTab" data-v="${k}">${l}</button>`;
    ctx = `<div class="hctx is-actions">${pb('playMin', '▶ Minimalistischer Player')}${pb('playDet', '▶ Detailplayer')}</div>`;
  }
  return `<header class="noprint hdr${c ? (isS ? ' c-single' : ' c-prog') : ''}"><div class="hrow"><div class="brand">${LOTUS}Verenas Yoga Planomat<small class="ver" title="Programmversion">${typeof APP_VER !== 'undefined' ? APP_VER : ''}</small></div>${b('courses', 'Programme', 'prog')}${b('singles', 'Stunden', 'stunde')}${b('sequences', 'Sequenzen', 'sequenz')}${b('player', 'Player', 'player')}${b('catalog', 'Übungskatalog', 'katalog')}${b('seqcat', 'Sequenzkatalog', 'seqkat')}${b('mantras', 'Mantras', 'mantra')}${b('songs', 'Lied-Katalog', 'lied')}${b('texts', 'Textvorlagen', 'textvorl')}${b('email', 'Emails', 'email')}${c ? '<span class="hname ' + (isS ? 'is-single' : 'is-prog') + '\" title="' + esc(c.name) + '\">' + '<b>' + esc(c.name) + '</b></span>' : ''}<span class="grow"></span><button class="tab gear${ui.view === 'settings' ? ' on' : ''}" data-a="nav" data-v="settings" title="Einstellungen & Backup" aria-label="Einstellungen & Backup">${hicon('zahnrad')}</button></div>${ctx}</header>`;
}
function viewCourses() {
  const pt = ui.pTab || 'list', cs = state.courses.filter(c => !c.template && !c.single), ts = state.courses.filter(c => c.template && !c.single);
  const card = c => `<div class="card course"><div class="grow"><a class="title" data-a="open" data-id="${c.id}">${esc(c.name)}</a>
<div class="meta">${c.sessions.length} Stunden · ${esc(LEVELS[c.level])} · ${c.total || sessionTotal({ dur: c.durs })} Min.${c.start ? ' · ab ' + esc(fmtDateW(c.start)) : ''}</div></div>
<button data-a="open" data-id="${c.id}" class="primary">Öffnen</button><button data-a="dup" data-id="${c.id}" class="ghost" title="Duplizieren">⧉</button><button data-a="del" data-id="${c.id}" class="ghost danger" title="Löschen">🗑</button></div>`;
  const tcard = (t, id, builtin) => `<div class="card course"><div class="grow"><b>${esc(t.name)}</b><div class="meta">${builtin ? 'Mitgelieferte Vorlage' : 'Eigene Vorlage'} · ${t.count || t.sessions.length} Stunden</div></div>
<button data-a="tplSel" data-id="${id}" class="primary">Programm daraus erstellen</button>${builtin ? '' : `<button data-a="del" data-id="${t.id}" class="ghost danger" title="Löschen">🗑</button>`}</div>`;
  const tpls = ts.map(t => tcard(t, t.id, false)).join('') + BUILTIN.map((t, i) => tcard({ name: t.name, count: t.over.count }, 'builtin:' + i, true)).join('');
  const hero = (t, p) => `<div class="hero">${LOTUS}<div><h1>${t}</h1><p>${p}</p></div><span class="grow"></span></div>`;
  if (pt === 'tpl') return hero('Vorhandene Vorlagen', 'Fertige Programme als Ausgangspunkt – „Programm daraus erstellen“ legt ein neues Programm an.') + tplForm() + tpls;
  if (pt === 'fromTpl') return hero('Programm aus Vorlagen', 'Eine Programm-Vorlage wählen – daraus entsteht ein neues Programm (Name und Startdatum trägst du direkt auf der Seite ein).') + tplForm() + tpls;
  if (pt === 'aiProg') return viewAiProg();
  if (pt === 'build') return hero('Programm aus Einzelstunden', 'Oben die Parameter des Programms, darunter pro Stunde ein Slot: vorhandene Einzelstunde, Vorlage oder neu generierte Stunde.') + (buildPanel() || '');
  return hero('Meine Programme', 'Yogastunden in Ruhe vorplanen – Schritt für Schritt, Atemzug für Atemzug.')
    + (cs.length ? cs.map(card).join('') : '<p class="muted">Noch kein Programm angelegt. Mit „Neues Programm“ oder „Programm aus Vorlagen“ (zweite Zeile oben) startest du.</p>');
}
function viewCourse(c) {
  if (!['frame', 'sessions', 'doc', 'overview', 'sessionAn', 'programAn'].includes(ui.tab)) ui.tab = 'frame';
  const tb = (v, l, n) => `<button class="tab${ui.tab === v ? ' on' : ''}" data-a="tab" data-v="${v}"><span class="tn">${n}</span> ${l}</button>`;
  const ovBtns = ui.tab === 'overview' ? Object.keys(STATUS).map(k => { const n = c.sessions.filter(x => (x.status || 'vorgeplant') === k).length; return `<button class="stfil stp-${k}${ui.ovF === k ? ' on' : ''}" data-a="ovFilter" data-v="${k}" title="${ui.ovF === k ? 'Filter aufheben' : 'Nur Stunden mit Status „' + STATUS[k] + '“ zeigen'}">${STATUS[k]} <b>${n}</b></button>`; }).join('') : '';
  return `<div class="bar noprint">${ovBtns}<span class="grow"></span><label class="muted">Status Rahmen</label> ${statSel('c:status', c.status || 'vorgeplant')}
${ui.tab === 'frame' ? '' : '<button class="ghost" data-a="saveTpl" title="Als Vorlage speichern">★ Als Vorlage</button>'}<button class="ghost" data-a="pdf" title="Programm als PDF speichern">⬇ Als PDF speichern</button></div>${ui.tab === 'frame' ? frameView(c) : ui.tab === 'sessions' ? sessionsView(c) : ui.tab === 'sessionAn' ? viewSessionAnalysis(c) : ui.tab === 'programAn' ? viewProgramAnalysis(c) : ui.tab === 'overview' ? (c.sessions.length ? frameTable(c) : '<p class="muted">Noch keine Stunden angelegt – in der Rahmenplanung „Rahmen auf die Stunden anwenden“ klicken.</p>') : docPanel(c)}`;
}
// Stundenaufbau & Dauer (gemeinsam für die Vorgaben und die KI-Seite): P = Feldpräfix, 'c' = aktuelles Programm, 'a' = Entwurf der KI-generierten Stunde
const selC = (chg, opts, cur_, extra) => `<select data-chg="${chg}" ${extra || ''}>${opts.map(o => opt(o[0], o[1], cur_)).join('')}</select>`;
  // Einstellungen als Buttons: das ausgeblendete Auswahlfeld bleibt die Datenquelle, ein Klick setzt dessen Wert und löst die gewohnte Änderung aus
const isOffOpt = o => /^(Rauslassen|Keine|Gar nicht|Nein)/i.test(String(o[1]));
const seg = (selHtml, opts, cur_, dis) => `<div class="seg">${selHtml.replace('<select ', '<select hidden ')}${opts.filter(o => !isOffOpt(o)).concat(opts.filter(isOffOpt)).map(o => `<button type="button" class="sgb${o[2] ? ' sgi' : ''}${isOffOpt(o) ? ' sgoff' : ''}${String(o[0]) === String(cur_) ? ' on' : ''}" data-a="segPick" data-v="${esc(o[0])}" title="${esc(o[1])}"${dis ? ' disabled' : ''}>${o[2] ? sgIcon(o[2]) : esc(String(o[1]).replace(/\s*\(.*\)$/, ''))}</button>`).join('')}</div>`;
const segSel = (f, opts, cur_, extra) => seg(sel(f, opts, cur_, extra), opts, cur_);
const segC = (chg, opts, cur_, extra) => seg(selC(chg, opts, cur_, extra), opts, cur_, /disabled/.test(extra || ''));
function durPanel(c, P) {
  const d = c.durs;
  const DL = { einl: 'Einleitung', atem: 'Atemübung', mantra: 'Mantra', mobi: 'Mobilisation', shakti: 'Shakti Naam', asana: 'Asanas', ausgl: 'Ausgleich', schluss: 'Schluss', shava: 'Shavasana' };
  // Stundenaufbau & Dauer: ein Baustein = ein Block der Stunde (Einstellung + Minuten); der Hauptteil fasst seine Blöcke zusammen
  const aMin = k => `<div class="am"><input type="number" data-f="${P}:durs.${k}" data-num="1" min="1" max="150" value="${d[k]}" data-dirty="1"><span>Min.</span></div>`;
  const aRow = (k, label, sub, setting, on, cls) => `<div class="ar${on ? '' : ' off'}${cls ? ' ' + cls : ''}"><div class="an"><i class="sk-${k}"></i><div><b>${label}</b><small>${sub}</small></div></div><div class="as">${setting}</div>${on ? aMin(k) : '<div class="am muted">–</div>'}</div>`;
  const stripSeg = durKeys(c).map(k => `<i class="sk-${k}" style="flex:${Math.max(+d[k] || 0, 0.01)}" title="${DL[k]}: ${d[k]} Min.">${d[k] >= 6 ? DL[k] : ''}</i>`).join('');
  const kn = c.kraft ? (c.kraftN || 1) : 0;
  const jaSel = f => segSel(P + ':' + f, [[1, 'Ja'], [0, 'Rauslassen']], partOn(c, f.replace('On', '')) ? 1 : 0, 'data-dirty="1" data-num="1"');
  const dur = `<div class="aufb"><div class="atot"><label>Gesamtdauer der Stunde</label><div class="atin">${inp(P + ':total', 'number', c.total, 'min="20" max="180" step="1" data-dirty="1"')}<span>Minuten</span></div><div class="qd">${[60, 75, 90, 120].map(m => `<button class="qdb${+c.total === m ? ' on' : ''}" data-a="setTotal" data-v="${m}">${m}</button>`).join('')}</div><p class="muted">Die Gesamtdauer bleibt fest – ändert sich ein Baustein, passen sich die Asanas an (bei den Asanas selbst die übrigen).</p></div>
<div class="strip astrip">${stripSeg}</div>
<div class="alist"><div class="ahd"><span>Baustein</span><span>Einstellung</span><span>Dauer</span></div>
${aRow('einl', 'Einleitung', 'Ankommen und Motto', jaSel('einlOn'), partOn(c, 'einl'))}
${aRow('atem', 'Atemübung', 'Atemteil nach der Einleitung', segC('atemOn', [[1, 'Ja'], [0, 'Rauslassen']], c.breath !== 'aus' ? 1 : 0), c.breath !== 'aus')}
<div class="ar sub atsub${c.breath !== 'aus' ? '' : ' off'}"><div class="an"><i class="sk-atem"></i><div><b>↳ Wahrnehmungsübung</b><small>im Atemteil, die Zeit wird geteilt</small></div></div><div class="as">${segC('wahrMode', [['immer', 'Ja'], ['aus', 'Rauslassen'], ['wechsel', 'Abwechselnd (im Wechsel)', 'wechsel'], ['zufall', 'Zufällig', 'zufall']], ({ atem: 'aus', atem_wahr: 'immer', gemischt: 'wechsel', zufall: 'zufall' })[c.breath] || 'aus', c.breath === 'aus' ? 'disabled' : '')}</div><div class="am muted">–</div></div>
${aRow('mantra', 'Mantra', 'eigener Block nach der Atemübung', segSel(P + ':mantra', [['aus', 'Rauslassen'], ['immer', 'Ja'], ['wechsel', 'Abwechselnd (im Wechsel)', 'wechsel'], ['zufall', 'Zufällig', 'zufall']], c.mantra || 'aus', 'data-dirty="1"'), mantraMode(c) !== 'aus')}
<div class="agrp"><span>Hauptteil</span><b>${d.haupt} Min.</b></div>
${aRow('mobi', 'Mobilisation', 'erster Übungsblock', segSel(P + ':mobi', [['sitz', 'Im Sitzen', 'sitz'], ['liegen', 'Im Liegen', 'liegen'], ['stand', 'Im Stehen', 'stand'], ['wechsel', 'Abwechselnd (Sitzen, Liegen, Stehen im Wechsel)', 'wechsel'], ['zufall', 'Zufällig (Sitzen, Liegen oder Stehen je Stunde)', 'zufall'], ['aus', 'Rauslassen']], c.mobi || 'sitz', 'data-dirty="1"'), c.mobi !== 'aus', 'ing')}
${aRow('shakti', 'Shakti Naam', 'Block nach der Mobilisation', segSel(P + ':shaktiMode', [['aus', 'Rauslassen'], ['immer', 'Ja'], ['wechsel', 'Abwechselnd (im Wechsel)', 'wechsel'], ['zufall', 'Zufällig', 'zufall']], c.shakti ? (c.shaktiMode || 'immer') : 'aus', 'data-dirty="1"'), !!c.shakti, 'ing')}
${aRow('asana', 'Asanas (Hauptteil)', 'Flow, Stand und Balance', '<span class="muted">–</span>', true, 'ing')}
<div class="ar sub ing${kn ? '' : ' off'}"><div class="an"><i class="sk-kraft"></i><div><b>↳ davon Kraftübungen</b><small>innerhalb der Asanas, rot markiert</small></div></div><div class="as">${segSel(P + ':kraftN', [[0, 'Rauslassen'], [1, '1'], [2, '2'], [3, '3'], ['zufall', 'Zufällig (1 bis 3 je Stunde)', 'zufall']], c.kraft && c.kraftRnd ? 'zufall' : kn, 'data-dirty="1"')}</div><div class="am muted">${kn ? (c.kraftRnd ? '1–3 je Stunde' : '≈ ' + kn * 3 + ' Min.') : '–'}</div></div>
${aRow('ausgl', 'Ausgleich / Cool down', 'Boden, Rückenlage', jaSel('ausglOn'), partOn(c, 'ausgl'), 'ing')}
${aRow('schluss', 'Schluss', 'Nachspüren', jaSel('schlussOn'), partOn(c, 'schluss'))}
${aRow('shava', 'Shavasana', 'Schlussentspannung', jaSel('shavaOn'), partOn(c, 'shava'))}
</div><p class="muted">Bei „Gemischt / Zufällig“ geht die Mantra-Zeit in Stunden ohne Mantra in die Asanas.</p></div>`;
  return dur;
}

// ---------- 1. Rahmenplanung: gilt für das ganze Programm ----------
function frameView(c) {
  const d = c.durs, m = c.motto;
  const gebs = Object.keys(GEBRECHEN).map(k => `<label class="fchip${c.gebrechen.includes(k) ? ' on' : ''}"><input type="checkbox" data-a="toggleGeb" data-k="${k}" ${c.gebrechen.includes(k) ? 'checked' : ''}> ${esc(GEBRECHEN[k])}</label>`).join('');
  const dur = durPanel(c, 'c');
  const chipsC = (field, map) => Object.keys(map).map(k => `<label class="fchip${(c[field] || []).includes(k) ? ' on' : ''}"><input type="checkbox" data-a="cTog" data-f2="${field}" data-v="${k}" ${(c[field] || []).includes(k) ? 'checked' : ''}> ${esc(map[k])}</label>`).join('');  
  const ml = mottoLines(c), gb = (a, extra, tip) => `<button type="button" class="gbtn" data-a="${a}" ${extra || ''} title="${tip}">${state.settings.apiKey ? '🤖' : '✨'}</button>`;
  const mrow = (i, lab) => `<div class="frow">${lab ? `<span class="fno">${lab}</span>` : ''}<input type="text" data-chg="mline" data-i="${i}" value="${esc(ml[i])}" placeholder="${esc(((c.sessions[i] || {}).motto || {}).title || 'leer = wird generiert')}" autocomplete="off">${gb('genMotto', 'data-i="' + i + '"', 'Dieses Motto neu generieren' + (state.settings.apiKey ? ' (KI)' : ' (aus den eingebauten Mottos)'))}</div>`;
  const em = mottoMode(c);
  const mottoFld = c.single
    ? fld('Motto <span class="muted">(leer = generiert)</span>', mrow(0), 'wide')
    : fld('Übermotto <span class="muted">(leer = entfällt)</span>', `<div class="frow">${inp('c:motto.free', 'text', uebermottoText(c), 'data-dirty="1" data-chg="ueber" placeholder="z. B. Reise durch den Herbst"')}${gb('genUeber', '', 'Übermotto generieren' + (state.settings.apiKey ? ' (KI)' : ' (aus den Vorschlägen)'))}</div>`, 'wide')
      + fld('Einzelmottos', `<div class="radios">${[['keine', 'Keine'], ['eigen', 'Einzeln definieren'], ['auto', 'Automatisch generiert' + (state.settings.apiKey ? ' (KI, passend zum Übermotto)' : ' (passend zum Übermotto)')]].map(([v, l]) => `<label class="chk"><input type="radio" name="em" data-f="c:motto.einzel" value="${v}" ${em === v ? 'checked' : ''} data-dirty="1"> ${l}</label>`).join('')}</div>`, 'wide')
      + (em === 'eigen' ? fld(`Mottos der ${c.count} Stunden <span class="muted">(eine Zeile je Stunde, optional „Titel | Kernsatz“, leer = generiert)</span>`, ml.map((_, i) => mrow(i, i + 1)).join(''), 'wide') : '');
  const tot = c.sessions.reduce((a, s) => a + plannedTotal(s), 0), h = Math.floor(tot / 60);
  const pn = (n, t, hint) => `<h3><span class="pn">${n}</span>${t}</h3><p class="phint">${hint}</p>`;
  return `<p class="muted noprint">${c.single ? 'Die Vorgaben legen Gruppe, Einschränkungen, Dauer und Auswahl für diese Einzelstunde fest. Danach planst du die Stunde (Schritt 2).' : 'Die Rahmenplanung legt fest, was für das ganze Programm gilt. Danach planst du jede Stunde einzeln (Schritt 2).'}</p>
<div class="fcards noprint">
<section class="panel span2"><h2 class="ph">${pn(1, c.single ? 'Einzelstunde & Motto' : 'Programm & Motto', c.single ? 'Name, Vorlage und Motto der Stunde.' : 'Name, Vorlage und roter Faden der Stunden.')}</h2><div class="grid">
${fld((c.single ? 'Name der Einzelstunde' : 'Programmname') + ' <span class="muted">(leer = ' + (c.single ? 'Motto' : 'Übermotto') + ')</span>', `<div class="frow">${inp('c:name', 'text', c.name, 'class="h1in" data-chg="cname" placeholder="leer = ' + (c.single ? 'Motto' : 'Übermotto') + '"')}${gb('genName', '', 'Namen generieren' + (state.settings.apiKey ? ' (KI)' : c.single ? ' (aus dem Motto)' : ' (aus dem Übermotto)'))}</div>`, 'wide')}
${mottoFld}
</div></div></section>
<section class="panel"><h2 class="ph">${pn(2, c.single ? 'Datum' : 'Termine & Rhythmus', c.single ? 'Wann findet die Einzelstunde statt?' : 'Wie viele Stunden, wann und wie oft?')}</h2><div class="grid">
${c.single ? '' : fld('Anzahl Stunden', inp('c:count', 'number', c.count, 'min="1" max="40" data-dirty="1"'))}
${fld(c.single ? 'Datum' : 'Startdatum (1. Stunde)', inp('c:start', 'date', c.start))}
${c.single ? '' : fld('Rhythmus', segSel('c:rhythm', [['weekly', 'Wöchentlich'], ['biweekly', 'Zweiwöchentlich'], ['days', 'Ausgewählte Wochentage']], c.rhythm || 'weekly', 'data-dirty="1"'))}
${c.single ? '' : (c.rhythm === 'days') ? fld('Wochentage (jede Woche)', `<div class="fchips">${[[1, 'Mo'], [2, 'Di'], [3, 'Mi'], [4, 'Do'], [5, 'Fr'], [6, 'Sa'], [0, 'So']].map(([n, l]) => `<label class="fchip${(c.days || []).includes(n) ? ' on' : ''}"><input type="checkbox" data-a="toggleDay" data-k="${n}" ${(c.days || []).includes(n) ? 'checked' : ''}> ${l}</label>`).join('')}</div>`) : ''}
${c.single ? '' : fld('Pausen / Ferien (Datum oder „von bis“, getrennt mit ;)', inp('c:pauses', 'text', c.pauses, 'placeholder="27.10.2026; 22.12.2026 bis 05.01.2027"'), 'wide')}
</div></section>
<section class="panel"><h2 class="ph">${pn(3, 'Zielgruppe & Einschränkungen', 'Für wen ist das Programm? Übungen mit Belastung für die gewählten Bereiche werden nicht vorgeschlagen.')}</h2><div class="grid">
${fld('Gruppe', segSel('c:level', Object.keys(LEVELS).map(k => [k, LEVELS[k]]), c.level, 'data-dirty="1"'))}
${fld('Einschränkungen / Gebrechen berücksichtigen', `<div class="fchips">${gebs}</div>`, 'wide')}
</div></section>
<section class="panel span2"><h2 class="ph">${pn(4, 'Stundenaufbau & Dauer', 'Wie lang ist eine Stunde und wie ist sie aufgebaut?')}</h2><div>
${dur}
</div></section>
<section class="panel span2"><h2 class="ph">${pn(5, 'Übungsauswahl', 'Schränkt ein, aus welchen Übungen für alle Stunden gewählt wird. Mehrfachauswahl möglich, leer = alle.')}</h2><div class="grid">
${fld('Yogastil', `<div class="fchips">${chipsC('st', STILE)}</div>`, 'wide')}
${fld('Körperregion', `<div class="fchips">${chipsC('reg', KAT.reg)}</div>`, 'wide')}
</div></section>
</div><div class="bar noprint"><button class="primary" data-a="plan">🎲 ${c.single ? 'Vorgaben auf die Einzelstunde anwenden' : 'Rahmen auf die Stunden anwenden'}</button>${c.single ? '' : '<button data-a="dates">📅 Termine neu berechnen</button>'}<button class="ghost" data-a="saveTpl" title="${c.single ? 'Einzelstunde' : 'Rahmen und Stunden'} als Vorlage speichern">★ ${c.single ? 'Als Einzelstunden-Vorlage' : 'Als Programm-Vorlage'}</button>${c.single ? '' : `<button class="ghost" data-a="saveAllSingles" title="Jede Stunde dieses Programms unter „Stunden“ als eigene Einzelstunde speichern">⧉ Alle Stunden als Einzelstunden speichern</button>`}
${state.settings.apiKey ? '<button data-a="aiMottos">🤖 Mottos per KI vorschlagen</button>' : ''}<span class="muted">Legt Übungen und Texte für alle Stunden neu an. Stunden mit Status „Fertig“ bleiben unverändert.</span></div>
<div id="dirtyBanner" class="banner noprint ${c.dirty ? '' : 'hide'}">Rahmen geändert – mit „Rahmen auf die Stunden anwenden“ übernehmen.</div>
${c.sessions.length ? '<p class="muted noprint">Die Stundenübersicht findest du oben in der Kopfzeile neben „Ausgabe / Versand“.</p>' : '<p class="muted">Noch keine Stunden angelegt – klicke „Rahmen auf die Stunden anwenden“.</p>'}`;
}
// ----- Zeitübersicht -----
const PARTCLS = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10'];
function partsOf(s) {
  return order(s).map(k => [bn(s, k), !bon(s, k) ? 0 : bty(s, k) === 'ex' ? sumMin(s.blk[k] || []) : (+s.dur[k] || 0), 'sk-' + abOf(s, k)]);
}const plannedTotal = s => partsOf(s).reduce((a, p) => a + p[1], 0);
function stripHtml(s, labels) {
  return `<div class="strip">${partsOf(s).map((p, i) => `<i class="${p[2] || PARTCLS[i % 10]}" style="flex:${Math.max(p[1], 0.01)}" title="${p[0]}: ${fmtMin(p[1])} Min.">${labels && p[1] >= 5 ? p[0] : ''}</i>`).join('')}</div>`;
}
function timeInfo(s) {
  const pl = plannedTotal(s), T = sessionTotal(s), d = pl - T, ok = Math.abs(d) <= 1.01;
  const om = sessionOptMin(s);
  return `<span class="tinfo ${ok ? 'ok' : 'off'}">${fmtMin(pl)} / ${T} Min.${ok ? ' ✓' : ` (${d > 0 ? '+' : ''}${fmtMin(d)})`}</span>${om > 0 ? `<span class="tinfo optm" title="Optionale Übungen sind in der Zeit enthalten">${optNote(om)}</span>` : ''}`;
}
function flatTiles(s) {
  const at = (bon(s, 'atem') ? brTileC(s, 'atem') + (s.atem.w ? brTileC(s, 'wahr') : '') : '') + (bon(s, 'mantra') ? manTileC(s) : '');
  return at + exKeys(s).filter(k => bon(s, k)).map(k => seqTiles(s.blk[k] || [], exTileC(s, k))).join('');
}
// Block einer Einzelstunde (Stundenübersicht): Datum/Motto, Verlauf, Kacheln – auch oben in der Einzelstundenanalyse
function ovBox(s, k) {
  const ty = bty(s, k), name = esc(bn(s, k));
  let min, tiles;
  if (ty === 'ex') { const it = s.blk[k] || []; min = `${fmtMin(sumMin(it))} Min.${optMin(it) > 0 ? ' · ' + optNote(optMin(it)) : ''}`; tiles = seqTiles(it, exTileC(s, k)) || '<span class="muted">–</span>'; }
  else if (ty === 'atem' && k === 'atem') { min = `${s.dur.atem} Min.`; tiles = brTileC(s, 'atem') + (s.atem.w ? brTileC(s, 'wahr') : '') + textTile('atem'); }
  else if (ty === 'mantra') { min = `${fmtMin(s.dur[k] == null ? 0 : s.dur[k])} Min.`; tiles = manTileC(s) + textTile(k); }
  else { min = `${fmtMin(s.dur[k] == null ? 0 : s.dur[k])} Min.`; tiles = textTile(k); }
  return `<div class="sbx cat-${bcls(k)}"><div class="sbt"><b>${name}</b><span>${min}</span></div><div class="sbk">${tiles}</div></div>`;
}
function ovCard(s, i, noGoto) {
  const st = s.status || 'vorgeplant';
  return `<div class="sc stc-${st}"><div class="sch"><span class="no">${i + 1}</span>${inp(`s:${s.id}:date`, 'date', s.date, 'class="scd"')}${inp(`s:${s.id}:motto.title`, 'text', s.motto.title, 'class="scm" data-chg="mtitle" data-sid="' + s.id + '"')}
<span class="grow"></span>${s.locked ? '<span title="gesperrt">🔒</span>' : ''}<span id="ovt-${s.id}">${timeInfo(s)}</span>${statSel(`s:${s.id}:status`, st)}${noGoto ? '' : `<span class="gobtns"><button class="sm" data-a="gotoS" data-id="${s.id}">Einzelplanung →</button><button class="sm" data-a="gotoSA" data-id="${s.id}">Einzelanalyse →</button></span>`}</div>
<div class="scs" id="ovs-${s.id}">${stripHtml(s, true)}</div>
${ui.frameBlocks ? `<div class="scb">${order(s).filter(k => bon(s, k)).map(k => ovBox(s, k)).join('')}</div>` : `<div class="scf">${flatTiles(s)}</div>`}</div>`;
}
function frameTable(c) {
  const tot = c.sessions.reduce((a, s) => a + plannedTotal(s), 0), h = Math.floor(tot / 60), m = Math.round(tot - h * 60);
  const legend = partsOf(c.sessions[0]).map((p, i) => `<span class="lg"><i class="${p[2] || PARTCLS[i % 10]}"></i>${esc(p[0])}</span>`).join('');
  const cnt = {}; c.sessions.forEach(s => { cnt[s.status || 'vorgeplant'] = (cnt[s.status || 'vorgeplant'] || 0) + 1; });
  if (ui.ovF && !Object.keys(STATUS).includes(ui.ovF)) ui.ovF = null;
  const cards = c.sessions.map((s, i) => (!ui.ovF || (s.status || 'vorgeplant') === ui.ovF) ? ovCard(s, i) : '').join('') || '<p class="muted">Keine Stunden mit diesem Status.</p>';
  return `<section class="panel noprint"><h3>Stundenübersicht <span class="muted" id="ovtot">· ${c.sessions.length} Stunden, geplant insgesamt ${h} h ${m} min</span></h3>
<div class="scl">${cards}</div>
<div class="bar"><button data-a="fitAll">⚖ Alle Stunden auf die Zielzeit angleichen</button><button data-a="frameView">${ui.frameBlocks ? '▤ Kacheln ohne Blöcke zeigen' : '▦ Kacheln nach Blöcken gruppieren'}</button><span class="grow"></span><label class="muted">Alle Stunden auf Status</label><select id="bulkStat">${statOpts('in_planung')}</select><button class="sm" data-a="bulkStatus">setzen</button><button class="primary" data-a="startSessions">Weiter zur Einzelstundenplanung →</button></div></section>`;
}
function updateSums(c, s) {
  const set = (id, html) => { const n = $('#' + id); if (n) n.innerHTML = html; };
  set('ovs-' + s.id, stripHtml(s)); set('ovt-' + s.id, timeInfo(s)); set('strip-' + s.id, stripHtml(s, true)); set('tinfo-' + s.id, timeInfo(s)); set('tinfo0-' + s.id, timeInfo(s));
  exKeys(s).forEach(k => { const n = $(`#bs-${s.id}-${k}`); if (n) n.textContent = fmtMin(sumMin(s.blk[k])); });
  exKeys(s).forEach(k => { const n = $(`#bmin-${s.id}-${k}`); if (n && s.bm && s.bm[k]) n.textContent = `${fmtMin(sumMin(s.blk[k]))} / ${fmtMin(s.bm[k].min)} Min.`; });
  exKeys(s).forEach(k => { const n = $(`#bo-${s.id}-${k}`); if (n) n.textContent = optMin(s.blk[k] || []) > 0 ? ' · ' + optNote(optMin(s.blk[k])) : ''; });
  const bs = $('#bmsum-' + s.id); if (bs) bs.textContent = sessionTotal(s);
  const tot = c.sessions.reduce((a, x) => a + plannedTotal(x), 0), h = Math.floor(tot / 60);
  set('ovtot', `· ${c.sessions.length} Stunden, geplant insgesamt ${h} h ${Math.round(tot - h * 60)} min`);
}
function sessionsView(c) {
  if (!c.sessions.length) return '<p class="muted noprint">Noch keine Stunden. Lege sie zuerst in der <a data-a="tab" data-v="frame" style="cursor:pointer;text-decoration:underline">Rahmenplanung</a> an.</p>';
  if (!c.sessions.some(s => s.id === ui.sel)) ui.sel = c.sessions[0].id;
  const idx = c.sessions.findIndex(s => s.id === ui.sel), s = c.sessions[idx];
  const pills = c.sessions.map((x, i) => { const ok = Math.abs(plannedTotal(x) - sessionTotal(x)) <= 1.01; return `<button class="pill${x.id === ui.sel ? ' on' : ''}${ok ? '' : ' off'} stp-${x.status || 'vorgeplant'}" data-a="selS" data-id="${x.id}" title="${esc(x.motto.title)} – ${esc(fmtDateW(x.date))}${x.locked ? ' (gesperrt)' : ''}">${i + 1}${x.locked ? '🔒' : ''}<small>${esc(fmtDateS(x.date))}</small></button>`; }).join('');
  return `<p class="muted noprint">Einzelstundenplanung: Übungen, Zeiten und Texte der gewählten Stunde. Rahmen (Termine, Dauer, Gruppe, Mottos) ändern → <a data-a="tab" data-v="frame" style="cursor:pointer;text-decoration:underline">Rahmenplanung</a>.</p>
<div class="selbar noprint"><button class="ghost" data-a="prevS" ${idx === 0 ? 'disabled' : ''}>◀</button><div class="pills">${pills}</div><button class="ghost" data-a="nextS" ${idx === c.sessions.length - 1 ? 'disabled' : ''}>▶</button></div>
${sessionCard(c, s, idx)}`;
}const BLOCKS = [['mobi', 'Mobilisation im Sitzen', ['mobi_sitz']], ['asana', 'Asanas (Hauptteil)', ['mobi_stand', 'flow', 'stand', 'balance']], ['ausgl', 'Ausgleich / Cool down', ['boden']]];
function twText(s, k) {
  if (!WPM[k]) return `≈ ${wc(s.tx[k] || '')} Wörter`;
  const w = wc(s.tx[k] || ''), min = txDur(s, k), tgt = Math.round(min * WPM[k]);
  return `≈ ${w} Wörter · Sprechzeit ca. ${fmtMin(w / WPM[k])} Min. (Ziel ${min} Min. ≈ ${tgt} Wörter)${w < tgt * 0.8 && !s.txEdited[k] ? ' – Vorlagentext reicht nicht weiter, für längere Texte „Texte per KI“ nutzen' : ''}`;
}
// ---- Kacheln des Übungskatalogs in den Übersichten ----
// anklickbare Kacheln (Stundenübersicht): Klick öffnet die Übungsauswahl und tauscht diese Übung aus
const exTileC = (s, k) => (it, j) => { const e = exById(it.id); if (!e) return ''; return `<span class="mt clk${it.opt ? ' opt' : ''} cat-${e.c}" data-a="pk" data-sid="${s.id}" data-b="${k}" data-i="${j}" title="${esc(tileName(it, e))}${it.opt ? ' (optional)' : ''}${it.min ? ' · ' + fmtMin(it.min) + ' Min.' : ''} – klicken zum Austauschen">${sbTileFig(it, e)}${peakStar(e)}${handsMark(it, e)}</span>`; };
const brTileC = (s, kind) => { const id = kind === 'atem' ? s.atem.a : s.atem.w, b = BR.find(x => x.id === id); return b ? `<span class="mt clk cat-br_${b.k}" data-a="pkbr" data-sid="${s.id}" data-kind="${kind}" title="${esc(b.n)} – klicken zum Austauschen">${breathIconSVG(b.id)}</span>` : ''; };
// Hands-on: nur anbietbar, wenn die Übung laut Katalog Adjustment, Support oder Assistance erlaubt
const handsOk = e => !!(e && e.kat && (e.kat.sup || []).some(x => x !== 'keine'));
const HAND_PATHS = '<path d="M18 11V6a2 2 0 0 0-4 0M14 10V4a2 2 0 0 0-4 0v2M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>';
const handsMark = (it, e) => (it.hands && handsOk(e)) ? `<span class="hmark" title="Hands-on"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${HAND_PATHS}</svg></span>` : '';
const handsBtn = (s, key, j, it, e) => (it.seq || !handsOk(e)) ? '' : `<button class="ghost optb${it.hands ? ' on' : ''}" data-a="handsTog" data-id="${s.id}" data-b="${key}" data-i="${j}" aria-pressed="${it.hands ? 'true' : 'false'}" title="${it.hands ? 'Hands-on geplant (anklicken: wieder entfernen)' : 'Hands-on für diese Übung einplanen (Adjustment, Support oder Assistance)'}"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${HAND_PATHS}</svg></button>`;
function exTile(it) { const e = exById(it.id); if (!e) return ''; return `<span class="mt${it.opt ? ' opt' : ''} cat-${e.c}" title="${esc(tileName(it, e))}${it.opt ? ' (optional)' : ''}${it.min ? ' · ' + fmtMin(it.min) + ' Min.' : ''}">${sbTileFig(it, e)}${peakStar(e)}${handsMark(it, e)}</span>`; }
function brTile(id) { const b = BR.find(x => x.id === id); return b ? `<span class="mt cat-br_${b.k}" title="${esc(b.n)}">${breathIconSVG(b.id)}</span>` : ''; }
function tilesOf(s) {
  const grp = exKeys(s).filter(k => bon(s, k) && (s.blk[k] || []).length).map(k => seqTiles(s.blk[k], exTile));
  const at = bon(s, 'atem') ? brTile(s.atem.a) + (s.atem.w ? brTile(s.atem.w) : '') : '';
  return `<span class="mts">${[at].concat(grp).filter(Boolean).join('<i class="msep"></i>')}</span>`;
}
const statOpts = cur_ => Object.keys(STATUS).map(k => `<option value="${k}"${k === cur_ ? ' selected' : ''}>${STATUS[k]}</option>`).join('');
const statSel = (f, v, extra) => `<select class="statsel stat-${v}" data-f="${f}" data-chg="stat" ${extra || ''}>${statOpts(v)}</select>`;
// Dauer des Textes (Standard: Zeit des Blocks aus dem Rahmen) – daraus ergibt sich die ungefähre Wortzahl
function txDurCtl(s, k) {
  const d = txDur(s, k), own = s.txd && +s.txd[k] > 0 && +s.txd[k] !== +s.dur[k];
  return `<div class="txd"><label>Dauer des Textes</label><input type="number" min="1" max="60" step="0.5" value="${d}" data-chg="txdur" data-sid="${s.id}" data-k="${k}"> Min. <span class="muted">≈ ${Math.round(d * WPM[k])} Wörter</span>${own ? `<span class="muted"> · Rahmen: ${fmtMin(+s.dur[k] || 0)} Min.</span> <button class="ghost sm" data-a="txdReset" data-id="${s.id}" data-k="${k}">↺ wie Rahmen</button>` : ''}</div>`;
}
function txField(s, k, label, rows) {
  const id = s.id;
  const tplOk = WPM[k] || TX_KINDS[abOf(s, k)];
  return `<div class="fld wide"><label>${label} ${tplOk ? `${WPM[k] ? `<button class="btn-neu" data-a="regenTx" data-id="${id}" data-k="${k}" title="Text mit anderer Formulierung neu erzeugen">↻ Neu</button>` : ''}<button class="btn-neu" data-a="tplOpen" data-id="${id}" data-k="${k}" title="Vorlage aus „Textvorlagen“ einfügen">📋 Vorlage</button><button class="btn-neu" data-a="tplAiOpen" data-id="${id}" data-k="${k}" title="Prompt eingeben, die KI schreibt den Text">🤖 Prompt</button><button class="btn-neu" data-a="txClear" data-id="${id}" data-k="${k}" title="Text leeren">🗑 Leeren</button><button class="btn-neu sm2" data-a="tplSaveFrom" data-id="${id}" data-k="${k}" title="Diesen Text als eigene Vorlage speichern">💾 Als Vorlage</button>` : ''} <span class="tw" data-twk="${k}" data-sid="${id}">${twText(s, k)}</span></label>${WPM[k] ? txDurCtl(s, k) : ''}${ui.tplPick && ui.tplPick.sid === id && ui.tplPick.k === k ? tplPickPanel(s, k) : ''}${ui.tplAi && ui.tplAi.sid === id && ui.tplAi.k === k ? tplAiPanel(s, k) : ''}<div class="hlw"><div class="hlbd" aria-hidden="true"></div><textarea data-f="s:${id}:tx.${k}" data-tx="${k}" data-sid="${id}" rows="${rows}">${esc(s.tx[k] || '')}</textarea></div></div>`;
}
const bcls = k => isCustomKey(k) ? 'x' : k;
const MOBI_ICONS = {
  sitz: '<circle cx="12" cy="4.5" r="2.2"/><path d="M12 7v7M7 10.5l5 1.5 5-1.5M12 14l-5.5 4.5h11L12 14z"/>',
  liegen: '<circle cx="4.5" cy="14" r="2.2"/><path d="M7 14h12.5M19.5 14l-1.5-5M13.5 14l1.5-5"/>',
  stand: '<circle cx="12" cy="4.5" r="2.2"/><path d="M12 7v8M12 15l-3.5 6M12 15l3.5 6M7 10.5L12 9l5 1.5"/>',
  wechsel: '<path d="M5 12a7 7 0 0 1 12-5M19 12a7 7 0 0 1-12 5M17 3v4h-4M7 21v-4h4"/>',
  zufall: '<rect x="4" y="4" width="16" height="16" rx="3.5"/><circle cx="9" cy="9" r="1.1" fill="currentColor"/><circle cx="15" cy="9" r="1.1" fill="currentColor"/><circle cx="12" cy="12" r="1.1" fill="currentColor"/><circle cx="9" cy="15" r="1.1" fill="currentColor"/><circle cx="15" cy="15" r="1.1" fill="currentColor"/>'
};
const sgIcon = k => MOBI_ICONS[k] ? `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${MOBI_ICONS[k]}</svg>` : '';
const isOffLabel = l => /^(Rauslassen|Keine|Gar nicht|Nein)/i.test(String(l));
// Buttons für eine Stunden-Einstellung (Aus-Option steht ganz rechts und wird bei Auswahl leicht rot)
function sGrp(opts, cur_, act, id, k, dis) {
  return `<div class="seg">${opts.filter(o => !isOffLabel(o[1])).concat(opts.filter(o => isOffLabel(o[1]))).map(o => `<button type="button" class="sgb${o[2] ? ' sgi' : ''}${isOffLabel(o[1]) ? ' sgoff' : ''}${String(o[0]) === String(cur_) ? ' on' : ''}" data-a="${act}" data-id="${id}" data-b="${k}" data-v="${esc(o[0])}" title="${esc(o[1])}"${dis ? ' disabled' : ''}>${o[2] ? sgIcon(o[2]) : esc(o[1])}</button>`).join('')}</div>`;
}
// Blockplanung der Stunde: dieselbe Gliederung wie im Rahmen (Baustein, Einstellung, Dauer) – gilt nur für diese Stunde
function sessBlocks(c, s) {
  const id = s.id, ord = order(s), mobiMode = s.mobiMode || 'sitz';
  const ONOFF = [[1, 'Ja'], [0, 'Rauslassen']];
  const minCell = k => { const m = s.bm[k]; const isEx = bty(s, k) === 'ex';
    const f = isEx ? inp(`s:${id}:bm.${k}.min`, 'number', m.min == null ? 0 : m.min, 'min="0" max="120" step="0.5" data-chg="bmmin" data-sid="' + id + '" data-b="' + k + '"') : inp(`s:${id}:dur.${k}`, 'number', s.dur[k] == null ? 5 : s.dur[k], 'min="0" max="120" data-chg="bmmin" data-sid="' + id + '" data-b="' + k + '"');
    return `<div class="am">${f}<span>Min.</span></div>`; };
  const row = (k, label, sub, setting, on, cls) => `<div class="ar${on ? '' : ' off'}${cls ? ' ' + cls : ''}"><div class="an"><i class="sk-${abOf(s, k)}"></i><div><b>${esc(label)}</b><small>${sub}</small></div></div><div class="as">${setting}</div>${on ? minCell(k) : '<div class="am muted">–</div>'}</div>`;
  const out = [];
  ord.forEach(k => {
    const m = s.bm[k]; if (!m) return; const on = m.on !== false, ab = abOf(s, k), name = bn(s, k), custom = isCustomKey(k);
    let setting = sGrp(ONOFF, on ? 1 : 0, 'sbOn', id, k), sub = '';
    if (ab === 'mobi') { setting = sGrp([['sitz', 'Im Sitzen', 'sitz'], ['liegen', 'Im Liegen', 'liegen'], ['stand', 'Im Stehen', 'stand'], ['aus', 'Rauslassen']], on ? mobiMode : 'aus', 'sbMobi', id, k); sub = 'erster Übungsblock'; }
    else if (ab === 'einl') sub = 'Ankommen und Motto'; else if (ab === 'atem') sub = 'Atemteil nach der Einleitung'; else if (ab === 'mantra') sub = 'eigener Block nach der Atemübung';
    else if (ab === 'shakti') sub = 'Block nach der Mobilisation'; else if (ab === 'asana' && !custom) sub = 'Flow, Stand und Balance'; else if (ab === 'ausgl') sub = 'Boden, Rückenlage'; else if (ab === 'schluss') sub = 'Nachspüren'; else if (ab === 'shava') sub = 'Schlussentspannung'; else if (custom) sub = 'eigener Block';
    out.push(row(k, name, sub, setting, on, on ? '' : ''));
    if (ab === 'atem' && k === 'atem') {
      const wOn = !!(s.atem && s.atem.w);
      out.push(`<div class="ar sub${on ? '' : ' off'}"><div class="an"><i class="sk-atem"></i><div><b>↳ Wahrnehmungsübung</b><small>im Atemteil, die Zeit wird geteilt</small></div></div><div class="as">${sGrp(ONOFF, wOn ? 1 : 0, 'sbWahr', id, k, !on)}</div><div class="am muted">–</div></div>`);
    }
    if (ab === 'asana' && !custom) {
      const kn = (s.blk.asana || []).filter(i => !i.seq && (exById(i.id) || {}).c === 'kraft').length;
      out.push(`<div class="ar sub${on ? '' : ' off'}"><div class="an"><i class="sk-kraft"></i><div><b>↳ davon Kraftübungen</b><small>innerhalb der Asanas, rot markiert</small></div></div><div class="as">${sGrp([[1, '1'], [2, '2'], [3, '3'], [0, 'Rauslassen']], Math.min(kn, 3), 'sbKraft', id, k, !on)}</div><div class="am muted">${kn ? '≈ ' + kn * 3 + ' Min.' : '–'}</div></div>`);
    }
  });
  const parts = partsOf(s).map(p => `<i class="${p[2]}" style="flex:${Math.max(p[1], 0.01)}" title="${esc(p[0])}: ${fmtMin(p[1])} Min.">${p[1] >= 6 ? esc(p[0]) : ''}</i>`).join('');
  return `<div class="aufb sess"><div class="strip astrip">${parts}</div><div class="alist"><div class="ahd"><span>Baustein</span><span>Einstellung</span><span>Dauer</span></div>${out.join('')}</div></div>`;
}
function defPanel(c, s) {
  const id = s.id, open = ui.open.has('def:' + id), ord = order(s);
  const rows = ord.map((k, ix) => {
    const m = s.bm[k] || (s.bm[k] = { ab: abOf(s, k), name: bdefName(k), on: true, type: bdefType(k) }), ab = abOf(s, k), ty = bty(s, k), isEx = ty === 'ex', custom = isCustomKey(k);
    const dur = isEx ? inp(`s:${id}:bm.${k}.min`, 'number', m.min == null ? 0 : m.min, 'min="0" max="120" step="0.5" data-chg="bmmin" data-sid="' + id + '" data-b="' + k + '"') : inp(`s:${id}:dur.${k}`, 'number', s.dur[k] == null ? 5 : s.dur[k], 'min="0" max="120" data-chg="bmmin" data-sid="' + id + '" data-b="' + k + '"');
    const types = Object.keys(BTYPES).filter(t => (t !== 'atem' && t !== 'mantra') || k === t);
    return `<tr><td class="c1"><input type="checkbox" data-f="s:${id}:bm.${k}.on" data-chg="bmon" data-sid="${id}" data-b="${k}" ${m.on !== false ? 'checked' : ''} title="Block ein-/ausblenden"></td>
<td class="mvc"><button class="ghost sm" data-a="mvBlock" data-id="${id}" data-b="${k}" data-d="-1" ${ix === 0 ? 'disabled' : ''} title="Block nach oben">▲</button><button class="ghost sm" data-a="mvBlock" data-id="${id}" data-b="${k}" data-d="1" ${ix === ord.length - 1 ? 'disabled' : ''} title="Block nach unten">▼</button></td>
<td><select class="arts" data-chg="bmab" data-sid="${id}" data-b="${k}" ${k === 'atem' || k === 'mantra' ? 'disabled' : ''}>${BDEF.concat(isCustomKey(k) ? BEXTRA : []).filter(b => k === 'atem' ? b[0] === 'atem' : k === 'mantra' ? b[0] === 'mantra' : (b[0] !== 'atem' && b[0] !== 'mantra')).map(b => `<option value="${b[0]}"${b[0] === ab ? ' selected' : ''}>${esc(b[1])}</option>`).join('')}</select></td>
<td><select class="arts" data-f="s:${id}:bm.${k}.type" data-chg="bmtype" data-sid="${id}" data-b="${k}">${types.map(t => `<option value="${t}"${t === ty ? ' selected' : ''}>${BTYPES[t]}</option>`).join('')}</select></td>
<td>${inp(`s:${id}:bm.${k}.name`, 'text', m.name, `data-chg="bmname" data-sid="${id}" data-b="${k}" placeholder="${esc(bdefName(k))}"`)}</td>
<td class="dtd">${dur}</td>
<td>${custom ? `<button class="ghost sm danger" data-a="delBlock" data-id="${id}" data-b="${k}" title="Eigenen Block löschen">🗑</button>` : ''}</td></tr>`;
  }).join('');
  return `<details class="panel mini noprint" data-id="def:${id}" ${open ? 'open' : ''}><summary>Blockplanung dieser Stunde <span class="muted">· Bausteine, Einstellungen und Dauer wie im Rahmen</span></summary>
${sessBlocks(c, s)}
<details class="defx" data-id="defx:${id}" ${ui.open.has('defx:' + id) ? 'open' : ''}><summary>Erweitert: Namen, Ablauf- und Blockart, Reihenfolge, eigene Blöcke</summary><table class="deft"><thead><tr><th>An</th><th></th><th>Ablaufart</th><th>Blockart</th><th>Name</th><th>Dauer (Min.)</th><th></th></tr></thead><tbody>${rows}</tbody></table></details>
<div class="bar"><button class="sm" data-a="addBlock" data-id="${id}" data-t="text">＋ Textblock hinzufügen</button><button class="sm" data-a="addBlock" data-id="${id}" data-t="ex">＋ Übungsblock hinzufügen</button><span class="grow"></span>
<span>Summe: <b id="bmsum-${id}">${sessionTotal(s)}</b> Min. <span class="muted">(Rahmen: ${c.total} Min.)</span></span></div>
<div class="bar"><button class="sm" data-a="fitS" data-id="${id}">⚖ Übungsminuten an die Blockzeiten anpassen</button><button class="sm" data-a="bmReset" data-id="${id}">↺ Standard wiederherstellen (eigene Blöcke entfallen)</button></div></details>`;
}
function fltPanel(c, s) {
  const id = s.id, open = ui.open.has('flt:' + id);
  s.flt = s.flt || fltDefault(); const f = s.flt; f.kat = f.kat || {}; f.st = f.st || []; f.geb = f.geb || [];
  const active = fltActive(s);
  const chips = (dim, map, sel) => Object.keys(map).map(k => `<label class="fchip${sel.includes(k) ? ' on' : ''}"><input type="checkbox" data-a="fltTog" data-id="${id}" data-d="${dim}" data-v="${k}" ${sel.includes(k) ? 'checked' : ''}> ${esc(map[k])}</label>`).join('');
  const kats = FLT_KATS.map(d => `<div class="fgrp"><div class="fgt">${esc(KATTITLE[d])}</div><div class="fchips">${chips(d, KAT[d], f.kat[d] || [])}</div></div>`).join('');
  const over = f.override ? `<div class="grid">${fld('Gruppe (statt Rahmen: ' + LEVELS[c.level] + ')', sel(`s:${id}:flt.level`, [['', 'wie Rahmen']].concat(Object.keys(LEVELS).map(k => [k, LEVELS[k]])), f.level, `data-chg="fltr" data-sid="${id}"`))}
<div class="fld wide"><label>Einschränkungen (statt Rahmen: ${c.gebrechen.length ? esc(c.gebrechen.map(g => GEBRECHEN[g]).join(', ')) : 'keine'})</label><div class="checks">${Object.keys(GEBRECHEN).map(k => `<label class="chk"><input type="checkbox" data-a="fltGeb" data-id="${id}" data-v="${k}" ${f.geb.includes(k) ? 'checked' : ''}> ${esc(GEBRECHEN[k])}</label>`).join('')}</div></div></div>` : '';
  return `<details class="panel mini noprint" data-id="flt:${id}" ${open ? 'open' : ''}><summary>Filter für die Übungsauswahl dieser Stunde ${active ? '<span class="chip warn">aktiv</span>' : '<span class="muted">· Standard (Rahmen)</span>'} <span class="muted">· wirkt nur auf neue Übungsauswahl</span></summary>
<p class="muted">Der Filter gilt, wenn neue Übungen gewählt werden (Würfeln, „+“, Anzahl/Dauer ändern, „Rahmen anwenden“). Bereits ausgewählte Übungen bleiben unverändert.</p>
<div class="fcol">
<label class="chk"><input type="checkbox" data-f="s:${id}:flt.override" data-chg="fltr" data-sid="${id}" ${f.override ? 'checked' : ''}> Vorfilter des Rahmens (Gruppe, Einschränkungen) für diese Stunde überschreiben</label>
${over}
<label class="chk"><input type="checkbox" data-f="s:${id}:flt.allowBanned" data-chg="fltr" data-sid="${id}" ${f.allowBanned ? 'checked' : ''}> Auch Übungen zulassen, die ich mit ⊘ ausgeschlossen habe</label>
<label class="chk"><input type="checkbox" data-f="s:${id}:flt.allowMan" data-chg="fltr" data-sid="${id}" ${f.allowMan ? 'checked' : ''}> Auch „nur manuell wählbare“ Übungen zulassen (z. B. Peak Poses ★)</label>
</div>
<div class="fgrp"><div class="fgt">Yogastil</div><div class="fchips">${chips('st', STILE, f.st)}</div></div>
${kats}
<div class="bar"><button class="sm" data-a="reroll" data-id="${id}" title="Wählt alle Übungen der Stunde mit diesem Filter neu aus">🎲 Alle Übungen mit diesem Filter neu würfeln</button><span class="grow"></span><button class="sm" data-a="fltReset" data-id="${id}">↺ Auf Standard zurücksetzen</button></div></details>`;
}
const textTile = k => `<span class="mt tx cat-${bcls(k)}" title="Text">${TEXTICON}</span>`;
function brSlot(s, kind) {
  const id = kind === 'atem' ? s.atem.a : s.atem.w, b = BR.find(x => x.id === id), lab = kind === 'atem' ? 'Atemübung' : 'Wahrnehmungsübung';
  const act = (kind === 'wahr' && b) ? 'tglw' : 'pkbr';
  const tip = kind === 'wahr' ? (b ? 'Klicken: Wahrnehmungsübung entfernen' : 'Klicken: Wahrnehmungsübung wählen') : 'Klicken: Atemübung wählen';
  return b ? `<div class="bslot"><div class="xtile cat-br_${kind} pkt" data-a="${act}" data-sid="${s.id}" data-kind="${kind}" title="${tip}">${breathIconSVG(b.id)}</div><b class="an">${esc(b.n)}</b><small class="muted">${lab}</small></div>`
    : `<div class="bslot"><div class="xtile empty cat-br_${kind} pkt" data-a="pkbr" data-sid="${s.id}" data-kind="${kind}" title="${tip}"><span class="plus">＋</span></div><b class="an muted">keine ${lab}</b><small class="muted">${lab}</small></div>`;
}
function blockCard(c, s, k) {
  const id = s.id, key = id + ':' + k, open = ui.bopen.has(key), name = bn(s, k), type = bty(s, k);
  let mins, sum, body;
  if (type === 'ex') {
    const items = s.blk[k] || (s.blk[k] = []);
    mins = `${fmtMin(sumMin(items))} / ${fmtMin((s.bm[k] || {}).min)} Min.`;
    sum = `<span class="mts">${seqTiles(items, exTile)}</span><span class="muted"> ${items.filter(i => !isSb(i)).length} Übungen${items.some(isSb) ? ' + Sonderbausteine' : ''}</span>`;
    body = blockEditor(c, s, [k, name, catsOf(s, k)]);
  } else if (type === 'atem' && k === 'atem') {
    mins = `${s.dur.atem} Min.`;
    sum = `<span class="mts">${brTile(s.atem.a)}${s.atem.w ? brTile(s.atem.w) : ''}${textTile('atem')}</span><span class="muted"> ${esc([(BR.find(b => b.id === s.atem.a) || {}).n, s.atem.w && (BR.find(b => b.id === s.atem.w) || {}).n].filter(Boolean).join(' + '))}</span>`;
    body = `<div class="bslots">${brSlot(s, 'atem')}${brSlot(s, 'wahr')}</div>${txField(s, 'atem', 'Anleitungstext', 9)}<div class="bar"><button class="ghost sm" data-a="bmOff" data-id="${id}" data-b="atem">✕ Atemteil in dieser Stunde rauslassen</button></div>`;
  } else if (type === 'mantra') {
    const mm = s.mantra && manById(s.mantra.id);
    mins = `${fmtMin(s.dur[k] == null ? 0 : s.dur[k])} Min.`;
    sum = `<span class="mts">${manTile(s)}${textTile('mantra')}</span><span class="muted"> ${esc(mm ? mm.n : 'kein Mantra gewählt')}</span>`;
    body = `<div class="bslots">${manSlot(s)}</div>${txField(s, 'mantra', 'Anleitungstext', 9)}<div class="bar"><button class="ghost sm" data-a="bmOff" data-id="${id}" data-b="mantra">✕ Mantra in dieser Stunde rauslassen</button></div>`;
  } else {
    mins = `${fmtMin(s.dur[k] == null ? 0 : s.dur[k])} Min.`;
    const txt = (s.tx[k] || '').replace(/\s+/g, ' ').trim();
    sum = `<span class="mts">${textTile(k)}</span><span class="tprev">${esc(txt.slice(0, 130))}${txt.length > 130 ? ' …' : ''}</span><span class="muted"> (${wc(txt)} Wörter)</span>`;
    body = txField(s, k, 'Text', k === 'shava' ? 12 : k === 'einl' ? 9 : 5);
  }
  return `<section class="bcard cat-${bcls(k)}${open ? ' open' : ''}" data-dsid="${id}" data-db="${k}"><div class="bh" data-a="tglb" data-sid="${id}" data-b="${k}"><span class="car">${open ? '▾' : '▸'}</span> <b data-bname="${id}:${k}">${esc(name)}</b> <span class="bsum">${sum}</span>${type === 'ex' ? `<span class="cntc" title="Anzahl der Übungen – Minuten werden an die Blockzeit angeglichen"><button class="sm" data-a="cntBlk" data-id="${id}" data-b="${k}" data-d="-1">−</button><b>${(s.blk[k] || []).length}</b><button class="sm" data-a="cntBlk" data-id="${id}" data-b="${k}" data-d="1">+</button></span>` : ''}</div>${open ? `<div class="bb">${body}</div>` : ''}</section>`;
}
function sessionCard(c, s, i) {
  const id = s.id;
  if (!s.bm) initBM(c, s);
  const head = `<div class="shead"><span class="no">${i + 1}</span> <span class="date">${esc(fmtDateW(s.date))}</span> <b>${esc(s.motto.title)}</b> <span class="muted">·</span> <span id="tinfo0-${id}">${timeInfo(s)}</span>${s.locked ? ' 🔒' : ''}<span class="grow"></span><label class="chk" title="Gilt für alle Übungen der Stunde: leichtere und schwerere Alternativen erscheinen in der Ausgabe und sind in der Übungsauswahl markiert"><input type="checkbox" data-chg="altdef" data-sid="${id}" ${s.altDef ? 'checked' : ''}> Alternativen standardmäßig mit ausgeben</label><label class="muted">Status</label> ${statSel(`s:${id}:status`, s.status || 'vorgeplant')}</div>`;
  const offBlocks = order(s).filter(k => !bon(s, k)).map(k => bn(s, k));
  return `<section class="panel sess noprint" data-sid0="${id}">${head}
<div class="grid">
${fld('Datum', inp(`s:${id}:date`, 'date', s.date))}
${fld('Motto (Titel)', inp(`s:${id}:motto.title`, 'text', s.motto.title, 'data-chg="mtitle" data-sid="' + id + '"'))}
${fld('Aus Motto-Liste', sel(`s:${id}:motto.themeId`, [['', '— eigenes Motto —']].concat(THEMES.map(t => [t.id, t.t])), s.motto.themeId, 'data-chg="theme" data-sid="' + id + '"'))}
${fld('Kernsatz', inp(`s:${id}:motto.kern`, 'text', s.motto.kern, 'data-tx="kern"'), 'wide')}
${fld('Körperlicher Fokus', inp(`s:${id}:motto.focus`, 'text', s.motto.focus, 'data-tx="focus"'), 'wide')}
</div>
${defPanel(c, s)}
${seqPanel(c, s)}
${fltPanel(c, s)}
<div class="timebox"><div class="tbh"><b>Ablauf dieser Stunde</b> <span id="tinfo-${id}">${timeInfo(s)}</span> <span class="grow"></span><button class="ghost sm" data-a="bAll" data-id="${id}" data-v="1">▾ alle aufklappen</button><button class="ghost sm" data-a="bAll" data-id="${id}" data-v="0">▸ alle zuklappen</button></div><div id="strip-${id}">${stripHtml(s, true)}</div></div>
${order(s).filter(k => bon(s, k)).map(k => blockCard(c, s, k)).join('')}
${offBlocks.length ? `<p class="muted">Ausgeblendete Blöcke: ${esc(offBlocks.join(', '))} – im Bereich „Ablauf & Blöcke definieren“ wieder einschaltbar.</p>` : ''}
${sessSaveForm(s)}
<div class="bar"><button data-a="reroll" data-id="${id}">🎲 Alle Übungen neu würfeln</button><button data-a="texts" data-id="${id}">✍ Texte neu (Vorlage)</button>
${state.settings.apiKey ? `<button data-a="aiTx" data-id="${id}">🤖 Texte per KI</button>` : ''}<button data-a="lock" data-id="${id}">${s.locked ? '🔓 Entsperren' : '🔒 Sperren'}</button>
<button data-a="preview" data-id="${id}">👁 Vorschau</button><button data-a="plPlay" data-id="${c.id}" data-sid="${id}" data-m="min" title="Minimalistischer Player">▶ Player</button><button data-a="plPlay" data-id="${c.id}" data-sid="${id}" data-m="det" title="Detailplayer mit Anleitungen und Texten">▶ Detailplayer</button><button data-a="saveSessTpl" data-id="${id}" title="Diese Stunde unter einem Namen als Vorlage speichern">★ Als Einzelstunden-Vorlage</button><button data-a="saveSessSingle" data-id="${id}" title="Diese Stunde als eigene Einzelstunde speichern (Seite Stunden)">⧉ Als Einzelstunde speichern</button></div></section>`;
}
function optLabel(e, c) {
  return `${e.n}${e.lv > 1 ? ' [' + (e.lv === 2 ? 'Mittel' : 'Fortg.') + ']' : ''}${contra(e, c.gebrechen) ? ' ⚠' : ''}${rating(e.id) === 0 ? ' ✕' : ''}${rating(e.id) >= 4 ? ' ★' : ''}`;
}
const lvName = e => ['', 'Anfänger', 'Mittel', 'Fortgeschritten'][e.lv] || '';
const lvDots = e => `<span class="dots" title="${lvName(e)}">${[1, 2, 3].map(n => `<i class="${n <= e.lv ? 'on' : ''}"></i>`).join('')}</span>`;
function altTile(s, key, j, x, dir, on) {
  if (!x) return '<span class="muted">–</span>';
  const w = dir === 'down' ? 'e' : 'h';
  return `<div class="alt ${dir}${on ? ' on' : ''}" title="${on ? 'Klicken: Alternative aus der Ausgabe entfernen' : 'Klicken: Alternative in die Ausgabe aufnehmen'} – ${esc(x.n)}">
<div class="xtile cat-${x.c} altt" data-a="togAlt" data-id="${s.id}" data-b="${key}" data-i="${j}" data-w="${w}"><span class="arr">${dir === 'down' ? '↓' : '↑'}</span>${figureSVG(x.pose)}${peakStar(x)}${on ? '<span class="chk-on">✓</span>' : ''}</div>
<b class="an">${esc(x.n)}</b></div>`;
}const rateStars = id => { const r = rating(id); return `<span class="stars">${[1, 2, 3, 4, 5].map(v => `<button class="st${v <= r ? ' on' : ''}" data-a="rate" data-id="${id}" data-v="${v}" title="Gefällt mir: ${v} von 5">★</button>`).join('')}<button class="st ban${r === 0 ? ' on' : ''}" data-a="rate" data-id="${id}" data-v="0" title="nie automatisch verwenden">⊘</button></span>`; };
const stRegChips = e => {
  const st = (e.st || []).map(k => STILE[k]).filter(Boolean), rg = ((e.kat && e.kat.reg) || []).map(k => KAT.reg[k]).filter(Boolean);
  const row = (arr, cls) => arr.length ? `<div class="kchips">${arr.map(x => `<span class="chip ${cls}">${esc(x)}</span>`).join('')}</div>` : '';
  return row(st, 'ks') + row(rg, 'kr') || '<span class="muted">–</span>';
};
function blockEditor(c, s, [key, label, cats]) {
  const items = s.blk[key], B = blockTargets(c, s);
  const tmin = sumMin(items), bud = B[key] || 0;
  const rows = items.map((it, j) => {
    normAlt(it);
    const e = exById(it.id) || { n: '?', pose: 'stand', lv: 1, x: [], c: 'stand' };
    const ea = altE(e), ha = altH(e), P = `s:${s.id}:blk.${key}.${j}`;
    if (e.txt) return `<div class="xrow xtxb" data-dsid="${s.id}" data-db="${key}" data-di="${j}"><div class="xc xt"><div class="xtile${it.opt ? ' opt' : ''} cat-${e.c} pkt"${it.seq ? '' : ' draggable="true"'} data-a="pk" data-sid="${s.id}" data-b="${key}" data-i="${j}" title="${it.seq ? 'Teil der Sequenz (als Ganzes verschiebbar) · Klick: Übung wählen' : 'Zum Verschieben ziehen · Klick: Übung oder Sonderbaustein wählen'}">${sbInfo(it, e).fig}</div><b class="an">${esc(e.n)}</b><i class="sa">Sonderbaustein</i></div>
<div class="xc xtx">${isRepSb(it) ? `<span class="muted">${e.sb === 'rep' ? 'Wiederholung ab hier: die folgenden Übungen bis „Wiederholung Ende“ werden ' + e.rn + 'x durchgeführt, die Dauer wird mitgerechnet.' : 'Ende der Wiederholung.'}</span>` : e.sb === 'pause' ? `<input type="text" class="sbnote" data-f="${P}.tx" value="${esc(it.tx || '')}" maxlength="60" placeholder="Hinweis (optional), z. B. Nachspüren …" autocomplete="off">` : e.sb === 'frei' ? `<input type="text" class="freitx" data-f="${P}.tx" value="${esc(it.tx || '')}" maxlength="60" placeholder="Name der Übung, z. B. Handstand …" autocomplete="off">` : e.sb === 'text' ? `<textarea rows="${Math.min(10, Math.max(3, Math.ceil(String(it.tx || '').length / 90)))}" data-f="${P}.tx" placeholder="Text für diese Stelle der Stunde …">${esc(it.tx || '')}</textarea>` : sbRefSelect(it, e, `data-chg="sbRef" data-sid="${s.id}" data-b="${key}" data-i="${j}"`) + sbPreview(it, e)}</div>
<div class="xc xd">${isRepSb(it) ? '' : `<input type="number" data-f="${P}.min" data-num="1" data-sum="1" data-sid="${s.id}" min="0.5" max="60" step="0.5" value="${it.min}"><span class="muted">Min.</span>`}</div>
<div class="xc xdel">${it.seq ? '' : `<button class="ghost trash" data-a="rm" data-id="${s.id}" data-b="${key}" data-i="${j}" title="Baustein löschen"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg></button>`}${it.seq ? '' : `<button class="ghost optb${it.opt ? ' on' : ''}" data-a="optTog" data-id="${s.id}" data-b="${key}" data-i="${j}" aria-pressed="${it.opt ? 'true' : 'false'}" title="${it.opt ? 'Optional: wird nur bei Bedarf durchgeführt (anklicken: wieder fest einplanen)' : 'Als optional markieren: aufnehmen, aber erst in der Stunde entscheiden'}"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke-dasharray="3 3"/><path d="M9.6 9.6a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1.1.9-1.1 1.7M12 17h.01"/></svg></button>`}</div></div>`;
    return `<div class="xrow" data-dsid="${s.id}" data-db="${key}" data-di="${j}"><div class="xc xt"><div class="xtile${it.opt ? ' opt' : ''} cat-${e.c} pkt"${it.seq ? '' : ' draggable="true"'} data-a="pk" data-sid="${s.id}" data-b="${key}" data-i="${j}" title="${it.seq ? 'Teil der Sequenz (als Ganzes verschiebbar) · Klick: Übung wählen' : 'Zum Verschieben ziehen · Klick: Übung wählen (mit Strichmännchen)'}">${figureSVG(e.pose)}${peakStar(e)}${handsMark(it, e)}</div>
<b class="an">${esc(e.n)}</b>${e.sa ? `<i class="sa">${esc(e.sa)}</i>` : ''}</div>
<div class="xc">${altTile(s, key, j, ea, 'down', effE(it))}</div>
<div class="xc">${altTile(s, key, j, ha, 'up', effH(it))}</div>
<div class="xc xk">${stRegChips(e)}</div>
<div class="xc xl">${lvDots(e)}<span class="chip">${lvName(e)}</span>${rateStars(e.id)}${(e.x || []).length ? `<small class="muted" title="Vorsicht bei">⚠ ${esc(e.x.map(g => GEBRECHEN[g]).join(', '))}</small>` : ''}</div>
<div class="xc xd"><input type="number" data-f="${P}.min" data-num="1" data-sum="1" data-sid="${s.id}" min="0.5" max="30" step="0.5" value="${it.min}"><span class="muted">Min.</span></div>
<div class="xc xdel">${it.seq ? '' : `<button class="ghost trash" data-a="rm" data-id="${s.id}" data-b="${key}" data-i="${j}" title="Übung löschen"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg></button>`}${it.seq ? '' : `<button class="ghost optb${it.opt ? ' on' : ''}" data-a="optTog" data-id="${s.id}" data-b="${key}" data-i="${j}" aria-pressed="${it.opt ? 'true' : 'false'}" title="${it.opt ? 'Optional: wird nur bei Bedarf durchgeführt (anklicken: wieder fest einplanen)' : 'Als optional markieren: aufnehmen, aber erst in der Stunde entscheiden'}"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke-dasharray="3 3"/><path d="M9.6 9.6a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1.1.9-1.1 1.7M12 17h.01"/></svg></button>`}${handsBtn(s, key, j, it, e)}</div></div>`;
  });
  return `<div class="blk"><div class="blkh"><span class="muted"><b id="bs-${s.id}-${key}">${fmtMin(tmin)}</b>${bud ? ' von ' + fmtMin(bud) : ''} Min.<span id="bo-${s.id}-${key}">${optMin(items) > 0 ? ' · ' + optNote(optMin(items)) : ''}</span></span>
<span class="grow"></span><button class="ghost sm" data-a="rerollBlk" data-id="${s.id}" data-b="${key}" title="Nur diesen Block neu würfeln">🎲 Block neu würfeln</button><button class="ghost sm" data-a="aiRerollBlk" data-id="${s.id}" data-b="${key}" ${ui.aiBlkBusy ? 'disabled' : ''} title="Block per KI neu berechnen: Anschluss an die letzte Übung des vorigen Blocks, gleiche Anzahl Übungen, guter Flow von Übung zu Übung">${ui.aiBlkBusy === s.id + ':' + key ? 'KI rechnet …' : '✨ Block per KI'}</button><button class="ghost sm" data-a="fitBlk" data-id="${s.id}" data-b="${key}" title="Minuten auf das Zeitbudget angleichen">⚖ auf Zeit</button></div>
${items.length ? `<div class="xhead"><div>Übung</div><div>↓ Leichtere Alternative</div><div>↑ Schwerere Alternative</div><div>Yogastil & Körperregion</div><div>Schwierigkeitsgrad · Gefällt mir</div><div>Dauer</div><div></div></div>` : ''}${seqWrapRows(s, key, items, rows) || '<div class="muted">keine Übung – mit „＋“ in der Kopfzeile oder hier hinzufügen</div>'}
<button class="pkb add" data-a="pk" data-sid="${s.id}" data-b="${key}" data-i="" title="Übung hinzufügen (mit Strichmännchen)">＋ Übung auswählen …</button></div>`;
}
const DOC_GRP = {
  p: { keys: ['ueb', 'uebS', 'anaP'], title: 'Programm', ic: 'prog', hint: 'Blätter über alle Stunden des Programms (nur bei allen gewählten Stunden)' },
  s: { keys: ['prax', 'uebE', 'std', 'blatt', 'blatt2', 'alt', 'uebw', 'detS', 'spick', 'hands', 'anaS'], title: 'Einzelstunde', ic: 'stunde', hint: 'Je gewählter Stunde ein Blatt – Ausdruck nach Stunde sortiert' },
  a: { keys: ['mat', 'geb', 'detail', 'katall'], title: 'Allgemein', ic: 'katalog', hint: 'Nachschlage-Listen, gelten für die gewählten Stunden' }
};
const DOC_OPT = {
  ueb: ['Kompakte Übersicht', 'Tabelle aller Stunden im Querformat'], prax: ['Praxisblatt (nach Vorlage)', 'Eine Seite je Stunde: Zeiten, Mobilisation, Shakti Naam und Asanas als Strichmännchen'], uebE: ['Stundenübersicht der Stunde', 'Verlauf und alle Kacheln, eine Seite je Stunde (Querformat)'], uebS: ['Stundenübersicht', 'Alle Stunden mit Verlauf und Kacheln (Querformat)'], anaP: ['Programmanalyse', 'Auswertung über das ganze Programm'],
  std: ['Stundenpläne mit Texten', 'Ablauf, Texte, Übungstabelle und Material'], blatt: ['Strichmännchen-Blätter', 'Übungsfolge als Kacheln (Querformat)'], blatt2: ['Strichmännchenblätter 2', 'Nur Datum, Motto und alle Übungen als Strichmännchen, eine Seite füllend (Querformat)'], alt: ['Alternativenblatt', 'Leichtere Alternativen zu den Übungen'],
  uebw: ['Blatt Übungsauswahl', 'Kacheln mit Beschreibung wie im Katalog'], detS: ['Detailbeschreibungen der Stunde', 'Technik, Wirkung, Varianten der Übungen dieser Stunde'], spick: ['Spickzettel', 'Ablauf mit Zeiten auf einer Seite'], hands: ['Hands-on Blatt', 'Adjustment, Support und Assistance'], anaS: ['Einzelstundenanalyse', 'Kennzahlen und Verteilungen je Stunde'],
  mat: ['Materialliste', 'Matte und Hilfsmittel mit Übungen'], geb: ['Gebrechenliste', 'Übungen und für wen nicht geeignet'], detail: ['Detailbeschreibungen', 'Technik, Wirkung, Varianten je Übung'], katall: ['Übungskatalog gesamt', 'Alle Übungen des Katalogs mit Beschreibung']
};
function docPanel(c) {
  const o = ui.doc; if (c.single) o.sel = '0';
  const idx = docSelIdx(c, o), n = c.sessions.length, allSel = idx.length === n, progOk = !c.single && allSel;
  const pills = (c.single ? '' : `<button class="pill pillw${allSel ? ' on' : ''}" data-a="docSel" data-v="all">${allSel ? '✓ Alle Stunden' : 'Alle Stunden'}</button>`) + c.sessions.map((s, i) => `<button class="pill${idx.includes(i) ? ' on' : ''} stp-${s.status || 'vorgeplant'}" data-a="docSel" data-v="${i}" title="${esc(s.motto.title)}">${i + 1}<small>${esc(fmtDateS(s.date))}</small></button>`).join('');
  const tile = (k, off) => `<label class="dopt${o[k] && !off ? ' on' : ''}${off ? ' off' : ''}"><input type="checkbox" data-f="u:doc.${k}" ${o[k] ? 'checked' : ''} ${off ? 'disabled' : ''}><span class="dt"><b>${DOC_OPT[k][0]}</b><small>${DOC_OPT[k][1]}</small></span></label>`;
  const card = g => { const G = DOC_GRP[g], off = g === 'p' && !progOk, cnt = G.keys.filter(k => o[k] && !off).length;
    return `<section class="dgrp g-${g}${off ? ' off' : ''}"><div class="dgh">${hicon(G.ic)}<div><h4>${G.title}</h4><small>${off ? (c.single ? 'Nur bei Programmen verfügbar' : 'Nur wenn alle Stunden gewählt sind') : G.hint}</small></div><span class="dgc">${cnt}/${G.keys.length}</span></div>
<div class="dopts">${G.keys.map(k => tile(k, off)).join('')}</div>${off ? '' : `<div class="dgb"><button class="ghost sm" data-a="docGrp" data-g="${g}" data-v="1">alle</button><button class="ghost sm" data-a="docGrp" data-g="${g}" data-v="0">keine</button></div>`}</section>`; };
  return `<div class="docsel noprint"><span class="muted">Stunden:</span>${c.single ? '<b>diese Einzelstunde</b>' : '<div class="pills">' + pills + '</div><span class="muted">' + idx.length + ' von ' + n + ' gewählt</span>'}</div>
<div class="panel noprint"><div class="dgrps">${card('p')}${card('s')}${card('a')}</div></div>
<div class="outblocks noprint"><section class="panel"><h3 class="oh">📁 Dateiausleitung</h3><p class="muted">Speichert die gewählten Blätter als Datei auf deinem Rechner.</p>
<div class="bar"><button class="primary" data-a="pdfSave">⬇ PDF speichern (A4, direkt)</button><button data-a="docx">⬇ Word (.docx)</button><button data-a="html">⬇ HTML-Datei</button><button data-a="print">🖨 Drucken / PDF über Druckdialog</button></div>
<p class="muted">„PDF speichern“ erzeugt die Datei direkt, ohne Druckdialog (Seiten als Bilder, Text nicht markierbar). Für ein PDF mit markierbarem Text: Druckdialog und dort „Als PDF speichern“ wählen.</p></section>
<section class="panel"><h3 class="oh">🎬 Video-Ausleitung (iPhone)</h3><p class="muted">Erzeugt aus den gewählten Stunden Videos der Player-Sequenz (MP4, Querformat) – für iPhone und iPad, direkt in „Dateien“ oder „Fotos“ abspielbar. Pro Stunde eine Datei.</p>
<div class="vidopt"><span class="muted">Auflösung:</span><div class="seg">${[[720, '1280 × 720 (kleiner)'], [1080, '1920 × 1080 (schärfer)']].map(([v, l]) => `<button type="button" class="sgb${(ui.vidRes === 1080 ? 1080 : 720) === v ? ' on' : ''}" data-a="vidRes" data-v="${v}">${l}</button>`).join('')}</div></div>
<div class="bar"><button class="primary" data-a="vidExport" data-m="min">🎬 Video minimalistisch</button><button data-a="vidExport" data-m="det">🎬 Video mit Details</button></div>
<p class="muted" id="vidProg">Das Erzeugen dauert je nach Stundenlänge etwa 10 bis 60 Sekunden pro Stunde. Der Browser-Tab muss dabei geöffnet bleiben.</p></section>
<section class="panel"><h3 class="oh">✉ E-Mail-Ausleitung</h3><div class="grid">
<div class="fld wide"><label>E-Mail an – Empfänger auswählen (Verwaltung unter ⚙ Einstellungen)</label><div class="fchips">${rcpList().length ? rcpList().map(r => '<label class="fchip' + ((c.mailTo || []).includes(r.id) ? ' on' : '') + '" title="' + esc(r.email) + '"><input type="checkbox" data-a="rcpTog" data-id="' + r.id + '" ' + ((c.mailTo || []).includes(r.id) ? 'checked' : '') + '> ' + esc(r.name || r.email) + '</label>').join('') : '<span class="muted">Noch keine weiteren Empfänger – unter ⚙ Einstellungen anlegen.</span>'}</div></div>
${fld('Weitere Adresse(n) (mit Komma getrennt)', inp('c:email', 'text', c.email, 'placeholder="name@example.de"'))}
${fld('Betreff', inp('c:emailSubject', 'text', c.emailSubject || c.name + ' – Programm'))}
</div><div class="bar"><button class="primary" data-a="mail">✉ E-Mail öffnen (Übersicht als Text)</button>
<button data-a="gmail">🌐 Gmail öffnen + PDF speichern</button><button data-a="eml">📎 E-Mail-Entwurf mit Anhang (.eml)</button><button data-a="copy">📋 Übersicht kopieren</button></div>
<p class="muted">Hinweis: Ein Browser kann selbst keine Mails mit Anhang versenden. „E-Mail-Entwurf (.eml)“ erzeugt eine Datei, die sich per Doppelklick in Outlook/Thunderbird als fertiger Entwurf mit Anhang öffnet; dort nur noch auf „Senden“ klicken.</p></section></div>
<div class="doc" id="docPreview">${buildDoc(c, o)}</div>`;
}
// ---- Übungen im Katalog bearbeiten ----
const exIsBR = id => BR_ORIG.has(id);
const bsEq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function exDraftOpen(o) {
  const br = exIsBR(o.id);
  ui.exEdit = o.id; ui.exDraftKat = {}; ui.exDraftAuto = []; ui.exDraftAll = false;
  ui.exDraft = { n: o.n, sa: o.sa || '', d: o.d || '', m: o.m, c: br ? o.k : o.c, lv: o.lv, s: o.s === 1 ? 1 : 0, st: (o.st || []).slice(), x: (o.x || []).slice(), pose: o.pose || 'stand', ic: o.ic || o.id };
}
function autoKat(o) { const t = JSON.parse(JSON.stringify(o)), d = ui.exDraft; t.pose = d.pose; t.c = d.c; delete t.kat; deriveKat(t); return t.kat; }
function katEff(o, g) { if (g in ui.exDraftKat) return ui.exDraftKat[g]; if (ui.exDraftAuto.includes(g)) return autoKat(o)[g]; return (o.kat && o.kat[g]) || (g === 'en' ? '' : []); }
const katManual = (o, g) => g in ui.exDraftKat || (manualGroups(o.id).includes(g) && !ui.exDraftAuto.includes(g));
// Chipzeile mit Bausteinen: Auswahl per Klick, eigene Bausteine (v_…) umbenennen/löschen, „＋ neu“ legt einen Baustein an
function chipRow(type, group, list, selected, field) {
  const chips = Object.keys(list).map(k => `<span class="chipx"><button type="button" class="chipsel${selected.includes(k) ? ' on' : ''}" data-a="dtog" data-g="${esc(field)}" data-v="${esc(k)}">${esc(String(type === 'cats' ? (list[k].n || list[k]) : list[k]).replace(/\s*\*$/, ''))}</button>${/^v_/.test(k) ? `<button type="button" class="chipmini" data-a="vocRename" data-t="${type}" data-g="${esc(group)}" data-v="${esc(k)}" title="Umbenennen">✎</button><button type="button" class="chipmini" data-a="vocDel" data-t="${type}" data-g="${esc(group)}" data-v="${esc(k)}" title="Baustein löschen">✕</button>` : ''}</span>`).join('');
  const id = `vocIn-${type}-${group}`;
  return `<div class="chiprow">${chips}<span class="chipnew"><input type="text" id="${id}" placeholder="＋ neu …" maxlength="60"><button type="button" class="sm" data-a="vocNew" data-t="${type}" data-g="${esc(group)}" title="Neuen Baustein anlegen und auswählen">＋</button></span></div>`;
}
function exEditForm(o) {
  const d = ui.exDraft, br = exIsBR(o.id);
  const cats = br ? { atem: 'Atemübung', wahr: 'Wahrnehmungsübung' } : CATS;
  const sym = br ? ICON_KEYS.map(k => `<button type="button" class="xp${d.ic === k ? ' on' : ''}" data-a="exPickSym" data-v="${esc(k)}" title="${esc(k)}">${iconSVG(k)}</button>`) : null;
  const kats = br ? '' : `<div class="kats exkats"><b>Weitere Kategorien</b> <small class="muted">🔒 = manuell gesetzt, bleibt wie eingestellt · ohne Schloss = wird aus Haltung, Art und Schlagworten berechnet</small>${KAT_GROUPS.map(g => {
    const cur_ = katEff(o, g), man = katManual(o, g), arr = Array.isArray(cur_) ? cur_ : (cur_ ? [cur_] : []);
    return `<div class="kl"><span class="kt${man ? ' lock' : ''}">${man ? '🔒 ' : ''}${esc(KATTITLE[g])}</span>${man ? `<button type="button" class="ghost sm" data-a="grpAuto" data-g="${g}" title="Manuellen Wert verwerfen und neu berechnen">↻ Neu berechnen</button>` : ''}${chipRow('kat', g, KAT[g], arr, g)}</div>`;
  }).join('')}<label class="chk"><input type="checkbox" data-f="u:exDraftAll" ${ui.exDraftAll ? 'checked' : ''}> Beim Speichern <b>alle</b> Kategorien neu berechnen (auch manuelle)</label></div>`;
  return `<div class="exform"><h3>Übung bearbeiten</h3><div class="grid">
${fld('Name', inp('u:exDraft.n', 'text', d.n))}${br ? '' : fld('Sanskrit', inp('u:exDraft.sa', 'text', d.sa))}
${fld('Art', sel('u:exDraft.c', Object.keys(cats).map(k => [k, cats[k]]), d.c))}
${fld('Ab Stufe', sel('u:exDraft.lv', [[1, 'Anfänger'], [2, 'Mittel'], [3, 'Fortgeschritten']], d.lv, 'data-num="1"'))}${fld('Dauer (Min.)', inp('u:exDraft.m', 'number', d.m, 'min="0.5" max="30" step="0.5"'))}
<div class="fld"><label>&nbsp;</label><label class="chk"><input type="checkbox" data-f="u:exDraft.s" ${d.s ? 'checked' : ''}> für Senioren geeignet</label></div>
<div class="fld wide"><label>Beschreibung</label><textarea data-f="u:exDraft.d" rows="3">${esc(d.d)}</textarea></div></div>
<div class="fld"><label>Symbol</label>${sym ? `<div class="xpick">${sym.join('')}</div>` : posePickerHTML(d.pose, 'exPickSym')}</div>
<div class="fld"><label>Yogastile</label>${chipRow('stile', '', STILE, d.st, 'st')}</div>
<div class="fld"><label>Vorsicht bei</label>${chipRow('geb', '', GEBRECHEN, d.x, 'x')}</div>
${br ? '' : `<div class="fld"><label>Neue Art anlegen</label><small class="muted">Übungen mit eigener Art erscheinen im Katalog, werden aber nicht automatisch für Programme vorgeschlagen (nur manuell wählbar).</small>${chipRow('cats', '', {}, [], 'c')}</div>`}
${kats}
<div class="bar"><button class="primary" data-a="exEditSave">Speichern</button><button data-a="exEditCancel">Abbrechen</button></div></div>`;
}
function viewCatalog() {
  const f = ui.cat, c = ui.courseId && cur(), geb = c ? c.gebrechen : [];
  const q = norm(f.q);
  const list = exAll().filter(e => (!q || norm(e.n).includes(q)) && (!f.cat || e.c === f.cat) && (!f.lvl || levelChips(e).includes(f.lvl)) && (!f.geb || !e.x.includes(f.geb)) && (!f.st || (e.st || []).includes(f.st)) && ['reg', 'mus', 'atm', 'auf', 'sup', 'mat', 'pos', 'dir', 'wirk', 'chakra', 'ziel'].every(k => !f['k_' + k] || ((e.kat && e.kat[k]) || []).includes(f['k_' + k])) && (!f.k_en || (e.kat && e.kat.en) === f.k_en));
  const katOn = ['k_reg', 'k_mus', 'k_atm', 'k_auf', 'k_sup', 'k_mat', 'k_pos', 'k_dir', 'k_wirk', 'k_en', 'k_chakra', 'k_ziel'].some(k => f[k]);
  const blist = BR.filter(b => !katOn && (!q || norm(b.n).includes(q)) && (!f.st || (b.st || []).includes(f.st)) && (!f.lvl || levelChips(b).includes(f.lvl)) && (!f.geb || !b.x.includes(f.geb)));
  const stars = id => { const r = rating(id); return `<span class="stars">${[1, 2, 3, 4, 5].map(v => `<button class="st${v <= r ? ' on' : ''}" data-a="rate" data-id="${id}" data-v="${v}" title="${v} von 5">★</button>`).join('')}<button class="st ban${r === 0 ? ' on' : ''}" data-a="rate" data-id="${id}" data-v="0" title="nie automatisch verwenden">⊘</button></span>`; };
  const vtile = (x, dir) => x ? `<div class="vt cat-${x.c} ${dir}" title="${dir === 'up' ? 'Anspruchsvollere' : 'Leichtere'} Variante: ${esc(x.n)}"><span class="arr">${dir === 'up' ? '↑' : '↓'}</span>${figureSVG(x.pose)}${peakStar(x)}<small>${esc(x.n)}</small></div>` : '<span class="muted">–</span>';
  const stileChips = o => (o.st || []).map(k => `<span class="chip stl st-${k}">${esc(STILE[k] || k)}</span>`).join('');
  const dtl = (o, cols) => {
    if (!ui.exOpen.has(o.id)) return '';
    if (ui.exEdit === o.id) return `<tr class="detail"><td colspan="${cols}">${exEditForm(o)}</td></tr>`;
    const ea = altE(o), ha = altH(o), kraft = o.c === 'kraft' && o.how;
    const bits = [];
    if (o.d) bits.push(`<p>${esc(o.d)}</p>`);
    if (kraft) bits.push(`<p><b>Ausführung:</b> ${esc(o.how)}<br><b>Wirkung:</b> ${esc(o.w || '')}<br><b>Leichtere Variante / Hinweis:</b> ${esc(o.ev || '')}${o.reps ? `<br><b>Dosierung (Kursplan):</b> ${esc(o.reps)}` : ''}</p>`);
    else if (o.w) bits.push(`<p class="dwarn">⚠ ${esc(o.w)}</p>`);
    if (!o.d && !kraft) bits.push('<p class="muted">Aus den Kursunterlagen (Übersicht und Flow-Blätter) – dort ohne ausführliche Beschreibung.</p>');
    const meta = [];
    if (o.sa) meta.push(`<b>Sanskrit:</b> <i>${esc(o.sa)}</i> <span class="muted">(${o.sv === false ? 'Standardbezeichnung – im Skript nicht belegt' : 'im Skript belegt'})</span>`);
    meta.push(`<b>Yogastile:</b> ${stileChips(o) || '–'}`);
    meta.push(`<b>Stufe:</b> ${levelDisplay(o).join(', ')} · <b>Dauer:</b> ${o.m} Min.${o.c ? ' · <b>Art:</b> ' + esc(CATS[o.c] || '') : ''}`);
    meta.push(`<b>Quelle:</b> ${esc(o.src || (o.script === false || !o.script ? 'Kursunterlagen Herbst-Winter 2026' : ''))}`);
    if (ea || ha) meta.push(`<b>Varianten:</b> ${ea ? '↓ leichter: ' + esc(ea.n) : ''}${ea && ha ? ' &nbsp;·&nbsp; ' : ''}${ha ? '↑ anspruchsvoller: ' + esc(ha.n) : ''}`);
    if (o.kat) {
      const line = k => { const l = katLabels(o, k); return l.length ? `<div class="kl"><span class="kt">${esc(KATTITLE[k])}</span> ${l.map(x => `<span class="chip kc">${esc(x)}</span>`).join('')}${k === 'chakra' && o.chakraSrc ? `<small class="muted"> ${o.chakraSrc === 'skript' ? '(laut Skript, Modul 3)' : '(Zuordnung nach Regel: Herzöffner → Anahata, Hüftöffner → Svadhisthana, Füße/Beine → Muladhara)'}</small>` : ''}</div>` : ''; };
      meta.push(`<div class="kats"><b>Weitere Kategorien</b>${['reg', 'mus', 'atm', 'auf', 'sup', 'mat', 'pos', 'dir', 'wirk', 'en', 'chakra', 'ziel'].map(line).join('')}</div>`);
    }
    return `<tr class="detail"><td colspan="${cols}"><div class="dgrid"><div class="dtext">${bits.join('')}</div><div class="dmeta">${meta.map(m => `<div>${m}</div>`).join('')}</div></div><div class="bar"><button class="sm" data-a="exEditOpen" data-id="${o.id}">✎ Bearbeiten</button>${exIsEdited(o.id) ? `<button class="ghost sm" data-a="exEditResetBtn" data-id="${o.id}">↺ Auf Original zurücksetzen</button>` : ''}</div></td></tr>`;
  };
  const row = e => {
    const ea = altE(e), ha = altH(e), open = ui.exOpen.has(e.id);
    return `<tr class="mainrow${open ? ' open' : ''} ${rating(e.id) === 0 ? 'banned' : ''}"><td class="tilec"><div class="ktile cat-${e.c} clk" data-a="exinfo" data-id="${e.id}" title="Details ein-/ausklappen">${figureSVG(e.pose)}${peakStar(e)}</div></td>
<td><a class="nm" data-a="exinfo" data-id="${e.id}" title="Details ein-/ausklappen"><b>${esc(e.n)}</b> <span class="car">${open ? '▾' : '▸'}</span></a>${exIsEdited(e.id) ? ' <span class="chip edtd">angepasst</span>' : ''}${e.sa ? `<br><i class="sa">${esc(e.sa)}${e.sv === false ? ' *' : ''}</i>` : ''}<br><small class="muted">${esc(CATS[e.c])} · ${e.m} Min.</small>${e.custom ? ` <button class="ghost sm danger" data-a="delEx" data-id="${e.id}">löschen</button>` : ''}</td>
<td>${stileChips(e)}</td><td>${levelDisplay(e).map(l => `<span class="chip">${l}</span>`).join('')}</td><td>${e.x.map(g => `<span class="chip warn">${esc(GEBRECHEN[g])}</span>`).join('') || '<span class="muted">–</span>'}</td>
<td class="vtc">${vtile(ea, 'down')}</td><td class="vtc">${vtile(ha, 'up')}</td><td>${stars(e.id)}</td></tr>${dtl(e, 8)}`;
  };
  const brow = b => { const open = ui.exOpen.has(b.id); return `<tr class="mainrow${open ? ' open' : ''} ${rating(b.id) === 0 ? 'banned' : ''}"><td class="tilec"><div class="ktile cat-br_${b.k} clk" data-a="exinfo" data-id="${b.id}" title="Details ein-/ausklappen">${breathIconSVG(b.id)}</div></td><td><a class="nm" data-a="exinfo" data-id="${b.id}"><b>${esc(b.n)}</b> <span class="car">${open ? '▾' : '▸'}</span></a>${exIsEdited(b.id) ? ' <span class="chip edtd">angepasst</span>' : ''}${b.sa ? `<br><i class="sa">${esc(b.sa)}</i>` : ''}<br><small class="muted">${b.k === 'atem' ? 'Atemübung' : 'Wahrnehmungsübung'} · ${b.m} Min.</small></td><td>${stileChips(b)}</td><td>${levelDisplay(b).map(l => `<span class="chip">${l}</span>`).join('')}</td><td>${b.x.map(g => `<span class="chip warn">${esc(GEBRECHEN[g])}</span>`).join('') || '<span class="muted">–</span>'}</td><td>${stars(b.id)}</td></tr>${dtl(b, 6)}`; };  const n = ui.newEx;
  return `<div class="bar"><h1>Übungskatalog</h1><span class="muted">${list.length} von ${exAll().length} Übungen · ${blist.length} von ${BR.length} Atem- und Wahrnehmungsübungen</span></div>
<p class="muted">Bewerte, wie gern du eine Übung magst: mehr Sterne = wird häufiger vorgeschlagen, ⊘ = nie automatisch. Auf jeder Kachel zeigen kleine Kacheln die leichtere (↓) und die anspruchsvollere (↑) Variante. Ein Klick auf Kachel oder Namen klappt Beschreibung, Hinweise, Sanskrit, Stile und Quelle auf. Alle Übungen stammen aus deinen Kursunterlagen oder dem Ausbildungsskript; eigene lassen sich unten ergänzen. * = Sanskrit-Name nicht im Skript belegt.</p>
<div class="panel"><div class="grid">${fld('Suche', `<input type="search" data-f="u:cat.q" data-live="1" value="${esc(f.q)}" placeholder="z. B. Krieger">`)}
${fld('Kategorie', sel('u:cat.cat', [['', 'Alle']].concat(Object.keys(CATS).map(k => [k, CATS[k]])), f.cat))}
${fld('Geeignet für', sel('u:cat.lvl', [['', 'Alle'], ['Anfänger', 'Anfänger'], ['Mittel', 'Mittel'], ['Fortgeschritten', 'Fortgeschritten'], ['Senioren', 'Senioren']], f.lvl))}
${fld('Ohne Belastung für', sel('u:cat.geb', [['', '–']].concat(Object.keys(GEBRECHEN).map(k => [k, GEBRECHEN[k]])), f.geb))}
${fld('Yogastil', sel('u:cat.st', [['', 'Alle']].concat(Object.keys(STILE).map(k => [k, STILE[k]])), f.st))}</div></div>
<details class="panel mini" data-id="katf" ${ui.open.has('katf') ? 'open' : ''}><summary>Weitere Kategorien <span class="muted">(Filter nach Körperregion, Muskulatur, Atmung, Aufmerksamkeit, Unterstützung, Material, Haltung, Wirbelsäule, Wirkung, Energetik, Chakra, Ziel)</span></summary><div class="grid">${['reg', 'mus', 'atm', 'auf', 'sup', 'mat', 'pos', 'dir', 'wirk', 'en', 'chakra', 'ziel'].map(k => fld(KATTITLE[k], sel('u:cat.k_' + k, [['', 'Alle']].concat(Object.keys(KAT[k]).map(x => [x, KAT[k][x]])), f['k_' + k]))).join('')}</div><p class="muted">* ergänzt. Die Kategorien werden aus Haltung, Art und Schlagworten abgeleitet; das Chakra folgt – wo vorhanden – dem Skript (Modul 3). Die Angaben stehen im aufgeklappten Detail jeder Übung.</p></details>
${(!f.cat && !f.lvl && !f.geb && !f.st && !katOn) ? sonderPanels(q) : ''}
<div class="legend catlegend">${Object.keys(CATS).map(k => `<span class="lg cat-${k}"><i></i>${esc(CATS[k])}</span>`).join('')}</div>
<div class="tblwrap"><table class="cat"><thead><tr><th></th><th>Übung / Sanskrit</th><th>Yogastile</th><th>Stufe</th><th>Vorsicht bei</th><th>↓ Leichter</th><th>↑ Anspruchsvoller</th><th>Gefällt mir</th></tr></thead><tbody>${list.map(row).join('')}</tbody></table></div>
<h2>Atem- und Wahrnehmungsübungen</h2><div class="legend catlegend"><span class="lg cat-br_atem"><i></i>Atemübung</span><span class="lg cat-br_wahr"><i></i>Wahrnehmungsübung</span></div><div class="tblwrap"><table class="cat"><thead><tr><th></th><th>Übung</th><th>Yogastile</th><th>Stufe</th><th>Vorsicht bei</th><th>Gefällt mir</th></tr></thead><tbody>${blist.map(brow).join('')}</tbody></table></div>
<details class="panel" data-id="newex" ${ui.open.has('newex') ? 'open' : ''}><summary>＋ Eigene Übung hinzufügen</summary><div class="grid">
${fld('Name', inp('u:newEx.n', 'text', n.n))}${fld('Kategorie', sel('u:newEx.c', Object.keys(CATS).map(k => [k, CATS[k]]), n.c))}
${fld('Ab Stufe', sel('u:newEx.lv', [[1, 'Anfänger'], [2, 'Mittel'], [3, 'Fortgeschritten']], n.lv, 'data-num="1"'))}${fld('Dauer (Min.)', inp('u:newEx.m', 'number', n.m, 'min="1" max="10" step="0.5"'))}
<div class="fld wide"><label>Symbol (Strichmännchen)</label>${posePickerHTML(n.pose, 'newPose')}</div>
${fld('Schlagworte (z. B. kraft balance herz)', inp('u:newEx.tags', 'text', n.tags))}
${fld('Leichtere Alternative', sel('u:newEx.e', [['', '–']].concat(exAll().map(e => [e.id, e.n])), n.e))}
<div class="fld wide"><label>Vorsicht bei</label><div class="checks">${Object.keys(GEBRECHEN).map(k => `<label class="chk"><input type="checkbox" data-a="toggleNewX" data-k="${k}" ${n.x.includes(k) ? 'checked' : ''}> ${esc(GEBRECHEN[k])}</label>`).join('')}</div></div></div>
<div class="bar"><button class="primary" data-a="addEx">Zum Katalog hinzufügen</button></div></details>`;
}
function viewSettings() {
  const g = state.settings;
  return `<div class="bar"><h1>Einstellungen & Backup</h1></div>
<div class="panel"><h3>Speicherung</h3><p class="muted">Alle Programme, Vorlagen und Bewertungen werden automatisch in diesem Browser gespeichert (auf diesem Rechner). Für ein Backup oder um auf einem anderen Rechner weiterzuarbeiten: Datei exportieren und dort importieren.</p>
<div class="bar"><button class="primary" data-a="exportAll">⬇ Backup exportieren (.json)</button><button data-a="importPick">⬆ Backup importieren …</button><button class="danger" data-a="resetAll">Alle Daten löschen</button></div></div>
${rcpPanel()}
<div class="panel"><h3>KI-Texte (optional)</h3><p class="muted">Ohne Schlüssel erzeugt die App Texte und Mottos aus eingebauten Bausteinen (funktioniert offline). Mit einem eigenen API-Schlüssel (Anthropic oder ein anderer KI-Dienst) kann sie zusätzlich freie Texte und Mottos formulieren.</p>
<div class="grid">${fld('Anbieter', sel('g:provider', Object.keys(AI_PROV).map(k => [k, AI_PROV[k].n]), aiProvider(), 'data-chg="aiProv"'))}${fld('API-Schlüssel', inp('g:apiKey', 'password', g.apiKey, 'autocomplete="off" placeholder="sk-…"'))}${aiProvider() === 'anthropic' ? fld('Modell', sel('g:model', [['claude-sonnet-5-5', 'Claude Sonnet 5.5 (empfohlen)'], ['claude-opus-5-5', 'Claude Opus 5.5 (gründlicher, teurer)'], ['claude-fable-5-1', 'Claude Fable 5.1'], ['claude-haiku-4-5-20251001', 'Claude Haiku 4.5 (schnell, günstig)']], /^claude-/.test(g.model) ? g.model : 'claude-sonnet-5-5')) : fld('Modellname', inp('g:model', 'text', g.model, 'placeholder="' + AI_PROV[aiProvider()].model + '"')) + fld('Adresse (Base-URL)', inp('g:baseUrl', 'text', g.baseUrl, 'placeholder="' + (AI_PROV[aiProvider()].url || 'https://…/v1') + '"'), 'wide')}</div><p class="muted">${aiProvider() === 'anthropic' ? 'Anthropic-Schlüssel gibt es unter console.anthropic.com.' : 'Der Dienst muss das OpenAI-Format (/chat/completions) sprechen und Zugriffe aus dem Browser erlauben (CORS). Modellnamen findest du in der Dokumentation des Anbieters.'} Der Schlüssel bleibt nur in diesem Browser gespeichert und wird nur an den gewählten Dienst gesendet.</p>
<label class="chk"><input type="checkbox" data-f="g:hlKeys" ${g.hlKeys === false ? '' : 'checked'}> Schlüsselwörter in Anleitungstexten hervorheben (Editor und Ausdruck)</label>
<div class="bar"><button data-a="aiTest">🔌 Verbindung testen</button><span class="muted" id="aiTestRes"></span></div></div>`;
}

// ---------- Aktionen ----------
function startCourse(c) { state.courses.unshift(c); planCourse(c); ui.view = 'course'; ui.courseId = c.id; ui.tab = 'frame'; ui.open = new Set(['set', 'ovw']); save(); render(); }
function sessionOf(id) { const c = cur(); return { c, s: c.sessions.find(x => x.id === id) }; }
function regenIfNotEdited(c, s, k) { if (!s.txEdited[k]) genTexts(c, s, idxOf(c, s), [k]), s.txEdited[k] = false; }
// ---- Status: Änderungen setzen die Stunde (bzw. den Rahmen) automatisch auf „In Planung“ ----
const MUT = new Set(['aiRerollBlk', 'seqOn', 'seqBlkAdd', 'seqBlkDel', 'seqApply', 'seqGrpMv', 'mv', 'rm', 'alt', 'togAlt', 'cntBlk', 'rerollBlk', 'fitBlk', 'fitS', 'pkpick', 'pkbrpick', 'pkmanpick', 'tglw', 'addBlock', 'delBlock', 'mvBlock', 'bmReset', 'bmOff', 'sbOn', 'sbWahr', 'sbMobi', 'sbKraft', 'tplUse', 'txClear', 'aiTx', 'tplAiGo', 'bothAll']);
const MUTC = new Set(['toggleGeb', 'toggleDay', 'cTog']);
function setStatusDom(f, v) { document.querySelectorAll(`select[data-f="${f}"]`).forEach(n => { n.value = v; n.className = n.className.replace(/stat-\w+/, 'stat-' + v); }); }
function touch(s) {
  if (!s || s.status === 'in_planung') return;
  s.status = 'in_planung'; setStatusDom(`s:${s.id}:status`, 'in_planung');
  const card = document.querySelector(`[data-sid0="${s.id}"]`); if (card) card.className = card.className.replace(/stc-\w+/, '');
}
function touchC(c) { if (c && c.status !== 'in_planung') { c.status = 'in_planung'; setStatusDom('c:status', 'in_planung'); } }
const A = {
  noop() { },
  fltTog(d) {
    const { s } = sessionOf(d.id); s.flt = s.flt || fltDefault(); const f = s.flt; f.kat = f.kat || {}; f.st = f.st || [];
    const arr = d.d === 'st' ? f.st : (f.kat[d.d] = f.kat[d.d] || []), i = arr.indexOf(d.v); i < 0 ? arr.push(d.v) : arr.splice(i, 1);
    ui.open.add('flt:' + s.id); save(); render();
  },
  fltGeb(d) { const { s } = sessionOf(d.id); const g = s.flt.geb = s.flt.geb || [], i = g.indexOf(d.v); i < 0 ? g.push(d.v) : g.splice(i, 1); ui.open.add('flt:' + s.id); save(); render(); },
  fltReset(d) { const { s } = sessionOf(d.id); s.flt = null; ui.open.add('flt:' + s.id); save(); render(); toast('Filter auf Standard zurückgesetzt – bereits gewählte Übungen bleiben.'); },
  frameView() { ui.frameBlocks = !ui.frameBlocks; render(); },
  nav(d) { ui.view = d.v; ui.seqAiOn = false; ui.courseId = null; ui.tplSel = null; ui.saveSess = null; if (d.v === 'courses') ui.pTab = 'list'; if (d.v === 'singles') ui.sTab = 'list'; render(); },
  open(d) { ui.view = 'course'; ui.courseId = d.id; ui.tab = 'frame'; ui.open = new Set(['set', 'ovw']); const oc = state.courses.find(x => x.id === d.id); if (oc && oc.single) { ui.doc.ueb = false; ui.doc.sel = '0'; } else if (ui.doc.sel === '0' && oc) { ui.doc.sel = 'all'; ui.doc.ueb = true; } render(); },
  tab(d) { ui.tab = d.v; render(); },
  segPick(d, el) { const w = el.closest('.seg'), s = w && w.querySelector('select'); if (!s || el.disabled) return; s.value = d.v; s.dispatchEvent(new Event('change', { bubbles: true })); setTimeout(render, 0); },
  saveAllSingles(d, el) {
    const c = cur(), n = c.sessions.length; if (!n) return;
    if (!confirmTwice(el, 'allsing', `${n} Einzelstunden unter „Stunden“ anlegen (Name: Programm – Einzelmotto (Tag))`, '⚠ Ja, jetzt speichern')) return;
    const made = c.sessions.map(s => { const t = deepCopy(c); t.id = uid(); t.single = true; t.template = false; t.count = 1; t.created = todayIso(); t.name = `${c.name} – ${(s.motto && s.motto.title) || 'Stunde'}${s.date ? ' (' + fmtDateW(s.date) + ')' : ''}`;
      const ns = deepCopy(s); ns.id = uid(); ns.locked = false; if (ns.date) t.start = ns.date; t.sessions = [ns]; return t; });
    made.reverse().forEach(t => state.courses.unshift(t)); save(); render();
    toast(`${n} Einzelstunden gespeichert (Seite „Stunden“ → Vorhandene Einzelstunden).`, 6000);
  },
  setTotal(d, el) {
    const c = frameC(el); c.total = +d.v;
    // Jeder Knopf löst seinen Standard komplett aus (auch beim erneuten Klick): 60 ohne Mantra und Shakti Naam · 75 mit Mantra · 90 mit Mantra und Wahrnehmungsübung (Ja) · 120 alles ein
    const PRE = { 60: { mantra: 'aus', breath: 'gemischt', shakti: 0 }, 75: { mantra: 'immer', breath: 'gemischt', shakti: 0 }, 90: { mantra: 'immer', breath: 'atem_wahr', shakti: 0 }, 120: { mantra: 'immer', breath: 'atem_wahr', shakti: 1 } }[c.total];
    if (PRE) {
      c.mantra = PRE.mantra; c.breath = PRE.breath; c.breathPrev = PRE.breath; c.shakti = PRE.shakti; c.shaktiMode = PRE.shakti ? 'immer' : 'aus';
      if (!(+c.durs.atem > 1)) c.durs.atem = 5; if (c.shakti && !(+c.durs.shakti > 1)) c.durs.shakti = 8;
      ['einl', 'schluss', 'shava', 'ausgl'].forEach(k => { c[k + 'On'] = 1; });
      if (c.mobi === 'aus') c.mobi = 'sitz';
      if (!c.kraft) { c.kraft = true; c.kraftN = 1; c.durs.kraft = 3; }
    }
    fitDurs(c, 'total'); c.dirty = true; touchC(c); save(); render(); scheduleFrameApply(c); },
  newCourse() { startCourse(defaultCourseFixed({ name: 'Neues Programm ' + fmtDate(todayIso()) })); },
  fromTpl(d) {
    const bi = d.id.startsWith('builtin:') ? +d.id.slice(8) : -1, src = bi < 0 ? state.courses.find(c => c.id === d.id) : null;
    const tpl = src || defaultCourseFixed(BUILTIN[bi].over), nm = prompt(tpl.single ? 'Name der neuen Einzelstunde:' : 'Name des neuen Programms:', (src ? src.name.replace(/^Vorlage:\s*/, '') : BUILTIN[bi].name) + ' – neu'); if (!nm) return;
    const st = prompt('Startdatum der ersten Stunde (TT.MM.JJJJ):', fmtDate(tpl.start || todayIso())); if (st === null) return;
    const c = cloneCourse(tpl, { name: nm, template: false, start: parseDate(st) ? isoDate(parseDate(st)) : todayIso(), created: todayIso() });
    if (src) { calcDates(c); state.courses.unshift(c); ui.view = 'course'; ui.courseId = c.id; ui.tab = 'frame'; save(); render(); } else startCourse(c);
  },
  dup(d) { const c = state.courses.find(x => x.id === d.id); const n = cloneCourse(c, { name: c.name + ' (Kopie)' }); state.courses.unshift(n); save(); render(); },
  del(d, el) { const c = state.courses.find(x => x.id === d.id); if (c && confirmTwice(el, 'del' + d.id, `„${c.name}“ löschen?`)) { state.courses = state.courses.filter(x => x !== c); if (ui.courseId === c.id) { ui.view = c.single ? 'singles' : 'courses'; ui.courseId = null; } save(); render(); } },
  saveTpl() { const c = cur(); state.courses.unshift(cloneCourse(c, { name: 'Vorlage: ' + c.name, template: true })); save(); toast('Als Vorlage gespeichert (Startseite → Vorlagen).'); },
  async plan(d, el) {
    const c = cur(), textsEdited = c.sessions.some(s => !s.locked) && c.sessions.some(s => s.tx && Object.values(s.txEdited || {}).some(Boolean));
    const edited = c.sessions.filter(s => s.status === 'in_planung' && !s.locked).length;
    if (edited || textsEdited || c.status === 'fertig') {
      const msg = edited || textsEdited ? `${edited ? edited + ' Stunde(n) mit eigenen Änderungen' : 'Von Hand bearbeitete Texte'} werden neu befüllt/überschrieben (Stunden mit Status „Fertig“ und gesperrte Stunden bleiben)` : 'Der Rahmen hat den Status „Fertig“ – Stunden trotzdem neu anlegen';
      if (!confirmTwice(el, 'plan', msg, '⚠ Ja, jetzt anwenden')) return;
    }
    if (state.settings.apiKey && !c.single && mottoMode(c) === 'auto') { toast('KI entwirft die Einzelmottos …'); try { c.motto.aiList = await aiMottos(c); } catch (e) { console.error(e); c.motto.aiList = null; toast('⚠ KI nicht erreichbar, Einzelmottos aus den Vorschlägen: ' + e.message, 8000); } }
    if (state.settings.apiKey && (c.single || mottoMode(c) === 'eigen') && mottoLines(c).some(x => !x)) { toast('KI entwirft die leeren Mottos …'); for (let i = 0; i < mottoLines(c).length; i++) if (!mottoLines(c)[i]) setMottoLine(c, i, (await genOneMotto(c, mottoLines(c))).text); }
    planCourse(c); ui.sel = c.sessions[0] && c.sessions[0].id; ui.tab = 'sessions'; save(); render(); window.scrollTo(0, 0); toast('Rahmen auf die Stunden angewendet – weiter mit der Einzelstundenplanung.');
  },
  dates() { const c = cur(); calcDates(c); save(); render(); },
  addBlock(d) {
    const { c, s } = sessionOf(d.id), ty = d.t === 'ex' ? 'ex' : 'text', k = 'x' + uid().slice(0, 5);
    s.bm[k] = { ab: ty === 'ex' ? 'asana' : 'einl', name: ty === 'ex' ? 'Neuer Übungsblock' : 'Neuer Textblock', on: true, type: ty, min: ty === 'ex' ? 5 : undefined };
    s.dur[k] = 5; s.blk[k] = []; s.tx[k] = '';
    const ord = order(s).slice(), at = ord.indexOf('schluss');
    ord.splice(at >= 0 ? at : ord.length, 0, k); s.order = ord; s.bmCustom = true; syncHaupt(s);
    ui.bopen.add(s.id + ':' + k); ui.open.add('def:' + s.id); save(); render();
  },
  delBlock(d, el) {
    const { s } = sessionOf(d.id), k = d.b; if (!isCustomKey(k) || !confirmTwice(el, 'blk' + d.id + k, `Block „${bn(s, k)}“ löschen?`)) return;
    s.order = order(s).filter(x => x !== k); delete s.bm[k]; delete s.blk[k]; delete s.tx[k]; delete s.dur[k]; s.bmCustom = true; syncHaupt(s);
    save(); render();
  },
  mvBlock(d) {
    const { s } = sessionOf(d.id), ord = order(s).slice(), i = ord.indexOf(d.b), j = i + +d.d; if (i < 0 || j < 0 || j >= ord.length) return;
    [ord[i], ord[j]] = [ord[j], ord[i]]; s.order = ord; s.bmCustom = true; save(); render();
  },
  ovFilter(d) { ui.ovF = ui.ovF === d.v ? null : d.v; render(); },
  tglb(d) { const k = d.sid + ':' + d.b; ui.bopen.has(k) ? ui.bopen.delete(k) : ui.bopen.add(k); render(); },
  bAll(d) { const { s } = sessionOf(d.id); order(s).forEach(k => { const key = s.id + ':' + k; +d.v ? ui.bopen.add(key) : ui.bopen.delete(key); }); render(); },
  bmReset(d) {
    const { c, s } = sessionOf(d.id); applyCourseDur(c, s, idxOf(c, s)); save(); render(); toast('Standard aus dem Rahmen wiederhergestellt.');
  },
  bulkStatus() {
    const c = cur(), v = $('#bulkStat').value;
    if (v === 'vorgeplant') {
      if (!confirm('Alle Stunden werden in den Ursprungszustand zurückgesetzt (alle Änderungen gehen verloren; gesperrte Stunden bleiben). Zurücksetzen?')) return;
      c.sessions.forEach(s => { if (!s.locked) resetSession(c, s); });
    } else c.sessions.forEach(s => { s.status = v; });
    save(); render(); toast('Status aller Stunden: ' + STATUS[v]);
  },
  anFix(d) { anFix(d); },
  docSel(d) { const c = cur(), n = c.sessions.length; let s = docSelIdx(c, ui.doc); if (d.v === 'all') s = s.length === n ? [] : c.sessions.map((x, k) => k); else { const k = +d.v; if (s.length === n && n > 1) s = [k]; /* war „Alle“ gewählt: erst nur diese Stunde, weitere kommen per Klick dazu */ else { const p = s.indexOf(k); p < 0 ? s.push(k) : s.splice(p, 1); s.sort((x, y) => x - y); } } ui.doc.sel = s.length === n ? 'all' : s; render(); },
  docGrp(d) { DOC_GRP[d.g].keys.forEach(k => { ui.doc[k] = d.v === '1'; }); render(); },
  anGo(d) { ui.sel = d.id; ui.tab = 'sessionAn'; render(); window.scrollTo(0, 0); },
  cTog(d, el) { const c = frameC(el), f = d.f2; c[f] = c[f] || []; const i = c[f].indexOf(d.v); i < 0 ? c[f].push(d.v) : c[f].splice(i, 1); c.dirty = true; save(); render(); },
  toggleGeb(d) { const c = cur(), i = c.gebrechen.indexOf(d.k); i < 0 ? c.gebrechen.push(d.k) : c.gebrechen.splice(i, 1); c.dirty = true; save(); render(); },
  toggleNewX(d) { const x = ui.newEx.x, i = x.indexOf(d.k); i < 0 ? x.push(d.k) : x.splice(i, 1); },
  reroll(d) { const { c, s } = sessionOf(d.id); s.seed = Math.floor(Math.random() * 1e9); fillSession(c, s, idxOf(c, s)); save(); render(); },
  texts(d) { const { c, s } = sessionOf(d.id); s.txv = (s.txv || 0) + 1; genTexts(c, s, idxOf(c, s), TXKEYS); save(); refreshFields(); },
  txdReset(d) { const { c, s } = sessionOf(d.id); if (s.txd) delete s.txd[d.k]; genTexts(c, s, idxOf(c, s), [d.k]); save(); render(); },
  regenTx(d) { const { c, s } = sessionOf(d.id); s.txv = (s.txv || 0) + 1; genTexts(c, s, idxOf(c, s), [d.k]); save(); refreshFields(); toast('Text neu erzeugt.'); },
  async aiTest() {
    const o = $('#aiTestRes'); if (o) o.textContent = 'Teste …';
    try { const r = await aiCall('Antworte nur mit dem Wort: OK', 300); if (o) o.textContent = '✓ Verbindung funktioniert (Antwort: ' + r.trim().slice(0, 20) + ')'; }
    catch (e) { if (o) o.textContent = '⚠ ' + e.message; }
  },
  async aiTx(d) {
    const { c, s } = sessionOf(d.id); toast('KI schreibt die Texte …');
    try { await aiTexts(c, s, idxOf(c, s)); save(); refreshFields(); toast('Texte von der KI übernommen.'); } catch (e) { console.error(e); toast('⚠ ' + e.message, 12000); }
  },
  async genMotto(d) {
    const c = cur(), i = +d.i, used = mottoLines(c).filter((_, k) => k !== i).concat(c.sessions.map(x => x.motto && x.motto.title));
    toast(state.settings.apiKey ? 'KI entwirft ein Motto …' : 'Motto wird erzeugt …');
    const r = await genOneMotto(c, used); setMottoLine(c, i, r.text); c.dirty = true; save(); render();
    if (r.err) toast('⚠ KI nicht erreichbar, Motto aus den eingebauten Mottos: ' + r.err, 8000);
  },
  async genName() {
    const c = cur(); let mn = autoName(c);
    if (c.single && !mn) { const ml = mottoLines(c); if (!ml[0]) { setMottoLine(c, 0, (await genOneMotto(c, [])).text); } mn = mottoLines(c)[0].split('|')[0].trim(); }
    if (!mn && !c.single && !state.settings.apiKey) { toast('Bitte zuerst ein Übermotto eingeben (oder erzeugen lassen).'); return; }
    toast(state.settings.apiKey ? 'KI entwirft einen Namen …' : 'Name wird erzeugt …');
    const r = await genName(c); c.name = r.text || mn; save(); render();
    if (r.err) toast('⚠ KI nicht erreichbar, Name aus dem Motto: ' + r.err, 8000);
  },
  async genUeber() {
    const c = cur(); toast(state.settings.apiKey ? 'KI entwirft ein Übermotto …' : 'Übermotto wird erzeugt …');
    const r = await genUeber(c); c.motto.free = r.text; c.dirty = true; save(); render();
    if (r.err) toast('⚠ KI nicht erreichbar, Übermotto aus den Vorschlägen: ' + r.err, 8000);
  },
  async aiMottos() {
    const c = cur(); toast('KI entwirft Mottos …');
    try {
      const m = await aiMottos(c); c.sessions.forEach((s, i) => { if (!s.locked && m[i]) { s.motto = m[i]; s.txEdited = {}; genTexts(c, s, i); } });
      save(); render(); toast('Mottos übernommen.');
    } catch (e) { console.error(e); toast('⚠ ' + e.message, 12000); }
  },
  lock(d) { const { s } = sessionOf(d.id); s.locked = !s.locked; save(); render(); },
  mv(d) { const { s } = sessionOf(d.id), a = s.blk[d.b], i = +d.i, j = i + +d.d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; save(); render(); },
  rm(d) { const { s } = sessionOf(d.id); s.blk[d.b].splice(+d.i, 1); save(); render(); },
  handsTog(d) { const { s } = sessionOf(d.id), it = s.blk[d.b][+d.i]; if (!it) return; if (it.hands) delete it.hands; else it.hands = true; save(); render(); },
  optTog(d) { const { s } = sessionOf(d.id), it = s.blk[d.b][+d.i]; if (!it) return; if (it.opt) delete it.opt; else it.opt = true; save(); render(); },
  alt(d) {
    const { c, s } = sessionOf(d.id), a = s.blk[d.b], cu = a[+d.i], e = exById(cu.id), t = d.w === 'e' ? altE(e) : altH(e);
    if (!t) return; if (contra(t, effGeb(c, s))) { toast('Die Alternative ist bei den gewählten Gebrechen nicht geeignet.'); return; }
    a[+d.i] = { id: t.id, min: cu.min, rep: repFor(t, cu.min), repAuto: true, both: false, altE: false, altH: false }; save(); render();
  },
  repAuto(d) { const { s } = sessionOf(d.id), it = s.blk[d.b][+d.i]; it.repAuto = true; syncRep(it); save(); render(); },
  bothAll(d) {
    const { s } = sessionOf(d.id), items = blkAll(s).filter(i => { const e = exById(i.id); return altE(e) || altH(e); });
    const full = i => { const e = exById(i.id); return (!altE(e) || effE(i)) && (!altH(e) || effH(i)); };
    const on = items.some(i => !full(i));
    items.forEach(i => { const e = exById(i.id); i.both = false; i.altE = on && !!altE(e); i.altH = on && !!altH(e); }); save(); render();
  },  pk(d, el) { openPicker(el, d); },
  pkpick(d) {
    const p = ui.pk; if (!p) return; const { c, s } = sessionOf(p.sid), e = exById(d.id); closePicker();
    if (p.i === '' || p.i == null) { const ni = mkItem(e); applyAlt(s, ni); s.blk[p.b].push(ni); if (repN(ni)) s.blk[p.b].push(mkItem(SB_DEFS[REPEND_ID])); }
    else {
      const it = s.blk[p.b][+p.i], wasSb = isSb(it), wasOpen = repN(it) > 0;
      it.id = e.id; it.repAuto = true;
      if (isRepSb(e)) { it.min = 0; delete it.tx; delete it.ref; it.rep = ''; it.repAuto = false; it.altE = it.altH = it.both = false; it.opt = false; if (repN(e) && !wasOpen) s.blk[p.b].splice(+p.i + 1, 0, mkItem(SB_DEFS[REPEND_ID])); }
      else if (e.txt) { if (hasTx(e)) { it.tx = it.tx || ''; delete it.ref; } else { it.ref = ''; delete it.tx; } it.rep = ''; it.repAuto = false; it.altE = it.altH = it.both = false; }
      else { if (wasSb) { delete it.tx; delete it.ref; it.min = e.m; } syncRep(it); applyAlt(s, it); }
    }
    save(); render();
  },
  toggleDay(d) { const c = cur(); c.days = c.days || []; const k = +d.k, i = c.days.indexOf(k); i < 0 ? c.days.push(k) : c.days.splice(i, 1); c.dirty = true; save(); render(); },
  cntBlk(d) {
    const { c, s } = sessionOf(d.id), k = d.b, a = s.blk[k];
    if (+d.d < 0) { const i = a.map(x => !x.seq && !isSb(x)).lastIndexOf(true); if (i < 0) return; a.splice(i, 1); }
    else {
      const ctx = mkCtx(c, s, Math.random); ctx.have = new Set(blkIds(s));
      const pool = withPref(poolOf(...catsOf(s, k)), abOf(s, k), ctx).concat(FALLBACK[abOf(s, k)] ? poolOf(...FALLBACK[abOf(s, k)]) : []);
      const best = eligible(pool, ctx).map(e => ({ e, sc: scoreEx(e, ctx) })).sort((x, y) => y.sc - x.sc)[0];
      if (!best) { toast('Keine weitere passende Übung gefunden.'); return; }
      const ni = mkItem(best.e); applyAlt(s, ni); a.push(ni); sortItems(a);
    }
    save(); render();
  },
  togAlt(d) {
    const { s } = sessionOf(d.id), it = s.blk[d.b][+d.i]; normAlt(it);
    if (d.w === 'e') it.altE = !it.altE; else it.altH = !it.altH;
    save(); render();
  },
  rerollBlk(d) { const { c, s } = sessionOf(d.id); rerollBlock(c, s, d.b); save(); render(); },
  fitBlk(d) { const { c, s } = sessionOf(d.id), B = blockBudgets(c, +s.dur.haupt || 45); fitItems(s.blk[d.b], B[d.b] || (s.bm[d.b] && s.bm[d.b].min)); save(); render(); },
  fitS(d) { const { c, s } = sessionOf(d.id); fitSession(c, s); save(); render(); },
  fitAll() { const c = cur(); c.sessions.forEach(s => { if (!s.locked) fitSession(c, s); }); save(); render(); toast('Zeiten angeglichen.'); },
  gotoSA(d) { ui.sel = d.id; ui.tab = 'sessionAn'; render(); window.scrollTo(0, 0); },
  gotoS(d) { ui.sel = d.id; ui.tab = 'sessions'; render(); window.scrollTo(0, 0); },
  selS(d) { ui.sel = d.id; render(); },
  prevS() { const c = cur(), i = c.sessions.findIndex(s => s.id === ui.sel); if (i > 0) { ui.sel = c.sessions[i - 1].id; render(); } },
  nextS() { const c = cur(), i = c.sessions.findIndex(s => s.id === ui.sel); if (i < c.sessions.length - 1) { ui.sel = c.sessions[i + 1].id; render(); } },
  startSessions() { const c = cur(); ui.sel = c.sessions[0] && c.sessions[0].id; ui.tab = 'sessions'; render(); window.scrollTo(0, 0); },
  exinfo(d) { ui.exOpen.has(d.id) ? ui.exOpen.delete(d.id) : ui.exOpen.add(d.id); render(); },
  rate(d) { state.ratings[d.id] = +d.v; save(); render(); },
  addEx() {
    const n = ui.newEx; if (!n.n.trim()) { toast('Bitte einen Namen eingeben.'); return; }
    state.customEx.push({ id: 'c_' + uid(), n: n.n.trim(), c: n.c, lv: +n.lv, m: +n.m || 2, pose: n.pose, t: norm(n.tags).split(' ').filter(Boolean), x: n.x.slice(), e: n.e, h: '', s: +n.lv <= 1 ? 1 : 0, o: 1000 + state.customEx.length, custom: true });
    ui.newEx = { n: '', c: n.c, lv: 1, m: 2, pose: 'stand', tags: '', x: [], e: '' }; save(); render(); toast('Übung hinzugefügt.');
  },
  delEx(d, el) { if (confirmTwice(el, 'ex' + d.id, 'Eigene Übung löschen?')) { state.customEx = state.customEx.filter(e => e.id !== d.id); save(); render(); } },
  preview(d) { ui.tab = 'doc'; ui.doc.sel = String(idxOf(cur(), sessionOf(d.id).s)); ui.doc.ueb = false; ui.doc.std = true; ui.doc.blatt = true; ui.doc.blatt2 = false; ui.doc.alt = false; ui.doc.uebw = false; ui.doc.detail = false; ui.doc.spick = false; ui.doc.hands = false; ui.doc.detS = false; ui.doc.mat = false; ui.doc.geb = false; ui.doc.katall = false; ui.doc.anaS = false; ui.doc.anaP = false; render(); window.scrollTo(0, 0); },
  print() {
    const c = cur(), t = document.title; document.title = fileName(c.name);
    toast('Im Druckdialog als Ziel „Als PDF speichern“ wählen (Papierformat A4).');
    setTimeout(() => { window.print(); document.title = t; }, 400);
  },
  pdf() { ui.tab = 'doc'; ui.doc = { ueb: true, std: true, blatt: true, blatt2: false, alt: false, uebw: false, detail: false, spick: false, hands: false, detS: false, mat: false, geb: false, katall: false, anaS: false, anaP: false, sel: 'all' }; render(); window.scrollTo(0, 0); A.print(); },
  mail() {
    const c = cur(), sub = c.emailSubject || c.name + ' – Programm'; let body = overviewText(c);
    const to = mailAddrs(c).map(encodeURIComponent).join(','), mk = b => `mailto:${to}?subject=${encodeURIComponent(sub)}&body=${encodeURIComponent(b)}`;
    // Outlook & Co. verarbeiten nur kurze mailto-Adressen (ca. 2000 Zeichen) – längere Texte werden still verworfen
    const cut = '\n… (gekürzt – ausführlicher Plan als Anhang)'; let n = Math.min(body.length, 1500), url;
    do { url = mk(n < body.length ? body.slice(0, n) + cut : body); n -= 100; } while (url.length > 1900 && n > 100);
    let left = false; const onB = () => { left = true; }; window.addEventListener('blur', onB, { once: true });
    const a = document.createElement('a'); a.href = url; a.style.display = 'none'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => { window.removeEventListener('blur', onB); if (!left) toast('Es hat sich kein Mailprogramm geöffnet. Nutze „E-Mail-Entwurf mit Anhang (.eml)“ oder „Übersicht kopieren“ – oder richte unter Windows ein Standard-Mailprogramm für „mailto“ ein.'); }, 2500);
  },
  gmail() {
    const c = cur(), sub = c.emailSubject || c.name + ' – Programm'; let body = overviewText(c);
    if (body.length > 1500) body = body.slice(0, 1500) + '\n… (gekürzt – ausführlicher Plan als Anhang)';
    const u = 'https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(mailAddrs(c).join(',')) + '&su=' + encodeURIComponent(sub) + '&body=' + encodeURIComponent(body);
    if (!window.open(u, '_blank')) { toast('Das Fenster wurde blockiert – bitte Pop-ups für diese Seite erlauben.'); return; }
    // Gmail kann über einen Link keine Dateien anhängen: das PDF wird daher gleich gespeichert, zum Anhängen per Büroklammer / Drag & Drop
    A.pdfSave().then(() => toast('PDF gespeichert (Downloads) – in Gmail per Büroklammer oder Drag & Drop anhängen.'));
  },
  async pdfSave() {
    const c = cur(); toast('PDF wird erstellt …');
    try { const b = await docToPdf($('#docPreview')); download(fileName(c.name) + '.pdf', b, 'application/pdf'); toast('PDF gespeichert.'); }
    catch (e) { console.error(e); toast('PDF-Export fehlgeschlagen (' + e.message + ') – bitte „Drucken / PDF über Druckdialog“ nutzen.'); }
  },
  async docx() { const c = cur(); toast('Word-Datei wird erstellt …'); try { const r = await dxBuild(buildDoc(c, ui.doc), c); download(fileName(c.name) + '.docx', r.bytes, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'); toast('Word-Datei gespeichert.'); } catch (e) { console.error(e); toast('Word-Export fehlgeschlagen: ' + e.message); } },
  eml() { const c = cur(); download(fileName(c.name) + '.eml', buildEml(c, ui.doc, mailAddrs(c).join(', '), c.emailSubject || c.name + ' – Programm'), 'message/rfc822'); toast('Entwurf gespeichert – per Doppelklick in deinem Mailprogramm öffnen.'); },
  html() { const c = cur(); download(fileName(c.name) + '.html', standaloneHtml(c, ui.doc), 'text/html'); },
  async copy() { try { await navigator.clipboard.writeText(overviewText(cur())); toast('Übersicht kopiert.'); } catch (e) { toast('Kopieren nicht möglich.'); } },
  exportAll() { download('yoga-kursplaner-backup-' + todayIso() + '.json', JSON.stringify(state, null, 1), 'application/json'); },
  exportCourse() { const c = cur(); download(fileName(c.name) + '.json', JSON.stringify({ course: c, ratings: state.ratings }, null, 1), 'application/json'); },
  importPick() { $('#imp').click(); },
  resetAll(d, el) { if (confirmTwice(el, 'all', 'ALLE Programme, Vorlagen und Bewertungen löschen?')) { state = defaults(); save(); ui.view = 'courses'; render(); } }
};
const CH = {
  mline(el) { const c = cur(); setMottoLine(c, +el.dataset.i, el.value); c.dirty = true; save(); const b = $('#dirtyBanner'); if (b) b.classList.remove('hide'); },
  ueber(el) { const c = cur(); c.motto.free = el.value.trim(); c.motto.mode = ''; c.dirty = true; save(); },
  cname(el) { const c = cur(); c.name = el.value.trim(); if (!c.name) { const mn = autoName(c) || (c.single ? (mottoLines(c)[0] || '').split('|')[0].trim() : ''); if (mn) { c.name = mn; el.value = mn; } } save(); },
  sbRef(el) {
    const { s } = sessionOf(el.dataset.sid), it = s.blk[el.dataset.b][+el.dataset.i], e = it && exById(it.id); if (!e || !e.txt) return;
    it.ref = el.value; touch(s);
    const x = e.sb === 'lied' ? songById(it.ref) : null; it.min = x && +x.dur > 0 ? +x.dur : e.m;
    save(); render();
  },
  pkNewCat(el) { const f = document.getElementById('pkNewFig'); if (f) f.className = 'pkfig cat-' + el.value; },
  atemOn(el) { const c = frameC(el); if (+el.value) c.breath = c.breathPrev && c.breathPrev !== 'aus' ? c.breathPrev : 'gemischt'; else { if (c.breath !== 'aus') c.breathPrev = c.breath; c.breath = 'aus'; } breathChanged(c); },
  wahrMode(el) { const c = frameC(el); if (c.breath === 'aus') return; c.breath = { aus: 'atem', immer: 'atem_wahr', wechsel: 'gemischt', zufall: 'zufall' }[el.value] || 'gemischt'; c.breathPrev = c.breath; breathChanged(c); },
  txdur(el) { const { c, s } = sessionOf(el.dataset.sid), k = el.dataset.k, v = parseFloat(el.value); s.txd = s.txd || {}; if (!(v > 0) || v === +s.dur[k]) delete s.txd[k]; else s.txd[k] = Math.min(60, v); touch(s); genTexts(c, s, idxOf(c, s), [k]); save(); render(); toast('Text auf ' + fmtMin(txDur(s, k)) + ' Min. (ca. ' + Math.round(txDur(s, k) * WPM[k]) + ' Wörter) angepasst.'); },
  aiProv(el) { const st = state.settings, p = AI_PROV[el.value] ? el.value : 'anthropic'; st.provider = p; st.model = AI_PROV[p].model; st.baseUrl = AI_PROV[p].url; save(); render(); },
  mtitle(el) {
    const { c, s } = sessionOf(el.dataset.sid), i = idxOf(c, s), m = mottoFromText(el.value); touch(s);
    if (s.txEdited.kern) m.kern = s.motto.kern; if (s.txEdited.focus) m.focus = s.motto.focus;
    s.motto = m; s.txEdited.einl = s.txEdited.einl; genTexts(c, s, i); save(); refreshFields();
    const sel_ = document.querySelector(`[data-chg="theme"][data-sid="${s.id}"]`); if (sel_) sel_.value = m.themeId;
  },
  theme(el) {
    const { c, s } = sessionOf(el.dataset.sid), t = themeById(el.value); touch(s);
    s.motto = t ? mottoFromTheme(t) : Object.assign(mottoFromText(s.motto.title), { themeId: '' });
    s.txEdited.kern = s.txEdited.focus = false; genTexts(c, s, idxOf(c, s)); save(); render();
  },
  altdef(el) { const { s } = sessionOf(el.dataset.sid); touch(s); s.altDef = el.checked; s.altDefSet = true; applyAlt(s); save(); render(); },
  tglw(d) { const { c, s } = sessionOf(d.sid); s.atem.w = ''; regenIfNotEdited(c, s, 'atem'); save(); render(); },
  pkbr(d, el) { openBreathPicker(el, d); },
  pkbrpick(d) {
    const p = ui.pk; if (!p || p.kind !== 'br') return; const { c, s } = sessionOf(p.sid); closePicker();
    if (p.k === 'atem') s.atem.a = d.id; else s.atem.w = d.id;
    regenIfNotEdited(c, s, 'atem'); save(); render();
  },
  fltr(el) { setField(el); ui.open.add('flt:' + el.dataset.sid); save(); render(); },
  stat(el) {
    const m = (el.dataset.f || '').match(/^s:([^:]+):status$/), c = cur(), s = m && c && c.sessions.find(x => x.id === m[1]);
    if (s && el.value === 'vorgeplant' && s.status !== 'vorgeplant') {
      if (!confirm('Die Stunde wird in den Ursprungszustand zurückgesetzt: Alle Änderungen (Übungen, Blöcke, Zeiten, Texte, Filter) gehen verloren und die Stunde wird neu aus dem Rahmen befüllt.\n\nZurücksetzen?')) { el.value = s.status; setStatusDom(el.dataset.f, s.status); return; }
      resetSession(c, s); save(); render(); toast('Stunde auf Vorgeplant zurückgesetzt.'); return;
    }
    setField(el); save(); render();
  },
  bmmin(el) {
    const { c, s } = sessionOf(el.dataset.sid), k = el.dataset.b; setField(el);
    if (bty(s, k) === 'ex') { s.bmCustom = true; syncHaupt(s); rebalanceBlock(c, s, k); }
    save(); render();
  },
  bmtype(el) {
    const { c, s } = sessionOf(el.dataset.sid), k = el.dataset.b, old = bty(s, k); setField(el); const ty = bty(s, k); s.bmCustom = true;
    if (ty === 'ex') { if (!(s.bm[k].min > 0)) s.bm[k].min = s.dur[k] || 5; s.blk[k] = s.blk[k] || []; }
    else if (old === 'ex') { s.dur[k] = s.bm[k].min || s.dur[k] || 5; s.tx[k] = s.tx[k] || ''; }
    syncHaupt(s); save(); render();
  },
  bmab(el) {
    const { c, s } = sessionOf(el.dataset.sid), k = el.dataset.b, m = s.bm[k], old = abOf(s, k), ab = el.value;
    if (ab === old) return;
    const wasDefault = !m.name || m.name === bdefName(old);
    m.ab = ab; s.bmCustom = true;
    if (wasDefault) m.name = bdefName(ab);
    const ty = bdefType(ab), oldTy = bty(s, k);
    if (ty !== oldTy) {
      m.type = ty;
      if (ty === 'ex') { if (!(m.min > 0)) m.min = s.dur[k] || 5; s.blk[k] = s.blk[k] || []; }
      else if (oldTy === 'ex') { s.dur[k] = m.min || s.dur[k] || 5; s.tx[k] = s.tx[k] || ''; }
    }
    if (bty(s, k) === 'ex') rerollBlock(c, s, k);
    else if (['einl', 'schluss', 'shava'].includes(ab) && !(s.txEdited || {})[k]) genTexts(c, s, idxOf(c, s), [k]);
    syncHaupt(s); save(); render();
  },
  bmon(el) {
    const { c, s } = sessionOf(el.dataset.sid), k = el.dataset.b; setField(el); s.bmCustom = true;
    if (bty(s, k) === 'ex') {
      if (bon(s, k)) { if (!(s.bm[k].min > 0)) s.bm[k].min = (EXKEYS.includes(k) ? blockBudgets(c, +s.dur.haupt || 45)[k] : 5) || 5; if (!(s.blk[k] || []).length && EXKEYS.includes(k)) rerollBlock(c, s, k); }
      else if (EXKEYS.includes(k)) s.blk[k] = [];
      syncHaupt(s);
    }
    if (k === 'mantra' && bon(s, k) && !(s.mantra && s.mantra.id)) s.mantra = { id: pickMantra(c, s) };
    if (bon(s, k) && bty(s, k) === 'text' && !(+s.dur[k] > 0)) s.dur[k] = { einl: 5, schluss: 3, shava: 10, nidra: 20 }[abOf(s, k)] || 5;
    if (k === 'atem' && bon(s, k)) { if (!(+s.dur.atem > 0)) s.dur.atem = 5; if (!s.atem.a) { const ctx = mkCtx(c, s, Math.random); ctx.have = new Set(blkIds(s)); s.atem.a = pickBreath(ctx, 'atem') || 'bauchatmung'; } }
    genTexts(c, s, idxOf(c, s)); save(); render();
  },
  bmname(el) {
    const { s } = sessionOf(el.dataset.sid), k = el.dataset.b; setField(el); s.bmCustom = true;
    if (!el.value.trim()) { s.bm[k].name = bdefName(k); el.value = s.bm[k].name; }
    document.querySelectorAll(`[data-bname="${s.id}:${k}"]`).forEach(n => { n.textContent = s.bm[k].name; }); save();
  },
  breath(el) { const { c, s } = sessionOf(el.dataset.sid); setField(el); regenIfNotEdited(c, s, 'atem'); save(); refreshFields(); },
  ex(el) {
    setField(el);
    const r = resolve(el.dataset.f), parent = getP(r.o, r.p.replace(/\.id$/, '')), e = exById(el.value);
    if (parent && e) parent.rep = defRep(e);
    save(); render();
  }
};
// Zeitänderung im Rahmen automatisch auf die Stunden übertragen (Fertig/gesperrt und individuell geplante Stunden bleiben)
function breathChanged(c) {
  if (c.breath !== 'aus' && !(+c.durs.atem > 1)) c.durs.atem = 5;
  fitDurs(c, 'mode'); c.dirty = true; touchC(c); save(); render(); scheduleFrameApply(c);
}
function applyFrameDur(c) {
  let n = 0, skip = 0;
  c.sessions.forEach((s, i) => {
    if (s.locked || s.status === 'fertig' || s.bmCustom) { skip++; return; }
    applyCourseDur(c, s, i); n++;
  });
  save(); refreshFields();
  toast(`Dauer auf ${n} Stunde${n === 1 ? '' : 'n'} übertragen${skip ? ` (${skip} unverändert: Fertig, gesperrt oder individuell geplant)` : ''}.`, 5000);
}
let frameApplyT = null;
function scheduleFrameApply(c) { clearTimeout(frameApplyT); frameApplyT = setTimeout(() => { const cc = cur(); if (cc === c) applyFrameDur(c); }, 800); }
function setField(el) {
  const r = resolve(el.dataset.f); if (!r.o) return;
  let v = el.type === 'checkbox' ? el.checked : el.value;
  if (el.dataset.num || el.type === 'number') v = v === '' ? 0 : +v;
  setP(r.o, r.p, v);
  const c = r.o && r.o === aiDraftC() ? r.o : cur();
  if (r.o && r.o.blk && !['status', 'date'].includes(r.p) && !/^flt\./.test(r.p)) touch(r.o);
  if (c && r.o === c && !['status', 'name', 'email', 'emailSubject'].includes(r.p)) touchC(c);
  if (c && r.o === c) {
    if (el.dataset.dirty) c.dirty = true;
    if (r.p === 'kraftN') {
      if (v === 'zufall') { c.kraftRnd = 1; c.kraft = true; c.kraftN = 2; c.durs.kraft = 6; c.kraftSeed = Math.floor(Math.random() * 1e9); }
      else { c.kraftRnd = 0; c.kraftN = +v || 0; c.kraft = c.kraftN > 0; if (c.kraft) c.durs.kraft = c.kraftN * 3; }
    }
    const durChg = r.p === 'total' || /^durs\./.test(r.p) || r.p === 'kraftN' || r.p === 'mantra' || r.p === 'breath' || r.p === 'mobi' || r.p === 'shaktiMode' || /^(einl|schluss|shava|ausgl)On$/.test(r.p);
    if (r.p === 'total') fitDurs(c, 'total');
    else if (/^durs\./.test(r.p)) fitDurs(c, r.p.slice(5));
    else if (r.p === 'kraftN' || r.p === 'mantra' || r.p === 'breath' || r.p === 'mobi' || r.p === 'shaktiMode' || /^(einl|schluss|shava|ausgl)On$/.test(r.p)) {
      if (r.p === 'mobi' && v === 'zufall') c.mobiSeed = Math.floor(Math.random() * 1e9);
      if (r.p === 'shaktiMode') { c.shakti = v !== 'aus' ? 1 : 0; c.shaktiSeed = Math.floor(Math.random() * 1e9); if (c.shakti && !(+c.durs.shakti > 1)) c.durs.shakti = 8; } if (r.p === 'breath' && v !== 'aus' && !(+c.durs.atem > 1)) c.durs.atem = 5; fitDurs(c, 'mode'); }
    if (r.p === 'total' || /^durs\./.test(r.p)) refreshFields();
    if (r.p === 'kraftN' || r.p === 'mantra' || r.p === 'breath' || r.p === 'mobi' || r.p === 'shaktiMode' || /^(einl|schluss|shava|ausgl)On$/.test(r.p)) { save(); render(); }
    if (durChg) scheduleFrameApply(c);
  }
  // Datum bleibt überall gleich: Einzelstunde = Startdatum der Vorgaben; bei Programmen gilt das für die 1. Stunde
  if (c && r.p === 'date' && r.o && r.o.dur && v) { if (c.single || c.sessions[0] === r.o) c.start = v; refreshFields(); }
  if (c && r.o === c && r.p === 'start' && c.single && c.sessions[0] && v) { c.sessions[0].date = v; refreshFields(); }
  if (r.o === state.settings && r.p === 'hlKeys') { save(); render(); return; }
  if (r.o && r.o.tx && /^tx\./.test(r.p)) { r.o.txEdited[r.p.slice(3)] = true; refreshFields(); }
  if (r.o && r.o.motto && /^motto\.(kern|focus)$/.test(r.p)) { r.o.txEdited[r.p.slice(6)] = true; r.o.tx[r.p.slice(6)] = v; }
  save();
  if (r.o && r.o.dur && /^dur\./.test(r.p)) {
    const c2 = cur(); if (c2) { r.o.bmCustom = true; genTexts(c2, r.o, idxOf(c2, r.o)); updateSums(c2, r.o); }
    refreshFields();
  }
  if (r.o && r.o.bm && /^bm\.\w+\.min$/.test(r.p)) { const c2 = cur(); r.o.bmCustom = true; syncHaupt(r.o); if (c2) updateSums(c2, r.o); refreshFields(); }
  if (/^blk\.\w+\.\d+\.min$/.test(r.p)) {
    const it = getP(r.o, r.p.replace(/\.min$/, '')); if (it) syncRep(it);
    // Minuten einer Übung geändert → Blockzeit und damit die Gesamtzeit der Stunde folgen der Summe
    const bk = r.p.split('.')[1], c2 = cur();
    if (r.o.bm && r.o.bm[bk] && bty(r.o, bk) === 'ex') { r.o.bm[bk].min = sumMin(r.o.blk[bk] || []); r.o.bmCustom = true; syncHaupt(r.o); if (c2) updateSums(c2, r.o); }
    refreshFields();
  }
  if (el.dataset.sum) { const c2 = cur(), s2 = c2 && c2.sessions.find(x => x.id === el.dataset.sid); if (s2) updateSums(c2, s2); }
  if (el.dataset.dirty) { const b = $('#dirtyBanner'); if (b) b.classList.remove('hide'); }
}
// ---- Status „Vorgeplant“: Stunde in den Ursprungszustand (aus dem Rahmen) zurücksetzen ----
function resetSession(c, s) {
  const idx = idxOf(c, s), mottos = assignMottos(c, c.sessions.length);
  Object.keys(s.blk || {}).forEach(k => { if (isCustomKey(k)) { delete s.blk[k]; delete s.tx[k]; } });
  s.bmCustom = false; s.bm = {}; s.order = null; s.flt = fltDefault(); s.altDefSet = false; s.seed = Math.floor(Math.random() * 1e9);
  fillSession(c, s, idx, { motto: mottos[idx] || s.motto });
}
// ---- Status „Fertig“: Einzelplanung ist gesperrt, Änderungsversuch fragt nach ----
const LOCKED_OK = new Set(['noop', 'ovFilter', 'tplOpen', 'vidRes', 'vidExport', 'plPlay', 'plClose', 'plToggle', 'plPrev', 'plNext', 'plRestart', 'selS', 'gotoS', 'gotoSA','prevS', 'nextS', 'tab', 'nav', 'tglb', 'bAll', 'exinfo', 'lock', 'frameView', 'fltTog', 'fltGeb', 'fltReset', 'preview', 'print', 'mail', 'eml', 'html', 'copy', 'pdf', 'rate', 'aiAna', 'aiAnaDel']);
function sidOfEl(el) {
  const m = (el.dataset.f || '').match(/^s:([^:]+):/);
  return m ? m[1] : (el.dataset.sid || el.dataset.dsid || el.dataset.id || (ui.pk && el.closest && el.closest('#pkpanel') ? ui.pk.sid : null));
}
function lockedSession(el) {
  const c = cur(); if (!c || !el || !el.dataset) return null;
  const sid = sidOfEl(el), s = sid && c.sessions.find(x => x.id === sid);
  return s && s.status === 'fertig' ? s : null;
}
function askUnlock(s) {
  if (confirm(`Diese Stunde hat den Status „Fertig“ und ist für Änderungen gesperrt.\n\nStatus auf „In Planung“ setzen, um sie zu bearbeiten?`)) { s.status = 'in_planung'; save(); render(); }
}
function guardEvent(e, el, s) { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); if (el.blur) el.blur(); askUnlock(s); }
const isEditCtl = el => el.matches && el.matches('select, input, textarea') && (el.dataset.f || el.dataset.chg || el.dataset.add) && !/:status$|:flt\./.test(el.dataset.f || '');
document.addEventListener('mousedown', e => { const el = e.target.closest('select, input, textarea'); if (el && isEditCtl(el)) { const s = lockedSession(el); if (s) guardEvent(e, el, s); } }, true);
document.addEventListener('keydown', e => {
  const el = e.target; if (!el || !isEditCtl(el) || e.key === 'Tab' || e.key === 'Escape' || e.key.startsWith('F')) return;
  const textual = el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && el.type === 'text');
  if (textual && (e.key.startsWith('Arrow') || e.key === 'Home' || e.key === 'End' || ((e.ctrlKey || e.metaKey) && /^[acx]$/i.test(e.key)))) return;
  const s = lockedSession(el); if (s) guardEvent(e, el, s);
}, true);
// Sicherheitsnetz: jede Wertänderung (Mausrad, Einfügen, Spinner, Auswahl per Tastatur …) in einer „Fertig“-Stunde wird verworfen
['input', 'change', 'paste', 'cut', 'drop', 'wheel'].forEach(t => document.addEventListener(t, e => {
  const el = e.target; if (!el || !isEditCtl(el) || (t === 'wheel' && document.activeElement !== el)) return;
  const s = lockedSession(el); if (!s) return;
  e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
  if (t === 'input' || t === 'change') { render(); }
  if (t !== 'wheel' && t !== 'input') askUnlock(s); else if (t === 'input') askUnlock(s);
}, true));
document.addEventListener('dragstart', e => { const el = e.target.closest && e.target.closest('[data-dsid],[data-sid]'); if (el) { const s = lockedSession(el); if (s) guardEvent(e, el, s); } }, true);
document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]'); if (!el || LOCKED_OK.has(el.dataset.a)) return;
  const s = lockedSession(el); if (s) guardEvent(e, el, s);
}, true);
document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]'); if (!el || el.tagName === 'OPTION') return;
  const fn = A[el.dataset.a];
  if (fn) {
    if (MUT.has(el.dataset.a)) { const c = cur(), sid = (ui.pk && /^pk(br|man)?pick$/.test(el.dataset.a)) ? ui.pk.sid : (el.dataset.id || el.dataset.sid || (ui.pk && ui.pk.sid)); touch(c && c.sessions.find(x => x.id === sid)); }
    if (MUTC.has(el.dataset.a)) touchC(cur());
    fn(el.dataset, el, e);
  }
});
document.addEventListener('change', e => {
  const el = e.target;
  if (el.id === 'imp') { importFile(el.files[0]); el.value = ''; return; }
  if (el.dataset.chg) { CH[el.dataset.chg](el); return; }
  if (el.dataset.add) {
    if (!el.value) return; const { s } = sessionOf(el.dataset.sid), e = exById(el.value); s.blk[el.dataset.b].push(mkItem(e)); save(); render(); return;
  }
  if (el.dataset.f) {
    setField(el);
    if (el.dataset.f.startsWith('u:build.')) { render(); return; }
    if (el.tagName === 'SELECT' || el.type === 'checkbox' || el.type === 'radio') {
      if (el.dataset.f === 'u:newEx.pose' || el.dataset.f.startsWith('u:') || el.dataset.f.startsWith('c:') || el.dataset.f.startsWith('a:')) render(); else refreshFields();
    }
  }
});
document.addEventListener('input', e => {
  const el = e.target; if (!el.dataset.f || el.tagName === 'SELECT' || el.type === 'checkbox' || el.type === 'radio') return;
  setField(el); if (el.dataset.live) render();
});
document.addEventListener('toggle', e => {
  const el = e.target; if (el.tagName !== 'DETAILS' || !el.dataset.id) return;
  const id = el.dataset.id;
  if (el.open && !ui.open.has(id)) { ui.open.add(id); if (cur() && cur().sessions.some(s => s.id === id)) render(); }
  else if (!el.open && ui.open.has(id)) { ui.open.delete(id); if (cur() && cur().sessions.some(s => s.id === id)) render(); }
}, true);

// ----- Drag & Drop der Übungskacheln -----
const dnd = { src: null };
function dndClear() { document.querySelectorAll('.dr-before,.dr-after,.dr-into,.dragging').forEach(n => n.classList.remove('dr-before', 'dr-after', 'dr-into', 'dragging')); }
document.addEventListener('dragstart', e => {
  const t = e.target.closest && e.target.closest('.xtile[draggable]'); if (!t) return;
  const row = t.closest('.xrow'); dnd.src = { sid: row.dataset.dsid, b: row.dataset.db, i: +row.dataset.di };
  e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', 'yoga-ex'); row.classList.add('dragging');
});
document.addEventListener('dragend', () => { dnd.src = null; dndClear(); });
document.addEventListener('dragover', e => {
  if (!dnd.src) return;
  const row = e.target.closest('.xrow'), card = e.target.closest('.bcard');
  if (!(row || card) || (row || card).dataset.dsid !== dnd.src.sid) return;
  e.preventDefault(); e.dataTransfer.dropEffect = 'move'; dndClear();
  if (row) { const r = row.getBoundingClientRect(); row.classList.add(e.clientY < r.top + r.height / 2 ? 'dr-before' : 'dr-after'); }
  else card.classList.add('dr-into');
});
document.addEventListener('drop', e => {
  if (!dnd.src) return;
  const row = e.target.closest('.xrow'), card = e.target.closest('.bcard'), src = dnd.src;
  if (!(row || card) || (row || card).dataset.dsid !== src.sid) return;
  e.preventDefault();
  const { s } = sessionOf(src.sid), from = s.blk[src.b], toKey = (row || card).dataset.db, to = s.blk[toKey];
  let idx = to.length;
  if (row) { const r = row.getBoundingClientRect(); idx = +row.dataset.di + (e.clientY < r.top + r.height / 2 ? 0 : 1); }
  const [item] = from.splice(src.i, 1);
  if (from === to && src.i < idx) idx--;
  to.splice(Math.max(0, Math.min(idx, to.length)), 0, item);
  [from, to].forEach(a => seqLayout(a, true)); seqSyncPlan(s);
  touch(s); dnd.src = null; dndClear(); save(); render();
  if (from !== to) { ui.bopen.add(src.sid + ':' + toKey); render(); toast(`„${(exById(item.id) || {}).n}“ nach „${bn(s, toKey)}“ verschoben.`); }
});

// ----- Übungsauswahl mit Strichmännchen -----
function closePicker() { const p = $('#pkpanel'); if (p) p.remove(); ui.pk = null; }
function openPicker(btn, d) {
  closePicker();
  const c = cur(), s = c.sessions.find(x => x.id === d.sid); if (!s) return;
  const all = poolFor(s, d.b).sort((a, b) => seqIdx(a.id) - seqIdx(b.id));
  const curId = d.i === '' ? null : s.blk[d.b][+d.i].id;
  // Filter einzeln abwählbar (merkt sich die Wahl): Vorauswahl = Filter der Stunde + Ausschlüsse, Stufe, Gebrechen
  const off = Object.assign({ blk: false, pre: false, lvl: false, geb: false }, ui.pkOff); ui.pkOff = off;
  const blockAll = all, allEx = exAll().slice().sort((a, b) => seqIdx(a.id) - seqIdx(b.id));
  const geb = effGeb(c, s);
  ui.pk = { sid: d.sid, b: d.b, i: d.i };
  const poolNow = () => {
    const pctx = mkCtx(c, s, Math.random), f = Object.assign({}, fltDefault(), pctx.flt || {});
    return (off.blk ? allEx : blockAll).filter(e => e.id === curId || (
      (off.lvl || levelOk(e, pctx.lvl)) && (off.geb || !contra(e, geb)) &&
      (off.pre || ((rating(e.id) > 0 || f.allowBanned) && katOk(e, pctx.flt)))));
  };
  const txbRow = sbPickRows('pkpick', curId);
  const rowsHtml = pool => txbRow + pool.map(p => {
    const bad = !off.geb && contra(p, geb) && p.id !== curId, r = rating(p.id), warn = (p.x || []).filter(g => geb.includes(g)).map(g => GEBRECHEN[g]);
    const meta = `<div class="pkmeta">${lvDots(p)}<span>${esc(lvName(p))}</span><span class="muted">· ${fmtMin(p.m)} Min.</span>${r === 0 ? '<span class="chip warn">ausgeschlossen</span>' : rstars(r)}</div>`;
    return `<button class="pko cat-${p.c}${p.id === curId ? ' cur' : ''}" data-a="pkpick" data-id="${p.id}" ${bad ? 'disabled' : ''} data-q="${esc(norm(p.n + ' ' + (p.sa || '')))}"><span class="pkf">${figureSVG(p.pose)}${peakStar(p)}</span><div class="pkinfo"><div class="pkname"><b>${esc(p.n)}</b>${p.sa ? `<small class="sa">${esc(p.sa)}</small>` : ''}</div>${meta}<div class="pkch">${stRegChips(p)}</div>${warn.length ? `<div class="pkwarn">⚠ ${esc(warn.join(', '))}</div>` : ''}</div></button>`;
  }).join('');
  const opt = (k, txt) => `<label class="pkopt"><input type="checkbox" data-pkopt="${k}" ${off[k] ? '' : 'checked'}> ${txt}</label>`;
  const optsHtml = `<div class="pkopts">${opt('blk', 'Nur Übungen dieses Blocks')}${opt('pre', 'Vorauswahl der Stunde (Filter, Ausschlüsse)')}${opt('lvl', 'Schwierigkeitsstufe beachten')}${opt('geb', 'Gebrechen beachten')}</div>`;
  const panel = document.createElement('div'); panel.id = 'pkpanel';
  const ab0 = abOf(s, d.b), defCat = ab0 === 'asana' ? 'stand' : ab0 === 'mobi' ? ({ sitz: 'mobi_sitz', liegen: 'boden', stand: 'mobi_stand' })[s.mobiMode || 'sitz'] : ab0 === 'shakti' ? 'shakti' : ab0 === 'ausgl' ? 'boden' : (catsOf(s, d.b)[0] || 'stand');
  const newForm = `<div class="pknew"><button class="ghost sm" data-a="pkNewOpen" id="pkNewBtn">＋ Eigene Übung hinzufügen</button><div class="pknf" id="pkNewForm" hidden><div class="pkfig cat-${defCat}" id="pkNewFig">${figureSVG('ratlos')}</div><div class="pkfields"><input type="text" id="pknn" placeholder="Name der Übung" autocomplete="off"><select id="pknc" data-chg="pkNewCat">${Object.keys(CATS).map(k => `<option value="${k}"${k === defCat ? ' selected' : ''}>${esc(CATS[k])}</option>`).join('')}</select><small class="muted">Neue Übungen bekommen das Standardsymbol (ratloser Strichmensch mit Fragezeichen) in der Farbe der Kategorie und erscheinen auch im Übungskatalog.</small><div class="bar"><button class="primary sm" data-a="pkNewAdd">Übung anlegen und verwenden</button></div></div></div></div>`;
  const fill = () => { const pool = poolNow(), tot = (off.blk ? allEx : blockAll).length, n = tot - pool.length; panel.querySelector('.pkgrid').innerHTML = rowsHtml(pool); panel.querySelector('.pknote').textContent = n > 0 ? `${pool.length} von ${tot} Übungen · ${n} ausgeblendet – Haken entfernen zeigt sie` : `Alle ${tot} Übungen`; applyQ(); };
  panel.innerHTML = `<input type="search" id="pkq" placeholder="Übung suchen …" autocomplete="off">${optsHtml}<div class="muted pknote"></div><div class="pkgrid"></div>${newForm}`;
  document.body.appendChild(panel);
  const r = btn.getBoundingClientRect(), w = Math.min(640, window.innerWidth - 16);
  panel.style.width = w + 'px'; panel.style.left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8)) + 'px';
  const spaceBelow = window.innerHeight - r.bottom - 12, spaceAbove = r.top - 12;
  if (spaceBelow >= 280 || spaceBelow >= spaceAbove) { panel.style.top = (r.bottom + 4) + 'px'; panel.style.maxHeight = Math.max(220, spaceBelow) + 'px'; }
  else { panel.style.bottom = (window.innerHeight - r.top + 4) + 'px'; panel.style.maxHeight = Math.max(220, spaceAbove) + 'px'; }
  const q = $('#pkq'); q.focus();
  const applyQ = () => { const v = norm(q.value); panel.querySelectorAll('.pko').forEach(b => { b.style.display = !v || b.dataset.q.includes(v) ? '' : 'none'; }); };
  q.addEventListener('input', applyQ);
  panel.querySelectorAll('[data-pkopt]').forEach(i => i.addEventListener('change', () => { off[i.dataset.pkopt] = !i.checked; fill(); }));
  fill();
  const cu = panel.querySelector('.pko.cur'); if (cu) panel.scrollTop = Math.max(0, cu.offsetTop - 90);
}
// ---------- Mantra-Kacheln und -Auswahl ----------
const manTileC = s => { const m = s.mantra && manById(s.mantra.id); return m ? `<span class="mt clk cat-mantra_t" data-a="pkman" data-sid="${s.id}" title="${esc(m.n)} – klicken zum Austauschen">${manIconSVG(m.id)}</span>` : ''; };
const manTile = s => { const m = s.mantra && manById(s.mantra.id); return m ? `<span class="mt cat-mantra_t" title="${esc(m.n)}">${manIconSVG(m.id)}</span>` : ''; };
function manSlot(s) {
  const m = s.mantra && manById(s.mantra.id);
  return m ? `<div class="bslot"><div class="xtile cat-mantra_t pkt" data-a="pkman" data-sid="${s.id}" title="Klicken: Mantra wählen / tauschen">${manIconSVG(m.id)}</div><b class="an">${esc(m.n.replace(/\s*\(.*$/, ''))}</b><small class="muted">${esc(MAN_TYP[m.typ])}</small></div>`
    : `<div class="bslot"><div class="xtile empty cat-mantra_t pkt" data-a="pkman" data-sid="${s.id}" title="Klicken: Mantra wählen"><span class="plus">＋</span></div><b class="an muted">kein Mantra</b><small class="muted">Mantra</small></div>`;
}
function openMantraPicker(btn, d) {
  closePicker();
  const c = cur(), s = c.sessions.find(x => x.id === d.sid); if (!s) return;
  const curId = s.mantra && s.mantra.id; ui.pk = { kind: 'man', sid: d.sid };
  const rows = MANTRAS.map(m => `<button class="pko cat-mantra_t${m.id === curId ? ' cur' : ''}" data-a="pkmanpick" data-id="${m.id}" data-q="${esc(norm(m.n + ' ' + m.text.join(' ') + ' ' + (m.fuer || '')))}"><span class="pkf">${manIconSVG(m.id)}</span><div class="pkinfo"><div class="pkname"><b>${esc(m.n)}</b></div><div class="pkmeta"><span>${esc(MAN_TYP[m.typ])}</span><span class="muted">· ${esc(m.fuer || '')}</span></div><div class="pkch"><small class="muted">${esc(m.q)}</small></div></div></button>`).join('');
  const panel = document.createElement('div'); panel.id = 'pkpanel';
  panel.innerHTML = `<input type="search" id="pkq" placeholder="Mantra suchen …" autocomplete="off"><div class="pkgrid">${rows}</div>`;
  document.body.appendChild(panel);
  const r = btn.getBoundingClientRect(), w = Math.min(640, window.innerWidth - 16);
  panel.style.width = w + 'px'; panel.style.left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8)) + 'px';
  const below = window.innerHeight - r.bottom - 12, above = r.top - 12;
  if (below >= 280 || below >= above) { panel.style.top = (r.bottom + 4) + 'px'; panel.style.maxHeight = Math.max(220, below) + 'px'; }
  else { panel.style.bottom = (window.innerHeight - r.top + 4) + 'px'; panel.style.maxHeight = Math.max(220, above) + 'px'; }
  const q = $('#pkq'); q.focus();
  q.addEventListener('input', () => { const v = norm(q.value); panel.querySelectorAll('.pko').forEach(b => { b.style.display = !v || b.dataset.q.includes(v) ? '' : 'none'; }); });
  const cu = panel.querySelector('.pko.cur'); if (cu) panel.scrollTop = Math.max(0, cu.offsetTop - 90);
}
function openBreathPicker(btn, d) {
  closePicker();
  const c = cur(), s = c.sessions.find(x => x.id === d.sid); if (!s) return;
  const kind = d.kind, cur_ = kind === 'atem' ? s.atem.a : s.atem.w;
  ui.pk = { kind: 'br', sid: d.sid, k: kind };
  const list = BR.filter(b => b.k === kind);
  const rows = list.map(b => {
    const bad = contra(b, effGeb(c, s)) && b.id !== cur_, r = rating(b.id);
    const tags = [bad ? '⚠ ' + b.x.filter(g => effGeb(c, s).includes(g)).map(g => GEBRECHEN[g]).join(', ') : '', r === 0 ? 'ausgeschlossen' : '', r >= 4 ? '★' : '', b.lv > 1 ? (b.lv === 2 ? 'Mittel' : 'Fortgeschritten') : ''].filter(Boolean).join(' · ');
    return `<button class="pko cat-br_${kind}${b.id === cur_ ? ' cur' : ''}" data-a="pkbrpick" data-id="${b.id}" ${bad ? 'disabled' : ''} data-q="${esc(norm(b.n))}">${breathIconSVG(b.id)}<span><b>${esc(b.n)}</b><small>${esc((b.st || []).map(k => STILE[k] || k).join(', '))}</small><small>${esc(tags)}</small></span></button>`;
  }).join('');
  const panel = document.createElement('div'); panel.id = 'pkpanel';
  panel.innerHTML = `<input type="search" id="pkq" placeholder="${kind === 'atem' ? 'Atemübung' : 'Wahrnehmungsübung'} suchen …" autocomplete="off"><div class="pkgrid">${rows}</div>`;
  document.body.appendChild(panel);
  const r = btn.getBoundingClientRect(), w = Math.min(640, window.innerWidth - 16);
  panel.style.width = w + 'px'; panel.style.left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8)) + 'px';
  const below = window.innerHeight - r.bottom - 12, above = r.top - 12;
  if (below >= 280 || below >= above) { panel.style.top = (r.bottom + 4) + 'px'; panel.style.maxHeight = Math.max(220, below) + 'px'; }
  else { panel.style.bottom = (window.innerHeight - r.top + 4) + 'px'; panel.style.maxHeight = Math.max(220, above) + 'px'; }
  const q = $('#pkq'); q.focus();
  q.addEventListener('input', () => { const v = norm(q.value); panel.querySelectorAll('.pko').forEach(b => { b.style.display = !v || b.dataset.q.includes(v) ? '' : 'none'; }); });
}
document.addEventListener('mousedown', e => { if (ui.pk && !e.target.closest('#pkpanel') && !e.target.closest('.pkb') && !e.target.closest('.pkt')) closePicker(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closePicker(); });
window.addEventListener('scroll', () => { if (ui.pk) closePicker(); }, { passive: true });

function importFile(file) {
  if (!file) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const j = JSON.parse(r.result);
      if (j.course) { const c = cloneCourse(j.course, { name: j.course.name }); state.courses.unshift(c); Object.assign(state.ratings, j.ratings || {}); }
      else if (Array.isArray(j.courses)) {
        const replace = confirm('OK = vorhandene Daten ERSETZEN\nAbbrechen = mit vorhandenen Daten ZUSAMMENFÜHREN');
        if (replace) state = Object.assign(defaults(), j);
        else { const ids = new Set(state.courses.map(c => c.id)); j.courses.forEach(c => { if (!ids.has(c.id)) state.courses.push(c); }); Object.assign(state.ratings, j.ratings || {}); (j.customEx || []).forEach(e => { if (!state.customEx.some(x => x.id === e.id)) state.customEx.push(e); }); (j.sequences || []).forEach(q => { if (!state.sequences.some(x => x.id === q.id)) state.sequences.push(q); }); (j.songs || []).forEach(q => { if (!state.songs.some(x => x.id === q.id)) state.songs.push(q); }); }
      } else throw new Error('Unbekanntes Dateiformat');
      mergeCatalogImport(j); normalizeState(); applyCatalogState(); save(); ui.view = 'courses'; render(); toast('Import erfolgreich.');
    } catch (err) { toast('Import fehlgeschlagen: ' + err.message); }
  };
  r.readAsText(file);
}

// Atem-Kacheln-Aktionen (liegen im CH-Objekt definiert, werden per data-a aufgerufen)
A.bmOff = function (d) { const { c, s } = sessionOf(d.id), k = d.b; s.bm[k].on = false; s.bmCustom = true; syncHaupt(s); genTexts(c, s, idxOf(c, s)); save(); render(); toast((k === 'atem' ? 'Atemteil' : 'Mantra') + ' ausgeblendet – wieder einschaltbar unter „Ablauf & Blöcke definieren“.', 5000); };
Object.assign(A, SINGLE_ACTIONS);
Object.assign(A, SEQ_ACTIONS);
Object.assign(CH, SEQ_CH);
Object.assign(A, MANTRA_ACTIONS);
Object.assign(A, SONG_ACTIONS);
Object.assign(A, TXVORL_ACTIONS);
Object.assign(A, ANA_ACTIONS);
Object.assign(A, AIGEN_ACTIONS);
Object.assign(A, PLAYER_ACTIONS);
Object.assign(A, VIDEO_ACTIONS);
Object.assign(A, {
  pkNewOpen() { const f = document.getElementById('pkNewForm'); if (!f) return; f.hidden = !f.hidden; if (!f.hidden) { const i = document.getElementById('pknn'); if (i) i.focus(); f.scrollIntoView({ block: 'nearest' }); } },
  pkNewAdd() {
    const p = ui.pk, nm = (document.getElementById('pknn') || {}).value || '', cat = (document.getElementById('pknc') || {}).value || 'stand'; if (!p) return;
    if (!nm.trim()) { toast('Bitte einen Namen eingeben.'); return; }
    const e = { id: 'c_' + uid(), n: nm.trim(), c: cat, lv: 1, m: 2, pose: 'ratlos', t: [], x: [], e: '', h: '', s: 1, o: 1000 + state.customEx.length, custom: true };
    state.customEx.push(e); A.pkpick({ id: e.id }); toast('Eigene Übung „' + e.n + '“ angelegt und eingefügt.');
  }
});
Object.assign(A, {
  sbOn(d) { const el = document.createElement('input'); el.type = 'checkbox'; el.dataset.f = 's:' + d.id + ':bm.' + d.b + '.on'; el.dataset.sid = d.id; el.dataset.b = d.b; el.checked = d.v === '1'; CH.bmon(el); },
  sbWahr(d) {
    const { c, s } = sessionOf(d.id); if (d.v === '1') { if (!s.atem.w) { const ctx = mkCtx(c, s, Math.random); ctx.have = new Set(blkIds(s)); s.atem.w = pickBreath(ctx, 'wahr') || 'bodenkontakt'; } } else s.atem.w = '';
    genTexts(c, s, idxOf(c, s), ['atem']); save(); render();
  },
  sbMobi(d) {
    const { c, s } = sessionOf(d.id);
    if (d.v === 'aus') { A.sbOn({ id: d.id, b: 'mobi', v: '0' }); return; }
    if (s.bm.mobi.on === false) A.sbOn({ id: d.id, b: 'mobi', v: '1' });
    s.mobiMode = d.v; s.bmCustom = true; if (Object.values(MOBI_MODES).includes(s.bm.mobi.name)) s.bm.mobi.name = MOBI_MODES[d.v];
    s.blk.mobi = []; rerollBlock(c, s, 'mobi'); genTexts(c, s, idxOf(c, s)); save(); render();
  },
  sbKraft(d) {
    const { c, s } = sessionOf(d.id), n = +d.v, items = s.blk.asana || (s.blk.asana = []), ks = items.filter(i => !i.seq && (exById(i.id) || {}).c === 'kraft');
    while (ks.length > n) { const k = ks.pop(); items.splice(items.indexOf(k), 1); }
    if (ks.length < n) { const ctx = mkCtx(c, s, Math.random); ctx.have = new Set(blkIds(s)); pickN(poolOf('kraft'), n - ks.length, ctx).forEach(e => items.push(mkItem(e))); }
    s.kN = n; sortItems(items); s.bmCustom = true; save(); render();
  }
});
Object.assign(CH, TXVORL_CH);
Object.assign(A, rcpActions);
Object.assign(A, { tglw: CH.tglw, pkbr: CH.pkbr, pkbrpick: CH.pkbrpick });
applySeeds();
normalizeState();
applyCatalogState();
document.head.insertAdjacentHTML('beforeend', `<style id="docCss">${DOC_CSS}</style>`);
render();

// Google Sheets Auto-Load beim Start
if (typeof loadFromGoogleSheets === 'function') {
  setTimeout(async () => {
    try {
      const sheetData = await loadFromGoogleSheets();
      if (sheetData && Array.isArray(sheetData) && sheetData.length > 1) {
        console.log('✅ Google Sheets Daten geladen');
        toast('Daten von Google Sheets geladen', 2000);
      }
    } catch (e) {
      console.log('ℹ Google Sheets nicht verfügbar oder kein Backup');
    }
  }, 500);
}

// ---- Aktionen: Übungen bearbeiten ----
Object.assign(A, {
  exEditOpen(d) { const o = exById(d.id); if (!o) return; exDraftOpen(o); ui.exOpen.add(d.id); render(); },
  exEditCancel() { ui.exEdit = null; render(); },
  exEditResetBtn(d, el) { if (confirmTwice(el, 'exr' + d.id, 'Auf Original zurücksetzen?', '⚠ Wirklich zurücksetzen?')) { exEditReset(d.id); if (ui.exEdit === d.id) ui.exEdit = null; render(); toast('Übung auf Original zurückgesetzt.'); } },
  exPickSym(d) { if (exIsBR(ui.exEdit)) ui.exDraft.ic = d.v; else ui.exDraft.pose = d.v; render(); },
  newPose(d) { ui.newEx.pose = d.v; render(); },
  poseGrp(d) { ui.poseGrp = d.g; render(); },
  dtog(d) {
    const g = d.g, o = exById(ui.exEdit), dr = ui.exDraft;
    if (g === 'st' || g === 'x') { const a = dr[g], i = a.indexOf(d.v); i < 0 ? a.push(d.v) : a.splice(i, 1); }
    else if (g === 'c') dr.c = d.v;
    else {
      const cur_ = katEff(o, g); delete ui.exDraftKat[g]; ui.exDraftAuto = ui.exDraftAuto.filter(x => x !== g);
      if (g === 'en') ui.exDraftKat[g] = cur_ === d.v ? '' : d.v;
      else { const a = (Array.isArray(cur_) ? cur_ : []).slice(), i = a.indexOf(d.v); i < 0 ? a.push(d.v) : a.splice(i, 1); ui.exDraftKat[g] = a; }
    }
    render();
  },
  grpAuto(d) { delete ui.exDraftKat[d.g]; if (!ui.exDraftAuto.includes(d.g)) ui.exDraftAuto.push(d.g); render(); },
  vocNew(d) {
    const inp_ = document.getElementById(`vocIn-${d.t}-${d.g}`), lab = inp_ && inp_.value.trim(); if (!lab) { toast('Bitte einen Namen für den neuen Baustein eingeben.'); return; }
    const id = vocabAdd(d.t, lab, d.g || undefined), o = exById(ui.exEdit), dr = ui.exDraft; if (!id) return;
    if (d.t === 'cats') dr.c = id; else if (d.t === 'stile') { if (!dr.st.includes(id)) dr.st.push(id); } else if (d.t === 'geb') { if (!dr.x.includes(id)) dr.x.push(id); }
    else { const cur_ = katEff(o, d.g); if (d.g === 'en') ui.exDraftKat.en = id; else { const a = (Array.isArray(cur_) ? cur_ : []).slice(); if (!a.includes(id)) a.push(id); ui.exDraftKat[d.g] = a; } ui.exDraftAuto = ui.exDraftAuto.filter(x => x !== d.g); }
    render(); toast('Baustein „' + lab + '“ angelegt.');
  },
  vocRename(d) { const cur_ = vocabTargets(d.t, d.g || undefined)[d.v], lab = window.prompt('Neuer Name für den Baustein:', typeof cur_ === 'string' ? cur_ : ''); if (lab && lab.trim()) { vocabRename(d.t, d.v, lab, d.g || undefined); render(); } },
  vocDel(d, el) { const n = vocabUsage(d.t, d.v, d.g || undefined); if (n > 0) { toast('Wird noch von ' + n + (n === 1 ? ' Übung' : ' Übungen') + ' verwendet – zuerst dort entfernen.', 5000); return; } if (confirmTwice(el, 'vd' + d.v, 'Baustein löschen?', '⚠')) { vocabRemove(d.t, d.v, d.g || undefined); render(); } },
  exEditSave() {
    const id = ui.exEdit, d = ui.exDraft, o = exById(id); if (!o) return;
    if (!String(d.n).trim()) { toast('Bitte einen Namen eingeben.'); return; }
    const br = exIsBR(id), orig = br ? BR_ORIG.get(id) : EX_ORIG.get(id), custom = !orig;
    const val = { n: d.n.trim(), d: d.d, m: +d.m || 1, lv: +d.lv || 1, s: d.s ? 1 : 0, st: d.st.filter(k => STILE[k]), x: d.x.filter(k => GEBRECHEN[k]) };
    if (br) { val.k = d.c; val.ic = d.ic === id ? '' : d.ic; } else { val.sa = d.sa.trim(); val.c = CATS[d.c] ? d.c : o.c; val.pose = d.pose; }
    const { fields, unset } = diffFields(val, custom ? o : orig, custom);
    const kat = {}; if (!ui.exDraftAll) Object.keys(ui.exDraftKat).forEach(g => { const v = ui.exDraftKat[g]; kat[g] = g === 'en' ? (KAT.en[v] ? v : '') : v.filter(k => KAT[g][k]); });
    exEdit(id, { fields, unset, kat, auto: ui.exDraftAuto, recalcAll: ui.exDraftAll });
    ui.exEdit = null; render();
    const man = manualGroups(id).length; toast('Gespeichert.' + (br ? '' : ' Automatische Kategorien neu berechnet' + (man ? '; ' + man + ' manuelle unverändert (🔒).' : '.')));
  }
});
