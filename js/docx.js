/* Word-Export (.docx), selbst erzeugt ohne Bibliothek.
   Grundlage ist dieselbe HTML-Ausgabe wie für die A4-Vorschau (buildDoc); sie wird in Word-XML umgesetzt:
   Überschriften, Absätze, Tabellen (Spaltenbreiten nach Inhalt), Strichmännchen als eingebettete PNG-Bilder (Kacheln). */
const dxEsc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
const DX = { pw: 11906, ph: 16838, mar: 1134 }; // A4 in Twips (1/20 pt), Rand 2 cm
let dxImgs = null, dxImgFiles = [], dxId = 0;

// ---------- ZIP (ohne Kompression) ----------
let dxCrcT = null;
function dxCrc(d) {
  if (!dxCrcT) { dxCrcT = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; dxCrcT[n] = c >>> 0; } }
  let c = 0xFFFFFFFF; for (let i = 0; i < d.length; i++) c = dxCrcT[(c ^ d[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0;
}
function dxZip(files) {
  const enc = new TextEncoder(), parts = [], central = []; let off = 0;
  files.forEach(f => {
    const name = enc.encode(f.name), data = f.data, crc = dxCrc(data), len = data.length;
    const lh = new Uint8Array(30 + name.length), lv = new DataView(lh.buffer);
    lv.setUint32(0, 0x04034b50, true); lv.setUint16(4, 20, true); lv.setUint16(6, 0x0800, true); lv.setUint16(8, 0, true); lv.setUint16(10, 0, true); lv.setUint16(12, 0x21, true);
    lv.setUint32(14, crc, true); lv.setUint32(18, len, true); lv.setUint32(22, len, true); lv.setUint16(26, name.length, true); lv.setUint16(28, 0, true); lh.set(name, 30);
    const ch = new Uint8Array(46 + name.length), cv = new DataView(ch.buffer);
    cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true); cv.setUint16(8, 0x0800, true); cv.setUint16(10, 0, true); cv.setUint16(12, 0, true); cv.setUint16(14, 0x21, true);
    cv.setUint32(16, crc, true); cv.setUint32(20, len, true); cv.setUint32(24, len, true); cv.setUint16(28, name.length, true); cv.setUint32(42, off, true); ch.set(name, 46);
    parts.push(lh, data); central.push(ch); off += lh.length + len;
  });
  const cdSize = central.reduce((a, b) => a + b.length, 0), end = new Uint8Array(22), ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true); ev.setUint16(8, files.length, true); ev.setUint16(10, files.length, true); ev.setUint32(12, cdSize, true); ev.setUint32(16, off, true);
  const all = parts.concat(central, [end]), out = new Uint8Array(all.reduce((a, b) => a + b.length, 0)); let p = 0; all.forEach(b => { out.set(b, p); p += b.length; });
  return out;
}

