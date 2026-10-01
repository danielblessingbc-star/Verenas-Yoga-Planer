/* Einzelmottos (Themen) mit Fokus, Kernsatz und Textbausteinen im Stil der Vorlagen.
   f = Körperlicher Fokus, k = Kernsatz, g = Schlagworte (steuern die Übungsauswahl), e = Einleitungsgedanke, b = Bild für die Entspannung, s = Gedanke zum Mitnehmen */
const THEMES = [];
function T(id, t, f, k, g, e, b, s) { THEMES.push({ id, t, f, k, g: g.split(' '), e, b, s }); }

T('ankommen', 'Ankommen & Aufatmen', 'Ganzkörper mobilisieren, Gelenke sanft bewegen, Wirbelsäule, Schultern, Atem', 'Ich komme wieder bei mir an.', 'mobi atem ruhe wurzel loslassen',
  'Heute möchte ich dich einladen, ganz bewusst hier anzukommen – nicht nur mit deinem Körper, sondern auch mit deinem Geist. Lass den Alltag für diese Zeit ein Stück weit hinter dir. Was vorher war, darf für einen Moment ruhen.',
  'Vielleicht stellst du dir vor, dass du nach einer langen Reise wieder nach Hause kommst. Du öffnest die Tür, trittst ein und darfst einfach ankommen. Vielleicht ist dieses Zuhause heute dein eigener Körper – ein Ort, zu dem du jederzeit zurückkehren kannst.',
  'Ich bin hier. Ich darf langsam ankommen. Und ich darf mir selbst Zeit geben.');
T('wurzeln', 'Wurzeln stärken', 'Füße, Beine, Fuß-/Sprunggelenke, Standfestigkeit und Gleichgewicht', 'Ich spüre meinen Boden.', 'wurzel balance kraft',
  'Ein Baum steht fest, weil seine Wurzeln tief reichen. Heute richten wir unsere Aufmerksamkeit auf unsere Füße und Beine – unser Fundament. Wenn wir unseren Boden spüren, dürfen wir oben weich und aufrecht sein.',
  'Stell dir vor, aus deinen Fußsohlen wachsen feine Wurzeln in den Boden. Mit jeder Ausatmung reichen sie ein Stück tiefer und nehmen Ruhe und Kraft aus der Erde auf. Der Boden trägt dich – ganz selbstverständlich.',
  'Ich spüre meinen Boden. Er trägt mich.');
T('fuelle', 'Die Fülle des Herbstes', 'Hüft- und Schulterbeweglichkeit, Brustkorb, Körperwahrnehmung', 'Ich nehme wahr, was schon da ist.', 'herz huefte schulter atem mobi',
  'Im Herbst zeigt sich die Natur von ihrer reichsten Seite: Farben, Früchte, Ernte. Auch in uns ist vieles schon da, das wir im Alltag leicht übersehen. Heute nehmen wir wahr, was wir bereits mitbringen.',
  'Stell dir einen Herbstwald im weichen Licht vor. Die Farben leuchten, die Luft ist klar und mild. Du gehst langsam hindurch und nimmst wahr, wie viel Fülle in diesem Moment um dich und in dir ist.',
  'Ich nehme wahr, was schon da ist – und das genügt.');
T('kraft', 'Kraft sammeln', 'Bein-, Gesäß- und Rumpfkraft, Stabilität, Aufrichtung', 'Ich entdecke meine Kraft.', 'kraft wurzel energie ruecken',
  'Kraft bedeutet nicht Anstrengung um jeden Preis. Wahre Kraft ist ruhig, stabil und geht mit dem Atem. Heute entdecken wir, wie viel Kraft in unseren Beinen, in unserem Rumpf und in unserer Aufrichtung steckt.',
  'Stell dir vor, mit jedem Atemzug sammelt sich in deiner Körpermitte ein warmes, ruhiges Leuchten. Es gibt dir Halt und Stärke – und du darfst es in jede Zelle fließen lassen.',
  'Ich entdecke meine Kraft. Sie ist ruhig, stabil und immer da.');
T('balance', 'Im Wandel das Gleichgewicht finden', 'Gleichgewicht, Koordination, Beinachsen, Rumpfstabilität', 'Ich darf mich verändern und finde trotzdem meine Mitte.', 'balance wurzel kraft ruhe',
  'Draußen verändert sich vieles: Das Licht wird weniger, das Wetter wechselt, die Blätter fallen. Auch in unserem Leben ist ständig etwas im Wandel. Gleichgewicht heißt nicht, still zu stehen, sondern immer wieder zur Mitte zurückzufinden.',
  'Stell dir eine Waage vor, die sanft hin und her schwingt und immer wieder in ihre Mitte zurückfindet. So darfst auch du schwanken – und wieder in deine Balance kommen.',
  'Ich darf mich verändern und finde immer wieder meine Mitte.');
