/* Übungskatalog bearbeiten: Änderungen (state.exEdits) und eigene Bausteine (state.vocab) werden in EX, BR, CATS, STILE, GEBRECHEN und KAT zurückgeschrieben.
   Die Originale bleiben als Snapshot erhalten (Zurücksetzen). Kategorien einer Übung sind je Gruppe automatisch (deriveKat) oder manuell (exEdits[id].manual).
   exEdits[id] = { fields: {n, sa, d, m, c, lv, s, st, x, t, pose, ic …}, kat: {gruppe: Wert}, manual: {gruppe: true} } – bei eigenen Übungen stehen die Felder direkt am Objekt. */
const EX_ORIG = new Map(EX.map(e => [e.id, JSON.parse(JSON.stringify(e))]));
const BR_ORIG = new Map(BR.map(b => [b.id, JSON.parse(JSON.stringify(b))]));
const POSE_KEYS = Object.keys(POSES).filter(k => k !== 'ratlos').concat('ratlos');
const ICON_KEYS = Object.keys(ICONS);
const VOCAB_COLORS = ['#c9a227', '#5b8fb9', '#9c6ba0', '#6aa86b', '#d0805a', '#4aa3a2', '#b86b77', '#8a8f3c'];
const clone_ = o => JSON.parse(JSON.stringify(o));
let vocabAdded = [];

function vocabTargets(type, group) { return type === 'cats' ? CATS : type === 'stile' ? STILE : type === 'geb' ? GEBRECHEN : KAT[group]; }
function mergeVocab() {
  vocabAdded.forEach(([o, id]) => { delete o[id]; }); vocabAdded = [];
  const v = state.vocab || {};
  const put = (o, id, label) => { if (o) { o[id] = label; vocabAdded.push([o, id]); } };
  Object.keys(v.cats || {}).forEach(id => put(CATS, id, v.cats[id].n));
  Object.keys(v.stile || {}).forEach(id => put(STILE, id, v.stile[id]));
  Object.keys(v.geb || {}).forEach(id => put(GEBRECHEN, id, v.geb[id]));
  Object.keys(v.kat || {}).forEach(g => Object.keys(v.kat[g]).forEach(id => put(KAT[g], id, v.kat[g][id])));
  if (typeof document !== 'undefined') {
    let st = document.getElementById('vocabStyle');
    if (!st) { st = document.createElement('style'); st.id = 'vocabStyle'; document.head.appendChild(st); }
    st.textContent = Object.keys(v.cats || {}).map(id => `.cat-${id}{--k:${v.cats[id].color}}`).join('') + Object.keys(v.stile || {}).map(id => `.st-${id}{background:#dde3ea!important}`).join('');
  }
}

function manualGroups(id) { const ed = (state.exEdits || {})[id]; return ed ? KAT_GROUPS.filter(g => ed.manual && ed.manual[g]) : []; }
function exIsEdited(id) { const ed = (state.exEdits || {})[id]; return !!ed && (Object.keys(ed.fields || {}).length > 0 || manualGroups(id).length > 0); }

function applyCatalogState() {
  mergeVocab();
  const edits = state.exEdits || {}, customs = new Set((state.customEx || []).map(e => e.id));
  const restore = (it, orig) => { Object.keys(it).forEach(k => delete it[k]); Object.assign(it, clone_(orig)); };
  const overlayKat = (e, ed) => { KAT_GROUPS.forEach(g => { if (ed && ed.manual && ed.manual[g]) e.kat[g] = clone_(ed.kat[g] === undefined ? (g === 'en' ? '' : []) : ed.kat[g]); }); e.peak = (e.kat.ziel || []).includes('peak'); };
  EX.forEach(e => {
    const ed = edits[e.id], orig = EX_ORIG.get(e.id);
    if (!ed) { if (e.kat === undefined || e._edited) { restore(e, orig); } return; }
    restore(e, orig); Object.assign(e, clone_(ed.fields || {}));
    delete e.kat; deriveKat(e); overlayKat(e, ed); e._edited = true;
  });
  BR.forEach(b => { const ed = edits[b.id]; restore(b, BR_ORIG.get(b.id)); if (ed) Object.assign(b, clone_(ed.fields || {})); });
  (state.customEx || []).forEach(e => { delete e.kat; deriveKat(e); overlayKat(e, edits[e.id]); });
}

