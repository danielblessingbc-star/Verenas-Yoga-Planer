/* Allgemeine Symbole für den Auswahlkatalog (z. B. für Atem- und Wahrnehmungsübungen, Meditation, Naturbilder).
   Gleicher Linienstil wie die Strichmännchen (100×100-Raster, Linienstärke 3, runde Enden, currentColor).
   SYMS[Schlüssel] = Zeichnung; FIG_INFO[Schlüssel] = [Name, '', Gruppe]; die Gruppen erscheinen als Filter im Katalog.
   %pose% in einer Zeichnung wird durch das Strichmännchen mit diesem Schlüssel ersetzt. */
const SYMS = {};
function symbolParts(key) {
  const g = SYMS[key].replace(/%(\w+)%/g, (m, k) => POSES[k] ? figureParts(k, false) : '');
  return `<g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${g}</g>`;
}
(function () {
  Object.assign(FIG_GROUPS, { 7: 'Symbole: Atem', 8: 'Symbole: Wahrnehmung & Sinne', 9: 'Symbole: Natur & Elemente', 10: 'Symbole: Stille & Geist', 11: 'Symbole: Körper & Bewegung' });
  const S = (k, n, g, d) => { SYMS[k] = d; POSES[k] = POSES.stand; FIG_INFO[k] = [n, '', g]; };   // POSES-Eintrag nur als Platzhalter (Existenzprüfung)
  const E = (k, n, g, src) => S(k, n, g, ICONS[src]);   // vorhandene Atem-/Wahrnehmungssymbole auch im Katalog anbieten
  const circ = (r, o) => `<circle cx="50" cy="50" r="${r}"${o ? ` opacity="${o}"` : ''}/>`;

  // 7 · Atem
  E('sy_bauch', 'Bauchatmung', 7, 'bauchatmung');
  E('sy_brust', 'Brustkorbatmung', 7, 'brustkorbatmung');
  E('sy_voll', 'Volle Yogaatmung', 7, 'volle_yogaatmung');
  E('sy_langer_atem', 'Langer Atem', 7, 'langer_atem');
  E('sy_verl_aus', 'Verlängerte Ausatmung', 7, 'verl_ausatmung');
  E('sy_wechsel', 'Wechselatmung', 7, 'wechselatmung');
  E('sy_ujjayi', 'Ujjayi (Meeresrauschen)', 7, 'ujjayi');
  E('sy_feuer', 'Feueratem', 7, 'feueratem');
  E('sy_kuehl', 'Kühlende Atmung', 7, 'kuehlende_atmung');
  E('sy_dreipunkt', 'Dreipunkt-Atem', 7, 'dreipunkt_atem');
  S('sy_einatmen', 'Einatmen', 7, '<circle cx="50" cy="50" r="18"/><path d="M6 50h22M17 41l9 9-9 9M94 50H72M83 41l-9 9 9 9"/>');
  S('sy_ausatmen', 'Ausatmen', 7, '<circle cx="50" cy="50" r="12"/><path d="M62 50h30M83 41l9 9-9 9M38 50H8M17 41l-9 9 9 9"/>');
  S('sy_atempause', 'Atempause', 7, '<circle cx="50" cy="50" r="38"/><path d="M40 34v32M60 34v32"/>');
  S('sy_atemwelle', 'Atemwelle', 7, '<path d="M6 50C18 18 34 18 50 50S82 82 94 50"/><path d="M6 50H94" stroke-dasharray="2 7" opacity=".5"/>');
  S('sy_nase', 'Atem an der Nase', 7, '<path d="M50 10C48 34 40 50 32 60C26 68 32 82 44 82C48 82 50 80 50 80C50 80 52 82 56 82C68 82 74 68 68 60C60 50 52 34 50 10Z"/><path d="M12 92c8-6 14-6 20 0M68 92c6-6 12-6 20 0" opacity=".7"/>');
  S('sy_zaehlen', 'Atemzählen (Box)', 7, '<path d="M24 24H76V76H24Z"/><path d="M46 17l8 7-8 7M69 46l7 8 7-8M54 69l-8 7 8 7M17 54l7-8 7 8"/>');
  S('sy_seufzer', 'Seufzer', 7, '<circle cx="50" cy="50" r="38"/><path d="M30 42q6-6 12 0M58 42q6-6 12 0"/><ellipse cx="50" cy="66" rx="9" ry="7"/>');
  S('sy_summen', 'Summen / Klang', 7, '<circle cx="26" cy="50" r="10"/><path d="M46 38q10 12 0 24M60 28q16 22 0 44M74 18q22 32 0 64"/>');

  // 8 · Wahrnehmung & Sinne
  E('sy_beobachten', 'Atem beobachten', 8, 'atem_beobachten');
  E('sy_boden', 'Bodenkontakt spüren', 8, 'bodenkontakt');
  E('sy_fuesse', 'Füße wahrnehmen', 8, 'fuss_wahr');
  E('sy_koerperreise', 'Körperreise', 8, 'koerperreise');
  S('sy_auge', 'Sehen', 8, '<path d="M8 50C26 22 74 22 92 50C74 78 26 78 8 50Z"/><circle cx="50" cy="50" r="12"/><circle cx="50" cy="50" r="3"/>');
  S('sy_auge_zu', 'Augen schließen', 8, '<path d="M10 38C30 66 70 66 90 38"/><path d="M24 56l-8 12M50 62v14M76 56l8 12"/>');
  S('sy_ohr', 'Hören', 8, '<path d="M34 76c0-14 2-18 8-24c-6-4-10-12-6-22c6-12 26-14 36-4c8 8 8 20 0 28c-6 6-8 10-8 18c0 12-10 18-18 14"/><path d="M46 36c4-6 14-4 16 4c2 8-8 10-8 18"/>');
  S('sy_hand', 'Tasten / Spüren', 8, '<path d="M30 90V62L22 48c-3-5 3-9 7-6l9 9V18c0-5 8-5 8 0v26V12c0-5 8-5 8 0v32V16c0-5 8-5 8 0v32V28c0-5 8-5 8 0v34c0 18-8 28-22 28Z"/>');
  S('sy_mund', 'Schmecken', 8, '<path d="M12 50C28 36 40 38 50 44C60 38 72 36 88 50C72 68 28 68 12 50Z"/><path d="M12 50C40 56 60 56 88 50"/>');
  S('sy_puls', 'Puls spüren', 8, '<path d="M6 54H30L38 32L50 78L60 42L66 54H94"/>');
  S('sy_temperatur', 'Wärme und Kühle', 8, '<path d="M42 62V18c0-10 16-10 16 0v44a18 18 0 1 1-16 0Z"/><circle cx="50" cy="76" r="6"/><path d="M50 70V38"/>');
  S('sy_waage', 'Gleichgewicht', 8, '<path d="M50 14V86M30 86H70M14 32H86"/><path d="M14 32L4 60H24ZM86 32L76 60H96Z"/>');
  S('sy_stille', 'Raum / Stille wahrnehmen', 8, circ(6) + circ(20, '.8') + circ(34, '.6'));
  S('sy_scan', 'Körper-Scan', 8, '%stand%<path d="M6 36h88M6 62h88" stroke-dasharray="2 7"/>');
  S('sy_beobachter', 'Beobachter', 8, '%sit%<path d="M18 14A46 46 0 0 1 82 14" opacity=".6"/>');

  // 9 · Natur & Elemente
  S('sy_sonne', 'Sonnenaufgang', 9, '<path d="M20 70A30 30 0 0 1 80 70"/><path d="M6 70H94M50 14v10M18 30l8 8M82 30l-8 8M6 52h10M84 52h10"/>');
  S('sy_mond', 'Mond', 9, '<path d="M62 12A38 38 0 1 0 88 62A30 30 0 0 1 62 12Z"/><path d="M74 28h.1M82 42h.1" stroke-width="6"/>');
  S('sy_stern', 'Stern', 9, '<path d="M50 8l12 28 30 3-23 20 7 30-26-16-26 16 7-30-23-20 30-3Z"/>');
  S('sy_tropfen', 'Wasser', 9, '<path d="M50 10C32 38 24 52 24 64a26 26 0 0 0 52 0C76 52 68 38 50 10Z"/>');
  S('sy_berg', 'Berg', 9, '<path d="M6 82L36 30L56 62L68 44L94 82Z"/>');
  S('sy_baum', 'Baum', 9, '<path d="M50 90V62"/><path d="M50 10C30 10 22 30 30 44C20 52 28 68 42 64H58C72 68 80 52 70 44C78 30 70 10 50 10Z"/>');
  S('sy_blume', 'Blume', 9, '<circle cx="50" cy="22" r="10"/><circle cx="50" cy="58" r="10"/><circle cx="32" cy="40" r="10"/><circle cx="68" cy="40" r="10"/><circle cx="50" cy="40" r="5"/><path d="M50 68V92M50 84c-8-2-14-8-14-14M50 78c8-2 12-6 14-12"/>');
  S('sy_wind', 'Wind', 9, '<path d="M8 36h50a10 10 0 1 0-10-10M8 54h70a10 10 0 1 1-10 10M8 72h36a8 8 0 1 1-8 8"/>');
  S('sy_wolke', 'Wolke', 9, '<path d="M26 74a16 16 0 0 1 2-32a22 22 0 0 1 42-4a18 18 0 0 1 4 36Z"/>');
  S('sy_regenbogen', 'Regenbogen', 9, '<path d="M10 76A40 40 0 0 1 90 76M22 76A28 28 0 0 1 78 76M34 76A16 16 0 0 1 66 76"/>');
  S('sy_welle', 'Welle', 9, '<path d="M6 40q11-14 22 0t22 0t22 0t22 0M6 62q11-14 22 0t22 0t22 0t22 0"/>');

  // 10 · Stille & Geist
  S('sy_lotus', 'Lotus', 10, '<path d="M50 72C34 62 34 36 50 18C66 36 66 62 50 72Z"/><path d="M50 72C36 70 18 62 14 40C30 42 42 54 50 72ZM50 72C64 70 82 62 86 40C70 42 58 54 50 72Z"/><path d="M12 86H88"/>');
  S('sy_meditation', 'Meditation', 10, '%sit%' + circ(46, '.35'));
  S('sy_gebet', 'Gebetshaltung (Anjali)', 10, '%prayer%');
  S('sy_mandala', 'Mandala', 10, circ(8) + circ(22) + circ(38) + '<path d="M50 12V28M50 72V88M12 50H28M72 50H88"/>');
  S('sy_yinyang', 'Yin und Yang', 10, '<circle cx="50" cy="50" r="38"/><path d="M50 12A19 19 0 0 1 50 50A19 19 0 0 0 50 88"/><circle cx="50" cy="31" r="4"/><circle cx="50" cy="69" r="4"/>');
  S('sy_gedanken', 'Gedanken ziehen lassen', 10, '<path d="M30 60a16 16 0 0 1 2-32a20 20 0 0 1 38-4a18 18 0 0 1 4 36Z"/><circle cx="26" cy="76" r="4"/><circle cx="16" cy="88" r="2.5"/>');
  S('sy_absicht', 'Absicht (Sankalpa)', 10, circ(38) + circ(24) + '<circle cx="50" cy="50" r="8"/>');
  S('sy_kerze', 'Kerze / Fokus', 10, '<path d="M50 8C42 20 40 28 50 34C60 28 58 20 50 8Z"/><rect x="38" y="42" width="24" height="46" rx="3"/><path d="M50 34v8"/>');
  S('sy_schale', 'Klangschale', 10, '<path d="M14 48H86C86 70 70 84 50 84C30 84 14 70 14 48Z"/><path d="M34 94H66"/><path d="M30 28q-8 8 0 16M70 28q8 8 0 16" opacity=".7"/>');
  E('sy_herz_haende', 'Hände aufs Herz', 10, 'haende_brust');
  E('sy_dankbar', 'Dankbarkeit', 10, 'dankbarkeit_wahr');
  E('sy_licht', 'Licht im Herzen', 10, 'licht_brust');
  E('sy_rueckblick', 'Rückblick', 10, 'rueckblick');
  E('sy_chakra', 'Chakra-Säule', 10, 'chakra_atem');
  E('sy_prana', 'Prana / Energie', 10, 'pranischer_atem');

  // 11 · Körper & Bewegung
  S('sy_kreisen', 'Kreisen', 11, '<path d="M50 14A36 36 0 1 1 16 40"/><path d="M6 26l10 14l14-8"/>');
  S('sy_dehnen', 'Dehnen', 11, '<path d="M10 50H90M22 38L10 50l12 12M78 38l12 12-12 12"/>');
  S('sy_schuetteln', 'Ausschütteln', 11, '<path d="M20 20l10 20-10 20 10 20M50 12l10 20-10 20 10 20M80 20l10 20-10 20 10 20"/>');
  S('sy_wirbelsaeule', 'Wirbelsäule', 11, [8, 26, 44, 62, 80].map(y => `<rect x="38" y="${y}" width="24" height="12" rx="5"/>`).join(''));
  S('sy_timer', 'Zeit / Timer', 11, '<circle cx="50" cy="56" r="34"/><path d="M50 56V34M50 56L66 64M42 12H58"/>');
  S('sy_wiederholung', 'Wiederholung', 11, '<path d="M20 44A30 30 0 0 1 74 28"/><path d="M80 14v18H62"/><path d="M80 56A30 30 0 0 1 26 72"/><path d="M20 86V68H38"/>');
  E('sy_arme_atem', 'Arme heben mit Atem', 11, 'atem_arme');
  E('sy_king_kong', 'King Kong', 11, 'king_kong');
})();
