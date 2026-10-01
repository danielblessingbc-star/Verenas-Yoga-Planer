/* Textvorlagen: Mustertexte für jeden Textblock der Stunde + eigene Vorlagen
   Platzhalter: {motto} = Titel des Mottos, {kernsatz} = Kernsatz, {fokus} = körperlicher Fokus */
const TX_KINDS = { einl: 'Einleitung', atem: 'Atemübung', mantra: 'Mantra', schluss: 'Schluss', shava: 'Shavasana' };
const TX_MUSTER = [
  { id: 'm_einl_1', kind: 'einl', name: 'Kurz & ruhig', text: 'Herzlich willkommen zu unserer Stunde. Schön, dass du da bist.\n\nDu musst heute nichts leisten und nichts erreichen. Wir üben in deinem Tempo und nur so weit, wie es sich gut anfühlt.\n\nNimm einen Moment wahr, wie du heute hier ankommst: Wie fühlt sich dein Körper an? Wie dein Atem? Du musst nichts verändern – nur bemerken.\n\nUnser Motto heute: „{motto}“ – {kernsatz}' },
  { id: 'm_einl_2', kind: 'einl', name: 'Ankommen im Körper', text: 'Schön, dass wir wieder gemeinsam üben.\n\nSpür zunächst, welche Körperteile Kontakt mit dem Boden haben. Nimm ganz bewusst wahr, dass der Boden dich trägt.\n\nLass deine Schultern weich werden und spüre, wie sich dein Brustkorb mit jedem Atemzug sanft hebt und senkt. Lass Augen, Stirn und Kiefer locker werden.\n\nWenn Gedanken kommen, lass sie vorüberziehen wie Wolken. Kehre immer wieder zum Spüren zurück – zu den Füßen, zum Atem, zum Kontakt mit dem Boden.\n\nUnser Motto heute: „{motto}“ – {kernsatz}' },
  { id: 'm_einl_3', kind: 'einl', name: 'Mit Absicht (Sankalpa)', text: 'Herzlich willkommen. Nimm dir einen Moment, um in dieser Stunde anzukommen.\n\nSchließe, wenn du magst, die Augen und nimm drei bewusste Atemzüge: durch die Nase ein … und mit einem hörbaren Seufzer wieder aus.\n\nVielleicht möchtest du dir für diese Stunde eine kleine Absicht setzen – ein Wort oder ein Gefühl, das dich beim Üben begleitet. Unser Motto kann dir dabei Anregung sein: „{motto}“.\n\n{kernsatz}' },
  { id: 'm_atem_1', kind: 'atem', name: 'Natürlichen Atem beobachten', text: 'Komm in eine bequeme Haltung und schließe, wenn du magst, die Augen.\n\nSpüre deinen Atem, ohne ihn zu verändern. Wo nimmst du ihn am deutlichsten wahr: an den Nasenflügeln, im Brustkorb oder im Bauch?\n\nBeobachte, wie sich Brustkorb und Bauch mit jedem Atemzug bewegen, ohne etwas zu bewerten.\n\nWenn Gedanken abschweifen, ist das in Ordnung. Kehre freundlich zum Atem zurück.\n\nLass die Übung langsam ausklingen und bleibe noch einen Moment im ganz natürlichen Atem.' },
  { id: 'm_atem_2', kind: 'atem', name: 'Kurz: Atem vertiefen', text: 'Setze dich aufrecht hin und lege eine Hand auf den Bauch.\n\nAtme ruhig durch die Nase ein und spüre, wie sich der Bauch sanft hebt. Atme langsam wieder aus und lass die Schultern dabei weich werden.\n\nWiederhole das einige Atemzüge lang in deinem eigenen Rhythmus. Wenn dir schwindelig wird oder es unangenehm ist, kehre zu deinem natürlichen Atem zurück.' },
  { id: 'm_mantra_1', kind: 'mantra', name: 'Einstimmung auf das Mantra', text: 'Sitze aufrecht, die Schultern sind weich, der Atem fließt ruhig. Schließe gern die Augen und stimme dich innerlich ein.\n\nWir singen nun gemeinsam ein Mantra. Es kommt nicht auf einen schönen Ton an, sondern auf das Schwingen. Spüre den Klang in deinem Körper: im Brustkorb, im Hals, im Kopf.\n\nNach dem letzten Klang bleibe still und spüre die Stille, die entsteht.' },
  { id: 'm_mantra_2', kind: 'mantra', name: 'Mantra still wiederholen', text: 'Komm in einen bequemen Sitz und lege die Hände auf Herz oder Bauch.\n\nWiederhole das Mantra innerlich, im Rhythmus deines Atems. Wenn Gedanken kommen, kehre sanft zum Mantra zurück.\n\nLass das Mantra am Ende ausklingen und bleibe noch einen Moment in der Ruhe.' },
  { id: 'm_schluss_1', kind: 'schluss', name: 'Nachspüren & Motto', text: 'Bleibe noch einen Moment ruhig liegen und spüre nach, was die Bewegung in dir bewegt hat: Wärme, Weite, Ruhe, Lebendigkeit?\n\nNimm wahr, wie sich dein Atem verändert hat und wie dein Körper auf der Matte liegt.\n\nLass das Motto „{motto}“ noch einmal nachklingen: {kernsatz}\n\nDann lass die Bewegungen los und geh in die Schlussentspannung.' },
  { id: 'm_schluss_2', kind: 'schluss', name: 'Kurz: Danke', text: 'Komm jetzt zur Ruhe und spüre nach, was die Übungen in dir hinterlassen haben.\n\nDanke deinem Körper für das, was er heute möglich gemacht hat.\n\nWenn du magst, lege eine Hand auf dein Herz und spüre seinen Rhythmus.' },
  { id: 'm_shava_1', kind: 'shava', name: 'Shavasana – kurz', text: 'Nun darfst du es dir ganz bequem machen und in deiner Schlussentspannung ankommen.\n\nLass Beine, Becken und Rücken schwer werden. Lass Schultern, Arme und Hände los. Entspanne Nacken, Gesicht und Stirn.\n\nNimm deinen Atem wahr. Ganz von selbst kommt die Einatmung … und ganz von selbst geht die Ausatmung.\n\nWiederhole innerlich, in deinem eigenen Tempo: „{kernsatz}“\n\nVertiefe nun langsam wieder deinen Atem. Bewege ganz sanft Finger und Zehen. Nimm dir Zeit, bevor du dich wieder aufrichtest.' },
  { id: 'm_shava_2', kind: 'shava', name: 'Shavasana – ausführlich', text: 'Nun darfst du es dir ganz bequem machen und in deiner Schlussentspannung ankommen.\n\nLege dich so hin, dass dein Körper möglichst wenig halten muss. Wenn es angenehmer ist, kannst du die Knie aufstellen oder eine Decke unter die Knie legen.\n\nSchließe gerne die Augen und spüre noch einmal deinen Körper. Du musst nichts mehr tun. Nichts halten. Nichts erreichen.\n\nLass deine Füße schwer werden. Die Zehen, die Fußsohlen, die Fersen … alles darf loslassen. Deine Beine dürfen entspannen: die Waden, die Knie, die Oberschenkel.\n\nEntspanne dein Becken … deinen Bauch … deinen Rücken. Der Boden trägt dich. Lass deine Schultern weich werden. Deine Arme dürfen schwer werden, die Ellenbogen, die Unterarme, die Hände.\n\nEntspanne deinen Nacken … dein Gesicht … die Augen … die Stirn.\n\nNimm deinen Atem wahr. Ganz von selbst kommt die Einatmung … und ganz von selbst geht die Ausatmung.\n\nWiederhole innerlich, in deinem eigenen Tempo: „{kernsatz}“\n…\n\nSpüre, wie schwer und warm dein Körper geworden ist. Du musst nirgendwo hin. Du bist genau hier.\n…\n\nVerweile noch einen Moment in dieser tiefen Ruhe und genieße sie in deinem eigenen Tempo.\n…\n\nVertiefe nun langsam wieder deinen Atem. Bewege ganz sanft Finger und Zehen. Nimm dir Zeit, bevor du dich wieder aufrichtest.' }
];
const txKindOf = (s, k) => (TX_KINDS[abOf(s, k)] ? abOf(s, k) : TX_KINDS[k] ? k : 'einl');
const txTplList = kind => TX_MUSTER.filter(t => t.kind === kind).concat((state.textTpl || []).filter(t => t.kind === kind));
const txTplFill = (t, s) => String(t.text || '').replace(/\{motto\}/g, (s && s.motto && s.motto.title) || '').replace(/\{kernsatz\}/g, (s && s.motto && (s.tx.kern || s.motto.kern)) || '').replace(/\{fokus\}/g, (s && s.motto && (s.tx.focus || s.motto.focus)) || '');
const txWords = t => (String(t).trim().match(/\S+/g) || []).length;

