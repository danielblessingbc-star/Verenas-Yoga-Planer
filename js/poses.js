/* Strichmännchen: jede Pose = 11 Punkte (Kopf, Hals, Becken, Ellbogen R, Hand R, Ellbogen L, Hand L, Knie R, Fuß R, Knie L, Fuß L) in einem 100×100-Raster */
const POSES = {};
(function () {
  const P = (k, s) => { POSES[k] = s.trim().split(/\s+/).map(p => p.split(',').map(Number)); };
  // Stand
  P('stand', '50,14 50,23 50,52 57,37 58,52 43,37 42,52 54,72 55,92 46,72 45,92');
  P('prayer', '50,14 50,23 50,52 58,38 50,32 42,38 50,32 54,72 55,92 46,72 45,92');
  P('arms_up', '50,18 50,27 50,55 60,15 66,3 40,15 34,3 54,74 55,93 46,74 45,93');
  P('arms_side', '50,14 50,23 50,52 66,24 82,24 34,24 18,24 54,72 55,92 46,72 45,92');
  P('side_bend', '64,19 58,25 50,52 62,40 66,54 54,14 70,8 54,72 55,92 46,72 45,92');
  P('twist', '50,14 50,23 50,52 64,26 78,32 36,26 22,20 54,72 55,92 46,72 45,92');
  P('fold', '80,68 70,58 44,44 75,74 77,88 72,75 74,88 47,68 47,92 43,68 43,92');
  P('half_fold', '82,46 70,48 40,48 72,62 72,78 70,62 70,78 42,70 42,92 38,70 38,92');
  P('rollup', '68,34 60,28 44,50 66,44 70,60 64,44 68,60 47,70 47,92 43,70 43,92');
  P('backbend', '42,17 46,26 52,52 58,38 54,50 38,36 48,50 55,72 56,92 48,72 47,92');
  P('hips_hands', '50,14 50,23 52,52 62,38 54,50 38,38 46,50 54,72 55,92 47,72 45,92');
  P('stand_catcow', '34,40 42,34 56,52 50,48 52,66 48,48 50,66 56,70 58,90 52,70 52,90');
  P('arm_swing', '50,14 50,23 50,52 60,30 70,20 40,38 34,50 52,72 53,92 46,72 45,92');
  P('knee_lift', '50,14 50,23 50,52 58,36 59,50 42,36 41,50 64,56 58,74 47,72 46,92');
  P('foot_lift', '50,14 50,23 50,52 58,36 59,52 42,36 41,52 55,72 60,86 46,72 45,92');
  P('heel_raise', '50,10 50,19 50,48 57,33 58,48 43,33 42,48 54,68 55,88 46,68 45,88');
  P('weight_shift', '56,14 56,23 56,52 62,38 62,52 50,38 50,52 62,72 64,92 44,72 40,92');
  P('chair', '48,24 46,34 36,62 58,22 66,8 56,24 64,10 62,68 58,92 60,68 56,92');
  P('squat', '48,24 46,34 38,62 60,38 76,38 58,38 74,38 62,66 62,92 58,68 58,92');
  P('warrior1', '50,16 50,25 50,54 56,14 57,2 44,14 43,2 72,68 72,92 34,74 20,92');
  P('warrior2', '50,14 50,23 50,54 66,24 84,24 34,24 16,24 74,68 74,92 36,74 24,92');
  P('goddess', '50,14 50,23 50,56 66,26 66,12 34,26 34,12 72,68 68,92 28,68 32,92');
  P('tree', '50,16 50,25 50,54 57,16 50,4 43,16 50,4 62,64 52,74 47,74 47,94');
  P('eagle', '50,14 50,23 50,52 54,34 48,20 46,34 52,20 54,72 55,92 46,72 45,92');
  P('sideangle', '72,32 64,38 48,56 72,52 76,64 74,24 88,18 74,70 76,92 34,76 22,92');
  P('lunge', '52,22 50,32 44,60 60,44 66,60 58,44 64,58 66,68 66,92 28,80 14,90');
  P('warrior3s', '82,46 72,48 44,48 82,54 92,56 80,52 92,54 44,70 44,92 26,48 8,48');
  P('tandem', '50,14 50,23 50,52 64,30 76,26 36,30 24,26 52,72 56,92 48,72 44,92');
  P('wide_stand', '50,14 50,23 50,52 66,24 82,24 34,24 18,24 64,72 72,92 36,72 28,92');
  P('gomukhasana', '50,16 50,25 50,54 56,14 50,30 44,38 52,44 54,74 55,93 46,74 45,93');
  P('leg_side', '50,14 50,23 50,52 60,34 70,44 40,34 36,48 52,72 53,92 34,66 20,76');
  P('supine_bent', '10,80 18,80 46,80 30,86 42,86 28,87 40,87 62,60 68,84 60,62 66,84');
  P('plank_wall', '74,30 66,38 48,62 77,39 88,40 76,41 88,42 38,78 28,92 36,78 26,92');
  // Boden / Vierfüßler / Bauchlage
  P('plank_floor', '16,58 24,62 58,72 26,80 14,80 28,82 16,82 76,76 92,82 78,78 94,84');
  P('quad_cat', '28,54 38,44 68,46 38,64 38,84 40,64 40,84 68,74 82,84 66,74 80,84');
  P('quad_diag', '28,40 38,46 68,48 37,66 37,84 22,50 8,50 68,74 82,84 84,50 96,50');
  P('child', '26,80 34,72 62,74 22,82 10,84 24,84 12,84 56,84 78,86 58,86 80,88');
  P('anahatasana', '28,82 36,74 66,60 22,86 8,86 24,86 10,86 66,84 84,88 68,84 86,88');
  P('sphinx', '24,60 30,68 66,84 34,84 20,84 36,85 22,85 82,86 96,86 80,87 94,87');
  P('cobra', '26,50 32,60 66,84 34,74 34,86 36,74 36,86 82,86 96,86 80,87 94,87');
  // Rückenlage
  P('bridge', '12,80 22,78 48,64 34,82 46,82 34,83 46,83 66,58 70,84 64,60 67,84');
  P('supine_knee', '10,80 18,80 46,80 28,70 36,62 26,74 34,64 36,62 50,70 38,60 52,68');
  P('leg_stretch', '10,80 18,80 46,80 30,70 52,62 30,74 50,64 56,58 64,36 60,64 70,80');
  P('twist_supine', '10,80 18,80 46,80 22,70 26,60 22,74 26,64 54,66 60,82 60,70 52,82');
  P('butterfly_lying', '10,80 18,80 46,80 28,82 40,82 28,84 40,84 60,64 52,80 66,70 56,82');
  P('legs_wall', '8,80 16,80 40,80 26,84 34,84 26,86 34,86 46,58 46,36 44,58 44,36');
  P('heart_supine', '10,82 18,80 46,80 20,68 22,54 24,70 26,56 58,62 66,80 60,64 68,80');
  P('savasana', '10,82 18,82 48,82 30,86 42,86 28,87 40,87 66,84 84,86 66,86 84,87');
  // Sitz
  P('sit', '50,38 50,48 50,78 62,62 70,78 38,62 30,78 70,80 52,88 30,80 48,88');
  P('sit_arms', '50,38 50,48 50,78 66,50 84,50 34,50 16,50 70,80 52,88 30,80 48,88');
  P('sit_shoulder', '50,38 50,48 50,78 66,54 56,48 34,54 44,48 70,80 52,88 30,80 48,88');
  P('sit_neck', '58,40 51,48 50,78 62,62 70,78 38,62 30,78 70,80 52,88 30,80 48,88');
  P('sit_elbow', '50,38 50,48 50,78 66,56 66,40 34,56 34,40 70,80 52,88 30,80 48,88');
  P('sit_side', '60,40 54,48 50,78 56,62 60,76 56,30 68,24 70,80 52,88 30,80 48,88');
  P('sit_twist', '50,38 50,48 50,78 62,58 44,66 40,58 56,66 70,80 52,88 30,80 48,88');
  P('sit_leg', '40,38 40,48 40,78 50,64 56,60 48,66 56,62 66,80 90,82 56,60 62,82');
  P('longsit', '36,38 36,48 36,78 28,66 26,80 30,64 28,80 64,80 90,82 62,82 88,84');
  P('butterfly_sit', '50,38 50,48 50,76 64,64 56,84 36,64 44,84 74,72 54,86 26,72 46,86');
  P('janu', '66,62 56,60 30,78 70,70 84,78 68,72 82,80 60,80 90,82 22,66 42,84');
  P('malasana', '50,32 50,42 50,70 60,50 50,48 40,50 50,48 70,66 64,90 30,66 36,90');
})();