function exEdit(id, patch) {
  patch = patch || {};
  const custom = (state.customEx || []).find(e => e.id === id);
  state.exEdits = state.exEdits || {};
  const ed = state.exEdits[id] || (state.exEdits[id] = { fields: {}, kat: {}, manual: {} });
  if (patch.fields) { if (custom) Object.assign(custom, clone_(patch.fields)); else Object.assign(ed.fields, clone_(patch.fields)); }
  (patch.unset || []).forEach(k => { delete ed.fields[k]; });
  if (patch.recalcAll) { ed.kat = {}; ed.manual = {}; }
  (patch.auto || []).forEach(g => { delete ed.kat[g]; delete ed.manual[g]; });
  Object.keys(patch.kat || {}).forEach(g => { ed.kat[g] = clone_(patch.kat[g]); ed.manual[g] = true; });
  if (!Object.keys(ed.fields).length && !Object.keys(ed.manual).length) delete state.exEdits[id];
  save(); applyCatalogState();
}
// Geänderte Felder gegenüber dem Original (eingebaut) bzw. dem aktuellen Objekt (eigene Übung); unset = Felder, die wieder dem Original entsprechen
function diffFields(val, base, custom) {
  const fields = {}, unset = [];
  Object.keys(val).forEach(k => {
    const def = Array.isArray(val[k]) ? [] : typeof val[k] === 'string' ? '' : undefined;
    if (JSON.stringify(val[k]) !== JSON.stringify(base[k] === undefined ? def : base[k])) fields[k] = val[k]; else if (!custom) unset.push(k);
  });
  return { fields, unset };
}
function exEditReset(id) { if (state.exEdits) delete state.exEdits[id]; save(); applyCatalogState(); }

// ---------- eigene Bausteine ----------
function vocabAdd(type, label, group) {
  label = String(label || '').trim(); if (!label) return '';
  const target = vocabTargets(type, group); if (!target) return '';
  const lab = id => String(type === 'cats' ? target[id] : target[id]).toLowerCase();
  const same = Object.keys(target).find(id => lab(id) === label.toLowerCase()); if (same) return same;
  state.vocab = state.vocab || {};
  const slug = label.toLowerCase().replace(/[^a-zäöüß0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'neu';
  let id = 'v_' + slug, i = 2; while (target[id]) id = 'v_' + slug + '_' + i++;
  if (type === 'cats') { const m = state.vocab.cats = state.vocab.cats || {}; m[id] = { n: label, color: VOCAB_COLORS[Object.keys(m).length % VOCAB_COLORS.length] }; }
  else if (type === 'kat') { const m = state.vocab.kat = state.vocab.kat || {}; (m[group] = m[group] || {})[id] = label; }
  else (state.vocab[type] = state.vocab[type] || {})[id] = label;
  save(); applyCatalogState(); return id;
}
function vocabRename(type, id, label, group) {
  label = String(label || '').trim(); const v = state.vocab || {}; if (!label) return;
  if (type === 'cats') { if (v.cats && v.cats[id]) v.cats[id].n = label; }
  else if (type === 'kat') { if (v.kat && v.kat[group] && v.kat[group][id]) v.kat[group][id] = label; }
  else if (v[type] && v[type][id]) v[type][id] = label;
  save(); applyCatalogState();
}
function vocabUsage(type, id, group) {
  const items = exAll().concat(BR);
  if (type === 'geb') { // auch Kurs-Rahmen und Stunden-Filter können eigene „Vorsicht bei“-Bausteine auswählen
    const inCourses = (state.courses || []).reduce((n, c) => n + ((c.gebrechen || []).includes(id) ? 1 : 0) + (c.sessions || []).filter(s => s.flt && (s.flt.geb || []).includes(id)).length, 0);
    return items.filter(e => (e.x || []).includes(id)).length + inCourses;
  }
  return items.filter(e => type === 'cats' ? e.c === id : type === 'stile' ? (e.st || []).includes(id) : type === 'geb' ? (e.x || []).includes(id) : (() => { const v = e.kat && e.kat[group]; return Array.isArray(v) ? v.includes(id) : v === id; })()).length;
}
function vocabRemove(type, id, group) {
  if (!/^v_/.test(id) || vocabUsage(type, id, group) > 0) return false;
  const v = state.vocab || {};
  if (type === 'kat') { if (v.kat && v.kat[group]) delete v.kat[group][id]; } else if (v[type]) delete v[type][id];
  save(); applyCatalogState(); return true;
}

// Import: fehlende Änderungen und Bausteine ergänzen, Vorhandenes bleibt
function mergeCatalogImport(j) {
  state.exEdits = state.exEdits || {};
  Object.keys(j.exEdits || {}).forEach(id => { if (!state.exEdits[id]) state.exEdits[id] = clone_(j.exEdits[id]); });
  const iv = j.vocab || {}; if (!Object.keys(iv).length) { applyCatalogState(); return; }
  state.vocab = state.vocab || {};
  ['cats', 'stile', 'geb'].forEach(t => Object.keys(iv[t] || {}).forEach(id => { const m = state.vocab[t] = state.vocab[t] || {}; if (!m[id]) m[id] = clone_(iv[t][id]); }));
  Object.keys(iv.kat || {}).forEach(g => Object.keys(iv.kat[g]).forEach(id => { const m = state.vocab.kat = state.vocab.kat || {}; const gm = m[g] = m[g] || {}; if (!gm[id]) gm[id] = iv.kat[g][id]; }));
  applyCatalogState();
}
