/* KI-generierte Stunde: Seite unter „Stunden“. Vorgaben wie in der Einzelstundenplanung (Name, Motto, Datum, Gruppe, Einschränkungen, Dauer)
   plus Freitext. Die KI wählt Motto, Stil, Körperregion, Atem, Mantra, Mobilisation, Kraft und Wunschübungen; die Übungen selbst kommen
   immer aus dem Katalog (regelbasiert, mit Einschränkungen). Optional werden Übungen aus dem Übungskatalog und Flows (Sequenzen) aus dem Sequenzkatalog fest eingeplant
   (g.inc, siehe aiGenInclude und aiGenFlowSeqs); sie werden so einsortiert, dass die Stunde fließt. Danach schreibt die KI die Texte der Stunde. */
const AIGEN_EXAMPLES = {
  anf: 'Eine sanfte Einsteigerstunde für Menschen ohne Yoga-Erfahrung zum Thema Ankommen und den eigenen Körper kennenlernen. Einfache Haltungen im Stehen und Sitzen und viel Mobilisation, jede Übung langsam und klar, mit ausreichend Pausen. Keine Kraftübungen und kein Mantra. Die Kindhaltung und den Berg (Tadasana) bitte einbauen. Am Ende eine kurze, einfache Entspannung. Die Texte sollen ermutigend sein und ohne Fachbegriffe auskommen.',
  mittel: 'Eine fließende Stunde für Teilnehmende mit etwas Erfahrung zum Thema Kraft und Stabilität. Schwerpunkt auf Beinen, Rumpf und Balance, gern mit Krieger II und dem Baum. Zwei Kraftübungen, zum Ankommen ein kurzes Mantra. Am Ende ein Cool down für Hüfte und Rücken und eine ausführliche Endentspannung. Die Texte sollen klar und motivierend sein.',
  fort: 'Eine fordernde Stunde für Fortgeschrittene zum Thema Hingabe und Intensität. Längere Haltezeiten und anspruchsvolle Übungen im Stand und in der Balance, als Höhepunkt eine Peak Pose, zum Beispiel die Taube in der tieferen Variante. Drei Kraftübungen, ein dynamischer Anteil, danach ausführliche Gegenhaltungen und eine lange Tiefenentspannung. Atem und Mantra bewusst einbinden. Die Texte sollen präzise sein und dürfen Fachbegriffe verwenden.',
  gemischt: 'Eine Stunde für eine gemischte Gruppe aus Anfängern und Geübten zum Thema Verbundenheit. Die Übungen sollen sich in einer leichteren und einer fordernderen Variante üben lassen. Ruhiger Einstieg, Schwerpunkt auf Hüfte und Rücken, in der Mitte etwas Balance. Eine Kraftübung, das Mantra bitte weglassen. Am Ende eine Tiefenentspannung. Die Texte sollen einladend sein und beide Varianten nennen.',
  sen: 'Eine ruhige Abendstunde für meine Seniorengruppe zum Thema Loslassen. Schwerpunkt auf Hüfte und unterem Rücken, überwiegend im Sitzen und Liegen, keine Kraftübungen. Zum Anfang ein kurzes Ankommen mit dem Atem, am Ende eine ausführliche Tiefenentspannung. Wenn möglich die Taube in der sanften Variante und die Kindhaltung einbauen. Ein Mantra bitte weglassen. Die Texte sollen sehr ruhig, einfach und warm klingen.'
};
const AIGEN_EXAMPLE = AIGEN_EXAMPLES.sen;
const aiGenDefault = () => ({ name: '', motto: '', date: todayIso(), level: 'sen', geb: [], total: 75, inc: [], struct: false, auswahl: false, prompt: '' });
// Entwurf der Vorgaben (Stundenaufbau, Übungsauswahl): ein Einzelstunden-Programm, das nie gespeichert wird; Felder mit Präfix „a:“ (siehe app.js, aiDraftC)
const aiGenDraft = g => g.c || (g.c = defaultCourseFixed({ name: '', single: true, count: 1, level: g.level, total: clamp(Math.round(+g.total) || 75, 20, 180), gebrechen: [], st: [], reg: [] }));

// Beispiel-Prompt je Stufe: Auswahl der Stufe (Standard: gewählte Gruppe), Übernehmen setzt Text und Gruppe
function aiExBox(pre, EX, g) {
  const lv = EX[ui[pre + 'Ex']] ? ui[pre + 'Ex'] : (EX[g.level] ? g.level : 'sen');
  return `<div class="aigex"><b>Beispiel für einen Prompt</b><div class="qd">${Object.keys(LEVELS).filter(k => EX[k]).map(k => `<button class="qdb${k === lv ? ' on' : ''}" data-a="${pre}ExLvl" data-v="${k}">${esc(LEVELS[k])}</button>`).join('')}</div><p>${esc(EX[lv])}</p><button class="ghost sm" data-a="${pre}Example">Beispiel übernehmen (setzt die Gruppe auf „${esc(LEVELS[lv])}“)</button></div>`;
}
const aiExTake = (pre, EX, g) => { const lv = EX[ui[pre + 'Ex']] ? ui[pre + 'Ex'] : (EX[g.level] ? g.level : 'sen'); g.prompt = EX[lv]; g.level = lv; ui[pre + 'Ex'] = null; render(); };