function figureParts(key, ground) {
  if (key === 'ratlos') { // Standardsymbol für eigene Übungen: ahnungsloser Strichmensch mit Fragezeichen
    return figureParts('stand', ground) + '<path d="M64 14c0-8 14-8 14 0c0 7-7 7-7 15" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="71" cy="37" r="2.2" fill="currentColor"/>';
  }
  if (typeof SYMS !== 'undefined' && SYMS[key]) return symbolParts(key);   // allgemeine Symbole (symbole.js)
  const p = POSES[key] || POSES.stand;
  const [h, n, pe, eR, hR, eL, hL, kR, fR, kL, fL] = p;
  const M = (a) => a.join(' ');
  const d = 'M' + M(n) + 'L' + M(pe) +
    'M' + M(n) + 'L' + M(eR) + 'L' + M(hR) +
    'M' + M(n) + 'L' + M(eL) + 'L' + M(hL) +
    'M' + M(pe) + 'L' + M(kR) + 'L' + M(fR) +
    'M' + M(pe) + 'L' + M(kL) + 'L' + M(fL);
  const gy = Math.max(...p.map(q => q[1])) + 4;
  return `<path d="${d}" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<circle cx="${h[0]}" cy="${h[1]}" r="6.5" fill="none" stroke="currentColor" stroke-width="3"/>` +
    (ground === false ? '' : `<path d="M6 ${gy}H94" stroke="currentColor" stroke-width="1.2" opacity=".4" stroke-linecap="round"/>`);
}
function figureSVG(key, size) {
  const px = size ? ` width="${size}" height="${size}"` : '';
  if (key === 'lied') return LIEDICON.replace('<svg class="fig"', '<svg class="fig"' + px);   // Sonderbaustein „Lied“
  if (key === 'mantrasb') return manIconSVG('om').replace('<svg class="fig"', '<svg class="fig"' + px);   // Sonderbaustein „Mantra“
  if (key === 'textblock') return TEXTICON.replace('<svg class="fig"', '<svg class="fig"' + px);   // Sonderbaustein „Textblock“
  return `<svg class="fig" viewBox="0 0 100 100"${px} aria-hidden="true">${figureParts(key)}</svg>`;
}

