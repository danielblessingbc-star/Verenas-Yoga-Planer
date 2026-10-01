/* Übungskatalog – ausschließlich Übungen aus den Unterlagen (Übersicht Herbst-Winter 2026, Stunden 1 und 2, Flow-Blätter, Kursplan mit den 15 Kraftübungen).
   KEINE erfundenen Übungen ergänzen. Neue Übungen nur über „Eigene Übung hinzufügen“ in der App.
   lv: 1 = Anfänger, 2 = Mittel, 3 = Fortgeschritten. x = Gebrechen, bei denen die Übung ausgeschlossen wird.
   e = leichtere Variante, h = anspruchsvollere Variante (jeweils nur Übungen aus diesem Katalog). */
const LEVELS = { anf: 'Anfänger', mittel: 'Mittel', fort: 'Fortgeschritten', gemischt: 'Gemischt', sen: 'Senioren' };
const GEBRECHEN = {
  schulter: 'Schulter', nacken: 'Nacken', handgelenk: 'Handgelenk', ruecken: 'Rücken / LWS', huefte: 'Hüfte', knie: 'Knie',
  fuss: 'Fuß / Sprunggelenk', schwindel: 'Gleichgewicht / Schwindel', blutdruck: 'Bluthochdruck', osteoporose: 'Osteoporose'
};
const CATS = {
  mobi_sitz: 'Mobilisation im Sitzen', mobi_stand: 'Mobilisation im Stand', flow: 'Flow / Aufwärmen im Stand',
  stand: 'Asanas im Stand', balance: 'Balance', kraft: 'Kraftübung', boden: 'Ausgleich (Rückenlage, Boden)', shakti: 'Shakti Naam'
};

const EX = [];
function X(id, n, c, lv, m, pose, tags, x, e, h, o) {
  EX.push(Object.assign({
    id, n, c, lv, m, pose, t: tags ? tags.split(' ') : [], x: x ? x.split(' ') : [], e: e || '', h: h || '',
    s: 1, o: EX.length
  }, o || {}));
}

// --- Mobilisation im Sitzen (Pawanmuktasana-Folge, Stunde 1) ---
X('fuss_reiben', 'Füße reiben + Beine ausklopfen', 'mobi_sitz', 1, 1, 'sit_leg', 'mobi wurzel');
X('fuss_flex', 'Fuß ex./flex.', 'mobi_sitz', 1, 1, 'longsit', 'mobi wurzel', '', '', 'fussgelenk');
X('fussgelenk', 'Fußgelenke kreisen', 'mobi_sitz', 1, 1, 'longsit', 'mobi wurzel', '', 'fuss_flex');
X('knie_flex', 'Knie ex./flex.', 'mobi_sitz', 1, 1, 'sit_leg', 'mobi', '', '', 'knie_kreise');
X('knie_kreise', 'Knie kreisen', 'mobi_sitz', 1, 1, 'sit_leg', 'mobi', 'knie', 'knie_flex');
X('bein_anwinkeln', 'Ein Bein anwinkeln und zur Seite beugen', 'mobi_sitz', 1, 1, 'sit_leg', 'mobi huefte', '', '', 'huefte_kreis');
X('huefte_kreis', 'Angewinkeltes Bein kreisen (Hüft-Mobi)', 'mobi_sitz', 1, 1, 'sit_leg', 'mobi huefte', 'huefte knie', 'bein_anwinkeln');
X('schmetterling_sitz', 'Schmetterling', 'mobi_sitz', 1, 1, 'butterfly_sit', 'huefte loslassen', 'huefte knie', 'bein_anwinkeln');
X('finger_faust', 'Arme ausstrecken, Finger spreizen – Faust', 'mobi_sitz', 1, 1, 'sit_arms', 'mobi');
X('haende_flex', 'Hände ex./flex.', 'mobi_sitz', 1, 1, 'sit_arms', 'mobi', '', '', 'handgelenk_kreis');
X('handgelenk_kreis', 'Handgelenke kreisen', 'mobi_sitz', 1, 1, 'sit_arms', 'mobi', 'handgelenk', 'haende_flex');
X('ellenbogen', 'Ellenbogen ex./flex.', 'mobi_sitz', 1, 1, 'sit_elbow', 'mobi');
X('schulter_kreis', 'Schultern kreisen (Fingerkuppen auf Schultern)', 'mobi_sitz', 1, 1, 'sit_shoulder', 'mobi schulter', 'schulter');
X('nacken_mobi', 'Nacken-Mobi', 'mobi_sitz', 1, 1, 'sit_neck', 'mobi nacken', 'nacken');

