/* KI-generierte Stunde: Seite unter „Stunden“. Vorgaben wie in der Einzelstundenplanung (Name, Motto, Datum, Gruppe, Einschränkungen, Dauer)
   plus Freitext. Die KI wählt Motto, Stil, Körperregion, Atem, Mantra, Mobilisation, Kraft und Wunschübungen; die Übungen selbst kommen
   immer aus dem Katalog (regelbasiert, mit Einschränkungen). Danach schreibt die KI die Texte der Stunde. */
const AIGEN_EXAMPLE = 'Eine ruhige Abendstunde für meine Seniorengruppe zum Thema Loslassen. Schwerpunkt auf Hüfte und unterem Rücken, überwiegend im Sitzen und Liegen, keine Kraftübungen. Zum Anfang ein kurzes Ankommen mit dem Atem, am Ende eine ausführliche Tiefenentspannung. Wenn möglich die Taube in der sanften Variante und die Kindhaltung einbauen. Ein Mantra bitte weglassen. Die Texte sollen sehr ruhig, einfach und warm klingen.';
const aiGenDefault = () => ({ name: '', motto: '', date: todayIso(), level: 'sen', geb: [], total: 75, prompt: '' });

function viewAiGen() {
  const g = ui.aiGen = ui.aiGen || aiGenDefault(), busy = !!ui.aiGenBusy;
  const pn = (n, t, hint) => `<h3><span class="pn">${n}</span>${t}</h3><p class="phint">${hint}</p>`;
  const gebs = Object.keys(GEBRECHEN).map(k => `<label class="fchip${g.geb.includes(k) ? ' on' : ''}"><input type="checkbox" data-a="aiGenGeb" data-k="${k}" ${g.geb.includes(k) ? 'checked' : ''}> ${esc(GEBRECHEN[k])}</label>`).join('');
  const ready = !!(state.settings.apiKey || '').trim();
  return `<div class="hero">${LOTUS}<div><h1>KI-generierte Stunde</h1><p>Du beschreibst die Stunde in eigenen Worten, die KI plant sie. Die Übungen stammen aus deinem Katalog.</p></div><span class="grow"></span></div>
<div class="fcards noprint">
<section class="panel span2"><h2 class="ph">${pn(1, 'Einzelstunde & Motto', 'Name und Motto sind optional: ohne Angabe wählt die KI ein passendes Motto zu deinem Text.')}</h2><div class="grid">
${fld('Name der Einzelstunde', inp('u:aiGen.name', 'text', g.name, 'class="h1in" placeholder="leer = Motto der Stunde"'), 'wide')}
${fld('Motto (optional)', inp('u:aiGen.motto', 'text', g.motto, 'placeholder="z. B. Loslassen"'), 'wide')}
</div></section>
<section class="panel"><h2 class="ph">${pn(2, 'Datum', 'Wann findet die Einzelstunde statt?')}</h2><div class="grid">${fld('Datum', inp('u:aiGen.date', 'date', g.date))}</div></section>
<section class="panel"><h2 class="ph">${pn(3, 'Zielgruppe & Einschränkungen', 'Übungen mit Belastung für die gewählten Bereiche werden nicht eingebaut.')}</h2><div class="grid">
${fld('Gruppe', sel('u:aiGen.level', Object.keys(LEVELS).map(k => [k, LEVELS[k]]), g.level))}
${fld('Einschränkungen / Gebrechen berücksichtigen', `<div class="fchips">${gebs}</div>`, 'wide')}
</div></section>
<section class="panel span2"><h2 class="ph">${pn(4, 'Dauer', 'Gesamtdauer der Stunde. Die Aufteilung auf die Bausteine ergibt sich daraus und lässt sich danach in den Vorgaben ändern.')}</h2><div class="atin">${inp('u:aiGen.total', 'number', g.total, 'min="20" max="180" step="1"')}<span>Minuten</span></div><div class="qd">${[60, 75, 90, 120].map(m => `<button class="qdb${+g.total === m ? ' on' : ''}" data-a="aiGenTotal" data-v="${m}">${m}</button>`).join('')}</div></section>
<section class="panel span2"><h2 class="ph">${pn(5, 'Beschreibung der Stunde', 'Freitext für die KI: Thema, Stimmung, Schwerpunkt, Wunschübungen, Atem, Mantra, Tonfall der Texte.')}</h2>
<div class="fld wide"><label>Dein Wunsch an die KI</label><textarea data-f="u:aiGen.prompt" rows="8" placeholder="Beschreibe die Stunde, z. B. Thema, Schwerpunkt, Stimmung, besondere Wünsche …">${esc(g.prompt)}</textarea></div>
<div class="aigex"><b>Beispiel für einen Prompt</b><p>${esc(AIGEN_EXAMPLE)}</p><button class="ghost sm" data-a="aiGenExample">Beispiel in das Textfeld übernehmen</button></div>
<p class="muted">Die KI steuert: Motto und Kernsatz, Fokus, Yogastil, Körperregion, Atemteil, Mantra, Art der Mobilisation, Anzahl Kraftübungen, Wunschübungen und die Texte. Wunschübungen werden nur eingebaut, wenn sie im Katalog stehen und zu den Einschränkungen passen. Gesendet werden nur dein Text und die Vorgaben, keine Teilnehmerdaten.</p>
</section>
</div>
<div class="bar noprint"><button class="primary" data-a="aiGenCreate" ${busy ? 'disabled' : ''}>${busy ? 'KI plant die Stunde …' : '✨ Stunde generieren'}</button><span class="muted">${ready ? 'Danach landest du in der Einzelstundenplanung und kannst alles anpassen.' : 'Dafür ist ein API-Schlüssel nötig (Einstellungen, Abschnitt „KI-Texte“).'}</span></div>`;
}

