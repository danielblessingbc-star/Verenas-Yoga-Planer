/* Sequenzen: feste Übungsfolgen (z. B. Sonnengruß), die in Einzelstunden eingeplant werden.
   state.sequences = [{ id, name, items: [{ id: Übungs-ID, min }] }]  – Seite „Sequenzen“ (bearbeiten) und „Sequenzkatalog“ (nachschlagen).
   Einzelstunde: s.seqPlan = { on, blocks: [{ id, seqId }] }. Die Übungen der gewählten Sequenzen werden an den Anfang des Blocks „Asanas (Hauptteil)“ kopiert
   und mit it.seq (Blocknummer) und it.seqName markiert; die übrigen Asanas werden zeitlich angepasst (rebalanceBlock). */

// Mustersequenz: Sonnengruß aus Übungen des Katalogs (Modul 1, S. 64–77: Tadasana, Arme zur Sonne, Vorbeuge, Sprinter, Planke, Kobra, Herabschauender Hund)
function seqDefaults() {
  const ids = ['tadasana', 'arme_zur_sonne', 'vorbeuge', 'ashwa', 'phalakasana', 'kobra', 'adho_mukha', 'ashwa', 'vorbeuge', 'arme_zur_sonne', 'tadasana'];
  return [{ id: 'seq_sonnengruss', name: 'Sonnengruß', items: ids.map(id => ({ id, min: 0.5 })) }];
}
const sqById = id => (state.sequences || []).find(q => q.id === id) || null;
const sqItems = q => q.items.filter(i => exById(i.id));
const sqMin = q => sumMin(q.items);
const sqTile = it => { const e = exById(it.id); return e ? `<span class="mt cat-${e.c}" title="${esc(e.n)} · ${fmtMin(it.min)} Min.">${figureSVG(e.pose)}${peakStar(e)}</span>` : ''; };
const sqCount = n => n + (n === 1 ? ' Übung' : ' Übungen');