// Auswahl in der Einzelstundenplanung (unter dem Textfeld-Kopf)
function tplPickPanel(s, k) {
  const kind = txKindOf(s, k), list = txTplList(kind);
  return `<div class="tplpick"><div class="tph"><b>Vorlage für „${esc(TX_KINDS[kind])}“ einfügen</b><span class="muted">ersetzt den aktuellen Text · {motto} und {kernsatz} werden ausgefüllt</span><span class="grow"></span><button class="ghost sm" data-a="tplOpen" data-id="${s.id}" data-k="${k}">✕ schließen</button></div>${list.map(t => `<button class="tpo" data-a="tplUse" data-id="${s.id}" data-k="${k}" data-tid="${t.id}"><b>${esc(t.name)}</b> <span class="tag${t.id.startsWith('m_') ? '' : ' own'}">${t.id.startsWith('m_') ? 'Muster' : 'Eigene'}</span> <small class="muted">${txWords(txTplFill(t, s))} Wörter</small><span class="tpp">${esc(txTplFill(t, s).replace(/\s+/g, ' ').slice(0, 160))} …</span></button>`).join('') || '<p class="muted">Keine Vorlagen vorhanden.</p>'}<p class="muted">Eigene Vorlagen legst du auf der Seite „Textvorlagen“ an.</p></div>`;
}

