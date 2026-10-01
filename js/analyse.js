/* Analyse – Einzelstunde und Programm (Programm = alle Einzelstunden zusammen, Rahmen = Vorgaben des Programms) */
const LVN = ['', 'Anfänger', 'Mittel', 'Fortgeschritten'];
const f1 = v => (Math.round(v * 10) / 10).toString().replace('.', ',');
const pct = (v, t) => t > 0 ? Math.round(100 * v / t) : 0;

// Übungen einer Stunde (nur eingeschaltete Übungsblöcke) mit Block und Minuten
function anItems(s) {
  const out = [];
  exKeys(s).filter(k => bon(s, k)).forEach(k => (s.blk[k] || []).forEach(it => { const e = exById(it.id); if (e) out.push({ s, it, e, k, min: +it.min || 0 }); }));
  return out;
}
// Kennzahlen und Verteilungen über eine oder mehrere Stunden
function anStat(c, sessions) {
  const R = { n: 0, min: 0, lvW: 0, rSum: 0, rN: 0, unrated: {}, ids: {}, peaks: [], conflicts: [], rows: [], dist: { lv: {}, reg: {}, st: {}, pos: {}, wirk: {}, en: {}, chakra: {}, blk: {} } };
  const add = (m, k, v) => { if (k != null && k !== '') m[k] = (m[k] || 0) + v; };
  sessions.forEach((s, si) => anItems(s).forEach(row => {
    const { e, k, min } = row, kt = e.kat || {};
    R.rows.push(row); R.n++; R.min += min; R.lvW += (e.lv || 1) * min;
    const r = rating(e.id); R.rSum += r; R.rN++; if (state.ratings[e.id] === undefined) R.unrated[e.id] = e;
    R.ids[e.id] = (R.ids[e.id] || 0) + 1;
    if (e.peak) R.peaks.push(e);
    if (contra(e, effGeb(c, s))) R.conflicts.push({ s, e });
    add(R.dist.lv, e.lv || 1, min); add(R.dist.blk, bn(s, k), min);
    // Übungen ohne Zuordnung werden als „Ohne Zuordnung“ mitgezählt
    const multi = (m, arr) => { arr = (arr || []).filter(Boolean); if (arr.length) arr.forEach(x => add(m, x, min)); else add(m, '_none', min); };
    multi(R.dist.reg, kt.reg); multi(R.dist.st, e.st); multi(R.dist.pos, kt.pos); multi(R.dist.wirk, kt.wirk); multi(R.dist.en, kt.en ? [kt.en] : []); multi(R.dist.chakra, kt.chakra);
  }));
  R.lv = R.min > 0 ? R.lvW / R.min : 0; R.rate = R.rN ? R.rSum / R.rN : 0;
  return R;
}
const lvLabel = v => !v ? '–' : v < 1.4 ? 'überwiegend Anfänger' : v < 1.8 ? 'Anfänger bis Mittel' : v < 2.3 ? 'Mittel' : v < 2.7 ? 'Mittel bis Fortgeschritten' : 'Fortgeschritten';
const rstars = v => `<span class="rstars" style="--p:${Math.max(0, Math.min(100, v / 5 * 100))}%" title="${f1(v)} von 5">★★★★★</span>`;
const kpi = (label, value, sub) => `<div class="kpi"><b>${value}</b><span>${label}</span>${sub ? `<small>${sub}</small>` : ''}</div>`;
// Balken: map {schlüssel: Minuten}, labels {schlüssel: Text}, order optional
function abars(map, labels, order) {
  const keys = (order || Object.keys(map).sort((a, b) => (a === '_none') - (b === '_none') || map[b] - map[a])).filter(k => order ? true : map[k] > 0);
  const total = Object.values(map).reduce((a, b) => a + b, 0), max = Math.max(1, ...keys.map(k => map[k] || 0));
  if (!keys.length) return '<p class="muted">Keine Daten.</p>';
  return `<div class="abars">${keys.map(k => { const v = map[k] || 0; return `<div class="abar${v ? '' : ' zero'}"><span class="al">${esc(labels[k] || (k === '_none' ? 'Ohne Zuordnung' : k))}</span><span class="at"><i style="width:${Math.round(100 * v / max)}%"></i></span><span class="av">${fmtMin(v)} Min. <small>${pct(v, total)} %</small></span></div>`; }).join('')}</div>`;
}
const apanel = (title, hint, body, cls) => `<section class="panel apanel${cls ? ' ' + cls : ''}"><h3>${title}</h3>${hint ? `<p class="phint2">${hint}</p>` : ''}${body}</section>`;
function distPanels(R, c) {
  const L = { lv: { 1: 'Anfänger', 2: 'Mittel', 3: 'Fortgeschritten' } };
  return `<div class="agrid agrid3">
${apanel('Haltung im Raum', '', abars(R.dist.pos, KAT.pos))}
${apanel('Körperregionen', 'Mehrfachzuordnung möglich – Summe kann über 100 % liegen', abars(R.dist.reg, KAT.reg))}
${apanel('Wirkung', '', `<div class="subh">Funktionelle Wirkung</div>${abars(R.dist.wirk, KAT.wirk)}<div class="subh">Energetischer Fokus</div>${abars(R.dist.en, KAT.en)}`)}
${apanel('Yogastile', 'Welche Stile in den Übungen stecken – Übungen ohne Stil stehen unter „Ohne Zuordnung“', abars(R.dist.st, STILE))}
${apanel('Chakren', 'Übungen ohne Chakra-Zuordnung stehen unter „Ohne Zuordnung“', abars(R.dist.chakra, KAT.chakra))}
${apanel('Schwierigkeitsgrad', 'Minutenanteil je Stufe der Übung', abars(R.dist.lv, L.lv, [1, 2, 3]))}
</div>`;
}
const stDot = s => `<span class="stdot stc-${s.status || 'vorgeplant'}"></span>${STATUS[s.status || 'vorgeplant']}`;