// Katalogübung zu einem frei genannten Namen finden (genau, dann Anfang, dann enthalten)
function aiGenFind(name) {
  const n = norm(name); if (n.length < 3) return null;
  const all = exAll().filter(e => !e.txt), nm = e => norm(e.n);
  return all.find(e => nm(e) === n || norm(e.sa || '') === n) || all.find(e => nm(e).startsWith(n)) || all.find(e => nm(e).includes(n)) || all.find(e => nm(e).length >= 6 && n.includes(nm(e))) || null;
}
// Wunschübungen (frei genannte Namen) in eine Stunde einbauen: nur Katalogübungen, die zu den Einschränkungen passen
function aiGenWishes(c, s, wishes) {
  const geb = effGeb(c, s), put = [], miss = [];
  (Array.isArray(wishes) ? wishes : []).slice(0, 8).forEach(w => {
    const e = aiGenFind(String(w)); if (!e) { miss.push(String(w)); return; }
    if (blkIds(s).includes(e.id)) { put.push(e.n); return; }
    if (contra(e, geb) || !anSwapIn(s, e)) miss.push(e.n + ' (passt nicht)'); else put.push(e.n);
  });
  return { put, miss };
}
const aiGenList = m => Object.keys(m).map(k => `${k} (${String(m[k]).replace(/\s*\(.*$/, '')})`).join(', ');
async function aiGenPlan(g) {
  const geb = g.geb.map(k => GEBRECHEN[k]).filter(Boolean);
  const p = `Du bist eine erfahrene Yogalehrerin und hilfst einer Kollegin, eine einzelne Yogastunde zu planen. Die Übungen wählt ihre Software aus ihrem Katalog aus. Du legst nur die Rahmenbedingungen fest und nennst Übungen, die sie ausdrücklich wünscht.
Beschreibung der Kollegin: „${g.prompt.trim()}“
Feste Vorgaben: Gruppe ${LEVELS[g.level]}, Dauer ${g.total} Minuten${geb.length ? ', Einschränkungen: ' + geb.join(', ') : ''}. ${g.motto.trim() ? 'Das Motto ist vorgegeben: „' + g.motto.trim() + '“ (du ergänzt Kernsatz, Fokus und Schlagworte).' : 'Wähle ein passendes Motto.'}
Antworte ausschließlich mit JSON in genau dieser Form:
{"motto":{"title":"2 bis 5 Wörter","kern":"Kernsatz in der Ich-Form","focus":"körperlicher Fokus in Stichworten","tags":["2 bis 4 Schlagworte aus: ${Object.keys(KEYWORDS).join(', ')}"]},
"st":["Yogastile aus: ${aiGenList(STILE)}"],"reg":["Körperregionen aus: ${aiGenList(KAT.reg)}"],
"breath":"aus oder atem oder atem_wahr oder gemischt","mantra":"aus oder immer","mobi":"sitz oder liegen oder stand oder aus","kraft":0,"wish":["Name einer gewünschten Übung"]}
Regeln: st und reg nur füllen, wenn die Beschreibung es deutlich verlangt, sonst leere Listen (leer bedeutet alle). breath: atem = nur Atemübung, atem_wahr = Atem und Wahrnehmungsübung, gemischt = im Wechsel, aus = kein Atemteil. kraft ist die Zahl der Kraftübungen von 0 bis 3. wish enthält nur Übungen, die die Kollegin ausdrücklich nennt, mit gebräuchlichem deutschen Namen. Wenn die Beschreibung etwas nicht erwähnt, wähle sinnvolle Standardwerte. Keine Gedankenstriche.`;
  try { return jsonFrom(await aiCall(p, 2500), '{', '}'); }
  catch (e) { if (/JSON|position/.test(e.message)) throw new Error('Die KI-Antwort war nicht lesbar. Bitte nochmal versuchen.'); throw e; }
}
// Plan der KI auf das Programm (Einzelstunde) übertragen; unbekannte Werte werden ignoriert
function aiGenApply(c, p) {
  const only = (arr, map) => (Array.isArray(arr) ? arr : []).filter(k => map[k]);
  c.st = only(p.st, STILE); c.reg = only(p.reg, KAT.reg);
  if (['aus', 'atem', 'atem_wahr', 'gemischt'].includes(p.breath)) c.breath = p.breath;
  if (['aus', 'immer'].includes(p.mantra)) c.mantra = p.mantra;
  if (['sitz', 'liegen', 'stand', 'aus'].includes(p.mobi)) c.mobi = p.mobi;
  if (p.kraft !== undefined && p.kraft !== null && !isNaN(+p.kraft)) { const n = clamp(Math.round(+p.kraft), 0, 3); c.kraft = n > 0; c.kraftN = n || 1; }
  fitDurs(c, 'total');
}

