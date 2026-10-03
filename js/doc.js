/* Ausgabe (DIN A4): Übersicht, Stundenpläne (nach Vorlage), Strichmännchen-Blätter, E-Mail */
const LOTUS = `<svg class="lotus" viewBox="0 0 64 40" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M32 5c6 7 8 15 0 27c-8-12-6-20 0-27z"/><path d="M32 33C20 31 12 23 10 12c10 0 18 7 22 21z"/><path d="M32 33c12-2 20-10 22-21c-10 0-18 7-22 21z"/><path d="M32 35C18 37 8 33 2 25c10-2 20 0 30 10z"/><path d="M32 35c14 2 24-2 30-10c-10-2-20 0-30 10z"/></g></svg>`;

const DOC_CSS = `
.doc{font:13px/1.5 "Nunito","Segoe UI",system-ui,-apple-system,sans-serif;color:#33302b}
.doc *{box-sizing:border-box}
.paper{position:relative;background:#fffdf9;color:#33302b;width:210mm;max-width:100%;min-height:297mm;padding:15mm 15mm 14mm;margin:0 auto 20px;box-shadow:0 2px 14px rgba(70,60,40,.22);border-radius:2px;overflow:hidden}
.paper.land{width:297mm;min-height:210mm}
.paper.pg{height:297mm;min-height:0;max-width:none;flex:none;padding:15mm 15mm 0}
.paper.pg.land{height:210mm;width:297mm;padding-top:12mm}
.paper .kurs.cont{margin-bottom:8px}
#docPreview .paper.pg{margin:0 auto 18px}
.paper .lotus{color:#8aa897}
.paper .wm{position:absolute;right:10mm;top:9mm;width:26mm;opacity:.55}
.paper h1,.paper h2,.paper h3{font-family:"Cormorant Garamond",Georgia,"Times New Roman",serif;color:#3f5a4b;font-weight:600}
.paper h1{font-size:27px;margin:0 0 2px}
.paper h2{font-size:22px;margin:0 0 6px;padding-right:28mm;line-height:1.2}
.paper h3{font-size:16px;margin:15px 0 4px;padding-bottom:2px;border-bottom:1px solid #d7e1d9}
.paper p{margin:0 0 7px}
.paper .sub{color:#7a7468;margin-bottom:12px}
.paper .kurs{color:#8a8376;font-size:11px;letter-spacing:.08em;text-transform:uppercase;margin-bottom:2px}
.paper table{width:100%;border-collapse:collapse}
.paper td,.paper th{border:1px solid #cfd8d0;padding:4px 8px;vertical-align:top;text-align:left}
.paper th{background:#e8efe9;color:#3f5a4b;font-weight:700}
.paper td.min{width:64px;white-space:nowrap;color:#3f5a4b;font-weight:700}
.paper td.lab{width:170px;font-weight:700;background:#f4f7f3}
.paper .txt p{margin:0 0 7px}
.paper .arc{margin-top:12px;color:#5b5a52;font-style:italic}
.paper .box{border:1px solid #cfd8d0;border-left:4px solid #c9826b;padding:6px 10px;margin-top:8px;background:#fbf5ef;border-radius:0 6px 6px 0}
.paper .alt{font-size:11.5px;color:#5b5a52;margin-top:8px;line-height:1.55}
.paper .pr{font-size:11px;color:#7a7468}
.paper .hint{font-size:12px;color:#7a7468;font-style:italic;margin-top:10px}
.paper .foot{position:absolute;left:15mm;right:15mm;bottom:7mm;text-align:center;font-size:10px;color:#a39c8e}
.praxt{width:100%;border-collapse:collapse;table-layout:fixed;font-size:12px}.praxt td{border:1px solid #444;padding:4px 7px;vertical-align:top}.praxt td.pm{width:15mm;border:0;border-right:1px solid #444;text-align:right;font-size:11px;color:#6b665c;padding-right:5px}.praxt td.pl{width:46mm;line-height:1.35}.praxt tr.txr td.pr2{line-height:1.4}.praxt .eff{font-size:11px;color:#6b665c}
.praxt tr.figr td.pr2{padding:3px 4px}.praxt .pt{display:inline-flex;flex-direction:column;align-items:center;width:calc(100% / var(--per) - 2px);margin:1px;text-align:center;font-size:10.5px;line-height:1.15;vertical-align:top}.praxt .pt .fg{position:relative;display:inline-block;line-height:0}.praxt .pt .fig,.praxt .pt svg{width:var(--pfig);height:var(--pfig);color:#222}.praxt .pt .nm{display:block;margin-top:1px}.praxt .pt.kr .nm{color:#b0443a;font-weight:700}.praxt .pt .pk{position:absolute;top:-2px;right:-5px;width:11px;height:11px;border-radius:50%;background:#e0a82e;color:#fff;font-size:8px;line-height:11px;text-align:center}
.ovc{border:1px solid #cfd8d0;border-radius:8px;padding:5px 8px 4px;margin:0 0 7px;break-inside:avoid;background:#fffdf9}
.ovh{display:flex;align-items:baseline;gap:8px;font-size:12.5px;margin-bottom:3px}.ovh .no{display:inline-block;min-width:18px;height:18px;border-radius:50%;background:#c9826b;color:#fff;text-align:center;font-size:11px;line-height:18px;font-weight:700;-webkit-print-color-adjust:exact;print-color-adjust:exact}.ovh .tt{font-weight:700;color:#3f5a4b}.ovh .mi{margin-left:auto;color:#7a7468;white-space:nowrap}
.ovs{display:flex;height:13px;border-radius:7px;overflow:hidden;margin:2px 0 4px;-webkit-print-color-adjust:exact;print-color-adjust:exact}.ovs i{display:block;font-style:normal;font-size:7.5px;line-height:13px;color:#fff;text-align:center;overflow:hidden;white-space:nowrap;text-shadow:0 0 2px rgba(0,0,0,.35)}
.ovc.big{border:0;padding:0}.ovc.big .ovh{font-size:16px;margin-bottom:6px}.ovc.big .ovs{height:20px;border-radius:10px;margin:4px 0 10px}.ovc.big .ovs i{font-size:11px;line-height:20px}.ovc.big .mx{font-size:var(--fs);padding:4px 2px 3px;border-radius:9px}.ovc.big .mx svg,.ovc.big .mx .fig{width:var(--fig);height:var(--fig)}.ovc.big .mx span.nm{height:auto;min-height:2.3em;margin-top:3px}.ovc.big .mx .pk{width:15px;height:15px;font-size:10px;line-height:15px;top:-3px;right:-6px}
.ovt{display:grid;grid-template-columns:repeat(15,minmax(0,1fr));gap:3px}
.mx{display:flex;flex-direction:column;align-items:center;justify-content:flex-start;border:1px solid;border-radius:6px;padding:2px 1px 1px;font-size:6.5px;line-height:1.1;text-align:center;overflow:hidden;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.mx.sqb{position:relative;overflow:visible}.mx.sqb::after{content:"";position:absolute;left:100%;top:0;width:var(--g,3px);height:100%;background:var(--sc);-webkit-print-color-adjust:exact;print-color-adjust:exact}.ovc.big .mx{--g:4px}.mx.sq-mobilisation{--sc:#c8a25e}.mx.sq-asana{--sc:#4f8a6e}.mx.sq-cooldown{--sc:#a2688c}.mx .fg{position:relative;display:inline-block;line-height:0}.mx .fig,.mx svg{width:34px;height:34px;color:#3d4a42}.mx span.nm{display:block;margin-top:1px;height:15px;overflow:hidden;color:#4a4a42}.mx .pk{position:absolute;top:-2px;right:-4px;width:11px;height:11px;border-radius:50%;background:#e0a82e;color:#fff;font-size:8px;line-height:11px;text-align:center}
.ex{display:inline-flex;flex-direction:column;align-items:center;width:90px;margin:3px 2px;text-align:center;font-size:11px;line-height:1.2;vertical-align:top}
.ex .fig{width:52px;height:52px;color:#3d4a42}
.ex .fg{position:relative;display:inline-block;line-height:0}
.ex .pk{position:absolute;top:-3px;right:-5px;width:15px;height:15px;border-radius:50%;background:#e0a82e;color:#fff;font-size:10px;line-height:15px;text-align:center;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.ex small{color:#8a8376;font-size:10px;margin-top:1px}
.ex small.sa{font-style:italic;color:#7b8f80}
.exg{display:inline-flex;align-items:flex-end;gap:0;border:1px dashed #c4d0c6;border-radius:10px;padding:2px 3px;margin:3px 2px;background:#f8faf6}
.ex.alt{width:78px;font-size:10px;opacity:.92}.ex.alt .fig{width:38px;height:38px}.ex.alt small.lv{color:#c9826b;font-weight:700;margin:0 0 1px}
.big .ex{width:120px;font-size:12.5px;margin:6px 4px}
.big .ex .fig{width:82px;height:82px}
.paper .arrow{width:34px;text-align:center;font-size:20px;color:#8aa897;vertical-align:middle}
.paper .flowt td.arrow{border-left:0;border-right:0}
.paper .alts td{vertical-align:middle}.ex.alt2{width:110px}
.ucard{display:inline-flex;gap:8px;width:49%;vertical-align:top;margin:0 0 8px;padding:6px 8px;border:1px solid #cfd8d0;border-radius:8px;background:#fbfcfa;break-inside:avoid}
.ucard .utile{flex:none;width:62px;display:flex;align-items:flex-start;justify-content:center;background:#e8efe9;border-radius:8px;padding:4px}.ucard .utile .fig{width:54px;height:54px;color:#3d4a42}
.ucard .uinfo{min-width:0;font-size:11px;line-height:1.4}.ucard .un{font-size:12.5px}.ucard .um{color:#5b5a52}.ucard p{margin:3px 0 0}
.paper .dwarn{color:#a5543a}.paper .sa{color:#7b8f80;font-style:italic;font-size:10.5px}
.dcard{margin:0 0 12px;padding:8px 10px;border:1px solid #cfd8d0;border-radius:8px;background:#fbfcfa;break-inside:avoid}
.dcard .dh{display:flex;gap:10px;align-items:center;margin-bottom:5px}.dcard .dh .fg{flex:none;background:#e8efe9;border-radius:8px;padding:4px}.dcard .dh .fig{width:46px;height:46px;color:#3d4a42}
.dcard .dh b{font-size:14px}.dcard .um{color:#5b5a52;font-size:11px}
.dcard table td{font-size:11.5px;padding:3px 7px}.dcard table td.lab{width:120px;font-size:11px}
.paper .kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:6px 0 10px}
.paper .kpi{border:1px solid #cfd8d0;border-radius:8px;padding:5px 9px;background:#fbfcfa;display:flex;flex-direction:column;gap:1px}
.paper .kpi b{font:600 17px "Cormorant Garamond",Georgia,serif;color:#3f5a4b}.paper .kpi span{font-size:10px;color:#7a7468}.paper .kpi small{font-size:10px}
.paper .agrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:8px 0;align-items:start}
.paper .apanel{border:1px solid #cfd8d0;border-top:3px solid #6f9480;border-radius:8px;padding:6px 9px;background:#fbfcfa;margin:0}
.paper .apanel h3{font-size:12.5px;margin:0 0 2px;border:0;padding:0}.paper .phint2{font-size:9px;color:#7a7468;margin:0 0 4px;line-height:1.3}
.paper .abars{display:flex;flex-direction:column;gap:3px;margin-bottom:5px}
.paper .abar{display:grid;grid-template-columns:42% 1fr auto;gap:5px;align-items:center;font-size:9.5px;line-height:1.2}
.paper .abar .at{height:7px;background:#e3ece5;border-radius:9px;overflow:hidden}.paper .abar .at i{display:block;height:100%;background:#4f7a62;border-radius:9px}
.paper .abar .av{white-space:nowrap;color:#7a7468}.paper .abar.zero{opacity:.45}
.paper .subh{font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#3f5a4b;margin:5px 0 3px}
.paper .rstars{background:linear-gradient(90deg,#e0a82e var(--p),#d6d1c2 var(--p));-webkit-background-clip:text;background-clip:text;color:transparent;letter-spacing:1px;font-size:12px;white-space:nowrap}
.paper .hints{background:#fbf5ef;border:1px solid #cfd8d0;border-left:4px solid #c9826b;border-radius:0 8px 8px 0;padding:5px 10px;margin:6px 0}.paper .hints h3{font-size:12.5px;margin:0;border:0}.paper .hints ul{margin:3px 0 0;padding-left:16px;font-size:10.5px}
.paper .atbl{font-size:10px}.paper .atbl td,.paper .atbl th{padding:3px 6px}
.paper .dots{display:inline-flex;gap:2px;vertical-align:middle}.paper .dots i{width:7px;height:7px;border-radius:50%;background:#d6d1c2}.paper .dots i.on{background:#4f7a62}
.paper .kchips{display:flex;flex-wrap:wrap;gap:2px;margin:1px 0}.paper .kchips .chip{font-size:8.5px;padding:0 5px;border:1px solid #cfd8d0;border-radius:9px;background:#eef3ef}.paper .kchips .kr{background:#f7ebe4}
.paper .star{display:inline-block;width:12px;height:12px;border-radius:50%;background:#e0a82e;color:#fff;font-size:8px;line-height:12px;text-align:center;margin-left:3px}
.paper .spark{display:flex;align-items:flex-end;gap:4px;height:54px;border-bottom:1px solid #cfd8d0;margin:4px 0 8px}
.paper .spark .col{flex:1;max-width:24px;height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center}.paper .spark .col i{display:block;width:100%;background:#c9826b;border-radius:3px 3px 0 0;min-height:2px}.paper .spark small{font-size:8px;color:#7a7468}
.paper .lvbar{display:inline-block;width:36px;height:6px;background:#e3ece5;border-radius:9px;overflow:hidden;vertical-align:middle}.paper .lvbar i{display:block;height:100%;background:#c9826b}
.paper .stdot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:4px;background:#999}.paper .stc-vorgeplant{background:#d9776d}.paper .stc-in_planung{background:#e0b92e}.paper .stc-fertig{background:#5fa56f}
.paper .alist{list-style:none;margin:0;padding:0;font-size:10px}.paper .alist li{padding:2px 0;border-bottom:1px dashed #d7e1d9}.paper .alist .stars{display:none}
.paper .spick td{font-size:12px}
@page{size:A4;margin:0}
@page land{size:A4 landscape;margin:0}
@media print{
  html,body{background:#fff!important}
  .noprint{display:none!important}
  .paper{box-shadow:none;margin:0;padding:0;width:auto;max-width:none;min-height:0;overflow:visible;background:#fff;page-break-after:always;break-after:page}
  .paper:last-child{page-break-after:auto;break-after:auto}
  .paper.land{page:land}
  .paper.pg{width:210mm;height:296mm;margin:0!important;padding:15mm 15mm 0;box-shadow:none;overflow:hidden;background:#fff}
  .paper.pg.land{width:297mm;height:209mm;padding-top:12mm}
  .paper.pg:last-child{page-break-after:auto;break-after:auto}
  .paper.pg .wm{right:10mm;top:9mm}
  .paper.pg .foot{display:block}
  .paper .wm{right:0;top:0}
  .paper .foot{display:none}
  .paper tr,.paper .box,.paper .txt p{break-inside:avoid}
}`;

