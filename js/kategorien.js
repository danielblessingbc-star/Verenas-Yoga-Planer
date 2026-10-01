/* Weitere Kategorien für den Übungskatalog (nur im aufgeklappten Detail und im Filter „Weitere Kategorien“).
   Die Zuordnung ergibt sich aus Haltung (Strichmännchen-Pose), Katalog-Art, Schlagworten und – beim Chakra – aus dem Ausbildungsskript (Modul 3).
   Ausnahmen/Feinheiten lassen sich unten in OVERRIDE korrigieren. */
const KAT = {
  pos: { stehen: 'Stehhaltungen', sitzen: 'Sitzhaltungen', liegen: 'Liegende Haltungen (Bauch-/Rückenlage)', umkehr: 'Umkehrhaltungen', balance: 'Balancehaltungen', knien: 'Knie- und Vierfüßlerhaltungen*', stuetz: 'Stützhaltungen*' },
  dir: { rueck: 'Rückbeugen', vor: 'Vorbeugen', dreh: 'Drehungen (Twists)', seit: 'Seitbeugen' },
  wirk: { kraeftig: 'Kräftigend / dynamisch', dehnend: 'Dehnend / Flexibilität fördernd', regen: 'Regenerativ / beruhigend' },
  en: { brahmana: 'Aktivierend, belebend (Brahmana)', langhana: 'Beruhigend, abkühlend (Langhana)' },
  chakra: { muladhara: 'Wurzelchakra (Muladhara)', svadhisthana: 'Sakralchakra (Svadhisthana)', manipura: 'Solarplexuschakra (Manipura)', anahata: 'Herzchakra (Anahata)', vishuddha: 'Halschakra (Vishuddha)', ajna: 'Stirnchakra (Ajna)', sahasrara: 'Kronenchakra (Sahasrara)' },
  reg: { nacken: 'Nacken & Kopf', schulter: 'Schultern & Arme', haende: 'Ellenbogen, Handgelenke & Hände', brust: 'Brust & Herzraum', ruecken: 'Rücken / Wirbelsäule', bauch: 'Bauch & Körpermitte (Rumpf)', huefte: 'Hüfte & Becken', beine: 'Beine (Ober-/Unterschenkel)', fuss: 'Knie, Füße & Sprunggelenke', ganz: 'Ganzkörper / Gleichgewicht' },
  mus: { nackenm: 'Nacken- & Schultergürtelmuskulatur', arme: 'Arme (Oberarm, Unterarm, Handgelenk)', brust: 'Brustmuskulatur', rueckenm: 'Rückenstrecker / Rumpfaufrichter', bauchm: 'Bauch- & Rumpfmuskulatur (Core)', beckenb: 'Beckenboden', gesaess: 'Gesäß- & Hüftmuskulatur', quad: 'Oberschenkel Vorderseite (Quadrizeps, Hüftbeuger)', hams: 'Oberschenkel Rückseite (Beinbeuger)', adduk: 'Oberschenkel Innenseite (Adduktoren)', waden: 'Waden & Füße' },
  atm: { folgt: 'Atem folgt der Bewegung (Ein-/Ausatmung im Wechsel mit der Bewegung)', halten: 'Ruhig und tief weiteratmen in der Haltung', tief: 'Tiefe Bauch- und Entspannungsatmung (beruhigend)', weit: 'Brust- und Flankenraum weiten', kraft: 'Gleichmäßig atmen unter Anstrengung (kräftigend)' },
  auf: { spueren: 'Körperwahrnehmung / Spüren', wurzel: 'Verwurzelung & Standfestigkeit', balance: 'Gleichgewicht & Konzentration', ausricht: 'Ausrichtung & Kraft im Körper', loslass: 'Loslassen & Nachspüren', energie: 'Energie & Aktivierung', herz: 'Herz & Offenheit' },
  sup: { adjust: 'Hands-on Adjustment (Ausrichtung bzw. Vertiefung per Berührung)', support: 'Hands-on Support (Halt und Sicherung bei Balance, Umkehr, Peak)', assist: 'Hands-on Assistance (sanfte Unterstützung zur Entspannung)', keine: 'Keine Berührung nötig (verbale Anleitung / Demonstration)' },
  mat: { matte: 'Yogamatte', decke: 'Decke (unterlegen / zudecken)', kissen: 'Kissen / Bolster', block: 'Yogablock', gurt: 'Yogagurt', stuhl: 'Stuhl', wand: 'Wand' },
  ziel: { aufwaerm: 'Aufwärm- und Übergangsübungen', peak: 'Gipfelposition (Peak Pose) ★', schluss: 'Schlusshaltung & Entspannung' }
};
const KATTITLE = { mat: 'Übungsmaterial (abgeleitet)', sup: 'Unterstützung (Adjustment, Hands-on) – abgeleitet', atm: 'Atmung (abgeleitet)', auf: 'Aufmerksamkeit (abgeleitet)', mus: 'Beanspruchte Muskulatur (abgeleitet)', reg: 'Körperregion', pos: 'Grundhaltung / Position im Raum', dir: 'Bewegungsrichtung der Wirbelsäule', wirk: 'Funktionelle / physiologische Wirkung', en: 'Energetischer Fokus', chakra: 'Zuordnung zu Chakren', ziel: 'Ziel der Praxis' };