// --- Mobilisation im Stand (Stunden 1, 2, Übersicht) ---
X('zehen_bewegen', 'Zehen bewegen (spreizen + entspannen)', 'mobi_stand', 1, 1, 'stand', 'wurzel');
X('fuesse_lockern', 'Füße lockern / Beine ausschütteln', 'mobi_stand', 1, 1, 'stand', 'wurzel loslassen');
X('fersen_heben', 'Fersenheben / Zehenstand', 'mobi_stand', 1, 1, 'heel_raise', 'wurzel balance kraft', 'fuss schwindel');
X('fussgelenke_stand', 'Fußgelenke kreisen (im Wechsel)', 'mobi_stand', 1, 1, 'foot_lift', 'wurzel mobi', 'schwindel');
X('knie_leicht', 'Knie leicht beugen', 'mobi_stand', 1, 1, 'squat', 'wurzel mobi', 'knie');
X('katze_kuh_stand', 'Katze-Kuh im Stand', 'mobi_stand', 1, 1, 'stand_catcow', 'ruecken loslassen mobi');
X('beckenkreisen', 'Beckenkreisen', 'mobi_stand', 1, 1, 'hips_hands', 'huefte loslassen mobi');
X('schultern_stand', 'Schultern kreisen (im Stand)', 'mobi_stand', 1, 1, 'stand', 'schulter mobi', 'schulter');
X('arme_kreisen', 'Arme kreisen (Verbindung Atem)', 'mobi_stand', 1, 1, 'arms_up', 'atem herz mobi', 'schulter');
X('arme_atem', 'Arme mit dem Atem führen', 'mobi_stand', 1, 1, 'arms_up', 'atem herz licht', 'schulter');
X('arme_oeffnen', 'Arme öffnen und schließen', 'mobi_stand', 1, 1, 'arms_side', 'herz atem');
X('seitneigung', 'Seitneigung dyn./statisch', 'mobi_stand', 1, 1, 'side_bend', 'herz atem ruecken licht');
X('seitdrehung', 'Seitdrehung (Arme öffnen – Rotation – Mitte)', 'mobi_stand', 1, 1, 'twist', 'ruecken loslassen mobi', 'osteoporose');
X('arme_einzeln', 'Arme einzeln schwingen (Knie wippen)', 'mobi_stand', 1, 1, 'arm_swing', 'energie mobi', '', '', 'arme_beide');
X('arme_beide', 'Arme gleichzeitig schwingen (Zehenspitzen)', 'mobi_stand', 1, 1, 'arms_up', 'energie mobi', 'schulter', 'arme_einzeln');
X('knieheben_tab', 'Knieheben mit Tab', 'mobi_stand', 1, 1, 'knee_lift', 'balance energie', 'knie huefte schwindel');

// --- Flow / Aufwärmen im Stand ---
X('tadasana', 'Tadasana', 'flow', 1, 1, 'stand', 'wurzel atem balance licht');
X('rueckbeuge_leicht', 'Leichte Rückbeuge', 'flow', 1, 1, 'backbend', 'herz licht energie', 'ruecken');
X('halbe_vorbeuge', 'Halbe Vorbeuge', 'flow', 1, 1, 'half_fold', 'ruecken kraft loslassen', '', '', 'vorbeuge');
X('vorbeuge', 'Vorbeuge (Knie gebeugt)', 'flow', 1, 1, 'fold', 'loslassen ruhe ruecken', 'ruecken osteoporose blutdruck schwindel', 'halbe_vorbeuge', 'weite_vorbeuge');
X('weite_vorbeuge', 'Weite Vorbeuge', 'flow', 1, 1, 'fold', 'loslassen ruhe ruecken', 'ruecken osteoporose blutdruck schwindel', 'vorbeuge');
X('vorbeuge_aushaengen', 'Vorbeuge (Aushängen)', 'flow', 1, 1, 'fold', 'loslassen ruhe', 'ruecken osteoporose blutdruck schwindel', 'halbe_vorbeuge');
X('wirbel_aufrollen', 'Wirbel für Wirbel aufrollen', 'flow', 1, 1, 'rollup', 'loslassen ruecken', 'ruecken osteoporose blutdruck schwindel', 'halbe_vorbeuge');
X('gewichtsverlagerung', 'Gewichtsverlagerung r/l – vor/zurück', 'flow', 1, 1, 'weight_shift', 'balance wurzel');
X('einbeinig_abheben', '1 Fuß abheben im Wechsel', 'flow', 1, 1, 'foot_lift', 'balance wurzel', 'fuss schwindel', 'gewichtsverlagerung');
X('twist_stand', 'Twist im Stehen', 'flow', 1, 1, 'twist', 'ruecken loslassen', 'osteoporose');
X('sonnengruss', 'Sonnengruß (seniorengerecht)', 'flow', 1, 3, 'arms_up', 'energie licht dankbarkeit herz', 'schulter schwindel');

