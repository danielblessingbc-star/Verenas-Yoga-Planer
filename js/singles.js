/* Einzelstunden: eigene Seite „Stunden“ (Einzelstunden und Einzelstunden-Vorlagen) und Programme aus Einzelstunden-Vorlagen.
   Eine Einzelstunde ist technisch ein Programm mit genau einer Stunde (c.single = true); eine Vorlage zusätzlich c.template = true. */
const isSingle = c => !!(c && c.single);
const deepCopy = o => JSON.parse(JSON.stringify(o));

function viewSingles() {
  if (ui.sTab === 'aiGen') return viewAiGen();
  const pt = ui.sTab || 'list', ss = state.courses.filter(c => c.single && !c.template), ts = state.courses.filter(c => c.single && c.template);
  const card = c => { const s = c.sessions[0] || {}; return `<div class="card course"><div class="grow"><a class="title" data-a="open" data-id="${c.id}">${esc(c.name)}</a>
<div class="meta">${esc((s.motto || {}).title || '')} · ${esc(LEVELS[c.level])} · ${c.sessions[0] ? sessionTotal(c.sessions[0]) : c.total} Min.${s.date ? ' · ' + esc(fmtDateW(s.date)) : ''}${s.status ? ' · ' + esc(STATUS[s.status] || '') : ''}</div></div>
<button data-a="open" data-id="${c.id}" class="primary">Öffnen</button><button data-a="dup" data-id="${c.id}" class="ghost" title="Duplizieren">⧉</button><button data-a="del" data-id="${c.id}" class="ghost danger" title="Löschen">🗑</button></div>`; };
  const tcard = (t, manage) => { const s = t.sessions[0] || {}; return `<div class="card course"><div class="grow"><b>${esc(t.name)}</b><div class="meta">Einzelstunden-Vorlage · ${esc((s.motto || {}).title || '')} · ${esc(LEVELS[t.level])} · ${t.sessions[0] ? sessionTotal(t.sessions[0]) : t.total} Min.</div></div>
<button data-a="tplSel" data-id="${t.id}" class="primary">Einzelstunde daraus erstellen</button>${manage ? `<button data-a="open" data-id="${t.id}" class="ghost" title="Vorlage ansehen / bearbeiten">Öffnen</button><button data-a="del" data-id="${t.id}" class="ghost danger" title="Löschen">🗑</button>` : ''}</div>`; };
  const hero = (t, p) => `<div class="hero">${LOTUS}<div><h1>${t}</h1><p>${p}</p></div><span class="grow"></span></div>`;
  const noTpl = '<p class="muted">Noch keine Einzelstunden-Vorlage. In der Einzelstundenplanung eines Programms oder einer Einzelstunde gibt es „★ Als Einzelstunden-Vorlage“.</p>';
  const form = tplForm();
  if (pt === 'tpl') return hero('Vorhandene Vorlagen', 'Gespeicherte Einzelstunden – ansehen, bearbeiten oder löschen.') + form + (ts.length ? ts.map(t => tcard(t, true)).join('') : noTpl);
  if (pt === 'fromTpl') return hero('Einzelstunde aus Vorlage', 'Vorlage wählen – daraus entsteht eine neue, eigene Einzelstunde.') + form + (ts.length ? ts.map(t => tcard(t, true)).join('') : noTpl);
  return hero('Meine Einzelstunden', 'Einzelne Yogastunden planen, als Vorlage speichern und später in Programme übernehmen.')
    + (ss.length ? ss.map(card).join('') : '<p class="muted">Noch keine Einzelstunde angelegt. Mit „Neue Einzelstunde“ oder „Einzelstunde aus Vorlage“ (zweite Zeile oben) startest du.</p>');
}


// Formular „aus Vorlage erstellen“ (ohne Browser-Dialog): Name und Datum direkt auf der Seite
// Formular „Stunde als Vorlage / Einzelstunde speichern“ (in der Einzelstundenplanung eines Programms)
function sessSaveForm(s) {
  const f = ui.saveSess; if (!f || f.id !== s.id) return '';
  const tpl = f.kind === 'tpl';
  return `<section class="panel noprint tpf" id="ssf"><h3>${tpl ? '★ Als Einzelstunden-Vorlage speichern' : '⧉ Als Einzelstunde speichern'}</h3><div class="grid">${fld('Name', inp('u:saveSess.name', 'text', f.name, 'placeholder="z. B. Ruhige Abendstunde"'), 'wide')}</div>
<div class="bar"><button class="primary" data-a="ssCommit">Speichern</button><button class="ghost" data-a="ssCancel">Abbrechen</button><span class="muted">${tpl ? 'Die Vorlage erscheint unter „Stunden“ → „＋ Einzelstunde aus Vorlage“ und beim Zusammenstellen von Programmen.' : 'Die Einzelstunde erscheint unter „Stunden“ → „Vorhandene Einzelstunden“.'}</span></div></section>`;
}

