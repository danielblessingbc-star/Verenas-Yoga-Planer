/* KI-generierte Sequenz: Seite unter „Sequenzen“ (Button neben „Neue Sequenz“, auch im Sequenzkatalog).
   Die Kollegin beschreibt die Sequenz, wählt Art, Gruppe, Einschränkungen, Anzahl der Übungen und optional eine feste Start- und/oder Endübung.
   Die KI bekommt eine gefilterte Katalogliste mit der Körperposition jeder Übung und ordnet sie so, dass die Übungen fließend ineinander übergehen.
   Frei genannte Wunschübungen werden über den Namen im Katalog gesucht. Das Ergebnis öffnet als Entwurf im Sequenz-Editor und wird erst beim Speichern angelegt. */
const AISEQ_EXAMPLES = {
  anf: 'Eine fließende Folge für Einsteiger im Stehen: sanft erwärmen, die Wirbelsäule beugen und strecken, einfache Übergänge vom Stand in die Vorbeuge und zurück. Keine Kraftübungen am Boden, ruhiges Tempo.',
  mittel: 'Ein kräftigender Flow im Stand für Geübte: vom Berg über Krieger und Ausfallschritt in eine Drehung und wieder zurück, jede Haltung geht direkt in die nächste über.',
  fort: 'Ein anspruchsvoller Vinyasa-Flow mit Stütz- und Balanceelementen: Planke, Kobra, Herabschauender Hund, Ausfallschritt und zum Abschluss ein Balance-Element im Stand.',
  gemischt: 'Eine Folge für eine gemischte Gruppe, die sich leichter und fordernder üben lässt: Hüftöffner im Stand und am Boden mit Übergängen, die für alle einfach bleiben.',
  sen: 'Eine sanfte Folge für meine Seniorengruppe im Sitzen und Stehen mit Schwerpunkt Schultern und Rücken: ruhig vom Sitz in den Stand und zurück, ohne Bodenübungen.'
};
const aiSeqDefault = () => ({ name: '', type: 'asana', level: 'sen', geb: [], count: 8, startId: '', endId: '', prompt: '' });

// Welche Katalog-Arten zu welcher Sequenzart passen (Start-, End- und Wunschübungen dürfen davon abweichen)
const AISEQ_CATS = {
  mobilisation: ['mobi_sitz', 'mobi_stand', 'flow', 'boden'],
  shakti: ['shakti'],
  asana: ['mobi_stand', 'flow', 'stand', 'balance', 'kraft', 'boden'],
  cooldown: ['boden', 'mobi_sitz']
};
const AISEQ_TYPE_HINT = {
  mobilisation: 'sanfte Mobilisation von Gelenken und Wirbelsäule',
  shakti: 'Shakti Naam, rhythmische Übungen mit Atem und Mudras',
  asana: 'Folge von Haltungen und Übergängen (Flow)',
  cooldown: 'ruhiger Ausklang und Ausgleich am Ende der Stunde'
};
// Körperposition einer Übung (gleiche Ableitung wie die Reihenfolge in der Stundenplanung, siehe seqIdx in gen.js)
const AISEQ_POS = { sit: 'Sitz aufrecht', stand: 'Stand', bal: 'Balance einbeinig', quad: 'Vierfüßler/Knien', prone: 'Bauchlage', fsit: 'Langsitz/Bodensitz', supine: 'Rückenlage', inv: 'Umkehrhaltung' };
const aiSeqPos = e => e.g || (e.c === 'balance' ? 'bal' : e.c === 'stand' || e.c === 'flow' || e.c === 'mobi_stand' ? 'stand' : e.c === 'mobi_sitz' ? 'sit' : e.c === 'kraft' ? (onFloor(e) ? 'supine' : 'stand') : 'supine');
// Natürliche Übergänge zwischen Positionen (ohne Umweg über eine dritte Position)
const AISEQ_LINKS = ['sit-fsit', 'sit-stand', 'fsit-supine', 'fsit-quad', 'quad-prone', 'quad-supine', 'quad-stand', 'quad-inv', 'supine-inv', 'supine-prone', 'stand-bal', 'stand-prone', 'stand-inv'];
const aiSeqLink = (a, b) => a === b || AISEQ_LINKS.includes(a + '-' + b) || AISEQ_LINKS.includes(b + '-' + a);