const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const paras = (t, s) => String(t || '').split(/\n{2,}/).map(p => '<p>' + kwHtml(p, s, '<b class="kw">', '</b>').replace(/\n/g, '<br>') + '</p>').join('');
const exName = id => { const e = exById(id); return e ? e.n : '?'; };
const joinNames = items => items.map(i => exName(i.id)).join(', ');
const fmtMin = v => (Math.round(v * 2) / 2).toString().replace('.', ',');

// Übungsblöcke in Reihenfolge der Stunde; Kraft am Boden gehört (falls vorhanden) zum Ausgleich-Block
function exRows(s) {
  const fk = [];
  const merge = fk.length && bon(s, 'ausgl') && bty(s, 'ausgl') === 'ex';
  const rows = [];
  order(s).forEach(k => {
    if (!bon(s, k) || bty(s, k) !== 'ex') return;
    let items = (s.blk[k] || []).slice();
    if (merge && k === 'kraft') items = items.filter(i => !onFloor(exById(i.id)));
    if (merge && k === 'ausgl') items = fk.concat(items).sort((a, b) => seqIdx(a.id) - seqIdx(b.id));
    if (items.length) rows.push({ k, name: bn(s, k), min: sumMin(items), items });
  });
  return rows;
}
const rowsMin = rs => rs.reduce((a, r) => a + r.min, 0);
const groupHeading = rs => rs.every(r => EXKEYS.includes(r.k)) ? 'Mobilisation, Asanas, Ausgleich' : rs.map(r => r.name).join(', ');

