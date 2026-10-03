/* Player: spielt eine Stunde als Sequenz ab (Übungen, Atem, Mantra, Textblöcke) mit Countdown.
   Minimalistisch: Gesamtzeit, Zeit der aktuellen Übung, aktuelle und nächste Kachel.
   Detailplayer: zusätzlich Anleitung, „Auf was achten“ und bei Textblöcken der vollständige Text. */
const PL = { run: null, timer: null };
const plFmt = sec => { sec = Math.max(0, Math.round(sec)); const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60; return (h ? h + ':' + String(m).padStart(2, '0') : String(m)) + ':' + String(s).padStart(2, '0'); };
const plParas = t => String(t || '').split(/\n{2,}/).filter(x => x.trim()).map(p => '<p>' + esc(p).replace(/\n/g, '<br>') + '</p>').join('');

// Symbole für den Detailplayer (gleicher Linienstil)
const PLI = {
  cue: '<path d="M5 6h14v9h-8l-4 4v-4H5z"/>', breath: '<path d="M3 9h10a3 3 0 1 0-3-3M3 14h14a3 3 0 1 1-3 3M3 19h6"/>',
  hand: '<path d="M8 13V6.5a1.5 1.5 0 0 1 3 0V11M11 11V4.5a1.5 1.5 0 0 1 3 0V11M14 11V6.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-.5A5.5 5.5 0 0 1 6 18l-3-4.5a1.5 1.5 0 0 1 2.4-1.8L8 15"/>',
  support: '<circle cx="8" cy="7" r="2.5"/><circle cx="16.5" cy="7" r="2.5"/><path d="M3 20v-3a5 5 0 0 1 10 0v3M12 20v-3a5 5 0 0 1 9 0v3"/>',
  mat: '<rect x="3" y="9" width="18" height="8" rx="3"/><path d="M7 9v8M17 9v8" opacity=".5"/>', warn: '<path d="M12 4l9 16H3z"/><path d="M12 10v5M12 17.5h.1"/>',
  wirk: '<path d="M12 3l2.3 5.7L20 9.5l-4.3 3.8L17 19l-5-3-5 3 1.3-5.7L4 9.5l5.7-.8z"/>', clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2"/>'
};
const pliSvg = (k, size) => `<svg class="pli" viewBox="0 0 24 24" width="${size || 22}" height="${size || 22}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PLI[k] || ''}</svg>`;
const plSentences = t => String(t || '').split(/(?<=[.!?])\s+/).map(x => x.trim()).filter(Boolean);
// Detailplayer-Inhalt: kurze Anleitung (zum Ansagen), Atmung, Hands-on (Adjustment / Support / Material), Hinweise
function plDetHtml(det) {
  return det.map(g => `<div class="pds${g.w ? ' pdw' : ''}"><h4>${pliSvg(g.ic, 22)}<span>${esc(g.h)}</span></h4>${g.items ? '<ul>' + g.items.map(i => '<li>' + esc(i) + '</li>').join('') + '</ul>' : ''}${g.paras ? g.paras.map(x => '<p>' + esc(x).replace(/\n/g, '<br>') + '</p>').join('') : ''}</div>`).join('');
}
// Schritte der Stunde in Reihenfolge der Blöcke
function plSteps(c, s) {
  const steps = [], tile = (cls, svg, star) => `<div class="pltile ${cls}">${svg}${star || ''}</div>`;
  order(s).filter(k => bon(s, k)).forEach(k => {
    const ty = bty(s, k), ab = abOf(s, k), name = bn(s, k);
    if (ty === 'ex') {
      (s.blk[k] || []).forEach(it => {
        const e = exById(it.id); if (!e) return;
        if (e.txt) { // Sonderbaustein Textblock: Text wie ein Textblock der Stunde anzeigen
          const d = +it.min || 1;
          steps.push({ block: name, title: 'Text', sub: name, min: d, cls: 'cat-textblock', tile: tile('cat-textblock', figureSVG('textblock')), det: [{ ic: 'cue', h: 'Text', paras: String(it.tx || '').split(/\n{2,}/).filter(x => x.trim()) }], text: true });
          return;
        }
        const kraft = e.c === 'kraft' && e.how, ea = altE(e), ha = altH(e), lab = key => katLabels(e, key);
        const cues = plSentences(kraft ? e.how : e.d).slice(0, 4);
        const achten = [].concat(kraft ? (e.ev ? [e.ev] : []) : (e.w ? [e.w] : []), (e.x || []).length ? ['Vorsicht bei: ' + e.x.map(g => GEBRECHEN[g]).join(', ')] : []);
        const hands = [['Adjustment', lab('auf')], ['Support / Assistenz', lab('sup')]];
        const det = [];
        det.push({ ic: 'cue', h: 'Anleiten', items: cues.length ? cues : ['Übung ansagen und vormachen; Atem und Bewegung verbinden.'] });
        if (lab('atm').length) det.push({ ic: 'breath', h: 'Atmung', items: lab('atm') });
        const hOn = [].concat(...hands.map(([t, v]) => v.map(x => t + ': ' + x)));
        det.push({ ic: 'hand', h: 'Hands-on', items: hOn.length ? hOn : ['Kein Hands-on im Katalog hinterlegt – Haltung ansagen und bei Bedarf verbal korrigieren.'] });
        if (lab('mat').length) det.push({ ic: 'mat', h: 'Material', items: lab('mat') });
        if (achten.length) det.push({ ic: 'warn', h: 'Auf was achten', items: achten, w: true });
        const vari = [].concat(ea ? ['↓ leichter: ' + ea.n] : [], ha ? ['↑ anspruchsvoller: ' + ha.n] : []);
        if (vari.length) det.push({ ic: 'wirk', h: 'Varianten', items: vari });
        steps.push({ block: name, title: e.n, sub: e.sa || '', min: +it.min || e.m || 1, cls: 'cat-' + e.c, tile: tile('cat-' + e.c, figureSVG(e.pose), peakStar(e)), det, dur: [fmtMin(+it.min || e.m || 1) + ' Min.'].concat(it.rep ? [it.rep] : []).join(' · ') });
      });
    } else if (ty === 'atem') {
      const d = +s.dur[k] || 0, a = BR.find(b => b.id === (s.atem && s.atem.a)), w = BR.find(b => b.id === (s.atem && s.atem.w));
      const m1 = w ? Math.max(1, Math.round(d * .55)) : d, m2 = w ? Math.max(1, d - m1) : 0;
      [[a, m1, 'Atemübung'], [w, m2, 'Wahrnehmungsübung']].forEach(([b, m, lab]) => {
        if (!b || !(m > 0)) return;
        steps.push({ block: name, title: b.n, sub: lab, min: m, cls: 'cat-br_' + b.k, tile: tile('cat-br_' + b.k, breathIconSVG(b.id)), det: [{ ic: 'cue', h: 'Anleiten', items: String(b.txt || '').split('\n').map(x => x.trim()).filter(Boolean) }, { ic: 'warn', h: 'Auf was achten', w: true, items: [].concat(b.w ? [b.w] : [], ['Wenn Gedanken abschweifen, freundlich zum Atem zurückkehren. Bei Schwindel oder Unwohlsein zum natürlichen Atem zurückkehren.']) }] });
      });
    } else if (ty === 'mantra') {
      const m = s.mantra && manById(s.mantra.id), d = +s.dur[k] || 0; if (!m || !(d > 0)) return;
      steps.push({ block: name, title: 'Mantra: ' + m.n.replace(/\s*\(.*$/, ''), sub: MAN_TYP[m.typ] || '', min: d, cls: 'cat-mantra_t', tile: tile('cat-mantra_t', manIconSVG(m.id)), det: [{ ic: 'cue', h: 'Mantra', items: m.text }, { ic: 'breath', h: 'Anleiten', paras: String(s.tx.mantra || '').split(/\n{2,}/).filter(x => x.trim()) }] });
    } else {
      const d = +s.dur[k] || 0; if (!(d > 0)) return;
      steps.push({ block: name, title: name, sub: '', min: d, cls: 'cat-' + bcls(k), tile: tile('cat-' + bcls(k), `<svg class="fig" viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${PL_TEXTICON}</g></svg>`), det: [{ ic: 'cue', h: 'Text', paras: String(s.tx[k] || '').split(/\n{2,}/).filter(x => x.trim()) }], text: true });
    }
  });
  steps.forEach(st => { st.html = plDetHtml(st.det); });
  return steps;
}
const PL_TEXTICON = '<path d="M22 18h56v58H22z"/><path d="M32 34h36M32 46h36M32 58h24"/>';

// Auswahlseite (Seite „Stunden“): welche Stunde soll abgespielt werden?
function viewPlayers(kind) {
  const det = kind === 'playDet';
  const singles = state.courses.filter(c => c.single && !c.template && c.sessions.length), progs = state.courses.filter(c => !c.single && !c.template && c.sessions.length);
  const hero = `<div class="hero">${LOTUS}<div><h1>${det ? 'Detailplayer' : 'Minimalistischer Player'}</h1><p>${det ? 'Spielt die Stunde ab und zeigt zusätzlich Anleitung, Hinweise und die Texte der Textblöcke.' : 'Spielt die Stunde ab: Gesamtzeit, Zeit der Übung, aktuelle und nächste Kachel.'} Stunde zum Abspielen wählen:</p></div><span class="grow"></span></div>`;
  const play = (c, s, lab) => `<button class="pill pillw" data-a="plPlay" data-id="${c.id}" data-sid="${s.id}" data-m="${det ? 'det' : 'min'}">${lab}</button>`;
  const sc = singles.map(c => { const s = c.sessions[0]; return `<div class="card course"><div class="grow"><b>${esc(c.name)}</b><div class="meta">${esc((s.motto || {}).title || '')} · ${fmtMin(plannedTotal(s))} Min.${s.date ? ' · ' + esc(fmtDateW(s.date)) : ''}</div></div><button class="primary" data-a="plPlay" data-id="${c.id}" data-sid="${s.id}" data-m="${det ? 'det' : 'min'}">▶ Abspielen</button></div>`; }).join('') || '<p class="muted">Noch keine Einzelstunde angelegt.</p>';
  const pc = progs.map(c => `<div class="card plpcard"><div class="grow"><b>${esc(c.name)}</b><div class="pills plps">${c.sessions.map((s, i) => `<button class="pill" data-a="plPlay" data-id="${c.id}" data-sid="${s.id}" data-m="${det ? 'det' : 'min'}" title="${esc((s.motto || {}).title || '')}">▶ ${i + 1}<small>${esc(fmtDateS(s.date))}</small></button>`).join('')}</div></div></div>`).join('');
  return hero + `<h3 class="plh">Einzelstunden</h3>` + sc + (pc ? `<h3 class="plh">Stunden aus Programmen</h3>` + pc : '');
}

// ---------- Player ----------
function plRender() {
  const r = PL.run; if (!r) return; const st = r.steps[r.i], nx = r.steps[r.i + 1], det = r.mode === 'det';
  let o = document.getElementById('plr');
  if (!o) { o = document.createElement('div'); o.id = 'plr'; document.body.appendChild(o); document.body.classList.add('plon'); }
  o.className = 'plr ' + (det ? 'pdet' : 'pmin');
  if (r.done) { o.innerHTML = `<div class="plt"><span class="pln">${esc(r.title)}</span><span class="grow"></span><button class="plx" data-a="plClose" title="Schließen (Esc)">✕</button></div><div class="pldone"><div>Namaste 🙏</div><small>${esc(r.title)} · ${plFmt(r.sum)} gespielt</small><div class="plctl"><button data-a="plRestart">↺ Von vorn</button><button data-a="plClose">Schließen</button></div></div>`; return; }
  o.innerHTML = `<div class="plt"><span class="pln">${esc(r.title)}</span><span class="grow"></span><span class="plall">Gesamt <b id="plTot"></b></span><button class="plx" data-a="plClose" title="Schließen (Esc)">✕</button></div>
<div class="plprog"><i id="plProg"></i></div>
<div class="plmain">
<div class="plcur"><div class="plblk">${esc(st.block)} · ${r.i + 1} / ${r.steps.length}</div>${st.tile}<div class="plname">${esc(st.title)}</div>${st.sub ? `<div class="plsub">${esc(st.sub)}</div>` : ''}<div class="plcd" id="plCd"></div><div class="plbar"><i id="plBar"></i></div></div>
${det ? `<div class="pldet"><div class="pdh">${st.text ? 'Text' : 'Anleiten & Hands-on'}${st.dur ? '<span>' + esc(st.dur) + '</span>' : ''}</div><div class="pdb">${st.html}</div></div>` : ''}
<div class="plnext">${nx ? `<div class="plnl">Danach</div>${nx.tile.replace('class="pltile', 'class="pltile sm')}<div class="plnn">${esc(nx.title)}</div><div class="plnm">${fmtMin(nx.min)} Min.</div>` : '<div class="plnl">Danach</div><div class="plnn">Schlussruhe 🙏</div>'}</div>
</div>
<div class="plctl"><button data-a="plPrev" title="Zurück (←)">⏮</button><button data-a="plToggle" id="plPP" class="plpp" title="Pause / Weiter (Leertaste)">${r.running ? '⏸' : '▶'}</button><button data-a="plNext" title="Weiter (→)">⏭</button></div>`;
  plTick(true);
}
function plTick(force) {
  const r = PL.run; if (!r || r.done) return; const now = Date.now();
  if (r.running && !force) { const dt = (now - r.last) / 1000; r.left -= dt; r.tot -= dt; }
  r.last = now;
  while (r.left <= 0) { const nxt = r.i + 1; if (nxt >= r.steps.length) { r.done = true; plStop(); plRender(); return; } r.tot = Math.max(0, r.tot + r.left); r.i = nxt; r.left = r.steps[nxt].min * 60 + r.left; plRender(); return; }
  const st = r.steps[r.i], q = id => document.getElementById(id);
  if (q('plCd')) q('plCd').textContent = plFmt(r.left); if (q('plTot')) q('plTot').textContent = plFmt(r.tot);
  if (q('plBar')) q('plBar').style.width = Math.min(100, (1 - r.left / (st.min * 60)) * 100) + '%';
  if (q('plProg')) q('plProg').style.width = Math.min(100, (1 - r.tot / r.sum) * 100) + '%';
}
function plStop() { clearInterval(PL.timer); PL.timer = null; }
function plGo(i) { const r = PL.run; if (!r) return; if (r.done && r.running && !PL.timer) PL.timer = setInterval(() => plTick(false), 250); r.done = false; r.i = Math.max(0, Math.min(r.steps.length - 1, i)); r.left = r.steps[r.i].min * 60; r.tot = r.steps.slice(r.i).reduce((a, x) => a + x.min * 60, 0); r.last = Date.now(); plRender(); }
document.addEventListener('keydown', e => {
  if (!PL.run) return; if (e.key === 'Escape') { PLAYER_ACTIONS.plClose(); return; }
  if (e.key === ' ') { e.preventDefault(); PLAYER_ACTIONS.plToggle(); } else if (e.key === 'ArrowRight') PLAYER_ACTIONS.plNext(); else if (e.key === 'ArrowLeft') PLAYER_ACTIONS.plPrev();
});
const PLAYER_ACTIONS = {
  plPlay(d) {
    const c = state.courses.find(x => x.id === d.id), s = c && c.sessions.find(x => x.id === d.sid); if (!s) return;
    const steps = plSteps(c, s); if (!steps.length) { toast('Diese Stunde hat keine abspielbaren Inhalte.'); return; }
    const sum = steps.reduce((a, x) => a + x.min * 60, 0);
    PL.run = { mode: d.m === 'det' ? 'det' : 'min', steps, i: 0, left: steps[0].min * 60, tot: sum, sum, running: true, done: false, last: Date.now(), title: c.single ? c.name : `${c.name} – ${s.motto.title}` };
    plStop(); PL.timer = setInterval(() => plTick(false), 250); plRender();
  },
  plClose() { plStop(); PL.run = null; const o = document.getElementById('plr'); if (o) o.remove(); document.body.classList.remove('plon'); },
  plToggle() { const r = PL.run; if (!r || r.done) return; r.running = !r.running; r.last = Date.now(); const b = document.getElementById('plPP'); if (b) b.textContent = r.running ? '⏸' : '▶'; },
  plNext() { const r = PL.run; if (r && !r.done) { if (r.i + 1 >= r.steps.length) { r.done = true; plStop(); plRender(); } else plGo(r.i + 1); } },
  plPrev() { const r = PL.run; if (!r) return; if (!r.done && r.left < r.steps[r.i].min * 60 - 3) plGo(r.i); else plGo(r.i - 1); },
  plRestart() { const r = PL.run; if (!r) return; plStop(); r.running = true; PL.timer = setInterval(() => plTick(false), 250); plGo(0); }
};