// ---------------- Einzelstundenanalyse ----------------
function viewSessionAnalysis(c, asDoc, sArg) {
  if (!c.sessions.length) return '<p class="muted">Noch keine Stunden angelegt.</p>';
  let s = sArg || c.sessions.find(x => x.id === ui.sel) || c.sessions[0]; if (!asDoc) ui.sel = s.id;
  const i = c.sessions.indexOf(s), R = anStat(c, [s]), T = sessionTotal(s), pl = plannedTotal(s), ok = Math.abs(pl - T) <= 1.01;
  const pills = c.sessions.map((x, j) => `<button class="pill${x.id === s.id ? ' on' : ''} stp-${x.status || 'vorgeplant'}" data-a="selS" data-id="${x.id}" title="${esc(x.motto.title)}">${j + 1}<small>${esc(fmtDateS(x.date))}</small></button>`).join('');
  const at = [s.atem && s.atem.a, s.atem && s.atem.w].filter(Boolean).map(id => (exById(id) || {}).n).filter(Boolean).join(' + ') || '–';
  const peak = R.peaks.length ? R.peaks.map(e => esc(e.n) + ' ★').join(', ') : 'keine';
  const lines = R.rows.map(({ e, k, min, it }) => `<tr><td>${esc(bn(s, k))}</td><td><b>${esc(e.n)}</b>${peakStar(e)}${e.sa ? `<br><i class="sa">${esc(e.sa)}</i>` : ''}</td><td>${fmtMin(min)} Min.</td><td>${lvDots(e)} <span class="muted">${esc(lvName(e))}</span></td><td>${stRegChips(e)}</td>${asDoc ? '' : `<td>${rateStars(e.id)}${state.ratings[e.id] === undefined ? '<br><small class="muted">noch nicht bewertet</small>' : ''}</td>`}</tr>`).join('');
  const hints = [];
  const A_ = (t, v) => ({ t, v: v || '', sid: s.id });
  if (!ok) hints.push({ text: `Geplante Zeit ${fmtMin(pl)} Min. weicht um ${fmtMin(Math.abs(pl - T))} Min. von der Soll-Dauer (${T} Min.) ab.`, act: A_('time') });
  R.conflicts.forEach((x, j) => hints.push({ text: `„${esc(x.e.n)}“ ist belastend bei: ${(x.e.x || []).filter(g => effGeb(c, s).includes(g)).map(g => GEBRECHEN[g]).join(', ')}.`, act: j === 0 ? A_('geb') : null }));
  if (!R.peaks.length) hints.push({ text: 'Diese Stunde hat keine Peak Pose (★).', act: A_('peak') });
  const un = Object.keys(R.unrated).length; if (un && !asDoc) hints.push(`${un} von ${R.n} Übungen hast du noch nicht mit „Gefällt mir“ bewertet.`);
  if (R.lv && c.level === 'anf' && R.lv > 1.6) hints.push({ text: 'Für eine Anfängergruppe ist der Schwierigkeitsgrad eher hoch.', act: A_('level') });
  if (R.lv && c.level === 'fort' && R.lv < 1.8) hints.push({ text: 'Für Fortgeschrittene ist der Schwierigkeitsgrad eher niedrig.', act: A_('level') });
  return `${asDoc ? '' : `<div class="bar noprint"><h2 class="ph2">Einzelstundenanalyse</h2><span class="grow"></span><span class="muted">${stDot(s)}</span></div>
<div class="pills noprint">${pills}</div>
<div class="scl anscl">${ovCard(s, i, true)}</div>`}
<div class="kpis">
${kpi('Dauer geplant', `${fmtMin(pl)} Min.`, `Soll ${T} Min. ${ok ? '✓' : '(Abweichung)'}`)}
${kpi('Übungen', R.n, `${fmtMin(R.min)} Min. Übungszeit`)}
${kpi('Ø Schwierigkeit', `${f1(R.lv)} / 3`, lvLabel(R.lv))}
${asDoc ? '' : kpi('Ø Gefällt mir', R.rN ? `${f1(R.rate)} / 5` : '–', R.rN ? rstars(R.rate) : '')}
${kpi('Peak Pose', R.peaks.length, peak)}
${kpi('Atem / Wahrnehmung', '', esc(at))}
</div>
${hints.length ? `<section class="panel apanel hints"><h3>Auffälligkeiten</h3><ul>${hints.map(h => hintLi(h, c, asDoc)).join('')}</ul></section>` : ''}
${distPanels(R, c)}
${(() => { const tbl = `<table class="atbl"><thead><tr><th>Block</th><th>Übung</th><th>Dauer</th><th>Schwierigkeit</th><th>Yogastil &amp; Körperregion</th>${asDoc ? '' : '<th>Gefällt mir</th>'}</tr></thead><tbody>${lines || '<tr><td colspan="6" class="muted">Keine Übungen.</td></tr>'}</tbody></table>`; return asDoc ? '<h3>Übungen der Stunde</h3>' + tbl : apanel('Übungen der Stunde mit „Gefällt mir“', 'Sterne anklicken, um die Bewertung zu ändern – sie fließt in die automatische Auswahl ein.', `<div class="tblwrap">${tbl}</div>`, 'wide'); })()}`;
}