function tplForm() {
  const f = ui.tplSel; if (!f) return '';
  const t = state.courses.find(x => x.id === f.id) || (f.id.startsWith('builtin:') ? { name: BUILTIN[+f.id.slice(8)].name, single: false } : null); if (!t) return '';
  const single = !!t.single;
  return `<section class="panel noprint tpf"><h3>${single ? 'Einzelstunde' : 'Programm'} aus Vorlage „${esc(t.name)}“ erstellen</h3><div class="grid">
${fld(single ? 'Name der Einzelstunde' : 'Name des Programms', inp('u:tplSel.name', 'text', f.name), 'wide')}${fld(single ? 'Datum' : 'Startdatum der ersten Stunde', inp('u:tplSel.start', 'date', f.start))}</div>
<div class="bar"><button class="primary" data-a="tplCreate">${single ? 'Einzelstunde erstellen' : 'Programm erstellen'}</button><button class="ghost" data-a="tplCancel">Abbrechen</button></div></section>`;
}
// ---------- Programm aus Einzelstunden: Baukasten (Parameter oben, Slots darunter) ----------
const buildDefault = () => ({ name: 'Neues Programm ' + fmtDate(todayIso()), count: 4, start: todayIso(), rhythm: 'weekly', days: [], pauses: '', level: '', slots: [null, null, null, null], pick: null });
function buildSlots(b) { b.count = Math.max(1, Math.min(40, +b.count || 1)); while (b.slots.length < b.count) b.slots.push(null); b.slots.length = b.count; if (b.pick && b.pick.i >= b.count) b.pick = null; }
const slotSource = sl => sl && sl.kind !== 'new' ? state.courses.find(c => c.id === sl.id) : null;
function buildPanel() {
  const b = ui.build; if (!b) return '';
  buildSlots(b);
  const dummy = { count: b.count, start: b.start, rhythm: b.rhythm, days: b.days, pauses: b.pauses, sessions: b.slots.map(() => ({ date: '' })) }; calcDates(dummy);
  const singles = state.courses.filter(c => c.single && !c.template), tpls = state.courses.filter(c => c.single && c.template);
  const days = [[1, 'Mo'], [2, 'Di'], [3, 'Mi'], [4, 'Do'], [5, 'Fr'], [6, 'Sa'], [0, 'So']];
  const filled = b.slots.filter(Boolean).length;
  const params = `<section class="panel span2 bld"><h3><span class="pn">1</span>Parameter des Programms</h3><p class="phint">Name, Anzahl der Stunden und Termine – die Stunden selbst füllst du darunter in den Slots.</p><div class="grid">
${fld('Name des Programms', inp('u:build.name', 'text', b.name, 'placeholder="z. B. Herbstprogramm"'), 'wide')}
${fld('Anzahl Stunden', inp('u:build.count', 'number', b.count, 'min="1" max="40"'))}
${fld('Startdatum (1. Stunde)', inp('u:build.start', 'date', b.start))}
${fld('Rhythmus', sel('u:build.rhythm', [['weekly', 'Wöchentlich'], ['biweekly', 'Zweiwöchentlich'], ['days', 'Ausgewählte Wochentage']], b.rhythm))}
${fld('Gruppe', sel('u:build.level', [['', 'wie erste gewählte Stunde (sonst Senioren)']].concat(Object.keys(LEVELS).map(k => [k, LEVELS[k]])), b.level))}
${b.rhythm === 'days' ? fld('Wochentage', `<div class="fchips">${days.map(([n, l]) => `<label class="fchip${(b.days || []).includes(n) ? ' on' : ''}"><input type="checkbox" data-a="bday" data-k="${n}" ${(b.days || []).includes(n) ? 'checked' : ''}> ${l}</label>`).join('')}</div>`) : ''}
${fld('Pausen / Ferien (Datum oder „von bis“, getrennt mit ;)', inp('u:build.pauses', 'text', b.pauses, 'placeholder="27.10.2026; 22.12.2026 bis 05.01.2027"'), 'wide')}
</div></section>`;
  const opt = (kind, list) => !b.pick ? '' : `<div class="bpick">${list.length ? list.map(c => { const s = c.sessions[0] || {}; return `<button class="bopt" data-a="bpick" data-i="${b.pick.i}" data-kind="${kind}" data-id="${c.id}"><b>${esc(c.name)}</b><small>${esc((s.motto || {}).title || '')} · ${c.sessions[0] ? sessionTotal(c.sessions[0]) : c.total} Min.</small></button>`; }).join('') : `<p class="muted">${kind === 'single' ? 'Noch keine Einzelstunden vorhanden (Seite „Stunden“).' : 'Noch keine Einzelstunden-Vorlagen vorhanden.'}</p>`}<button class="ghost sm" data-a="bpickx">Abbrechen</button></div>`;
  const slot = (sl, i) => {
    const d = dummy.sessions[i].date, src = slotSource(sl), isPick = b.pick && b.pick.i === i;
    let body;
    if (sl && sl.kind === 'new') body = `<div class="bsum"><span class="bk bk-new">Neu generiert</span><span class="muted">wird beim Erstellen mit den Vorgaben des Programms zusammengestellt (Motto automatisch)</span><button class="ghost sm" data-a="bclear" data-i="${i}">Ändern</button></div>`;
    else if (sl && src) { const s = src.sessions[0] || {}; body = `<div class="bsum"><span class="bk bk-${sl.kind}">${sl.kind === 'tpl' ? 'Vorlage' : 'Einzelstunde'}</span><b>${esc(src.name)}</b><span class="muted">${esc((s.motto || {}).title || '')} · ${s.id ? sessionTotal(s) : ''} Min.</span><button class="ghost sm" data-a="bclear" data-i="${i}">Ändern</button></div>${s.id ? `<div class="scf bflat">${flatTiles(s)}</div>` : ''}`; }
    else body = `<div class="bchoice"><button class="bbtn${isPick && b.pick.kind === 'single' ? ' on' : ''}" data-a="bkind" data-i="${i}" data-kind="single">☰ Vorhandene Einzelstunde</button><button class="bbtn${isPick && b.pick.kind === 'tpl' ? ' on' : ''}" data-a="bkind" data-i="${i}" data-kind="tpl">★ Vorlage</button><button class="bbtn" data-a="bkind" data-i="${i}" data-kind="new">✨ Neu generieren</button></div>${isPick ? opt(b.pick.kind, b.pick.kind === 'single' ? singles : tpls) : ''}`;
    return `<div class="bslot${sl ? ' filled' : ''}"><div class="bsh"><span class="no">${i + 1}</span><b>Stunde ${i + 1}</b><span class="muted">${esc(fmtDateW(d) || '')}</span></div>${body}</div>`;
  };
  const slots = `<section class="panel span2 bld"><h3><span class="pn">2</span>Stunden des Programms <span class="muted" style="font:13px var(--sans,inherit)">· ${filled} von ${b.count} belegt</span></h3><p class="phint">Pro Slot: eine vorhandene Einzelstunde, eine Vorlage oder eine neu generierte Stunde einsetzen.</p>${b.slots.map(slot).join('')}
<div class="bar"><button class="primary" data-a="bcreate" ${filled ? '' : 'disabled'}>Programm erstellen</button><button data-a="bfill" ${filled < b.count ? '' : 'disabled'} title="Alle leeren Slots als neu generierte Stunde belegen">✨ Leere Slots neu generieren</button><button class="ghost" data-a="bcancel">Abbrechen</button></div></section>`;
  return `<div class="fcards">${params}${slots}</div>`;
}