// Kandidatenliste für die KI: passend zu Art, Gruppe und Einschränkungen; Start-/Endübung gehören immer dazu
function aiSeqCands(g) {
  const cats = AISEQ_CATS[g.type] || AISEQ_CATS.asana, force = [g.startId, g.endId].filter(Boolean);
  return exAll().filter(e => !e.txt && (force.includes(e.id) || (!e.man && cats.includes(e.c) && levelOk(e, g.level) && !contra(e, g.geb) && rating(e.id) > 0)));
}
// Übergangsprüfung: Sprünge zwischen Positionen, die nicht direkt ineinander übergehen, und zu viele Positionswechsel
function aiSeqFlow(items) {
  const notes = [], ps = items.map(aiSeqPos);
  let changes = 0;
  for (let i = 1; i < items.length; i++) {
    if (ps[i] !== ps[i - 1]) changes++;
    if (!aiSeqLink(ps[i - 1], ps[i])) notes.push(`Sprung von „${items[i - 1].n}“ (${AISEQ_POS[ps[i - 1]]}) zu „${items[i].n}“ (${AISEQ_POS[ps[i]]}) nach Übung ${i}`);
  }
  if (changes > Math.max(3, Math.ceil(items.length / 2))) notes.push(`viele Positionswechsel (${changes})`);
  return notes;
}
const aiSeqClean = s => String(s || '').replace(/\s*[–—]\s*/g, ', ').trim();

async function aiSeqPlan(g, cands, avoid) {
  const geb = g.geb.map(k => GEBRECHEN[k]).filter(Boolean), st = exById(g.startId), en = exById(g.endId), n = clamp(Math.round(+g.count) || 8, 3, 30);
  const list = cands.map(e => `${e.id} | ${e.n} | ${AISEQ_POS[aiSeqPos(e)]} | ${fmtMin(e.m)} Min.`).join('\n');
  const p = `Du bist eine erfahrene Yogalehrerin und hilfst einer Kollegin, eine feste Übungssequenz zusammenzustellen. Die Übungen stammen aus ihrem Katalog. Du wählst die Übungen und bringst sie in die beste Reihenfolge.
Beschreibung der Kollegin: „${g.prompt.trim()}“
Vorgaben: Art ${SEQ_TYPES[g.type].n} (${AISEQ_TYPE_HINT[g.type]}), Gruppe ${LEVELS[g.level]}, ${n} Übungen${geb.length ? ', Einschränkungen: ' + geb.join(', ') : ''}.${st ? ` Die erste Übung ist fest vorgegeben: „${st.n}“.` : ''}${en ? ` Die letzte Übung ist fest vorgegeben: „${en.n}“.` : ''}
${avoid && avoid.length ? `Das ist ein neuer Versuch. Die bisherige Folge war: ${avoid.join(', ')}. Liefere bewusst eine andere Variante mit anderer Auswahl oder Reihenfolge, soweit Vorgaben und Flow es zulassen.\n` : ''}Katalog (eine Übung je Zeile: ID | Name | Körperposition | Dauer):
${list}

Antworte ausschließlich mit JSON in genau dieser Form:
{"name":"Sequenzname, 2 bis 5 Wörter","desc":"2 bis 3 Sätze auf Deutsch: Wirkung, wie die Sequenz geübt wird, worauf zu achten ist","items":[{"id":"ID aus dem Katalog"}]}
Regeln: "items" enthält genau ${n} Einträge in der Reihenfolge der Übung.${st ? ` Der erste Eintrag ist ${st.id}.` : ''}${en ? ` Der letzte Eintrag ist ${en.id}.` : ''}
Das Wichtigste ist der Flow: Jede Übung muss aus der vorigen heraus natürlich entstehen, ohne Umweg und ohne Sprung. Achte dazu auf die Körperposition: bleibe möglichst lange in derselben Position oder wechsle nur zu einer direkt benachbarten (z. B. Stand, Vorbeuge, Ausfallschritt, Vierfüßler, Bauchlage, Rückenlage; vom Stand nie direkt in die Rückenlage und umgekehrt). Wechsle die Position höchstens ${Math.max(2, Math.ceil(n / 3))}-mal. Baue einen runden Bogen: ruhig beginnen, steigern, sanft ausklingen, sofern die Beschreibung nichts anderes verlangt. Eine Übung darf sich wiederholen, wenn es zum Flow gehört (z. B. Vorbeuge am Anfang und am Ende), aber nie zweimal direkt hintereinander.
Verwende nur IDs aus dem Katalog. Nennt die Beschreibung eine Wunschübung, die nicht im Katalog steht, schreibe stattdessen {"name":"Name der Übung"} an die passende Stelle. Verwende in "name" und "desc" keine Gedankenstriche (– oder —).`;
  try { return jsonFrom(await aiCall(p, 3000), '{', '}'); }
  catch (e) { if (/JSON|position/.test(e.message)) throw new Error('Die KI-Antwort war nicht lesbar. Bitte nochmal versuchen.'); throw e; }
}

