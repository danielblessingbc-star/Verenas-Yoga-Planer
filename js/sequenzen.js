/* Sequenzen: feste Übungsfolgen (z. B. Sonnengruß), die in Einzelstunden eingeplant werden.
   state.sequences = [{ id, name, type, items: [{ id: Übungs-ID, min, tx? }], desc, src: { n, u }, man: { Gruppe: [Werte] }, imp }]  – type: mobilisation | asana | cooldown (fehlt = asana).
   desc = Beschreibung, src = Quelle (Name, Link), man = manuell gesetzte Eigenschaften (alle anderen werden aus den Übungen abgeleitet), imp = Herkunfts-ID eines Imports.
   Eine Übung der Sequenz kann der Sonderbaustein „Textblock“ sein (id = 'textblock', tx = Text).
   Seite „Sequenzen“ (bearbeiten) und „Sequenzkatalog“ (nachschlagen).
   Einzelstunde: s.seqPlan = { on, blocks: [{ id, type, seqId, pos }] }. Die Art bestimmt den Stundenblock (Mobilisation → „Mobilisation im Sitzen“, Asana → „Asanas (Hauptteil)“,
   Cooldown → „Ausgleich / Cool down“). Die Übungen der gewählten Sequenz werden dort als zusammenhängende Gruppe eingefügt (it.seq = Block-ID, it.seqName, it.seqType, it.seqPos)
   und lassen sich nur als Ganzes verschieben (pos = Anzahl Einzelübungen vor der Gruppe); die übrigen Übungen werden zeitlich angepasst (rebalanceBlock). */

const SEQ_TYPES = { mobilisation: { n: 'Mobilisation', blk: 'mobi' }, asana: { n: 'Asana', blk: 'asana' }, cooldown: { n: 'Cooldown', blk: 'ausgl' } };
const SEQ_BLKS = ['mobi', 'asana', 'ausgl'];