T('loslassen', 'Loslassen wie die Blätter', 'Wirbelsäulenbeweglichkeit, Hüften, hintere Beinlinie, sanfte Vorbeugen', 'Ich darf loslassen, was ich nicht mehr brauche.', 'loslassen ruecken huefte ruhe',
  'Die Bäume lassen ihre Blätter los, ganz ohne Anstrengung und ohne Bedauern. Sie wissen, dass Loslassen Platz für Neues schafft. Heute dürfen wir üben, Spannung, Gedanken und Altes sanft ziehen zu lassen.',
  'Stell dir vor, du liegst unter einem großen Baum. Ein Blatt nach dem anderen löst sich, schwebt langsam herab und trägt etwas mit sich fort, das du nicht mehr brauchst. Mit jeder Ausatmung darfst auch du ein Stück loslassen.',
  'Ich darf loslassen, was ich nicht mehr brauche.');
T('atem', 'Den Atem genießen', 'Brustkorb, Rippen, Schultergürtel, obere Wirbelsäule', 'Mit jedem Atemzug wird es weit in mir.', 'atem herz schulter licht',
  'Der Atem begleitet uns ein Leben lang – meist unbemerkt. Heute schenken wir ihm unsere volle Aufmerksamkeit und erleben, wie er den Brustkorb weitet und uns von innen bewegt.',
  'Stell dir vor, dein Atem ist wie eine sanfte Welle: Sie kommt, sie trägt dich, sie geht wieder. Du musst nichts tun – nur zuschauen und dich tragen lassen.',
  'Mit jedem Atemzug wird es weit in mir.');
T('waerme', 'Wärme & Herzöffnung', 'Brustkorb öffnen, Schultern mobilisieren, obere Wirbelsäule, Haltung', 'Ich öffne mein Herz und spüre Wärme.', 'herz schulter licht atem',
  'Wenn es draußen kühler wird, sehnen wir uns nach Wärme – nach Nähe, Geborgenheit und einem offenen Herzen. Heute öffnen wir den Brustkorb und machen Raum für Wärme, die von innen kommt.',
  'Stell dir vor, in deiner Herzmitte glimmt ein kleines warmes Licht. Mit jeder Einatmung wird es heller, mit jeder Ausatmung strahlt die Wärme in den ganzen Körper.',
  'Ich öffne mein Herz und spüre Wärme in mir.');
T('dankbarkeit', 'Dankbarkeit', 'Ganzkörperbewegung, Aufrichtung, Beine, Brustkorb und Herzöffnung', 'Ich bin dankbar für das, was mich trägt.', 'herz dankbarkeit wurzel energie',
  'Dankbarkeit verändert den Blick: Plötzlich sehen wir, was da ist, statt was fehlt. Heute bewegen wir uns mit Wertschätzung – für unseren Körper, der uns jeden Tag trägt, und für alles, was uns guttut.',
  'Denke an drei kleine Dinge, für die du heute dankbar bist. Lass jedes einzelne wie ein warmes Licht in deinem Herzen aufleuchten und sich im ganzen Körper ausbreiten.',
  'Ich bin dankbar – für meinen Körper, meinen Atem und diesen Moment.');
T('ruhe', 'Ruhe finden', 'Nacken, Schultern, Hüften, Wirbelsäule, regenerative Ausrichtung', 'Ich werde äußerlich und innerlich ruhig.', 'ruhe loslassen nacken schulter huefte',
  'Die Tage werden kürzer und die Zeit scheint sich zu verlangsamen. Heute gehen wir bewusst in die Ruhe – mit langsamen Bewegungen, langen Ausatmungen und viel Zeit zum Nachspüren.',
  'Stell dir einen stillen See am frühen Morgen vor. Kein Windhauch kräuselt die Oberfläche. So still und klar darf es auch in dir werden.',
  'Ich darf zur Ruhe kommen.');