// ---------- Einplanen in eine Einzelstunde ----------
function seqPlanOf(s) { return s.seqPlan || (s.seqPlan = { on: false, blocks: [{ id: uid(), seqId: '' }] }); }
function seqActive(s) { return !!(s.seqPlan && s.seqPlan.on) && bon(s, 'asana') && bty(s, 'asana') === 'ex'; }
// Übungen der gewählten Sequenzen an den Anfang des Asana-Blocks setzen; ohne Plan (oder bei „Nein“) verschwinden sie wieder. Gelöschte Sequenzen lassen ihre schon kopierten Übungen stehen.
function applySeqPlan(c, s) {
  const items = s.blk && s.blk.asana, plan = s.seqPlan;
  if (!items || (!plan && !items.some(i => i.seq))) return;
  const old = {}; items.filter(i => i.seq).forEach(i => (old[i.seq] = old[i.seq] || []).push(i));
  const ins = [];
  if (seqActive(s)) plan.blocks.forEach(b => {
    const q = sqById(b.seqId);
    if (!q) { if (old[b.id]) ins.push(...old[b.id]); return; }
    sqItems(q).forEach(x => { const it = mkItem(exById(x.id), x.min); it.seq = b.id; it.seqName = q.name; applyAlt(s, it); ins.push(it); });
  });
  const have = new Set(ins.map(i => i.id));
  s.blk.asana = ins.concat(items.filter(i => !i.seq && !have.has(i.id)));
  if (s.bm && s.bm.asana && (+s.bm.asana.min || 0) > 0 && bon(s, 'asana')) rebalanceBlock(c, s, 'asana');
  else sortItems(s.blk.asana);
}
function seqPanel(c, s) {
  const id = s.id, p = seqPlanOf(s), seqs = state.sequences || [];
  const blocked = !bon(s, 'asana') || bty(s, 'asana') !== 'ex';
  const used = p.on ? p.blocks.map(b => (sqById(b.seqId) || {}).name).filter(Boolean) : [];
  const chip = p.on ? `<span class="chip warn">Ja${used.length ? ': ' + esc(used.join(' + ')) : ''}</span>` : '<span class="muted">· Nein</span>';
  let body = '';
  if (p.on) {
    const rows = p.blocks.map((b, i) => {
      const q = sqById(b.seqId), missing = b.seqId && !q;
      const sum = q ? `${sqCount(q.items.length)} · ${fmtMin(sqMin(q))} Min.` : missing ? '<span class="chip warn">Sequenz wurde gelöscht</span>' : '<span class="muted">noch keine Sequenz gewählt</span>';
      return `<div class="seqb"><b>Sequenzblock ${i + 1}</b><select class="arts" data-chg="seqSel" data-sid="${id}" data-bid="${b.id}"><option value="">— Sequenz wählen —</option>${seqs.map(q2 => opt(q2.id, q2.name, b.seqId)).join('')}</select>
<span class="seqsum">${sum}</span><span class="mts">${q ? sqItems(q).map(sqTile).join('') : ''}</span>${p.blocks.length > 1 ? `<button class="ghost sm danger" data-a="seqBlkDel" data-id="${id}" data-bid="${b.id}" title="Sequenzblock entfernen">🗑</button>` : ''}</div>`;
    }).join('');
    const tot = sumMin((s.blk.asana || []).filter(i => i.seq));
    body = `${rows}<div class="bar"><button class="sm" data-a="seqBlkAdd" data-id="${id}">＋ Weiteren Sequenzblock hinzufügen</button><button class="ghost sm" data-a="seqApply" data-id="${id}" title="Übungen der gewählten Sequenzen erneut aus dem Sequenzkatalog übernehmen (z. B. nach einer Änderung der Sequenz)">↻ Aus Sequenzkatalog neu übernehmen</button><span class="grow"></span><span class="muted">Sequenzen in dieser Stunde: <b>${fmtMin(tot)}</b> Min.</span></div>`;
  }
  return `<details class="panel mini noprint" data-id="seq:${id}" ${ui.open.has('seq:' + id) ? 'open' : ''}><summary>Sequenzplanung ${chip} <span class="muted">· feste Übungsfolgen wie der Sonnengruß</span></summary>
<p class="muted">Die Übungen der gewählten Sequenz stehen am Anfang des Blocks „${esc(bn(s, 'asana'))}“. Die übrigen Asanas werden zeitlich angepasst. Spätere Änderungen an der Sequenz gelten erst nach „Neu übernehmen“.</p>
${blocked ? `<p class="banner">Der Block „${esc(bn(s, 'asana'))}“ ist in dieser Stunde ausgeschaltet oder kein Übungsblock: Sequenzen können erst eingeplant werden, wenn er wieder aktiv ist.</p>` : ''}
<div class="seqq"><b>Sequenzen einplanen?</b>${sGrp([[1, 'Ja'], [0, 'Nein']], p.on ? 1 : 0, 'seqOn', id, 'seq', blocked && !p.on)}</div>${body}</details>`;
}