// --- Asanas im Stand ---
X('arme_zur_sonne', 'Arme zur Sonne', 'stand', 1, 1, 'arms_up', 'licht herz energie atem', 'schulter');
X('utkatasana', 'Stuhl (sanfte Utkatasana)', 'stand', 1, 2, 'chair', 'kraft energie wurzel', 'knie schulter', '', 'utkatasana_halten');
X('goettin', 'Göttin (dynamisch / statisch)', 'stand', 1, 2, 'goddess', 'kraft wurzel huefte herz', 'knie huefte');
X('krieger2', 'Krieger II (dynamisch / statisch)', 'stand', 1, 2, 'warrior2', 'kraft wurzel balance huefte', 'knie');
X('krieger1', 'Krieger I', 'stand', 1, 2, 'warrior1', 'kraft licht energie wurzel', 'knie schulter blutdruck', 'ausfallschritt');
X('seitwinkel', 'Sanfter Seitwinkel', 'stand', 1, 2, 'sideangle', 'kraft herz licht huefte', 'knie');
X('adlerarme', 'Adlerarme', 'stand', 1, 1, 'eagle', 'herz schulter loslassen', 'schulter', '', 'gomukhasana_arme');
X('gomukhasana_arme', 'Gomukhasana-Arme', 'stand', 2, 1, 'gomukhasana', 'schulter herz', 'schulter', 'adlerarme');
X('knieheben_stand', 'Stehendes Knieheben', 'stand', 1, 2, 'knee_lift', 'balance kraft energie wurzel', 'knie huefte schwindel', 'gewichtsverlagerung', 'einbein_knieheben');
X('ausfallschritt', 'Angepasster Ausfallschritt', 'stand', 1, 2, 'lunge', 'kraft huefte', 'knie', 'gewichtsverlagerung', 'krieger1');
X('ausfall_klein', 'Kleiner Ausfallschritt (Hüftbeugerdehnung)', 'stand', 1, 1, 'lunge', 'huefte loslassen', 'knie');
X('stand_boden', 'Stand-zu-Boden-Übergänge', 'stand', 1, 2, 'lunge', 'kraft wurzel', 'knie schwindel huefte osteoporose');

// --- Balance ---
X('tandem', 'Tandemstand', 'balance', 1, 2, 'tandem', 'balance wurzel', 'schwindel', 'gewichtsverlagerung', 'baum');
X('baum', 'Baum (mit Varianten)', 'balance', 1, 2, 'tree', 'balance wurzel licht', 'knie schwindel', 'tandem');
X('krieger3_unt', 'Unterstützter Krieger III', 'balance', 2, 2, 'warrior3s', 'balance kraft energie', 'schwindel knie blutdruck', 'knieheben_stand');