/* Symbole für Atem- und Wahrnehmungsübungen (gleicher Linienstil wie die Strichmännchen) */
const ICONS = {
  bauchatmung: '<circle cx="50" cy="54" r="24"/><path d="M50 12v16M43 19l7-7 7 7M50 92V80M43 85l7 7 7-7"/>',
  verl_ausatmung: '<path d="M10 74L32 26L92 74"/><path d="M10 84H92" stroke-dasharray="2 7" opacity=".6"/><path d="M80 62l12 12-15 3"/>',
  atem_arme: '<g transform="translate(0 4) scale(.9 .9) translate(5 0)">%arms_up%</g><path d="M14 40c-6 8-6 18 0 26M86 40c6 8 6 18 0 26" opacity=".7"/>',
  atemraeume: '<path d="M50 14V86"/><path d="M50 30C36 28 24 34 20 46M50 46C38 46 28 52 26 64M50 62C42 62 34 66 32 76M50 30C64 28 76 34 80 46M50 46C62 46 72 52 74 64M50 62C58 62 66 66 68 76"/><path d="M10 52H4M8 48l-4 4 4 4M90 52h6M92 48l4 4-4 4"/>',
  atem_beobachten: '<path d="M8 50C26 22 74 22 92 50C74 78 26 78 8 50Z"/><circle cx="50" cy="50" r="11"/><path d="M30 90c7-8 13-8 20 0s13 8 20 0" opacity=".7"/>',
  bodenkontakt: '<path d="M8 76H92"/><circle cx="50" cy="48" r="16"/><path d="M34 90v-8M50 90v-8M66 90v-8M30 84l4 6 4-6M46 84l4 6 4-6M62 84l4 6 4-6" opacity=".75"/>',
  fuss_wahr: '<path d="M30 40c-9 2-14 14-12 28c1 8 6 14 13 13c8-1 10-8 9-17c-1-13-3-26-10-24zM70 40c9 2 14 14 12 28c-1 8-6 14-13 13c-8-1-10-8-9-17c1-13 3-26 10-24z"/><path d="M24 22h.1M33 16h.1M42 21h.1M58 21h.1M67 16h.1M76 22h.1" stroke-width="6"/>',
  koerperreise: '<g transform="translate(-14 0)">%stand%</g><path d="M80 10V84M73 76l7 8 7-8" stroke-dasharray="1 8"/>',
  haende_brust: '<path d="M50 84C20 62 14 44 24 30C34 18 46 24 50 34C54 24 66 18 76 30C86 44 80 62 50 84Z"/><path d="M50 4v8M26 10l5 6M74 10l-5 6M8 28l8 3M92 28l-8 3" opacity=".7"/>',
  dankbarkeit_wahr: '<path d="M10 56C12 78 34 86 50 78C66 86 88 78 90 56"/><path d="M50 62C32 50 30 38 36 31C42 25 48 28 50 34C52 28 58 25 64 31C70 38 68 50 50 62Z"/>',
  licht_brust: '<circle cx="50" cy="50" r="16"/><path d="M50 12v12M50 76v12M12 50h12M76 50h12M23 23l8 8M69 69l8 8M77 23l-8 8M31 69l-8 8"/>',
  rueckblick: '<path d="M26 30A32 32 0 1 1 18 56"/><path d="M12 22l14 8-3-16"/><path d="M52 34V52L66 60"/>'
};
function breathIconSVG(id) { return iconSVG((BR.find(x => x.id === id) || {}).ic || id); }
function iconSVG(key) {
  let g = ICONS[key] || '';
  g = g.replace('%arms_up%', figureParts('arms_up', false)).replace('%stand%', figureParts('stand', false));
  return `<svg class="fig" viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${g}</g></svg>`;
}