// ---------- Seite „Sequenzen“ (anlegen, bearbeiten, speichern) ----------
function seqRow(it, i, n) {
  const e = exById(it.id), tile = e
    ? `<div class="xtile cat-${e.c} pkt" data-a="seqPk" data-i="${i}" title="Klicken: andere Übung wählen">${figureSVG(e.pose)}${peakStar(e)}</div>`
    : `<div class="xtile empty pkt" data-a="seqPk" data-i="${i}" title="Klicken: Übung wählen"><span class="plus">＋</span></div>`;
  return `<div class="seqrow"><span class="seqno">${i + 1}</span>${tile}<div class="seqnm">${e ? `<b>${esc(e.n)}</b>${e.sa ? `<i class="sa">${esc(e.sa)}</i>` : ''}` : '<b class="muted">noch keine Übung gewählt</b>'}</div>
<div class="am"><input type="number" min="0.5" max="30" step="0.5" value="${it.min}" data-chg="seqMin" data-i="${i}"><span>Min.</span></div>
<button class="ghost sm" data-a="seqMv" data-i="${i}" data-d="-1" ${i === 0 ? 'disabled' : ''} title="Nach oben">▲</button><button class="ghost sm" data-a="seqMv" data-i="${i}" data-d="1" ${i === n - 1 ? 'disabled' : ''} title="Nach unten">▼</button>
<button class="ghost sm danger" data-a="seqRm" data-i="${i}" title="Übung entfernen">🗑</button></div>`;
}
function viewSequences() {
  const d = ui.seqDraft;
  if (d) {
    return `<div class="bar"><h1>${d.isNew ? 'Neue Sequenz' : 'Sequenz bearbeiten'}</h1></div>
<section class="panel"><div class="grid">${fld('Sequenzname', inp('u:seqDraft.name', 'text', d.name, 'placeholder="z. B. Sonnengruß" autocomplete="off"'))}
${fld('Anzahl Übungen', `<input type="number" min="1" max="40" value="${d.items.length}" data-chg="seqCount">`)}</div>
<p class="muted">Die Anzahl legt fest, wie viele Übungen die Sequenz hat; wähle für jede die Übung per Klick auf die Kachel. Dieselbe Übung darf mehrfach vorkommen (z. B. Vorbeuge am Anfang und Ende).</p>
<div class="seqlist">${d.items.map((it, i) => seqRow(it, i, d.items.length)).join('')}</div>
<button class="pkb add" data-a="seqAdd">＋ Übung hinzufügen</button>
<div class="bar"><button class="primary" data-a="seqSave">💾 Sequenz speichern</button><button data-a="seqCancel">Abbrechen</button><span class="grow"></span><span>Summe: <b id="seqsum">${fmtMin(sumMin(d.items))}</b> Min.</span></div></section>`;
  }
  const list = state.sequences || [];
  const card = q => `<div class="card course"><div class="grow"><b class="title" data-a="seqEdit" data-id="${q.id}">${esc(q.name)}</b>
<div class="meta">${sqCount(q.items.length)} · ${fmtMin(sqMin(q))} Min.</div><span class="mts">${q.items.map(sqTile).join('')}</span></div>
<button data-a="seqEdit" data-id="${q.id}" class="primary">Bearbeiten</button><button data-a="seqDup" data-id="${q.id}" class="ghost" title="Duplizieren">⧉</button><button data-a="seqDel" data-id="${q.id}" class="ghost danger" title="Löschen">🗑</button></div>`;
  return `<div class="bar"><h1>Sequenzen</h1><span class="muted">${list.length} gespeichert</span><span class="grow"></span><button class="primary" data-a="seqNew">＋ Neue Sequenz</button></div>
<p class="muted">Eine Sequenz ist eine feste Folge von Übungen mit Namen. Gespeicherte Sequenzen liegen im Sequenzkatalog und lassen sich in der Einzelstundenplanung unter „Sequenzplanung“ einplanen.</p>
${list.map(card).join('') || '<div class="card"><p class="muted">Noch keine Sequenz gespeichert. Mit „Neue Sequenz“ legst du die erste an.</p></div>'}`;
}