function exCell(it) {
  const e = exById(it.id); if (!e) return '';
  const main = `<span class="ex"><span class="fg">${figureSVG(e.pose)}${e.peak ? '<b class="pk">★</b>' : ''}</span><span>${esc(e.n)}</span>${e.sa ? `<small class="sa">${esc(e.sa)}</small>` : ''}${SHOW_REPS && it.rep ? `<small>${esc(it.rep)}</small>` : ''}</span>`;
  const ea = effE(it) ? altE(e) : null, ha = effH(it) ? altH(e) : null; if (!ea && !ha) return main;
  const v = (x, lab) => x ? `<span class="ex alt"><span class="fg">${figureSVG(x.pose)}${x.peak ? '<b class="pk">★</b>' : ''}</span><small class="lv">${lab}</small><span>${esc(x.n)}</span></span>` : '';
  return `<span class="exg">${v(ea, '↓ leichter')}${main}${v(ha, '↑ schwerer')}</span>`;
}
const rowTable = rs => `<table class="flowt">${rs.map(r => `<tr><td class="lab">${esc(r.name)}<br><span class="pr">(${fmtMin(r.min)} Min.)</span></td><td>${r.items.map(exCell).join('')}</td></tr>`).join('')}</table>`;
function kraftBox(s) {
  return blkAll(s).filter(i => (exById(i.id) || {}).c === 'kraft').map(it => {
    const e = exById(it.id); if (!e) return '';
    return `<div class="box"><b>Kraft: ${esc(e.n)}</b>${e.how ? ' – ' + esc(e.how) : ''}${SHOW_REPS ? ' ' + esc(it.rep || e.reps || '') : ''}${e.w ? `<br><b>Wirkung:</b> ${esc(e.w)}` : ''}${e.ev ? `<br><b>Leichtere Variante / Hinweis:</b> ${esc(e.ev)}` : ''}</div>`;
  }).join('');
}
function altList(s) {
  const seen = new Set(), li = blkAll(s).filter(i => !(effE(i) && effH(i))).map(i => exById(i.id)).filter(e => e && (altE(e) || altH(e)) && !seen.has(e.id) && seen.add(e.id)).map(e => {
    const ea = altE(e), ha = altH(e);
    return `<b>${esc(e.n)}</b>${ea ? ' ↓ ' + esc(ea.n) : ''}${ha ? ' ↑ ' + esc(ha.n) : ''}`;
  });
  return li.length ? `<div class="alt"><b>Alternativen</b> (↓ leichter, ↑ anspruchsvoller): ${li.join(' &nbsp;·&nbsp; ')}</div>` : '';
}
const showAlt = c => false;
const sessionTitle = (c, s, i) => `Stunde ${i + 1}${s.date ? ' (' + fmtDateW(s.date) + ')' : ''} – ${s.motto.title}`;
const pageFoot = c => `<div class="foot">${esc(c.name)}</div>`;
const DESCR = { mobi: 'Pawanmuktasana-Folge', aufw: 'Stand, Flow', asana: 'Stand, Balance', kraft: 'Kraft', ausgl: 'Boden, Rückenlage' };