const SINGLE_ACTIONS = {
  newSingle() {
    const c = defaultCourseFixed({ name: 'Neue Einzelstunde ' + fmtDate(todayIso()), count: 1, single: true });
    startCourse(c); ui.doc.ueb = false; ui.doc.sel = '0';
  },
  // Leere Einzelstunden-Vorlage: Struktur (Blöcke, Zeiten) wie in den Vorgaben, aber ohne vorausgewählte Übungen, Mantra und Atemteil
  newEmptyTpl() {
    const c = defaultCourseFixed({ name: 'Neue Vorlage ' + fmtDate(todayIso()), count: 1, single: true, template: true });
    startCourse(c);
    const s = c.sessions[0]; EXKEYS.forEach(k => { s.blk[k] = []; }); s.mantra = null; s.atem = { a: '', w: '' };
    s.txEdited = {}; genTexts(c, s, 0); ui.doc.ueb = false; ui.doc.sel = '0'; save(); render();
    toast('Leere Vorlage angelegt: Vorgaben prüfen, dann in der Einzelstundenplanung Übungen wählen.', 5000);
  },
  // Speichern als Einzelstunden-Vorlage bzw. Einzelstunde: Name direkt auf der Seite eingeben (ohne Browser-Dialog)
  saveSessTpl(d) { SINGLE_ACTIONS._ss(d, 'tpl'); },
  saveSessSingle(d) { SINGLE_ACTIONS._ss(d, 'single'); },
  _ss(d, kind) {
    const { c, s } = sessionOf(d.id); ui.saveSess = { id: d.id, kind, name: s.motto.title || c.name }; render();
    setTimeout(() => { const f = document.getElementById('ssf'); if (f) { f.scrollIntoView({ block: 'center', behavior: 'smooth' }); const i = f.querySelector('input[type=text]'); if (i) i.focus(); } }, 60);
  },
  ssCancel() { ui.saveSess = null; render(); },
  ssCommit() {
    const f = ui.saveSess; if (!f) return; const { c, s } = sessionOf(f.id), nm = (f.name || '').trim(); if (!nm) { toast('Bitte einen Namen eingeben.'); return; }
    const t = deepCopy(c); t.id = uid(); t.name = nm; t.single = true; t.count = 1; t.created = todayIso(); t.template = f.kind === 'tpl';
    const ns = deepCopy(s); ns.id = uid(); ns.locked = false; if (f.kind === 'tpl') ns.status = 'in_planung'; else t.start = ns.date || t.start; t.sessions = [ns];
    state.courses.unshift(t); ui.saveSess = null; save(); render();
    toast(f.kind === 'tpl' ? `Einzelstunden-Vorlage „${nm}“ gespeichert (Seite „Stunden“ → ＋ Einzelstunde aus Vorlage).` : `Einzelstunde „${nm}“ gespeichert (Seite „Stunden“).`);
  },
  tplSel(d) {
    const bi = d.id.startsWith('builtin:') ? +d.id.slice(8) : -1, src = bi < 0 ? state.courses.find(c => c.id === d.id) : null; if (bi < 0 && !src) return;
    const nm = src ? src.name.replace(/^Vorlage:\s*/, '') : BUILTIN[bi].name;
    ui.tplSel = { id: d.id, name: nm + ' – neu', start: (src && src.start) || todayIso() }; render(); window.scrollTo(0, 0);
  },
  tplCancel() { ui.tplSel = null; render(); },
  tplCreate() {
    const f = ui.tplSel; if (!f) return;
    const bi = f.id.startsWith('builtin:') ? +f.id.slice(8) : -1, src = bi < 0 ? state.courses.find(c => c.id === f.id) : null;
    const tpl = src || defaultCourseFixed(BUILTIN[bi].over), nm = (f.name || '').trim() || (tpl.single ? 'Neue Einzelstunde' : 'Neues Programm');
    const c = cloneCourse(tpl, { name: nm, template: false, start: f.start || todayIso(), created: todayIso() });
    ui.tplSel = null;
    if (src) { calcDates(c); state.courses.unshift(c); ui.view = 'course'; ui.courseId = c.id; ui.tab = 'frame'; ui.pTab = 'list'; ui.sTab = 'list'; save(); render(); } else startCourse(c);
    toast(`„${nm}“ erstellt.`);
  },  ptab(d) { ui.pTab = d.v; if (d.v === 'build' && !ui.build) ui.build = buildDefault(); render(); },
  stab(d) { ui.sTab = d.v; render(); },
  bday(d) { const b = ui.build, k = +d.k, i = b.days.indexOf(k); i < 0 ? b.days.push(k) : b.days.splice(i, 1); render(); },
  bkind(d) { const b = ui.build, i = +d.i; if (d.kind === 'new') { b.slots[i] = { kind: 'new' }; b.pick = null; } else b.pick = (b.pick && b.pick.i === i && b.pick.kind === d.kind) ? null : { i, kind: d.kind }; render(); },
  bpick(d) { const b = ui.build; b.slots[+d.i] = { kind: d.kind, id: d.id }; b.pick = null; render(); },
  bpickx() { ui.build.pick = null; render(); },
  bclear(d) { const b = ui.build; b.slots[+d.i] = null; b.pick = null; render(); },
  bfill() { const b = ui.build; b.slots = b.slots.map(s => s || { kind: 'new' }); b.pick = null; render(); },
  bcancel() { ui.build = null; ui.pTab = 'list'; render(); },
  bcreate() {
    const b = ui.build; if (!b || !b.slots.some(Boolean)) return;
    buildSlots(b);
    const firstSrc = b.slots.map(slotSource).find(Boolean);
    const c = firstSrc ? deepCopy(firstSrc) : defaultCourseFixed({});
    c.id = uid(); c.name = (b.name || '').trim() || 'Neues Programm'; c.template = false; c.single = false; c.created = todayIso(); c.count = b.count;
    c.start = b.start || todayIso(); c.rhythm = b.rhythm; c.days = b.days.slice(); c.pauses = b.pauses; c.dirty = false; c.status = 'in_planung';
    if (b.level) c.level = b.level;
    c.seed = Math.floor(Math.random() * 1e9);
    const mottos = assignMottos(c, b.count);
    c.sessions = b.slots.map((sl, i) => {
      const src = slotSource(sl);
      if (sl && src && src.sessions[0]) { const s = deepCopy(src.sessions[0]); s.id = uid(); s.locked = false; s.status = 'in_planung'; return s; }
      return newSession(c, i, mottos[i]);
    });
    calcDates(c); state.courses.unshift(c); ui.build = null; ui.pTab = 'list'; ui.view = 'course'; ui.courseId = c.id; ui.tab = 'sessions'; ui.sel = c.sessions[0].id; ui.open = new Set(['set', 'ovw']);
    save(); render(); toast(`Programm „${c.name}“ mit ${c.sessions.length} Stunde(n) erstellt.`);
  }
};