(function () {
  const STAND = ['stand', 'prayer', 'arms_up', 'arms_side', 'side_bend', 'twist', 'fold', 'half_fold', 'rollup', 'backbend', 'hips_hands', 'stand_catcow', 'arm_swing', 'knee_lift', 'foot_lift', 'heel_raise', 'weight_shift', 'chair', 'squat', 'warrior1', 'warrior2', 'goddess', 'tree', 'eagle', 'sideangle', 'lunge', 'warrior3s', 'tandem', 'wide_stand', 'gomukhasana', 'plank_wall', 'pyramid', 'triangle', 'half_moon', 'hand_to_toe', 'bird', 'crescent', 'leg_side'];
  const SIT = ['sit', 'sit_arms', 'sit_shoulder', 'sit_neck', 'sit_elbow', 'sit_side', 'sit_twist', 'sit_leg', 'longsit', 'butterfly_sit', 'janu', 'seated_fold', 'wide_seat', 'turtle', 'hero', 'gomukhasana_sit', 'malasana'];
  const LIE = ['bridge', 'supine_knee', 'leg_stretch', 'twist_supine', 'butterfly_lying', 'heart_supine', 'savasana', 'supine_bent', 'happy_baby', 'cobra', 'sphinx', 'bow', 'locust', 'updog', 'supta_hero', 'legs_wall', 'wheel'];
  const KNEE = ['quad_cat', 'quad_diag', 'child', 'anahatasana', 'lizard', 'pigeon', 'swan', 'camel', 'half_splits', 'splits'];
  const INV = ['headstand', 'shoulderstand', 'plow', 'handstand', 'forearm', 'scorpion', 'viparita', 'legs_wall', 'downdog'];
  const STUTZ = ['plank_hi', 'chatur', 'sideplank', 'plank_floor'];
  const BALP = ['tree', 'eagle', 'warrior3s', 'tandem', 'half_moon', 'hand_to_toe', 'bird', 'crow', 'leg_side', 'knee_lift', 'foot_lift'];
  const RUECK = ['backbend', 'bridge', 'cobra', 'sphinx', 'bow', 'locust', 'updog', 'camel', 'wheel', 'heart_supine', 'supta_hero', 'anahatasana', 'pigeon'];
  const VOR = ['fold', 'half_fold', 'rollup', 'seated_fold', 'janu', 'wide_seat', 'turtle', 'child', 'pyramid', 'half_splits', 'swan'];
  const DREH = ['twist', 'twist_supine', 'sit_twist'];
  const SEIT = ['side_bend', 'sit_side', 'triangle', 'sideangle', 'half_moon', 'sideplank'];
  const SCHLUSS = ['apanasana', 'kindhaltung', 'kind_breit', 'beine_wand', 'schmetterling_liegend', 'drehung_liegend', 'bein_strecken', 'knie_kreisen_liegend', 'makarasana', 'twisted_roots', 'drehsitz_liegend', 'herzoeffnung_liegend', 'offene_fluegel', 'unterstuetzter_fisch', 'happy_baby', 'sattel', 'seehund', 'nadeloehr', 'schmetterling_vorbeuge', 'viparita_karani'];
  const AUFW = ['katze_kuh_vier', 'sonnengruss', 'mondgruss', 'dancing_warrior', 'adho_mukha', 'ashwa', 'tadasana', 'halbmond_chakra'];
  // Chakra laut Skript (Modul 3, Inhaltsverzeichnis)
  const CHAKRA_SKRIPT = {
    baum: 'muladhara', pyramide: 'muladhara', weite_vorbeuge: 'muladhara',
    katze_kuh_vier: 'svadhisthana', schmetterling_sitz: 'svadhisthana', schmetterling_liegend: 'svadhisthana', upavistha: 'svadhisthana', paschimottanasana: 'svadhisthana',
    dhanurasana: 'manipura', urdhva_dhanurasana: 'manipura', halbmond_chakra: 'manipura',
    halasana: 'anahata', halasana_wand: 'anahata', sarvangasana: 'anahata', niralamba: 'anahata', matsyasana: 'anahata', camatkarasana: 'anahata',
    ustrasana: 'vishuddha', sirsasana: 'sahasrara', mukta_hasta: 'sahasrara'
  };
  // Feinkorrekturen (id → Felder überschreiben)
  const OVERRIDE = {
    tadasana: { pos: ['stehen'] }, adho_mukha: { pos: ['umkehr'], dir: ['vor'] },
    gewichtsverlagerung: { pos: ['stehen', 'balance'] }
  };
  const inRe = (re, id) => re.test(id);
  EX.forEach(e => {
    const p = e.pose, t = e.t || [], id = e.id, c = e.c;
    const pos = [];
    if (INV.includes(p)) pos.push('umkehr');
    if (STAND.includes(p)) pos.push('stehen');
    if (SIT.includes(p)) pos.push('sitzen');
    if (LIE.includes(p)) pos.push('liegen');
    if (KNEE.includes(p)) pos.push('knien');
    if (STUTZ.includes(p)) pos.push('stuetz');
    if (c === 'balance' || BALP.includes(p) && c !== 'kraft' && c !== 'mobi_stand' || ['knieheben_tab', 'einbeinig_abheben', 'knieheben_stand', 'einbein_knieheben', 'beinheben_seit', 'beinheben_halt'].includes(id)) pos.push('balance');
    const dir = [];
    if (RUECK.includes(p)) dir.push('rueck');
    if (VOR.includes(p)) dir.push('vor');
    if (DREH.includes(p) || inRe(/parivrtta|drehsitz|twist|drehung|meru|makarasana|matsyendra|^reh$|kati_|sufi|drehschwingen|shava_udara/, id)) dir.push('dreh');
    if (SEIT.includes(p) || inRe(/seitneig|tiryaka|halbe_libelle/, id)) dir.push('seit');
    const ziel = [];
    if (['mobi_sitz', 'mobi_stand', 'flow'].includes(c) || AUFW.includes(id)) ziel.push('aufwaerm');
    if (e.lv >= 3 && e.script) ziel.push('peak');
    if (SCHLUSS.includes(id) || ((e.st || []).includes('yin') && t.includes('ruhe'))) ziel.push('schluss');
    const wirk = [];
    if (c === 'kraft' || t.includes('kraft') || t.includes('energie') || STUTZ.includes(p)) wirk.push('kraeftig');
    if (dir.length || t.includes('huefte') || t.includes('schulter') || t.includes('nacken') || t.includes('loslassen')) wirk.push('dehnend');
    if (t.includes('ruhe') || (e.st || []).includes('yin') || ziel.includes('schluss')) wirk.push('regen');
    let en = '';
    const calm = wirk.includes('regen') || t.includes('ruhe') || t.includes('loslassen');
    const act = t.includes('energie') || t.includes('kraft') || c === 'kraft' || dir.includes('rueck');
    if (calm && !act) en = 'langhana'; else if (act && !(wirk.includes('regen') && !t.includes('energie') && !t.includes('kraft'))) en = 'brahmana';
    let chakra = [], chakraSrc = '';
    if (CHAKRA_SKRIPT[id]) { chakra = [CHAKRA_SKRIPT[id]]; chakraSrc = 'skript'; }
    else if (t.includes('herz')) { chakra = ['anahata']; chakraSrc = 'regel'; }
    else if (t.includes('huefte')) { chakra = ['svadhisthana']; chakraSrc = 'regel'; }
    else if (t.includes('wurzel')) { chakra = ['muladhara']; chakraSrc = 'regel'; }
    e.kat = Object.assign({ pos, dir, wirk, en, chakra, ziel }, OVERRIDE[id] || {});
    e.chakraSrc = chakraSrc;
    e.peak = e.kat.ziel.includes('peak');
    if (!e.kat.pos.length) e.kat.pos = ['stehen'];
  });
  // Körperregionen: aus Schlagworten (huefte, schulter, nacken, herz, ruecken …), Haltung und Namen abgeleitet
  const LEGP = ['chair', 'squat', 'warrior1', 'warrior2', 'goddess', 'lunge', 'warrior3s', 'pyramid', 'triangle', 'half_moon', 'hand_to_toe', 'crescent', 'leg_side', 'leg_stretch', 'seated_fold', 'janu', 'wide_seat', 'splits', 'half_splits', 'fold', 'half_fold', 'legs_wall', 'tree', 'tandem', 'knee_lift', 'hero', 'supta_hero', 'longsit', 'sit_leg', 'malasana', 'lizard', 'pigeon', 'swan', 'bird', 'heel_raise', 'foot_lift', 'downdog', 'sideangle', 'weight_shift', 'turtle', 'plow', 'bridge', 'butterfly_sit', 'butterfly_lying'];
  const ARMP = ['plank_hi', 'chatur', 'sideplank', 'plank_floor', 'plank_wall', 'handstand', 'forearm', 'scorpion', 'crow', 'downdog', 'updog', 'wheel', 'sit_shoulder', 'gomukhasana', 'gomukhasana_sit', 'eagle', 'arms_up', 'arms_side', 'arm_swing'];
  EX.forEach(e => {
    const t = e.t || [], id = e.id, p = e.pose, k = e.kat, r = [];
    if (t.includes('nacken') || ['sit_neck', 'shoulderstand', 'plow', 'headstand', 'camel', 'forearm'].includes(p) || /matsya|fisch|sarvang|niralamba|halasana|sirsasana|mukta|ustra/.test(id)) r.push('nacken');
    if (t.includes('schulter') || ARMP.includes(p) || /schulter|arme|fluegel|adler|liegestuetz/.test(id)) r.push('schulter');
    if (/finger|haende|handgelenk|ellenbogen|plank|phalak|chatur|vasisth|handstand|pincha|vrishik|kakasana|krahe|fliegende|wand_liegestuetz/.test(id)) r.push('haende');
    if (t.includes('herz') || /anahata|matsya|ustra|urdhva|camatk|kobra|sphinx|seehund|herzoeff|fisch|bogen|dhanur/.test(id)) r.push('brust');
    if (t.includes('ruecken') || (k.dir && k.dir.length)) r.push('ruecken');
    if (/bauch|bebo|phalak|chatur|vasisth|vierfuessler|wand_liegestuetz|apanasana|jhulana|shava_udara|twist|dreh|boot|kakasana|kati_/.test(id) || ['plank_hi', 'chatur', 'sideplank', 'plank_floor', 'quad_diag'].includes(p)) r.push('bauch');
    if (t.includes('huefte') || /becken|bebo/.test(id)) r.push('huefte');
    if (LEGP.includes(p) || /bein|knie|fersen|beine/.test(id)) r.push('beine');
    if (/fu(ss|ess)|zehen|fersen|knie|kniebeug|virasana|malasana|sit_leg/.test(id) || ['heel_raise', 'foot_lift', 'sit_leg', 'hero', 'supta_hero'].includes(p) || (t.includes('wurzel') && /stand|tadasana|tandem|gewicht/.test(id))) r.push('fuss');
    if (e.c === 'flow' || e.c === 'balance' || /sonnengruss|mondgruss|dancing|tadasana|adho_mukha|handstand|sirsasana|mukta|katze_kuh|vierfuessler|sarvang|niralamba|viparita/.test(id)) r.push('ganz');
    k.reg = r.length ? [...new Set(r)] : ['ganz'];
  });
  // Muskeln: aus Körperregion, Haltung und Name abgeleitet (grobe Einordnung, nicht aus dem Skript übernommen)
  const QUAD = ['chair', 'squat', 'warrior1', 'warrior2', 'goddess', 'lunge', 'crescent', 'hero', 'supta_hero', 'camel', 'bow', 'knee_lift', 'tandem', 'weight_shift'];
  const HAMS = ['fold', 'half_fold', 'rollup', 'seated_fold', 'janu', 'pyramid', 'half_splits', 'splits', 'plow', 'downdog', 'legs_wall', 'leg_stretch', 'wide_seat', 'turtle'];
  const ADDU = ['goddess', 'wide_seat', 'butterfly_sit', 'butterfly_lying', 'happy_baby', 'malasana', 'sideangle', 'wide_stand', 'splits'];
  EX.forEach(e => {
    const k = e.kat, id = e.id, p = e.pose, rg = k.reg || [], m = [];
    if (rg.includes('nacken') || rg.includes('schulter')) m.push('nackenm');
    if (rg.includes('haende') || ['plank_hi', 'chatur', 'sideplank', 'plank_floor', 'plank_wall', 'handstand', 'forearm', 'updog', 'crow', 'arm_swing', 'arms_up', 'arms_side'].includes(p)) m.push('arme');
    if (rg.includes('brust')) m.push('brust');
    if ((k.dir || []).includes('rueck') || (k.dir || []).includes('seit') || (k.dir || []).includes('dreh') || rg.includes('ruecken') && e.c === 'kraft') m.push('rueckenm');
    if (rg.includes('bauch')) m.push('bauchm');
    if (/becken|bebo/.test(id)) m.push('beckenb');
    if (rg.includes('huefte')) m.push('gesaess');
    if (QUAD.includes(p) || /kniebeug|ausfall/.test(id)) m.push('quad');
    if (HAMS.includes(p) || (k.dir || []).includes('vor')) m.push('hams');
    if (ADDU.includes(p) || /skandasana|schmetterling|frosch/.test(id)) m.push('adduk');
    if (rg.includes('fuss') || ['heel_raise', 'foot_lift', 'downdog', 'pyramid'].includes(p) || /fersen|zehen|fuss/.test(id)) m.push('waden');
    k.mus = [...new Set(m)];
  });
  // Atmung und Aufmerksamkeit: aus Katalog-Art, Schlagworten (Wurzel, Balance, Herz, Ruhe, Loslassen, Energie, Kraft, Mobi) und Wirbelsäulen-Richtung abgeleitet – grobe Einordnung, nicht wörtlich aus dem Skript
  EX.forEach(e => {
    const k = e.kat, t = e.t || [], c = e.c, a = [], f = [];
    if (['mobi_sitz', 'mobi_stand', 'flow'].includes(c) || t.includes('mobi')) a.push('folgt');
    if (['stand', 'balance', 'boden'].includes(c) && !t.includes('mobi')) a.push('halten');
    if (t.includes('ruhe') || t.includes('loslassen') || (k.ziel || []).includes('schluss')) a.push('tief');
    if (t.includes('herz') || (k.dir || []).some(x => ['rueck', 'seit', 'dreh'].includes(x))) a.push('weit');
    if (c === 'kraft' || t.includes('kraft')) a.push('kraft');
    if (t.includes('mobi') || t.includes('loslassen')) f.push('spueren');
    if (t.includes('wurzel')) f.push('wurzel');
    if (t.includes('balance') || c === 'balance') f.push('balance');
    if (t.includes('kraft') || c === 'kraft' || c === 'stand') f.push('ausricht');
    if (t.includes('ruhe') || t.includes('loslassen')) f.push('loslass');
    if (t.includes('energie')) f.push('energie');
    if (t.includes('herz')) f.push('herz');
    k.atm = [...new Set(a)]; k.auf = [...new Set(f)];
  });
  // Unterstützung (Adjustment / Hands-on Support / Assistance): aus Haltung, Katalog-Art und Schlagworten abgeleitet – pädagogische Grobeinordnung, nicht aus dem Skript. Berührung immer nur nach Einverständnis der Teilnehmenden.
  EX.forEach(e => {
    const k = e.kat, t = e.t || [], c = e.c, pos = k.pos || [], dir = k.dir || [], s = [];
    if (pos.includes('umkehr') || pos.includes('balance') || c === 'balance' || e.peak || ['crow', 'handstand', 'forearm', 'scorpion', 'headstand', 'shoulderstand', 'plow', 'wheel'].includes(e.pose)) s.push('support');
    if (['stand', 'boden', 'kraft'].includes(c) && !t.includes('mobi') && (c !== 'boden' || e.lv >= 2 || dir.length || pos.includes('stehen'))) s.push('adjust');
    if (t.includes('ruhe') || (e.st || []).includes('yin') || (k.ziel || []).includes('schluss') || (t.includes('loslassen') && pos.includes('liegen'))) s.push('assist');
    k.sup = s.length ? [...new Set(s)] : ['keine'];
  });
  // Übungsmaterial: Yogamatte für alle Übungen; Hilfsmittel (Decke, Kissen, Block, Gurt, Stuhl, Wand) aus Beschreibungstexten und Haltung abgeleitet – übliche Praxis, nicht wörtlich aus dem Skript. Als Zusatzmaterial gilt alles außer der Matte.
  const MAT_P = {
    decke: ['seated_fold', 'janu', 'wide_seat', 'butterfly_sit', 'hero', 'supta_hero', 'shoulderstand', 'plow', 'headstand', 'legs_wall', 'savasana', 'viparita', 'heart_supine', 'butterfly_lying', 'sit_twist'],
    kissen: ['butterfly_lying', 'supta_hero', 'legs_wall', 'child', 'pigeon', 'swan', 'heart_supine', 'viparita', 'bridge'],
    block: ['triangle', 'half_moon', 'pyramid', 'half_splits', 'splits', 'lizard', 'sideangle', 'bird', 'hand_to_toe', 'camel', 'wheel', 'downdog', 'crescent'],
    gurt: ['seated_fold', 'janu', 'leg_stretch', 'hand_to_toe', 'happy_baby', 'longsit', 'wide_seat', 'bow'],
    wand: ['legs_wall', 'plank_wall', 'handstand', 'forearm']
  };
  const MAT_K = { decke: /Decke/i, kissen: /Kissen|Bolster|Polster/i, block: /\bBlock\b|Klotz|Ziegel/i, gurt: /Gurt|Handtuch/i, stuhl: /Stuhl(?!haltung|gruß)|Sessel/i, wand: /\bWand\b/i };
  EX.forEach(e => {
    const txt = [e.d, e.w, e.how, e.ev].filter(Boolean).join(' '), m = ['matte'];
    Object.keys(MAT_K).forEach(k => { if (MAT_K[k].test(txt) || (MAT_P[k] || []).includes(e.pose)) m.push(k); });
    e.kat.mat = [...new Set(m)];
  });
})();
const peakStar = e => (e && e.peak) ? '<span class="star" title="Peak Pose (Gipfelposition)">★</span>' : '';
const katLabels = (e, k) => { const v = e.kat && e.kat[k]; return (Array.isArray(v) ? v : v ? [v] : []).map(x => KAT[k][x]).filter(Boolean); };