// ---------------- Programmanalyse ----------------
function viewProgramAnalysis(c, asDoc) {
  const ss = c.sessions, rs = asDoc ? (id => rstars(rating(id))) : (id => rateStars(id));
  if (!ss.length) return '<p class="muted">Noch keine Stunden angelegt.</p>';
  const R = anStat(c, ss), per = ss.map(s => ({ s, r: anStat(c, [s]) })), tot = ss.reduce((a, s) => a + plannedTotal(s), 0);
  const distinct = Object.keys(R.ids).length, st = {}; ss.forEach(s => { const k = s.status || 'vorgeplant'; st[k] = (st[k] || 0) + 1; });
  const peakDistinct = new Set(R.peaks.map(e => e.id)).size, withPeak = per.filter(p => p.r.peaks.length).length;
  const rows = per.map(({ s, r }, i) => { const T = sessionTotal(s), pl = plannedTotal(s), ok = Math.abs(pl - T) <= 1.01; return `<tr class="clk" data-a="anGo" data-id="${s.id}" title="Einzelstundenanalyse öffnen"><td><b>${i + 1}</b></td><td>${esc((fmtDateW(s.date) || '').slice(0, 6))}</td><td>${esc(s.motto.title)}</td><td>${fmtMin(pl)} / ${T}${ok ? ' ✓' : ' ⚠'}</td><td>${r.n}</td><td><span class="lvbar" title="${f1(r.lv)} / 3"><i style="width:${Math.round(r.lv / 3 * 100)}%"></i></span> ${f1(r.lv)}</td>${asDoc ? '' : `<td>${r.rN ? rstars(r.rate) : '–'}</td>`}<td>${r.peaks.length ? esc(r.peaks.map(e => e.n).join(', ')) + ' ★' : '<span class="muted">–</span>'}</td><td>${stDot(s)}</td></tr>`; }).join('');
  // Verlauf der Schwierigkeit als Säulen
  const spark = per.map(({ s, r }, i) => `<div class="col" title="${i + 1}. ${esc(s.motto.title)}: Ø ${f1(r.lv)} / 3"><i style="height:${Math.round(r.lv / 3 * 100)}%"></i><small>${i + 1}</small></div>`).join('');
  // Häufigkeit, Bewertung
  const byCnt = Object.entries(R.ids).sort((a, b) => b[1] - a[1]), top = byCnt.slice(0, 8);
  const used = Object.keys(R.ids).map(id => exById(id)).filter(Boolean), byRate = used.slice().sort((a, b) => rating(b.id) - rating(a.id));
  const li = (e, extra) => `<li><b>${esc(e.n)}</b>${peakStar(e)} ${asDoc ? '' : rs(e.id)}${extra ? ` <span class="muted">${extra}</span>` : ''}</li>`;
  const unrated = Object.values(R.unrated);
  // Hinweise
  const hints = [];
  const regTot = Object.values(R.dist.reg).reduce((a, b) => a + b, 0);
  Object.keys(KAT.reg).forEach(k => { const v = R.dist.reg[k] || 0; if (!v) hints.push({ text: `Körperregion „${KAT.reg[k]}“ kommt im ganzen Programm nicht vor.`, act: { t: 'reg', v: k } }); else if (pct(v, regTot) < 4) hints.push({ text: `Körperregion „${KAT.reg[k]}“ ist nur schwach vertreten (${pct(v, regTot)} %).`, act: { t: 'reg', v: k } }); });
  byCnt.filter(x => x[1] >= 4).slice(0, 5).forEach(([id, n]) => hints.push({ text: `„${esc(exById(id).n)}“ kommt ${n}× im Programm vor.`, act: { t: 'freq', v: id } }));
  if (withPeak < ss.length) hints.push({ text: `${ss.length - withPeak} von ${ss.length} Stunden haben keine Peak Pose (★).`, act: { t: 'peak' } });
  const off = per.filter(p => Math.abs(plannedTotal(p.s) - sessionTotal(p.s)) > 1.01).length; if (off) hints.push({ text: `${off} Stunde(n) weichen von der Soll-Dauer ab.`, act: { t: 'time' } });
  if (R.conflicts.length) hints.push({ text: `${R.conflicts.length} Übung(en) belasten ausgewählte Einschränkungen: ${[...new Set(R.conflicts.map(x => x.e.n))].slice(0, 6).map(esc).join(', ')}.`, act: { t: 'geb' } });
  if (unrated.length && !asDoc) hints.push(`${unrated.length} von ${distinct} verwendeten Übungen sind noch nicht mit „Gefällt mir“ bewertet.`);
  if (R.lv && c.level === 'anf' && R.lv > 1.6) hints.push({ text: 'Für eine Anfängergruppe ist der Schwierigkeitsgrad im Programm eher hoch.', act: { t: 'level' } });
  if (R.lv && c.level === 'fort' && R.lv < 1.8) hints.push({ text: 'Für Fortgeschrittene ist der Schwierigkeitsgrad im Programm eher niedrig.', act: { t: 'level' } });
  const first = per[0].r.lv, last = per[per.length - 1].r.lv;
  if (ss.length > 3 && last + 0.15 < first) hints.push('Der Schwierigkeitsgrad nimmt im Programmverlauf eher ab.');
  return `${asDoc ? '' : `<div class="bar noprint"><h2 class="ph2">Programmanalyse</h2><span class="grow"></span><span class="muted">${esc(c.name)}</span></div>`}
<div class="kpis">
${kpi('Stunden', ss.length, `${Math.floor(tot / 60)} h ${Math.round(tot - Math.floor(tot / 60) * 60)} min geplant`)}
${kpi('Übungen gesamt', R.n, `${distinct} verschiedene · Ø ${f1(R.n / ss.length)} je Stunde`)}
${kpi('Ø Schwierigkeit', `${f1(R.lv)} / 3`, `${lvLabel(R.lv)} · Gruppe ${esc(LEVELS[c.level])}`)}
${asDoc ? '' : kpi('Ø Gefällt mir', R.rN ? `${f1(R.rate)} / 5` : '–', R.rN ? rstars(R.rate) : '')}
${kpi('Peak Poses', R.peaks.length, `${peakDistinct} verschiedene · in ${withPeak}/${ss.length} Stunden`)}
${kpi('Status', '', Object.keys(STATUS).map(k => `<span class="stdot stc-${k}"></span>${STATUS[k]} ${st[k] || 0}`).join(' · '))}
</div>
${hints.length ? `<section class="panel apanel hints"><h3>Auffälligkeiten</h3><ul>${hints.slice(0, 16).map(h => hintLi(h, c, asDoc)).join('')}</ul></section>` : ''}
${(() => { const tbl = `<table class="atbl"><thead><tr><th>Nr.</th><th>Datum</th><th>Motto</th><th>Dauer (Min.)</th><th>Übungen</th><th>Ø Schwierigkeit</th>${asDoc ? '' : '<th>Ø Gefällt mir</th>'}<th>Peak Pose</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`; return asDoc ? `<h3>Verlauf über das Programm</h3><div class="spark">${spark}</div>` + tbl : apanel('Verlauf über das Programm', 'Zeile anklicken = Einzelstundenanalyse. Säulen: Ø Schwierigkeit je Stunde.', `<div class="spark">${spark}</div><div class="tblwrap">${tbl}</div>`, 'wide'); })()}
${distPanels(R, c)}
<div class="agrid">
${apanel('Häufigste Übungen', 'Wie oft eine Übung im Programm vorkommt', `<ul class="alist">${top.map(([id, n]) => li(exById(id), n + '×')).join('')}</ul>`)}
${asDoc ? '' : `${apanel('Gefällt mir – Spitzenreiter', 'Beste Bewertungen unter den verwendeten Übungen', `<ul class="alist">${byRate.slice(0, 6).map(e => li(e)).join('')}</ul>`)}
${apanel('Gefällt mir – Schlusslichter', 'Niedrigste Bewertungen unter den verwendeten Übungen', `<ul class="alist">${byRate.slice(-6).reverse().map(e => li(e)).join('')}</ul>`)}
${apanel('Noch nicht bewertet', `${unrated.length} Übungen im Programm ohne Sterne`, unrated.length ? `<ul class="alist">${unrated.slice(0, 10).map(e => li(e)).join('')}</ul>${unrated.length > 10 ? `<p class="muted">… und ${unrated.length - 10} weitere</p>` : ''}` : '<p class="muted">Alles bewertet.</p>')}`}
</div>`;
}