// ---------- E-Mail-Empfänger (Einstellungen) ----------
const rcpList = () => state.settings.recipients || (state.settings.recipients = []);
const mailAddrs = c => {
  const ids = c.mailTo || [], fromList = rcpList().filter(r => ids.includes(r.id)).map(r => r.email);
  return [...new Set(fromList.concat(String(c.email || '').split(/[;,]/).map(x => x.trim()).filter(Boolean)))];
};
function rcpPanel() {
  const g = state.settings, list = rcpList(), f = ui.newRcp = ui.newRcp || { name: '', email: '' };
  return `<div class="panel"><h3>E-Mail</h3><div class="grid">${fld('Standard-Empfänger (wird in neue Programme übernommen)', inp('g:email', 'email', g.email), 'wide')}</div>
<h4 class="rcph">Weitere Empfänger</h4><p class="muted">Diese Empfänger kannst du beim Versand (Ausgabe / Versand) per Klick auswählen.</p>
${list.length ? `<div class="rcps">${list.map(r => `<div class="rcp"><span class="rn">${esc(r.name || r.email)}</span><span class="re muted">${esc(r.email)}</span><button class="ghost sm danger" data-a="delRcp" data-id="${r.id}" title="Empfänger entfernen">🗑</button></div>`).join('')}</div>` : '<p class="muted">Noch keine weiteren Empfänger angelegt.</p>'}
<div class="grid">${fld('Name', inp('u:newRcp.name', 'text', f.name, 'placeholder="z. B. Kursleitung Verena"'))}${fld('E-Mail-Adresse', inp('u:newRcp.email', 'email', f.email, 'placeholder="name@example.de"'))}</div>
<div class="bar"><button class="primary" data-a="addRcp">＋ Empfänger hinzufügen</button></div></div>`;
}
const rcpActions = {
  addRcp() {
    const f = ui.newRcp || {}, em = (f.email || '').trim(); if (!/^\S+@\S+\.\S+$/.test(em)) { toast('Bitte eine gültige E-Mail-Adresse eingeben.'); return; }
    rcpList().push({ id: uid(), name: (f.name || '').trim(), email: em }); ui.newRcp = { name: '', email: '' }; save(); render(); toast('Empfänger hinzugefügt.');
  },
  delRcp(d) { const l = rcpList(), i = l.findIndex(r => r.id === d.id); if (i >= 0) l.splice(i, 1); state.courses.forEach(c => { if (c.mailTo) c.mailTo = c.mailTo.filter(x => x !== d.id); }); save(); render(); },
  rcpTog(d) { const c = cur(); c.mailTo = c.mailTo || []; const i = c.mailTo.indexOf(d.id); i < 0 ? c.mailTo.push(d.id) : c.mailTo.splice(i, 1); save(); render(); }
};
