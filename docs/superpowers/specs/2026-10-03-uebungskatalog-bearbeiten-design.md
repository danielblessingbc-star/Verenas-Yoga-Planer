# Übungskatalog bearbeiten – Design

Datum: 2026-10-03

## Ziel
Im Übungskatalog lassen sich alle Übungen (Yoga, Atem/Wahrnehmung, eigene) nachträglich ändern: Symbol, Stammdaten und alle Kategorien. Vorhandene Bausteine (Arten, Stile, Gebrechen, Kategorie-Werte) werden gewählt oder neu ergänzt. Abgeleitete Kategorien lassen sich neu berechnen; manuell gesetzte Werte bleiben so, wie eingestellt.

## Nicht-Ziele
- Keine eigenen Zeichnungen, nur Auswahl aus vorhandenen Symbolen (`POSES`, `ICONS`, `ratlos`).
- Keine Änderung der Originaldaten in `exercises.js` / `kategorien.js`.

## Datenmodell
- `state.exEdits = { [id]: { <feldname>: wert, …, manual: { <kategorie>: true } } }` – nur geänderte Felder. Für Basis-, Atem- und eigene Übungen.
  - Felder: `n, sa, d, m, c, lv, s, st, x, t, pose` (Atem: `ic`), `kat: { <gruppe>: [werte] }`.
- `state.vocab = { cats, stile, geb, kat: { <gruppe>: { id: label } } }` – eigene Bausteine, ID-Präfix `v_`. Neue Arten erhalten automatisch eine freie Farbe aus fester Palette.
- `defaults()` um beide Schlüssel erweitern; Laden alter Stände ohne diese Schlüssel muss funktionieren.
- Start/Änderung: eigene Bausteine werden in `CATS`, `STILE`, `GEBRECHEN`, `KAT[...]` eingemischt (Filter, Chips, Legenden bleiben unverändert).

## Overlay
- `exAll()` / `exById()` liefern Basisobjekt + `exEdits` (neues Objekt, Cache, bei `save()` invalidiert). `kat` wird je Gruppe überlagert.
- Alle Verbraucher (Generator, Ausdruck, Analyse, Kacheln) sehen automatisch die geänderten Werte. IDs bleiben, Programme unberührt.

## Kategorien: automatisch vs. manuell
- `kategorien.js`: Ableitungsregeln aus der Schleife über `EX` in `deriveKat(e)` herausziehen. Für Originalübungen identisches Ergebnis wie bisher (Regressionsprüfung vor/nach).
- Pro Gruppe Modus: automatisch (Standard, aus Pose/Art/Schlagworten/Name berechnet) oder manuell (`manual[gruppe]`, Wert gilt wie eingestellt). Manuelle Gruppen im Formular mit Schloss.
- „Neu berechnen" pro Gruppe (verwirft manuellen Wert) und „Alle Kategorien neu berechnen".
- Ändert der Nutzer Pose, Art oder Schlagworte: Rückfrage „Automatische Kategorien neu berechnen? Manuelle bleiben unverändert." – nur Automatik-Gruppen betroffen.
- Chakra: `chakraSrc` (Skript/Regel) wird bei manueller Änderung zu „manuell".

## UI
- Katalogzeile: Button „Bearbeiten" (auch bei Atem/Wahrnehmung). Formular im aufgeklappten Detail, „Speichern" / „Abbrechen".
- Symbol-Auswahl als Kachelraster (Yoga: `POSES` inkl. `ratlos`; Atem: `ICONS`). Ersetzt auch das Pose-Dropdown beim Anlegen eigener Übungen.
- Mehrfachauswahl als Chips je Gruppe; „＋ neu" legt Baustein an. Bausteine umbenennbar; löschbar nur, wenn unbenutzt.
- Markierung „angepasst" an geänderten Übungen; „Auf Original zurücksetzen" pro Übung.

## Backup / Sync
- `exEdits` und `vocab` in Export/Import (`exportAll`, Import in `app.js`) aufnehmen; Zusammenführen ohne Verlust.
- `google-sheets-sync.js` prüfen, ob die neuen Schlüssel mit synchronisiert werden müssen.

## Test (Browser, `.claude/launch.json`)
1. Symbol ändern → Kachel im Katalog, Programm und Ausdruck aktualisiert.
2. Kategorie manuell setzen → Pose ändern → manueller Wert bleibt, Automatik-Gruppen fragen nach Neuberechnung.
3. „Neu berechnen" → Wert entspricht `deriveKat`.
4. Neuen Baustein anlegen → in Filter, Chips, Legende verfügbar; Löschen nur ungenutzt.
5. Zurücksetzen → Originalzustand. Export → Import → identisch.
6. Atem-/Wahrnehmungsübung bearbeiten (Symbol, Stile, Gebrechen).
7. Konsole ohne Fehler; Altbestand ohne `exEdits`/`vocab` lädt.