// ---------------- Automatische Änderungen zu den Auffälligkeiten ("Ändern") ----------------
// Betroffen sind nur Einzelstunden, die nicht auf „Fertig“ stehen (und nicht gesperrt sind). Geänderte Stunden gehen automatisch auf „In Planung“.
const anEditable = c => c.sessions.filter(s => s.status !== 'fertig' && !s.locked);
const anFits = (e, ab) => AB_POS[ab] && ((e.kat && e.kat.pos) || []).some(p => AB_POS[ab].includes(p));
function anCtx(c, s) { const ctx = mkCtx(c, s, Math.random); ctx.have = new Set(blkIds(s)); return ctx; }
function anPut(s, k, idx, e) { const ni = mkItem(e); s.blk[k][idx] = ni; applyAlt(s, ni); return ni; }
// Übung e in eine Stunde einbauen: sie ersetzt die am besten passende (zeitlich ähnliche, schwach bewertete) Übung eines passenden Blocks
function anSwapIn(s, e, skip) {
  let best = null;
  exKeys(s).filter(k => bon(s, k) && bty(s, k) === 'ex').forEach(k => {
    if (!anFits(e, abOf(s, k))) return;
    (s.blk[k] || []).forEach((it, idx) => {
      const v = exById(it.id); if (!v || v.peak || (skip && skip(v))) return;
      const d = Math.abs((+it.min || 0) - e.m) + (rating(v.id) - 3) * 0.5 + (it.id === 'tadasana' ? 9 : 0);
      if (!best || d < best.d) best = { k, idx, d };
    });
  });
  if (!best) return false; anPut(s, best.k, best.idx, e); return true;
}
// Eine Übung durch eine ähnliche, passende Alternative ersetzen (gleiche Position im Block)
function anReplace(c, s, k, idx, usage, minAlt) {
  const old = exById(s.blk[k][idx].id); if (!old) return false;
  const ctx = anCtx(c, s), ab = abOf(s, k), ok0 = old.kat || {};
  const share = (a, b) => (a || []).filter(x => (b || []).includes(x)).length;
  const cands = eligible(exAll().filter(e => e.id !== old.id && e.c !== 'kraft' && !e.peak && anFits(e, ab)), ctx);
  const best = cands.map(e => { const kt = e.kat || {}; return { e, sc: share(kt.pos, ok0.pos) * 2 + share(kt.dir, ok0.dir) * 3 + share(kt.reg, ok0.reg) * 2 + (e.c === old.c ? 3 : 0) - Math.abs(e.m - old.m) * 3 - (usage[e.id] || 0) * 3 + (rating(e.id) - 3) + Math.random() }; }).sort((a, b) => b.sc - a.sc)[0];
  if (!best) return false;
  usage[old.id] = (usage[old.id] || 1) - 1; usage[best.e.id] = (usage[best.e.id] || 0) + 1;
  anPut(s, k, idx, best.e); return true;
}
const anUsage = c => { const u = {}; c.sessions.forEach(s => anItems(s).forEach(x => { u[x.e.id] = (u[x.e.id] || 0) + 1; })); return u; };