// Seite „Textvorlagen“
function viewTexts() {
  ui.tplNew = ui.tplNew || { kind: 'einl', name: '', text: '' };
  const n = ui.tplNew;
  const card = t => {
    const own = !t.id.startsWith('m_');
    return `<div class="tcard${own ? ' own' : ''}"><div class="tch"><b>${esc(t.name)}</b> <span class="tag${own ? ' own' : ''}">${own ? 'Eigene' : 'Muster'}</span> <small class="muted">${txWords(t.text)} Wörter</small><span class="grow"></span>${own ? `<button class="ghost sm" data-a="tplDel" data-id="${t.id}">🗑</button>` : `<button class="ghost sm" data-a="tplCopy" data-id="${t.id}" title="Als eigene Vorlage kopieren, dann änderbar">⧉ Kopie bearbeiten</button>`}</div>
${own ? `<input type="text" value="${esc(t.name)}" data-chg="tplEdit" data-id="${t.id}" data-fld="name" class="tname"><textarea rows="${Math.min(14, Math.max(4, Math.ceil(t.text.length / 90)))}" data-chg="tplEdit" data-id="${t.id}" data-fld="text">${esc(t.text)}</textarea>` : `<div class="tpbody">${esc(t.text)}</div>`}</div>`;
  };
  const secs = Object.keys(TX_KINDS).map(k => `<section class="panel"><h3>${esc(TX_KINDS[k])}</h3><div class="tgrid">${txTplList(k).map(card).join('')}</div></section>`).join('');
  return `<div class="bar"><h1>Textvorlagen</h1></div>
<p class="muted">Mustertexte für jeden Textblock der Stunde. In der Einzelstundenplanung fügst du sie über „📋 Vorlage“ in den jeweiligen Text ein. Platzhalter: <code>{motto}</code>, <code>{kernsatz}</code>, <code>{fokus}</code> werden mit den Angaben der Stunde gefüllt. Mustertexte sind fest; mit „Kopie bearbeiten“ machst du eine eigene Version daraus.</p>
<section class="panel"><h3>＋ Neue Vorlage</h3><div class="grid">
${fld('Für Block', sel('u:tplNew.kind', Object.keys(TX_KINDS).map(k => [k, TX_KINDS[k]]), n.kind))}
${fld('Name der Vorlage', inp('u:tplNew.name', 'text', n.name, 'placeholder="z. B. Herbst-Einleitung"'))}
${fld('Text (Absätze mit Leerzeile, Platzhalter möglich)', `<textarea data-f="u:tplNew.text" rows="8" placeholder="Text der Vorlage …">${esc(n.text)}</textarea>`, 'wide')}
</div><div class="bar"><button class="primary" data-a="tplAdd">Vorlage speichern</button></div></section>
${secs}`;
}