T('vertrauen', 'Vertrauen & Geborgenheit', 'Gleichgewicht, Bein- und Rumpfstabilität, sichere Übergänge', 'Ich fühle mich getragen und sicher.', 'balance kraft wurzel ruhe',
  'Vertrauen wächst, wenn wir uns sicher fühlen – in unserem Körper, auf unserer Matte und in uns selbst. Heute üben wir Balance und sichere Übergänge und spüren: Ich kann mich auf mich verlassen.',
  'Stell dir vor, du wirst von einer warmen, weichen Decke umhüllt. Du spürst Geborgenheit und darfst dich ganz anlehnen. Alles ist gut, so wie es jetzt ist.',
  'Ich fühle mich getragen, sicher und geborgen.');
T('stille', 'Stille & innere Ruhe', 'Regeneration, Atem, sanfte Wirbelsäulen- und Hüftbeweglichkeit', 'Ich gehe ganz nach innen.', 'ruhe loslassen atem huefte ruecken',
  'Zwischen Terminen, Besorgungen und Vorbereitungen ist die Stille ein besonderes Geschenk. Heute gehen wir ganz nach innen, bewegen uns langsam und lassen die Stille wirken.',
  'Stell dir vor, es schneit leise draußen. Alles ist gedämpft und weich. Auch in dir wird es still – ruhig und friedlich wie ein verschneiter Wald.',
  'In der Stille finde ich zu mir.');
T('licht', 'Neues Licht', 'Aufrichtung, Brustöffnung, Schulterbeweglichkeit, Rückenstrecker, Energie', 'Das Licht kehrt langsam zurück – auch in mir.', 'licht herz schulter ruecken energie',
  'Nach der dunklen Jahreszeit beginnt das Licht langsam zurückzukehren. Auch in uns darf wieder etwas mehr Helligkeit, Wärme und Lebendigkeit entstehen – ganz ohne Vorsätze und ohne Druck.',
  'Stell dir vor, die ersten Sonnenstrahlen fallen auf dein Gesicht. Sie wärmen dich sanft, und mit jedem Atemzug wird es ein bisschen heller in dir.',
  'Das Licht kehrt zurück – auch in mir.');
T('energie', 'Neue Kraft & Lebensenergie', 'Ganzkörperkraft, Kreislauf, Koordination, Aktivierung', 'Ich spüre meine Lebensenergie.', 'energie kraft wurzel mobi',
  'Nach dem ruhigen Jahreswechsel dürfen wir die Energie wieder wecken. Heute bewegen wir uns dynamischer, kräftigen unseren Körper und spüren, wie der Kreislauf in Schwung kommt.',
  'Stell dir vor, mit jedem Einatmen strömt frische, klare Energie in dich hinein und füllt jede Zelle. Mit jedem Ausatmen darf sie sich im ganzen Körper ausbreiten.',
  'Ich spüre meine Lebensenergie – lebendig und ruhig zugleich.');
T('freude', 'Mit Freude durch den Winter', 'Ganzkörper, Balance, Kraft, Beweglichkeit, Herzöffnung und Regeneration', 'Ich nehme Freude mit.', 'herz energie balance kraft licht',
  'Wir blicken auf unsere gemeinsame Zeit zurück: Beweglichkeit, Kraft, Balance, Atem und Herzöffnung. Heute dürfen Lieblingsübungen noch einmal Platz haben – und die Freude am Üben darf im Mittelpunkt stehen.',
  'Stell dir vor, du trägst ein kleines Licht der Freude in dir. Es begleitet dich durch den Winter, wärmt dich an kalten Tagen und erinnert dich an das, was dir guttut.',
  'Ich nehme Freude und Leichtigkeit mit in den Winter.');
// Frühling / Sommer / Körper
T('erwachen', 'Erwachen', 'Ganzkörper mobilisieren, Wirbelsäule, Brustkorb, Kreislauf', 'Ich erwache mit der Natur.', 'mobi energie atem licht ruecken',
  'Draußen erwacht die Natur: Knospen brechen auf, die Tage werden länger. Auch unser Körper darf nach der kalten Jahreszeit langsam aufwachen, sich strecken und dehnen.',
  'Stell dir einen Samen vor, der in der warmen Erde ruht. Sanft wird er von der Frühlingssonne geweckt und beginnt, sich dem Licht entgegenzustrecken.',
  'Ich erwache – sanft und Schritt für Schritt.');
T('wachsen', 'Wachsen', 'Aufrichtung, Beine, Rumpf, Schultern', 'Ich wachse in meinem Tempo.', 'wurzel kraft ruecken licht',
  'Jede Pflanze wächst in ihrem eigenen Tempo – nach oben zum Licht und nach unten in die Erde. Heute üben wir beides: einen festen Stand und eine lebendige Aufrichtung.',
  'Stell dir vor, du bist ein junger Baum. Die Wurzeln halten dich, der Stamm richtet sich auf, und die Zweige strecken sich dem Licht entgegen.',
  'Ich wachse in meinem Tempo.');