const AIGEN_ACTIONS = {
  aiGenGeb(d) { const g = ui.aiGen, i = g.geb.indexOf(d.k); i < 0 ? g.geb.push(d.k) : g.geb.splice(i, 1); render(); },
  aiGenTotal(d) { ui.aiGen.total = +d.v; render(); },
  aiGenExample() { ui.aiGen.prompt = AIGEN_EXAMPLE; render(); },
  async aiGenCreate() {
    const g = ui.aiGen; if (!g || ui.aiGenBusy) return;
    if (!(g.prompt || '').trim()) { toast('Bitte beschreibe die Stunde im Textfeld.'); return; }
    if (!(state.settings.apiKey || '').trim()) { toast('Kein API-Schlüssel hinterlegt (Einstellungen, Abschnitt „KI-Texte“).', 6000); return; }
    ui.aiGenBusy = true; render(); toast('KI plant die Stunde …', 30000);
    try {
      const p = await aiGenPlan(g), pm = p.motto || {}, tags = (Array.isArray(pm.tags) ? pm.tags : []).filter(t => KEYWORDS[t]);
      const title = (g.motto || '').trim() || String(pm.title || '').trim() || 'Neue Stunde', kern = String(pm.kern || '').trim() || `Heute darf „${title}“ für mich spürbar werden.`;
      const c = defaultCourseFixed({ name: (g.name || '').trim() || title, count: 1, single: true, start: g.date || todayIso(), level: LEVELS[g.level] ? g.level : 'sen', gebrechen: g.geb.slice(), total: clamp(Math.round(+g.total) || 75, 20, 180), motto: { mode: 'eigen', preset: 'alltag', free: '', eigen: title + ' | ' + kern } });
      aiGenApply(c, p); planCourse(c);
      const s = c.sessions[0], motto = { themeId: '', title, kern, focus: String(pm.focus || '').trim() || focusFromTags(tags.length ? tags : keywordTags(title)), tags: tags.length ? tags : keywordTags(title) };
      fillSession(c, s, 0, { motto });
      const notes = [];
      if (anItems(s).length < 6 && (c.st.length || c.reg.length)) { c.st = []; c.reg = []; fillSession(c, s, 0, { motto }); notes.push('Stil- und Regionsvorgabe war zu eng und wurde nicht angewendet.'); }
      const { put, miss } = aiGenWishes(c, s, p.wish);
      fitSession(c, s);
      if (Math.abs(plannedTotal(s) - sessionTotal(s)) > 1.01) notes.push('Die geplante Zeit weicht um ' + fmtMin(Math.abs(plannedTotal(s) - sessionTotal(s))) + ' Min. von der Soll-Dauer ab (Vorgaben prüfen).');
      s.aiPrompt = g.prompt.trim();
      state.courses.unshift(c); ui.aiGen = null; ui.sTab = 'list'; ui.view = 'course'; ui.courseId = c.id; ui.tab = 'sessions'; ui.sel = s.id; ui.open = new Set(['set', 'ovw']);
      save(); render(); toast('Stunde angelegt, KI schreibt die Texte …', 30000);
      try { await aiTexts(c, s, 0, g.prompt.trim()); save(); render(); toast(`Stunde „${title}“ erstellt.${put.length ? ' Eingebaut: ' + put.join(', ') + '.' : ''}${miss.length ? ' Nicht eingebaut: ' + miss.join(', ') + '.' : ''}${notes.length ? ' ' + notes.join(' ') : ''}`, 9000); }
      catch (e) { console.error(e); toast('Stunde erstellt, aber die KI-Texte fehlen: ' + e.message + ' Mit „Texte per KI“ nochmal versuchen.', 12000); }
    } catch (e) { console.error(e); toast('⚠ ' + e.message, 12000); }
    finally { ui.aiGenBusy = false; render(); }
  }
};