// --- Kraftübungen (Beschreibung, Wirkung, leichtere Variante wörtlich aus dem Kursplan) ---
X('kniebeugen', 'Langsame Kniebeugen', 'kraft', 1, 3, 'squat', 'kraft wurzel energie', 'knie', '', 'kniebeuge_fersen', {
  reps: '2 × 8–10', how: 'Füße hüftbreit, Gesäß nach hinten, Knie beugen und kontrolliert aufrichten.',
  w: 'Kräftigt Oberschenkel und Gesäß; unterstützt Aufstehen, Treppen und Standfestigkeit.',
  ev: 'Bei Kniebeschwerden weniger tief; Hände bei Bedarf an einer stabilen Unterstützung.'
});
X('fersen_kraft', 'Fersenheben im Stand', 'kraft', 1, 3, 'heel_raise', 'kraft wurzel', 'fuss schwindel', '', '', {
  reps: '2 × 10–15', how: 'Fersen langsam heben, oben kurz halten und kontrolliert senken.',
  w: 'Kräftigt Waden und unterstützt Fuß- und Sprunggelenksstabilität.', ev: 'Eine Hand an der Wand; nur so hoch gehen, wie sicher.'
});
X('beinheben_seit', 'Seitliches Beinheben', 'kraft', 1, 3, 'leg_side', 'kraft huefte balance', 'huefte schwindel', '', 'beinheben_halt', {
  reps: '2 × 8–12 je Seite', how: 'Eine Hand zur Stabilisierung; Bein langsam seitlich heben und senken.',
  w: 'Kräftigt seitliche Gesäßmuskulatur und Hüftstabilisatoren.', ev: 'Kleine Bewegung; Fußspitze nach vorne.'
});
X('beinheben_halt', 'Seitliches Beinheben mit Haltephase', 'kraft', 2, 3, 'leg_side', 'kraft huefte balance', 'huefte schwindel', 'beinheben_seit', '', {
  reps: '2 × 8 je Seite', how: 'Bein seitlich heben, 2–3 Sek. halten und langsam senken.',
  w: 'Stärkt Hüftstabilisatoren und verbessert die Kontrolle des Standbeins.', ev: 'Hand an der Wand, kleiner Bewegungsumfang.'
});
X('utkatasana_halten', 'Utkatasana halten (sanfte Stuhlhaltung)', 'kraft', 2, 3, 'chair', 'kraft wurzel', 'knie schulter', 'utkatasana', '', {
  reps: '2–3 Durchgänge', how: 'Knie leicht beugen, Gesäß zurück, Brustbein aufrichten; 15–20 Sek. halten.',
  w: 'Kräftigt Oberschenkel, Gesäß und Rumpf.', ev: 'Nur leicht beugen; bei Knieproblemen höher bleiben.'
});
X('einbein_knieheben', 'Einbeiniger Stand mit Knieheben', 'kraft', 2, 3, 'knee_lift', 'kraft balance wurzel', 'knie huefte schwindel', 'knieheben_stand', '', {
  reps: '2 × 6–8 je Seite', how: 'Knie langsam heben, 2–3 Atemzüge halten und kontrolliert absetzen.',
  w: 'Kräftigt Standbein, Hüfte und Rumpf und verbindet Kraft mit Balance.', ev: 'Freier Fuß darf mit den Zehen am Boden bleiben; Wand nutzen.'
});
X('bruecke', 'Brücke', 'kraft', 1, 3, 'bridge', 'kraft herz licht', 'nacken blutdruck', 'bruecke_sanft', 'bruecke_halten', {
  reps: '2 × 8–12', how: 'Becken langsam heben, Gesäß aktivieren, kurz halten und abrollen.',
  w: 'Kräftigt Gesäß, hintere Beine und Rücken.', ev: 'Bei Rückenbeschwerden kleiner Bewegungsumfang.'
});
X('bruecke_halten', 'Brücke mit Haltephase', 'kraft', 2, 3, 'bridge', 'kraft ruhe', 'nacken blutdruck', 'bruecke', '', {
  reps: '2 Durchgänge', how: 'Becken heben und 20–30 Sek. ruhig halten.',
  w: 'Fördert Kraftausdauer von Gesäß und hinterer Beinmuskulatur.', ev: 'Kürzer halten oder dynamisch ausführen.'
});
X('wand_liegestuetz', 'Wand-Liegestütz', 'kraft', 1, 3, 'plank_wall', 'kraft energie herz', 'handgelenk schulter', '', '', {
  reps: '2 × 8–12', how: 'Hände an die stabile Wand, Körper lang; Ellbogen beugen, Brust zur Wand führen und wegdrücken.',
  w: 'Kräftigt Brust, Arme und Schultergürtel.', ev: 'Je aufrechter der Körper, desto leichter; Schultern weg von den Ohren.'
});
X('vierfuessler_diag', 'Vierfüßler diagonal', 'kraft', 1, 3, 'quad_diag', 'kraft balance ruecken', 'handgelenk knie schulter', '', '', {
  reps: '2 × 6–8 je Seite', how: 'Gegenüberliegenden Arm und Bein verlängern, kurz halten, wechseln.',
  w: 'Kräftigt Rücken, Gesäß und tiefe Rumpfmuskulatur; fördert Koordination.', ev: 'Zunächst nur einen Arm oder ein Bein bewegen.'
});
X('aufstehen_hinsetzen', 'Aufstehen und Hinsetzen', 'kraft', 1, 3, 'squat', 'kraft wurzel energie', 'knie', '', '', {
  reps: '2 × 6–10', how: 'Von einer stabilen Sitzfläche langsam aufstehen und kontrolliert wieder absetzen.',
  w: 'Sehr alltagsnah: kräftigt Oberschenkel und Gesäß und fördert funktionelle Beinkraft.', ev: 'Bei Bedarf Hände leicht auf Oberschenkeln oder stabile Unterstützung nutzen.'
});
X('kniebeuge_fersen', 'Kniebeuge + Fersenheben', 'kraft', 2, 3, 'squat', 'kraft balance energie', 'knie schwindel fuss', 'kniebeugen', '', {
  reps: '2 × 8–10', how: 'Kniebeuge, aufrichten, auf die Zehenspitzen kommen, Fersen senken.',
  w: 'Verbindet Oberschenkel-, Gesäß- und Wadenkraft.', ev: 'Bei Balanceproblemen Wandkontakt; Bewegung kleiner gestalten.'
});
X('bauchspannung', 'Sanfte Bauchspannung (Rückenlage)', 'kraft', 1, 3, 'supine_bent', 'kraft ruhe ruecken', '', '', '', {
  reps: '2 Durchgänge', how: 'In Rückenlage beim Ausatmen Bauch sanft aktivieren und 20–30 Sek. halten, ohne Luft anzuhalten.',
  w: 'Kräftigt tiefe Rumpfmuskulatur und unterstützt Rumpfstabilität.', ev: 'Keine Beinbewegung nötig; nur sanfte Aktivierung.'
});