function fixRegion(c, r, list) {
  // Zielanteil der Region ca. 8 % der Übungszeit; Stunden mit dem geringsten Anteil zuerst, höchstens zwei Durchgänge
  const regMin = s => anItems(s).filter(x => ((x.e.kat || {}).reg || []).includes(r)).reduce((a, x) => a + x.min, 0);
  const share = () => { const R = anStat(c, c.sessions), t = Object.values(R.dist.reg).reduce((a, b) => a + b, 0); return t ? (R.dist.reg[r] || 0) / t : 0; };
  const changed = [];
  for (let round = 0; round < 2 && share() < 0.08; round++) {
    const order = list.slice().sort((a, b) => regMin(a) - regMin(b));
    for (const s of order) {
      if (share() >= 0.08) break;
      const ctx = anCtx(c, s);
      const cands = eligible(exAll().filter(e => e.c !== 'kraft' && ((e.kat || {}).reg || []).includes(r)), ctx).map(e => ({ e, sc: scoreEx(e, ctx) })).sort((a, b) => b.sc - a.sc);
      for (const { e } of cands) if (anSwapIn(s, e, v => ((v.kat || {}).reg || []).includes(r))) { changed.push(s); break; }
    }
  }
  return changed;
}
function fixFreq(c, id, list) {
  const usage = anUsage(c), occ = [];
  c.sessions.forEach(s => exKeys(s).filter(k => bon(s, k)).forEach(k => (s.blk[k] || []).forEach((it, idx) => { if (it.id === id) occ.push({ s, k, idx }); })));
  let n = occ.length; const changed = [];
  for (let i = occ.length - 1; i >= 0 && n > 3; i--) {
    const o = occ[i]; if (!list.includes(o.s)) continue;
    if (anReplace(c, o.s, o.k, o.idx, usage)) { n--; changed.push(o.s); }
  }
  return changed;
}
function fixGeb(c, list) {
  const usage = anUsage(c), changed = [];
  list.forEach(s => { const geb = effGeb(c, s); exKeys(s).filter(k => bon(s, k)).forEach(k => (s.blk[k] || []).forEach((it, idx) => { const e = exById(it.id); if (e && contra(e, geb) && anReplace(c, s, k, idx, usage)) changed.push(s); })); });
  return changed;
}
function fixPeak(c, list) {
  const changed = [];
  list.forEach(s => {
    if (anItems(s).some(x => x.e.peak) || !bon(s, 'asana') || bty(s, 'asana') !== 'ex' || !(s.blk.asana || []).length) return;
    const ctx = anCtx(c, s), pk = pickPeak(ctx); if (!pk) return;
    const arr = s.blk.asana; let vi = -1, bd = 1e9;
    arr.forEach((it, i) => { const d = Math.abs((+it.min || 0) - pk.m) + (rating(it.id) - 3) * 0.5; if (d < bd) { bd = d; vi = i; } });
    arr.splice(vi, 1); const pi = mkItem(pk); if (ctx.lvl !== 'fort') pi.peakAlt = true; arr.push(pi); applyAlt(s, pi); changed.push(s);
  });
  return changed;
}
function fixTime(c, list) { const changed = []; list.forEach(s => { if (Math.abs(plannedTotal(s) - sessionTotal(s)) > 1.01) { fitSession(c, s); changed.push(s); } }); return changed; }
function fixLevel(c, list) {
  const changed = [];
  list.forEach(s => { const lvl = effLevel(c, s); exKeys(s).filter(k => bon(s, k)).forEach(k => (s.blk[k] || []).forEach((it, idx) => {
    const e = exById(it.id); if (!e || e.peak) return;
    const alt = lvl === 'fort' ? (e.lv < 2 ? altH(e) : null) : (e.lv > (lvl === 'anf' ? 1 : 2) ? altE(e) : null);
    if (alt && !alt.peak && !blkIds(s).includes(alt.id) && (lvl === 'fort' || levelOk(alt, lvl))) { anPut(s, k, idx, alt); changed.push(s); }
  })); });
  return changed;
}
const AN_FIX = {
  reg: { f: (c, v, l) => fixRegion(c, v, l), what: v => `Körperregion „${KAT.reg[v]}“ durch passende Übungen verstärken` },
  freq: { f: (c, v, l) => fixFreq(c, v, l), what: v => `„${(exById(v) || {}).n}“ in einigen Stunden gegen ähnliche Alternativen austauschen (max. 3× im Programm)` },
  geb: { f: (c, v, l) => fixGeb(c, l), what: () => 'belastende Übungen gegen passende Alternativen austauschen' },
  peak: { f: (c, v, l) => fixPeak(c, l), what: () => 'in Stunden ohne Peak Pose eine Peak Pose (★) einbauen' },
  time: { f: (c, v, l) => fixTime(c, l), what: () => 'die Übungsminuten an die Blockzeiten angleichen' },
  level: { f: (c, v, l) => fixLevel(c, l), what: () => 'Übungen durch leichtere bzw. schwerere Alternativen ersetzen, wo es sie gibt' }
};
function hintLi(h, c, asDoc) {
  if (typeof h === 'string') return `<li>${h}</li>`;
  if (!h.act || asDoc) return `<li>${h.text}</li>`;
  const a = h.act, list = a.sid ? anEditable(c).filter(s => s.id === a.sid) : anEditable(c), dis = !list.length;
  return `<li>${h.text} <button class="sm anfix noprint" data-a="anFix" data-t="${a.t}" data-v="${esc(a.v || '')}" data-sid="${a.sid || ''}" ${dis ? 'disabled' : ''} title="${dis ? 'Alle betroffenen Stunden stehen auf „Fertig“ oder sind gesperrt' : 'Automatisch ändern (' + list.length + ' Stunde(n) nicht „Fertig“)'}">Ändern</button></li>`;
}
function anFix(d) {
  const c = cur(), fx = AN_FIX[d.t]; if (!c || !fx) return;
  const list = d.sid ? anEditable(c).filter(s => s.id === d.sid) : anEditable(c);
  if (!list.length) { toast('Alle betroffenen Stunden stehen auf „Fertig“ oder sind gesperrt.'); return; }
  if (!confirm(`Automatische Änderung: ${fx.what(d.v)}.\n\nBetroffen: ${list.length} Stunde(n), die nicht auf „Fertig“ stehen. Geänderte Stunden gehen auf „In Planung“. Fortfahren?`)) return;
  const changed = fx.f(c, d.v, list), set = new Set(changed);
  set.forEach(s => { s.status = 'in_planung'; });
  save(); render();
  toast(set.size ? `${set.size} Stunde(n) angepasst.` : 'Es war keine passende Änderung möglich.');
}
