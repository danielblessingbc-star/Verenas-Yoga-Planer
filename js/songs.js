/* Lied-Katalog und Hilfen für die Sonderbausteine „Lied“ und „Mantra“.
   Lied: id · n Titel · a Interpret · dur Dauer (Min.) · url Link · text Liedtext · use Einsatz in der Stunde · notes Notizen (alles außer n optional)
   Sonderbaustein-Eintrag in Stunde/Sequenz: { id: LIED_ID | MANSB_ID, ref: Lied- bzw. Mantra-ID, min } (Textblock: tx statt ref). */
function songDefaults() {
  return [{
    id: 'song_aura_ganputi', n: 'Aura Cleansing Ganputi', a: '', dur: 0,
    url: 'https://www.youtube.com/watch?v=pyrqKPBon68',
    text: 'Sa Ta Na Ma\nRa Ma Da Sa\nSa Say So Hung',
    use: 'Aura reinigen, Hindernisse lösen (Gan Puttee = Ganesha, Beseitiger von Hindernissen)',
    notes: 'Das 12-silbige Mantra der Gan Puttee Kriya (Yogi Bhajan, 1988): Sa Ta Na Ma Ra Ma Da Sa, Sa Say So Hung. Sa = Unendlichkeit, Ta = Geburt, Na = Tod, Ma = Wiedergeburt; dazu Fingerkombinationen (Daumen berührt nacheinander die Finger). Übliche Abfolge: 2 Min. laut, 2 Min. geflüstert, 3 Min. still, dann rückwärts. Siehe auch Mantra „Shakti Ganputi“ auf der Seite Mantras.\nOffen: Interpret, Dauer und Aufnahme deiner Version sind nicht gesichert und noch leer. Der Link ist ein Fundstück aus der Internet-Recherche (Video „Powerful Aura Cleansing Mantra Meditation, Ra Ma Da Sa Sa Say So Hung“) und nicht als deine Aufnahme bestätigt.'
  }];
}
const songById = id => (state.songs || []).find(x => x.id === id) || null;
const songDurTxt = x => (+x.dur > 0 ? fmtMin(+x.dur) + ' Min.' : '');
const songLink = u => { u = String(u || '').trim(); return /^https?:\/\//i.test(u) ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(u.replace(/^https?:\/\/(www\.)?/i, '').slice(0, 60))}</a>` : esc(u); };

// Auswahlfeld (Lied bzw. Mantra) für einen Sonderbaustein; attrs enthält die data-Attribute des Aufrufers
function sbRefSelect(it, e, attrs) {
  const opts = e.sb === 'lied'
    ? (state.songs || []).map(x => [x.id, x.n + (x.a ? ' (' + x.a + ')' : '')])
    : MANTRAS.map(x => [x.id, x.n]);
  return `<select class="sbref" ${attrs}>${[['', e.sb === 'lied' ? '– Lied wählen –' : '– Mantra wählen –']].concat(opts).map(o => opt(o[0], o[1], it.ref || '')).join('')}</select>`;
}
// Kurzvorschau unter dem Auswahlfeld
function sbPreview(it, e) {
  if (e.sb === 'lied') { const x = songById(it.ref); return x ? `<small class="muted sbprev">${esc([x.a, songDurTxt(x)].filter(Boolean).join(' · '))}${x.text ? (x.a || songDurTxt(x) ? ' · ' : '') + esc(String(x.text).replace(/\s+/g, ' ').slice(0, 90)) : ''}</small>` : '<small class="muted sbprev">Der Lied-Katalog (oben rechts) enthält deine Lieder.</small>'; }
  const m = manById(it.ref); return m ? `<small class="muted sbprev">${esc(m.text.join(' – ').slice(0, 110))}</small>` : '<small class="muted sbprev">Mantras aus der Seite Mantras.</small>';
}
// Name, Zusatz und Symbol eines Sonderbausteins (Anzeige in Stunde, Ausdruck, Player)
function sbInfo(it, e) {
  if (e.sb === 'lied') { const x = songById(it.ref); return { title: x ? x.n : 'Lied', sub: x ? x.a || '' : 'noch nichts gewählt', fig: figureSVG('lied') }; }
  if (e.sb === 'mantra') { const m = manById(it.ref); return { title: m ? m.n : 'Mantra', sub: m ? '' : 'noch nichts gewählt', fig: m ? manIconSVG(m.id) : figureSVG('mantrasb') }; }
  return { title: 'Text', sub: '', fig: figureSVG('textblock') };
}
// Player-Inhalt für Lied und Mantra
function sbDet(it, e) {
  const paras = t => String(t || '').split(/\n{2,}/).filter(x => x.trim());
  if (e.sb === 'lied') {
    const x = songById(it.ref); if (!x) return [{ ic: 'cue', h: 'Lied', paras: ['Es ist noch kein Lied gewählt.'] }];
    const det = [{ ic: 'cue', h: 'Lied', paras: x.text ? paras(x.text) : ['Kein Liedtext hinterlegt.'] }];
    const info = [x.a && 'Interpret: ' + x.a, x.use && 'Einsatz: ' + x.use, x.url && 'Link: ' + x.url].filter(Boolean);
    if (info.length) det.push({ ic: 'clock', h: 'Angaben', items: info });
    if (x.notes) det.push({ ic: 'wirk', h: 'Notizen', paras: paras(x.notes) });
    return det;
  }
  const m = manById(it.ref); if (!m) return [{ ic: 'cue', h: 'Mantra', paras: ['Es ist noch kein Mantra gewählt.'] }];
  const det = [{ ic: 'cue', h: 'Mantra', paras: [(m.dev ? m.dev + '\n' : '') + m.text.join('\n')] }];
  if (m.bed && m.bed.length) det.push({ ic: 'wirk', h: 'Bedeutung', items: m.bed.map(b => b[0] + ': ' + b[1]) });
  if (m.an) det.push({ ic: 'breath', h: 'Anleitung', paras: [m.an] });
  return det;
}

// ---------- Seite „Lied-Katalog“ ----------
function viewSongs() {
  const q = norm(ui.songQ || ''), d = ui.songDraft;
  if (d) {
    return `<section class="panel"><h2>${state.songs.some(x => x.id === d.id) ? 'Lied bearbeiten' : 'Neues Lied'}</h2>
<p class="muted">Nur der Titel ist Pflicht, alles andere ist optional.</p>
<div class="grid">${fld('Titel', inp('u:songDraft.n', 'text', d.n || '', 'placeholder="z. B. Aura Cleansing Ganputi" autocomplete="off"'))}${fld('Interpret', inp('u:songDraft.a', 'text', d.a || '', 'autocomplete="off"'))}${fld('Dauer (Minuten)', inp('u:songDraft.dur', 'number', d.dur || 0, 'min="0" max="60" step="0.5"'))}${fld('Link (YouTube, Spotify o. ä.)', inp('u:songDraft.url', 'url', d.url || '', 'placeholder="https://…" autocomplete="off"'))}</div>
${fld('Einsatz in der Stunde', inp('u:songDraft.use', 'text', d.use || '', 'placeholder="z. B. Einstimmung, Chakra, Abschluss" autocomplete="off"'))}
${fld('Liedtext', `<textarea rows="8" data-f="u:songDraft.text" placeholder="Text zum Mitsingen …">${esc(d.text || '')}</textarea>`)}
${fld('Notizen', `<textarea rows="4" data-f="u:songDraft.notes" placeholder="Eigene Notizen, Akkorde, Hinweise …">${esc(d.notes || '')}</textarea>`)}
<div class="bar"><button class="primary" data-a="songSave">💾 Lied speichern</button><button data-a="songCancel">Abbrechen</button></div></section>`;
  }
  const list = (state.songs || []).filter(x => !q || norm([x.n, x.a, x.text, x.use, x.notes].join(' ')).includes(q));
  const card = x => `<section class="panel songcard"><div class="songh"><div class="xtile cat-lied" title="${esc(x.n)}">${figureSVG('lied')}</div><div class="grow"><h3>${esc(x.n)}</h3><div class="muted">${esc([x.a, songDurTxt(x)].filter(Boolean).join(' · ') || 'Interpret und Dauer nicht angegeben')}</div>${x.use ? `<div class="mchips"><span class="chip kc">${esc(x.use)}</span></div>` : ''}${x.url ? `<div class="songl">${songLink(x.url)}</div>` : ''}</div>
<div class="songb"><button class="sm" data-a="songEdit" data-id="${x.id}">✎ Bearbeiten</button><button class="sm ghost danger" data-a="songDel" data-id="${x.id}">🗑 Löschen</button></div></div>
${x.text ? `<details class="sqfold" data-id="song:${x.id}" ${ui.open.has('song:' + x.id) ? 'open' : ''}><summary>Liedtext</summary><p class="songtx">${esc(x.text).replace(/\n/g, '<br>')}</p></details>` : ''}
${x.notes ? `<details class="sqfold" data-id="songn:${x.id}" ${ui.open.has('songn:' + x.id) ? 'open' : ''}><summary>Notizen</summary><p class="songtx">${esc(x.notes).replace(/\n/g, '<br>')}</p></details>` : ''}</section>`;
  return `<div class="hero">${LOTUS}<div><h1>Lied-Katalog</h1><p>Deine Lieder und Gesänge für die Stunden. Im Auswahlfenster einer Stunde oder Sequenz gibt es dazu den Sonderbaustein „Lied“.</p></div><span class="grow"></span><button class="primary" data-a="songNew">＋ Neues Lied</button></div>
<div class="panel"><div class="grid">${fld('Suche', inp('u:songQ', 'search', ui.songQ || '', 'placeholder="Titel, Interpret, Text …" data-live="1"'))}</div><div class="bar"><span class="muted">${list.length} von ${(state.songs || []).length} Liedern</span></div></div>
${list.map(card).join('') || '<div class="card"><p class="muted">Kein Lied gefunden.</p></div>'}`;
}
const SONG_ACTIONS = {
  songNew() { ui.songDraft = { id: 'song_' + uid(), n: '', a: '', dur: 0, url: '', text: '', use: '', notes: '' }; render(); },
  songEdit(d) { const x = songById(d.id); if (x) { ui.songDraft = deepCopy(x); render(); } },
  songCancel() { ui.songDraft = null; render(); },
  songSave() {
    const d = ui.songDraft; if (!d) return;
    const n = String(d.n || '').trim(); if (!n) { toast('Bitte einen Titel eingeben.'); return; }
    const x = { id: d.id, n, a: String(d.a || '').trim(), dur: Math.max(0, +d.dur || 0), url: String(d.url || '').trim(), text: String(d.text || '').trim(), use: String(d.use || '').trim(), notes: String(d.notes || '').trim() };
    const k = state.songs.findIndex(y => y.id === d.id); if (k >= 0) state.songs[k] = x; else state.songs.push(x);
    ui.songDraft = null; save(); render(); toast(`Lied „${n}“ gespeichert.`);
  },
  songDel(d, el) {
    const x = songById(d.id); if (!x || !confirmTwice(el, 'songdel' + d.id, `Lied „${x.n}“ löschen? Stunden mit diesem Lied zeigen dann „noch nichts gewählt“`)) return;
    state.songs = state.songs.filter(y => y !== x); save(); render();
  }
};

// ---------- Sonderbausteine: Auswahlfenster und Erklärung im Übungskatalog ----------
const SB_PICK = [
  [TXB_ID, 'textblock', 'Textblock', 'Statt einer Übung: ein Textabschnitt an dieser Stelle', 'textblock text sonderbaustein anleitung hinweis'],
  [LIED_ID, 'lied', 'Lied', 'Statt einer Übung: ein Lied aus dem Lied-Katalog', 'lied song musik gesang sonderbaustein'],
  [MANSB_ID, 'mantrasb', 'Mantra', 'Statt einer Übung: ein Mantra aus der Seite Mantras', 'mantra chanten gesang sonderbaustein']
];
const sbPickRows = (action, curId) => SB_PICK.map(([id, fig, n, txt, kw]) => `<button class="pko cat-${SB_DEFS[id].c}${curId === id ? ' cur' : ''}" data-a="${action}" data-id="${id}" data-q="${kw}"><span class="pkf">${figureSVG(fig)}</span><div class="pkinfo"><div class="pkname"><b>${n}</b><small class="sa">Sonderbaustein</small></div><div class="pkmeta"><span>${txt}</span></div></div></button>`).join('');
function sonderPanels(q) {
  const P = (c, fig, n, txt, kw) => (!q || kw.includes(q)) ? `<div class="panel sonder"><div class="ktile cat-${c}">${figureSVG(fig)}</div><div><b>Sonderbaustein: ${n}</b><p class="muted">${txt}</p></div></div>` : '';
  return P('textblock', 'textblock', 'Textblock', 'Im Auswahlfenster einer Stunde (Klick auf eine Übungskachel oder „＋ Übung auswählen“) und in der Sequenz stehen ganz oben die Sonderbausteine. Wählst du den Textblock, entsteht an dieser Stelle statt einer Übung ein Textabschnitt mit eigener Dauer, z. B. für eine Anleitung, einen Hinweis oder Yoga Nidra. Er wird im Ausdruck und im Player mit ausgegeben und erscheint nie automatisch.', 'textblock sonderbaustein text')
    + P('lied', 'lied', 'Lied', 'Wie der Textblock, aber mit einem Lied aus dem Lied-Katalog (oben rechts). Die Dauer des Liedes wird übernommen, wenn sie dort eingetragen ist. Im Player erscheinen Liedtext, Einsatz und Notizen.', 'lied song musik gesang sonderbaustein')
    + P('mantrasb', 'mantrasb', 'Mantra', 'Wie der Textblock, aber mit einem Mantra aus der Seite Mantras. Im Player erscheinen Mantra-Text, Bedeutung und Anleitung. Die Dauer stellst du selbst ein.', 'mantra chanten gesang sonderbaustein');
}