function viewAiSeq() {
  const g = ui.aiSeq = ui.aiSeq || aiSeqDefault(), busy = !!ui.aiSeqBusy;
  const pn = (n, t, hint) => `<h3><span class="pn">${n}</span>${t}</h3><p class="phint">${hint}</p>`;
  const gebs = Object.keys(GEBRECHEN).map(k => `<label class="fchip${g.geb.includes(k) ? ' on' : ''}"><input type="checkbox" data-a="aiSeqGeb" data-k="${k}" ${g.geb.includes(k) ? 'checked' : ''}> ${esc(GEBRECHEN[k])}</label>`).join('');
  const ready = !!(state.settings.apiKey || '').trim();
  const slot = (key, id) => { const e = id && exById(id);
    return `<div class="fld"><label>${key === 'start' ? 'Startübung (optional)' : 'Endübung (optional)'}</label><div class="atin">${e ? `${sqTile({ id: e.id, min: e.m })} <b>${esc(e.n)}</b>` : '<span class="muted">Keine Vorgabe, die KI wählt frei.</span>'}
<button type="button" class="ghost sm" data-a="aiSeqPk" data-slot="${key}">${e ? 'Ändern' : 'Übung wählen'}</button>${e ? `<button type="button" class="ghost sm" data-a="aiSeqClr" data-slot="${key}" title="Vorgabe entfernen">✕</button>` : ''}</div></div>`; };
  return `<div class="hero">${LOTUS}<div><h1>KI-generierte Sequenz</h1><p>Du beschreibst die Sequenz in eigenen Worten, die KI ordnet Übungen aus deinem Katalog so, dass sie fließend ineinander übergehen.</p></div><span class="grow"></span><button data-a="aiSeqClose">← Zurück zu den Sequenzen</button></div>
<div class="fcards noprint">
<section class="panel span2"><h2 class="ph">${pn(1, 'Art & Umfang', 'Die Art bestimmt, in welchen Stundenblock die Sequenz später eingeplant wird. Der Name ist optional: ohne Angabe wählt die KI einen.')}</h2><div class="grid">
${fld('Name der Sequenz (optional)', inp('u:aiSeq.name', 'text', g.name, 'placeholder="leer = Vorschlag der KI" autocomplete="off"'), 'wide')}
${fld('Art der Sequenz', sel('u:aiSeq.type', Object.keys(SEQ_TYPES).map(k => [k, SEQ_TYPES[k].n]), g.type))}
${fld('Anzahl Übungen', inp('u:aiSeq.count', 'number', g.count, 'min="3" max="30"'))}
</div></section>
<section class="panel"><h2 class="ph">${pn(2, 'Zielgruppe & Einschränkungen', 'Übungen mit Belastung für die gewählten Bereiche werden nicht eingebaut.')}</h2><div class="grid">
${fld('Gruppe', sel('u:aiSeq.level', Object.keys(LEVELS).map(k => [k, LEVELS[k]]), g.level))}
${fld('Einschränkungen / Gebrechen berücksichtigen', `<div class="fchips">${gebs}</div>`, 'wide')}
</div></section>
<section class="panel"><h2 class="ph">${pn(3, 'Start & Ende', 'Optional: Die Sequenz beginnt und/oder endet mit einer bestimmten Übung. Alles dazwischen ordnet die KI so, dass es dorthin passt.')}</h2><div class="grid">${slot('start', g.startId)}${slot('end', g.endId)}</div></section>
<section class="panel span2"><h2 class="ph">${pn(4, 'Beschreibung der Sequenz', 'Freitext für die KI: Thema, Wirkung, Körperregion, Stimmung, Wunschübungen. Wichtig ist der Flow: die KI achtet auf fließende Übergänge.')}</h2>
<div class="fld wide"><label>Dein Wunsch an die KI</label><textarea data-f="u:aiSeq.prompt" rows="6" placeholder="Beschreibe die Sequenz, z. B. Thema, Schwerpunkt, Stimmung, besondere Wünsche …">${esc(g.prompt)}</textarea></div>
${aiExBox('aiSeq', AISEQ_EXAMPLES, g)}
<p class="muted">Die KI wählt Name, Beschreibung und die Übungen samt Reihenfolge. Die Übungen stammen aus deinem Katalog, die Dauer je Übung ist der Katalogwert. Frei genannte Wunschübungen werden nur eingebaut, wenn sie im Katalog stehen und zu den Einschränkungen passen. Das Ergebnis öffnet als Entwurf im Editor und wird erst durch „Sequenz speichern“ angelegt.</p>
</section>
</div>
<div class="bar noprint"><button class="primary" data-a="aiSeqCreate" ${busy ? 'disabled' : ''}>${busy ? 'KI stellt die Sequenz zusammen …' : '✨ Sequenz generieren'}</button><span class="muted">${ready ? 'Danach prüfst du die Sequenz im Editor und speicherst sie.' : 'Dafür ist ein API-Schlüssel nötig (Einstellungen, Abschnitt „KI-Texte“).'}</span></div>`;
}

