# Übungskatalog bearbeiten – Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Alle Übungen (Yoga, Atem/Wahrnehmung, eigene) im Katalog bearbeitbar machen – Symbol, Stammdaten, alle Kategorien, eigene Bausteine – mit Modus „automatisch/manuell" und „Neu berechnen".

**Architecture:** Änderungen liegen als Overlay in `state.exEdits`, eigene Bausteine in `state.vocab`. Eine neue Datei `js/katalog-edit.js` hält einen Snapshot der Originale (`EX`/`BR`) und schreibt Original + Änderungen **in place** zurück in `EX`/`BR`/`CATS`/`STILE`/`GEBRECHEN`/`KAT`. Alle bestehenden Verbraucher (`exAll`, `BR.find`, Generator, Ausdruck) bleiben dadurch unverändert. Die Ableitungsregeln in `kategorien.js` werden zu `deriveKat(e)`.

**Tech Stack:** Vanilla JS im Browser (Skripte per `<script>`), keine Build-Schritte; Tests mit Node 24 (`node tests/*.test.js`, Skripte per `vm` geladen), Browser-Prüfung über `.claude/launch.json` (`yoga-planer`, Port 8765).

**Spec:** `docs/superpowers/specs/2026-10-03-uebungskatalog-bearbeiten-design.md`