T('leichtigkeit', 'Leichtigkeit', 'Gelenke, Atem, Koordination, Beweglichkeit', 'Ich darf leicht sein.', 'mobi atem energie loslassen',
  'Leichtigkeit entsteht, wenn wir nichts festhalten müssen. Heute bewegen wir uns spielerisch, lassen den Atem fließen und schauen, wie leicht sich Bewegung anfühlen kann.',
  'Stell dir vor, dein Körper ist leicht wie eine Feder im Wind. Jede Ausatmung trägt ein wenig Schwere mit fort.',
  'Ich darf leicht sein.');
T('sonne', 'Sonne tanken', 'Brustkorb öffnen, Schultern, Aufrichtung', 'Ich tanke Wärme und Licht.', 'licht herz schulter energie',
  'Die Sonne wärmt, belebt und macht uns offen. Heute richten wir uns auf wie Sonnenblumen, öffnen den Brustkorb und nehmen Licht und Wärme in uns auf.',
  'Stell dir vor, du liegst auf einer warmen Wiese. Die Sonne wärmt dein Gesicht, deinen Bauch, deine Hände. Mit jedem Atemzug nimmst du ein Stück Wärme mehr auf.',
  'Ich tanke Wärme und Licht.');
T('weite', 'Weite spüren', 'Hüften, Brustkorb, Flanken, Atem', 'In mir ist Raum und Weite.', 'atem huefte herz loslassen',
  'Weite ist mehr als ein Blick über ein Feld – sie ist auch ein Gefühl in uns. Heute schaffen wir Raum in Hüften, Flanken und Brustkorb und lassen den Atem weit werden.',
  'Stell dir einen weiten Horizont vor. Mit jeder Einatmung weitet sich dein Brustkorb, mit jeder Ausatmung darf sich der Raum in dir noch ein wenig mehr öffnen.',
  'In mir ist Raum und Weite.');
T('genuss', 'Genießen', 'Sanfte Bewegung, Körperwahrnehmung, Atem', 'Ich genieße diesen Moment.', 'ruhe atem loslassen mobi',
  'Genießen heißt, etwas ganz bewusst wahrzunehmen. Heute bewegen wir uns langsam, spüren jede Bewegung und erlauben uns, es uns gutgehen zu lassen.',
  'Stell dir vor, du trinkst an einem warmen Sommertag etwas Kühles. Du spürst jeden Schluck und genießt ganz bewusst, was dir guttut.',
  'Ich genieße diesen Moment.');
T('beweglichkeit', 'Beweglich bleiben', 'Gelenke, Wirbelsäule, Hüften, Schultern', 'Ich bleibe beweglich – in Körper und Geist.', 'mobi huefte schulter ruecken',
  'Beweglichkeit bleibt, wenn wir sie pflegen – sanft, regelmäßig und ohne Ehrgeiz. Heute bewegen wir alle großen Gelenke und die Wirbelsäule in ihrem ganzen Spielraum.',
  'Stell dir vor, deine Gelenke sind mit warmem, flüssigem Öl geschmeidig. Jede Bewegung fällt ein wenig leichter und weicher.',
  'Ich bleibe beweglich – in Körper und Geist.');
T('mitte', 'In die Mitte kommen', 'Rumpfstabilität, Gleichgewicht, Körpermitte', 'Ich finde meine Mitte.', 'balance kraft ruecken wurzel',
  'Wer seine Mitte spürt, steht sicherer. Heute arbeiten wir mit dem Rumpf, dem Gleichgewicht und dem Gefühl für unsere eigene Mitte.',
  'Stell dir vor, in deiner Körpermitte liegt ein ruhiger, warmer Punkt. Von dort aus ordnet sich alles andere – Atem, Haltung, Gedanken.',
  'Ich finde meine Mitte.');
T('schultern', 'Schultern & Nacken befreien', 'Schultergürtel, Nacken, obere Wirbelsäule', 'Meine Schultern dürfen weich werden.', 'schulter nacken loslassen herz',
  'Viel trägt sich in Schultern und Nacken: Alltag, Sorgen, Haltung. Heute mobilisieren wir den Schultergürtel sanft und lassen Spannung ziehen.',
  'Stell dir vor, jemand nimmt dir einen schweren Rucksack von den Schultern. Mit jeder Ausatmung sinken sie ein wenig tiefer.',
  'Meine Schultern dürfen weich werden.');