const TXVORL_ACTIONS = {
  tplAdd() {
    const n = ui.tplNew; if (!n.name.trim() || !n.text.trim()) { toast('Bitte Name und Text eingeben.'); return; }
    (state.textTpl = state.textTpl || []).push({ id: 'u_' + uid(), kind: n.kind, name: n.name.trim(), text: n.text });
    ui.tplNew = { kind: n.kind, name: '', text: '' }; save(); render(); toast('Vorlage gespeichert.');
  },
  tplDel(d, el) { const t = (state.textTpl || []).find(x => x.id === d.id); if (t && confirmTwice(el, 'tpl' + d.id, `Vorlage „${t.name}“ löschen?`)) { state.textTpl = state.textTpl.filter(x => x !== t); save(); render(); } },
  tplCopy(d) { const t = TX_MUSTER.find(x => x.id === d.id); if (!t) return; (state.textTpl = state.textTpl || []).push({ id: 'u_' + uid(), kind: t.kind, name: t.name + ' (eigene)', text: t.text }); save(); render(); toast('Eigene Kopie angelegt – direkt darunter änderbar.'); },
  tplOpen(d) { ui.tplPick = (ui.tplPick && ui.tplPick.sid === d.id && ui.tplPick.k === d.k) ? null : { sid: d.id, k: d.k }; render(); },
  tplUse(d) {
    const { c, s } = sessionOf(d.id), t = txTplList(txKindOf(s, d.k)).find(x => x.id === d.tid); if (!t) return;
    s.tx[d.k] = txTplFill(t, s); s.txEdited[d.k] = true; ui.tplPick = null; save(); render(); toast(`Vorlage „${t.name}“ eingefügt.`);
  },
  txClear(d) { const { s } = sessionOf(d.id); s.tx[d.k] = ''; s.txEdited[d.k] = true; save(); render(); toast('Text geleert.'); },
  tplSaveFrom(d) {
    const { s } = sessionOf(d.id), txt = (s.tx[d.k] || '').trim(); if (!txt) { toast('Der Text ist leer.'); return; }
    const kind = txKindOf(s, d.k);
    (state.textTpl = state.textTpl || []).push({ id: 'u_' + uid(), kind, name: `${s.motto.title || 'Eigener Text'} (${fmtDate(todayIso())})`, text: txt }); save(); toast('Als Vorlage gespeichert (Seite „Textvorlagen“).');
  }
};
const TXVORL_CH = {
  tplEdit(el) { const t = (state.textTpl || []).find(x => x.id === el.dataset.id); if (t) { t[el.dataset.fld] = el.value; save(); } }
};