// --- Ausgleich / Cool down ---
X('katze_kuh_vier', 'Katze-Kuh im Vierfüßler', 'boden', 1, 1.5, 'quad_cat', 'ruecken loslassen mobi', 'handgelenk knie');
X('kindhaltung', 'Kindhaltung (Nachspüren)', 'boden', 1, 1.5, 'child', 'ruhe loslassen', 'knie huefte');
X('kind_breit', 'Breite Kindhaltung', 'boden', 1, 1.5, 'child', 'ruhe loslassen huefte', 'knie huefte');
X('anahatasana', 'Anahatasana', 'boden', 2, 1.5, 'anahatasana', 'herz licht schulter', 'schulter knie handgelenk');
X('sphinx', 'Sphinx', 'boden', 1, 1.5, 'sphinx', 'herz licht energie', '', '', 'kobra');
X('kobra', 'Sanfte Kobra', 'boden', 2, 1.5, 'cobra', 'herz licht energie', 'handgelenk ruecken', 'sphinx');
X('janu', 'Janu Sirsasana', 'boden', 2, 1.5, 'janu', 'loslassen ruhe huefte ruecken', 'ruecken knie osteoporose');
X('malasana_hoch', 'Malasana erhöht', 'boden', 2, 1.5, 'malasana', 'wurzel huefte loslassen', 'knie huefte blutdruck schwindel');
X('apanasana', 'Apanasana – Knie zur Brust (kreisen)', 'boden', 1, 1.5, 'supine_knee', 'loslassen ruhe huefte ruecken');
X('knie_kreisen_liegend', 'Kniekreise (Rückenlage)', 'boden', 1, 1.5, 'supine_knee', 'loslassen huefte ruhe');
X('bein_strecken', 'Bein strecken + dehnen', 'boden', 1, 1.5, 'leg_stretch', 'huefte loslassen ruhe');
X('bruecke_sanft', 'Sanfte Brücke dyn.', 'boden', 1, 1.5, 'bridge', 'herz licht kraft', 'nacken blutdruck', '', 'bruecke');
X('herzoeffnung_liegend', 'Liegende Herzöffnung', 'boden', 1, 1.5, 'heart_supine', 'herz licht atem', 'schulter nacken');
X('schmetterling_liegend', 'Liegender Schmetterling', 'boden', 1, 1.5, 'butterfly_lying', 'huefte ruhe herz loslassen', 'huefte knie');
X('drehung_liegend', 'Drehung in Rückenlage', 'boden', 1, 1.5, 'twist_supine', 'loslassen ruhe ruecken', 'osteoporose');
X('beine_wand', 'Beine an der Wand', 'boden', 1, 2, 'legs_wall', 'ruhe loslassen', 'blutdruck schwindel');

