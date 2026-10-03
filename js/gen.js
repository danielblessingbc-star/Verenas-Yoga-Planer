/* Generator: Dauer, Mottos, Übungsauswahl, Textbausteine, optional KI */
const uid = () => Math.random().toString(36).slice(2, 9);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function rng(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const rpick = (arr, r) => arr[Math.floor(r() * arr.length)];
// Schlüsselwörter in Anleitungstexten (Hervorhebung im Editor und im Ausdruck)
const KW_STEMS = ['atem\\p{L}*', 'einatm\\p{L}*', 'ausatm\\p{L}*', 'boden', 'ruhe', 'stille', 'mitte', 'wärme', 'schwere', 'weite', 'loslass\\p{L}*', 'entspann\\p{L}*', 'wahrnehm\\p{L}*', 'nimm wahr', 'spür\\p{L}*', 'ankommen', 'nachspür\\p{L}*', 'gedanken'];
const kwOn = () => !(state && state.settings && state.settings.hlKeys === false);
function kwRanges(text, s) {
  const extra = [];
  if (s) { if (s.motto && s.motto.title) extra.push(s.motto.title); const m = s.mantra && typeof manById === 'function' && manById(s.mantra.id); if (m) extra.push(m.n.replace(/\s*\(.*$/, '')); }
  const esc_ = x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rx = new RegExp('(?<![\\p{L}])(' + extra.filter(x => x.length > 3).map(esc_).concat(KW_STEMS).join('|') + ')(?![\\p{L}])', 'giu'), out = []; let m;
  while ((m = rx.exec(text))) out.push([m.index, m.index + m[0].length]);
  return out;
}
function kwHtml(text, s, open, close) {
  const E = x => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  if (!kwOn()) return E(text);
  let o = '', p = 0; kwRanges(text, s).forEach(([a, b]) => { o += E(text.slice(p, a)) + open + E(text.slice(a, b)) + close; p = b; });
  return o + E(text.slice(p));
}
const norm = s => (s || '').toLowerCase().replace(/[^a-zäöüß0-9]+/g, ' ').trim();

// ---------- Katalog-Zugriff ----------
function exAll() { return EX.concat(state.customEx || []); }
// Sonderbaustein „Textblock“: erscheint im Auswahlfenster wie eine Übung, ist aber ein Textabschnitt (it.tx) mit Dauer.
// Er gehört nicht zu exAll(): der Generator wählt ihn nie von selbst, eigene Auswertungen (Analyse, Bewertung) überspringen ihn (e.txt).
const TXB_ID = 'textblock';
const TEXTBLOCK = { id: TXB_ID, n: 'Textblock', sa: '', c: 'textblock', lv: 1, m: 1, pose: 'textblock', t: [], x: [], st: [], e: '', h: '', s: 1, o: 0, txt: true, sb: 'text', kat: {}, d: 'Sonderbaustein: ein Textabschnitt statt einer Übung, z. B. Anleitung, Hinweis oder Yoga Nidra. Der Text steht an dieser Stelle der Stunde oder der Sequenz.' };
// Weitere Sonderbausteine: „Lied“ (aus dem Lied-Katalog) und „Mantra“ (aus der Seite Mantras). Sie verhalten sich wie der Textblock (txt: true, werden nie automatisch gewählt und von Auswertungen übersprungen), tragen aber statt eines Textes einen Verweis it.ref.
// „Freie Übung“: wie der Textblock trägt sie einen Text (it.tx), der aber als Name in der Kachel steht.
// „Pause“: nur Dauer und ein optionaler kurzer Hinweis (it.tx), der unter dem Namen „Pause“ steht.
const LIED_ID = 'sb_lied', MANSB_ID = 'sb_mantra', FREI_ID = 'sb_frei', PAUSE_ID = 'sb_pause';
const SB_DEFS = {
  [TXB_ID]: TEXTBLOCK,
  [LIED_ID]: Object.assign({}, TEXTBLOCK, { id: LIED_ID, n: 'Lied', c: 'lied', m: 4, pose: 'lied', sb: 'lied', d: 'Sonderbaustein: ein Lied aus dem Lied-Katalog an dieser Stelle der Stunde oder der Sequenz.' }),
  [MANSB_ID]: Object.assign({}, TEXTBLOCK, { id: MANSB_ID, n: 'Mantra', c: 'mantrasb', m: 3, pose: 'mantrasb', sb: 'mantra', d: 'Sonderbaustein: ein Mantra aus der Seite Mantras an dieser Stelle der Stunde oder der Sequenz.' }),
  [FREI_ID]: Object.assign({}, TEXTBLOCK, { id: FREI_ID, n: 'Freie Übung', c: 'frei', m: 2, pose: 'frei', sb: 'frei', d: 'Sonderbaustein: eine Übung mit frei eingetragenem Namen. Der Text neben der Kachel steht in der Kachel.' }),
  [PAUSE_ID]: Object.assign({}, TEXTBLOCK, { id: PAUSE_ID, n: 'Pause', c: 'pause', m: 1, pose: 'pause', sb: 'pause', d: 'Sonderbaustein: eine Pause an dieser Stelle der Stunde oder der Sequenz, nur mit Dauer und einem kurzen Hinweis (optional).' })
};
const isTxb = i => !!i && i.id === TXB_ID;
const hasTx = e => !!e && (e.sb === 'text' || e.sb === 'frei' || e.sb === 'pause');   // Sonderbausteine mit eigenem Text (it.tx) statt Verweis (it.ref)
const isSb = i => !!i && !!SB_DEFS[i.id];
function exById(id) { return exAll().find(e => e.id === id) || BR.find(b => b.id === id) || SB_DEFS[id] || null; }
function rating(id) { const r = state.ratings[id]; return r === undefined ? 3 : r; }
function levelOk(e, lvl) {
  if (lvl === 'anf') return e.lv <= 1;
  if (lvl === 'mittel') return e.lv <= 2;
  if (lvl === 'fort') return true;
  if (lvl === 'sen') return e.s === 1 && e.lv <= 2;
  return e.lv <= 2; // gemischt
}
function levelBonus(e, lvl) {
  if (lvl === 'mittel') return e.lv === 2 ? 7 : 0;
  if (lvl === 'fort') return e.lv >= 2 ? 10 : 0;
  if (lvl === 'gemischt') return (e.e || e.h) ? 2 : 0;
  return e.lv === 1 ? 1 : 0;
}
const contra = (e, geb) => (e.x || []).some(g => (geb || []).includes(g));
function levelChips(e) {
  const c = [];
  if (e.lv <= 1) c.push('Anfänger');
  if (e.lv <= 2) c.push('Mittel');
  c.push('Fortgeschritten');
  if (e.s === 1 && e.lv <= 2) c.push('Senioren');
  return c;
}

const levelDisplay = e => [e.lv <= 1 ? 'ab Anfänger' : e.lv === 2 ? 'ab Mittel' : 'Fortgeschritten'].concat(e.s === 1 && e.lv <= 2 ? ['Senioren'] : []);

// ---------- Dauer ----------
function splitTotal(T) {
  const shava = clamp(Math.round(T * 0.2), 5, 20), einl = Math.max(3, Math.round(T * 0.07)),
    atem = Math.max(3, Math.round(T * 0.07)), schluss = Math.max(2, Math.round(T * 0.04));
  return { einl, atem, schluss, shava, haupt: Math.max(10, T - shava - einl - atem - schluss), mantra: 5, kraft: 3, shakti: 8 };
}
// Zeitblöcke des Rahmens in Stundenreihenfolge (jeder entspricht einem Block der Stunde). Mantra, Mobilisation und Shakti Naam zählen nur, wenn aufgenommen; die Kraftübungen stehen innerhalb der Asanas.
const partOn = (c, k) => c[k + 'On'] !== 0; // Einleitung, Schluss und Shavasana lassen sich rauslassen (Standard: Ja)
const durKeys = c => (partOn(c, 'einl') ? ['einl'] : []).concat(c.breath === 'aus' ? [] : ['atem'], mantraMode(c) !== 'aus' ? ['mantra'] : [], c.mobi === 'aus' ? [] : ['mobi'], c.shakti ? ['shakti'] : [], ['asana'], partOn(c, 'ausgl') ? ['ausgl'] : [], partOn(c, 'schluss') ? ['schluss'] : [], partOn(c, 'shava') ? ['shava'] : []);
// Zeiten der Hauptteil-Blöcke aus der Gesamt-Hauptteilzeit H ableiten (Altbestand / neue Gesamtdauer)
function deriveBlockDurs(c, H) {
  const d = c.durs, sb = c.shakti ? Math.max(2, +d.shakti || 8) : 0, rest = Math.max(10, H - sb), kb = c.kraft ? Math.max(0, +d.kraft || 3) : 0;
  const mo = c.mobi === 'aus' ? 0 : Math.round((rest - kb) * (c.kraft ? .26 : .24)), au = partOn(c, 'ausgl') ? Math.round((rest - kb) * .22) : 0;
  d.mobi = mo || (+d.mobi || 6); d.ausgl = au ? Math.max(2, au) : (+d.ausgl || 6); d.asana = Math.max(5, rest - mo - (au ? d.ausgl : 0));
}
// Gesamtdauer bleibt fest (c.total); alle anderen Teile werden angepasst (zuerst die Asanas). keep = Teil, der unverändert bleibt.
function fitDurs(c, keep) {
  const d = c.durs, T = Math.round(+c.total) || 75;
  if (d.asana == null) deriveBlockDurs(c, (+d.haupt || 40) + (c.kraft ? +d.kraft || 0 : 0) + (c.shakti ? +d.shakti || 0 : 0));
  const ks = durKeys(c), mn = k => k === 'asana' ? 5 : 1;
  ks.forEach(k => { d[k] = Math.max(mn(k), Math.round(+d[k] || 0)); });
  if (keep === 'total') {
    const b = splitTotal(T); ['einl', 'atem', 'schluss', 'shava'].forEach(k => { d[k] = b[k]; });
    const fixed = (ks.includes('einl') ? d.einl : 0) + (ks.includes('atem') ? d.atem : 0) + (ks.includes('mantra') ? d.mantra : 0) + (ks.includes('schluss') ? d.schluss : 0) + (ks.includes('shava') ? d.shava : 0);
    deriveBlockDurs(c, Math.max(15, T - fixed));
  }
  const sum = () => ks.reduce((a, k) => a + d[k], 0);
  let diff = T - sum();
  if (diff && keep !== 'asana') { const m = Math.max(5, d.asana + diff); diff -= m - d.asana; d.asana = m; }
  for (let gi = 0; diff && gi < 500; gi++) {
    const st = diff > 0 ? 1 : -1, cand = ks.filter(k => k !== keep && d[k] + st >= mn(k)).sort((a, b) => d[b] - d[a]);
    if (!cand.length) break;
    d[cand[0]] += st; diff -= st;
  }
  if (c.kraft) d.kraft = Math.min(Math.max(1, +d.kraft || 3), Math.max(1, d.asana - 3));
  d.haupt = (ks.includes('mobi') ? d.mobi : 0) + (c.shakti ? d.shakti : 0) + d.asana + (ks.includes('ausgl') ? d.ausgl : 0);
  c.total = sum();
}
// Dauer je Stunde aus dem Rahmen: Hauptteil = Mobilisation + Shakti Naam + Asanas (inkl. Kraft) + Ausgleich; die Mantra-Zeit ist ein eigener Block
function courseDur(c) {
  if (c.durs && c.durs.asana == null) fitDurs(c, 'norm');
  const d = Object.assign({}, c.durs || splitTotal(c.total || 75));
  d.haupt = (c.mobi === 'aus' ? 0 : +d.mobi || 0) + (c.shakti ? +d.shakti || 0 : 0) + (+d.asana || 0) + (partOn(c, 'ausgl') ? +d.ausgl || 0 : 0);
  ['kraft', 'shakti', 'mobi', 'asana', 'ausgl'].forEach(k => { delete d[k]; });
  if (c.breath === 'aus') d.atem = 0;
  ['einl', 'schluss', 'shava'].forEach(k => { if (!partOn(c, k)) d[k] = 0; });
  return d;
}
// ---------- Blöcke der Stunde (Standard + individuelle Anpassung, eigene Blöcke möglich) ----------
const BDEF = [
  ['einl', 'Einleitung', 'text'], ['atem', 'Atemübung', 'atem'], ['mantra', 'Mantra', 'mantra'], ['mobi', 'Mobilisation im Sitzen', 'ex'], ['shakti', 'Shakti Naam', 'ex'],
  ['asana', 'Asanas (Hauptteil)', 'ex'], ['ausgl', 'Ausgleich / Cool down', 'ex'], ['schluss', 'Schluss', 'text'], ['shava', 'Shavasana', 'text']
];
const EXKEYS = ['mobi', 'shakti', 'asana', 'ausgl'];        // Standard-Übungsblöcke (werden automatisch befüllt)
// Status: vorgeplant = automatisch befüllt; in_planung = wird automatisch gesetzt, sobald etwas geändert wurde; fertig = muss manuell gesetzt werden
const STATUS = { vorgeplant: 'Vorgeplant', in_planung: 'In Planung', fertig: 'Fertig' };
const STATUS_MIGRATE = { entwurf: 'vorgeplant', geplant: 'in_planung', gehalten: 'fertig' };
const BTYPES = { text: 'Text', ex: 'Übungen', atem: 'Atem + Wahrnehmung', mantra: 'Mantra' };
const BEXTRA = [['nidra', 'Yoga Nidra', 'text']];   // zusätzliche Abschnitte (nur für eigene Blöcke wählbar, nicht Teil der Standardstunde)
const bdefName = k => (BDEF.concat(BEXTRA).find(b => b[0] === k) || [0, k])[1];
const bdefType = k => (BDEF.concat(BEXTRA).find(b => b[0] === k) || [0, 0, 'text'])[2];
const bn = (s, k) => (s.bm && s.bm[k] && s.bm[k].name) || bdefName(k);
const bon = (s, k) => !(s.bm && s.bm[k] && s.bm[k].on === false);
const bty = (s, k) => (s.bm && s.bm[k] && s.bm[k].type) || bdefType(k);
const isCustomKey = k => !BDEF.some(b => b[0] === k);
// Ablaufart (fest zur Auswahl, bestimmt Übungs-Pool und Texttyp) – Blockart (Text / Übungen / Atem) – Name (frei änderbar)
const BCATS = { mobi: ['mobi_sitz'], shakti: ['shakti'], aufw: ['mobi_stand', 'flow'], asana: ['mobi_stand', 'flow', 'stand', 'balance', 'kraft'], kraft: ['kraft'], ausgl: ['boden'] };
const abOf = (s, k) => (s && s.bm && s.bm[k] && s.bm[k].ab) || (isCustomKey(k) ? 'asana' : k);
// Mobilisation: im Sitzen (Standard), im Liegen (liegende Übungen aus „Ausgleich“) oder im Stehen
const MOBI_MODES = { sitz: 'Mobilisation im Sitzen', liegen: 'Mobilisation im Liegen', stand: 'Mobilisation im Stehen' };
const MOBI_LIE_POSES = new Set(['supine_knee', 'leg_stretch', 'bridge', 'heart_supine', 'butterfly_lying', 'twist_supine', 'legs_wall']);
const mobiMode = c => (c && c.mobi) || 'sitz';
// Anzahl Kraftübungen je Stunde (bei „zufällig“ 1 bis 3, je Stunde unterschiedlich)
const kraftCountFor = (c, ix) => !c.kraft ? 0 : c.kraftRnd ? 1 + Math.floor(rng((+c.kraftSeed || 11) + Math.max(0, ix || 0) * 131)() * 3) : (c.kraftN || 1);
// Shakti-Naam-Block je Stunde: Ja (immer), abwechselnd (Stunde 1, 3, 5 …) oder zufällig (ca. jede zweite)
const shaktiOnFor = (c, ix) => { if (!c.shakti) return false; const m = c.shaktiMode || 'immer'; return m === 'immer' || (m === 'wechsel' && Math.max(0, ix || 0) % 2 === 0) || (m === 'zufall' && rng((+c.shaktiSeed || 5) + Math.max(0, ix || 0) * 97)() < 0.5); };
// Art der Mobilisation je Stunde (bei „abwechselnd“ reihum Sitzen → Liegen → Stehen)
const mobiModeFor = (c, ix) => c.mobi === 'zufall' ? ['sitz', 'liegen', 'stand'][Math.floor(rng((+c.mobiSeed || 7) + Math.max(0, ix || 0) * 7919)() * 3)] : c.mobi === 'wechsel' ? ['sitz', 'liegen', 'stand'][Math.max(0, ix || 0) % 3] : (c.mobi && c.mobi !== 'aus' ? c.mobi : 'sitz');
function mobiPool(s) {
  const m = (s && s.mobiMode) || 'sitz';
  return m === 'liegen' ? poolOf('boden').filter(e => MOBI_LIE_POSES.has(e.pose)) : m === 'stand' ? poolOf('mobi_stand') : poolOf('mobi_sitz');
}
const poolFor = (s, k) => abOf(s, k) === 'mobi' ? mobiPool(s) : poolOf(...catsOf(s, k));
const catsOf = (s, k) => BCATS[abOf(s, k)] || Object.keys(CATS);
const order = s => (s.order && s.order.length ? s.order : BDEF.map(b => b[0]));
const exKeys = s => order(s).filter(k => bty(s, k) === 'ex');
const blockMin = (s, k) => bty(s, k) === 'ex' ? (+(s.bm && s.bm[k] && s.bm[k].min) || 0) : (+(s.dur && s.dur[k]) || 0);
const sessionTotal = s => !s.bm
  ? ['einl', 'atem', 'haupt', 'schluss', 'shava'].reduce((a, k) => a + (+s.dur[k] || 0), 0)
  : order(s).reduce((a, k) => a + (bon(s, k) ? blockMin(s, k) : 0), 0);
function courseBM(c) {
  c.bm = c.bm || {};
  BDEF.forEach(([k, n]) => { c.bm[k] = Object.assign({ name: n, on: true }, c.bm[k]); if (!c.bm[k].name) c.bm[k].name = n; });
  return c.bm;
}
function initBM(c, s, idx) {
  courseBM(c);
  s.shaktiOn = shaktiOnFor(c, idx != null ? idx : (c.sessions || []).indexOf(s));
  const B = blockBudgets(c, +s.dur.haupt || 45, !s.shaktiOn);
  s.bm = {}; s.order = BDEF.map(b => b[0]); s.mobiMode = mobiModeFor(c, idx != null ? idx : (c.sessions || []).indexOf(s));
  BDEF.forEach(([k, n, ty]) => { s.bm[k] = { ab: k, name: k === 'mobi' && (!c.bm[k].name || Object.values(MOBI_MODES).includes(c.bm[k].name)) ? MOBI_MODES[s.mobiMode] : (c.bm[k].name || n), on: (k === 'einl' || k === 'schluss' || k === 'shava' || k === 'ausgl') ? partOn(c, k) : k === 'kraft' ? !!c.kraft : k === 'atem' ? c.breath !== 'aus' : k === 'mobi' ? c.mobi !== 'aus' && c.bm[k].on !== false : k === 'shakti' ? !!s.shaktiOn : k === 'mantra' ? !!(s.dur && s.dur.mantra > 0) : c.bm[k].on !== false, type: ty, min: EXKEYS.includes(k) ? B[k] : undefined }; });
  s.bmCustom = false;
}
function syncHaupt(s) { s.dur.haupt = exKeys(s).reduce((a, k) => a + (bon(s, k) ? (+s.bm[k].min || 0) : 0), 0); }
function blockTargets(c, s) {
  if (!s.bm) initBM(c, s);
  const B = { kraftN: c.kraft && bon(s, 'asana') ? (s.kN != null ? s.kN : (c.kraftN || 1)) : 0 }; // Kraftübungen stehen innerhalb des Blocks „Asanas (Hauptteil)“
  exKeys(s).forEach(k => { B[k] = bon(s, k) ? (+s.bm[k].min || 0) : 0; });
  return B;
}
// ---------- Termine ----------
function parseDate(str) {
  str = (str || '').trim();
  let m = str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
  if (m) { const y = +m[3] < 100 ? 2000 + +m[3] : +m[3]; return new Date(Date.UTC(y, +m[2] - 1, +m[1])); }
  m = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null;
}
const isoDate = d => d.toISOString().slice(0, 10);
const WDAY = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const fmtDateW = iso => { const d = parseDate(iso); return d ? WDAY[d.getUTCDay()] + ' ' + fmtDate(iso) : ''; };
const fmtDateS = iso => { const d = parseDate(iso); return d ? WDAY[d.getUTCDay()] + ' ' + fmtDate(iso).slice(0, 6) : ''; };
function fmtDate(iso) { const d = parseDate(iso); return d ? `${String(d.getUTCDate()).padStart(2, '0')}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${d.getUTCFullYear()}` : ''; }
function parsePauses(text) {
  return (text || '').split(/[\n;,]+/).map(x => x.trim()).filter(Boolean).map(x => {
    const p = x.split(/\s+bis\s+/i), a = parseDate(p[0]), b = p[1] ? parseDate(p[1]) : a;
    return a && b ? [a, b] : null;
  }).filter(Boolean);
}
function calcDates(c) {
  const start = parseDate(c.start); if (!start) return;
  const pauses = parsePauses(c.pauses), inP = d => pauses.some(([a, b]) => d >= a && d <= b);
  const n = c.sessions.length, rh = c.rhythm || 'weekly', dates = []; let d = new Date(start), guard = 0;
  if (rh === 'days') {
    const days = c.days && c.days.length ? c.days : [start.getUTCDay()];
    while (dates.length < n && guard++ < 3000) { if (days.includes(d.getUTCDay()) && !inP(d)) dates.push(new Date(d)); d = new Date(d.getTime() + 864e5); }
  } else {
    const step = rh === 'biweekly' ? 14 : 7;
    while (dates.length < n && guard++ < 3000) { if (!inP(d)) dates.push(new Date(d)); d = new Date(d.getTime() + step * 864e5); }
  }
  c.sessions.forEach((s, i) => { if (dates[i]) s.date = isoDate(dates[i]); });
}

// ---------- Mottos ----------
const themeById = id => THEMES.find(t => t.id === id) || null;
function findTheme(text) {
  const n = norm(text); if (n.length < 3) return null;
  return THEMES.find(t => norm(t.t) === n || t.id === n) || THEMES.find(t => norm(t.t).includes(n) || n.includes(norm(t.t))) || null;
}
function keywordTags(text) {
  const n = (text || '').toLowerCase(), out = [];
  Object.keys(KEYWORDS).forEach(k => { if (KEYWORDS[k].some(w => n.includes(w))) out.push(k); });
  return out.length ? out : ['mobi', 'atem', 'ruhe'];
}
const TAGFOCUS = {
  kraft: 'Kraft in Beinen, Gesäß und Rumpf', balance: 'Gleichgewicht und Koordination', ruhe: 'Entspannung, Nacken und Schultern', atem: 'Atem und Brustkorb',
  herz: 'Brustkorb, Schultern, Herzöffnung', loslassen: 'Loslassen von Spannung, Wirbelsäule', wurzel: 'Füße, Beine, Standfestigkeit', licht: 'Aufrichtung und Brustöffnung',
  energie: 'Aktivierung und Kreislauf', dankbarkeit: 'Ganzkörperbewegung und Herzöffnung', huefte: 'Hüftbeweglichkeit', schulter: 'Schultern und Nacken',
  ruecken: 'Rücken und Aufrichtung', mobi: 'sanfte Gelenkmobilisation'
};
const focusFromTags = tags => tags.slice(0, 3).map(t => TAGFOCUS[t]).filter(Boolean).join(', ');
function mottoFromTheme(t) { return { themeId: t.id, title: t.t, kern: t.k, focus: t.f, tags: [] }; }
function mottoFromText(text) {
  const parts = text.split('|').map(x => x.trim()), title = parts[0];
  const t = findTheme(title);
  if (t && !parts[1]) return mottoFromTheme(t);
  const tags = keywordTags(title);
  return { themeId: t ? t.id : '', title, kern: parts[1] || `Heute darf „${title}“ für mich spürbar werden.`, focus: t ? t.f : focusFromTags(tags), tags: t ? [] : tags };
}
function arcIds(ids, n) {
  if (n <= ids.length) {
    if (n === 1) return [ids[0]];
    return Array.from({ length: n }, (_, i) => ids[Math.round(i * (ids.length - 1) / (n - 1))]);
  }
  const rest = THEMES.map(t => t.id).filter(i => !ids.includes(i));
  return ids.concat(rest).slice(0, n);
}
function presetFromText(text) {
  const n = (text || '').toLowerCase();
  if (/herbst|winter|advent/.test(n)) return 'herbstwinter';
  if (/frühling|fruehling|erwach/.test(n)) return 'fruehling';
  if (/sommer|sonne/.test(n)) return 'sommer';
  if (/körper|koerper|beweg/.test(n)) return 'koerper';
  return 'alltag';
}
function assignMottos(c, n) {
  const m = c.motto, r = rng(c.seed || 1);
  const auto = () => {
    const seasonal = ['fuelle', 'loslassen', 'freude', 'stille', 'licht', 'erwachen', 'sonne', 'genuss'];
    const mid = THEMES.map(t => t.id).filter(i => i !== 'ankommen' && i !== 'dankbarkeit' && !seasonal.includes(i));
    for (let i = mid.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [mid[i], mid[j]] = [mid[j], mid[i]]; }
    return ['ankommen'].concat(mid.slice(0, Math.max(0, n - 2)), n > 1 ? ['dankbarkeit'] : []).slice(0, n).map(i => mottoFromTheme(themeById(i)));
  };
  if (m.mode === 'eigen') {
    const lines = (m.eigen || '').split('\n').map(x => x.trim()).filter(Boolean), fb = auto();
    return Array.from({ length: n }, (_, i) => lines[i] ? mottoFromText(lines[i]) : fb[i]);
  }
  if (m.mode === 'uebermotto') {
    const pid = m.preset === 'frei' ? presetFromText(m.free) : m.preset;
    return arcIds(PRESETS[pid].l, n).map(i => mottoFromTheme(themeById(i)));
  }
  return auto();
}
function sessionTags(s) {
  const t = themeById(s.motto.themeId);
  return (t ? t.g : []).concat(s.motto.tags || []);
}

// ---------- Reihenfolge (nahtlose Übergänge) ----------
// Ideale Abfolge: Sitz → Stand (eng → Vorbeuge → weit → Ausfall → Balance) → Boden (Vierfüßler → Bauchlage → Sitz → Rückenlage)
const SEQ = [
  'fuss_reiben', 'fuss_flex', 'fussgelenk', 'knie_flex', 'knie_kreise', 'bein_anwinkeln', 'huefte_kreis', 'schmetterling_sitz', 'haende_flex', 'handgelenk_kreis', 'finger_faust', 'ellenbogen', 'schulter_kreis', 'nacken_mobi',
  'zehen_bewegen', 'fuesse_lockern', 'fersen_heben', 'fussgelenke_stand', 'knie_leicht', 'katze_kuh_stand', 'beckenkreisen', 'schultern_stand', 'seitneigung', 'seitdrehung', 'arme_einzeln', 'arme_beide', 'arme_oeffnen', 'arme_kreisen', 'arme_atem', 'knieheben_tab',
  'tadasana', 'rueckbeuge_leicht', 'halbe_vorbeuge', 'vorbeuge', 'weite_vorbeuge', 'vorbeuge_aushaengen', 'wirbel_aufrollen', 'gewichtsverlagerung', 'einbeinig_abheben', 'twist_stand', 'sonnengruss',
  'arme_zur_sonne', 'adlerarme', 'gomukhasana_arme', 'utkatasana', 'goettin', 'krieger2', 'seitwinkel', 'krieger1', 'ausfallschritt', 'ausfall_klein', 'stand_boden', 'knieheben_stand', 'tandem', 'baum', 'krieger3_unt',
  'kniebeugen', 'kniebeuge_fersen', 'aufstehen_hinsetzen', 'utkatasana_halten', 'fersen_kraft', 'beinheben_seit', 'beinheben_halt', 'einbein_knieheben', 'wand_liegestuetz',
  'katze_kuh_vier', 'vierfuessler_diag', 'kindhaltung', 'kind_breit', 'anahatasana', 'sphinx', 'kobra', 'janu', 'malasana_hoch',
  'apanasana', 'knie_kreisen_liegend', 'bein_strecken', 'bauchspannung', 'bruecke', 'bruecke_halten', 'bruecke_sanft', 'herzoeffnung_liegend', 'schmetterling_liegend', 'drehung_liegend', 'beine_wand'
];
const GRPBASE = () => ({ sit: SEQ.indexOf('nacken_mobi') + .5, stand: SEQ.indexOf('krieger1') + .5, bal: SEQ.indexOf('baum') + .5, quad: SEQ.indexOf('kindhaltung') - .5, prone: SEQ.indexOf('sphinx') - .2, fsit: SEQ.indexOf('janu') + .5, supine: SEQ.indexOf('bein_strecken') + .5, inv: SEQ.length + 1 });
const seqIdx = id => {
  const i = SEQ.indexOf(id); if (i >= 0) return i;
  const e = exById(id) || {}, B = GRPBASE();
  const g = e.g || (e.c === 'balance' ? 'bal' : e.c === 'stand' || e.c === 'flow' || e.c === 'mobi_stand' ? 'stand' : e.c === 'mobi_sitz' ? 'sit' : e.c === 'kraft' ? (onFloor(e) ? 'supine' : 'stand') : 'supine');
  return (B[g] === undefined ? 1000 : B[g]) + ((e.o || 0) % 1000) / 10000;
};
// Übungen aus eingeplanten Sequenzen (it.seq = ID des Sequenzblocks) bilden eine zusammenhängende Gruppe; it.seqPos = Anzahl Einzelübungen vor der Gruppe.
// seqLayout setzt die Gruppen an ihre Position; keepRest: Reihenfolge der übrigen Übungen und Gruppenposition aus dem aktuellen Array übernehmen (nach Drag & Drop / Verschieben)
const seqLayout = (items, keepRest) => {
  const groups = [], gm = {}, rest = [];
  items.forEach(i => {
    if (!i.seq) { rest.push(i); return; }
    let g = gm[i.seq];
    if (!g) { g = gm[i.seq] = { its: [], pos: keepRest ? rest.length : (+i.seqPos || 0), n: groups.length }; groups.push(g); }
    g.its.push(i);
  });
  if (!keepRest) {   // Textblöcke behalten ihre Position (Anzahl Übungen davor), die Übungen werden einsortiert
    const txs = []; rest.forEach((i, n) => { if (isSb(i)) txs.push([i, rest.slice(0, n).filter(x => !isSb(x)).length]); });
    const ex = rest.filter(i => !isSb(i)).sort((a, b) => seqIdx(a.id) - seqIdx(b.id));
    txs.forEach(([i, k], t) => ex.splice(Math.min(k + t, ex.length), 0, i));
    rest.splice(0, rest.length, ...ex);
  }
  groups.sort((a, b) => a.pos - b.pos || a.n - b.n);
  const out = []; let r = 0;
  groups.forEach(g => { while (r < g.pos && r < rest.length) out.push(rest[r++]); g.its.forEach(i => { i.seqPos = r; out.push(i); }); });
  while (r < rest.length) out.push(rest[r++]);
  items.splice(0, items.length, ...out); return items;
};
const sortItems = items => seqLayout(items, false);
const FLOORPOSE = ['quad_cat', 'quad_diag', 'child', 'anahatasana', 'sphinx', 'cobra', 'plank_floor', 'bridge', 'supine_knee', 'supine_bent', 'leg_stretch', 'twist_supine', 'butterfly_lying', 'legs_wall', 'heart_supine', 'janu', 'malasana'];
const onFloor = e => e && FLOORPOSE.includes(e.pose);

const SHOW_REPS = false; // Wiederholungszahlen in Oberfläche und Ausgabe ausblenden (Daten bleiben intern erhalten)
// Leichter/schwerer gilt in beide Richtungen: wer eine leichtere Variante hat, ist dort die schwerere Variante
function altE(e) { if (!e) return null; if (e.e) return exById(e.e); return exAll().find(x => x.h === e.id) || null; }
function altH(e) { if (!e) return null; if (e.h) return exById(e.h); return exAll().find(x => x.e === e.id) || null; }
// Wiederholungen / Atemzüge folgen der Dauer der Übung
function repFor(e, min) {
  if (!e || !e.c) return '';
  min = +min || e.m || 1;
  const c = e.c;
  if (c === 'mobi_sitz' || c === 'mobi_stand') return `${Math.max(2, Math.round(min * 6))}–${Math.max(3, Math.round(min * 8))} Wdh.`;
  if (c === 'stand' || c === 'boden') return `${Math.max(2, Math.round(min * 6))} Atemzüge`;
  if (c === 'balance') return `${Math.max(2, Math.round(min * 3))} Atemzüge je Seite`;
  if (c === 'kraft' && e.reps) {
    const m = e.reps.match(/^(?:(\d+) × )?(\d+)(?:–(\d+))?(.*)$/);
    if (!m) return e.reps;
    const f = min / (e.m || 3), sets = m[1] ? +m[1] : 1, ns = m[1] ? clamp(Math.round(sets * Math.sqrt(f)), 1, 5) : 1;
    const sc = v => Math.max(1, Math.round(v * f * sets / ns));
    return `${m[1] ? ns + ' × ' : ''}${sc(+m[2])}${m[3] ? '–' + sc(+m[3]) : ''}${m[4]}`;
  }
  return '';
}
const syncRep = it => { if (it.repAuto !== false) it.rep = repFor(exById(it.id), it.min); };

const DEFREP = { mobi_sitz: '6–8 Wdh.', mobi_stand: '6–8 Wdh.', flow: '', stand: '3–5 Atemzüge', balance: '3–5 Atemzüge je Seite', boden: '3–5 Atemzüge', kraft: '' };
const defRep = e => e.reps || DEFREP[e.c] || '';
const mkItem = (e, min) => { min = min == null ? e.m : min; const it = { id: e.id, min, rep: repFor(e, min), repAuto: true, both: false, altE: false, altH: false }; if (e.txt) { if (hasTx(e)) it.tx = ''; else it.ref = ''; } return it; };
// Alternativen, die in der Ausgabe erscheinen sollen (altE = leichtere, altH = schwerere; both = älteres Sammelfeld)
const effE = i => !!(i.altE || i.both), effH = i => !!(i.altH || i.both);
const normAlt = i => { if (i.both) { i.altE = true; i.altH = true; i.both = false; } };
// Standard „Alternativen mit ausgeben“ (Stunde): setzt die Alternativen aller Übungen bzw. einer neuen Übung
function applyAlt(s, only) {
  (only ? [only] : blkAll(s)).forEach(i => { const e = exById(i.id); i.both = false; i.altE = (!!s.altDef || !!i.peakAlt) && !!altE(e); i.altH = !!s.altDef && !!altH(e); });
}
// Standard 
const blkAll = s => (s.bm ? exKeys(s).filter(k => bon(s, k)) : EXKEYS).reduce((a, k) => a.concat(s.blk[k] || []), []);
const blkIds = s => blkAll(s).map(i => i.id);
const sumMin = items => items.reduce((a, i) => a + (+i.min || 0), 0);
// Optionale Übungen (it.opt): zählen voll zur Stundenzeit, werden aber zusätzlich separat ausgewiesen
const optMin = items => sumMin((items || []).filter(i => i.opt));
const sessionOptMin = s => s.bm ? exKeys(s).reduce((a, k) => a + (bon(s, k) ? optMin(s.blk[k]) : 0), 0) : 0;
const optNote = m => m > 0 ? `davon ${fmtMin(m)} Min. optional` : '';
const plannedHaupt = s => sumMin(blkAll(s));
// Kraftübungen: Anzahl im Block „Asanas (Hauptteil)“ an den Rahmen angleichen
function syncKraft(c, s) {
  if (!bon(s, 'asana') || !s.blk || !s.blk.asana) return;
  const items = s.blk.asana, want = s.kN != null ? s.kN : (c.kraft ? (c.kraftN || 1) : 0), ks = items.filter(i => !i.seq && (exById(i.id) || {}).c === 'kraft');
  while (ks.length > want) { const k = ks.pop(); items.splice(items.indexOf(k), 1); }
  if (ks.length < want) { const ctx = mkCtx(c, s, Math.random); ctx.have = new Set(blkIds(s)); pickN(poolOf('kraft'), want - ks.length, ctx).forEach(e => items.push(mkItem(e))); }
  sortItems(items);
}
// Der frühere Block „Kraftübung“ ist jetzt Teil von „Asanas (Hauptteil)“
function mergeKraft(s) {
  s.blk = s.blk || {};
  const itemsK = (s.blk.kraft || []).map(i => typeof i === 'string' ? (exById(i) ? mkItem(exById(i)) : null) : i).filter(i => i && exById(i.id)), onK = !(s.bm && s.bm.kraft && s.bm.kraft.on === false);
  if (onK) s.blk.asana = (s.blk.asana || []).concat(itemsK).sort((a, b) => seqIdx(a.id) - seqIdx(b.id));
  if (s.bm) { if (s.bm.asana && onK && s.bm.kraft) s.bm.asana.min = (+s.bm.asana.min || 0) + (+s.bm.kraft.min || 0); delete s.bm.kraft; }
  s.order = (s.order || []).filter(k => k !== 'kraft'); delete s.blk.kraft;
  [s.tx, s.txEdited, s.dur].forEach(o => { if (o) delete o.kraft; });
}
// „Aufwärmen + Flow“ und „Asanas (Stand / Balance)“ sind jetzt ein Block „Asanas (Hauptteil)“
function mergeAufw(s) {
  s.blk = s.blk || {};
  const itemsA = (s.blk.aufw || []).map(i => typeof i === 'string' ? (exById(i) ? mkItem(exById(i)) : null) : i).filter(i => i && exById(i.id)), onA = !(s.bm && s.bm.aufw && s.bm.aufw.on === false);
  if (onA) s.blk.asana = (s.blk.asana || []).concat(itemsA).sort((a, b) => seqIdx(a.id) - seqIdx(b.id));
  if (s.bm) { if (s.bm.asana && onA && s.bm.aufw) s.bm.asana.min = (+s.bm.asana.min || 0) + (+s.bm.aufw.min || 0); delete s.bm.aufw; }
  s.order = (s.order || []).filter(k => k !== 'aufw'); delete s.blk.aufw;
  [s.tx, s.txEdited, s.dur].forEach(o => { if (o) delete o.aufw; });
}
function normalizeState() {
  if (typeof seqMigrate === 'function') seqMigrate();
  if (typeof seqImportMerge === 'function') seqImportMerge();
  (state.courses || []).forEach(c => (c.sessions || []).forEach(s => {
    if ((s.order || []).includes('aufw') || (s.bm && s.bm.aufw) || (s.blk && s.blk.aufw)) mergeAufw(s);
    if ((s.order || []).includes('kraft') || (s.bm && s.bm.kraft) || (s.blk && s.blk.kraft)) mergeKraft(s);
    if (s.bm && s.bm.asana && /^Asanas \(Stand \/ Balance\)$/.test(s.bm.asana.name || '')) s.bm.asana.name = 'Asanas (Hauptteil)';
    Object.keys(s.blk).concat(EXKEYS.filter(k => !(k in s.blk))).forEach(k => {
      s.blk[k] = (s.blk[k] || []).map(i => typeof i === 'string' ? (exById(i) ? mkItem(exById(i)) : null) : i).filter(i => i && exById(i.id));
    });
    s.status = STATUS_MIGRATE[s.status] || s.status || 'vorgeplant';
    const okB = (id, k) => BR.some(b => b.id === id && b.k === k);
    const atemOff = c.breath === 'aus' || (s.bm && s.bm.atem && s.bm.atem.on === false);
    if (!atemOff && !okB(s.atem.a, 'atem')) s.atem.a = 'bauchatmung';
    if (s.atem.w && !okB(s.atem.w, 'wahr')) s.atem.w = 'bodenkontakt';
    if (!s.bm) { initBM(c, s); s.bmCustom = false; }
    if (!s.order) s.order = BDEF.map(b => b[0]);
    s.dur = s.dur || {}; if (s.dur.mantra == null) s.dur.mantra = MANTRA_MIN;
    if (s.bm && !s.bm.mantra) s.bm.mantra = { ab: 'mantra', name: 'Mantra', on: false, type: 'mantra' };
    if (s.bm && !s.bm.shakti) s.bm.shakti = { ab: 'shakti', name: 'Shakti Naam', on: false, type: 'ex', min: 0 };
    if (!s.order.includes('shakti')) s.order.splice(Math.max(0, s.order.indexOf('mobi') + 1), 0, 'shakti');
    if (!s.order.includes('mantra')) s.order.splice(Math.max(0, s.order.indexOf('atem') + 1), 0, 'mantra');
    s.tx = s.tx || {}; if (s.tx.mantra == null) s.tx.mantra = '';
    BDEF.forEach(([k, n, ty]) => { if (s.bm[k] && !s.bm[k].type) s.bm[k].type = ty; });
    Object.keys(s.bm).forEach(k => { if (!s.bm[k].ab) s.bm[k].ab = isCustomKey(k) ? 'asana' : k; });
  }));
  (state.courses || []).forEach(c => { if (c.bm) { delete c.bm.aufw; delete c.bm.kraft; if (c.bm.asana && /^Asanas \(Stand \/ Balance\)$/.test(c.bm.asana.name || '')) c.bm.asana.name = 'Asanas (Hauptteil)'; } c.status = STATUS_MIGRATE[c.status] || c.status || 'vorgeplant'; if (c.durMode !== 'einzeln' || !c.durs) c.durs = splitTotal(c.total || 75); c.durMode = 'einzeln'; c.kraftN = c.kraft ? Math.min(3, Math.max(1, +c.kraftN || 1)) : 0; c.kraft = c.kraftN > 0;
    if (c.durs.kraft == null || c.durs.mantra == null) { // Altbestand: Kraft-/Mantra-Zeit war im Hauptteil enthalten
      c.durs.mantra = 5; c.durs.kraft = c.kraftN * 3 || 3;
      if (c.kraft) c.durs.haupt = Math.max(5, c.durs.haupt - c.durs.kraft);
      c.total = (+c.total || 0) || 75;
    }
    if (c.durs.shakti == null) c.durs.shakti = 8; c.shakti = c.shakti ? 1 : 0; c.shaktiMode = c.shakti ? (c.shaktiMode && c.shaktiMode !== 'aus' ? c.shaktiMode : 'immer') : 'aus'; c.kraftRnd = c.kraft && c.kraftRnd ? 1 : 0; ['einl', 'schluss', 'shava', 'ausgl'].forEach(k => { c[k + 'On'] = c[k + 'On'] === 0 ? 0 : 1; }); c.mobi = c.mobi || 'sitz'; c.mantra = c.mantra || 'aus';
    fitDurs(c, 'norm'); c.st = c.st || []; c.reg = c.reg || []; courseBM(c); if (c.altDef === undefined) c.altDef = !!c.bothAll; });
}

// ---------- Übungsauswahl ----------
function scoreEx(e, ctx) {
  let sc = 0;
  e.t.forEach(g => { if (ctx.tags.includes(g)) sc += 6; });
  // Rahmen: Yogastil / Körperregion werden bevorzugt (nicht ausgeschlossen)
  const p = ctx.pre;
  if (p) { if ((p.st || []).length && p.st.some(x => (e.st || []).includes(x))) sc += 30; if ((p.reg || []).length && e.kat && e.kat.reg) sc += 24 * Math.min(2, p.reg.filter(x => e.kat.reg.includes(x)).length); }
  sc += (rating(e.id) - 3) * 4 + levelBonus(e, ctx.lvl) - (ctx.used[e.id] || 0) * 4 + ctx.rand() * 5;
  return sc;
}
// Filter der Einzelstunde: überschreibt Vorfilter des Rahmens (Gruppe, Einschränkungen) und schränkt nach Kategorien/Stilen ein. Wirkt nur auf NEUE Übungsauswahl.
const FLT_KATS = ['reg', 'mus', 'atm', 'auf', 'sup', 'mat', 'pos', 'dir', 'wirk', 'en', 'chakra', 'ziel'];
const fltDefault = () => ({ override: false, level: '', geb: [], kat: {}, st: [], allowBanned: false, allowMan: false });
const effLevel = (c, s) => (s && s.flt && s.flt.override && s.flt.level) ? s.flt.level : c.level;
const effGeb = (c, s) => (s && s.flt && s.flt.override) ? (s.flt.geb || []) : (c.gebrechen || []);
function fltActive(s) {
  const f = s && s.flt; if (!f) return null;
  const any = f.override || f.allowBanned || f.allowMan || (f.st || []).length || FLT_KATS.some(k => ((f.kat || {})[k] || []).length);
  return any ? f : null;
}
function mkCtx(c, s, rand) { return { sess: s, tags: sessionTags(s), used: usedMap(c, s.id), rand, lvl: effLevel(c, s), geb: effGeb(c, s), flt: fltActive(s), pre: { st: c.st || [], reg: c.reg || [] } }; }
function katOk(e, f) {
  if (!f || e.k === 'atem' || e.k === 'wahr') return true;
  const k = e.kat, sel = d => (f.kat && f.kat[d]) || [];
  for (const d of FLT_KATS) {
    const s = sel(d); if (!s.length) continue;
    if (!k) return false;
    const v = k[d]; if (!(Array.isArray(v) ? s.some(x => v.includes(x)) : s.includes(v))) return false;
  }
  if ((f.st || []).length && !f.st.some(x => (e.st || []).includes(x))) return false;
  return true;
}
function preOk(e, p) {
  if (!p || e.k === 'atem' || e.k === 'wahr') return true;
  if ((p.st || []).length && !p.st.some(x => (e.st || []).includes(x))) return false;
  if ((p.reg || []).length && !p.reg.some(x => ((e.kat && e.kat.reg) || []).includes(x))) return false;
  return true;
}
function eligible(pool, ctx) {
  const f = ctx.flt;
  return pool.filter(e => levelOk(e, ctx.lvl) && !contra(e, ctx.geb) && (rating(e.id) > 0 || (f && f.allowBanned)) && (!e.man || (f && f.allowMan)) && !(ctx.have && ctx.have.has(e.id)) && katOk(e, f));
}
const FALLBACK = { mobi: [], aufw: ['stand', 'balance'], asana: ['flow', 'mobi_stand'], ausgl: [] }; // wenn der Pool (z. B. wegen Gebrechen) zu klein ist
function pickFrom(pool, budget, ctx, force) {
  const ok = eligible(pool, ctx), res = []; let t = 0;
  (force || []).forEach(id => { const e = ok.find(x => x.id === id); if (e && !res.includes(e)) { res.push(e); t += e.m; } });
  const sc = ok.filter(e => !res.includes(e)).map(e => ({ e, s: scoreEx(e, ctx) })).sort((a, b) => b.s - a.s);
  for (const { e } of sc) {
    if (t >= budget - 0.4) break;
    if (t + e.m <= budget + 0.6) { res.push(e); t += e.m; }
  }
  // Feinabgleich: Standardzeiten bleiben unverändert – durch Tausch einzelner Übungen näher an das Zeitbudget kommen
  for (let pass = 0; pass < 3 && Math.abs(t - budget) > 0.25; pass++) {
    let best = null;
    res.forEach((it, i) => { if (force && force.includes(it.id)) return; sc.forEach(({ e }) => {
      if (res.includes(e)) return; const nt = t - it.m + e.m;
      if (Math.abs(nt - budget) + 0.01 < Math.abs(t - budget) && (!best || Math.abs(nt - budget) < best.d)) best = { i, e, nt, d: Math.abs(nt - budget) };
    }); });
    if (!best) break; res[best.i] = best.e; t = best.nt;
  }
  return res.sort((a, b) => seqIdx(a.id) - seqIdx(b.id));
}
function pickN(pool, n, ctx) {
  return eligible(pool, ctx).map(e => ({ e, s: scoreEx(e, ctx) })).sort((a, b) => b.s - a.s).slice(0, n).map(x => x.e).sort((a, b) => seqIdx(a.id) - seqIdx(b.id));
}
const poolOf = (...cats) => exAll().filter(e => cats.includes(e.c));
const half = v => Math.round(v * 2) / 2;
function blockBudgets(c, H, noShakti) {
  if (c.durs && c.durs.asana != null) { // Zeiten der einzelnen Hauptteil-Blöcke stehen im Rahmen
    const kn0 = c.kraft ? (c.kraftN || 1) : 0, sb0 = c.shakti && !noShakti ? Math.max(2, Math.min(H - 12, +c.durs.shakti || 8)) : 0, rest0 = Math.max(H - sb0, 10);
    const w = { mobi: c.mobi === 'aus' ? 0 : (+c.durs.mobi || 6), ausgl: partOn(c, 'ausgl') ? (+c.durs.ausgl || 6) : 0, asana: +c.durs.asana || 10 }, tot0 = (w.mobi + w.ausgl + w.asana) || 1;
    const B0 = { mobi: half(rest0 * w.mobi / tot0), aufw: 0, ausgl: half(rest0 * w.ausgl / tot0), kraft: kn0 ? Math.min(rest0 - 5, +c.durs.kraft || kn0 * 3) : 0, kraftN: kn0, shakti: sb0 };
    B0.asana = Math.max(2, rest0 - B0.mobi - B0.ausgl); return B0;
  }
  const kn = c.kraft ? (c.kraftN || 1) : 0, kb = kn ? Math.min(H - 5, (c.durs && +c.durs.kraft) || kn * 3) : 0, sb = c.shakti && !noShakti ? Math.max(2, Math.min(H - 12, (c.durs && +c.durs.shakti) || 8)) : 0, rest = Math.max(H - kb - sb, 10);
  const P = c.mobi === 'aus' ? { mobi: 0, aufw: 0, ausgl: .26 } : c.kraft ? { mobi: .26, aufw: 0, ausgl: .22 } : { mobi: .24, aufw: 0, ausgl: .22 };
  const B = { mobi: half(rest * P.mobi), aufw: 0, ausgl: half(rest * P.ausgl), kraft: kb, kraftN: kn, shakti: sb };
  B.asana = Math.max(2, H - B.mobi - B.aufw - B.ausgl - B.shakti); // enthält die Zeit der Kraftübungen
  return B;
}
// Minuten der Übungen proportional auf ein Zeitbudget skalieren (auf halbe Minuten gerundet)
function fitItems(all, budget) {
  const items = all.filter(i => !i.seq && !isSb(i)); budget = half(budget) - sumMin(all.filter(i => i.seq || isSb(i))); const tot = sumMin(items);
  if (!items.length || budget <= 0 || !tot) return;
  const f = budget / tot, mx = i => Math.max(1, ((exById(i.id) || {}).m || 1) * 3);
  items.forEach(i => { i.min = clamp(half(i.min * f), 0.5, mx(i)); });
  let d = budget - sumMin(items), k = 0, g = 0;
  while (Math.abs(d) >= 0.25 && g++ < 300) {
    const it = items[k++ % items.length], nm = it.min + (d > 0 ? .5 : -.5);
    if (nm >= .5 && nm <= mx(it)) { it.min = nm; d = budget - sumMin(items); }
  }
  items.forEach(syncRep);
}
function fitSession(c, s) {
  const B = blockTargets(c, s);
  exKeys(s).forEach(k => { if ((s.blk[k] || []).length && B[k] > 0) fitItems(s.blk[k], B[k]); });
}
function usedMap(c, exceptSid) {
  const u = {};
  c.sessions.forEach(s => {
    if (s.id === exceptSid || !s.blk) return;
    blkIds(s).concat([s.atem.a, s.atem.w]).filter(Boolean).forEach(id => { u[id] = (u[id] || 0) + 1; });
  });
  return u;
}
function pickBreath(ctx, kind) {
  const ok = eligible(BR.filter(b => b.k === kind), ctx);
  ok.forEach(b => { b._s = scoreEx(b, ctx); });
  ok.sort((a, b) => b._s - a._s);
  return ok.length ? ok[0].id : '';
}
// Rahmen-Vorgaben (Yogastil / Körperregion): passende Übungen aus ALLEN Kategorien in den Blockpool aufnehmen, sofern sie zur Position des Blocks passen
function prefMatch(e, p) {
  const st = p.st || [], rg = p.reg || [];
  if (!st.length && !rg.length) return false;
  return (!st.length || st.some(x => (e.st || []).includes(x))) && (!rg.length || rg.some(x => ((e.kat && e.kat.reg) || []).includes(x)));
}
const AB_POS = { mobi: ['sitzen', 'liegen', 'knien'], aufw: ['stehen', 'knien'], asana: ['stehen', 'balance', 'knien', 'sitzen', 'liegen', 'umkehr', 'stuetz'], ausgl: ['sitzen', 'liegen', 'knien', 'umkehr'] };
function withPref(pool, ab, ctx) {
  const p = ctx && ctx.pre; if (!p || !AB_POS[ab]) return pool;
  const have = new Set(pool.map(e => e.id));
  const extra = exAll().filter(e => !have.has(e.id) && e.c !== 'kraft' && prefMatch(e, p) && ((e.kat && e.kat.pos) || []).some(x => AB_POS[ab].includes(x)));
  return pool.concat(extra);
}
// Gipfelposition (Peak Pose) je Stunde: eine ★-Übung aus dem Skript. Außer bei Fortgeschrittenen nur Peaks mit einfacherer Alternative (Alternative muss zur Gruppe passen) – die Alternative wird mit ausgegeben.
function pickPeak(ctx) {
  const lvl = ctx.lvl, fort = lvl === 'fort';
  const cand = exAll().filter(e => e.peak && e.c !== 'kraft' && rating(e.id) > 0 && !contra(e, ctx.geb) && !(ctx.have && ctx.have.has(e.id)) && (fort || (() => { const a = altE(e); return a && !a.peak && levelOk(a, lvl); })()));
  if (!cand.length) return null;
  const sc = e => scoreEx(e, ctx) - (ctx.used[e.id] || 0) * 8 + ((ctx.pre && prefMatch(e, ctx.pre)) ? 20 : 0);
  return cand.map(e => ({ e, s: sc(e) })).sort((a, b) => b.s - a.s)[0].e;
}
function pickBlock(c, key, ctx, B) {
  const s = ctx.sess, ab = s ? abOf(s, key) : key;
  const it = es => es.map(e => mkItem(e));
  let items;
  if (ab !== 'kraft' && !(B[key] > 0)) return [];
  if (ab === 'mobi') items = it(pickFrom(withPref(mobiPool(s), ab, ctx), B[key], ctx));
  else if (ab === 'shakti') items = it(pickFrom(poolOf('shakti'), B[key], ctx));
  else if (ab === 'aufw') items = it(pickFrom(withPref(poolOf('mobi_stand', 'flow'), ab, ctx), B[key], ctx, ['tadasana']));
  else if (ab === 'asana') {
    const pk = key === 'asana' ? pickPeak(ctx) : null;
    const kraftIt = key === 'asana' && B.kraftN > 0 ? it(pickN(poolOf('kraft'), B.kraftN, ctx)) : [];
    kraftIt.forEach(i => ctx.have && ctx.have.add(i.id));
    items = it(pickFrom(withPref(poolOf('mobi_stand', 'flow', 'stand', 'balance'), ab, ctx), B[key] - sumMin(kraftIt) - (pk ? pk.m : 0), ctx, key === 'asana' ? ['tadasana'] : undefined));
    items = items.concat(kraftIt).sort((a, b) => seqIdx(a.id) - seqIdx(b.id));
    if (pk) { const pi = mkItem(pk); if (ctx.lvl !== 'fort') pi.peakAlt = true; items.push(pi); ctx.have && ctx.have.add(pk.id); }
  }
  else if (ab === 'kraft') {
    const n = key === 'kraft' ? B.kraftN : Math.max(1, Math.round((B[key] || 3) / 3));
    return n ? it(pickN(poolOf('kraft'), n, ctx)) : [];
  }
  else if (ab === 'ausgl') items = it(pickFrom(withPref(poolOf('boden'), ab, ctx), B[key], ctx));
  else items = it(pickFrom(poolOf(...Object.keys(CATS)), B[key], ctx)); // Ablaufart ohne eigenen Pool: alle Kategorien
  const fb = FALLBACK[ab] || [], short = B[key] - sumMin(items);
  if (short > 1.5 && fb.length) {
    items.forEach(i => ctx.have && ctx.have.add(i.id));
    items = items.concat(it(pickFrom(poolOf(...fb), short, ctx))).sort((a, b) => seqIdx(a.id) - seqIdx(b.id));
  }
  return items;
}
function fillExercises(c, s, idx) {
  const r = rng(s.seed), ctx = mkCtx(c, s, r);
  const B = blockTargets(c, s);
  const old = s.blk || {}; s.blk = {}; ctx.have = new Set();
  Object.keys(old).forEach(k => { if (isCustomKey(k)) s.blk[k] = old[k]; });
  EXKEYS.forEach(k => { s.blk[k] = bty(s, k) === 'ex' ? pickBlock(c, k, ctx, B) : []; s.blk[k].forEach(i => ctx.have.add(i.id)); });
  if (c.breath === 'aus' || !bon(s, 'atem')) { s.atem = { a: '', w: '' }; return; }
  const wahr = c.breath === 'atem_wahr' || (c.breath === 'gemischt' && idx % 2 === 1) || (c.breath === 'zufall' && r() < 0.5);
  const a = pickBreath(ctx, 'atem');
  ctx.used[a] = 1;
  s.atem = { a, w: wahr ? pickBreath(ctx, 'wahr') : '' };
}
// Dauer eines Übungsblocks geändert → Anzahl der Übungen anpassen (weitere passende Übungen ergänzen oder letzte entfernen), Minuten angleichen
function rebalanceBlock(c, s, k) {
  if (bty(s, k) !== 'ex' || !bon(s, k)) return;
  const T = +(s.bm[k].min) || 0, items = s.blk[k] || (s.blk[k] = []);
  if (T <= 0) { s.blk[k] = []; return; }
  const ctx = mkCtx(c, s, Math.random); ctx.have = new Set(blkIds(s));
  const isK = i => (exById(i.id) || {}).c === 'kraft', main = abOf(s, k) === 'asana';
  const pool = poolFor(s, k).concat(FALLBACK[abOf(s, k)] ? poolOf(...FALLBACK[abOf(s, k)]) : []).filter(e => !(main && e.c === 'kraft'));
  // Sequenz-Übungen werden nie entfernt; im Hauptblock gehen zuerst Nicht-Kraftübungen vom Ende
  const pickIdx = () => { for (let i = items.length - 1; i >= 0; i--) if (!items[i].seq && !isSb(items[i]) && !(main && isK(items[i]))) return i; for (let i = items.length - 1; i >= 0; i--) if (!items[i].seq && !isSb(items[i])) return i; return -1; };
  const popOne = () => { const i = pickIdx(); if (i < 0) return false; items.splice(i, 1); return true; };
  const addBest = () => {
    const best = eligible(pool, ctx).map(e => ({ e, sc: scoreEx(e, ctx) })).sort((a, b) => b.sc - a.sc)[0];
    if (!best) return false;
    const it = mkItem(best.e); applyAlt(s, it); items.push(it); ctx.have.add(best.e.id); return true;
  };
  // Die Standardzeit jeder Übung bleibt unverändert – nur die ANZAHL der Übungen folgt der Blockzeit
  const tot = sumMin(items); let g = 0;
  if (items.length && tot > 0) {
    const target = Math.max(1, Math.round(items.length * T / tot));   // Verhältnis der Zeitänderung (Durchschnittszeit je Übung)
    while (items.length > target && popOne());
    while (items.length < target && g++ < 40) if (!addBest()) break;
  }
  g = 0; while (sumMin(items) < T - 0.75 && g++ < 40) if (!addBest()) break;        // fein: näher an die Zielzeit
  g = 0; while (items.length > 1 && g++ < 40) { const i = pickIdx(); if (i < 0 || sumMin(items) - items[i].min < T - 0.25) break; items.splice(i, 1); }
  sortItems(items);
}function rerollBlock(c, s, key) {
  const ctx = mkCtx(c, s, rng(Math.floor(Math.random() * 1e9)));
  Object.keys(s.blk).forEach(k => s.blk[k].forEach(i => { ctx.used[i.id] = (ctx.used[i.id] || 0) + (k === key ? 3 : 1); }));
  ctx.have = new Set(); Object.keys(s.blk).forEach(k => { if (k !== key) s.blk[k].forEach(i => ctx.have.add(i.id)); });
  const B = blockTargets(c, s);
  if (key === 'kraft') { B.kraftN = Math.max(1, s.blk.kraft.length || c.kraftN || 1); B.kraft = B.kraft || B.kraftN * 3; }
  else if (!(B[key] > 0)) B[key] = blockBudgets(c, +s.dur.haupt || 45)[key] || 5;
  const keepTx = (s.blk[key] || []).map((i, n) => [i, n]).filter(([i]) => isSb(i));
  s.blk[key] = pickBlock(c, key, ctx, B);
  keepTx.forEach(([i, n]) => s.blk[key].splice(Math.min(n, s.blk[key].length), 0, i));
  applySeqPlan(c, s, key);
}

// ---------- Texte (Länge richtet sich nach der Dauer des Teils) ----------
const WPM = { einl: 38, atem: 30, mantra: 22, schluss: 38, shava: 26 }; // Wörter pro Minute (ruhiges Sprechtempo mit Pausen)
const wc = t => (String(t).match(/\S+/g) || []).length;
function fitSegs(segs, target) {
  const order = segs.map((s, i) => ({ p: s.p, w: wc(s.t), i })).sort((a, b) => a.p - b.p || a.i - b.i);
  let tot = 0; const keep = new Set();
  order.forEach(s => { if (s.p === 0 || tot + s.w <= target * 1.12) { keep.add(s.i); tot += s.w; } });
  return segs.filter((s, i) => keep.has(i)).map(s => s.t).join('\n\n');
}
function mottoText(s) {
  const t = themeById(s.motto.themeId), M = s.motto;
  if (t) return { e: t.e, b: t.b, s: t.s };
  return {
    e: `Unsere Stunde steht heute unter dem Motto „${M.title}“. Vielleicht magst du beim Üben immer wieder spüren, was dieses Motto für dich bedeutet – in deinem Körper, in deinem Atem und in deinem Alltag.`,
    b: `Stell dir vor, „${M.title}“ hat eine Farbe, eine Temperatur und einen Platz in deinem Körper. Lass dieses Gefühl mit jedem Atemzug ein wenig größer und weicher werden.`,
    s: `Ich nehme das Motto „${M.title}“ als kleinen Gedanken mit in den Tag.`
  };
}
function txEinl(c, s, idx, m) {
  const r = rng(s.seed + 11 + (s.txv || 0) * 101), mt = mottoText(s), nr = idx + 1, n = c.sessions.length;
  const open = nr === 1 ? 'Herzlich willkommen zu unserer ersten gemeinsamen Yogastunde.' : nr === n ? 'Herzlich willkommen zu unserer letzten gemeinsamen Yogastunde in diesem Programm.'
    : rpick(['Schön, dass du da bist.', 'Herzlich willkommen zu unserer heutigen Stunde.', 'Schön, dass wir wieder gemeinsam üben.'], r);
  const nothing = rpick(['Du musst heute nichts leisten und nichts erreichen. Wir nehmen uns Zeit, den Körper wahrzunehmen, ihn sanft zu bewegen und wieder ein Gefühl für unsere eigene Mitte zu bekommen.',
    'Es gibt heute nichts, was du können oder schaffen musst. Wir üben in deinem Tempo und nur so weit, wie es sich gut anfühlt.'], r);
  return fitSegs([
    { p: 0, t: open }, { p: 1, t: mt.e }, { p: 2, t: nothing },
    { p: 3, t: 'Spür zunächst, welche Körperteile Kontakt mit dem Boden haben. Nimm ganz bewusst wahr, dass der Boden dich trägt.' },
    { p: 9, t: 'Spüre in deinen Rücken hinein: Wo liegt er auf, wo ist Raum zwischen Rücken und Boden? Du musst nichts verändern – nur wahrnehmen.' },
    { p: 7, t: 'Lass deine Schultern weich werden und spüre, wie sich dein Brustkorb mit jedem Atemzug sanft hebt und senkt.' },
    { p: 8, t: 'Wenn du magst, schließe die Augen oder richte deinen Blick weich auf einen Punkt vor dir. Lass Augen, Stirn und Kiefer locker werden.' },
    { p: 10, t: 'Nimm drei bewusste, tiefe Atemzüge: Atme durch die Nase ein … und mit einem hörbaren Seufzer wieder aus. Lass mit jeder Ausatmung ein Stück Anspannung los.' },
    { p: 4, t: 'Nimm dir einen Moment, um wahrzunehmen, wie du heute hier ankommst: Wie fühlt sich dein Körper an? Wie dein Atem? Wie dein Geist? Du musst nichts verändern – nur bemerken.' },
    { p: 5, t: 'Du darfst alles so annehmen, wie es gerade ist: Müdigkeit, Unruhe, Vorfreude oder einfach gar nichts Besonderes.' },
    { p: 6, t: 'Wenn Gedanken kommen, lass sie vorüberziehen wie Wolken. Kehre immer wieder zum Spüren zurück – zu den Füßen, zum Atem, zum Kontakt mit dem Boden.' },
    { p: 11, t: 'Vielleicht möchtest du dir für diese Stunde eine kleine Absicht setzen – ein Wort oder ein Gefühl, das dich beim Üben begleitet.' },
    { p: 12, t: 'Dein Körper weiß, was er braucht. Höre in dich hinein und gehe freundlich und achtsam mit dir um. Ein Zuviel ist nie nötig.' },
    { p: 13, t: 'Verweile noch einen Moment in dieser Ruhe, bevor wir uns gleich sanft in Bewegung bringen.\n…' },
    { p: 0, t: `Unser Motto heute: „${s.motto.title}“ – ${s.motto.kern}` }
  ], (m == null ? s.dur.einl : m) * WPM.einl);
}
// Dauer, auf die ein Anleitungstext zugeschnitten wird: eigene Vorgabe (s.txd) oder – Standard – die Zeit des Blocks aus dem Rahmen
const txDur = (s, k) => { const o = s.txd && +s.txd[k]; return o > 0 ? o : (+(s.dur && s.dur[k]) || 0); };
function atemMin(s) { const T = txDur(s, 'atem'); return s.atem.w ? [Math.max(2, Math.round(T * .55)), Math.max(2, T - Math.round(T * .55))] : [T, 0]; }
function txAtem(c, s) {
  const a = BR.find(b => b.id === s.atem.a), w = BR.find(b => b.id === s.atem.w), mm = atemMin(s);
  if (!a) return '';
  const part = (b, m, label) => {
    const n = Math.max(3, Math.round(m * 60 / 10));
    const segs = (w ? [{ p: 0, t: `${label}: „${b.n}“ (${m} Minuten)` }] : [])
      .concat(b.txt.split('\n').map((l, i) => ({ p: i === 0 ? 0 : 1 + i * 0.1, t: l })),
        [{ p: 2, t: `Übe etwa ${m} Minuten in deinem eigenen Rhythmus – als Richtwert ungefähr ${n} Atemzüge.` },
        { p: 7, t: 'Beobachte, wie sich Brustkorb und Bauch während der Übung bewegen, ohne etwas zu bewerten.' },
        { p: 8, t: 'Achte darauf, dass Schultern und Kiefer locker bleiben und dein Gesicht weich ist.' },
        { p: 9, t: 'Bleibe mit deiner Aufmerksamkeit bei der Übung. Jedes Mal, wenn du abschweifst und zurückkehrst, übst du Achtsamkeit.' },
        { p: 10, t: 'Wenn dir schwindelig wird oder es unangenehm ist, kehre sofort zu deinem natürlichen Atem zurück und ruhe dich aus.' },
        { p: 4, t: 'Wenn Gedanken abschweifen, ist das in Ordnung. Kehre freundlich zum Atem zurück.' },
        { p: 5, t: 'Spüre zwischendurch kurz nach: Was verändert sich in dir? Wo wird es weicher, wo weiter?' },
        { p: 6, t: 'Lass die Übung langsam ausklingen und bleibe noch einen Moment im ganz natürlichen Atem.' }]);
    return fitSegs(segs, m * WPM.atem);
  };
  return part(a, mm[0], 'Atemübung') + (w ? '\n\n' + part(w, mm[1], 'Wahrnehmungsübung') : '');
}
function txShava(c, s, m) {
  const mt = mottoText(s), d = (m == null ? +s.dur.shava : m) || 10, target = d * WPM.shava;
  const detailed = target >= 170;
  const body = detailed ? [
    { p: 3, t: 'Lass deine Füße schwer werden. Die Zehen, die Fußsohlen, die Fersen … alles darf loslassen.' },
    { p: 3, t: 'Deine Beine dürfen entspannen: die Waden, die Knie, die Oberschenkel.' },
    { p: 3, t: 'Entspanne dein Becken … deinen Bauch … deinen Rücken. Der Boden trägt dich.' },
    { p: 3, t: 'Lass deine Schultern weich werden. Deine Arme dürfen schwer werden, die Ellenbogen, die Unterarme, die Hände.' },
    { p: 3, t: 'Entspanne deinen Nacken … dein Gesicht … die Augen … die Stirn.' }
  ] : [{ p: 1, t: 'Lass Beine, Becken und Rücken schwer werden. Lass Schultern, Arme und Hände los. Entspanne Nacken, Gesicht und Stirn.' }];
  return fitSegs([
    { p: 0, t: rpick(['Nun darfst du es dir ganz bequem machen und in deiner Schlussentspannung ankommen.', 'Jetzt ist Zeit für die Schlussentspannung. Mach es dir ganz bequem und komm in der Ruhe an.'], rng(s.seed + 19 + (s.txv || 0) * 101)) },
    { p: 1, t: 'Lege dich so hin, dass dein Körper möglichst wenig halten muss. Wenn es angenehmer ist, kannst du die Knie aufstellen oder eine Decke unter die Knie legen.' },
    { p: 1, t: 'Schließe gerne die Augen und spüre noch einmal deinen Körper. Spüre den Kontakt zum Boden. Du musst nichts mehr tun. Nichts halten. Nichts erreichen.' }
  ].concat(body, [
    { p: 1, t: mt.b },
    { p: 4, t: 'Nimm deinen Atem wahr. Ganz von selbst kommt die Einatmung … und ganz von selbst geht die Ausatmung.' },
    { p: 5, t: `Wiederhole innerlich, in deinem eigenen Tempo: „${s.motto.kern}“` },
    { p: 6, t: 'Bleibe noch einige Atemzüge in dieser Ruhe.\n…' },
    { p: 7, t: 'Spüre, wie schwer und warm dein Körper geworden ist. Du musst nirgendwo hin. Du bist genau hier.' },
    { p: 8, t: 'Lass auch die Gedanken zur Ruhe kommen. Wenn einer auftaucht, lass ihn weiterziehen und kehre zum Atem zurück.\n…' },
    { p: 9, t: 'Mit jeder Ausatmung sinkst du noch ein Stück tiefer in den Boden. Der Atem fließt ruhig und gleichmäßig, ganz ohne dein Zutun.' },
    { p: 10, t: 'Spüre die Stille zwischen den Atemzügen. Du musst nichts festhalten und nichts erreichen – alles darf so sein, wie es ist.\n…' },
    { p: 11, t: 'Nimm wahr, wie Wärme und Schwere sich im ganzen Körper ausbreiten. Du bist getragen, geborgen und ganz bei dir.\n…' },
    { p: 12, t: 'Verweile noch einen Moment in dieser tiefen Ruhe und genieße sie in deinem eigenen Tempo.\n…' },
    { p: 13, t: 'Lass dich von der Schwerkraft ganz halten. Es gibt nichts zu tun, nichts zu denken und nirgendwo hinzugehen.\n…' },
    { p: 14, t: 'Spüre die Weite in dir. Mit jedem Atemzug darf es noch ein wenig stiller werden.\n…' },
    { p: 15, t: 'Ruhe in diesem Zustand, so lange du magst. Alles darf so sein, wie es ist.\n…' },
    { p: 0, t: 'Vertiefe nun langsam wieder deinen Atem. Bewege ganz sanft Finger und Zehen. Nimm dir Zeit, bevor du dich wieder aufrichtest.' },
    { p: 0, t: `Und wenn du heute nur einen Gedanken mitnehmen möchtest, dann vielleicht diesen:\n${mt.s}` }
  ]), target);
}
function txSchluss(c, s, m) {
  const r = rng(s.seed + 17 + (s.txv || 0) * 101);
  return fitSegs([
    { p: 0, t: rpick(['Bleibe noch einen Moment ruhig liegen und spüre nach, was die Bewegung in dir bewegt hat: Wärme, Weite, Ruhe, Lebendigkeit?', 'Komm jetzt zur Ruhe und spüre nach, was die Bewegung in dir hinterlassen hat: Wärme, Weite, Ruhe oder Lebendigkeit?', 'Bleibe noch eine Weile liegen und lass die Übungen nachklingen. Was hat sich in dir verändert?'], r) },
    { p: 1, t: rpick(['Nimm wahr, wie sich dein Atem verändert hat und wie dein Körper auf der Matte liegt.', 'Spüre, wie dein Atem jetzt fließt und wie schwer dein Körper auf der Matte ruht.'], r) },
    { p: 2, t: `Lass das Motto „${s.motto.title}“ noch einmal nachklingen: ${s.motto.kern}` },
    { p: 3, t: 'Spüre, welche Körperstellen sich besonders lebendig oder weich anfühlen, und lass den Atem dorthin fließen.' },
    { p: 4, t: 'Nimm dir Zeit, dich innerlich bei dir selbst für diese Stunde zu bedanken.' },
    { p: 5, t: 'Spüre, wie sich dein Herzschlag und dein Atem beruhigen.' },
    { p: 6, t: 'Nimm wahr, wo dein Körper nach dieser Stunde mehr Raum hat: im Rücken, in den Schultern oder in den Hüften.' },
    { p: 7, t: 'Lass die Beweglichkeit und die Wärme der Übungen noch einen Moment in dir wirken.' },
    { p: 8, t: 'Danke deinem Körper für das, was er heute möglich gemacht hat.' },
    { p: 9, t: 'Wenn du magst, lege eine Hand auf dein Herz und spüre seinen Rhythmus.' },
    { p: 0, t: 'Dann lass die Bewegungen los und geh in die Schlussentspannung.' }
  ], (m == null ? s.dur.schluss : m) * WPM.schluss);
}
// ---------- Mantra-Block (zwischen Atemübung und Mobilisation) ----------
const MANTRA_MIN = 5;
const mantraMode = c => c.mantra || 'aus';
function mantraOn(c, s, idx) {
  const m = mantraMode(c);
  return m === 'immer' || (m === 'wechsel' && idx % 2 === 0) || (m === 'zufall' && rng(s.seed + 7)() < 0.5);
}
function setMantraBlock(c, s, on) {
  if (!s.bm) return;
  if (!s.bm.mantra) s.bm.mantra = { ab: 'mantra', name: 'Mantra', on: false, type: 'mantra' };
  s.bm.mantra.on = on; s.bm.mantra.type = 'mantra'; s.dur.mantra = s.dur.mantra > 0 ? s.dur.mantra : MANTRA_MIN;
  s.order = order(s).slice(); if (!s.order.includes('mantra')) s.order.splice(Math.max(0, s.order.indexOf('atem') + 1), 0, 'mantra');
  s.tx = s.tx || {}; if (s.tx.mantra == null) s.tx.mantra = '';
}
// passendes Mantra aus dem Mantra-Katalog: bevorzugt Einstimmungs-Mantras, im Programm möglichst nicht doppelt
function pickMantra(c, s) {
  const used = {}; c.sessions.forEach(x => { if (x !== s && x.mantra && x.mantra.id) used[x.mantra.id] = (used[x.mantra.id] || 0) + 1; });
  const r = rng(s.seed + 13), cand = MANTRAS.filter(m => ['Mantra', 'Bija-Mantra', 'Gebet'].includes(m.typ) && (m.wi || []).length && !/nur als Empfehlung/.test(m.fuer || ''));
  const sc = cand.map(m => ({ m, v: (m.kat.includes('einstimmung') ? 3 : 0) - (used[m.id] || 0) * 4 + r() * 3 })).sort((a, b) => b.v - a.v);
  return sc.length ? sc[0].m.id : '';
}
function txMantra(c, s) {
  const m = s.mantra && manById(s.mantra.id); if (!m) return '';
  const d = Math.max(1, txDur(s, 'mantra') || MANTRA_MIN), first = (m.wi && m.wi[0]) || '';
  const sents = first.split(/(?<=[.!?])\s+/).filter(Boolean);
  const bed = m.bed ? (m.bed.length === 1 ? 'Das bedeutet: ' + m.bed[0][1] : 'Zur Bedeutung: ' + m.bed.slice(0, 4).map(b => `${b[0]} – ${b[1]}`).join('; ')) : '';
  return fitSegs([
    { p: 0, t: `Nun singen wir gemeinsam das Mantra „${m.n}“.` },
    { p: 0, t: 'Es lautet:\n' + m.text.join('\n') },
    { p: 1, t: bed },
    { p: 2, t: 'Lass den Klang am Ende ausklingen und spüre noch einen Moment nach, was sich in dir verändert hat.' },
    { p: 3, t: sents.slice(0, 2).join(' ') },
    { p: 4, t: m.an || '' },
    { p: 5, t: 'Sitze aufrecht, die Schultern sind weich, der Atem fließt ruhig. Schließe gern die Augen und stimme dich innerlich ein.' },
    { p: 7, t: 'Spüre den Klang in deinem Körper: im Brustkorb, im Hals, im Kopf.' },
    { p: 8, t: 'Lass die Stimme weich und natürlich klingen. Es kommt nicht auf einen schönen Ton an, sondern auf das Schwingen.' },
    { p: 9, t: 'Du kannst die Hände auf Herz oder Bauch legen und die Schwingung dort spüren.' },
    { p: 10, t: 'Nach dem letzten Klang bleibe still und spüre die Stille, die entsteht.' },
    { p: 11, t: 'Wenn du magst, wiederhole das Mantra innerlich weiter, im Rhythmus deines Atems.' },
    { p: 6, t: `Wiederhole das Mantra etwa ${d} Minuten lang in deinem eigenen Tempo – laut oder leise.` }
  ].filter(x => x.t), d * WPM.mantra);
}
const TXKEYS = ['focus', 'kern', 'einl', 'atem', 'mantra', 'schluss', 'shava'];
const TXMIN = { einl: 'einl', atem: 'atem', schluss: 'schluss', shava: 'shava' };
function txFor(c, s, k, idx) {
  const ab = abOf(s, k), m = txDur(s, k);
  if (ab === 'mantra') return txMantra(c, s);
  if (ab === 'einl') return txEinl(c, s, idx, m);
  if (ab === 'schluss') return txSchluss(c, s, m);
  if (ab === 'shava') return txShava(c, s, m);
  return '';
}
function genTexts(c, s, idx, keys) {
  const all = { focus: () => s.motto.focus, kern: () => s.motto.kern, einl: () => txFor(c, s, 'einl', idx), atem: () => txAtem(c, s), schluss: () => txFor(c, s, 'schluss', idx), shava: () => txFor(c, s, 'shava', idx) };
  s.tx = s.tx || {}; s.txEdited = s.txEdited || {};
  (keys || TXKEYS).forEach(k => { const f = all[k] || (() => txFor(c, s, k, idx)); if (keys || !s.txEdited[k]) { s.tx[k] = f(); if (keys) s.txEdited[k] = false; } });
}
// ---------- Sessions ----------
function fillSession(c, s, idx, opts) {
  opts = opts || {};
  s.txd = {};
  if (opts.motto) s.motto = opts.motto;
  s.status = 'vorgeplant';
  s.kN = kraftCountFor(c, idx);
  const mOn = mantraOn(c, s, idx);
  if (s.bm && s.bmCustom) { syncHaupt(s); setMantraBlock(c, s, mOn); }
  else {
    const mm = Math.max(1, +(c.durs && c.durs.mantra) || MANTRA_MIN);
    s.dur = courseDur(c); s.dur.mantra = mOn ? mm : 0;
    if (!mOn && mantraMode(c) !== 'aus') s.dur.haupt += mm; // Stunde ohne Mantra: Zeit geht in den Hauptteil, Gesamtdauer bleibt
    initBM(c, s, idx); s.dur.mantra = mm;
  }
  s.mantra = mOn ? { id: pickMantra(c, s) } : null;
  fillExercises(c, s, idx);
  applySeqPlan(c, s);
  if (!s.altDefSet) s.altDef = !!c.altDef;
  applyAlt(s);
  s.txEdited = {};
  genTexts(c, s, idx);
}
// Zeiten aus dem Rahmen auf eine bestehende Stunde übertragen (Übungen bleiben, Minuten werden angepasst)
function applyCourseDur(c, s, idx) {
  if ((s.mobiMode || 'sitz') !== mobiModeFor(c, idx)) (s.blk || (s.blk = {})).mobi = [];
  Object.keys(s.blk || {}).forEach(k => { if (isCustomKey(k)) { delete s.blk[k]; if (s.tx) delete s.tx[k]; } });
  const on = mantraOn(c, s, idx), mm = Math.max(1, +(c.durs && c.durs.mantra) || MANTRA_MIN);
  s.dur = courseDur(c); s.dur.mantra = on ? mm : 0;
  if (!on && mantraMode(c) !== 'aus') s.dur.haupt += mm;
  initBM(c, s, idx); s.dur.mantra = mm; s.txd = {};
  s.mantra = on ? (s.mantra || { id: pickMantra(c, s) }) : null;
  s.kN = kraftCountFor(c, idx);
  syncKraft(c, s);
  // Atemteil / Wahrnehmungsübung gemäß Rahmen (Ja, Rauslassen, abwechselnd, zufällig)
  { s.atem = s.atem || { a: '', w: '' };
    if (c.breath === 'aus' || !bon(s, 'atem')) s.atem = { a: '', w: '' };
    else {
      const wahr = c.breath === 'atem_wahr' || (c.breath === 'gemischt' && idx % 2 === 1) || (c.breath === 'zufall' && rng(s.seed + 5)() < 0.5);
      const ctxA = mkCtx(c, s, Math.random); ctxA.have = new Set(blkIds(s));
      if (!s.atem.a) s.atem.a = pickBreath(ctxA, 'atem') || 'bauchatmung';
      if (!wahr) s.atem.w = ''; else if (!s.atem.w) s.atem.w = pickBreath(ctxA, 'wahr') || 'bodenkontakt';
    } }
  exKeys(s).forEach(k => rebalanceBlock(c, s, k));
  EXKEYS.forEach(k => { if (bon(s, k) && bty(s, k) === 'ex' && !(s.blk[k] || []).length) rerollBlock(c, s, k); });
  genTexts(c, s, idx);
}
function newSession(c, idx, motto) {
  const s = { id: uid(), seed: Math.floor(Math.random() * 1e9), locked: false, date: '', motto, dur: courseDur(c), blk: {}, atem: {}, tx: {}, txEdited: {}, status: 'vorgeplant' };
  fillSession(c, s, idx);
  return s;
}
function planCourse(c) {
  const n = Math.max(1, +c.count || 1), mottos = assignMottos(c, n);
  while (c.sessions.length > n) c.sessions.pop();
  for (let i = 0; i < n; i++) {
    if (!c.sessions[i]) c.sessions.push(newSession(c, i, mottos[i]));
    else if (!c.sessions[i].locked && c.sessions[i].status !== 'fertig') { c.sessions[i].seed = Math.floor(Math.random() * 1e9); fillSession(c, c.sessions[i], i, { motto: mottos[i] }); }
  }
  calcDates(c);
  c.dirty = false; c.status = 'vorgeplant';
}


// ---------- KI (optional, eigener API-Schlüssel) ----------
// Anbieter: Anthropic (Standard) oder jeder OpenAI-kompatible Dienst (OpenAI, DeepSeek, Mistral, OpenRouter, eigener Server …)
const AI_PROV = {
  anthropic: { n: 'Anthropic (Claude)', url: '', model: 'claude-sonnet-5-5' },
  deepseek: { n: 'DeepSeek', url: 'https://api.deepseek.com', model: 'deepseek-chat' },
  openai: { n: 'OpenAI', url: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  mistral: { n: 'Mistral', url: 'https://api.mistral.ai/v1', model: 'mistral-small-latest' },
  openrouter: { n: 'OpenRouter', url: 'https://openrouter.ai/api/v1', model: '' },
  custom: { n: 'Eigener Dienst (OpenAI-kompatibel)', url: '', model: '' }
};
const aiProvider = () => (AI_PROV[state.settings.provider] ? state.settings.provider : 'anthropic');
async function aiCall(prompt, maxTokens, retried) {
  const st = state.settings, key = (st.apiKey || '').trim(), prov = aiProvider();
  if (!key) throw new Error('Kein API-Schlüssel hinterlegt (Einstellungen).');
  let url, headers, body, model;
  if (prov === 'anthropic') {
    model = /^claude-/.test(st.model || '') ? st.model.trim() : AI_PROV.anthropic.model;
    url = 'https://api.anthropic.com/v1/messages';
    headers = { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' };
    body = { model, max_tokens: maxTokens || 3000, messages: [{ role: 'user', content: prompt }] };
  } else {
    model = (st.model || '').trim().replace(/\s+/g, '-').toLowerCase() || AI_PROV[prov].model; // „DeepSeek V4 Flash“ → deepseek-v4-flash
    const base = ((st.baseUrl || '').trim() || AI_PROV[prov].url).replace(/\/+$/, '').replace(/\/chat\/completions$/, '');
    if (!base) throw new Error('Keine Adresse (Base-URL) für den Dienst eingetragen.');
    if (!model) throw new Error('Kein Modellname eingetragen.');
    url = base + '/chat/completions';
    headers = { 'content-type': 'application/json', authorization: 'Bearer ' + key };
    body = { model, max_tokens: maxTokens || 3000, messages: [{ role: 'user', content: prompt }] };
  }
  const send = b => fetch(url, { method: 'POST', headers, body: JSON.stringify(b) });
  let res;
  try { res = await send(body); }
  catch (e) { throw new Error('KI nicht erreichbar (keine Internetverbindung, Firewall oder der Dienst erlaubt keine Browser-Zugriffe/CORS) – Adresse: ' + url + ' – ' + e.message); }
  if (res.status === 400 && prov !== 'anthropic') { // neuere OpenAI-Modelle verlangen max_completion_tokens statt max_tokens
    const t0 = await res.clone().text();
    if (/max_completion_tokens/.test(t0)) { const b2 = Object.assign({}, body); b2.max_completion_tokens = b2.max_tokens; delete b2.max_tokens; res = await send(b2); }
  }
  if (!res.ok) {
    const txt = (await res.text()).slice(0, 300), hint = res.status === 401 || res.status === 403 ? ' – API-Schlüssel ungültig oder ohne Berechtigung.' : res.status === 404 ? ' – Modell „' + model + '“ oder Adresse nicht gefunden.' : res.status === 429 ? ' – Limit erreicht, später erneut versuchen.' : res.status === 402 || (res.status === 400 && /credit|billing|balance/i.test(txt)) ? ' – Guthaben des Kontos aufgebraucht.' : '';
    throw new Error('KI-Anfrage fehlgeschlagen (' + res.status + ')' + hint + ' ' + txt + (prov === 'anthropic' ? '' : ' [Adresse: ' + url + ', Modell: ' + model + ']'));
  }
  const j = await res.json();
  const out = prov === 'anthropic' ? (j.content || []).map(p => p.text || '').join('') : ((j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '');
  // „Denk“-Modelle (z. B. DeepSeek) verbrauchen das Token-Limit zuerst für ihre Überlegungen: leere oder abgeschnittene Antwort, dann einmal mit deutlich mehr Tokens wiederholen
  const ch0 = (j.choices && j.choices[0]) || {};
  const cut = prov === 'anthropic' ? j.stop_reason === 'max_tokens' : ch0.finish_reason === 'length'; // Antwort wegen Token-Limit abgeschnitten
  if (!retried && ((!out.trim() && prov !== 'anthropic' && ch0.message && ch0.message.reasoning_content) || cut)) return aiCall(prompt, Math.min(16000, (maxTokens || 3000) * 4), true);
  if (!out.trim()) throw new Error('Der Dienst hat geantwortet, aber ohne Text (' + JSON.stringify(j).slice(0, 200) + '). Evtl. ist das Modell ein „Denk“-Modell, das mehr Tokens braucht, oder der Modellname passt nicht.');
  return out;
}
function jsonFrom(text, open, close) {
  const a = text.indexOf(open), b = text.lastIndexOf(close);
  if (a < 0 || b < 0) throw new Error('Antwort enthielt kein JSON.');
  return JSON.parse(text.slice(a, b + 1));
}
const exNames = ids => ids.map(i => (exById(i) || {}).n).filter(Boolean).join(', ');
async function aiTexts(c, s, idx, wish) {
  const a = exById(s.atem.a), w = exById(s.atem.w), sample = THEMES[0];
  const p = `Du bist eine erfahrene Yogalehrerin und schreibst Anleitungstexte für eine Gruppenyogastunde (${LEVELS[c.level]}, ${sessionTotal(s)} Minuten, Stunde ${idx + 1} von ${c.sessions.length}).
Motto der Stunde: „${s.motto.title}“ (Kernsatz: ${s.motto.kern}). Körperlicher Fokus: ${s.motto.focus}.
Dauern in Minuten: Einleitung ${txDur(s, 'einl')}, Atemübung ${txDur(s, 'atem')}, ${bon(s, 'mantra') && s.mantra ? 'Mantra ' + txDur(s, 'mantra') + ', ' : ''}Hauptteil ${s.dur.haupt}, Schluss ${txDur(s, 'schluss')}, Shavasana ${txDur(s, 'shava')}.
Atemübung: ${a ? a.n : '–'}${w ? '; Wahrnehmungsübung: ' + w.n : ''}.${bon(s, 'mantra') && s.mantra && manById(s.mantra.id) ? ' Mantra: ' + manById(s.mantra.id).n + ' (Text: ' + manById(s.mantra.id).text.join(' / ') + ') – den Mantratext NICHT verändern.' : ''}
${wish ? 'Wünsche der Lehrerin für diese Stunde: „' + wish + '“. Berücksichtige sie in Inhalt und Ton der Texte.\n' : ''}Übungen im Hauptteil: ${exNames(blkIds(s))}.
Schreibe auf Deutsch in der Du-Form, ruhig, einfach, mit kurzen Sätzen und Sprechpausen (…), ohne Esoterik-Übertreibung. Stilprobe Einleitung: „${sample.e}“
Länge (entspricht der Sprechzeit): Einleitung ca. ${Math.round(txDur(s, 'einl') * WPM.einl)} Wörter, Atemtext ca. ${Math.round(txDur(s, 'atem') * WPM.atem)} Wörter, Shavasana ca. ${Math.round(txDur(s, 'shava') * WPM.shava)} Wörter, Schluss ca. ${Math.round(txDur(s, 'schluss') * WPM.schluss)} Wörter.
Antworte ausschließlich mit JSON: {"einl":"…","atem":"…","schluss":"…","shava":"…","focus":"…","kern":"…"}`;
  let j; try { j = jsonFrom(await aiCall(p, 4000), '{', '}'); } catch (e) { if (/JSON|position/.test(e.message)) throw new Error('Die KI-Antwort war unvollständig oder nicht lesbar – bitte nochmal versuchen.'); throw e; }
  ['einl', 'atem', 'schluss', 'shava', 'focus', 'kern'].forEach(k => { if (j[k]) { s.tx[k] = String(j[k]); s.txEdited[k] = true; } });
  if (j.kern) s.motto.kern = String(j.kern);
  if (j.focus) s.motto.focus = String(j.focus);
}
async function aiMottos(c) {
  const n = c.sessions.length;
  const p = `Entwirf für einen Yoga-Gruppenkurs (${LEVELS[c.level]}) mit ${n} Stunden${c.motto.free ? ' das Übermotto „' + c.motto.free + '“ mit ' + n + ' passenden Einzelmottos' : ' ' + n + ' Einzelmottos mit rotem Faden'}.
Jedes Einzelmotto: kurzer Titel (2–5 Wörter), Kernsatz in der Ich-Form, körperlicher Fokus in Stichworten, 2–4 Schlagworte aus: ${Object.keys(KEYWORDS).join(', ')}.
Antworte ausschließlich mit JSON-Array: [{"title":"…","kern":"…","focus":"…","tags":["…"]}]`;
  return jsonFrom(await aiCall(p, 3000), '[', ']').map(m => ({ themeId: '', title: m.title, kern: m.kern, focus: m.focus, tags: m.tags || [] }));
}












