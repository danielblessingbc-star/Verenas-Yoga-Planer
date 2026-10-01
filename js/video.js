/* Video-Ausleitung (iPhone, Querformat): die Player-Sequenz wird Bild für Bild (1 Bild pro Sekunde) auf ein Canvas gezeichnet,
   mit WebCodecs als H.264 kodiert und als MP4 (moov vorn) verpackt – läuft auf dem iPhone direkt in „Dateien“ / „Fotos“.
   Minimalistisch: Gesamtzeit, Zeit der Übung, aktuelle und nächste Kachel. Detail: zusätzlich Anleitung / Text (läuft langsam durch). */
const VID_COL = {};
function vidKColor(cls) {
  if (VID_COL[cls]) return VID_COL[cls];
  const d = document.createElement('div'); d.className = cls; d.style.display = 'none'; document.body.appendChild(d);
  const v = getComputedStyle(d).getPropertyValue('--k').trim() || '#9aaba0'; d.remove(); return (VID_COL[cls] = v);
}
const vidRgb = h => { h = String(h).replace('#', ''); if (h.length === 3) h = h.split('').map(x => x + x).join(''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) || 0); };
const vidMix = (h, f) => { const c = vidRgb(h); return `rgb(${c.map(x => Math.round(x + (255 - x) * f)).join(',')})`; };
const vidDark = (h, f) => { const c = vidRgb(h); return `rgb(${c.map(x => Math.round(x * (1 - f))).join(',')})`; };
function vidSvgImg(svg, size, color) {
  return new Promise(res => {
    const img = new Image(); img.onload = () => res(img); img.onerror = () => res(null);
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.replace(/currentColor/g, color || '#27352d').replace('<svg ', `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" `));
  });
}
function vidRound(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function vidTile(ctx, step, x, y, size, r) {
  const k = vidKColor((step.cls || '')), g = ctx.createLinearGradient(x, y, x + size * .4, y + size);
  g.addColorStop(0, vidMix(k, .5)); g.addColorStop(1, vidMix(k, .78));
  vidRound(ctx, x, y, size, size, r); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = vidDark(k, .25); ctx.stroke();
  if (step.img) { const p = size * .09; ctx.drawImage(step.img, x + p, y + p, size - 2 * p, size - 2 * p); }
  if (step.peak) { ctx.fillStyle = '#e0a82e'; ctx.font = `${Math.round(size * .14)}px sans-serif`; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic'; ctx.fillText('★', x + size - size * .05, y + size * .17); }
}
function vidWrap(ctx, text, maxW) {
  const lines = [];
  String(text).split('\n').forEach(par => {
    let line = ''; par.split(/\s+/).forEach(w => { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; });
    lines.push(line);
  });
  return lines;
}
function vidBlocks(html) {
  const doc = new DOMParser().parseFromString('<div>' + html + '</div>', 'text/html'), out = [], txt = p => { const c = p.cloneNode(true); c.querySelectorAll('br').forEach(b => b.replaceWith('\n')); return c.textContent; };
  doc.body.firstChild.childNodes.forEach(n => {
    if (n.nodeType !== 1) return;
    if (n.classList.contains('pds')) { const h = n.querySelector('h4'); if (h) out.push({ h: h.textContent }); n.querySelectorAll('p').forEach(p => out.push({ t: txt(p), w: p.classList.contains('pdw') })); }
    else if (n.tagName === 'P') out.push({ t: txt(n), muted: n.classList.contains('muted') });
  });
  return out;
}

// ---- MP4 (minimal, ein Videotrack) ----
const mp = {
  u32: n => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255], u16: n => [(n >>> 8) & 255, n & 255],
  asc: s => Array.from(s).map(c => c.charCodeAt(0)),
  cat: arrs => { const n = arrs.reduce((a, x) => a + x.length, 0), o = new Uint8Array(n); let p = 0; arrs.forEach(x => { o.set(x, p); p += x.length; }); return o; },
  box(t, ...parts) { const b = mp.cat(parts.map(x => x instanceof Uint8Array ? x : Uint8Array.from(x))); return mp.cat([Uint8Array.from(mp.u32(8 + b.length)), Uint8Array.from(mp.asc(t)), b]); },
  zeros: n => new Array(n).fill(0)
};
function mp4Build(samples, W, H, avcC, tsMs, durMs) {
  const N = samples.length, MAT = [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x40, 0, 0, 0], dur = N * durMs;
  const ftyp = mp.box('ftyp', mp.asc('isom'), mp.u32(512), mp.asc('isom'), mp.asc('iso2'), mp.asc('avc1'), mp.asc('mp41'));
  const moov = off => {
    const mvhd = mp.box('mvhd', [0, 0, 0, 0], mp.u32(0), mp.u32(0), mp.u32(tsMs), mp.u32(dur), [0, 1, 0, 0], [1, 0], mp.zeros(10), MAT, mp.zeros(24), mp.u32(2));
    const tkhd = mp.box('tkhd', [0, 0, 0, 3], mp.u32(0), mp.u32(0), mp.u32(1), mp.u32(0), mp.u32(dur), mp.zeros(8), [0, 0, 0, 0], [0, 0], [0, 0], MAT, mp.u32(W << 16), mp.u32(H << 16));
    const mdhd = mp.box('mdhd', [0, 0, 0, 0], mp.u32(0), mp.u32(0), mp.u32(tsMs), mp.u32(dur), mp.u16(0x55c4), mp.u16(0));
    const hdlr = mp.box('hdlr', [0, 0, 0, 0], mp.u32(0), mp.asc('vide'), mp.zeros(12), mp.asc('VideoHandler'), [0]);
    const dinf = mp.box('dinf', mp.box('dref', [0, 0, 0, 0], mp.u32(1), mp.box('url ', [0, 0, 0, 1])));
    const avc1 = mp.box('avc1', mp.zeros(6), mp.u16(1), mp.zeros(16), mp.u16(W), mp.u16(H), mp.u32(0x00480000), mp.u32(0x00480000), mp.u32(0), mp.u16(1), mp.zeros(32), mp.u16(0x18), mp.u16(0xffff), mp.box('avcC', avcC));
    const sync = []; samples.forEach((s, i) => { if (s.key) sync.push(i + 1); });
    const stbl = mp.box('stbl', mp.box('stsd', [0, 0, 0, 0], mp.u32(1), avc1),
      mp.box('stts', [0, 0, 0, 0], mp.u32(1), mp.u32(N), mp.u32(durMs)),
      mp.box('stss', [0, 0, 0, 0], mp.u32(sync.length), sync.flatMap(mp.u32)),
      mp.box('stsc', [0, 0, 0, 0], mp.u32(1), mp.u32(1), mp.u32(N), mp.u32(1)),
      mp.box('stsz', [0, 0, 0, 0], mp.u32(0), mp.u32(N), samples.flatMap(s => mp.u32(s.data.length))),
      mp.box('stco', [0, 0, 0, 0], mp.u32(1), mp.u32(off)));
    const minf = mp.box('minf', mp.box('vmhd', [0, 0, 0, 1], mp.zeros(8)), dinf, stbl);
    return mp.box('moov', mvhd, mp.box('trak', tkhd, mp.box('mdia', mdhd, hdlr, minf)));
  };
  const total = samples.reduce((a, s) => a + s.data.length, 0), head = moov(0).length, off = ftyp.length + head + 8;
  const mdat = mp.cat([Uint8Array.from(mp.u32(8 + total)), Uint8Array.from(mp.asc('mdat'))].concat(samples.map(s => s.data)));
  return mp.cat([ftyp, moov(off), mdat]);
}

// ---- Video einer Stunde erzeugen ----
async function vidMake(c, s, mode, res, onProg) {
  if (typeof VideoEncoder === 'undefined') throw new Error('Dieser Browser kann keine Videos erzeugen (WebCodecs fehlt). Bitte Chrome, Edge oder Safari ab Version 16.4 verwenden.');
  const det = mode === 'det', steps = plSteps(c, s); if (!steps.length) throw new Error('Diese Stunde hat keine abspielbaren Inhalte.');
  const W = res === 1080 ? 1920 : 1280, H = res === 1080 ? 1080 : 720, S = H / 720;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const ctx = cv.getContext('2d', { alpha: false });
  for (const st of steps) { const m = st.tile.match(/<svg[\s\S]*?<\/svg>/); st.img = m ? await vidSvgImg(m[0], 256) : null; st.peak = /★/.test(st.tile); st.sec = Math.max(1, Math.round(st.min * 60)); }
  const ICN = {}, ICW = {}; if (det) for (const k of Object.keys(PLI)) { ICN[k] = await vidSvgImg(pliSvg(k, 64), 64, '#7fb497'); ICW[k] = await vidSvgImg(pliSvg(k, 64), 64, '#e9b4a8'); }
  const sum = steps.reduce((a, x) => a + x.sec, 0), FONT = 'Nunito, "Segoe UI", system-ui, sans-serif', ENDF = 6, frames = sum + ENDF;
  // Detailtexte (Anleiten / Hands-on) umbrechen
  const panelW = W * .58 - 40 * S, FS = Math.round(26 * S), LH = 38 * S;
  if (det) steps.forEach(st => {
    ctx.font = FS + 'px ' + FONT; const lines = [];
    st.det.forEach(g => { lines.push({ h: g.h, ic: g.ic, w: g.w }); (g.items || []).forEach(it => vidWrap(ctx, it, panelW - 56 * S).forEach((l, i) => lines.push({ t: l, bullet: i === 0, w: g.w }))); (g.paras || []).forEach(pp => { vidWrap(ctx, pp, panelW - 24 * S).forEach(l => lines.push({ t: l, w: g.w })); lines.push({ gap: true }); }); lines.push({ gap: true }); });
    st.lines = lines;
    const lh0 = l => l.gap ? 12 * S : l.h ? 44 * S : LH, viewH0 = (H - 84 * S - 36 * S) - 80 * S, pages = []; let curP = [], used = 0;
    lines.forEach(l => { const h = lh0(l); if (used + h > viewH0 && curP.length) { const last = curP[curP.length - 1], carry = last && last.h ? curP.pop() : null; pages.push(curP); curP = carry ? [carry] : []; used = carry ? 44 * S : 0; } if (l.gap && !curP.length) return; curP.push(l); used += h; });
    if (curP.length) pages.push(curP); st.pages = pages;
  });
  const samples = []; let desc = null, error = null;
  const encoder = new VideoEncoder({ output: (ch, meta) => { const d = new Uint8Array(ch.byteLength); ch.copyTo(d); samples.push({ data: d, key: ch.type === 'key' }); if (meta && meta.decoderConfig && meta.decoderConfig.description && !desc) desc = new Uint8Array(meta.decoderConfig.description instanceof ArrayBuffer ? meta.decoderConfig.description : meta.decoderConfig.description.buffer); }, error: e => { error = e; } });
  const cfg = { codec: res === 1080 ? 'avc1.4d0028' : 'avc1.4d001f', width: W, height: H, bitrate: res === 1080 ? 900000 : 450000, framerate: 1, avc: { format: 'avc' }, latencyMode: 'quality' };
  const sup = await VideoEncoder.isConfigSupported(cfg); if (!sup.supported) throw new Error('H.264-Kodierung wird von diesem Browser nicht unterstützt.');
  encoder.configure(cfg);
  const txtc = (t, x, y, size, weight, color, align) => { ctx.font = (weight || 400) + ' ' + Math.round(size * S) + 'px ' + FONT; ctx.fillStyle = color; ctx.textAlign = align || 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText(t, x, y); };
  const title = c.single ? c.name : c.name + ' – ' + s.motto.title;
  let si = 0, stepStart = 0;
  for (let f = 0; f < frames; f++) {
    if (f % 40 === 0) { if (onProg) onProg(f / frames); await new Promise(r => setTimeout(r, 0)); }
    if (error) throw error;
    ctx.fillStyle = '#12171a'; ctx.fillRect(0, 0, W, H);
    const remTot = Math.max(0, sum - f), tt = plFmt(remTot);
    txtc(title, 36 * S, 40 * S, 18, 700, '#e9efe9');
    txtc(tt, W - 36 * S, 44 * S, 32, 700, '#ffffff', 'right'); ctx.font = '700 ' + Math.round(32 * S) + 'px ' + FONT; const twd = ctx.measureText(tt).width;
    txtc('Gesamt', W - 36 * S - twd - 12 * S, 44 * S, 16, 400, '#aab8b0', 'right');
    ctx.fillStyle = '#222b2f'; ctx.fillRect(0, 58 * S, W, 4 * S); ctx.fillStyle = '#7fb497'; ctx.fillRect(0, 58 * S, W * Math.min(1, f / sum), 4 * S);
    if (f >= sum) { txtc('Namaste 🙏', W / 2, H / 2, 76, 700, '#fff', 'center'); txtc(title, W / 2, H / 2 + 48 * S, 22, 400, '#9fb0a6', 'center'); }
    else {
      while (si < steps.length - 1 && f >= stepStart + steps[si].sec) { stepStart += steps[si].sec; si++; }
      const st = steps[si], nx = steps[si + 1], left = stepStart + st.sec - f, prog = (f - stepStart) / st.sec;
      if (!det) {
        // Minimalistisch: große Kachel, große Zeit
        const cx = W * .40, tile = 310 * S, ty = 104 * S;
        txtc(st.block.toUpperCase() + ' · ' + (si + 1) + ' / ' + steps.length, cx, 94 * S, 15, 400, '#8fa398', 'center');
        vidTile(ctx, st, cx - tile / 2, ty, tile, 34 * S);
        ctx.font = '700 ' + Math.round(40 * S) + 'px ' + FONT; let ny = ty + tile + 52 * S;
        vidWrap(ctx, st.title, 640 * S).slice(0, 2).forEach(l => { txtc(l, cx, ny, 40, 700, '#ffffff', 'center'); ny += 46 * S; });
        const cdY = Math.max(ny + 6 * S, H - 74 * S);
        txtc(plFmt(left), cx, cdY, 150, 700, '#ffffff', 'center');
        const bw = 600 * S; ctx.fillStyle = '#27323a'; ctx.fillRect(cx - bw / 2, cdY + 22 * S, bw, 8 * S); ctx.fillStyle = '#e0b92e'; ctx.fillRect(cx - bw / 2, cdY + 22 * S, bw * prog, 8 * S);
        const nxx = W * .82, ns = 150 * S;
        txtc('DANACH', nxx, 190 * S, 15, 400, '#9fb0a6', 'center');
        if (nx) { vidTile(ctx, nx, nxx - ns / 2, 206 * S, ns, 20 * S); let yy = 206 * S + ns + 34 * S; ctx.font = '600 ' + Math.round(21 * S) + 'px ' + FONT; vidWrap(ctx, nx.title, 230 * S).slice(0, 3).forEach(l => { txtc(l, nxx, yy, 21, 600, '#e9efe9', 'center'); yy += 27 * S; }); txtc(fmtMin(nx.min) + ' Min.', nxx, yy + 2 * S, 16, 400, '#9fb0a6', 'center'); }
        else txtc('Schlussruhe', nxx, 230 * S, 21, 600, '#e9efe9', 'center');
      } else {
        // Detail: links Kachel + Zeit, Mitte Anleiten & Hands-on, rechts nächste Kachel
        const cx = W * .145, tile = 190 * S, ty = 112 * S;
        txtc(st.block.toUpperCase() + ' · ' + (si + 1) + ' / ' + steps.length, cx, 98 * S, 13, 400, '#8fa398', 'center');
        vidTile(ctx, st, cx - tile / 2, ty, tile, 26 * S);
        ctx.font = '700 ' + Math.round(26 * S) + 'px ' + FONT; let ny = ty + tile + 40 * S;
        vidWrap(ctx, st.title, 250 * S).slice(0, 3).forEach(l => { txtc(l, cx, ny, 26, 700, '#ffffff', 'center'); ny += 31 * S; });
        if (st.sub) { txtc(st.sub, cx, ny - 2 * S, 15, 400, '#9fb0a6', 'center'); ny += 20 * S; }
        const cdY = Math.max(ny + 70 * S, H - 90 * S);
        txtc(plFmt(left), cx, cdY, 84, 700, '#ffffff', 'center');
        const bw = 250 * S; ctx.fillStyle = '#27323a'; ctx.fillRect(cx - bw / 2, cdY + 20 * S, bw, 6 * S); ctx.fillStyle = '#e0b92e'; ctx.fillRect(cx - bw / 2, cdY + 20 * S, bw * prog, 6 * S);
        const px = W * .29, py = 84 * S, pw = W * .58, ph = H - py - 36 * S;
        vidRound(ctx, px, py, pw, ph, 20 * S); ctx.fillStyle = '#192024'; ctx.fill(); ctx.strokeStyle = '#2a363c'; ctx.lineWidth = 1.5; ctx.stroke();
        txtc(st.text ? 'TEXT' : 'ANLEITEN & HANDS-ON', px + 22 * S, py + 32 * S, 13, 400, '#8fa398'); if (st.dur) txtc(st.dur, px + pw - 22 * S, py + 32 * S, 14, 700, '#e0b92e', 'right');
        ctx.save(); ctx.beginPath(); ctx.rect(px + 4, py + 46 * S, pw - 8, ph - 56 * S); ctx.clip();
        const hH = 44 * S, pgs = st.pages.length || 1, pg = st.pages[Math.min(pgs - 1, Math.floor(prog * pgs))] || [];
        let yy = py + 84 * S;
        if (pgs > 1) txtc((Math.min(pgs - 1, Math.floor(prog * pgs)) + 1) + ' / ' + pgs, px + pw - 22 * S, py + ph - 14 * S, 13, 400, '#8fa398', 'right');
        pg.forEach(l => {
          if (l.gap) { yy += 12 * S; return; }
          if (l.h) { const im = (l.w ? ICW : ICN)[l.ic]; if (im) ctx.drawImage(im, px + 22 * S, yy - 22 * S, 26 * S, 26 * S); txtc(l.h.toUpperCase(), px + 58 * S, yy - 2 * S, 17, 700, l.w ? '#e9b4a8' : '#7fb497'); yy += hH; return; }
          if (l.bullet) txtc('•', px + 28 * S, yy, 26, 400, l.w ? '#e9b4a8' : '#7fb497');
          txtc(l.t, px + (l.bullet !== undefined && st.det.some(g => g.items) && (l.bullet || true) ? 56 * S : 22 * S), yy, 26, 400, l.w ? '#f0c4b9' : '#e3ece6'); yy += LH;
        });
        ctx.restore();
        const nxx = W * .93, ns = 96 * S;
        txtc('DANACH', nxx, 150 * S, 13, 400, '#9fb0a6', 'center');
        if (nx) { vidTile(ctx, nx, nxx - ns / 2, 166 * S, ns, 16 * S); let yy = 166 * S + ns + 26 * S; ctx.font = '600 ' + Math.round(16 * S) + 'px ' + FONT; vidWrap(ctx, nx.title, 120 * S).slice(0, 4).forEach(l => { txtc(l, nxx, yy, 16, 600, '#e9efe9', 'center'); yy += 20 * S; }); txtc(fmtMin(nx.min) + ' Min.', nxx, yy + 2 * S, 14, 400, '#9fb0a6', 'center'); }
      }
    }
    const fr = new VideoFrame(cv, { timestamp: f * 1e6, duration: 1e6 });
    encoder.encode(fr, { keyFrame: f % 60 === 0 }); fr.close();
    while (encoder.encodeQueueSize > 12) await new Promise(r => setTimeout(r, 4));
  }
  await encoder.flush(); encoder.close(); if (error) throw error;
  if (!desc || !samples.length) throw new Error('Die Videokodierung hat keine Daten geliefert.');
  if (onProg) onProg(1);
  return mp4Build(samples, W, H, desc, 1000, 1000);
}

const VIDEO_ACTIONS = {
  vidRes(d) { ui.vidRes = +d.v === 1080 ? 1080 : 720; render(); },
  async vidExport(d) {
    if (VID.busy) return; const c = cur(); if (!c || !c.sessions.length) return;
    const idx = docSelIdx(c, ui.doc).filter(i => c.sessions[i]); if (!idx.length) { toast('Keine Stunde ausgewählt.'); return; }
    const out = document.getElementById('vidProg'), res = ui.vidRes === 1080 ? 1080 : 720; VID.busy = true;
    try {
      for (let n = 0; n < idx.length; n++) {
        const s = c.sessions[idx[n]], label = `Stunde ${idx[n] + 1} (${n + 1}/${idx.length})`;
        const bytes = await vidMake(c, s, d.m === 'det' ? 'det' : 'min', res, p => { if (out) out.textContent = `⏳ ${label}: ${Math.round(p * 100)} % …`; });
        download(fileName(`${c.name}_Stunde${idx[n] + 1}_${(s.motto && s.motto.title) || ''}`) + (d.m === 'det' ? '_Detail' : '_Minimal') + '_iPhone.mp4', bytes, 'video/mp4');
        if (out) out.textContent = `✓ ${label} gespeichert.`;
      }
      toast(`${idx.length} Video${idx.length === 1 ? '' : 's'} gespeichert (MP4, ${res === 1080 ? '1920×1080' : '1280×720'}, Querformat).`, 6000);
    } catch (e) { console.error(e); if (out) out.textContent = '⚠ ' + e.message; toast('⚠ ' + e.message, 9000); }
    VID.busy = false;
  }
};
const VID = { busy: false };