Abweichung vom Spec (Umsetzungsentscheidung, gleiches Verhalten): Statt eines Overlay-Caches mit neuen Objekten wird in place überschrieben (Snapshot + Rückschreiben). Eigene Übungen (`state.customEx`) werden in ihren Feldern direkt geändert (kein „Original"); nur ihre manuellen Kategorien liegen in `exEdits`.

## Global Constraints

- Originaldaten in `js/exercises.js`, `js/skript.js`, `js/kategorien.js` (Regeln) werden fachlich nicht verändert; `deriveKat` liefert für alle Originalübungen exakt das bisherige `e.kat`, `e.chakraSrc`, `e.peak`.
- Kategorie-Gruppen: `KAT_GROUPS = ['pos','dir','wirk','en','chakra','ziel','reg','mus','atm','auf','sup','mat']`; `en` ist ein String, alle anderen Arrays.
- Eigene Baustein-IDs beginnen mit `v_`. Kein Baustein darf gelöscht werden, solange er verwendet wird.
- Persistenz: `state.exEdits` (Objekt) und `state.vocab` (Objekt) in `defaults()`; Altbestände ohne diese Schlüssel müssen laden.
- Deutsche UI-Texte, Stil wie vorhandener Code (kompakte Einzeiler, `esc()` für HTML, Aktionen über `A.<name>` und `data-a`).
- `index.html`-Skripte tragen `?v=20261190`; neue Datei und geänderte Dateien bekommen eine neue Version (`20261191`), `APP_VER` ebenfalls.
- Commits nur nach Rückfrage des Nutzers (Projektregel dieser Sitzung); Commit-Schritte unten sind deshalb „vorbereiten, Nutzer fragen".

## Review Focus

- Pose/Art/Schlagworte ändern bei manueller Gruppe → Wert bleibt exakt wie gesetzt (Test in Task 2).
- Leere manuelle Auswahl (Gruppe bewusst auf „nichts") bleibt leer und fällt nicht auf Automatik zurück; `en: ''` ebenso (Task 2).
- Baustein löschen, der in Übung oder manueller Kategorie genutzt wird → verweigert, Daten unverändert (Task 2).
- Zurücksetzen/Neu berechnen für eigene Übungen und Atemübungen ohne `kat` darf nicht werfen (Task 2).
- Backup-Import (Zusammenführen und Ersetzen) mit/ohne `exEdits`/`vocab`; Bausteine kollidieren nicht (Task 4).
- Pro Gruppe Datenbestand mit doppelt angelegtem Bausteinnamen → zweite Anlage liefert die vorhandene ID (Task 2).

---

### Task 1: `deriveKat` aus `kategorien.js` herauslösen

**Files:**
- Create: `tests/helpers.js`, `tests/fixtures/kat-baseline.json`, `tests/derive.test.js`
- Modify: `js/kategorien.js:20-160`

**Interfaces:**
- Produces: `tests/helpers.js` → `loadCatalog(extraFiles?: string[]) : vm.Context` (lädt `poses, exercises, skript, shakti, kategorien` + `extraFiles` aus `js/`, setzt `state={customEx:[],exEdits:{},vocab:{},ratings:{}}` und `save=()=>{}` vorab). Global `KAT_GROUPS: string[]`. Global `deriveKat(e) : object` – berechnet `e.kat` (alle Gruppen), setzt `e.chakraSrc` und `e.peak`, gibt `e.kat` zurück; funktioniert für beliebige Übungsobjekte (`id,c,lv,pose,t,st,d,w,how,ev,script`).

- [ ] **Step 1:** `tests/helpers.js` schreiben (vm-Kontext wie `/tmp/probe.js`: Dateien in Reihenfolge ausführen, vorher `state`/`save` ins Kontextobjekt legen).
- [ ] **Step 2:** Baseline erzeugen **vor** dem Refactor: kleines Node-Skript, das `loadCatalog()` aufruft und `{ [e.id]: { kat: e.kat, chakraSrc: e.chakraSrc, peak: e.peak } }` für alle `EX` nach `tests/fixtures/kat-baseline.json` schreibt. Ausführen; Datei enthält 191 Einträge.
- [ ] **Step 3:** Test `tests/derive.test.js` (nutzt `node:assert`): `derive_matches_baseline` – für jede Baseline-ID `deepStrictEqual(deriveKat(clone(EX_item)).kat, baseline.kat)` plus `chakraSrc`/`peak`; `derive_custom_exercise` – Objekt `{id:'c_x',n:'T',c:'stand',lv:1,m:2,pose:'tree',t:['balance'],x:[],s:1}` ergibt `kat.pos` mit `'balance'` und `kat.mat` = `['matte']`. Lauf: `node tests/derive.test.js` → FAIL (`deriveKat` fehlt).
- [ ] **Step 4:** `kategorien.js` umbauen: die sechs `EX.forEach(e => {…})`-Blöcke (Haltung/Ziel/Chakra, Region, Muskeln, Atmung/Aufmerksamkeit, Unterstützung, Material) werden zu benannten Stufenfunktionen `const stage1 = e => {…}` … `stage6`; Konstanten (`STAND`, `LEGP`, `MAT_P` …) bleiben im IIFE. Am Ende `deriveKat = e => { stage1(e); …; stage6(e); return e.kat; }` (global über `window`-freies `globalThis.deriveKat`/oder Funktion außerhalb IIFE, die die Stufen aus einem Objekt `KAT_STAGES` aufruft) und `EX.forEach(deriveKat)`. `KAT_GROUPS` als globale Konstante ergänzen. Stufenlogik inhaltlich unverändert.
- [ ] **Step 5:** `node tests/derive.test.js` → PASS (alle 191 identisch). Zusätzlich im Browser (`preview_start yoga-planer`) Katalog öffnen: keine Konsolenfehler, Detail einer Übung zeigt Kategorien wie vorher.
- [ ] **Step 6:** Commit vorbereiten (Nutzer fragen): `git add tests js/kategorien.js` – `refactor: Ableitung der Kategorien als deriveKat(e)`.

---

### Task 2: Datenschicht `js/katalog-edit.js`

**Files:**
- Create: `js/katalog-edit.js`, `tests/edit.test.js`
- Modify: `index.html` (Skript nach `kategorien.js` einfügen), `js/app.js:6` (`defaults()`), `js/app.js:1267` (nach `normalizeState()` `applyCatalogState()` aufrufen), `js/poses.js:108-112` (`breathIconSVG` berücksichtigt `ic`)

**Interfaces:**
- Consumes: `deriveKat`, `KAT_GROUPS` (Task 1); globale `state`, `save()`, `EX`, `BR`, `CATS`, `STILE`, `GEBRECHEN`, `KAT`, `exAll()` (in Tests: `exAll = () => EX.concat(state.customEx)` im Kontext).
- Produces:
  - `applyCatalogState() : void` – stellt `EX`/`BR`-Items aus Snapshot wieder her, wendet `state.exEdits` an, leitet für geänderte und eigene Übungen `deriveKat` ab, überlagert manuelle Gruppen, setzt `e.peak`; mischt `state.vocab` in `CATS/STILE/GEBRECHEN/KAT` (zuvor frühere eigene Einträge entfernen) und schreibt `<style id="vocabStyle">` (nur im Browser).
  - `exEdit(id: string, patch: {fields?: object, kat?: {[group]: string[]|string}, auto?: string[], recalcAll?: boolean}) : void` – `fields` Stammdaten (`n,sa,d,m,c,k,lv,s,st,x,t,pose,ic`); `kat` setzt Gruppen manuell (`state.exEdits[id].manual[group]=true`, Wert in `exEdits[id].kat[group]`); `auto` gibt Gruppen an Automatik zurück; `recalcAll:true` entfernt alle manuellen Gruppen. Danach `save()` + `applyCatalogState()`.
  - `exEditReset(id) : void` – löscht `state.exEdits[id]`. `exIsEdited(id) : boolean`. `manualGroups(id) : string[]`.
  - `vocabAdd(type: 'cats'|'stile'|'geb'|'kat', label: string, group?: string) : string` (ID `v_<slug>`, existierender Name → vorhandene ID; neue Arten bekommen `{n,color}` aus Palette `VOCAB_COLORS`), `vocabRename(type, id, label, group?) : void`, `vocabUsage(type, id, group?) : number`, `vocabRemove(type, id, group?) : boolean` (false wenn `vocabUsage>0`).
  - `POSE_KEYS : string[]` (= `Object.keys(POSES)` ohne `ratlos`, danach `ratlos` angehängt), `ICON_KEYS : string[]` (= `Object.keys(ICONS)`).

- [ ] **Step 1: Tests schreiben** (`tests/edit.test.js`, `loadCatalog(['katalog-edit.js'])`, vor jedem Test `state.exEdits={};state.vocab={};state.customEx=[];applyCatalogState()`):
  - `edit_field_overlay`: `exEdit('tree' , {fields:{n:'Baum neu', pose:'warrior1'}})` → `EX.find(e=>e.id==='baum').n === 'Baum neu'` (ID aus `EX` vorab ermitteln: Übung mit `pose==='tree'`); `exEditReset(id)` → Name und Pose wie im Snapshot.
  - `manual_group_survives_pose_change` (Review Focus 1): `exEdit(id,{kat:{reg:['nacken']}})`, dann `exEdit(id,{fields:{pose:'warrior1'}})` → `kat.reg` deep-equals `['nacken']`; `kat.pos` entspricht `deriveKat` für Pose `warrior1` (Automatik folgt).
  - `manual_empty_stays_empty` (Review Focus 2): `exEdit(id,{kat:{mus:[], en:''}})` → `kat.mus` `[]` und `kat.en ''`, auch nach Pose-Änderung.
  - `auto_and_recalc`: `exEdit(id,{kat:{reg:['nacken']}})`, `exEdit(id,{auto:['reg']})` → `kat.reg` = `deriveKat`-Wert; `recalcAll:true` entfernt `manualGroups(id)`.
  - `br_edit_and_reset` (Review Focus 4): `BR[0]` mit `exEdit(BR[0].id,{fields:{n:'X', ic:'ujjayi', st:['yin'], x:['knie']}})`; `exEditReset` stellt wieder her; kein Fehler, obwohl `BR` kein `kat` hat.
  - `custom_edit`: `state.customEx.push({id:'c_t',n:'T',c:'stand',lv:1,m:2,pose:'ratlos',t:[],x:[],e:'',h:'',s:1,o:1000,custom:true})`, `applyCatalogState()` → `kat` vorhanden; `exEdit('c_t',{fields:{pose:'tree'},kat:{mat:['matte','block']}})` → Objekt in `state.customEx` hat `pose==='tree'`, `kat.mat` `['matte','block']`.
  - `vocab_add_use_remove` (Review Focus 3+6): `id=vocabAdd('stile','Faszien')` → `STILE[id]==='Faszien'`, zweites `vocabAdd` gleicher Name → gleiche ID; `exEdit(x,{fields:{st:[id]}})` → `vocabRemove('stile',id)===false` und `STILE[id]` bleibt; nach `exEdit(x,{fields:{st:[]}})` → `vocabRemove(...)===true`, `STILE[id]===undefined`. Gleiches für `vocabAdd('kat','Lendenwirbel','reg')` und `vocabAdd('cats','Faszienflow')` (`CATS[id]` Label, `state.vocab.cats[id].color` gesetzt).
  - Lauf: `node tests/edit.test.js` → FAIL (`applyCatalogState` fehlt).
- [ ] **Step 2: `js/katalog-edit.js` implementieren** laut Interfaces. Ansatz: beim Laden `EX_ORIG`/`BR_ORIG` = Map id → `JSON.parse(JSON.stringify(item))`; `applyCatalogState` ersetzt je Item alle Eigenschaften (`Object.keys` löschen, Snapshot `Object.assign`), überlagert `fields`, und – nur wenn Edit oder Custom – `deriveKat(e)` + manuelle Gruppen (`kat[g] = exEdits[id].kat[g]`) + `e.peak = (e.kat.ziel||[]).includes('peak')`. Für `custom`-Items ändert `exEdit` die Felder direkt am Objekt in `state.customEx`. Eigene Bausteine: Liste zuletzt eingemischter IDs merken und vor jedem Mischen entfernen. `vocabUsage` zählt Verwendung in `exAll()`, `BR` (Felder `c`, `k`, `st`, `x`, `kat[group]`) und manuellen Werten in `state.exEdits`. Slug: `norm(label).replace(/ /g,'_')` (eigene kleine Variante, da `norm` in Tests fehlt: `label.toLowerCase().replace(/[^a-zäöüß0-9]+/g,'_')`).
- [ ] **Step 3:** `defaults()` um `exEdits: {}, vocab: {}` erweitern; `loadState` füllt fehlende Schlüssel automatisch über `Object.assign(defaults(), s, …)`. `breathIconSVG(id)` in `poses.js` nutzt `const ic = (BR.find(x => x.id === id) || {}).ic || id` für `ICONS[ic]`. In `index.html` Skript `js/katalog-edit.js` nach `kategorien.js` einfügen; in `app.js` direkt nach `normalizeState();` (Zeile 1267) `applyCatalogState();`.
- [ ] **Step 4:** `node tests/derive.test.js && node tests/edit.test.js` → PASS. Im Browser Katalog laden: keine Konsolenfehler, Katalog unverändert.
- [ ] **Step 5:** Commit vorbereiten (Nutzer fragen).

---

### Task 3: Bearbeiten-Formular mit Symbol-Raster

**Files:**
- Modify: `js/app.js` (`ui` ab Zeile 35, `viewCatalog` 578-634, Aktionen `A` nach Zeile 830, Zeile 1081), `style.css`

**Interfaces:**
- Consumes: `exEdit`, `exEditReset`, `exIsEdited`, `manualGroups`, `POSE_KEYS`, `ICON_KEYS`, `figureSVG(key,size)`, `breathIconSVG(id)` (Tasks 1–2).
- Produces: `ui.exEdit: string|null` (ID der gerade bearbeiteten Übung), `ui.exDraft: object` (Stammdaten-Entwurf), `ui.exDraftKat: {[group]: string[]|string}` (nur geänderte Gruppen), `ui.exDraftAuto: string[]`; Aktionen `exEditOpen {id}`, `exEditCancel`, `exEditSave`, `exEditResetBtn {id}`, `exPickSym {v}`, `dtog {g,v}` (Chip an/aus), `grpAuto {g}` (Gruppe auf Automatik), `grpAll` (alle auf Automatik); Funktion `exEditForm(o: object, isBR: boolean) : string` (HTML).

- [ ] **Step 1:** In `dtl()` (Detailzeile) bei geöffnetem Eintrag einen Button „Bearbeiten" (und „Auf Original zurücksetzen" wenn `exIsEdited(o.id)`, Markierung „angepasst" in der Namenszelle) ergänzen. Ist `ui.exEdit===o.id`, rendert `dtl()` statt der Leseansicht `exEditForm(o, isBR)`; Spaltenanzahl wie bisher (`8`/`6`).
- [ ] **Step 2:** `exEditForm`: Felder Name, Sanskrit (nur Yoga), Beschreibung (`d` bzw. `txt`), Dauer, Art (Yoga: `CATS`; Atem: `atem`/`wahr`), Stufe (`lv` 1–3), Senioren-Checkbox (`s`), Stile- und „Vorsicht bei"-Chips (`STILE`, `GEBRECHEN`), Symbol-Raster (Kacheln mit `figureSVG(key,48)` bzw. `breathIconSVG` für `ICON_KEYS`; aktuelle markiert; Klick → `exPickSym`). Alle Kategorie-Gruppen (`KAT_GROUPS`, nur Yoga/eigene) als Chip-Zeilen mit Titel aus `KATTITLE`; manuelle Gruppen mit 🔒 und Button „Neu berechnen" (`grpAuto`); Button „Alle Kategorien neu berechnen" (`grpAll`); Checkbox „Auch manuelle Gruppen neu berechnen" (`ui.exDraftAll`). Buttons „Speichern" / „Abbrechen". Kein Baustein-Anlegen hier (Task 4).
- [ ] **Step 3:** Aktionen: `exEditOpen` füllt Entwurf aus `exById(id)` (Arrays kopieren), setzt `ui.exEdit`, `ui.exOpen.add(id)`; `dtog` ändert Entwurf (Feld `st`/`x` oder `ui.exDraftKat[g]`; für `en` einwertig toggeln); `exEditSave` ruft `exEdit(id,{fields: draft, kat: draftKat, auto: draftAuto, recalcAll: draftAll})`, schließt Formular, `toast('Gespeichert. Automatische Kategorien neu berechnet; N manuelle unverändert.')`; Name leer → `toast('Bitte einen Namen eingeben.')`. Alle neuen Aktionen in `LOCKED_OK` aufnehmen, falls sie auf Elementen mit `data-sid` landen (hier nicht der Fall – nur prüfen).
- [ ] **Step 4:** Eigene-Übung-Formular (`addEx`, Zeile 629): `<select u:newEx.pose>` durch dasselbe Symbol-Raster ersetzen (`data-a="newPose" data-v=<key>` setzt `ui.newEx.pose`).
- [ ] **Step 5:** CSS in `style.css`: `.xpick` (Grid `repeat(auto-fill,minmax(56px,1fr))`, Kacheln mit Rahmen, `.on` hervorgehoben), `.chipsel` (Chips als Buttons, `.on` gefüllt, `.lock::before{content:'🔒 '}`), `.exform` Layout. Dunkelmodus wie vorhandene Stile (Variablen verwenden).
- [ ] **Step 6: Browser-Prüfung** (`preview_start yoga-planer`): Übung öffnen → Bearbeiten → Symbol wählen → Speichern; Kachel im Katalog neu, im Programm sichtbar; Reload behält Änderung; „Auf Original zurücksetzen" stellt wieder her. Atemübung: Symbol/Stile/Gebrechen ändern. Kategorie manuell setzen, Pose ändern → Wert bleibt; „Neu berechnen" → abgeleiteter Wert. Konsole fehlerfrei; Screenshot als Nachweis.
- [ ] **Step 7:** Commit vorbereiten (Nutzer fragen).

---

### Task 4: Eigene Bausteine, Backup/Import

**Files:**
- Modify: `js/app.js` (`exEditForm` aus Task 3, Aktionen, `importFile` 1210-1226, `exportAll` 865), `js/katalog-edit.js` (Palette/Style), `style.css`

**Interfaces:**
- Consumes: `vocabAdd`, `vocabRename`, `vocabRemove`, `vocabUsage` (Task 2), `exEditForm` (Task 3).
- Produces: Aktionen `vocNew {t,g}` (liest Textfeld `#vocIn-<t>-<g>`, legt Baustein an, wählt ihn im Entwurf aus), `vocRename {t,g,v}`, `vocDel {t,g,v}`; `mergeCatalogImport(j: object) : void` in `katalog-edit.js` führt `exEdits`/`vocab` eines Imports zusammen (wird von `importFile` aufgerufen).

- [ ] **Step 1:** Im Formular hinter jeder Chip-Zeile (Art, Stile, Vorsicht bei, jede Kategorie-Gruppe) Eingabefeld + Button „＋ neu". Eigene Bausteine (`v_`) tragen kleine Buttons ✎ (umbenennen, `prompt`-frei: Chip wird Eingabefeld) und ✕ (löschen über `confirmTwice`); bei `vocabRemove(...)===false` → `toast('Wird noch von N Übungen verwendet – zuerst dort entfernen.')`.
- [ ] **Step 2:** `applyCatalogState` schreibt `<style id="vocabStyle">` mit `.cat-<id>{--k:<color>}` und `.st-<id>{background:#dde3ea!important}` für alle eigenen Arten/Stile (Test für Style-Erzeugung nicht nötig, Browser-Prüfung).
- [ ] **Step 3:** `importFile`: im „Zusammenführen"-Zweig `exEdits` je ID übernehmen, wenn lokal nicht vorhanden; `vocab` je Typ/Gruppe fehlende IDs ergänzen. Im „Ersetzen"-Zweig läuft es über `Object.assign(defaults(), j)` (fehlende Schlüssel → leer). Danach vorhandenes `normalizeState(); save()` plus `applyCatalogState()`. `exportAll` exportiert bereits den ganzen `state` (keine Änderung nötig; im Browser prüfen).
- [ ] **Step 4 (Test, Node):** in `tests/edit.test.js` `merge_import_vocab`: Hilfsfunktion `mergeCatalogImport(j: object) : void` aus `katalog-edit.js` (reine Logik, in `importFile` aufgerufen) – Fall A: `j` ohne `exEdits`/`vocab` ändert nichts; Fall B: `j.vocab.stile={v_x:'X'}` und `j.exEdits={baum:{fields:{n:'N'}}}` werden übernommen, vorhandene lokale ID bleibt (Review Focus 5). `node tests/edit.test.js` → PASS.
- [ ] **Step 5: Browser-Prüfung:** Baustein „Faszien" (Stil) und „Lendenwirbel" (Region) anlegen → erscheinen in Filter und Chips; Art „Faszienflow" anlegen → Kachel/Legende mit Farbe; Löschen nur ungenutzt; Backup exportieren, „Alle Daten löschen", importieren → Änderungen und Bausteine zurück. Konsole fehlerfrei, Screenshot.
- [ ] **Step 6:** Cache-Version `?v=20261191` in `index.html` und `APP_VER` setzen. Commit vorbereiten (Nutzer fragen).

---

### Task 5: Gesamtprüfung

- [ ] **Step 1:** `node tests/derive.test.js && node tests/edit.test.js` → alle PASS.
- [ ] **Step 2:** Browser-Durchlauf Spec-Testliste 1–7 (Symbol im Programm/Ausdruck, manuell vs. Automatik, Neu berechnen, Baustein anlegen/löschen, Zurücksetzen, Export/Import, Atemübung bearbeiten, Konsole, Altbestand ohne `exEdits`/`vocab` – dazu `localStorage` `yogaplaner.v1` ohne die Schlüssel setzen und neu laden).
- [ ] **Step 3:** Ergebnis dem Nutzer berichten, Commit-Wunsch erfragen.