function renderSession(c, s, i, o) {
  const T = sessionTotal(s), a = exById(s.atem.a), w = exById(s.atem.w);
  const geb = (c.gebrechen || []).map(g => GEBRECHEN[g]).join(', ');
  const row = (min, lab, inh) => `<tr><td class="min">${fmtMin(min)} Min.</td><td class="lab">${lab}</td><td>${inh}</td></tr>`;
  const onBlatt = o && o.blatt, rs = exRows(s);
  const struct = order(s).filter(k => bon(s, k)).map(k => {
    const ty = bty(s, k);
    if (ty === 'mantra') { const mm = s.mantra && manById(s.mantra.id); return row(s.dur[k], esc(bn(s, k)), esc(mm ? mm.n : 'Mantra')); }
    if (ty === 'atem') return row(s.dur[k], esc(bn(s, k)), esc([a && a.n, w && w.n].filter(Boolean).join(' + ')));
    if (ty === 'ex') { const r = rs.find(x => x.k === k); return r ? row(r.min, esc(bn(s, k)), DESCR[k] || 'Übungen') : ''; }
    return row(blockMin(s, k), esc(bn(s, k)), k === 'einl' ? esc(s.motto.title) : k === 'schluss' ? 'Nachspüren' : k === 'shava' ? esc('„' + (s.tx.kern || s.motto.kern) + '“') : 'Text');
  }).join('\n');
  // Abschnitte in Reihenfolge; aufeinanderfolgende Übungsblöcke bilden eine Tabelle
  const parts = []; let grp = [];
  const flush = () => {
    if (!grp.length) return;
    const g = rs.filter(r => grp.includes(r.k)); grp = [];
    if (g.length) parts.push({ ex: true, html: `<h3>${esc(groupHeading(g))} (${fmtMin(rowsMin(g))} Minuten)</h3>` + (onBlatt ? '<p class="hint">Die Übungsfolge mit Strichmännchen steht auf dem separaten Blatt.</p>' : rowTable(g)) });
  };
  order(s).forEach(k => {
    if (!bon(s, k)) return;
    const ty = bty(s, k);
    if (ty === 'ex') { grp.push(k); return; }
    flush();
    const txt = `<div class="txt">${paras(s.tx[k] || '', s)}</div>`;
    if (ty === 'mantra') { const mm = s.mantra && manById(s.mantra.id); parts.push({ html: `<h3>${esc(bn(s, k))}${mm ? ': „' + esc(mm.n) + '“' : ''} (${s.dur[k]} Minuten)</h3>${txt}` }); }
    else if (ty === 'atem') parts.push({ html: `<h3>${w ? esc(bn(s, k)) : esc(bn(s, k)) + (a ? ': „' + esc(a.n) + '“' : '')} (${s.dur[k]} Minuten)</h3>${txt}` });
    else parts.push({ html: `<h3>${esc(bn(s, k))}${k === 'einl' ? ' – „' + esc(s.motto.title) + '“' : ''} (${fmtMin(blockMin(s, k))} Minuten)</h3>${txt}` });
  });
  flush();
  const last = parts.map(p => !!p.ex).lastIndexOf(true);
  if (last >= 0 && !onBlatt) parts[last].html += kraftBox(s) + (showAlt(c) ? altList(s) : '');
  return `<section class="paper sess">${LOTUS.replace('class="lotus"', 'class="lotus wm"')}
<div class="kurs">${esc(c.name)}</div>
<h2>${esc(sessionTitle(c, s, i))}</h2>
<p><b>Körperlicher Fokus:</b> ${esc(s.tx.focus || s.motto.focus)}</p>
${geb ? `<p class="pr">Berücksichtigt: ${esc(geb)}</p>` : ''}
<p><b>Struktur: ${fmtMin(T)} Minuten-Klasse</b></p>
<table>${struct}</table>
<p class="pr" style="margin:6px 0 0"><b>Material:</b> ${esc(matLine(s))}</p>
${parts.map(p => p.html).join('\n')}
${pageFoot(c)}</section>`;
}
function renderBlatt(c, s, i) {
  const rs = exRows(s);
  return `<section class="paper land big blatt">${LOTUS.replace('class="lotus"', 'class="lotus wm"')}
<div class="kurs">${esc(c.name)}</div>
<h2>${esc(sessionTitle(c, s, i))}<br><span style="font-size:15px">${esc(groupHeading(rs))} (${fmtMin(rowsMin(rs))} Minuten)</span></h2>
${rowTable(rs)}${kraftBox(s)}${showAlt(c) ? altList(s) : ''}${pageFoot(c)}</section>`;
}function courseSub(c) {
  const T = sessionTotal(c.sessions[0] || { dur: courseDur(c) });
  const rh = { weekly: 'wöchentlich', biweekly: 'zweiwöchentlich', days: 'an ausgewählten Wochentagen' }[c.rhythm || 'weekly'];
  const bits = [LEVELS[c.level], `${c.single ? 'Einzelstunde' : c.sessions.length + ' Stunden'} à ${T} Min.${c.single ? '' : ' (' + rh + ')'}`, { aus: 'ohne Atemteil', atem: 'Atemübungen', atem_wahr: 'Atem- + Wahrnehmungsübungen', gemischt: 'Atem- und Wahrnehmungsübungen im Wechsel', zufall: 'Atem- und Wahrnehmungsübungen (zufällig)' }[c.breath]];
  if (c.kraft) bits.push('mit Kraftübung');
  if ((c.gebrechen || []).length) bits.push('Rücksicht auf: ' + c.gebrechen.map(g => GEBRECHEN[g]).join(', '));
  if (c.motto.mode === 'uebermotto') bits.unshift('Übermotto: ' + (c.motto.preset === 'frei' && c.motto.free ? c.motto.free : (PRESETS[c.motto.preset] || {}).t));
  return bits.join(' · ');
}
function renderOverview(c) {
  const rows = c.sessions.map((s, i) => `<tr><td>${i + 1}</td><td>${esc(fmtDateW(s.date))}</td><td><b>${esc(s.motto.title)}</b></td>
<td>${esc(s.tx.focus || s.motto.focus)}<br><i>→ „${esc(s.tx.kern || s.motto.kern)}“</i></td>
<td>${esc([s.atem.a && exName(s.atem.a), s.atem.w && exName(s.atem.w)].filter(Boolean).join(' + '))}</td>
<td>${esc(joinNames((s.blk.asana || []).concat(s.blk.ausgl || [])))}</td></tr>`).join('');
  return `<section class="paper land ov">${LOTUS.replace('class="lotus"', 'class="lotus wm"')}<h1>Übersicht ${esc(c.name)}</h1><p class="sub">${esc(courseSub(c))}</p>
<table><thead><tr><th>Nr.</th><th>Datum</th><th>Titel</th><th>Fokus</th><th>Atem</th><th>Asanas</th></tr></thead><tbody>${rows}</tbody></table>
<p class="arc">${esc(c.sessions.map(s => s.motto.title).join(' → '))}</p>${pageFoot(c)}</section>`;
}
// Stundenübersicht (wie in der App): je Stunde Datum, Titel, farbiger Verlauf und alle Übungen als Kacheln
const OV_BC = { einl: '#b9a684', atem: '#6fb8bd', mantra: '#d4d8e2', mobi: '#d4b483', shakti: '#8e6bb8', aufw: '#86b394', asana: '#4f8a6e', kraft: '#b0443a', ausgl: '#cf8fa3', schluss: '#cdb463', shava: '#7d8fa8' };
function renderStundenUeb(c, only) {
  const mt = (col, svg, nm, pk, sq) => `<span class="mx${sq || ''}" style="background:${col}33;border-color:${col};--bc:${col}"><span class="fg">${svg}${pk ? '<b class="pk">★</b>' : ''}</span><span class="nm">${esc(nm)}</span></span>`;
  const cards = c.sessions.map((s, i) => {
    if (only && only.s !== s) return '';
    const ks = order(s).filter(k => bon(s, k)), col = k => OV_BC[abOf(s, k)] || '#a9b4c2';
    const min = k => bty(s, k) === 'ex' ? sumMin(s.blk[k] || []) : (+s.dur[k] || 0);
    const strip = ks.map(k => `<i style="flex:${Math.max(min(k), 0.01)};background:${col(k)}${abOf(s, k) === 'mantra' ? ';color:#4a5160;text-shadow:none' : ''}">${min(k) >= 5 ? esc(bn(s, k)) : ''}</i>`).join('');
    const tiles = [];
    ks.forEach(k => {
      const ty = bty(s, k);
      if (ty === 'atem') { [s.atem && s.atem.a, s.atem && s.atem.w].filter(Boolean).forEach(id => { const e = exById(id); if (e) tiles.push(mt(col(k), figureSVG(e.pose), e.n)); }); }
      else if (ty === 'mantra') { const m = s.mantra && typeof manById === 'function' && manById(s.mantra.id); if (m) tiles.push(mt(col(k), manIconSVG(m.id), m.n.replace(/\s*\(.*$/, ''))); }
      else if (ty === 'ex') (s.blk[k] || []).forEach((it, j, arr) => { const e = exById(it.id); if (e) tiles.push(mt(col(k), figureSVG(e.pose), e.n, e.peak, seqBridge(arr, j))); });
    });
    const rowFix = cols => tiles.forEach((t, i) => { if ((i + 1) % cols === 0) tiles[i] = t.replace(' sqb', ''); });
    if (!only) rowFix(15);
    if (only) { // eine Stunde füllt die Seite: Kachelgröße nach Anzahl
      const W = 267, n = Math.max(tiles.length, 1), fsOf = cell => Math.max(7.5, Math.min(11, cell * 0.36));
      const est = cols => { const cell = W / cols - 3; return Math.ceil(n / cols) * (cell * 0.62 + 2.3 * fsOf(cell) * 0.2646 + 3.5 + 1.1); };
      let cols = 14; for (let k = 6; k <= 14; k++) if (est(k) <= 138) { cols = k; break; }
      const cell = W / cols - 3; rowFix(cols);
      return `<div class="ovc big"><div class="ovh"><span class="no">${i + 1}</span><span>${esc(fmtDateW(s.date))}</span><span class="tt">${esc(s.motto.title)}</span><span class="mi">${fmtMin(plannedTotal(s))} Min.</span></div><div class="ovs">${strip}</div><div class="ovt" style="grid-template-columns:repeat(${cols},minmax(0,1fr));gap:4px;--fig:${(cell * 0.62).toFixed(1)}mm;--fs:${fsOf(cell).toFixed(1)}px">${tiles.join('')}</div></div>`;
    }
    return `<div class="ovc"><div class="ovh"><span class="no">${i + 1}</span><span>${esc(fmtDateW(s.date))}</span><span class="tt">${esc(s.motto.title)}</span><span class="mi">${fmtMin(plannedTotal(s))} Min.</span></div><div class="ovs">${strip}</div><div class="ovt">${tiles.join('')}</div></div>`;
  }).join('');
  if (only) return `<section class="paper land">${paperHead(c, esc(sessionTitle(c, only.s, only.i)) + '<br><span style="font-size:15px">Stundenübersicht</span>')}${cards}${pageFoot(c)}</section>`;
  return `<section class="paper land">${paperHead(c, 'Stundenübersicht', esc(courseSub(c)))}${cards}${pageFoot(c)}</section>`;
}

// Praxisblatt (nach Vorlage): eine Seite je Stunde – links Zeit/Notizen, rechts Übungen als Strichmännchen; Mobilisation und Shakti Naam als Textzeilen, Asanas gruppiert
function renderPrax(c, s, i) {
  const ks = order(s).filter(k => bon(s, k));
  const minOf = k => bty(s, k) === 'ex' ? sumMin(s.blk[k] || []) : (+s.dur[k] || 0);
  const names = items => (items || []).map(it => exById(it.id)).filter(Boolean).map(e => esc(e.n) + (e.peak ? ' ★' : '')).join(', ');
  const fig = it => { const e = exById(it.id); return e ? `<span class="pt${e.c === 'kraft' ? ' kr' : ''}"><span class="fg">${figureSVG(e.pose)}${e.peak ? '<b class="pk">★</b>' : ''}</span><span class="nm">${esc(e.n)}</span></span>` : ''; };
  const n = ks.reduce((a, k) => a + (bty(s, k) === 'ex' && ['asana', 'ausgl'].includes(abOf(s, k)) ? (s.blk[k] || []).length : 0), 0);
  const per = n > 64 ? 8 : n > 48 ? 7 : n > 34 ? 6 : 5, figMm = n > 64 ? 8.5 : n > 48 ? 11 : n > 34 ? 14 : 17;
  const row = (min, left, right, cls) => `<tr class="${cls || ''}"><td class="pm">${min != null ? esc(fmtMin(min)) + ' Min.' : ''}</td><td class="pl">${left}</td><td class="pr2">${right}</td></tr>`;
  const rows = [];
  ks.forEach(k => {
    const ty = bty(s, k), ab = abOf(s, k), name = esc(bn(s, k)), mn = minOf(k);
    if (ty === 'text') {
      const kern = esc(s.tx.kern || s.motto.kern || '');
      rows.push(row(mn, `<b>${name}</b>`, ab === 'einl' ? `<b>${esc(s.motto.title)}</b>${kern ? ' – ' + kern : ''}` : ab === 'shava' ? (kern ? '„' + kern + '“' : '') : ab === 'schluss' ? 'Nachspüren' : '', 'txr'));
    } else if (ty === 'atem') {
      rows.push(row(mn, `<b>${name}</b>`, esc([s.atem.a && exName(s.atem.a), s.atem.w && exName(s.atem.w)].filter(Boolean).join(' + ')), 'txr'));
    } else if (ty === 'mantra') {
      const mm = s.mantra && typeof manById === 'function' && manById(s.mantra.id);
      rows.push(row(mn, `<b>${name}</b>`, esc(mm ? mm.n : ''), 'txr'));
    } else if (ty === 'ex') {
      const items = s.blk[k] || []; if (!items.length) return;
      if (ab === 'mobi' || ab === 'shakti') {
        const eff = ab === 'shakti' ? items.map(it => exById(it.id)).filter(e => e && e.d).slice(0, 2).map(e => '<br><span class="eff">' + esc(e.n) + ': ' + esc(e.d.length > 130 ? e.d.slice(0, 127).replace(/\s+\S*$/, '') + ' …' : e.d) + '</span>').join('') : '';
        rows.push(row(mn, `<b>${name}</b>`, names(items) + eff, 'txr'));
      } else {
        // Gruppen nach Chakra (falls zugeordnet), sonst fortlaufend
        const ch = it => { const e = exById(it.id); return ((e && e.kat && e.kat.chakra) || [])[0] || ''; };
        let groups = []; items.forEach(it => { const g = groups[groups.length - 1], key = ch(it); if (g && g.key === key) g.items.push(it); else groups.push({ key, items: [it] }); });
        groups = [{ key: '', items }]; // fortlaufend in Reihen (links Platz für eigene Notizen)
        groups.forEach((g, gi) => {
          for (let p = 0; p < g.items.length; p += per) {
            const first = gi === 0 && p === 0, lbl = p === 0 ? (g.key ? '<b>' + esc((KAT.chakra || {})[g.key] || g.key) + '</b>' : (first ? '' : '')) : '';
            rows.push(row(first ? mn : null, (first ? '<b>' + name + '</b>' : '') + (first && lbl ? '<br>' : '') + lbl, g.items.slice(p, p + per).map(fig).join(''), 'figr'));
          }
        });
      }
    }
  });
  return `<section class="paper prax">${paperHead(c, esc(sessionTitle(c, s, i)), esc(`${fmtMin(plannedTotal(s))} Min. · ${LEVELS[c.level]}`))}<table class="praxt" style="--per:${per};--pfig:${figMm}mm"><tbody>${rows.join('')}</tbody></table>${pageFoot(c)}</section>`;
}
function buildDoc(c, o) {
  const sel = docSelIdx(c, o), whole = !c.single && sel.length === c.sessions.length;
  let h = '';
  if (o.ueb && whole) h += renderOverview(c);
  if (o.uebS && whole && c.sessions.length) h += renderStundenUeb(c);
  sel.forEach(i => {
    const s = c.sessions[i]; if (!s) return;
    if (o.prax) h += renderPrax(c, s, i);
    if (o.uebE) h += renderStundenUeb(c, { s, i });
    if (o.std) h += renderSession(c, s, i, o);
    if (o.blatt) h += renderBlatt(c, s, i);
    if (o.alt) h += renderAltBlatt(c, s, i);
    if (o.uebw) h += renderUebBlatt(c, s, i);
    if (o.spick) h += renderSpick(c, s, i);
    if (o.hands) h += renderHands(c, s, i);
    if (o.detS) h += renderDetail(c, [i]);
    if (o.anaS) h += renderAnaSession(c, s, i);
  });
  if (o.mat) h += renderMaterial(c, sel.filter(i => c.sessions[i]));
  if (o.geb) h += renderGeb(c, sel.filter(i => c.sessions[i]));
  if (o.detail) h += renderDetail(c, sel.filter(i => c.sessions[i]));
  if (o.anaP && whole && c.sessions.length) h += renderAnaProgram(c);
  if (o.katall) h += renderKatalog(c);
  return h || '<p class="pr">Nichts ausgewählt.</p>';
}
const standaloneHtml = (c, o) => `<!doctype html><html lang="de"><head><meta charset="utf-8"><title>${esc(c.name)}</title><style>${DOC_CSS}body{background:#e9e4da;margin:0;padding:14px}@media print{body{padding:0}}</style></head><body class="doc">${buildDoc(c, o)}<script>${paginateDoc.toString()};window.addEventListener('load',function(){(document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve()).then(function(){paginateDoc(document.body);});});</script></body></html>`;

function overviewText(c) {
  const lines = [`${c.name}`, courseSub(c), ''];
  c.sessions.forEach((s, i) => {
    lines.push(`${i + 1}. ${fmtDateW(s.date)} – ${s.motto.title}`, `   Fokus: ${s.tx.focus || s.motto.focus}`,
      `   Atem: ${[s.atem.a && exName(s.atem.a), s.atem.w && exName(s.atem.w)].filter(Boolean).join(' + ') || '–'}`, `   Asanas: ${joinNames((s.blk.asana || []).concat(s.blk.ausgl || []))}`, '');
  });
  return lines.join('\n');
}

// --- E-Mail ---
const utf8b64 = str => { let bin = ''; new TextEncoder().encode(str).forEach(b => { bin += String.fromCharCode(b); }); return btoa(bin); };
const wrap76 = b => b.replace(/.{1,76}/g, '$&\r\n');
function buildEml(c, o, to, subject) {
  const bnd = '=_yoga' + uid() + uid();
  return [
    'X-Unsent: 1', `To: ${to || ''}`, `Subject: =?UTF-8?B?${utf8b64(subject)}?=`, 'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${bnd}"`, '',
    `--${bnd}`, 'Content-Type: text/plain; charset="utf-8"', 'Content-Transfer-Encoding: base64', '', wrap76(utf8b64(overviewText(c) + '\nDie ausführlichen Stundenpläne findest du im Anhang (Datei im Browser öffnen, bei Bedarf als PDF drucken).\n')),
    `--${bnd}`, 'Content-Type: text/html; charset="utf-8"; name="Programmplan.html"', 'Content-Transfer-Encoding: base64', 'Content-Disposition: attachment; filename="Programmplan.html"', '', wrap76(utf8b64(standaloneHtml(c, o))),
    `--${bnd}--`, ''
  ].join('\r\n');
}





// Seitenweise Darstellung: jedes Blatt (section.paper) wird in feste DIN-A4-Seiten (hoch bzw. quer) aufgeteilt.
// Eigenständig geschrieben (ohne Abhängigkeiten), damit die Funktion auch in der HTML-Datei / im E-Mail-Anhang läuft.
function paginateDoc(root) {
  var MM = 96 / 25.4;
  Array.prototype.slice.call(root.querySelectorAll('section.paper')).forEach(function (sec) {
    if (sec.classList.contains('pg')) return;
    var land = sec.classList.contains('land'), H = land ? 210 : 297, top = land ? 12 : 15, avail = (H - top - 17) * MM;
    var wm = sec.querySelector('.wm'), kurs = sec.querySelector('.kurs'), h2 = sec.querySelector('h2'), foot = sec.querySelector('.foot');
    var kids = Array.prototype.slice.call(sec.children).filter(function (n) { return !n.classList.contains('wm') && !n.classList.contains('foot'); });
    var pages = [], cur;
    function newPage(cont) {
      var pg = document.createElement('section'); pg.className = sec.className + ' pg';
      if (wm) pg.appendChild(wm.cloneNode(true));
      var c = document.createElement('div'); c.className = 'pgc'; pg.appendChild(c);
      sec.parentNode.insertBefore(pg, sec); pages.push(pg);
      if (cont && kurs && h2) {
        var k = document.createElement('div'); k.className = 'kurs cont';
        var tmp = document.createElement('div'); tmp.innerHTML = h2.innerHTML.replace(/<br\s*\/?>/gi, ' – ');
        k.textContent = kurs.textContent + ' · ' + tmp.textContent.replace(/\s+/g, ' ').trim() + ' (Fortsetzung)'; c.appendChild(k);
      }
      return c;
    }
    function hasContent(c) { return Array.prototype.some.call(c.children, function (n) { return !n.classList.contains('cont'); }); }
    function over() { var last = cur.lastElementChild, mb = last ? (parseFloat(getComputedStyle(last).marginBottom) || 0) : 0; return cur.offsetHeight + mb > avail; }
    function next() {
      var last = cur.lastElementChild, carry = null;
      if (last && last.tagName === 'H3' && cur.children.length > 1) { carry = last; cur.removeChild(last); }
      cur = newPage(true); if (carry) cur.appendChild(carry);
    }
    cur = newPage(false);
    kids.forEach(function (el) {
      cur.appendChild(el);
      if (!over()) return;
      if (el.tagName === 'TABLE' && el.tBodies.length && el.tBodies[0].rows.length > 1) {
        var tb = el.tBodies[0], rows = Array.prototype.slice.call(tb.rows);
        rows.forEach(function (r) { tb.removeChild(r); });
        rows.forEach(function (r) {
          tb.appendChild(r);
          if (!over()) return;
          tb.removeChild(r);
          var empty = tb.rows.length === 0;
          var tbl;
          if (empty && hasContent(cur) && cur.children.length > 1) { cur.removeChild(el); tbl = el; }
          else { tbl = el.cloneNode(false); if (el.tHead) tbl.appendChild(el.tHead.cloneNode(true)); tbl.appendChild(document.createElement('tbody')); }
          next(); cur.appendChild(tbl); el = tbl; tb = tbl.tBodies[0]; tb.appendChild(r);
        });
      } else {
        cur.removeChild(el);
        if (hasContent(cur)) { next(); }
        cur.appendChild(el);
      }
    });
    var n = pages.length;
    pages.forEach(function (pg, i) {
      var f = document.createElement('div'); f.className = 'foot';
      f.textContent = (foot ? foot.textContent + ' · ' : '') + 'Seite ' + (i + 1) + ' von ' + n; pg.appendChild(f);
    });
    sec.parentNode.removeChild(sec);
  });
}

// ---------- Zusatzblätter: Alternativenblatt, Blatt Übungsauswahl, Detailbeschreibungen ----------
const tileFig = (e, cls) => `<span class="ex${cls ? ' ' + cls : ''}"><span class="fg">${figureSVG(e.pose)}${e.peak ? '<b class="pk">★</b>' : ''}</span><span>${esc(e.n)}</span>${e.sa ? `<small class="sa">${esc(e.sa)}</small>` : ''}</span>`;
const sessionExList = s => { const seen = new Set(), out = []; exRows(s).forEach(r => r.items.forEach(it => { const e = exById(it.id); if (e && !seen.has(e.id)) { seen.add(e.id); out.push({ e, it, r }); } })); return out; };
const lvText = e => ['', 'Anfänger', 'Mittel', 'Fortgeschritten'][e.lv] || '';
const katList = (e, k) => katLabels(e, k).join(', ');
const paperHead = (c, title, sub) => `${LOTUS.replace('class="lotus"', 'class="lotus wm"')}<div class="kurs">${esc(c.name)}</div><h2>${title}</h2>${sub ? `<p class="sub">${sub}</p>` : ''}`;

// Alternativenblatt: leichtere Alternativen zu den Übungen einer Stunde
function renderAltBlatt(c, s, i) {
  const items = sessionExList(s).filter(x => altE(x.e));
  const rows = items.map(({ e, r }) => { const a = altE(e); return `<tr><td class="lab">${esc(r.name)}</td><td>${tileFig(e)}</td><td class="arrow">→</td><td>${tileFig(a, 'alt2')}${e.ev ? `<div class="pr">${esc(e.ev)}</div>` : ''}</td></tr>`; }).join('');
  return `<section class="paper sess alts">${paperHead(c, esc(sessionTitle(c, s, i)) + '<br><span style="font-size:15px">Alternativenblatt – leichtere Alternativen</span>')}
${items.length ? `<table class="flowt"><thead><tr><th>Block</th><th>Übung der Stunde</th><th></th><th>Leichtere Alternative</th></tr></thead><tbody>${rows}</tbody></table>` : '<p class="hint">Zu den Übungen dieser Stunde sind keine leichteren Alternativen hinterlegt.</p>'}${pageFoot(c)}</section>`;
}

// Blatt Übungsauswahl: Kacheln mit Beschreibungen wie im Katalog
function uebCard(e, it) {
  const kraft = e.c === 'kraft' && e.how;
  const meta = [lvText(e) + (e.s === 1 && e.lv <= 2 ? ' · Senioren' : ''), it && it.min ? fmtMin(it.min) + ' Min.' : e.m ? fmtMin(e.m) + ' Min.' : ''].filter(Boolean).join(' · ');
  const st = (e.st || []).map(k => STILE[k]).filter(Boolean).join(', '), rg = katList(e, 'reg');
  const geb = (e.x || []).map(g => GEBRECHEN[g]).join(', ');
  return `<div class="ucard"><div class="utile"><span class="fg">${figureSVG(e.pose)}${e.peak ? '<b class="pk">★</b>' : ''}</span></div><div class="uinfo"><div class="un"><b>${esc(e.n)}</b>${e.sa ? ` <i class="sa">${esc(e.sa)}</i>` : ''}</div>
<div class="um">${esc(meta)}</div>${st ? `<div class="um"><b>Yogastil:</b> ${esc(st)}</div>` : ''}${rg ? `<div class="um"><b>Körperregion:</b> ${esc(rg)}</div>` : ''}
${e.d ? `<p>${esc(e.d)}</p>` : ''}${kraft ? `<p><b>Ausführung:</b> ${esc(e.how)}${e.ev ? `<br><b>Leichtere Variante / Hinweis:</b> ${esc(e.ev)}` : ''}</p>` : (e.w ? `<p class="dwarn">⚠ ${esc(e.w)}</p>` : '')}${geb ? `<div class="um dwarn">Vorsicht bei: ${esc(geb)}</div>` : ''}</div></div>`;
}
function renderUebBlatt(c, s, i) {
  const cards = sessionExList(s).map(({ e, it }) => uebCard(e, it)).join('');
  return `<section class="paper sess ueb">${paperHead(c, esc(sessionTitle(c, s, i)) + '<br><span style="font-size:15px">Übungsauswahl der Stunde</span>')}
${cards || '<p class="hint">Keine Übungen.</p>'}${pageFoot(c)}</section>`;
}

// Detailbeschreibungen: Technik, Atmung, Aufmerksamkeit, Wirkung, Muskeln, Varianten, Worauf achten, Für wen nicht geeignet
// Es werden nur Angaben ausgegeben, die im Katalog (Skript, Kursunterlagen) hinterlegt sind – nichts wird ergänzt.
function detailCard(e) {
  const kraft = e.c === 'kraft' && e.how, ea = altE(e), ha = altH(e);
  const rows = [];
  const add = (lab, txt) => { if (txt) rows.push(`<tr><td class="lab">${lab}</td><td>${txt}</td></tr>`); };
  add('Technik', e.d ? esc(e.d) : kraft ? esc(e.how) : '');
  if (e.d && kraft) add('Ausführung (Kursplan)', esc(e.how) + (e.reps ? ' – ' + esc(e.reps) : ''));
  add('Atmung', esc(katList(e, 'atm')));
  add('Aufmerksamkeit', esc(katList(e, 'auf')));
  const wk = [['Körperregion', katList(e, 'reg')], ['Wirkung', katList(e, 'wirk')], ['Energetik', katList(e, 'en')], ['Chakra', katList(e, 'chakra')], ['Haltung', katList(e, 'pos')], ['Wirbelsäule', katList(e, 'dir')]].filter(x => x[1]).map(x => `<b>${x[0]}:</b> ${esc(x[1])}`).join('<br>');
  add('Wirkung', wk + (kraft && e.w ? (wk ? '<br>' : '') + esc(e.w) : ''));
  add('Muskeln', esc(katList(e, 'mus')));
  add('Unterstützung', esc(katList(e, 'sup')));
  add('Material', esc(katList(e, 'mat')));
  add('Varianten', [ea ? `<b>Leichter:</b> ${esc(ea.n)}` : '', ha ? `<b>Schwerer:</b> ${esc(ha.n)}` : '', kraft && e.ev ? esc(e.ev) : ''].filter(Boolean).join('<br>'));
  add('Worauf achten', !kraft && e.w ? esc(e.w) : '');
  const lvNot = e.lv >= 3 ? 'Anfänger und Mittelstufe' : e.lv === 2 ? 'Anfänger' : '';
  const nicht = [(e.x || []).length ? 'Vorsicht bei: ' + esc((e.x || []).map(g => GEBRECHEN[g]).join(', ')) : '', lvNot ? 'Laut Katalog nicht für: ' + lvNot : '', e.s === 0 ? 'Nicht als seniorengeeignet eingestuft' : ''].filter(Boolean).join('<br>');
  add('Für wen nicht', nicht);
  const miss = [];
  return `<div class="dcard"><div class="dh"><span class="fg">${figureSVG(e.pose)}${e.peak ? '<b class="pk">★</b>' : ''}</span><div><b>${esc(e.n)}</b>${e.sa ? ` <i class="sa">${esc(e.sa)}</i>` : ''}<div class="um">${esc([lvText(e), (e.st || []).map(k => STILE[k]).filter(Boolean).join(', ')].filter(Boolean).join(' · '))}</div></div></div>
<table>${rows.join('')}</table><div class="pr">${e.src ? 'Quelle: ' + esc(e.src) + '. ' : ''}${miss.length ? esc(miss.join(', ')) + ' sind im Katalog für diese Übung noch nicht hinterlegt.' : ''}</div></div>`;
}
function renderDetail(c, sel) {
  const seen = new Set(), list = [];
  sel.forEach(i => { const s = c.sessions[i]; if (s) sessionExList(s).forEach(({ e }) => { if (!seen.has(e.id)) { seen.add(e.id); list.push(e); } }); });
  const one = sel.length === 1 ? c.sessions[sel[0]] : null;
  return `<section class="paper detail">${paperHead(c, 'Detailbeschreibungen der Übungen', one ? esc(sessionTitle(c, one, sel[0])) : `${list.length} Übungen im Programm, in der Reihenfolge ihres ersten Auftretens`)}
${list.map(detailCard).join('') || '<p class="hint">Keine Übungen.</p>'}${pageFoot(c)}</section>`;
}

// ---------- Materialliste, Spickzettel, Analyse-Blätter ----------
const MAT_SHORT = { matte: 'Yogamatte', decke: 'Decke', kissen: 'Kissen / Bolster', block: 'Yogablock', gurt: 'Yogagurt', stuhl: 'Stuhl', wand: 'Wand' };
function matNeeds(s) { const m = {}; sessionExList(s).forEach(({ e }) => ((e.kat && e.kat.mat) || []).filter(k => k !== 'matte').forEach(k => { (m[k] = m[k] || []).push(e.n); })); return m; }
const matLine = s => { const m = matNeeds(s); return 'Yogamatte' + Object.keys(MAT_SHORT).filter(k => m[k]).map(k => `, ${MAT_SHORT[k]} (${m[k].slice(0, 3).join(', ')}${m[k].length > 3 ? ' …' : ''})`).join(''); };

function renderMaterial(c, sel) {
  const sess = sel.map(i => ({ s: c.sessions[i], i })).filter(x => x.s), one = sess.length === 1 ? sess[0] : null;
  const rows = Object.keys(MAT_SHORT).map(k => {
    const used = sess.filter(({ s }) => k === 'matte' || matNeeds(s)[k]); if (!used.length) return '';
    const ex = k === 'matte' ? 'für alle Übungen' : [...new Set(used.flatMap(({ s }) => matNeeds(s)[k]))].join(', ');
    return `<tr><td class="lab">${esc(MAT_SHORT[k])}</td><td class="min">${k === 'matte' ? 'alle' : used.map(x => x.i + 1).join(', ')}</td><td>${esc(ex)}</td></tr>`;
  }).join('');
  return `<section class="paper matl">${paperHead(c, 'Materialliste', one ? esc(sessionTitle(c, one.s, one.i)) : esc(c.name) + ' – ' + sess.length + ' Stunden')}
<table><thead><tr><th>Material</th><th>Stunde(n)</th><th>Benötigt für</th></tr></thead><tbody>${rows}</tbody></table>
<p class="hint">Die Hilfsmittel sind eine übliche Empfehlung zu den gewählten Übungen und nicht zwingend erforderlich.</p>${pageFoot(c)}</section>`;
}

function renderSpick(c, s, i) {
  let t = 0;
  const rows = order(s).filter(k => bon(s, k)).map(k => {
    const ty = bty(s, k), m = ty === 'ex' ? sumMin(s.blk[k] || []) : blockMin(s, k), a = t; t += m;
    let inh;
    if (ty === 'ex') inh = (s.blk[k] || []).map(it => { const e = exById(it.id); if (!e) return ''; const ea = effE(it) ? altE(e) : null; return esc(e.n) + (e.peak ? ' ★' : '') + (ea ? ` <span class="pr">(leichter: ${esc(ea.n)})</span>` : ''); }).filter(Boolean).join(' · ') || '–';
    else if (ty === 'mantra') { const mm = s.mantra && manById(s.mantra.id); inh = mm ? esc(mm.n + ': ' + mm.text.join(' – ')) : '–'; }
    else if (ty === 'atem') inh = esc([(exById(s.atem.a) || {}).n, s.atem.w && (exById(s.atem.w) || {}).n].filter(Boolean).join(' + '));
    else inh = k === 'einl' ? esc(s.motto.title + ' – ' + (s.tx.focus || s.motto.focus)) : k === 'shava' ? '„' + esc(s.tx.kern || s.motto.kern) + '“' : k === 'schluss' ? 'Nachspüren' : 'Text';
    return `<tr><td class="min">${fmtMin(a)}–${fmtMin(t)}</td><td class="lab">${esc(bn(s, k))}<br><span class="pr">${fmtMin(m)} Min.</span></td><td>${inh}</td></tr>`;
  }).join('');
  const geb = (c.gebrechen || []).map(g => GEBRECHEN[g]).join(', ');
  return `<section class="paper sess spick">${paperHead(c, esc(sessionTitle(c, s, i)) + '<br><span style="font-size:15px">Spickzettel – ' + fmtMin(sessionTotal(s)) + ' Minuten</span>')}
<p><b>Fokus:</b> ${esc(s.tx.focus || s.motto.focus)}</p><div class="box"><b>Kernsatz:</b> „${esc(s.tx.kern || s.motto.kern)}“</div>
<table><thead><tr><th>Zeit (Min.)</th><th>Block</th><th>Inhalt</th></tr></thead><tbody>${rows}</tbody></table>
<p style="margin-top:8px"><b>Material:</b> ${esc(matLine(s))}</p>${geb ? `<p class="pr">Berücksichtigt: ${esc(geb)}</p>` : ''}${pageFoot(c)}</section>`;
}

const renderAnaSession = (c, s, i) => `<section class="paper sess ana">${paperHead(c, esc(sessionTitle(c, s, i)) + '<br><span style="font-size:15px">Einzelstundenanalyse</span>')}${viewSessionAnalysis(c, true, s)}${pageFoot(c)}</section>`;
const renderAnaProgram = c => `<section class="paper ana">${paperHead(c, 'Programmanalyse', esc(courseSub(c)))}${viewProgramAnalysis(c, true)}${pageFoot(c)}</section>`;

// Hands-on Blatt: welche Übungen der Stunde Adjustment, Support oder Assistance erlauben (Einordnung aus dem Katalog, abgeleitet)
function renderHands(c, s, i) {
  const by = { support: [], adjust: [], assist: [], keine: [] };
  sessionExList(s).forEach(x => ((x.e.kat && x.e.kat.sup) || ['keine']).forEach(k => { if (by[k]) by[k].push(x); }));
  const note = e => [(e.c === 'kraft' && e.how) ? '' : (e.w ? '⚠ ' + esc(e.w) : ''), (e.x || []).length ? 'Vorsicht bei: ' + esc((e.x || []).map(g => GEBRECHEN[g]).join(', ')) : ''].filter(Boolean).join('<br>');
  const sec = (k, title) => !by[k].length ? '' : `<h3>${title}</h3><p class="pr">${esc(KAT.sup[k])}</p><table class="flowt"><thead><tr><th>Block</th><th>Übung</th><th>Hinweise</th></tr></thead><tbody>${by[k].map(({ e, r }) => `<tr><td class="lab">${esc(r.name)}</td><td>${tileFig(e)}</td><td>${note(e)}</td></tr>`).join('')}</tbody></table>`;
  return `<section class="paper sess hands">${paperHead(c, esc(sessionTitle(c, s, i)) + '<br><span style="font-size:15px">Hands-on Blatt – Unterstützung und Assistance</span>')}
<div class="box"><b>Hinweis:</b> Berührungen nur nach vorheriger Ansage und mit Einverständnis der Teilnehmenden. Die Einordnung der Übungen ist eine grobe Orientierung aus dem Katalog (abgeleitet).</div>
${sec('support', 'Hands-on Support')}${sec('adjust', 'Hands-on Adjustment')}${sec('assist', 'Hands-on Assistance')}
${by.keine.length ? `<h3>Keine Berührung nötig</h3><p>${esc(by.keine.map(x => x.e.n).join(', '))}</p>` : ''}${pageFoot(c)}</section>`;
}

// Gebrechenliste: nach Einschränkung (welche Übungen betroffen sind) und nach Übung (für wen nicht geeignet)
function renderGeb(c, sel) {
  const sess = sel.map(i => ({ s: c.sessions[i], i })).filter(x => x.s), one = sess.length === 1 ? sess[0] : null;
  const prog = c.gebrechen || [], byG = {}, ex = [], seen = {};
  sess.forEach(({ s, i }) => sessionExList(s).forEach(({ e }) => {
    if (!seen[e.id]) { seen[e.id] = { e, st: [] }; ex.push(seen[e.id]); }
    if (!seen[e.id].st.includes(i + 1)) seen[e.id].st.push(i + 1);
    (e.x || []).forEach(g => { const b = byG[g] = byG[g] || {}; (b[e.id] = b[e.id] || { e, st: [] }).st.includes(i + 1) || b[e.id].st.push(i + 1); });
  }));
  const stTxt = st => one ? '' : ` <span class="pr">(Std. ${st.join(', ')})</span>`;
  const rowsA = Object.keys(GEBRECHEN).filter(g => byG[g]).map(g => `<tr><td class="lab">${esc(GEBRECHEN[g])}${prog.includes(g) ? '<br><span class="pr">im Programm berücksichtigt</span>' : ''}</td><td>${Object.values(byG[g]).map(x => esc(x.e.n) + stTxt(x.st)).join('; ')}</td></tr>`).join('');
  const lvNot = e => e.lv >= 3 ? 'Anfänger und Mittelstufe' : e.lv === 2 ? 'Anfänger' : '';
  const rowsB = ex.map(({ e, st }) => { const g = (e.x || []).map(k => GEBRECHEN[k]).join(', '), n = [lvNot(e) ? 'Stufe: nicht für ' + lvNot(e) : '', e.s === 0 ? 'nicht als seniorengeeignet eingestuft' : ''].filter(Boolean).join('; '); return `<tr><td class="lab">${esc(e.n)}${e.sa ? `<br><span class="sa">${esc(e.sa)}</span>` : ''}${stTxt(st)}</td><td>${esc(g) || '–'}</td><td>${esc(n) || '–'}</td></tr>`; }).join('');
  return `<section class="paper gebl">${paperHead(c, 'Gebrechenliste', (one ? esc(sessionTitle(c, one.s, one.i)) : esc(c.name) + ' – ' + sess.length + ' Stunden') + '<br>Übungen und für wen sie nicht geeignet sind')}
<h3>Nach Einschränkung</h3>${rowsA ? `<table class="flowt"><thead><tr><th>Einschränkung</th><th>Betroffene Übungen</th></tr></thead><tbody>${rowsA}</tbody></table>` : '<p class="hint">Keine der Übungen ist mit einer Einschränkung gekennzeichnet.</p>'}
<h3>Nach Übung</h3><table class="flowt"><thead><tr><th>Übung</th><th>Vorsicht bei</th><th>Nicht geeignet für</th></tr></thead><tbody>${rowsB}</tbody></table>
<p class="hint">Die Angaben stammen aus dem Übungskatalog (Skript und Kursunterlagen). „Vorsicht bei“ bedeutet: bei dieser Einschränkung die Übung weglassen oder anpassen.</p>${pageFoot(c)}</section>`;
}

// Übungskatalog gesamt: alle Übungen nach Kategorie, mit Beschreibung wie im Katalog
const docSelIdx = (c, o) => o.sel === 'all' || o.sel === undefined ? c.sessions.map((s, i) => i) : Array.isArray(o.sel) ? o.sel.filter(i => c.sessions[i]) : [+o.sel];
function renderKatalog(c) {
  const all = exAll(), parts = Object.keys(CATS).map(k => { const l = all.filter(e => e.c === k); return l.length ? `<h3>${esc(CATS[k])} (${l.length})</h3>` + l.map(e => uebCard(e, null)).join('') : ''; }).join('');
  return `<section class="paper katl">${paperHead(c, 'Übungskatalog', `${all.length} Übungen – nach Kategorie, mit Stufe, Stil, Körperregion und Beschreibung`)}${parts}${pageFoot(c)}</section>`;
}

// ---------- Direkt-PDF (ohne Druckdialog): jede A4-Seite wird als Bild in ein PDF gelegt ----------
async function docToPdf(root) {
  const pgs = Array.from(root.querySelectorAll('section.paper.pg'));
  if (!pgs.length) throw new Error('keine Seiten vorhanden');
  const pages = [];
  for (const pg of pgs) {
    const land = pg.classList.contains('land'), W = land ? 1123 : 794, H = land ? 794 : 1123;
    const cl = pg.cloneNode(true); cl.style.cssText = 'margin:0;box-shadow:none;border-radius:0;width:' + W + 'px;height:' + H + 'px';
    const wrap = document.createElement('div'); wrap.className = 'doc'; wrap.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml'); wrap.appendChild(cl);
    const css = document.createElement('style'); css.textContent = DOC_CSS; wrap.insertBefore(css, cl);
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '"><foreignObject x="0" y="0" width="' + W + '" height="' + H + '">' + new XMLSerializer().serializeToString(wrap) + '</foreignObject></svg>';
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error('Seite konnte nicht gerendert werden')); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); });
    const cv = document.createElement('canvas'); cv.width = W * 2; cv.height = H * 2;
    const g = cv.getContext('2d'); g.fillStyle = '#fffdf9'; g.fillRect(0, 0, cv.width, cv.height); g.drawImage(img, 0, 0, cv.width, cv.height);
    const b64 = cv.toDataURL('image/jpeg', 0.92).split(',')[1], bin = atob(b64), data = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) data[i] = bin.charCodeAt(i);
    pages.push({ data, pw: cv.width, ph: cv.height, w: land ? 841.89 : 595.28, h: land ? 595.28 : 841.89 });
  }
  const chunks = [], offs = []; let len = 0;
  const put = x => { const u = typeof x === 'string' ? Uint8Array.from(x, ch => ch.charCodeAt(0) & 255) : x; chunks.push(u); len += u.length; };
  const obj = (n, body) => { offs[n] = len; put(n + ' 0 obj\n' + body + '\nendobj\n'); };
  put('%PDF-1.4\n');
  obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
  obj(2, '<< /Type /Pages /Count ' + pages.length + ' /Kids [' + pages.map((p, i) => (3 + i * 3) + ' 0 R').join(' ') + '] >>');
  pages.forEach((p, i) => {
    const n = 3 + i * 3, cs = 'q ' + p.w + ' 0 0 ' + p.h + ' 0 0 cm /Im0 Do Q';
    obj(n, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + p.w + ' ' + p.h + '] /Resources << /XObject << /Im0 ' + (n + 2) + ' 0 R >> >> /Contents ' + (n + 1) + ' 0 R >>');
    obj(n + 1, '<< /Length ' + cs.length + ' >>\nstream\n' + cs + '\nendstream');
    offs[n + 2] = len; put((n + 2) + ' 0 obj\n<< /Type /XObject /Subtype /Image /Width ' + p.pw + ' /Height ' + p.ph + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + p.data.length + ' >>\nstream\n'); put(p.data); put('\nendstream\nendobj\n');
  });
  const N = 3 + pages.length * 3, xr = len;
  put('xref\n0 ' + N + '\n0000000000 65535 f \n' + offs.slice(1, N).map(o => String(o).padStart(10, '0') + ' 00000 n \n').join(''));
  put('trailer\n<< /Size ' + N + ' /Root 1 0 R >>\nstartxref\n' + xr + '\n%%EOF');
  const out = new Uint8Array(len); let p = 0; chunks.forEach(u => { out.set(u, p); p += u.length; });
  return out;
}