// Auswahlfenster für Start- bzw. Endübung (Katalog mit Suche; Übungen, die zu den Einschränkungen nicht passen, sind gesperrt)
function openAiSeqPicker(btn, slotKey) {
  closePicker();
  const g = ui.aiSeq; if (!g) return;
  const curId = slotKey === 'start' ? g.startId : g.endId; ui.pk = { kind: 'aiseq', slot: slotKey };
  const rows = exAll().filter(p => !p.txt).sort((a, b) => seqIdx(a.id) - seqIdx(b.id)).map(p => {
    const bad = contra(p, g.geb) && p.id !== curId;
    return `<button class="pko cat-${p.c}${p.id === curId ? ' cur' : ''}" data-a="aiSeqPick" data-id="${p.id}" ${bad ? 'disabled title="Passt nicht zu den gewählten Einschränkungen"' : ''} data-q="${esc(norm(p.n + ' ' + (p.sa || '')))}"><span class="pkf">${figureSVG(p.pose)}${peakStar(p)}</span><div class="pkinfo"><div class="pkname"><b>${esc(p.n)}</b>${p.sa ? `<small class="sa">${esc(p.sa)}</small>` : ''}</div><div class="pkmeta"><span>${esc(CATS[p.c] || '')}</span><span class="muted">· ${esc(AISEQ_POS[aiSeqPos(p)])}</span></div></div></button>`;
  }).join('');
  const panel = document.createElement('div'); panel.id = 'pkpanel';
  panel.innerHTML = `<input type="search" id="pkq" placeholder="Übung suchen …" autocomplete="off"><div class="pkgrid">${rows}</div>`;
  document.body.appendChild(panel);
  const r = btn.getBoundingClientRect(), w = Math.min(640, window.innerWidth - 16);
  panel.style.width = w + 'px'; panel.style.left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8)) + 'px';
  const below = window.innerHeight - r.bottom - 12, above = r.top - 12;
  if (below >= 280 || below >= above) { panel.style.top = (r.bottom + 4) + 'px'; panel.style.maxHeight = Math.max(220, below) + 'px'; }
  else { panel.style.bottom = (window.innerHeight - r.top + 4) + 'px'; panel.style.maxHeight = Math.max(220, above) + 'px'; }
  const q = document.getElementById('pkq'); q.focus();
  q.addEventListener('input', () => { const v = norm(q.value); panel.querySelectorAll('.pko').forEach(b => { b.style.display = !v || b.dataset.q.includes(v) ? '' : 'none'; }); });
  const cu = panel.querySelector('.pko.cur'); if (cu) panel.scrollTop = Math.max(0, cu.offsetTop - 90);
}