Object.assign(ICONS, {
  volle_yogaatmung: '<ellipse cx="46" cy="72" rx="22" ry="12"/><ellipse cx="46" cy="50" rx="26" ry="12"/><ellipse cx="46" cy="29" rx="19" ry="10"/><path d="M90 84V16M83 25l7-9 7 9"/>',
  brustkorbatmung: '<path d="M50 16V84"/><path d="M32 28C18 40 18 64 32 76M68 28C82 40 82 64 68 76"/><path d="M41 38C36 48 36 58 41 66M59 38C64 48 64 58 59 66"/>',
  feueratem: '<path d="M50 90C28 90 24 66 38 50C40 60 46 62 46 56C46 40 56 30 54 12C70 28 78 44 74 62C72 76 62 90 50 90Z"/>',
  langer_atem: '<path d="M6 60C18 22 34 22 46 56S76 92 94 44"/><path d="M82 38l12 6-10 8"/>',
  dreipunkt_atem: '<path d="M50 16L86 80H14Z"/><circle cx="50" cy="16" r="5"/><circle cx="86" cy="80" r="5"/><circle cx="14" cy="80" r="5"/>',
  wechselatmung: '<path d="M22 76C22 36 62 34 72 22M62 14l12 8-9 11"/><path d="M78 76C78 36 38 34 28 22M38 14l-12 8 9 11"/>',
  chakra_atem: '<path d="M50 8V92"/><circle cx="50" cy="16" r="6"/><circle cx="50" cy="31" r="5"/><circle cx="50" cy="46" r="5"/><circle cx="50" cy="61" r="5"/><circle cx="50" cy="76" r="5"/><circle cx="50" cy="90" r="5"/>',
  kuehlende_atmung: '<path d="M50 8V92M14 29L86 71M14 71L86 29"/><path d="M42 14l8 7 8-7M42 86l8-7 8 7"/>',
  ujjayi: '<path d="M6 36q11-14 22 0t22 0t22 0t22 0M6 58q11-14 22 0t22 0t22 0t22 0M6 80q11-14 22 0t22 0t22 0t22 0"/>',
  pranischer_atem: '<g transform="translate(-10 6)">%stand%</g><path d="M82 20V8M70 28l-8-8M94 28l8-8M66 44H54M98 44h12" opacity=".8"/>',
  king_kong: '<g transform="translate(0 6) scale(.9 .9) translate(5 0)">%arms_up%</g><path d="M14 32c-8 8-8 20 0 28M86 32c8 8 8 20 0 28" opacity=".8"/>'
});

const LIEDICON = '<svg class="fig" viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M40 70V22l34-8v48"/><path d="M40 40l34-8"/><ellipse cx="30" cy="72" rx="10" ry="8"/><ellipse cx="64" cy="64" rx="10" ry="8"/></g></svg>';
const TEXTICON = '<svg class="fig" viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M24 8h36l18 18v66H24z"/><path d="M60 8v18h18"/><path d="M34 46h34M34 58h34M34 70h22"/></g></svg>';

POSES.ratlos = POSES.stand; // Auswahl im Katalog; Zeichnung (mit Fragezeichen) siehe figureParts