// ---------- Bilder: SVG -> PNG ----------
function dxRaster(s) {
  return new Promise(res => {
    let x = new XMLSerializer().serializeToString(s).replace(/currentColor/g, '#3d4a42').replace('<svg', '<svg width="220" height="220"');
    if (!/xmlns=/.test(x)) x = x.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    const img = new Image();
    img.onload = () => { const cv = document.createElement('canvas'); cv.width = cv.height = 220; cv.getContext('2d').drawImage(img, 0, 0, 220, 220); cv.toBlob(b => b ? b.arrayBuffer().then(ab => res(new Uint8Array(ab))) : res(null), 'image/png'); };
    img.onerror = () => res(null);
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(x);
  });
}
async function dxPrepare(doc) {
  dxImgs = new Map(); dxImgFiles = []; dxId = 0; const cache = new Map(); let n = 0;
  const svgs = Array.from(doc.querySelectorAll('svg')).filter(s => !s.closest('.wm') && !s.classList.contains('lotus') && !s.classList.contains('wm'));
  for (const s of svgs) {
    const key = s.outerHTML; let e = cache.get(key);
    if (!e) { const png = await dxRaster(s); if (!png) continue; n++; e = { rid: 'rIdImg' + n, name: 'media/fig' + n + '.png', png }; cache.set(key, e); dxImgFiles.push(e); }
    dxImgs.set(s, e);
  }
}
function dxImgRun(svg, px) {
  const im = dxImgs && dxImgs.get(svg); if (!im) return '';
  const e = Math.round(px * 9525), id = ++dxId;
  return `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${e}" cy="${e}"/><wp:docPr id="${id}" name="Figur ${id}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="${id}" name="fig${id}.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${im.rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${e}" cy="${e}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
}
const dxPx = svg => svg.closest('.big') ? 82 : svg.closest('.ex.alt') ? 38 : svg.closest('.ex') ? 52 : svg.closest('.utile') ? 54 : svg.closest('.dh') ? 46 : 40;

// ---------- Absätze, Läufe ----------
const DX_SEP = '\u0001';
function dxRun(t, f) {
  f = f || {};
  const pr = (f.b ? '<w:b/>' : '') + (f.i ? '<w:i/>' : '') + (f.color ? `<w:color w:val="${f.color}"/>` : '') + (f.sz ? `<w:sz w:val="${f.sz}"/>` : '');
  return `<w:r>${pr ? '<w:rPr>' + pr + '</w:rPr>' : ''}<w:t xml:space="preserve">${dxEsc(t)}</w:t></w:r>`;
}
function dxInline(node, fmt, out) {
  const kids = Array.from(node.childNodes);
  kids.forEach((n, ix) => {
    if (n.nodeType === 3) { const t = n.textContent.replace(/\s+/g, ' '); if (t.trim() || t === ' ') out.push(dxRun(t, fmt)); return; }
    if (n.nodeType !== 1) return;
    const tag = n.tagName.toLowerCase(), cl = n.classList;
    if (tag === 'svg') { const r = dxImgRun(n, dxPx(n)); if (r) out.push(r); return; }
    if (tag === 'script' || tag === 'style' || tag === 'button' || tag === 'input') return;
    if (tag === 'br') { out.push('<w:r><w:br/></w:r>'); return; }
    const f = Object.assign({}, fmt);
    if (tag === 'b' || tag === 'strong') f.b = true;
    if (tag === 'i' || tag === 'em') f.i = true;
    if (cl.contains('sa')) { f.i = true; f.color = '7B8F80'; f.sz = 17; }
    if (cl.contains('pr') || cl.contains('muted')) f.color = '7A7468';
    if (cl.contains('lv')) { f.color = 'C9826B'; f.b = true; }
    if (tag === 'small') f.sz = f.sz || 17;
    if (cl.contains('pk') || cl.contains('star')) f.color = 'C9962B';
    dxInline(n, f, out);
    if (ix < kids.length - 1) out.push(dxRun(' ', fmt));
  });
}
const dxHasText = runs => runs.some(r => r !== DX_SEP && /<w:t[^>]*>[^<]*\S[^<]*<\/w:t>|<w:br\/>|<w:drawing>/.test(r));
function dxRuns(arr) {
  while (arr.length && /<w:t[^>]*> <\/w:t>/.test(arr[arr.length - 1])) arr.pop();
  return arr.join('');
}
function dxPara(runsArr, style, o) {
  o = o || {};
  const ppr = (style ? `<w:pStyle w:val="${style}"/>` : '') + (o.keep ? '<w:keepNext/>' : '') + (o.box ? '<w:pBdr><w:left w:val="single" w:sz="24" w:space="6" w:color="C9826B"/></w:pBdr><w:shd w:val="clear" w:color="auto" w:fill="FBF5EF"/>' : '') + (o.jc ? `<w:jc w:val="${o.jc}"/>` : '');
  return `<w:p>${ppr ? '<w:pPr>' + ppr + '</w:pPr>' : ''}${dxRuns(runsArr.slice())}</w:p>`;
}
const DX_BLOCKTAGS = 'p,div,table,h1,h2,h3,h4,ul,ol,section,li';
const dxTc = (w, inner, shade, span) => `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${span > 1 ? `<w:gridSpan w:val="${span}"/>` : ''}${shade ? `<w:shd w:val="clear" w:color="auto" w:fill="${shade}"/>` : ''}</w:tcPr>${inner}</w:tc>`;
const dxEndP = ps => { if (!ps.length || ps[ps.length - 1].startsWith('<w:tbl>')) ps.push('<w:p/>'); return ps.join(''); };
const dxPlainTbl = (widths, rows) => `<w:tbl><w:tblPr><w:tblW w:w="${widths.reduce((a, b) => a + b, 0)}" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="30" w:type="dxa"/><w:left w:w="60" w:type="dxa"/><w:bottom w:w="30" w:type="dxa"/><w:right w:w="60" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${widths.map(w => `<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid>${rows.map(r => `<w:tr><w:trPr><w:cantSplit/></w:trPr>${r}</w:tr>`).join('')}</w:tbl>`;

// Kacheln (Strichmännchen mit Namen) als unsichtbare Tabelle, mehrere je Zeile
function dxTiles(els, o) {
  const list = []; els.forEach(el => { if (el.classList.contains('exg')) el.querySelectorAll('.ex').forEach(x => list.push(x)); else list.push(el); });
  const big = !!(list[0] && list[0].closest('.big')), tw = big ? 2100 : 1450, width = o.cw || o.pw || (DX.pw - 2 * DX.mar), per = Math.max(1, Math.floor(width / tw));
  const cells = list.map(el => {
    const alt = el.classList.contains('alt'), svg = el.querySelector('svg'), fg = el.querySelector('.fg'), star = !!(fg && fg.querySelector('.pk'));
    const nameEl = Array.from(el.children).find(ch => ch.tagName === 'SPAN' && !ch.classList.contains('fg')), lv = el.querySelector('small.lv'), sa = el.querySelector('small.sa');
    const ps = [];
    if (svg) ps.push(dxPara([dxImgRun(svg, alt ? 36 : big ? 70 : 48)], null, { jc: 'center' }));
    if (lv) ps.push(dxPara([dxRun(lv.textContent.trim(), { color: 'C9826B', b: true, sz: 15 })], 'Tile', { jc: 'center' }));
    if (nameEl) ps.push(dxPara([dxRun(nameEl.textContent.trim() + (star ? ' ★' : ''), { sz: alt ? 15 : 17, b: !alt })], 'Tile', { jc: 'center' }));
    if (sa) ps.push(dxPara([dxRun(sa.textContent.trim(), { i: true, color: '7B8F80', sz: 14 })], 'Tile', { jc: 'center' }));
    return dxTc(tw, dxEndP(ps), alt ? 'F4F7F2' : null);
  });
  const rows = []; for (let i = 0; i < cells.length; i += per) { const r = cells.slice(i, i + per); while (r.length < Math.min(per, cells.length)) r.push(dxTc(tw, '<w:p/>')); rows.push(r.join('')); }
  return dxPlainTbl(Array.from({ length: Math.min(per, cells.length) }, () => tw), rows);
}

function dxBlocks(node, out, o) {
  o = o || {};
  let buf = [], tiles = [];
  const flush = (style) => { if (dxHasText(buf)) out.push(dxPara(buf, style, o)); buf = []; };
  const flushTiles = () => { if (tiles.length) { out.push(dxTiles(tiles, o)); out.push(dxPara([], 'Small')); tiles = []; } };
  Array.from(node.childNodes).forEach(n => {
    if (n.nodeType === 3) { const t = n.textContent.replace(/\s+/g, ' '); if (t.trim()) { flushTiles(); buf.push(dxRun(t, o.fmt)); } return; }
    if (n.nodeType !== 1) return;
    const tag = n.tagName.toLowerCase(), cl = n.classList;
    if (tag === 'script' || tag === 'style' || cl.contains('foot') || cl.contains('wm') || cl.contains('noprint')) return;
    if (cl.contains('ex') || cl.contains('exg')) { flush(); tiles.push(n); return; }
    flushTiles();
    if (cl.contains('ucard') || cl.contains('dh')) {
      flush(); const svg = n.querySelector('svg'), right = cl.contains('ucard') ? n.querySelector('.uinfo') : Array.from(n.children).find(ch => ch.tagName === 'DIV'), total = o.cw || o.pw || 9638, lw = 1250, ps = [];
      if (right) dxBlocks(right, ps, { cw: total - lw - 150, pw: o.pw });
      out.push(dxPlainTbl([lw, total - lw], [dxTc(lw, dxEndP([dxPara(svg ? [dxImgRun(svg, dxPx(svg))] : [], null, { jc: 'center' })]), 'E8EFE9') + dxTc(total - lw, dxEndP(ps))]));
      out.push(dxPara([], 'Small')); return;
    }
    if (tag === 'table') { flush(); out.push(dxTable(n, o)); out.push(dxPara([], 'Small')); return; }
    if (/^h[1-4]$/.test(tag)) { flush(); const r = []; dxInline(n, {}, r); out.push(dxPara(r, 'Heading' + Math.min(3, +tag[1]), { keep: true })); return; }
    if (tag === 'ul' || tag === 'ol') { flush(); Array.from(n.children).forEach((li, k) => { const r = [dxRun((tag === 'ol' ? (k + 1) + '. ' : '•  '), {})]; dxInline(li, {}, r); out.push(dxPara(r, 'ListP')); }); return; }
    if (tag === 'p' || ((tag === 'div' || tag === 'section' || tag === 'li') && !n.querySelector(DX_BLOCKTAGS))) {
      flush(); const r = []; dxInline(n, o.fmt || {}, r);
      const style = cl.contains('kurs') ? 'Kurs' : cl.contains('sub') ? 'Sub' : cl.contains('hint') ? 'Hint' : cl.contains('pr') ? 'Small' : cl.contains('dwarn') ? 'Warn' : null;
      if (dxHasText(r)) out.push(dxPara(r, style, Object.assign({}, o, { box: o.box || cl.contains('box') })));
      return;
    }
    if (tag === 'div' || tag === 'section' || tag === 'li') { flush(); dxBlocks(n, out, Object.assign({}, o, { box: o.box || cl.contains('box') })); return; }
    const r = []; dxInline({ childNodes: [n] }, Object.assign({}, o.fmt || {}), r); buf = buf.concat(r);
  });
  flushTiles(); flush();
}

// ---------- Tabellen mit Spaltenbreiten nach Inhalt ----------
function dxColW(rows, total, ncols) {
  const fixed = new Array(ncols).fill(0), len = new Array(ncols).fill(0), cnt = new Array(ncols).fill(0), tile = new Array(ncols).fill(false);
  rows.forEach(tr => { let j = 0; Array.from(tr.children).forEach(td => {
    const sp = +td.getAttribute('colspan') || 1;
    if (sp === 1 && j < ncols && td.tagName.toLowerCase() === 'td') {
      const cl = td.classList; if (cl.contains('min')) fixed[j] = Math.max(fixed[j], 1050); else if (cl.contains('lab')) fixed[j] = Math.max(fixed[j], 2300); else if (cl.contains('arrow')) fixed[j] = Math.max(fixed[j], 560);
      if (td.querySelector('.ex')) tile[j] = true; len[j] += Math.min(90, td.textContent.trim().length); cnt[j]++;
    }
    j += sp; }); });
  const weights = len.map((v, j) => tile[j] ? 160 : Math.max(8, cnt[j] ? v / cnt[j] : 10));
  const free = total - fixed.reduce((a, b) => a + b, 0), sumW = weights.reduce((a, b, j) => a + (fixed[j] ? 0 : b), 0);
  let res = weights.map((wt, j) => fixed[j] || Math.max(900, Math.floor(free * wt / (sumW || 1))));
  const s = res.reduce((a, b) => a + b, 0); return res.map(x => Math.floor(x * total / s));
}
function dxTable(t, o) {
  o = o || {};
  const rows = Array.from(t.querySelectorAll('tr')).filter(tr => tr.closest('table') === t && Array.from(tr.children).some(c => /^(td|th)$/i.test(c.tagName)));
  if (!rows.length) return '<w:p/>';
  const ncols = Math.max(1, ...rows.map(tr => Array.from(tr.children).reduce((a, c) => a + (+c.getAttribute('colspan') || 1), 0)));
  const total = o.cw || o.pw || (DX.pw - 2 * DX.mar), cw = dxColW(rows, total, ncols);
  const bd = `<w:tblBorders>${['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(s => `<w:${s} w:val="single" w:sz="4" w:space="0" w:color="CFD8D0"/>`).join('')}</w:tblBorders>`;
  const trs = rows.map(tr => {
    let j = 0;
    const tcs = Array.from(tr.children).filter(c => /^(td|th)$/i.test(c.tagName)).map(td => {
      const th = td.tagName.toLowerCase() === 'th', lab = td.classList.contains('lab'), span = +td.getAttribute('colspan') || 1, w = cw.slice(j, j + span).reduce((a, b) => a + b, 0); j += span;
      const ps = []; dxBlocks(td, ps, { fmt: th ? { b: true, color: '3F5A4B' } : (lab ? { b: true } : {}), cw: w - 200, pw: o.pw });
      return dxTc(w, dxEndP(ps), th ? 'E8EFE9' : lab ? 'F4F7F3' : null, span);
    });
    return `<w:tr><w:trPr><w:cantSplit/>${tr.closest('thead') ? '<w:tblHeader/>' : ''}</w:trPr>${tcs.join('')}</w:tr>`;
  }).join('');
  return `<w:tbl><w:tblPr><w:tblW w:w="${total}" w:type="dxa"/>${bd}<w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="40" w:type="dxa"/><w:left w:w="90" w:type="dxa"/><w:bottom w:w="40" w:type="dxa"/><w:right w:w="90" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${cw.map(w => `<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid>${trs}</w:tbl>`;
}
const dxSect = land => `<w:sectPr><w:pgSz w:w="${land ? DX.ph : DX.pw}" w:h="${land ? DX.pw : DX.ph}"${land ? ' w:orient="landscape"' : ''}/><w:pgMar w:top="${DX.mar}" w:right="${DX.mar}" w:bottom="${DX.mar}" w:left="${DX.mar}" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr>`;

const DX_STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Calibri" w:cs="Calibri"/><w:sz w:val="21"/><w:szCs w:val="21"/><w:lang w:val="de-DE"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="100" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="120" w:after="80"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:rFonts w:ascii="Georgia" w:hAnsi="Georgia"/><w:b/><w:color w:val="3F5A4B"/><w:sz w:val="46"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="80" w:after="100"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:rFonts w:ascii="Georgia" w:hAnsi="Georgia"/><w:b/><w:color w:val="3F5A4B"/><w:sz w:val="36"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="D7E1D9"/></w:pBdr><w:spacing w:before="260" w:after="80"/><w:outlineLvl w:val="2"/></w:pPr><w:rPr><w:rFonts w:ascii="Georgia" w:hAnsi="Georgia"/><w:b/><w:color w:val="3F5A4B"/><w:sz w:val="28"/></w:rPr></w:style>
<w:style w:type="paragraph" w:customStyle="1" w:styleId="Kurs"><w:name w:val="Kursname"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="20"/></w:pPr><w:rPr><w:caps/><w:color w:val="8A8376"/><w:sz w:val="17"/></w:rPr></w:style>
<w:style w:type="paragraph" w:customStyle="1" w:styleId="Sub"><w:name w:val="Untertitel"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="160"/></w:pPr><w:rPr><w:color w:val="7A7468"/></w:rPr></w:style>
<w:style w:type="paragraph" w:customStyle="1" w:styleId="Hint"><w:name w:val="Hinweis"/><w:basedOn w:val="Normal"/><w:rPr><w:i/><w:color w:val="7A7468"/><w:sz w:val="22"/></w:rPr></w:style>
<w:style w:type="paragraph" w:customStyle="1" w:styleId="Small"><w:name w:val="Klein"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="60"/></w:pPr><w:rPr><w:color w:val="7A7468"/><w:sz w:val="18"/></w:rPr></w:style>
<w:style w:type="paragraph" w:customStyle="1" w:styleId="Tile"><w:name w:val="Kachel"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:rPr><w:sz w:val="17"/></w:rPr></w:style>
<w:style w:type="paragraph" w:customStyle="1" w:styleId="Warn"><w:name w:val="Warnung"/><w:basedOn w:val="Normal"/><w:rPr><w:color w:val="A5543A"/></w:rPr></w:style>
<w:style w:type="paragraph" w:customStyle="1" w:styleId="ListP"><w:name w:val="Liste"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="40"/><w:ind w:left="360" w:hanging="260"/></w:pPr></w:style>
</w:styles>`;

async function dxBuild(html, c) {
  const doc = new DOMParser().parseFromString('<body>' + html + '</body>', 'text/html');
  await dxPrepare(doc);
  const sheets = Array.from(doc.querySelectorAll('section.paper')), body = [];
  if (!sheets.length) body.push(dxPara([dxRun('Nichts ausgewählt.')], 'Hint'));
  sheets.forEach((sh, i) => {
    const land = sh.classList.contains('land'), ps = [];
    dxBlocks(sh, ps, { pw: (land ? DX.ph : DX.pw) - 2 * DX.mar });
    if (i < sheets.length - 1) ps.push(`<w:p><w:pPr>${dxSect(land)}</w:pPr></w:p>`);
    body.push(ps.join(''));
  });
  const last = sheets.length ? sheets[sheets.length - 1].classList.contains('land') : false;
  const NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"';
  const document_ = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${NS}><w:body>${body.join('')}${dxSect(last)}</w:body></w:document>`;
  const enc = new TextEncoder(), REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${REL}/styles" Target="styles.xml"/>${dxImgFiles.map(f => `<Relationship Id="${f.rid}" Type="${REL}/image" Target="${f.name}"/>`).join('')}</Relationships>`;
  const files = [
    { name: '[Content_Types].xml', data: enc.encode('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>') },
    { name: '_rels/.rels', data: enc.encode('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>') },
    { name: 'word/document.xml', data: enc.encode(document_) },
    { name: 'word/styles.xml', data: enc.encode(DX_STYLES) },
    { name: 'word/_rels/document.xml.rels', data: enc.encode(rels) }
  ].concat(dxImgFiles.map(f => ({ name: 'word/' + f.name, data: f.png })));
  return { bytes: dxZip(files), xml: document_ };
}