function viewAiGen() {
  const g = ui.aiGen = ui.aiGen || aiGenDefault(), busy = !!ui.aiGenBusy;
  const pn = (n, t, hint) => `<h3><span class="pn">${n}</span>${t}</h3><p class="phint">${hint}</p>`;
  const gebs = Object.keys(GEBRECHEN).map(k => `<label class="fchip${g.geb.includes(k) ? ' on' : ''}"><input type="checkbox" data-a="aiGenGeb" data-k="${k}" ${g.geb.includes(k) ? 'checked' : ''}> ${esc(GEBRECHEN[k])}</label>`).join('');
  const ready = !!(state.settings.apiKey || '').trim();
  if (g.struct) g.total = aiGenDraft(g).total;   // Gesamtdauer kommt dann aus dem Stundenaufbau
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
${aiStructPanel(g, pn)}
${aiPickPanel(g, pn)}
${aiIncPanel(g, pn)}
<section class="panel span2"><h2 class="ph">${pn(7, 'Beschreibung der Stunde', 'Freitext für die KI: Thema, Stimmung, Schwerpunkt, Wunschübungen, Atem, Mantra, Tonfall der Texte.')}</h2>
<div class="fld wide"><label>Dein Wunsch an die KI</label><textarea data-f="u:aiGen.prompt" rows="8" placeholder="Beschreibe die Stunde, z. B. Thema, Schwerpunkt, Stimmung, besondere Wünsche …">${esc(g.prompt)}</textarea></div>
${aiExBox('aiGen', AIGEN_EXAMPLES, g)}
<p class="muted">Die KI steuert: Motto und Kernsatz, Fokus, Yogastil, Körperregion, Atemteil, Mantra, Art der Mobilisation, Anzahl Kraftübungen, Wunschübungen und die Texte. Wunschübungen werden nur eingebaut, wenn sie im Katalog stehen und zu den Einschränkungen passen. Gesendet werden nur dein Text und die Vorgaben, keine Teilnehmerdaten.</p>
</section>
</div>
<div class="bar noprint"><button class="primary" data-a="aiGenCreate" ${busy ? 'disabled' : ''}>${busy ? 'KI plant die Stunde …' : '✨ Stunde generieren'}</button><span class="muted">${ready ? 'Danach landest du in der Einzelstundenplanung und kannst alles anpassen.' : 'Dafür ist ein API-Schlüssel nötig (Einstellungen, Abschnitt „KI-Texte“).'}</span></div>`;
}

// Stundenaufbau & Dauer: standardmäßig nur die Gesamtdauer, die KI bestimmt den Aufbau; aufgeklappt wie in den Vorgaben der Einzelstundenplanung
const aiToggle = (act, on, label) => `<label class="fchip${on ? ' on' : ''}"><input type="checkbox" data-a="${act}" ${on ? 'checked' : ''}> ${label}</label>`;
function aiStructPanel(g, pn) {
  const c = aiGenDraft(g), on = !!g.struct;
  const hint = on ? 'Du legst die Blöcke selbst fest, die KI ändert daran nichts (Atemteil, Mantra, Mobilisation, Kraftübungen und Zeiten).' : 'Gesamtdauer der Stunde. Die KI bestimmt den Aufbau (Atemteil, Mantra, Mobilisation, Kraftübungen), die Aufteilung auf die Blöcke ergibt sich daraus.';
  const simple = `<div class="atin">${inp('u:aiGen.total', 'number', g.total, 'min="20" max="180" step="1"')}<span>Minuten</span></div><div class="qd">${[60, 75, 90, 120].map(m => `<button class="qdb${+g.total === m ? ' on' : ''}" data-a="aiGenTotal" data-v="${m}">${m}</button>`).join('')}</div>`;
  return `<section class="panel span2"><h2 class="ph">${pn(4, 'Stundenaufbau & Dauer', hint)}</h2>
<div class="fchips">${aiToggle('aiGenStruct', on, 'Stundenaufbau selbst festlegen')}</div>
${on ? `<div data-aid="1">${durPanel(c, 'a')}</div>` : simple}</section>`;
}
// Übungsauswahl: standardmäßig wählt die KI Yogastil und Körperregion; aufgeklappt wie in den Vorgaben
function aiPickPanel(g, pn) {
  const c = aiGenDraft(g), on = !!g.auswahl;
  const chips = (field, map) => Object.keys(map).map(k => `<label class="fchip${(c[field] || []).includes(k) ? ' on' : ''}"><input type="checkbox" data-a="cTog" data-f2="${field}" data-v="${k}" ${(c[field] || []).includes(k) ? 'checked' : ''}> ${esc(map[k])}</label>`).join('');
  return `<section class="panel span2"><h2 class="ph">${pn(5, 'Übungsauswahl', on ? 'Schränkt ein, aus welchen Übungen gewählt wird. Mehrfachauswahl möglich, leer = alle. Die KI ändert daran nichts.' : 'Die KI wählt Yogastil und Körperregion passend zu deiner Beschreibung.')}</h2>
<div class="fchips">${aiToggle('aiGenPick', on, 'Übungsauswahl selbst festlegen')}</div>
${on ? `<div class="grid" data-aid="1">${fld('Yogastil', `<div class="fchips">${chips('st', STILE)}</div>`, 'wide')}${fld('Körperregion', `<div class="fchips">${chips('reg', KAT.reg)}</div>`, 'wide')}</div>` : ''}</section>`;
}

// ---------- Enthaltene Übungen und Flows (Auswahl aus Übungs- und Sequenzkatalog) ----------
// g.inc = [{ t: 'ex' | 'seq', id }]. Übungen ersetzen die am besten passende Übung eines passenden Blocks und werden in die Reihenfolge der Stundenplanung einsortiert;
// Flows (Sequenzen) kommen als zusammenhängende Gruppe in den Block ihrer Art und an die Stelle, an der der Übergang aus der Körperposition der Nachbarübungen am glattesten ist.
const AIINC_MAX = 6;
const aiIncList = g => (g.inc = Array.isArray(g.inc) ? g.inc : []).map(x => x.t === 'seq' ? { x, q: sqById(x.id) } : { x, e: exById(x.id) }).filter(r => r.q || r.e);
const aiIncBad = (r, geb) => r.q ? sqProps(r.q).x.filter(k => geb.includes(k)).map(k => GEBRECHEN[k]) : (contra(r.e, geb) ? (r.e.x || []).filter(k => geb.includes(k)).map(k => GEBRECHEN[k]) : []);
function aiIncPanel(g, pn) {
  const rows = aiIncList(g);
  const list = rows.map(r => {
    const bad = aiIncBad(r, g.geb), del = `<button type="button" class="ghost sm" data-a="aiGenIncDel" data-t="${r.x.t}" data-id="${esc(r.x.id)}" title="Entfernen">✕</button>`;
    const warn = bad.length ? `<span class="chip warn">⚠ Vorsicht bei: ${esc(bad.join(', '))}. Bitte entfernen oder die Einschränkung ändern.</span>` : '';
    return r.q
      ? `<div class="aiinc"><div class="mts">${sqItems(r.q).slice(0, 8).map(sqTile).join('')}</div><div class="aiinfo"><b>${esc(r.q.name)}</b> ${sqTypeChip(sqType(r.q))}<small class="muted">Flow aus dem Sequenzkatalog · ${sqCount(r.q.items.length)} · ${fmtMin(sqMin(r.q))} Min.</small>${warn}</div>${del}</div>`
      : `<div class="aiinc">${sqTile({ id: r.e.id, min: r.e.m })}<div class="aiinfo"><b>${esc(r.e.n)}</b><small class="muted">Übung aus dem Übungskatalog · ${esc(CATS[r.e.c] || '')} · ${fmtMin(r.e.m)} Min.</small>${warn}</div>${del}</div>`;
  }).join('');
  return `<section class="panel span2"><h2 class="ph">${pn(6, 'Enthaltene Übung oder Flow', 'Optional: Wähle Übungen aus dem Übungskatalog und Flows aus dem Sequenzkatalog, die in der Stunde vorkommen müssen. Die Stunde baut sie so ein, dass sie sich in einen fließenden Ablauf fügen.')}</h2>
${list || '<p class="muted">Keine Vorgabe: die KI und die automatische Auswahl entscheiden frei.</p>'}
<div class="bar"><button type="button" class="ghost sm" data-a="aiGenIncOpen" ${rows.length >= AIINC_MAX ? 'disabled' : ''}>＋ Übung oder Flow aus dem Katalog wählen</button>${rows.length >= AIINC_MAX ? `<span class="muted">Höchstens ${AIINC_MAX} Vorgaben.</span>` : ''}</div></section>`;
}
// Auswahlfenster: oben die Flows (Sequenzen), darunter alle Übungen; Vorgaben, die zu den Einschränkungen nicht passen oder schon gewählt sind, sind gesperrt
function openAiIncPicker(btn) {
  closePicker();
  const g = ui.aiGen; if (!g) return;
  ui.pk = { kind: 'aiinc' };
  const have = new Set(aiIncList(g).map(r => r.x.t + ':' + r.x.id)), geb = g.geb;
  const head = t => `<div class="pkhead" style="grid-column:1/-1;font-weight:600;margin:6px 2px 0">${t}</div>`;
  const seqRows = (state.sequences || []).filter(q => sqItems(q).length).map(q => {
    const bad = sqProps(q).x.some(k => geb.includes(k)), off = bad || have.has('seq:' + q.id), names = sqExs(q).slice(0, 5).map(e => e.n).join(', ') + (sqExs(q).length > 5 ? ' …' : '');
    return `<button class="pko" data-a="aiGenIncPick" data-t="seq" data-id="${esc(q.id)}" ${off ? `disabled title="${bad ? 'Passt nicht zu den gewählten Einschränkungen' : 'Schon gewählt'}"` : ''} data-q="${esc(norm(q.name + ' flow sequenz ' + SEQ_TYPES[sqType(q)].n))}"><div class="pkinfo"><div class="pkname"><b>${esc(q.name)}</b>${sqTypeChip(sqType(q))}</div><div class="pkmeta"><span class="muted">${sqCount(q.items.length)} · ${fmtMin(sqMin(q))} Min.</span></div><small class="muted">${esc(names)}</small></div></button>`;
  }).join('');
  const exRows = exAll().filter(p => !p.txt).sort((a, b) => seqIdx(a.id) - seqIdx(b.id)).map(p => {
    const bad = contra(p, geb), off = bad || have.has('ex:' + p.id);
    return `<button class="pko cat-${p.c}" data-a="aiGenIncPick" data-t="ex" data-id="${esc(p.id)}" ${off ? `disabled title="${bad ? 'Passt nicht zu den gewählten Einschränkungen' : 'Schon gewählt'}"` : ''} data-q="${esc(norm(p.n + ' ' + (p.sa || '')))}"><span class="pkf">${figureSVG(p.pose)}${peakStar(p)}</span><div class="pkinfo"><div class="pkname"><b>${esc(p.n)}</b>${p.sa ? `<small class="sa">${esc(p.sa)}</small>` : ''}</div><div class="pkmeta"><span>${esc(CATS[p.c] || '')}</span><span class="muted">· ${esc(AISEQ_POS[aiSeqPos(p)])}</span></div></div></button>`;
  }).join('');
  const panel = document.createElement('div'); panel.id = 'pkpanel';
  panel.innerHTML = `<input type="search" id="pkq" placeholder="Übung oder Flow suchen …" autocomplete="off"><div class="pkgrid">${seqRows ? head('Flows (Sequenzkatalog)') + seqRows : ''}${head('Übungen (Übungskatalog)')}${exRows}</div>`;
  document.body.appendChild(panel);
  const r = btn.getBoundingClientRect(), w = Math.min(640, window.innerWidth - 16);
  panel.style.width = w + 'px'; panel.style.left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8)) + 'px';
  const below = window.innerHeight - r.bottom - 12, above = r.top - 12;
  if (below >= 280 || below >= above) { panel.style.top = (r.bottom + 4) + 'px'; panel.style.maxHeight = Math.max(220, below) + 'px'; }
  else { panel.style.bottom = (window.innerHeight - r.top + 4) + 'px'; panel.style.maxHeight = Math.max(220, above) + 'px'; }
  const q = document.getElementById('pkq'); q.focus();
  q.addEventListener('input', () => { const v = norm(q.value); panel.querySelectorAll('.pko').forEach(b => { b.style.display = !v || b.dataset.q.includes(v) ? '' : 'none'; }); });
}

// Flow: Kosten eines Übergangs zwischen zwei Übungen nach ihrer Körperposition (gleiche Position 0, direkter Übergang 0,3, Sprung 1)
function aiFlowCost(a, b) { const pa = aiSeqPos(a), pb = aiSeqPos(b); return pa === pb ? 0 : aiSeqLink(pa, pb) ? 0.3 : 1; }
// Peak Pose am Ende des Blocks bleibt am Ende: fn arbeitet nur auf den Übungen davor
function aiGenKeepTail(items, fn) {
  const tail = []; while (items.length && !items[items.length - 1].seq && (exById(items[items.length - 1].id) || {}).peak) tail.unshift(items.pop());
  try { fn(items); } finally { items.push(...tail); }
}
// Beste Stelle für die Gruppe bid im Block: kleinste Übergangskosten zur Vorgänger- und Nachfolgerübung (bei Gleichstand die nähere Stelle in der Reihenfolge der Stundenplanung)
function aiGenGroupPos(items, bid) {
  const ex = i => { const e = exById(i.id); return e && !e.txt ? e : null; }, grp = items.filter(i => i.seq === bid).map(ex).filter(Boolean), rest = items.filter(i => !i.seq);
  if (!grp.length) return 0;
  const first = grp[0], last = grp[grp.length - 1], far = (a, b) => Math.abs(seqIdx(a.id) - seqIdx(b.id)) / 200;
  let best = { p: 0, c: Infinity };
  for (let p = 0; p <= rest.length; p++) {
    const prev = rest.slice(0, p).reverse().map(ex).find(Boolean), next = rest.slice(p).map(ex).find(Boolean);
    const c = (prev ? aiFlowCost(prev, first) + far(prev, first) : 0) + (next ? aiFlowCost(last, next) + far(last, next) : 0);
    if (c < best.c - 1e-9) best = { p, c };
  }
  return best.p;
}
// Flows der Auswahl in die Stunde übernehmen (Gruppen im Block ihrer Art); Namen der Flows, deren Block nicht aktiv ist
function aiGenSeqApply(c, s, qs) {
  if (!qs.length) return [];
  s.seqPlan = { on: true, blocks: qs.map(q => ({ id: uid(), type: sqType(q), seqId: q.id, pos: 0 })) };
  applySeqPlan(c, s);
  return s.seqPlan.blocks.filter(b => !SEQ_BLKS.some(k => (s.blk[k] || []).some(i => i.seq === b.id))).map(b => sqById(b.seqId).name + ' (Block nicht aktiv)');
}
// Eine gewählte Übung einbauen: sie ersetzt die passendste Übung (gleiche Körperposition, ähnliche Dauer, schwach bewertet) eines passenden Blocks und wird einsortiert
function aiGenInclude(c, s, e, keep) {
  if (blkIds(s).includes(e.id)) return true;
  let best = null;
  exKeys(s).filter(k => bon(s, k) && bty(s, k) === 'ex').forEach(k => {
    const ab = abOf(s, k), cat = (BCATS[ab] || []).includes(e.c);
    if (!anFits(e, ab) && !cat) return;
    const items = s.blk[k] || [], base = cat ? 0 : 3;
    if (!items.some(i => !i.seq && !isSb(i))) { if (!best || base + 5 < best.d) best = { k, idx: -1, d: base + 5 }; return; }
    items.forEach((it, idx) => {
      const v = exById(it.id); if (!v || v.txt || it.seq || keep.has(v.id) || (v.peak && !e.peak)) return;
      const d = base + (aiSeqPos(v) === aiSeqPos(e) ? 0 : 4) + Math.abs((+it.min || 0) - e.m) + (rating(v.id) - 3) * 0.5 + (it.id === 'tadasana' ? 9 : 0) + ((v.c === 'kraft') === (e.c === 'kraft') ? 0 : 6) - (v.peak && e.peak ? 8 : 0);
      if (!best || d < best.d) best = { k, idx, d };
    });
  });
  if (!best) return false;
  const ni = mkItem(e); if (e.peak && effLevel(c, s) !== 'fort') ni.peakAlt = true;
  if (best.idx < 0) s.blk[best.k].push(ni); else s.blk[best.k][best.idx] = ni;
  applyAlt(s, ni); return true;
}
// Nach dem Einbauen: Übungen in die Reihenfolge der Stundenplanung bringen (Peak Pose bleibt am Ende), Flows an die glatteste Stelle setzen
function aiGenFlowPlace(s) {
  exKeys(s).forEach(k => {
    const items = s.blk[k]; if (!items || !items.length) return;
    aiGenKeepTail(items, a => {
      sortItems(a);
      seqUnits(a).filter(u => u.seq).forEach(u => { const pos = aiGenGroupPos(a, u.seq); a.forEach(i => { if (i.seq === u.seq) i.seqPos = pos; }); sortItems(a); });
    });
  });
  seqSyncPlan(s);
}
// Hinweise zu den Übergängen an den eingebauten Stellen (Sprünge zwischen Körperpositionen, die nicht direkt ineinander übergehen)
function aiGenFlowNotes(s, ids) {
  const notes = [];
  exKeys(s).filter(k => bon(s, k)).forEach(k => {
    const rows = (s.blk[k] || []).map(i => ({ i, e: exById(i.id) })).filter(r => r.e && !r.e.txt);
    for (let j = 1; j < rows.length; j++) {
      const a = rows[j - 1], b = rows[j];
      if (!(((a.i.seq || b.i.seq) && a.i.seq !== b.i.seq) || ids.has(a.e.id) || ids.has(b.e.id))) continue;
      if (aiFlowCost(a.e, b.e) >= 1) notes.push(`„${a.e.n}“ (${AISEQ_POS[aiSeqPos(a.e)]}) zu „${b.e.n}“ (${AISEQ_POS[aiSeqPos(b.e)]})`);
    }
  });
  return notes;
}
// Eingeplante Inhalte brauchen ihren Block: Mobilisation und Shakti Naam einschalten, wenn nur dort passende Inhalte stehen
function aiGenNeed(c, rows, lock) {
  if (lock && lock.struct) return;   // festgelegter Aufbau bleibt: ein ausgeschalteter Block wird als „nicht aktiv“ gemeldet
  const t = r => r.q ? sqType(r.q) : r.e.c;
  if (rows.some(r => t(r) === 'mobilisation' || t(r) === 'mobi_sitz') && c.mobi === 'aus') c.mobi = 'sitz';
  if (rows.some(r => t(r) === 'shakti') && !c.shakti) { c.shakti = 1; c.shaktiMode = 'immer'; if (!(+c.durs.shakti > 1)) c.durs.shakti = 8; }
  fitDurs(c, 'total');
}
const aiIncText = rows => rows.map(r => r.q ? `Flow „${r.q.name}“ (${SEQ_TYPES[sqType(r.q)].n}, Übungen: ${sqExs(r.q).map(e => e.n).join(', ')})` : `Übung „${r.e.n}“`).join('; ');

// Katalogübung zu einem frei genannten Namen finden (genau, dann Anfang, dann enthalten)
function aiGenFind(name) {
  const n = norm(name); if (n.length < 3) return null;
  const all = exAll().filter(e => !e.txt), nm = e => norm(e.n);
  return all.find(e => nm(e) === n || norm(e.sa || '') === n) || all.find(e => nm(e).startsWith(n)) || all.find(e => nm(e).includes(n)) || all.find(e => nm(e).length >= 6 && n.includes(nm(e))) || null;
}
// Wunschübungen (frei genannte Namen) in eine Stunde einbauen: nur Katalogübungen, die zu den Einschränkungen passen
function aiGenWishes(c, s, wishes, skip) {
  const geb = effGeb(c, s), put = [], miss = [];
  (Array.isArray(wishes) ? wishes : []).slice(0, 8).forEach(w => {
    const e = aiGenFind(String(w)); if (!e) { miss.push(String(w)); return; }
    if (blkIds(s).includes(e.id)) { put.push(e.n); return; }
    if (contra(e, geb) || !anSwapIn(s, e, skip)) miss.push(e.n + ' (passt nicht)'); else put.push(e.n);
  });
  return { put, miss };
}
const aiGenList = m => Object.keys(m).map(k => `${k} (${String(m[k]).replace(/\s*\(.*$/, '')})`).join(', ');
async function aiGenPlan(g) {
  const inc = aiIncList(g), geb = g.geb.map(k => GEBRECHEN[k]).filter(Boolean);
  const p = `Du bist eine erfahrene Yogalehrerin und hilfst einer Kollegin, eine einzelne Yogastunde zu planen. Die Übungen wählt ihre Software aus ihrem Katalog aus. Du legst nur die Rahmenbedingungen fest und nennst Übungen, die sie ausdrücklich wünscht.
Beschreibung der Kollegin: „${g.prompt.trim()}“
Feste Vorgaben: Gruppe ${LEVELS[g.level]}, Dauer ${g.total} Minuten${geb.length ? ', Einschränkungen: ' + geb.join(', ') : ''}. ${g.motto.trim() ? 'Das Motto ist vorgegeben: „' + g.motto.trim() + '“ (du ergänzt Kernsatz, Fokus und Schlagworte).' : 'Wähle ein passendes Motto.'}
${g.struct ? 'Der Stundenaufbau (Atemteil, Mantra, Mobilisation, Kraftübungen, Zeiten) ist von der Kollegin fest vorgegeben: breath, mantra, mobi und kraft werden ignoriert, gib dafür Standardwerte an. ' : ''}${g.auswahl ? 'Yogastil und Körperregion sind ebenfalls fest vorgegeben: lass st und reg leer. ' : ''}${inc.length ? `Fest eingeplant (die Kollegin hat sie aus ihrem Katalog gewählt, ihre Software baut sie zwingend ein): ${aiIncText(inc)}. Wähle Motto, Fokus, Yogastile, Körperregionen, Mobilisation und Kraft so, dass die Stunde dazu passt und diese Inhalte natürlich darin liegen. Setze st und reg nur, wenn sie diese Inhalte nicht ausschließen. Führe sie nicht zusätzlich unter wish auf.\n` : ''}Antworte ausschließlich mit JSON in genau dieser Form:
{"motto":{"title":"2 bis 5 Wörter","kern":"Kernsatz in der Ich-Form","focus":"körperlicher Fokus in Stichworten","tags":["2 bis 4 Schlagworte aus: ${Object.keys(KEYWORDS).join(', ')}"]},
"st":["Yogastile aus: ${aiGenList(STILE)}"],"reg":["Körperregionen aus: ${aiGenList(KAT.reg)}"],
"breath":"aus oder atem oder atem_wahr oder gemischt","mantra":"aus oder immer","mobi":"sitz oder liegen oder stand oder aus","kraft":0,"wish":["Name einer gewünschten Übung"]}
Regeln: st und reg nur füllen, wenn die Beschreibung es deutlich verlangt, sonst leere Listen (leer bedeutet alle). breath: atem = nur Atemübung, atem_wahr = Atem und Wahrnehmungsübung, gemischt = im Wechsel, aus = kein Atemteil. kraft ist die Zahl der Kraftübungen von 0 bis 3. wish enthält nur Übungen, die die Kollegin ausdrücklich nennt, mit gebräuchlichem deutschen Namen. Wenn die Beschreibung etwas nicht erwähnt, wähle sinnvolle Standardwerte. Keine Gedankenstriche.`;
  try { return jsonFrom(await aiCall(p, 2500), '{', '}'); }
  catch (e) { if (/JSON|position/.test(e.message)) throw new Error('Die KI-Antwort war nicht lesbar. Bitte nochmal versuchen.'); throw e; }
}
// Plan der KI auf das Programm (Einzelstunde) übertragen; unbekannte Werte werden ignoriert
function aiGenApply(c, p, lock) {
  lock = lock || {};   // struct / auswahl: von der Kollegin festgelegt, die KI ändert daran nichts
  const only = (arr, map) => (Array.isArray(arr) ? arr : []).filter(k => map[k]);
  if (!lock.auswahl) { c.st = only(p.st, STILE); c.reg = only(p.reg, KAT.reg); }
  if (lock.struct) return;
  if (['aus', 'atem', 'atem_wahr', 'gemischt'].includes(p.breath)) c.breath = p.breath;
  if (['aus', 'immer'].includes(p.mantra)) c.mantra = p.mantra;
  if (['sitz', 'liegen', 'stand', 'aus'].includes(p.mobi)) c.mobi = p.mobi;
  if (p.kraft !== undefined && p.kraft !== null && !isNaN(+p.kraft)) { const n = clamp(Math.round(+p.kraft), 0, 3); c.kraft = n > 0; c.kraftN = n || 1; }
  fitDurs(c, 'total');
}

const AIGEN_ACTIONS = {
  aiGenGeb(d) { const g = ui.aiGen, i = g.geb.indexOf(d.k); i < 0 ? g.geb.push(d.k) : g.geb.splice(i, 1); render(); },
  aiGenTotal(d) { ui.aiGen.total = +d.v; render(); },
  aiGenExample() { aiExTake('aiGen', AIGEN_EXAMPLES, ui.aiGen); },
  aiGenExLvl(d) { ui.aiGenEx = d.v; render(); },
  aiGenStruct() { const g = ui.aiGen, c = aiGenDraft(g); g.struct = !g.struct; if (g.struct) { c.total = clamp(Math.round(+g.total) || 75, 20, 180); fitDurs(c, 'total'); } else g.total = c.total; render(); },
  aiGenPick() { const g = ui.aiGen; g.auswahl = !g.auswahl; render(); },
  aiGenIncOpen(d, el) { openAiIncPicker(el); },
  aiGenIncPick(d) {
    const p = ui.pk, g = ui.aiGen; if (!p || p.kind !== 'aiinc' || !g) return;
    const t = d.t === 'seq' ? 'seq' : 'ex'; g.inc = g.inc || [];
    if (g.inc.length < AIINC_MAX && !g.inc.some(x => x.t === t && x.id === d.id)) g.inc.push({ t, id: d.id });
    closePicker(); render();
  },
  aiGenIncDel(d) { const g = ui.aiGen; if (!g) return; g.inc = (g.inc || []).filter(x => !(x.t === d.t && x.id === d.id)); render(); },
  async aiGenCreate() {
    const g = ui.aiGen; if (!g || ui.aiGenBusy) return;
    if (!(g.prompt || '').trim()) { toast('Bitte beschreibe die Stunde im Textfeld.'); return; }
    if (!(state.settings.apiKey || '').trim()) { toast('Kein API-Schlüssel hinterlegt (Einstellungen, Abschnitt „KI-Texte“).', 6000); return; }
    const inc = aiIncList(g), bad = inc.filter(r => aiIncBad(r, g.geb).length);
    if (bad.length) { const b = bad[0]; toast(`„${b.q ? b.q.name : b.e.n}“ passt nicht zu den gewählten Einschränkungen. Bitte bei „Enthaltene Übung oder Flow“ entfernen oder die Einschränkung ändern.`, 7000); return; }
    ui.aiGenBusy = true; render(); toast('KI plant die Stunde …', 30000);
    try {
      const p = await aiGenPlan(g), pm = p.motto || {}, tags = (Array.isArray(pm.tags) ? pm.tags : []).filter(t => KEYWORDS[t]);
      const title = (g.motto || '').trim() || String(pm.title || '').trim() || 'Neue Stunde', kern = String(pm.kern || '').trim() || `Heute darf „${title}“ für mich spürbar werden.`;
      const lock = { struct: !!g.struct, auswahl: !!g.auswahl }, dr = aiGenDraft(g), mine = {};
      if (lock.struct) ['durs', 'durMode', 'breath', 'breathPrev', 'kraft', 'kraftN', 'kraftRnd', 'kraftSeed', 'mantra', 'mobi', 'mobiSeed', 'shakti', 'shaktiMode', 'shaktiSeed', 'einlOn', 'schlussOn', 'shavaOn', 'ausglOn'].forEach(k => { if (dr[k] !== undefined) mine[k] = deepCopy(dr[k]); });
      if (lock.auswahl) { mine.st = dr.st.slice(); mine.reg = dr.reg.slice(); }
      const c = defaultCourseFixed(Object.assign(mine, { name: (g.name || '').trim() || title, count: 1, single: true, start: g.date || todayIso(), level: LEVELS[g.level] ? g.level : 'sen', gebrechen: g.geb.slice(), total: clamp(Math.round(lock.struct ? dr.total : +g.total) || 75, 20, 180), motto: { mode: 'eigen', preset: 'alltag', free: '', eigen: title + ' | ' + kern } }));
      aiGenApply(c, p, lock); aiGenNeed(c, inc, lock); planCourse(c);
      const s = c.sessions[0], motto = { themeId: '', title, kern, focus: String(pm.focus || '').trim() || focusFromTags(tags.length ? tags : keywordTags(title)), tags: tags.length ? tags : keywordTags(title) };
      fillSession(c, s, 0, { motto });
      const notes = [];
      if (anItems(s).length < 6 && (c.st.length || c.reg.length)) { c.st = []; c.reg = []; fillSession(c, s, 0, { motto }); notes.push('Stil- und Regionsvorgabe war zu eng und wurde nicht angewendet.'); }
      // Gewählte Flows und Übungen zuerst (geschützt vor Wunschübungen), dann alles in einen Fluss bringen
      const incQ = inc.filter(r => r.q).map(r => r.q), incE = inc.filter(r => r.e).map(r => r.e), keep = new Set(incE.map(e => e.id).concat(incQ.flatMap(q => sqExs(q).map(e => e.id)))), incMiss = aiGenSeqApply(c, s, incQ), incPut = incQ.map(q => q.name).filter(n => !incMiss.some(m => m.startsWith(n + ' (')));
      incE.forEach(e => { if (aiGenInclude(c, s, e, keep)) incPut.push(e.n); else incMiss.push(e.n + ' (kein passender aktiver Block)'); });
      const { put, miss } = aiGenWishes(c, s, p.wish, v => keep.has(v.id));
      if (inc.length) { aiGenFlowPlace(s); const fn = aiGenFlowNotes(s, new Set(incE.map(e => e.id))); if (fn.length) notes.push('Übergänge prüfen: ' + fn.slice(0, 3).join('; ') + (fn.length > 3 ? '; …' : '') + '.'); }
      put.unshift(...incPut); miss.unshift(...incMiss);
      fitSession(c, s);
      incQ.forEach(q => { const blk = (s.seqPlan && s.seqPlan.blocks.find(b => b.seqId === q.id)); const key = blk && SEQ_TYPES[sqPType(blk)].blk, tgt = key && blockTargets(c, s)[key]; if (tgt > 0 && sqMin(q) > tgt) notes.push(`„${q.name}“ dauert ${fmtMin(sqMin(q))} Min., der Block nur ${fmtMin(tgt)} Min. (Blockzeit in den Vorgaben erhöhen).`); });
      if (Math.abs(plannedTotal(s) - sessionTotal(s)) > 1.01) notes.push('Die geplante Zeit weicht um ' + fmtMin(Math.abs(plannedTotal(s) - sessionTotal(s))) + ' Min. von der Soll-Dauer ab (Vorgaben prüfen).');
      s.aiPrompt = g.prompt.trim();
      state.courses.unshift(c); ui.aiGen = null; ui.sTab = 'list'; ui.view = 'course'; ui.courseId = c.id; ui.tab = 'sessions'; ui.sel = s.id; ui.open = new Set(['set', 'ovw']);
      save(); render(); toast('Stunde angelegt, KI schreibt die Texte …', 30000);
      try { await aiTexts(c, s, 0, g.prompt.trim() + (inc.length ? ' Fest enthalten sind: ' + aiIncText(inc) + '. Beschreibe in den Texten fließende Übergänge zu diesen Inhalten.' : '')); save(); render(); toast(`Stunde „${title}“ erstellt.${put.length ? ' Eingebaut: ' + put.join(', ') + '.' : ''}${miss.length ? ' Nicht eingebaut: ' + miss.join(', ') + '.' : ''}${notes.length ? ' ' + notes.join(' ') : ''}`, 9000); }
      catch (e) { console.error(e); toast('Stunde erstellt, aber die KI-Texte fehlen: ' + e.message + ' Mit „Texte per KI“ nochmal versuchen.', 12000); }
    } catch (e) { console.error(e); toast('⚠ ' + e.message, 12000); }
    finally { ui.aiGenBusy = false; render(); }
  }
};


// ---------- Ganzes Programm per KI ----------
const AIPROG_EXAMPLES = {
  anf: 'Ein Einsteigerprogramm über 8 Wochen für Menschen ohne Yoga-Erfahrung unter dem Übermotto „Yoga entdecken“. Jede Stunde lernt die Gruppe ein bis zwei neue Grundhaltungen kennen, die in den Folgestunden wiederkehren und sich langsam steigern. Anfangs nur Atem, Mobilisation und einfache Haltungen im Stehen, ab der Mitte etwas Balance. Keine Kraftübungen, kein Mantra. Am Ende jeder Stunde eine kurze Entspannung. In Stunde 3 bitte die Kindhaltung, in Stunde 6 den Baum einbauen. Die Texte sollen ermutigend und ohne Fachbegriffe sein.',
  mittel: 'Ein Programm über 10 Wochen für Teilnehmende mit etwas Erfahrung unter dem Übermotto „Kraft und Stabilität“. Die Stunden bauen aufeinander auf: zuerst Stand und Beine, dann Rumpf und Balance, zum Schluss kleine Flows. Zwei Kraftübungen je Stunde, ein Mantra nur in jeder zweiten Stunde. Immer ein Cool down und eine ausführliche Endentspannung. In Stunde 5 bitte Krieger II, in Stunde 9 den Baum als Höhepunkt. Die Texte sollen klar und motivierend sein.',
  fort: 'Ein fordernder Programmzyklus über 8 Wochen für Fortgeschrittene unter dem Übermotto „Hingabe und Intensität“. Von Stunde zu Stunde steigen Haltezeiten und Anspruch, jede Stunde hat eine Peak Pose, in den letzten drei Stunden sind es die anspruchsvollsten. Drei Kraftübungen, ein dynamischer Anteil, ausführliche Gegenhaltungen und eine lange Tiefenentspannung. Atem und Mantra in jeder Stunde. In Stunde 4 bitte die Taube in der tieferen Variante. Die Texte sollen präzise sein und dürfen Fachbegriffe nutzen.',
  gemischt: 'Ein Programm über 8 Wochen für eine gemischte Gruppe aus Anfängern und Geübten unter dem Übermotto „Gemeinsam in Bewegung“. Alle Übungen sollen in einer leichteren und einer fordernderen Variante möglich sein. Die Stunden wechseln zwischen ruhigen Stunden mit Hüfte und Rücken und aktiveren Stunden mit Stand und Balance. Eine Kraftübung je Stunde, das Mantra nur in jeder dritten Stunde. Immer eine Tiefenentspannung am Schluss. Die Texte sollen einladend sein und beide Varianten nennen.',
  sen: 'Ein Herbstprogramm für meine Seniorengruppe über 8 Wochen unter dem Übermotto „Ankommen und Loslassen“. Die Stunden sollen sanft beginnen und sich langsam steigern: am Anfang Atem und Mobilisation, in der Mitte ein Schwerpunkt auf Hüfte und Rücken, gegen Ende Gleichgewicht und Standfestigkeit. In jeder Stunde eine ausführliche Tiefenentspannung am Schluss, ein Mantra nur in jeder zweiten Stunde. Keine Kraftübungen. In Stunde 4 bitte die Taube in der sanften Variante, in Stunde 7 den Baum einbauen. Die Texte sollen ruhig, einfach und warm klingen.'
};
const AIPROG_EXAMPLE = AIPROG_EXAMPLES.sen;
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
${aiExBox('aiProg', AIPROG_EXAMPLES, g)}
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
  aiProgExample() { aiExTake('aiProg', AIPROG_EXAMPLES, ui.aiProg); },
  aiProgExLvl(d) { ui.aiProgEx = d.v; render(); },
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


// ---------- Einzelnen Übungsblock per KI neu berechnen (Einzelstundenplanung) ----------
// Die KI wählt und ordnet die Übungen des Blocks so, dass sie aus der letzten Übung des vorigen Blocks heraus fließen und in den nächsten Block münden.
// Es bleibt bei der Anzahl der Übungen des Blocks; Flows (Sequenzen) und Sonderbausteine bleiben an ihrer Stelle; Kandidaten kommen aus dem Katalog (Gruppe, Einschränkungen, Vorgaben und Filter der Stunde).
const aiBlkEx = it => { const e = it && exById(it.id); return e && !e.txt ? e : null; };
// Übung (oder Textstelle) direkt vor bzw. nach dem Block: nächster aktiver Block mit Inhalt
function aiBlkNeighbors(s, key) {
  const ks = order(s), i = ks.indexOf(key), exs = k => (s.blk[k] || []).map(aiBlkEx).filter(Boolean);
  const res = { prev: null, next: null };
  for (let j = i - 1; j >= 0 && !res.prev; j--) {
    const k = ks[j]; if (!bon(s, k)) continue;
    if (bty(s, k) === 'ex') { const l = exs(k); if (l.length) res.prev = { block: bn(s, k), e: l[l.length - 1] }; }
    else res.prev = { block: bn(s, k), e: null };
  }
  for (let j = i + 1; j < ks.length && !res.next; j++) {
    const k = ks[j]; if (!bon(s, k)) continue;
    if (bty(s, k) === 'ex') { const l = exs(k); if (l.length) res.next = { block: bn(s, k), e: l[0] }; }
    else res.next = { block: bn(s, k), e: null, lie: abOf(s, k) === 'shava' };
  }
  return res;
}
async function aiBlockPlan(c, s, key, ctxInfo) {
  const { cands, skel, n, kN, pN, nb } = ctxInfo, ab = abOf(s, key);
  const geb = effGeb(c, s).map(k => GEBRECHEN[k]).filter(Boolean), pos = e => AISEQ_POS[aiSeqPos(e)];
  const prevTxt = nb.prev ? (nb.prev.e ? `Der vorige Block „${nb.prev.block}“ endet mit „${nb.prev.e.n}“ (${pos(nb.prev.e)}).` : `Davor kommt „${nb.prev.block}“ (Atem, Text oder Mantra, meist im aufrechten Sitzen).`) : 'Davor kommt nichts: die Stunde beginnt mit diesem Block.';
  const nextTxt = nb.next ? (nb.next.e ? `Danach folgt der Block „${nb.next.block}“ und beginnt mit „${nb.next.e.n}“ (${pos(nb.next.e)}).` : nb.next.lie ? `Danach folgt „${nb.next.block}“ in Rückenlage.` : `Danach folgt „${nb.next.block}“ (Text, kein Übungsblock).`) : 'Danach kommt nichts mehr.';
  const list = cands.map(e => `${e.id} | ${e.n} | ${pos(e)} | ${fmtMin(e.m)} Min. | ${lvName(e)}${e.c === 'kraft' ? ' | Kraft' : ''}${e.peak ? ' | Peak Pose' : ''}`).join('\n');
  const p = `Du bist eine erfahrene Yogalehrerin und hilfst einer Kollegin, einen einzelnen Übungsblock ihrer Yogastunde neu zusammenzustellen. Die Übungen stammen aus ihrem Katalog.
Stunde: Gruppe ${LEVELS[effLevel(c, s)]}, ${sessionTotal(s)} Minuten${geb.length ? ', Einschränkungen: ' + geb.join(', ') : ''}. Motto: „${s.motto.title}“${s.motto.focus ? ', Fokus: ' + s.motto.focus : ''}.${s.aiPrompt ? ' Beschreibung der Kollegin: „' + s.aiPrompt + '“.' : ''}${(c.st || []).length || (c.reg || []).length ? ` Vorgaben: ${[(c.st || []).map(k => STILE[k]).filter(Boolean).join(', '), (c.reg || []).map(k => KAT.reg[k]).filter(Boolean).join(', ')].filter(Boolean).join('; ')} (bevorzugen).` : ''}
Zu berechnen ist der Block „${bn(s, key)}“ (${aiBlkKind(ab)}), Dauer ${fmtMin(blockMin(s, key))} Min.
${prevTxt}
${nextTxt}
Aufbau des Blocks (${n} freie Plätze, die du mit Übungen füllst; feste Teile bleiben an ihrer Stelle):
${skel}
Katalog (eine Übung je Zeile: ID | Name | Körperposition | Dauer | Stufe):
${list}

Antworte ausschließlich mit JSON in genau dieser Form: {"items":[{"id":"ID aus dem Katalog"}]}
Regeln: "items" enthält genau ${n} Einträge in der Reihenfolge der freien Plätze, keine ID doppelt.${kN ? ` Genau ${kN} davon sind Kraftübungen (Zeile mit „Kraft“).` : ' Keine Kraftübungen.'}${pN ? ` Eine Peak Pose (Zeile mit „Peak Pose“) steht als letzte Übung.` : ''}
Das Wichtigste ist der Flow: Die erste Übung muss aus dem Ende des vorigen Blocks natürlich entstehen (zum Beispiel nach Rückenlage zuerst über Seitlage, Drehung oder Vierfüßler aufrichten, nie direkt vom Liegen in den Stand springen), jede weitere Übung aus der vorigen, und die letzte Übung soll in den folgenden Block münden. Achte auf die Körperposition: bleibe möglichst lange in derselben Position oder wechsle nur zu einer direkt benachbarten (Sitz, Stand, Balance, Vierfüßler/Knien, Bauchlage, Rückenlage, Langsitz; vom Stand nie direkt in die Rückenlage und umgekehrt). Wechsle die Position nur so oft wie nötig. Baue einen runden Bogen: ruhig beginnen, steigern, sanft ausklingen, sofern der Block das zulässt. Nutze das Motto und die Vorgaben der Stunde für die Auswahl. Verwende nur IDs aus dem Katalog.`;
  try { return jsonFrom(await aiCall(p, 2500), '{', '}'); }
  catch (e) { if (/JSON|position/.test(e.message)) throw new Error('Die KI-Antwort war nicht lesbar. Bitte nochmal versuchen.'); throw e; }
}
const aiBlkKind = ab => ({ mobi: 'Mobilisation', shakti: 'Shakti Naam', aufw: 'Aufwärmen im Stand', asana: 'Asanas, Hauptteil', ausgl: 'Ausgleich und Cool down am Boden', kraft: 'Kraftübungen' })[ab] || 'Übungsblock';
async function aiRerollBlock(c, s, key) {
  const items = s.blk[key] || [], ab = abOf(s, key), main = ab === 'asana';
  const free = items.filter(it => !it.seq && !isSb(it) && aiBlkEx(it)), fixedIds = items.filter(it => it.seq || isSb(it)).map(it => it.id);
  let n = free.length;
  if (!n) { if (items.some(it => it.seq)) throw new Error('In diesem Block steht nur ein Flow, der nicht verändert wird.'); n = Math.max(2, Math.round((blockMin(s, key) || 6) / 1.5)); }
  const kN = main ? free.filter(it => aiBlkEx(it).c === 'kraft').length : 0, pN = main && free.some(it => aiBlkEx(it).peak) ? 1 : 0;
  const ctx = mkCtx(c, s, Math.random), mine = new Set(free.map(it => it.id));
  ctx.have = new Set(blkIds(s).filter(id => !mine.has(id)));
  let pool = poolFor(s, key).filter(e => !(main && e.c === 'kraft'));
  if (pool.length < n * 2 && FALLBACK[ab]) pool = pool.concat(poolOf(...FALLBACK[ab]));
  if (ab !== 'shakti' && ab !== 'kraft') pool = withPref(pool, ab, ctx);
  if (kN) pool = pool.concat(poolOf('kraft'));
  if (pN) pool = pool.concat(exAll().filter(e => e.peak && e.c !== 'kraft' && !pool.includes(e)));
  let cands = eligible(Array.from(new Set(pool)).filter(e => !e.txt), ctx);
  if (cands.length > 90) { const keep = cands.map(e => ({ e, sc: scoreEx(e, ctx) })).sort((a, b) => b.sc - a.sc).slice(0, 90).map(x => x.e); cands = cands.filter(e => keep.includes(e) || (kN && e.c === 'kraft' && keep.length < 100) || e.peak && pN); }
  cands.sort((a, b) => seqIdx(a.id) - seqIdx(b.id));
  if (cands.length < Math.min(n, 3)) throw new Error('Für diesen Block gibt es zu wenige passende Übungen im Katalog.');
  n = Math.min(n, cands.length);
  let slot = 0; const skel = items.map(it => { if (it.seq || isSb(it)) { const e = aiBlkEx(it); return `FEST: ${e ? e.n : exById(it.id).n}${it.seq ? ' (Teil des Flows „' + it.seqName + '“)' : ''}`; } return aiBlkEx(it) ? `Platz ${++slot}: frei` : ''; }).filter(Boolean);
  while (slot < n) skel.push(`Platz ${++slot}: frei`);
  const nb = aiBlkNeighbors(s, key), ids = new Set(cands.map(e => e.id));
  const r = await aiBlockPlan(c, s, key, { cands, skel: skel.join('\n'), n, kN, pN, nb });
  const chosen = [];
  (Array.isArray(r.items) ? r.items : []).forEach(x => { const e = x && x.id ? exById(String(x.id)) : null; if (e && ids.has(e.id) && !chosen.includes(e)) chosen.push(e); });
  if (chosen.length < 2) throw new Error('Die KI hat keine brauchbare Übungsfolge geliefert. Bitte nochmal versuchen.');
  chosen.length = Math.min(chosen.length, n);
  // fehlende Übungen: beste übrige Kandidaten an die Stelle mit dem glattesten Übergang setzen
  const notes = [];
  if (chosen.length < n) {
    notes.push(`${n - chosen.length} Übung(en) ergänzt, weil die KI zu wenige geliefert hat`);
    cands.map(e => ({ e, sc: scoreEx(e, ctx) })).sort((a, b) => b.sc - a.sc).map(x => x.e).filter(e => !chosen.includes(e) && !(kN === 0 && e.c === 'kraft') && !e.peak).slice(0, n - chosen.length).forEach(e => {
      let best = { p: chosen.length, c: Infinity };
      for (let q = 0; q <= chosen.length; q++) { const cc = (q ? aiFlowCost(chosen[q - 1], e) : 0) + (q < chosen.length ? aiFlowCost(e, chosen[q]) : 0); if (cc < best.c) best = { p: q, c: cc }; }
      chosen.splice(best.p, 0, e);
    });
  }
  let q = 0; const out = [];
  items.forEach(it => { if (it.seq || isSb(it)) out.push(it); else if (aiBlkEx(it) && q < chosen.length) out.push(mkItem(chosen[q++])); });
  while (q < chosen.length) out.push(mkItem(chosen[q++]));
  out.forEach(it => { if (!it.seq && !isSb(it)) { const e = aiBlkEx(it); applyAlt(s, it); if (e && e.peak && effLevel(c, s) !== 'fort') it.peakAlt = true; } });
  s.blk[key] = out;
  const bud = +(s.bm && s.bm[key] && s.bm[key].min) || 0; if (bud > 0) fitItems(out, bud);
  // Übergänge prüfen: Sprünge im Block und an den Blockgrenzen
  const seqE = out.map(aiBlkEx).filter(Boolean), chain = (nb.prev && nb.prev.e ? [nb.prev.e] : []).concat(seqE, nb.next && nb.next.e ? [nb.next.e] : []);
  const jumps = []; for (let k = 1; k < chain.length; k++) if (aiFlowCost(chain[k - 1], chain[k]) >= 1) jumps.push(`„${chain[k - 1].n}“ zu „${chain[k].n}“`);
  if (jumps.length) notes.push('Übergänge prüfen: ' + jumps.slice(0, 3).join('; ') + (jumps.length > 3 ? '; …' : ''));
  if (kN && seqE.filter(e => e.c === 'kraft').length !== kN) notes.push('Anzahl der Kraftübungen weicht ab');
  return { n: seqE.length, notes, prev: nb.prev };
}
Object.assign(AIGEN_ACTIONS, {
  async aiRerollBlk(d) {
    const { c, s } = sessionOf(d.id); if (!s || ui.aiBlkBusy) return;
    if (!(state.settings.apiKey || '').trim()) { toast('Kein API-Schlüssel hinterlegt (Einstellungen, Abschnitt „KI-Texte“).', 6000); return; }
    const key = d.b; ui.aiBlkBusy = s.id + ':' + key; render(); toast('KI berechnet den Block neu …', 30000);
    try {
      const r = await aiRerollBlock(c, s, key); touch(s); save(); ui.aiBlkBusy = null; render();
      toast(`Block „${bn(s, key)}“ neu berechnet (${r.n} Übungen${r.prev && r.prev.e ? ', Anschluss an „' + r.prev.e.n + '“' : ''}).${r.notes.length ? ' Hinweise: ' + r.notes.join(' | ') + '.' : ''}`, 10000);
    } catch (e) { console.error(e); toast('⚠ ' + e.message, 10000); }
    finally { ui.aiBlkBusy = null; render(); }
  }
});