// Antwort der KI in Übungen auflösen: ID aus dem Katalog, sonst Name (Wunschübung); Start-/Endübung erzwingen
function aiSeqResolve(g, p) {
  const geb = g.geb, ok = new Set(aiSeqCands(g).map(e => e.id)), items = [], miss = [];
  (Array.isArray(p.items) ? p.items : []).slice(0, 40).forEach(it => {
    if (!it || typeof it !== 'object') return;
    let e = it.id ? exById(String(it.id)) : null;
    if (e && (e.txt || (!ok.has(e.id) && contra(e, geb)))) e = null;
    if (!e && (it.name || it.id)) {
      const f = aiGenFind(String(it.name || it.id));
      if (!f) { miss.push(String(it.name || it.id)); return; }
      if (contra(f, geb)) { miss.push(f.n + ' (passt nicht)'); return; }
      e = f;
    }
    if (!e) return;
    if (items.length && items[items.length - 1].id === e.id) return;   // nie dieselbe Übung direkt zweimal
    items.push(e);
  });
  const st = g.startId && exById(g.startId), en = g.endId && exById(g.endId);
  if (st && (!items.length || items[0].id !== st.id)) items.unshift(st);
  if (en && (!items.length || items[items.length - 1].id !== en.id)) items.push(en);
  return { items, miss };
}