// --- Atem- und Wahrnehmungsübungen (aus Stunden 1 und 2 sowie dem Kursplan) ---
const BR = [];
function B(id, n, k, lv, m, tags, x, t, o) {
  BR.push(Object.assign({ id, n, k, lv, m, t: tags ? tags.split(' ') : [], x: x ? x.split(' ') : [], s: 1, txt: t }, o || {}));
}
B('bauchatmung', 'Tiefe Bauchatmung', 'atem', 1, 5, 'ankommen ruhe wurzel loslassen', '',
  'Bequemer Sitz oder Rückenlage. Eine Hand auf den Bauch, die andere auf die Brust.\nSpüre, wie sich der Bauch mit der Einatmung sanft hebt und mit der Ausatmung wieder senkt.\nAtme ruhig durch die Nase ein und lass den Atem langsam und weich wieder ausströmen.\nNichts erzwingen – der Atem darf von selbst tiefer werden.');
B('verl_ausatmung', 'Verlängerte Ausatmung', 'atem', 1, 5, 'ruhe loslassen ankommen', '',
  'Bequemer Sitz, wenn angenehm eine Hand auf den Bauch, eine auf die Brust.\nSpüre zuerst deinen natürlichen Atem – verändere nichts. Beobachte, wie die Luft von selbst einströmt und wieder ausströmt.\nProbiere nun, die Ausatmung ganz sanft etwas länger werden zu lassen, zum Beispiel 4 Sekunden ein – 6 Sekunden aus.\nNur so lange, wie es angenehm ist. Mit jeder Ausatmung darfst du ein wenig loslassen.\nLass die Zählung wieder los und finde zurück zu deinem natürlichen Atem. Spüre einen Moment nach.');
B('atem_arme', 'Arme mit dem Atem (Atembewegung)', 'atem', 1, 5, 'atem licht energie herz', 'schulter',
  'Mit der Einatmung führst du die Arme langsam nach oben oder zur Seite, mit der Ausatmung lässt du sie sanft wieder sinken.\nDer Atem bestimmt das Tempo der Bewegung. Fünf- bis achtmal, dann ruhig nachspüren.');
B('atemraeume', 'Atemräume wahrnehmen', 'atem', 1, 5, 'atem herz schulter', '',
  'Lege die Hände seitlich an die unteren Rippen.\nAtme so, dass sich die Rippen unter deinen Händen nach außen weiten, und lass sie mit der Ausatmung sanft wieder zusammenkommen.\nSpüre, wie viel Raum in den Flanken und im Rücken entsteht.');
B('atem_beobachten', 'Atem beobachten (stille Atembeobachtung)', 'atem', 1, 5, 'ruhe loslassen balance', '',
  'Beobachte deinen Atem, ohne ihn verändern zu müssen.\nSpüre, wie er kommt und wie er geht. Wenn du abschweifst, kehre sanft zum Atem zurück.');
B('bodenkontakt', 'Bodenkontakt spüren', 'wahr', 1, 4, 'ankommen wurzel ruhe', '',
  'Spüre, welche Körperteile Kontakt zum Boden haben: Fersen, Gesäß, Rücken, Schultern, Hinterkopf.\nNimm wahr, dass der Boden dich trägt – du musst nichts halten.');
B('fuss_wahr', 'Füße spüren – Wahrnehmung im Stehen', 'wahr', 1, 6, 'wurzel balance kraft', '',
  'Füße etwa hüftbreit, Knie locker, Arme entspannt neben dem Körper. Spüre den Boden, gerne mit geschlossenen Augen.\nWie fühlen sich deine Füße am Boden an? Spürst du deine Fersen, deine Fußballen, deine Zehen?\nStell dir vor, dass du mit jeder Ausatmung ein kleines bisschen mehr Gewicht an den Boden abgibst.\nVerlagere dein Gewicht langsam ein wenig nach vorne und wieder zurück, dann nach rechts und nach links – und finde wieder deinen Mittelpunkt.\nDrücke beide Füße ganz sanft in den Boden und spüre, wie sich dein Rücken ganz von selbst etwas aufrichtet. Lass wieder los und spüre nach.');
