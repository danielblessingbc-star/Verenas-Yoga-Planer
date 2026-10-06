# Abgleich zwischen mehreren PCs (Google Sheet)

Einmalig einrichten (ca. 5 Minuten):

1. Neues Google Sheet anlegen (oder das vorhandene nehmen) → **Erweiterungen → Apps Script**.
2. Den gesamten Inhalt von `docs/apps-script-sync.gs` einfügen und oben bei `SECRET` ein eigenes Kennwort eintragen. Speichern.
3. **Bereitstellen → Neue Bereitstellung → Typ „Web-App“**: *Ausführen als:* **Ich**, *Zugriff:* **Jeder**. Bereitstellen und die **Web-App-Adresse** (endet auf `/exec`) kopieren.
4. In der App: **Einstellungen & Backup → Abgleich zwischen Rechnern → „Abgleich einrichten“**, Adresse und Kennwort eintragen.
5. Auf jedem weiteren PC dasselbe (Adresse + Kennwort). Der erste PC lädt seinen Stand hoch, die anderen laden ihn herunter.

Danach wird nach jeder Änderung automatisch hochgeladen; beim Öffnen der Seite und beim Zurückkehren auf den Tab wird auf neuere Stände geprüft. Adresse und Kennwort bleiben nur im jeweiligen Browser (die Seite ist öffentlich auf GitHub). Der KI-Schlüssel wird nicht hochgeladen. Ändert man etwas im Skript, muss man es neu bereitstellen („Bereitstellungen verwalten → Neue Version“).