// ---------- Seite „Sequenzkatalog“ (nachschlagen) ----------
function viewSeqCatalog() {
  const q = norm(ui.seqQ || ''), list = (state.sequences || []).filter(x => !q || norm(x.name).includes(q) || x.items.some(i => norm((exById(i.id) || {}).n || '').includes(q)));
  const step = (it, i) => { const e = exById(it.id); return e ? `<div class="sqstep"><span class="seqno">${i + 1}</span><div class="ktile cat-${e.c}">${figureSVG(e.pose)}${peakStar(e)}</div><b>${esc(e.n)}</b>${e.sa ? `<i class="sa">${esc(e.sa)}</i>` : ''}<small class="muted">${fmtMin(it.min)} Min.</small></div>` : ''; };
  const used = id => (state.courses || []).reduce((n, c) => n + c.sessions.filter(s => s.seqPlan && s.seqPlan.on && s.seqPlan.blocks.some(b => b.seqId === id)).length, 0);
  return `<div class="bar"><h1>Sequenzkatalog</h1><span class="muted">${list.length} von ${(state.sequences || []).length} Sequenzen</span><span class="grow"></span><button class="primary" data-a="seqNew">＋ Neue Sequenz</button></div>
<div class="panel"><div class="grid">${fld('Suche', `<input type="search" data-f="u:seqQ" data-live="1" value="${esc(ui.seqQ || '')}" placeholder="Sequenz oder Übung, z. B. Sonnengruß">`)}</div></div>
${list.map(x => `<section class="panel sqcat"><div class="bar"><h3>${esc(x.name)}</h3><span class="muted">${sqCount(x.items.length)} · ${fmtMin(sqMin(x))} Min. · in ${used(x.id)} Stunde(n) eingeplant</span><span class="grow"></span><button class="sm" data-a="seqEdit" data-id="${x.id}">✎ Bearbeiten</button></div>
<div class="sqsteps">${x.items.map(step).join('')}</div></section>`).join('') || '<div class="card"><p class="muted">Keine Sequenz gefunden.</p></div>'}`;
}

