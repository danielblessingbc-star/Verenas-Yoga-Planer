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
  try { return jsonFrom(await aiCall(p, 1500), '{', '}'); }
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
      const geb = effGeb(c, s), put = [], miss = [];
      (Array.isArray(p.wish) ? p.wish : []).slice(0, 8).forEach(w => {
        const e = aiGenFind(String(w)); if (!e) { miss.push(String(w)); return; }
        if (blkIds(s).includes(e.id)) { put.push(e.n); return; }
        if (contra(e, geb) || !anSwapIn(s, e)) miss.push(e.n + ' (passt nicht)'); else put.push(e.n);
      });
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
