/* Mitgelieferte Sequenzen zum Import in den Sequenzkatalog.
   Jede Sequenz besteht nur aus Übungen des Katalogs; items = [Übungs-ID, Minuten] (ohne Minuten gilt die Katalogzeit).
   Die Reihenfolgen stammen aus den verlinkten Quellen, Beschreibungen sind eigene, knappe Zusammenfassungen.
   Beim Start fügt seqImportMerge() (sequenzen.js) jede Sequenz genau einmal hinzu (state.seqImp merkt sich die imp-ID);
   eine später gelöschte oder geänderte Sequenz kommt nicht wieder. Fehlt eine Übung im Katalog, wird die Sequenz übersprungen. */
const SEQ_IMPORT = [
  {
    imp: 'imp_pawan1', name: 'Pawanmuktasana Teil 1: Gelenkreihe', type: 'mobilisation',
    desc: 'Sanfte Mobilisation aller wichtigen Gelenke von den Zehen bis zum Nacken, im Sitzen. Eignet sich als Einstieg in jede Stunde, besonders für Senioren und bei steifen Gelenken. Jede Bewegung in beide Richtungen und im Rhythmus des Atems üben, den Bewegungsradius ganz ausschöpfen.',
    src: { n: 'Pawanmuktasana nach Satyananda (Bihar School), Übersicht; Yoga Vidya Pavanamuktasana-Reihe', u: 'https://www.doreen-eschler.com/2017/11/12/pawanmuktasana-%C3%BCbersicht-der-%C3%BCbungen/' },
    items: [['zehen_bewegen', 1], ['fuss_flex', 1], ['fussgelenk', 1], ['goolf_ghoornan', 1], ['knie_flex', 1], ['knie_kreise', 1], ['bein_anwinkeln', 1], ['huefte_kreis', 1], ['schmetterling_sitz', 1], ['finger_faust', 1], ['haende_flex', 1], ['handgelenk_kreis', 1], ['ellenbogen', 1], ['schulter_kreis', 1], ['nacken_mobi', 1]]
  },
  {
    imp: 'imp_pawan2', name: 'Pawanmuktasana Teil 2: Bauchreihe', type: 'mobilisation',
    desc: 'Übungen in Rückenlage für Bauch, Hüften und Verdauung: Beine heben, kreisen, Radfahren, Knie zur Brust, Abrollen und liegende Drehung. Zwischen den Übungen mit beiden Knien zur Brust ausruhen. Nicht bei Bluthochdruck, Herzproblemen, nach Bauchoperationen oder in der späten Schwangerschaft.',
    src: { n: 'Pawanmuktasana nach Satyananda (Bihar School), Übersicht; Sanskrit-Namen: Matsya Yoga Academy', u: 'https://www.doreen-eschler.com/2017/11/12/pawanmuktasana-%C3%BCbersicht-der-%C3%BCbungen/' },
    items: [['uttanpadasana', 1.5], ['chakra_padasana', 1.5], ['pada_sanchalanasana', 1.5], ['apanasana', 1.5], ['jhulana', 1.5], ['shava_udara', 1.5]]
  },
  {
    imp: 'imp_pawan3', name: 'Pawanmuktasana Teil 3: Energieblockaden', type: 'mobilisation',
    desc: 'Kräftigere, rhythmische Übungen im Sitzen und in der Hocke, die Spannungen und „Energieblockaden“ lösen: Seilziehen, Drehung, Mahlen, Rudern, Holzhacken, Windentferner und Bauchwringer. Die Hockübungen nicht bei Knie-, Hüft- oder Ischiasbeschwerden; für Senioren eher die sitzenden Übungen wählen.',
    src: { n: 'Pawanmuktasana nach Satyananda (Bihar School), Übersicht', u: 'https://www.doreen-eschler.com/2017/11/12/pawanmuktasana-%C3%BCbersicht-der-%C3%BCbungen/' },
    items: [['rajju_karshanasana', 1.5], ['meru_wakrasana', 1.5], ['chakki_chalanasana', 1.5], ['nauka_sanchalanasana', 1.5], ['kashtha_takshanasana', 1.5], ['vayu_nishkasana', 1], ['udarakarshanasana', 1.5]]
  },
  {
    imp: 'imp_sonne12', name: 'Sonnengruß klassisch (12 Stellungen)', type: 'asana',
    desc: 'Die klassische Folge in zwölf Stellungen mit dem Atem: Gebetshaltung, Arme hoch, Vorbeuge, Ausfallschritt, Planke, Gruß mit acht Gliedern, Kobra, Herabschauender Hund und zurück. Eine Runde besteht aus zwei Durchgängen: erst mit dem rechten, dann mit dem linken Bein im Ausfallschritt. Zum Aufwärmen am Stundenanfang; für Senioren gibt es den seniorengerechten Sonnengruß im Katalog.',
    src: { n: 'Sivananda Yoga: The Sun Salutation; Yoga Vidya: Surya Namaskara', u: 'https://sivananda.org/the-sun-salutation/' },
    items: [['tadasana', 0.5], ['arme_zur_sonne', 0.5], ['vorbeuge', 0.5], ['ashwa', 0.5], ['phalakasana', 0.5], ['ashtanga_namaskara', 0.5], ['kobra', 0.5], ['adho_mukha', 0.5], ['ashwa', 0.5], ['vorbeuge', 0.5], ['arme_zur_sonne', 0.5], ['tadasana', 0.5]]
  },
  {
    imp: 'imp_mond', name: 'Mondgruß (Chandra Namaskar)', type: 'asana',
    desc: 'Ruhige, seitlich betonte Folge als Gegenstück zum Sonnengruß: kühlend, erdend und beruhigend, gut für den Abend oder zum Stundenende. Aufbau gespiegelt: erst zu einer Seite, dann zur anderen, am Ende zurück in die Berghaltung. Es gibt viele Formen des Mondgrußes; dies ist eine der verbreiteten.',
    src: { n: 'yogaeasy: Mondgruß, Auszug aus „Female Yoga“ von Katharina Middendorf', u: 'https://www.yogaeasy.de/artikel/aus-dem-schatten-ins-licht-der-mondgruss' },
    items: [['tadasana', 0.5], ['anjali_mudra', 0.5], ['seitneigung', 1], ['goettin', 1], ['dreieck', 1], ['pyramide', 1], ['anjaneyasana', 1], ['skandasana', 1], ['anjaneyasana', 1], ['pyramide', 1], ['dreieck', 1], ['goettin', 1], ['tadasana', 0.5]]
  },
  {
    imp: 'imp_sn_heil', name: 'Shakti Naam Heilserie', type: 'shakti',
    desc: 'Die Heilserie für Vitalität, Jugend und Schönheit: ein Herz-Kreislauf-Training in acht Schritten, das das elektromagnetische Feld stärken soll. Immer die Körpermitte (Hara) aktivieren. Die Minuten sind die Mindestdauer laut Skript (Arm Swings 3 bis 7, Magnetfeld 5 bis 10, Clap Walk 6 bis 10, Walking 3 bis 6). Nicht bei Schwindel, Bluthochdruck, Osteoporose oder Knieproblemen; für Senioren eher die Sitz-Sequenz wählen.',
    src: { n: 'Ausbildungsskript Modul 6, S. 15 bis 19', u: '' },
    items: [['sn_armswing', 3], ['sn_magnet', 5], ['sn_clapwalk', 6], ['sn_heartsaver', 3], ['sn_walking', 3], ['kindhaltung', 1], ['sn_shaking', 1], ['shavasana', 3]]
  },
  {
    imp: 'imp_sn_stehen', name: 'Shakti Naam Cardio im Stehen', type: 'shakti',
    desc: 'Acht Cardio-Übungen im Stehen: Kicken mit Mantra, kreuzweises Laufen, Marschieren, Herz-Fächeln, Rennen, Tanzen und Kniebeugen mit „Har“. Beckenboden anspannen und die Körpermitte „bracen“, am besten mit aufbauender, rhythmischer Musik. Nicht bei Schwindel, Bluthochdruck, Osteoporose oder Knieproblemen. Die Minuten sind meine Vorschläge, das Skript nennt keine Zeiten.',
    src: { n: 'Ausbildungsskript Modul 6, S. 22 bis 26', u: '' },
    items: [['sn_kick1', 2], ['sn_kick2', 2], ['sn_cross', 2], ['sn_march', 2], ['sn_fan', 2], ['sn_run', 2], ['sn_dance', 2], ['sn_squat', 3]]
  },
  {
    imp: 'imp_sn_sitzen', name: 'Shakti Naam Cardio Atemarbeit im Sitzen', type: 'shakti',
    desc: 'Neun Übungen im einfachen Sitz mit Shakti Mudra und kräftigem Atem, je etwa 3 Minuten, jeweils mit Atem anhalten und Arme ausschütteln am Ende. Gut für Gruppen, die nicht stehen oder laufen sollen. Nicht bei Schwindel, Bluthochdruck, Glaukom oder Osteoporose.',
    src: { n: 'Ausbildungsskript Modul 6, S. 61 bis 65', u: '' },
    items: [['sn_s_twist', 3], ['sn_s_gyan', 3], ['sn_s_chest', 3], ['sn_s_prana_down', 3], ['sn_s_prana_grab', 3], ['sn_s_cross', 3], ['sn_s_fan', 3], ['sn_s_circles', 3], ['sn_s_wings', 3]]
  },
  {
    imp: 'imp_sn_cardio_detail', name: 'Shakti Naam Cardio-Übungen (Detailseiten)', type: 'shakti',
    desc: 'Die Cardio-Übungen, die das Skript auf eigenen Seiten mit Technik, Wirkung und Kontraindikationen beschreibt, in Skriptreihenfolge: Schütteln, kreuzweises Laufen, Walking, Brain Booster, Armkreise, Himmlisches Prana, Hara Tanz, Lichtwall und die Superheld Sequenz. Das ist eine Zusammenstellung, keine feste Folge im Skript; Minuten sind meine Vorschläge. Mit den Hinweisen der einzelnen Übungen (Schulter, Knie, Osteoporose, Schwindel) abgleichen.',
    src: { n: 'Ausbildungsskript Modul 6, S. 28 bis 37', u: '' },
    items: [['sn_shaking', 3], ['sn_clapwalk', 3], ['sn_walking', 3], ['sn_brain', 2], ['sn_armkreise', 2], ['sn_prana_himmel', 2], ['sn_haratanz', 2], ['sn_lichtwall', 2], ['sn_superheld', 3]]
  },
  {
    imp: 'imp_sn_hws', name: 'HWS Mobilisation: Nackenöffnungen', type: 'mobilisation',
    desc: 'Vier Möglichkeiten, den Nacken im Stehen zu öffnen: mit verschränkten Händen, mit Kinnkreisen (Schildkröte), Hamster im Glück und Backen aufplustern mit Tattva Mudra. Im Skript sind es Optionen; hier stehen alle vier nacheinander, einzelne lassen sich in der Stunde entfernen. Die letzten beiden mit angehaltenem Atem. Nicht bei Nackenverletzungen und Bluthochdruck, Option 4 auch nicht bei Glaukom.',
    src: { n: 'Ausbildungsskript Modul 6, S. 38 bis 43', u: '' },
    items: [['sn_nacken1', 2], ['sn_nacken2', 2], ['sn_hamster', 2], ['sn_tattva', 2]]
  }
];