// ---------- Sequenz-Auswahl für eine Übung ----------
function openSeqPicker(btn, i) {
  closePicker();
  const d = ui.seqDraft; if (!d || !d.items[i]) return;
  const curId = d.items[i].id; ui.pk = { kind: 'seq', i };
  const rows = exAll().slice().sort((a, b) => seqIdx(a.id) - seqIdx(b.id)).map(p => `<button class="pko cat-${p.c}${p.id === curId ? ' cur' : ''}" data-a="seqPick" data-id="${p.id}" data-q="${esc(norm(p.n + ' ' + (p.sa || '')))}"><span class="pkf">${figureSVG(p.pose)}${peakStar(p)}</span><div class="pkinfo"><div class="pkname"><b>${esc(p.n)}</b>${p.sa ? `<small class="sa">${esc(p.sa)}</small>` : ''}</div><div class="pkmeta"><span>${esc(CATS[p.c] || '')}</span><span class="muted">· ${esc(lvName(p))}</span></div></div></button>`).join('');
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

// ---------- Aktionen ----------
const seqStart = (q, isNew) => { ui.seqDraft = { id: q.id, name: q.name, items: deepCopy(q.items), isNew }; ui.view = 'sequences'; ui.courseId = null; closePicker(); render(); window.scrollTo(0, 0); };
const SEQ_ACTIONS = {
  seqNew() { seqStart({ id: 'seq_' + uid(), name: '', items: [{ id: '', min: 0.5 }] }, true); },
  seqEdit(d) { const q = sqById(d.id); if (q) seqStart(q, false); },
  seqDup(d) { const q = sqById(d.id); if (!q) return; const n = deepCopy(q); n.id = 'seq_' + uid(); n.name = q.name + ' (Kopie)'; state.sequences.push(n); save(); render(); toast('Sequenz dupliziert.'); },
  seqDel(d, el) {
    const q = sqById(d.id); if (!q || !confirmTwice(el, 'seqdel' + d.id, `Sequenz „${q.name}“ löschen? Bereits eingeplante Übungen in Stunden bleiben erhalten`)) return;
    state.sequences = state.sequences.filter(x => x !== q); save(); render();
  },
  seqAdd() { const d = ui.seqDraft; if (!d || d.items.length >= 40) return; d.items.push({ id: '', min: 0.5 }); render(); },
  seqRm(d) { const dr = ui.seqDraft; if (!dr || dr.items.length <= 1) { toast('Eine Sequenz braucht mindestens eine Übung.'); return; } dr.items.splice(+d.i, 1); render(); },
  seqMv(d) { const a = ui.seqDraft.items, i = +d.i, j = i + +d.d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; render(); },
  seqPk(d, el) { openSeqPicker(el, +d.i); },
  seqPick(d) { const p = ui.pk, dr = ui.seqDraft; if (!p || p.kind !== 'seq' || !dr || !dr.items[p.i]) return; dr.items[p.i].id = d.id; closePicker(); render(); },
  seqCancel() { ui.seqDraft = null; closePicker(); render(); },
  seqSave() {
    const d = ui.seqDraft; if (!d) return;
    const name = String(d.name || '').trim();
    if (!name) { toast('Bitte einen Sequenznamen eingeben.'); return; }
    if (d.items.some(i => !i.id)) { toast('Bitte für jede Übung eine Auswahl treffen oder die Anzahl verringern.'); return; }
    if ((state.sequences || []).some(q => q.id !== d.id && norm(q.name) === norm(name))) { toast('Eine Sequenz mit diesem Namen gibt es schon.'); return; }
    const q = { id: d.id, name, items: d.items.map(i => ({ id: i.id, min: Math.max(0.5, +i.min || 0.5) })) }, k = state.sequences.findIndex(x => x.id === d.id);
    if (k >= 0) state.sequences[k] = q; else state.sequences.push(q);
    ui.seqDraft = null; save(); render(); toast(`Sequenz „${name}“ gespeichert (Sequenzkatalog).`);
  },
  // Einzelstunde: Sequenzplanung
  seqOn(d) {
    const { c, s } = sessionOf(d.id), p = seqPlanOf(s); p.on = d.v === '1'; if (p.on && !p.blocks.length) p.blocks.push({ id: uid(), seqId: '' });
    ui.open.add('seq:' + s.id); applySeqPlan(c, s); save(); render();
  },
  seqBlkAdd(d) { const { s } = sessionOf(d.id); seqPlanOf(s).blocks.push({ id: uid(), seqId: '' }); ui.open.add('seq:' + s.id); save(); render(); },
  seqBlkDel(d) { const { c, s } = sessionOf(d.id), p = seqPlanOf(s); p.blocks = p.blocks.filter(b => b.id !== d.bid); s.blk.asana = (s.blk.asana || []).filter(i => i.seq !== d.bid); ui.open.add('seq:' + s.id); applySeqPlan(c, s); save(); render(); },
  seqApply(d) { const { c, s } = sessionOf(d.id); ui.open.add('seq:' + s.id); applySeqPlan(c, s); save(); render(); toast('Sequenzen neu aus dem Sequenzkatalog übernommen.'); }
};
const SEQ_CH = {
  seqCount(el) {
    const d = ui.seqDraft; if (!d) return; const n = Math.max(1, Math.min(40, Math.round(+el.value) || 1));
    while (d.items.length < n) d.items.push({ id: '', min: 0.5 });
    if (d.items.length > n) { const cut = d.items.length - n; d.items.length = n; toast(`${cut} Übung(en) am Ende entfernt.`); }
    render();
  },
  seqMin(el) { const d = ui.seqDraft; if (!d) return; d.items[+el.dataset.i].min = Math.max(0.5, +el.value || 0.5); const t = document.getElementById('seqsum'); if (t) t.textContent = fmtMin(sumMin(d.items)); },
  seqSel(el) {
    const { c, s } = sessionOf(el.dataset.sid), b = seqPlanOf(s).blocks.find(x => x.id === el.dataset.bid); if (!b) return;
    b.seqId = el.value; s.blk.asana = (s.blk.asana || []).filter(i => i.seq !== b.id);
    touch(s); ui.open.add('seq:' + s.id); applySeqPlan(c, s); save(); render();
  }
};