B('koerperreise', 'Körperreise', 'wahr', 1, 5, 'ruhe loslassen ankommen', '',
  'Wandere mit der Aufmerksamkeit langsam durch den Körper: Füße, Beine, Becken, Bauch, Rücken, Brust, Hände, Arme, Schultern, Nacken, Gesicht.\nVerweile kurz bei jedem Bereich und nimm wahr, ohne etwas zu verändern.');
B('haende_brust', 'Hände auf dem Brustkorb', 'wahr', 1, 4, 'herz dankbarkeit ruhe', '',
  'Lege die Hände auf den Brustkorb. Spüre Wärme und die Bewegung des Atems unter deinen Händen.');
B('dankbarkeit_wahr', 'Atem + Dankbarkeit', 'wahr', 1, 4, 'dankbarkeit herz licht', '',
  'Denke an eine Kleinigkeit, für die du heute dankbar bist.\nSpüre, wie sich das im Körper anfühlt – vielleicht als Wärme in der Brust oder als weicher Atem.');
B('licht_brust', 'Licht im Brustraum visualisieren', 'wahr', 1, 4, 'licht herz energie', '',
  'Stelle dir ein warmes Licht in deinem Brustraum vor.\nMit der Einatmung wird es weit, mit der Ausatmung ruhig.');
B('rueckblick', 'Rückblick', 'wahr', 1, 4, 'dankbarkeit ruhe', '',
  'Blicke auf die vergangenen Stunden zurück: Was hat dir gutgetan? Welche Übungen haben dich begleitet?');

// Sanskrit-Namen – nur dort, wo es einen gängigen Namen gibt (sonst leer lassen, nichts erfinden)
const SA = {
  tadasana: 'Tadasana', utkatasana: 'Utkatasana', utkatasana_halten: 'Utkatasana', goettin: 'Utkata Konasana', krieger1: 'Virabhadrasana I', krieger2: 'Virabhadrasana II',
  krieger3_unt: 'Virabhadrasana III', baum: 'Vrksasana', gomukhasana_arme: 'Gomukhasana (Arme)', adlerarme: 'Garudasana (Arme)', seitwinkel: 'Utthita Parsvakonasana',
  vorbeuge: 'Uttanasana', weite_vorbeuge: 'Prasarita Padottanasana', halbe_vorbeuge: 'Ardha Uttanasana', vorbeuge_aushaengen: 'Uttanasana', sonnengruss: 'Surya Namaskar',
  arme_zur_sonne: 'Urdhva Hastasana', ausfall_klein: 'Anjaneyasana', katze_kuh_vier: 'Marjaryasana / Bitilasana', kindhaltung: 'Balasana', kind_breit: 'Balasana',
  anahatasana: 'Anahatasana', sphinx: 'Salamba Bhujangasana', kobra: 'Bhujangasana', janu: 'Janu Sirsasana', malasana_hoch: 'Malasana', apanasana: 'Apanasana',
  bruecke: 'Setu Bandha Sarvangasana', bruecke_halten: 'Setu Bandha Sarvangasana', bruecke_sanft: 'Setu Bandha Sarvangasana',
  schmetterling_sitz: 'Baddha Konasana', schmetterling_liegend: 'Supta Baddha Konasana', beine_wand: 'Viparita Karani', vierfuessler_diag: 'Dandayamana Bharmanasana'
};
EX.forEach(e => { if (SA[e.id]) e.sa = SA[e.id]; else if (e.c === 'mobi_sitz') e.sa = 'Pawanmuktasana-Folge'; });

// Konsistenzprüfung
(function () {
  const ids = new Set(EX.map(e => e.id));
  EX.forEach(e => {
    ['e', 'h'].forEach(k => { if (e[k] && !ids.has(e[k])) console.warn('Unbekannter Verweis', e.id, k, e[k]); });
    if (typeof POSES !== 'undefined' && !POSES[e.pose]) console.warn('Unbekannte Pose', e.id, e.pose);
  });
})();