// KI-Lauf: redo = true erzeugt aus dem aktuellen Entwurf eine neue Variante mit denselben Einstellungen
async function aiSeqRun(redo) {
  const g = ui.aiSeq; if (!g || ui.aiSeqBusy) return;
  if (!(g.prompt || '').trim()) { toast('Bitte beschreibe die Sequenz im Textfeld.'); return; }
  if (!(state.settings.apiKey || '').trim()) { toast('Kein API-Schlüssel hinterlegt (Einstellungen, Abschnitt „KI-Texte“).', 6000); return; }
  const bad = [g.startId, g.endId].map(id => id && exById(id)).filter(e => e && contra(e, g.geb));
  if (bad.length) { toast(`„${bad[0].n}“ passt nicht zu den gewählten Einschränkungen. Bitte Vorgabe ändern oder entfernen.`, 7000); return; }
  const cands = aiSeqCands(g);
  if (cands.length < 3) { toast('Für diese Vorgaben gibt es zu wenige passende Übungen im Katalog.', 6000); return; }
  const prev = redo && ui.seqDraft ? ui.seqDraft.aiPrev || ui.seqDraft.items.map(i => (exById(i.id) || {}).n).filter(Boolean) : null;
  ui.aiSeqBusy = true; render(); toast(redo ? 'KI berechnet die Sequenz neu …' : 'KI stellt die Sequenz zusammen …', 40000);
  try {
    const p = await aiSeqPlan(g, cands, prev), { items, miss } = aiSeqResolve(g, p);
    if (items.length < 2) throw new Error('Die KI hat keine brauchbare Übungsfolge geliefert. Bitte nochmal versuchen oder die Beschreibung anpassen.');
    const want = clamp(Math.round(+g.count) || 8, 3, 30), notes = [];
    if (items.length !== want) notes.push(`${items.length} statt ${want} Übungen`);
    if (miss.length) notes.push('nicht eingebaut: ' + miss.join(', '));
    const fl = aiSeqFlow(items); if (fl.length) notes.push('Übergänge prüfen: ' + fl.slice(0, 3).join('; ') + (fl.length > 3 ? '; …' : ''));
    const name = (g.name || '').trim() || aiSeqClean(p.name) || 'KI-Sequenz', desc = aiSeqClean(p.desc);
    const its = items.map(e => ({ id: e.id, min: e.m || 1 }));
    ui.seqAiOn = false; ui.aiSeqBusy = false;
    seqStart({ id: 'seq_' + uid(), name, type: SEQ_TYPES[g.type] ? g.type : 'asana', items: its, desc, src: { n: 'KI-generiert', u: '' } }, true);
    // Merker für „Nochmal berechnen“: Entwurf kommt von der KI; Stand zum Erkennen eigener Änderungen; Namen der Folge als Hinweis „bitte anders“
    Object.assign(ui.seqDraft, { fromAi: true, aiSnap: JSON.stringify([name, desc, its.map(i => [i.id, i.min])]), aiPrev: items.map(e => e.n) });
    render();
    toast(`${redo ? 'Neue Variante' : 'Entwurf'} „${name}“ mit ${items.length} Übungen erstellt. Prüfen und mit „Sequenz speichern“ anlegen.${notes.length ? ' Hinweise: ' + notes.join(' | ') + '.' : ''}`, 15000);
  } catch (e) { console.error(e); toast('⚠ ' + e.message, 12000); }
  finally { ui.aiSeqBusy = false; render(); }
}

Object.assign(AIGEN_ACTIONS, {
  aiSeqOpen() { ui.aiSeq = ui.aiSeq || aiSeqDefault(); ui.seqAiOn = true; ui.seqDraft = null; ui.view = 'sequences'; ui.courseId = null; closePicker(); render(); window.scrollTo(0, 0); },
  aiSeqClose() { ui.seqAiOn = false; closePicker(); render(); },
  aiSeqGeb(d) { const g = ui.aiSeq, i = g.geb.indexOf(d.k); i < 0 ? g.geb.push(d.k) : g.geb.splice(i, 1); render(); },
  aiSeqExample() { aiExTake('aiSeq', AISEQ_EXAMPLES, ui.aiSeq); },
  aiSeqExLvl(d) { ui.aiSeqEx = d.v; render(); },
  aiSeqPk(d, el) { openAiSeqPicker(el, d.slot); },
  aiSeqClr(d) { const g = ui.aiSeq; if (!g) return; if (d.slot === 'start') g.startId = ''; else g.endId = ''; render(); },
  aiSeqPick(d) {
    const p = ui.pk, g = ui.aiSeq; if (!p || p.kind !== 'aiseq' || !g) return;
    if (p.slot === 'start') g.startId = d.id; else g.endId = d.id;
    closePicker(); render();
  },
  aiSeqCreate() { return aiSeqRun(false); },
  // „Nochmal berechnen“ im Entwurf: gleiche Einstellungen (ui.aiSeq), die bisherige Folge dient als Hinweis auf „bitte anders“
  aiSeqRedo(d, el) {
    const dr = ui.seqDraft; if (!dr || !dr.fromAi || ui.aiSeqBusy) return;
    const changed = JSON.stringify([dr.name, dr.desc, dr.items.map(i => [i.id, i.min])]) !== dr.aiSnap;
    if (changed && !confirmTwice(el, 'aiseqredo', 'Der Entwurf wurde von dir geändert. Wirklich neu berechnen und die Änderungen verwerfen', '⚠ Änderungen verwerfen?')) return;
    return aiSeqRun(true);
  }
});