// Mustersequenz: Sonnengruß aus Übungen des Katalogs (Modul 1, S. 64–77: Tadasana, Arme zur Sonne, Vorbeuge, Sprinter, Planke, Kobra, Herabschauender Hund)
function seqDefaults() {
  const ids = ['tadasana', 'arme_zur_sonne', 'vorbeuge', 'ashwa', 'phalakasana', 'kobra', 'adho_mukha', 'ashwa', 'vorbeuge', 'arme_zur_sonne', 'tadasana'];
  return [{ id: 'seq_sonnengruss', name: 'Sonnengruß', type: 'asana', items: ids.map(id => ({ id, min: 0.5 })), desc: 'Fließende Folge: Stand, Arme zur Sonne, Vorbeuge, Ausfallschritt, Planke, Kobra, Herabschauender Hund und wieder zurück. Mit dem Atem verbinden und im eigenen Tempo üben. Bei Schulter, Handgelenk oder Rücken die leichteren Varianten wählen.', src: { n: 'Ausbildungsskript Modul 1, S. 64 bis 77', u: '' } }];
}
// Altbestand: die Mustersequenz Sonnengruß bekommt Beschreibung und Quelle (nur, wenn beides noch leer ist)
function seqMigrate() { const q = (state.sequences || []).find(x => x.id === 'seq_sonnengruss'); if (q && !q.desc && !q.src) { const d = seqDefaults()[0]; q.desc = d.desc; q.src = d.src; } }
const sqById = id => (state.sequences || []).find(q => q.id === id) || null;
const sqType = q => (q && SEQ_TYPES[q.type]) ? q.type : 'asana';
const sqPType = b => SEQ_TYPES[b.type] ? b.type : (sqById(b.seqId) ? sqType(sqById(b.seqId)) : 'asana');
const sqTypeChip = t => `<span class="chip seqt t-${t}">${SEQ_TYPES[t].n}</span>`;
const sqItems = q => q.items.filter(i => exById(i.id));
const sqMin = q => sumMin(q.items);
const sqTile = it => { const e = exById(it.id); return e ? `<span class="mt cat-${e.c}" title="${esc(e.n)} · ${fmtMin(it.min)} Min.">${figureSVG(e.pose)}${peakStar(e)}</span>` : ''; };
const sqCount = n => n + (n === 1 ? ' Übung' : ' Übungen');
const sqExs = q => q.items.map(i => exById(i.id)).filter(e => e && !e.txt);
const sqTxN = q => q.items.filter(isTxb).length;
// Eigenschaften einer Sequenz: Zielgruppe, Vorsicht bei, Wirkung, Körperregion, Atmung, Hilfsmittel (aus den Übungen abgeleitet; q.man überschreibt je Gruppe)
const SQ_PROPS = [['lv', 'Geeignet für', () => ({ anf: LEVELS.anf, mittel: LEVELS.mittel, fort: LEVELS.fort, sen: LEVELS.sen })], ['x', 'Vorsicht bei', () => GEBRECHEN], ['wirk', 'Wirkung', () => KAT.wirk], ['reg', 'Körperregion', () => KAT.reg], ['atm', 'Atmung', () => KAT.atm], ['mat', 'Hilfsmittel', () => KAT.mat]];
function sqAuto(q) {
  const es = sqExs(q), uni = k => [...new Set(es.flatMap(e => (e.kat && e.kat[k]) || []))], reg = uni('reg').filter(r => r !== 'ganz');   // Körperregion: ab 7 Regionen gilt „ganzer Körper“
  return {
    lv: es.length ? ['anf', 'mittel', 'fort', 'sen'].filter(k => es.every(e => levelOk(e, k))) : [],
    x: [...new Set(es.flatMap(e => e.x || []))], wirk: uni('wirk'), reg: reg.length >= 7 ? ['ganz'] : reg, atm: uni('atm'), mat: uni('mat').filter(m => m !== 'matte')
  };
}
const sqIsMan = (q, g) => !!(q.man && Object.prototype.hasOwnProperty.call(q.man, g));
const sqProps = q => { const a = sqAuto(q), o = {}; SQ_PROPS.forEach(([g]) => { o[g] = sqIsMan(q, g) ? q.man[g] : a[g]; }); return o; };
// Chipzeile der Eigenschaften (kompakt: nur nicht leere Gruppen; „Vorsicht bei“ als Warnchip)
function sqPropChips(q, withLabels) {
  const p = sqProps(q);
  return SQ_PROPS.map(([g, lab, map]) => { const m = map(), v = (p[g] || []).filter(x => m[x]); if (!v.length) return ''; return `<span class="sqp">${withLabels ? `<small class="muted">${esc(lab)}</small>` : ''}${v.map(x => `<span class="chip${g === 'x' ? ' warn' : ' kc'}">${esc(String(m[x]).replace(/\s*\*$/, ''))}</span>`).join('')}</span>`; }).join('');
}
// Quelle als Link (nur http/https)
const sqSrc = q => { const s = q.src || {}, u = String(s.u || '').trim(), n = String(s.n || '').trim(); if (!u && !n) return ''; return /^https?:\/\//i.test(u) ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(n || u)}</a>` : esc(n); };

// ---------- Einplanen in eine Einzelstunde ----------
function seqPlanOf(s) { return s.seqPlan || (s.seqPlan = { on: false, blocks: [{ id: uid(), type: 'asana', seqId: '', pos: 0 }] }); }
function seqActive(s, key) { return !!(s.seqPlan && s.seqPlan.on) && bon(s, key) && bty(s, key) === 'ex'; }
// Übungen der gewählten Sequenzen als Gruppen in den zur Art gehörenden Block setzen; ohne Plan (oder bei „Nein“) verschwinden sie wieder. Gelöschte Sequenzen lassen ihre schon kopierten Übungen stehen.
function applySeqPlan(c, s, only) {
  SEQ_BLKS.forEach(key => { if (!only || only === key) seqApplyBlock(c, s, key); });
}
function seqApplyBlock(c, s, key) {
  const items = s.blk && s.blk[key], plan = s.seqPlan;
  const mine = plan ? plan.blocks.filter(b => SEQ_TYPES[sqPType(b)].blk === key) : [];
  if (!items || (!mine.length && !items.some(i => i.seq))) return;
  const old = {}; items.filter(i => i.seq).forEach(i => (old[i.seq] = old[i.seq] || []).push(i));
  const ins = [];
  if (seqActive(s, key)) mine.forEach(b => {
    const q = sqById(b.seqId);
    if (!q) { if (old[b.id]) ins.push(...old[b.id]); return; }
    sqItems(q).forEach(x => { const it = mkItem(exById(x.id), x.min); if (isTxb(it)) it.tx = x.tx || ''; it.seq = b.id; it.seqName = q.name; it.seqType = sqPType(b); it.seqPos = +b.pos || 0; applyAlt(s, it); ins.push(it); });
  });
  const have = new Set(ins.map(i => i.id));
  s.blk[key] = ins.concat(items.filter(i => !i.seq && !have.has(i.id)));
  if (s.bm && s.bm[key] && (+s.bm[key].min || 0) > 0 && bon(s, key)) rebalanceBlock(c, s, key);
  else sortItems(s.blk[key]);
  seqSyncPlan(s);
}
// Position der Gruppen im Block (Anzahl Einzelübungen davor) in den Plan zurückschreiben, damit sie beim Neuübernehmen erhalten bleibt
function seqSyncPlan(s) {
  if (!s.seqPlan) return;
  s.seqPlan.blocks.forEach(b => { for (const k of SEQ_BLKS) { const it = (s.blk[k] || []).find(i => i.seq === b.id); if (it) { b.pos = +it.seqPos || 0; break; } } });
}
// Aufeinanderfolgende Übungen: jede Einzelübung ist eine Einheit, jede Sequenz-Gruppe ebenfalls
function seqUnits(items) {
  const units = [];
  items.forEach((it, j) => { const u = units[units.length - 1]; if (it.seq && u && u.seq === it.seq) { u.its.push(it); u.to = j; } else units.push({ seq: it.seq || '', its: [it], from: j, to: j }); });
  return units;
}
// Gruppierte Zeilen des Block-Editors: Rahmen mit Kopfzeile (Name, Art, Minuten) und ▲▼ für die ganze Sequenz
function seqWrapRows(s, key, items, rows) {
  const units = seqUnits(items);
  if (!units.some(u => u.seq)) return rows.join('');
  return units.map((u, k) => {
    const html = rows.slice(u.from, u.to + 1).join('');
    if (!u.seq) return html;
    const f = u.its[0], t = SEQ_TYPES[f.seqType] ? f.seqType : 'asana';
    return `<div class="seqgrp t-${t}"><div class="seqgh">${sqTypeChip(t)}<b>${esc(f.seqName || 'Sequenz')}</b><span class="muted">${sqCount(u.its.length)} · ${fmtMin(sumMin(u.its))} Min. · gehören zusammen</span><span class="grow"></span>`
      + `<button class="ghost sm" data-a="seqGrpMv" data-id="${s.id}" data-b="${key}" data-bid="${u.seq}" data-d="-1" ${k === 0 ? 'disabled' : ''} title="Ganze Sequenz nach oben">▲</button>`
      + `<button class="ghost sm" data-a="seqGrpMv" data-id="${s.id}" data-b="${key}" data-bid="${u.seq}" data-d="1" ${k === units.length - 1 ? 'disabled' : ''} title="Ganze Sequenz nach unten">▼</button></div>${html}</div>`;
  }).join('');
}
// Kachelreihen (zugeklappter Block, Übersicht): zusammengehörige Sequenz-Übungen stehen in einer farbigen Kapsel mit Sequenz-Symbol (ohne Text)
function seqTiles(items, fn) {
  return seqUnits(items).map(u => {
    const html = u.its.map((it, n) => fn(it, u.from + n)).join('');
    if (!u.seq) return html;
    const f = u.its[0], t = SEQ_TYPES[f.seqType] ? f.seqType : 'asana';
    return `<span class="mtg t-${t}" title="Sequenz „${esc(f.seqName || '')}“ (${SEQ_TYPES[t].n}) · ${sqCount(u.its.length)} · gehören zusammen">${hicon('sequenz')}${html}</span>`;
  }).join('');
}
// Alle Übungen eines Sequenzblocks aus der Stunde entfernen (egal in welchem Stundenblock sie stehen)
const seqPurge = (s, bid) => Object.keys(s.blk || {}).forEach(k => { s.blk[k] = (s.blk[k] || []).filter(i => i.seq !== bid); });
function seqPanel(c, s) {
  const id = s.id, p = seqPlanOf(s), seqs = state.sequences || [];
  const blocked = SEQ_BLKS.every(k => !bon(s, k) || bty(s, k) !== 'ex');
  const used = p.on ? p.blocks.map(b => (sqById(b.seqId) || {}).name).filter(Boolean) : [];
  const chip = p.on ? `<span class="chip warn">Ja${used.length ? ': ' + esc(used.join(' + ')) : ''}</span>` : '<span class="muted">· Nein</span>';
  let body = '';
  if (p.on) {
    const rows = p.blocks.map((b, i) => {
      const t = sqPType(b), key = SEQ_TYPES[t].blk, q = sqById(b.seqId), missing = b.seqId && !q, off = !bon(s, key) || bty(s, key) !== 'ex';
      const sum = q ? `${sqCount(q.items.length)} · ${fmtMin(sqMin(q))} Min.` : missing ? '<span class="chip warn">Sequenz wurde gelöscht</span>' : '<span class="muted">noch keine Sequenz gewählt</span>';
      const cand = seqs.filter(q2 => sqType(q2) === t), geb = effGeb(c, s), warn = q ? sqProps(q).x.filter(g => geb.includes(g)).map(g => GEBRECHEN[g]) : [];
      return `<div class="seqb t-${t}"><b>Sequenzblock ${i + 1}</b>
<select class="arts" data-chg="seqType" data-sid="${id}" data-bid="${b.id}" title="Art der Sequenz: bestimmt den Stundenblock">${Object.keys(SEQ_TYPES).map(k => opt(k, SEQ_TYPES[k].n, t)).join('')}</select>
<select class="arts" data-chg="seqSel" data-sid="${id}" data-bid="${b.id}"><option value="">— ${SEQ_TYPES[t].n}-Sequenz wählen —</option>${cand.map(q2 => opt(q2.id, q2.name, b.seqId)).join('')}${q && sqType(q) !== t ? opt(q.id, q.name, b.seqId) : ''}</select>
<span class="seqsum"${q && q.desc ? ` title="${esc(q.desc)}"` : ''}>${sum}</span>${warn.length ? `<span class="chip warn" title="Mindestens eine Übung der Sequenz ist für diese Einschränkung nicht empfohlen">⚠ Vorsicht bei: ${esc(warn.join(', '))}</span>` : ''}<span class="muted">→ ${esc(bn(s, key))}</span>${off ? '<span class="chip warn" title="Dieser Block ist ausgeschaltet oder kein Übungsblock">Block nicht aktiv</span>' : ''}<span class="mts">${q ? sqItems(q).map(sqTile).join('') : ''}</span>${p.blocks.length > 1 ? `<button class="ghost sm danger" data-a="seqBlkDel" data-id="${id}" data-bid="${b.id}" title="Sequenzblock entfernen">🗑</button>` : ''}</div>`;
    }).join('');
    const tot = SEQ_BLKS.reduce((n, k) => n + sumMin((s.blk[k] || []).filter(i => i.seq)), 0);
    body = `${rows}<div class="bar"><button class="sm" data-a="seqBlkAdd" data-id="${id}">＋ Weiteren Sequenzblock hinzufügen</button><button class="ghost sm" data-a="seqApply" data-id="${id}" title="Übungen der gewählten Sequenzen erneut aus dem Sequenzkatalog übernehmen (z. B. nach einer Änderung der Sequenz)">↻ Aus Sequenzkatalog neu übernehmen</button><span class="grow"></span><span class="muted">Sequenzen in dieser Stunde: <b>${fmtMin(tot)}</b> Min.</span></div>`;
  }
  return `<details class="panel mini noprint" data-id="seq:${id}" ${ui.open.has('seq:' + id) ? 'open' : ''}><summary>Sequenzplanung ${chip} <span class="muted">· feste Übungsfolgen wie der Sonnengruß</span></summary>
<p class="muted">Die Art der Sequenz bestimmt den Stundenblock: Mobilisation → „${esc(bn(s, 'mobi'))}“, Asana → „${esc(bn(s, 'asana'))}“, Cooldown → „${esc(bn(s, 'ausgl'))}“. Die Übungen stehen dort als zusammengehörige Gruppe und lassen sich im Block nur als Ganzes verschieben (▲▼). Die übrigen Übungen werden zeitlich angepasst. Spätere Änderungen an der Sequenz gelten erst nach „Neu übernehmen“.</p>
${blocked ? '<p class="banner">Alle drei Blöcke (Mobilisation, Asanas, Cool down) sind in dieser Stunde ausgeschaltet oder keine Übungsblöcke: Sequenzen können erst eingeplant werden, wenn einer wieder aktiv ist.</p>' : ''}
<div class="seqq"><b>Sequenzen einplanen?</b>${sGrp([[1, 'Ja'], [0, 'Nein']], p.on ? 1 : 0, 'seqOn', id, 'seq', blocked && !p.on)}</div>${body}</details>`;
}

// ---------- Seite „Sequenzen“ (anlegen, bearbeiten, speichern) ----------
function seqRow(it, i, n) {
  const e = exById(it.id), tx = isTxb(it), tile = e
    ? `<div class="xtile cat-${e.c} pkt" data-a="seqPk" data-i="${i}" title="Klicken: andere Übung wählen">${figureSVG(e.pose)}${peakStar(e)}</div>`
    : `<div class="xtile empty pkt" data-a="seqPk" data-i="${i}" title="Klicken: Übung wählen"><span class="plus">＋</span></div>`;
  return `<div class="seqrow${tx ? ' txb' : ''}"><span class="seqno">${i + 1}</span>${tile}<div class="seqnm">${e ? `<b>${esc(e.n)}</b>${e.sa ? `<i class="sa">${esc(e.sa)}</i>` : ''}${tx ? `<textarea rows="3" class="seqtx" data-chg="seqTx" data-i="${i}" placeholder="Text an dieser Stelle der Sequenz …">${esc(it.tx || '')}</textarea>` : ''}` : '<b class="muted">noch keine Übung gewählt</b>'}</div>
<div class="am"><input type="number" min="0.5" max="30" step="0.5" value="${it.min}" data-chg="seqMin" data-i="${i}"><span>Min.</span></div>
<button class="ghost sm" data-a="seqMv" data-i="${i}" data-d="-1" ${i === 0 ? 'disabled' : ''} title="Nach oben">▲</button><button class="ghost sm" data-a="seqMv" data-i="${i}" data-d="1" ${i === n - 1 ? 'disabled' : ''} title="Nach unten">▼</button>
<button class="ghost sm danger" data-a="seqRm" data-i="${i}" title="Übung entfernen">🗑</button></div>`;
}
function sqPropEdit(d) {
  const auto = sqAuto(d);
  return SQ_PROPS.map(([g, lab, map]) => {
    const m = map(), man = sqIsMan(d, g), cur = man ? d.man[g] : auto[g];
    return `<div class="kl"><span class="kt${man ? ' lock' : ''}">${man ? '🔒 ' : ''}${esc(lab)}</span> <span class="muted">${man ? 'manuell' : 'automatisch'}</span>${man ? ` <button type="button" class="ghost sm" data-a="seqKatAuto" data-g="${g}" title="Wieder aus den Übungen berechnen">↻ automatisch</button>` : ''}
<div class="chiprow">${Object.keys(m).map(v => `<button type="button" class="chipsel${cur.includes(v) ? ' on' : ''}" data-a="seqKatTog" data-g="${g}" data-v="${esc(v)}">${esc(String(m[v]).replace(/\s*\*$/, ''))}</button>`).join('')}</div></div>`;
  }).join('');
}
function viewSequences() {
  const d = ui.seqDraft;
  if (d) {
    return `<div class="bar"><h1>${d.isNew ? 'Neue Sequenz' : 'Sequenz bearbeiten'}</h1></div>
<section class="panel"><div class="grid">${fld('Sequenzname', inp('u:seqDraft.name', 'text', d.name, 'placeholder="z. B. Sonnengruß" autocomplete="off"'))}
${fld('Art der Sequenz', sel('u:seqDraft.type', Object.keys(SEQ_TYPES).map(k => [k, SEQ_TYPES[k].n]), d.type, 'title="Bestimmt, in welchen Stundenblock die Sequenz eingeplant wird"'))}
${fld('Anzahl Übungen', `<input type="number" min="1" max="40" value="${d.items.length}" data-chg="seqCount">`)}
<div class="fld wide"><label>Beschreibung</label><textarea data-f="u:seqDraft.desc" rows="3" placeholder="Wofür ist die Sequenz gut, wie wird sie geübt, worauf ist zu achten?">${esc(d.desc || '')}</textarea></div>
${fld('Quelle (Name)', inp('u:seqDraft.src.n', 'text', (d.src || {}).n || '', 'placeholder="z. B. Yoga Vidya, Pavanamuktasana-Reihe" autocomplete="off"'))}
${fld('Quelle (Link)', inp('u:seqDraft.src.u', 'url', (d.src || {}).u || '', 'placeholder="https://…" autocomplete="off"'))}</div>

<p class="muted">Die Anzahl legt fest, wie viele Übungen die Sequenz hat; wähle für jede die Übung per Klick auf die Kachel. Dieselbe Übung darf mehrfach vorkommen (z. B. Vorbeuge am Anfang und Ende). Für einen Textabschnitt statt einer Übung (z. B. eine Ansage) wähle im Auswahlfenster ganz oben „Textblock“.</p>
<div class="seqlist">${d.items.map((it, i) => seqRow(it, i, d.items.length)).join('')}</div>
<button class="pkb add" data-a="seqAdd">＋ Übung hinzufügen</button>
<div class="panel mini sqprops"><h3>Eigenschaften</h3><p class="muted">Werden aus den Übungen der Sequenz abgeleitet und ändern sich mit ihnen. Ein Klick auf einen Wert setzt die Gruppe auf „manuell“, dann bleibt sie so, wie du sie einstellst, bis du sie mit „↻ automatisch“ zurücksetzt.</p>${sqPropEdit(d)}</div>
<div class="bar"><button class="primary" data-a="seqSave">💾 Sequenz speichern</button><button data-a="seqCancel">Abbrechen</button><span class="grow"></span><span>Summe: <b id="seqsum">${fmtMin(sumMin(d.items))}</b> Min.</span></div></section>`;
  }
  const list = state.sequences || [];
  const card = q => `<div class="card course"><div class="grow"><b class="title" data-a="seqEdit" data-id="${q.id}">${esc(q.name)}</b> ${sqTypeChip(sqType(q))}
<div class="meta">${sqCount(q.items.length - sqTxN(q))}${sqTxN(q) ? ' + ' + sqTxN(q) + ' Text' : ''} · ${fmtMin(sqMin(q))} Min.${sqSrc(q) ? ' · Quelle: ' + sqSrc(q) : ''}</div>${q.desc ? `<p class="sqd">${esc(q.desc)}</p>` : ''}<div class="sqps">${sqPropChips(q, true)}</div><span class="mts">${q.items.map(sqTile).join('')}</span></div>
<button data-a="seqEdit" data-id="${q.id}" class="primary">Bearbeiten</button><button data-a="seqDup" data-id="${q.id}" class="ghost" title="Duplizieren">⧉</button><button data-a="seqDel" data-id="${q.id}" class="ghost danger" title="Löschen">🗑</button></div>`;
  return `<div class="bar"><h1>Sequenzen</h1><span class="muted">${list.length} gespeichert</span><span class="grow"></span><button class="primary" data-a="seqNew">＋ Neue Sequenz</button></div>
<p class="muted">Eine Sequenz ist eine feste Folge von Übungen mit Namen. Gespeicherte Sequenzen liegen im Sequenzkatalog und lassen sich in der Einzelstundenplanung unter „Sequenzplanung“ einplanen.</p>
${list.map(card).join('') || '<div class="card"><p class="muted">Noch keine Sequenz gespeichert. Mit „Neue Sequenz“ legst du die erste an.</p></div>'}`;
}

// ---------- Seite „Sequenzkatalog“ (nachschlagen) ----------
function viewSeqCatalog() {
  const q = norm(ui.seqQ || ''), tf = ui.seqT || '', lf = ui.seqL || '', gf = ui.seqG || '';
  const list = (state.sequences || []).filter(x => (!tf || sqType(x) === tf) && (!lf || sqProps(x).lv.includes(lf)) && (!gf || !sqProps(x).x.includes(gf)) && (!q || norm(x.name).includes(q) || norm(x.desc || '').includes(q) || x.items.some(i => norm((exById(i.id) || {}).n || '').includes(q))));
  const step = (it, i) => { const e = exById(it.id); return e && e.txt ? `<div class="sqstep"><span class="seqno">${i + 1}</span><div class="ktile cat-${e.c}">${figureSVG(e.pose)}</div><b>Text</b><small class="muted">${esc(String(it.tx || '').replace(/\s+/g, ' ').trim().slice(0, 60))}${String(it.tx || '').length > 60 ? ' …' : ''}</small><small class="muted">${fmtMin(it.min)} Min.</small></div>` : e ? `<div class="sqstep"><span class="seqno">${i + 1}</span><div class="ktile cat-${e.c}">${figureSVG(e.pose)}${peakStar(e)}</div><b>${esc(e.n)}</b>${e.sa ? `<i class="sa">${esc(e.sa)}</i>` : ''}<small class="muted">${fmtMin(it.min)} Min.</small></div>` : ''; };
  const used = id => (state.courses || []).reduce((n, c) => n + c.sessions.filter(s => s.seqPlan && s.seqPlan.on && s.seqPlan.blocks.some(b => b.seqId === id)).length, 0);
  return `<div class="bar"><h1>Sequenzkatalog</h1><span class="muted">${list.length} von ${(state.sequences || []).length} Sequenzen</span><span class="grow"></span><button class="primary" data-a="seqNew">＋ Neue Sequenz</button></div>
<div class="panel"><div class="grid">${fld('Art', sel('u:seqT', [['', 'Alle Arten']].concat(Object.keys(SEQ_TYPES).map(k => [k, SEQ_TYPES[k].n])), tf, 'data-chg="seqFilt"'))}${fld('Geeignet für', sel('u:seqL', [['', 'Alle']].concat(Object.keys(LEVELS).filter(k => k !== 'gemischt').map(k => [k, LEVELS[k]])), lf, 'data-chg="seqFilt"'))}${fld('Ohne Belastung für', sel('u:seqG', [['', '–']].concat(Object.keys(GEBRECHEN).map(k => [k, GEBRECHEN[k]])), gf, 'data-chg="seqFilt"'))}${fld('Suche', `<input type="search" data-f="u:seqQ" data-live="1" value="${esc(ui.seqQ || '')}" placeholder="Sequenz, Beschreibung oder Übung, z. B. Sonnengruß">`)}</div></div>
${list.map(x => `<section class="panel sqcat"><div class="bar"><h3>${esc(x.name)}</h3>${sqTypeChip(sqType(x))}<span class="muted">${sqCount(x.items.length - sqTxN(x))}${sqTxN(x) ? ' + ' + sqTxN(x) + ' Text' : ''} · ${fmtMin(sqMin(x))} Min. · in ${used(x.id)} Stunde(n) eingeplant</span><span class="grow"></span><button class="sm" data-a="seqEdit" data-id="${x.id}">✎ Bearbeiten</button></div>
${x.desc ? `<p class="sqd">${esc(x.desc)}</p>` : ''}<div class="sqps">${sqPropChips(x, true)}</div>${sqSrc(x) ? `<p class="muted sqsrc">Quelle: ${sqSrc(x)}</p>` : ''}
<div class="sqsteps">${x.items.map(step).join('')}</div></section>`).join('') || '<div class="card"><p class="muted">Keine Sequenz gefunden.</p></div>'}`;
}

// ---------- Sequenz-Auswahl für eine Übung ----------
function openSeqPicker(btn, i) {
  closePicker();
  const d = ui.seqDraft; if (!d || !d.items[i]) return;
  const curId = d.items[i].id; ui.pk = { kind: 'seq', i };
  const txbRow = `<button class="pko cat-textblock${curId === TXB_ID ? ' cur' : ''}" data-a="seqPick" data-id="${TXB_ID}" data-q="textblock text sonderbaustein anleitung hinweis"><span class="pkf">${figureSVG('textblock')}</span><div class="pkinfo"><div class="pkname"><b>Textblock</b><small class="sa">Sonderbaustein</small></div><div class="pkmeta"><span>Statt einer Übung: ein Textabschnitt an dieser Stelle</span></div></div></button>`;
  const rows = txbRow + exAll().slice().sort((a, b) => seqIdx(a.id) - seqIdx(b.id)).map(p => `<button class="pko cat-${p.c}${p.id === curId ? ' cur' : ''}" data-a="seqPick" data-id="${p.id}" data-q="${esc(norm(p.n + ' ' + (p.sa || '')))}"><span class="pkf">${figureSVG(p.pose)}${peakStar(p)}</span><div class="pkinfo"><div class="pkname"><b>${esc(p.n)}</b>${p.sa ? `<small class="sa">${esc(p.sa)}</small>` : ''}</div><div class="pkmeta"><span>${esc(CATS[p.c] || '')}</span><span class="muted">· ${esc(lvName(p))}</span></div></div></button>`).join('');
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
const seqStart = (q, isNew) => { ui.seqDraft = { id: q.id, name: q.name, type: sqType(q), items: deepCopy(q.items), desc: q.desc || '', src: Object.assign({ n: '', u: '' }, q.src || {}), man: deepCopy(q.man || {}), imp: q.imp || '', isNew }; ui.view = 'sequences'; ui.courseId = null; closePicker(); render(); window.scrollTo(0, 0); };
const SEQ_ACTIONS = {
  seqNew() { seqStart({ id: 'seq_' + uid(), name: '', type: 'asana', items: [{ id: '', min: 0.5 }] }, true); },
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
  seqPick(d) {
    const p = ui.pk, dr = ui.seqDraft; if (!p || p.kind !== 'seq' || !dr || !dr.items[p.i]) return;
    const it = dr.items[p.i]; it.id = d.id;
    if (d.id === TXB_ID) it.tx = it.tx || ''; else delete it.tx;
    closePicker(); render();
  },
  // Eigenschaften: Klick setzt die Gruppe auf „manuell“ (Startwert = bisheriger automatischer Wert); „↻ automatisch“ hebt das auf
  seqKatTog(d) { const dr = ui.seqDraft; if (!dr) return; dr.man = dr.man || {}; if (!sqIsMan(dr, d.g)) dr.man[d.g] = sqAuto(dr)[d.g].slice(); const a = dr.man[d.g], i = a.indexOf(d.v); i < 0 ? a.push(d.v) : a.splice(i, 1); render(); },
  seqKatAuto(d) { const dr = ui.seqDraft; if (!dr || !dr.man) return; delete dr.man[d.g]; render(); },
  seqCancel() { ui.seqDraft = null; closePicker(); render(); },
  seqSave() {
    const d = ui.seqDraft; if (!d) return;
    const name = String(d.name || '').trim();
    if (!name) { toast('Bitte einen Sequenznamen eingeben.'); return; }
    if (d.items.some(i => !i.id)) { toast('Bitte für jede Übung eine Auswahl treffen oder die Anzahl verringern.'); return; }
    if ((state.sequences || []).some(q => q.id !== d.id && norm(q.name) === norm(name))) { toast('Eine Sequenz mit diesem Namen gibt es schon.'); return; }
    const q = { id: d.id, name, type: SEQ_TYPES[d.type] ? d.type : 'asana', items: d.items.map(i => Object.assign({ id: i.id, min: Math.max(0.5, +i.min || 0.5) }, i.id === TXB_ID ? { tx: String(i.tx || '') } : {})) }, k = state.sequences.findIndex(x => x.id === d.id);
    if (String(d.desc || '').trim()) q.desc = String(d.desc).trim();
    const sn = String((d.src || {}).n || '').trim(), su = String((d.src || {}).u || '').trim(); if (sn || su) q.src = { n: sn, u: su };
    if (d.man && Object.keys(d.man).length) q.man = deepCopy(d.man);
    if (d.imp) q.imp = d.imp;
    if (k >= 0) state.sequences[k] = q; else state.sequences.push(q);
    ui.seqDraft = null; save(); render(); toast(`Sequenz „${name}“ gespeichert (Sequenzkatalog).`);
  },
  // Einzelstunde: Sequenzplanung
  seqOn(d) {
    const { c, s } = sessionOf(d.id), p = seqPlanOf(s); p.on = d.v === '1'; if (p.on && !p.blocks.length) p.blocks.push({ id: uid(), type: 'asana', seqId: '', pos: 0 });
    ui.open.add('seq:' + s.id); applySeqPlan(c, s); save(); render();
  },
  seqBlkAdd(d) { const { s } = sessionOf(d.id); seqPlanOf(s).blocks.push({ id: uid(), type: 'asana', seqId: '', pos: 0 }); ui.open.add('seq:' + s.id); save(); render(); },
  seqBlkDel(d) { const { c, s } = sessionOf(d.id), p = seqPlanOf(s); p.blocks = p.blocks.filter(b => b.id !== d.bid); seqPurge(s, d.bid); ui.open.add('seq:' + s.id); applySeqPlan(c, s); save(); render(); },
  // ganze Sequenz im Stundenblock um eine Einheit (Einzelübung oder andere Sequenz) nach oben/unten
  seqGrpMv(d) {
    const { s } = sessionOf(d.id), a = s.blk[d.b] || [], p = seqPlanOf(s), units = seqUnits(a), k = units.findIndex(u => u.seq === d.bid), j = k + (+d.d);
    if (k < 0 || j < 0 || j >= units.length) return;
    [units[k], units[j]] = [units[j], units[k]];
    a.splice(0, a.length, ...units.flatMap(u => u.its)); seqLayout(a, true); seqSyncPlan(s);
    // Reihenfolge der Sequenzblöcke im Plan der Reihenfolge im Stundenblock angleichen (wichtig bei gleicher Position)
    const ord = []; a.forEach(i => { if (i.seq && !ord.includes(i.seq)) ord.push(i.seq); });
    const slots = p.blocks.map((b, x) => ord.includes(b.id) ? x : -1).filter(x => x >= 0), blocks = ord.map(id => p.blocks.find(b => b.id === id));
    slots.forEach((x, n) => { p.blocks[x] = blocks[n]; });
    touch(s); save(); render();
  },
  seqApply(d) { const { c, s } = sessionOf(d.id); ui.open.add('seq:' + s.id); applySeqPlan(c, s); save(); render(); toast('Sequenzen neu aus dem Sequenzkatalog übernommen.'); }
};
const SEQ_CH = {
  seqFilt(el) { const f = el.dataset.f || ''; if (f.startsWith('u:')) ui[f.slice(2)] = el.value; render(); },
  seqTx(el) { const d = ui.seqDraft; if (d && d.items[+el.dataset.i]) d.items[+el.dataset.i].tx = el.value; },
  seqType(el) {
    const { c, s } = sessionOf(el.dataset.sid), b = seqPlanOf(s).blocks.find(x => x.id === el.dataset.bid); if (!b || !SEQ_TYPES[el.value]) return;
    b.type = el.value; b.seqId = ''; b.pos = 0; seqPurge(s, b.id);
    touch(s); ui.open.add('seq:' + s.id); applySeqPlan(c, s); save(); render();
  },
  seqCount(el) {
    const d = ui.seqDraft; if (!d) return; const n = Math.max(1, Math.min(40, Math.round(+el.value) || 1));
    while (d.items.length < n) d.items.push({ id: '', min: 0.5 });
    if (d.items.length > n) { const cut = d.items.length - n; d.items.length = n; toast(`${cut} Übung(en) am Ende entfernt.`); }
    render();
  },
  seqMin(el) { const d = ui.seqDraft; if (!d) return; d.items[+el.dataset.i].min = Math.max(0.5, +el.value || 0.5); const t = document.getElementById('seqsum'); if (t) t.textContent = fmtMin(sumMin(d.items)); },
  seqSel(el) {
    const { c, s } = sessionOf(el.dataset.sid), b = seqPlanOf(s).blocks.find(x => x.id === el.dataset.bid); if (!b) return;
    b.seqId = el.value; b.pos = 0; seqPurge(s, b.id);
    touch(s); ui.open.add('seq:' + s.id); applySeqPlan(c, s); save(); render();
  }
};