T('huefte', 'Hüften öffnen', 'Hüftbeweglichkeit, Beinachsen, hintere Beinlinie', 'Meine Hüften dürfen weit und weich werden.', 'huefte loslassen wurzel',
  'Die Hüften sind unser Bewegungszentrum. Heute bewegen wir sie in alle Richtungen, sanft und ohne Zwang, und spüren, wie Weite entsteht.',
  'Stell dir vor, deine Hüften sind zwei warme Schalen, die mit jeder Ausatmung ein wenig weicher und weiter werden.',
  'Meine Hüften dürfen weit und weich werden.');
T('ruecken', 'Den Rücken stärken', 'Rückenstrecker, Rumpf, Aufrichtung, Wirbelsäulenbeweglichkeit', 'Mein Rücken trägt mich aufrecht.', 'ruecken kraft mobi',
  'Ein kräftiger, beweglicher Rücken schenkt Aufrichtung und Sicherheit. Heute kräftigen und mobilisieren wir die Wirbelsäule achtsam und in kleinen Schritten.',
  'Stell dir vor, deine Wirbelsäule ist eine Kette aus glänzenden Perlen, die sich Wirbel für Wirbel aufrichtet – locker und zugleich stabil.',
  'Mein Rücken trägt mich aufrecht.');
T('aufrichten', 'Aufrichten', 'Haltung, Brustöffnung, Rückenstrecker', 'Ich richte mich auf – und bleibe weich.', 'ruecken herz licht kraft',
  'Aufrichtung ist eine innere Haltung: Wir richten uns auf und bleiben dabei weich. Heute üben wir Haltung, Brustöffnung und einen langen Rücken.',
  'Stell dir einen Faden vor, der dich sanft am Scheitel nach oben zieht, während die Schultern weit und weich bleiben.',
  'Ich richte mich auf – und bleibe weich.');

// Übermotto-Vorlagen: Reihenfolge der Einzelmottos
const PRESETS = {
  herbstwinter: { t: 'Reise durch Herbst und Winter', l: ['ankommen', 'wurzeln', 'fuelle', 'kraft', 'balance', 'loslassen', 'atem', 'waerme', 'dankbarkeit', 'ruhe', 'vertrauen', 'stille', 'licht', 'energie', 'freude'] },
  fruehling: { t: 'Frühling – Erwachen und Wachsen', l: ['ankommen', 'erwachen', 'wurzeln', 'beweglichkeit', 'atem', 'wachsen', 'leichtigkeit', 'aufrichten', 'energie', 'freude'] },
  sommer: { t: 'Sommer – Weite und Leichtigkeit', l: ['ankommen', 'sonne', 'weite', 'leichtigkeit', 'genuss', 'balance', 'waerme', 'dankbarkeit', 'freude', 'ruhe'] },
  koerper: { t: 'Den Körper neu entdecken', l: ['ankommen', 'beweglichkeit', 'wurzeln', 'mitte', 'schultern', 'huefte', 'ruecken', 'kraft', 'balance', 'atem', 'aufrichten', 'ruhe'] },
  alltag: { t: 'Gelassenheit im Alltag', l: ['ankommen', 'atem', 'ruhe', 'loslassen', 'mitte', 'balance', 'kraft', 'vertrauen', 'dankbarkeit', 'stille'] }
};

// Stichworte im Freitext → Schlagworte
const KEYWORDS = {
  kraft: ['kraft', 'stark', 'stärke', 'mut'], balance: ['balance', 'gleichgewicht', 'mitte'], ruhe: ['ruhe', 'still', 'gelassen', 'entspann', 'frieden'],
  atem: ['atem', 'luft'], herz: ['herz', 'liebe', 'wärme', 'mitgefühl', 'freund'], loslassen: ['loslass', 'lassen', 'frei', 'befrei'],
  wurzel: ['wurzel', 'boden', 'erde', 'halt', 'stabil', 'verwurz'], licht: ['licht', 'sonne', 'hell'], energie: ['energie', 'schwung', 'aktiv', 'vital'],
  dankbarkeit: ['dank', 'wertsch'], huefte: ['hüft'], schulter: ['schulter', 'nacken'], ruecken: ['rücken', 'wirbel', 'aufricht'], mobi: ['beweg', 'mobil', 'geschmeidig']
};