// ---------- Ganzes Programm per KI ----------
const AIPROG_EXAMPLE = 'Ein Herbstprogramm für meine Seniorengruppe über 8 Wochen unter dem Übermotto „Ankommen und Loslassen“. Die Stunden sollen sanft beginnen und sich langsam steigern: am Anfang Atem und Mobilisation, in der Mitte ein Schwerpunkt auf Hüfte und Rücken, gegen Ende Gleichgewicht und Standfestigkeit. In jeder Stunde eine ausführliche Tiefenentspannung am Schluss, ein Mantra nur in jeder zweiten Stunde. Keine Kraftübungen. In Stunde 4 bitte die Taube in der sanften Variante, in Stunde 7 den Baum einbauen. Die Texte sollen ruhig, einfach und warm klingen.';
const aiProgDefault = () => ({ name: '', motto: '', count: 8, start: todayIso(), rhythm: 'weekly', days: [], pauses: '', level: 'sen', geb: [], total: 75, texts: false, prompt: '' });
function viewAiProg() {
  const g = ui.aiProg = ui.aiProg || aiProgDefault(), busy = !!ui.aiProgBusy;
  const pn = (n, t, hint) => `<h3><span class="pn">${n}</span>${t}</h3><p class="phint">${hint}</p>`;
  const gebs = Object.keys(GEBRECHEN).map(k => `<label class="fchip${g.geb.includes(k) ? ' on' : ''}"><input type="checkbox" data-a="aiProgGeb" data-k="${k}" ${g.geb.includes(k) ? 'checked' : ''}> ${esc(GEBRECHEN[k])}</label>`).join('');
  const days = [[1, 'Mo'], [2, 'Di'], [3, 'Mi'], [4, 'Do'], [5, 'Fr'], [6, 'Sa'], [0, 'So']].map(([n, l]) => `<label class="fchip${g.days.includes(n) ? ' on' : ''}"><input type="checkbox" data-a="aiProgDay" data-k="${n}" ${g.days.includes(n) ? 'checked' : ''}> ${l}</label>`).join('');
  const ready = !!(state.settings.apiKey || '').trim(), n = clamp(Math.round(+g.count) || 1, 1, 30);
  return `<div class="hero">${LOTUS}<div><h1>Programm KI-generiert</h1><p>Du beschreibst das ganze Programm in eigenen Worten, die KI plant Mottos und Rahmen für jede Stunde. Die Übungen stammen aus deinem Katalog.</p></div><span class="grow"></span></div>
<div class="fcards noprint">
<section class="panel span2"><h2 class="ph">${pn(1, 'Programm & Motto', 'Name und Übermotto sind optional: ohne Angabe wählt die KI einen roten Faden zu deinem Text.')}</h2><div class="grid">
${fld('Programmname', inp('u:aiProg.name', 'text', g.name, 'class="h1in" placeholder="leer = Übermotto"'), 'wide')}
${fld('Übermotto (optional)', inp('u:aiProg.motto', 'text', g.motto, 'placeholder="z. B. Ankommen und Loslassen"'), 'wide')}
</div></section>
<section class="panel"><h2 class="ph">${pn(2, 'Termine & Rhythmus', 'Wie viele Stunden, wann und wie oft?')}</h2><div class="grid">
${fld('Anzahl Stunden', inp('u:aiProg.count', 'number', g.count, 'min="1" max="30"'))}
${fld('Startdatum (1. Stunde)', inp('u:aiProg.start', 'date', g.start))}
${fld('Rhythmus', sel('u:aiProg.rhythm', [['weekly', 'Wöchentlich'], ['biweekly', 'Zweiwöchentlich'], ['days', 'Ausgewählte Wochentage']], g.rhythm))}
${g.rhythm === 'days' ? fld('Wochentage (jede Woche)', `<div class="fchips">${days}</div>`) : ''}
${fld('Pausen / Ferien (Datum oder „von bis“, getrennt mit ;)', inp('u:aiProg.pauses', 'text', g.pauses, 'placeholder="27.10.2026; 22.12.2026 bis 05.01.2027"'), 'wide')}
</div></section>
<section class="panel"><h2 class="ph">${pn(3, 'Zielgruppe & Einschränkungen', 'Übungen mit Belastung für die gewählten Bereiche werden nicht eingebaut.')}</h2><div class="grid">
${fld('Gruppe', sel('u:aiProg.level', Object.keys(LEVELS).map(k => [k, LEVELS[k]]), g.level))}
${fld('Einschränkungen / Gebrechen berücksichtigen', `<div class="fchips">${gebs}</div>`, 'wide')}
</div></section>
<section class="panel span2"><h2 class="ph">${pn(4, 'Dauer', 'Gesamtdauer jeder Stunde. Die Aufteilung auf die Bausteine ergibt sich daraus und lässt sich danach in der Rahmenplanung ändern.')}</h2><div class="atin">${inp('u:aiProg.total', 'number', g.total, 'min="20" max="180" step="1"')}<span>Minuten</span></div><div class="qd">${[60, 75, 90, 120].map(m => `<button class="qdb${+g.total === m ? ' on' : ''}" data-a="aiProgTotal" data-v="${m}">${m}</button>`).join('')}</div></section>
<section class="panel span2"><h2 class="ph">${pn(5, 'Beschreibung des Programms', 'Freitext für die KI: Thema, Verlauf über die Stunden, Schwerpunkte, Wunschübungen je Stunde, Atem, Mantra, Tonfall.')}</h2>
<div class="fld wide"><label>Dein Wunsch an die KI</label><textarea data-f="u:aiProg.prompt" rows="9" placeholder="Beschreibe das Programm, z. B. Thema, Verlauf, Schwerpunkte, besondere Wünsche …">${esc(g.prompt)}</textarea></div>
<div class="aigex"><b>Beispiel für einen Prompt</b><p>${esc(AIPROG_EXAMPLE)}</p><button class="ghost sm" data-a="aiProgExample">Beispiel in das Textfeld übernehmen</button></div>
<label class="chk"><input type="checkbox" data-f="u:aiProg.texts" ${g.texts ? 'checked' : ''}> Texte aller Stunden per KI schreiben lassen (${n} weitere KI-Aufrufe, dauert länger und kostet mehr; sonst entstehen die Texte aus den eingebauten Bausteinen)</label>
<p class="muted">Die KI steuert: Übermotto, Einzelmotto mit Kernsatz und Fokus je Stunde, Yogastil, Körperregion, Atemteil, Mantra, Mobilisation, Anzahl Kraftübungen und Wunschübungen je Stunde. Wunschübungen werden nur eingebaut, wenn sie im Katalog stehen und zu den Einschränkungen passen. Gesendet werden nur dein Text und die Vorgaben, keine Teilnehmerdaten.</p>
</section>
</div>
<div class="bar noprint"><button class="primary" data-a="aiProgCreate" ${busy ? 'disabled' : ''}>${busy ? 'KI plant das Programm …' : '✨ Programm generieren'}</button><span class="muted">${ready ? 'Danach landest du in der Einzelstundenplanung des Programms und kannst alles anpassen.' : 'Dafür ist ein API-Schlüssel nötig (Einstellungen, Abschnitt „KI-Texte“).'}</span></div>`;
}
async function aiProgPlan(g, n) {
  const geb = g.geb.map(k => GEBRECHEN[k]).filter(Boolean);
  const p = `Du bist eine erfahrene Yogalehrerin und hilfst einer Kollegin, ein Yogaprogramm mit ${n} Stunden zu planen. Die Übungen wählt ihre Software aus ihrem Katalog aus. Du legst die Mottos und Rahmenbedingungen fest und nennst Übungen, die sie ausdrücklich wünscht.
Beschreibung der Kollegin: „${g.prompt.trim()}“
Feste Vorgaben: Gruppe ${LEVELS[g.level]}, ${n} Stunden à ${g.total} Minuten${geb.length ? ', Einschränkungen: ' + geb.join(', ') : ''}. ${g.motto.trim() ? 'Das Übermotto ist vorgegeben: „' + g.motto.trim() + '“.' : 'Wähle ein passendes Übermotto.'}
Antworte ausschließlich mit JSON in genau dieser Form:
{"uebermotto":"kurzer Titel","st":["Yogastile aus: ${aiGenList(STILE)}"],"reg":["Körperregionen aus: ${aiGenList(KAT.reg)}"],
"breath":"aus oder atem oder atem_wahr oder gemischt","mantra":"aus oder immer oder wechsel","mobi":"sitz oder liegen oder stand oder wechsel oder aus","kraft":0,
"stunden":[{"title":"2 bis 5 Wörter","kern":"Kernsatz in der Ich-Form","focus":"körperlicher Fokus in Stichworten","tags":["2 bis 4 Schlagworte aus: ${Object.keys(KEYWORDS).join(', ')}"],"wish":["Name einer für genau diese Stunde gewünschten Übung"]}]}
Regeln: "stunden" enthält genau ${n} Einträge in der Reihenfolge der Stunden, die Mottos bauen als roter Faden aufeinander auf (ruhiger Beginn, Steigerung, sanfter Abschluss, sofern die Beschreibung nichts anderes sagt). st und reg gelten für das ganze Programm und nur füllen, wenn die Beschreibung es für alle Stunden deutlich verlangt, sonst leere Listen (leer bedeutet alle). breath: atem = nur Atemübung, atem_wahr = Atem und Wahrnehmungsübung, gemischt = im Wechsel, aus = kein Atemteil. mantra: wechsel = nur in jeder zweiten Stunde. kraft ist die Zahl der Kraftübungen je Stunde von 0 bis 3. wish je Stunde nur füllen, wenn die Kollegin diese Übung für diese Stunde ausdrücklich nennt, mit gebräuchlichem deutschen Namen, sonst leere Liste. Wenn die Beschreibung etwas nicht erwähnt, wähle sinnvolle Standardwerte. Keine Gedankenstriche.`;
  try { return jsonFrom(await aiCall(p, Math.min(8000, 900 + 260 * n)), '{', '}'); }
  catch (e) { if (/JSON|position/.test(e.message)) throw new Error('Die KI-Antwort war nicht lesbar oder abgeschnitten. Bitte nochmal versuchen (bei vielen Stunden evtl. weniger Stunden wählen).'); throw e; }
}
Object.assign(AIGEN_ACTIONS, {
  aiProgGeb(d) { const g = ui.aiProg, i = g.geb.indexOf(d.k); i < 0 ? g.geb.push(d.k) : g.geb.splice(i, 1); render(); },
  aiProgDay(d) { const g = ui.aiProg, k = +d.k, i = g.days.indexOf(k); i < 0 ? g.days.push(k) : g.days.splice(i, 1); render(); },
  aiProgTotal(d) { ui.aiProg.total = +d.v; render(); },
  aiProgExample() { ui.aiProg.prompt = AIPROG_EXAMPLE; render(); },
  async aiProgCreate() {
    const g = ui.aiProg; if (!g || ui.aiProgBusy) return;
    if (!(g.prompt || '').trim()) { toast('Bitte beschreibe das Programm im Textfeld.'); return; }
    if (!(state.settings.apiKey || '').trim()) { toast('Kein API-Schlüssel hinterlegt (Einstellungen, Abschnitt „KI-Texte“).', 6000); return; }
    const n = clamp(Math.round(+g.count) || 1, 1, 30);
    ui.aiProgBusy = true; render(); toast('KI plant das Programm …', 60000);
    try {
      const p = await aiProgPlan(g, n), sts = Array.isArray(p.stunden) ? p.stunden : [], over = (g.motto || '').trim() || String(p.uebermotto || '').trim() || 'Neues Programm';
      const mo = i => { const m = sts[i] || {}, title = String(m.title || '').trim(); if (!title) return null; const tags = (Array.isArray(m.tags) ? m.tags : []).filter(x => KEYWORDS[x]), tg = tags.length ? tags : keywordTags(title);
        return { themeId: '', title, kern: String(m.kern || '').trim() || `Heute darf „${title}“ für mich spürbar werden.`, focus: String(m.focus || '').trim() || focusFromTags(tg), tags: tg }; };
      const lines = Array.from({ length: n }, (_, i) => { const m = mo(i); return m ? m.title + ' | ' + m.kern : ''; }).join('\n');
      const c = defaultCourseFixed({ name: (g.name || '').trim() || over, count: n, start: g.start || todayIso(), rhythm: g.rhythm, days: g.days.slice(), pauses: g.pauses || '', level: LEVELS[g.level] ? g.level : 'sen', gebrechen: g.geb.slice(), total: clamp(Math.round(+g.total) || 75, 20, 180), motto: { mode: 'eigen', preset: 'alltag', free: over, eigen: lines } });
      aiGenApply(c, p); if (['aus', 'immer', 'wechsel'].includes(p.mantra)) { c.mantra = p.mantra; fitDurs(c, 'total'); } if (['sitz', 'liegen', 'stand', 'wechsel', 'aus'].includes(p.mobi)) { c.mobi = p.mobi; fitDurs(c, 'total'); }
      planCourse(c);
      const notes = [], put = [], miss = [];
      c.sessions.forEach((s, i) => { const m = mo(i); if (m) fillSession(c, s, i, { motto: m }); });
      if (c.sessions.some(s => anItems(s).length < 6) && (c.st.length || c.reg.length)) { c.st = []; c.reg = []; c.sessions.forEach((s, i) => { const m = mo(i); fillSession(c, s, i, m ? { motto: m } : {}); }); notes.push('Stil- und Regionsvorgabe war zu eng und wurde nicht angewendet.'); }
      c.sessions.forEach((s, i) => { const r = aiGenWishes(c, s, (sts[i] || {}).wish); r.put.forEach(x => put.push(`${i + 1}: ${x}`)); r.miss.forEach(x => miss.push(`${i + 1}: ${x}`)); fitSession(c, s); });
      const off = c.sessions.filter(s => Math.abs(plannedTotal(s) - sessionTotal(s)) > 1.01).length; if (off) notes.push(`${off} Stunde(n) weichen von der Soll-Dauer ab (Vorgaben prüfen).`);
      if (sts.length < n) notes.push(`Die KI lieferte nur ${sts.length} von ${n} Mottos, die übrigen kommen aus den eingebauten Mottos.`);
      c.aiPrompt = g.prompt.trim(); c.status = 'in_planung';
      state.courses.unshift(c); ui.aiProg = null; ui.pTab = 'list'; ui.view = 'course'; ui.courseId = c.id; ui.tab = 'sessions'; ui.sel = c.sessions[0].id; ui.open = new Set(['set', 'ovw']);
      save(); render();
      const summary = () => `Programm „${c.name}“ mit ${c.sessions.length} Stunden erstellt.${put.length ? ' Eingebaut: ' + put.join(', ') + '.' : ''}${miss.length ? ' Nicht eingebaut: ' + miss.join(', ') + '.' : ''}${notes.length ? ' ' + notes.join(' ') : ''}`;
      if (!g.texts) { toast(summary(), 12000); return; }
      let done = 0;
      for (let i = 0; i < c.sessions.length; i++) {
        const s = c.sessions[i]; if (Object.keys(s.txEdited || {}).some(k => s.txEdited[k])) continue;
        toast(`KI schreibt die Texte: Stunde ${i + 1} von ${c.sessions.length} …`, 60000);
        try { await aiTexts(c, s, i, g.prompt.trim()); done++; save(); } catch (e) { console.error(e); notes.push(`Texte nur für ${done} von ${c.sessions.length} Stunden: ${e.message} Mit „Texte per KI“ je Stunde nachholen.`); break; }
      }
      save(); render(); toast(summary(), 15000);
    } catch (e) { console.error(e); toast('⚠ ' + e.message, 12000); }
    finally { ui.aiProgBusy = false; render(); }
  }
});
