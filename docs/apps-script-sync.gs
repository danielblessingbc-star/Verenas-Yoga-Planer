/* Yoga-Planer – Abgleich über Google Sheet
   Einrichtung: siehe docs/sync-einrichtung.md
   Der komplette Stand wird in Stücken zu je 40000 Zeichen im Tabellenblatt "Planer" gespeichert. */
var SECRET = 'HIER-EIN-EIGENES-KENNWORT-EINTRAGEN'; // muss mit dem Abgleich-Kennwort in der App übereinstimmen
var CHUNK = 40000;

function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function doPost(e) {
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var d = JSON.parse(e.postData.contents);
    if (d.key !== SECRET) return out({ ok: false, error: 'Kennwort falsch' });
    var ss = SpreadsheetApp.getActiveSpreadsheet(), sh = ss.getSheetByName('Planer') || ss.insertSheet('Planer');
    if (d.action === 'load') {
      var v = sh.getLastRow() ? sh.getRange(1, 1, sh.getLastRow(), 3).getValues() : [];
      return out({ ok: true, at: v.length ? Number(v[0][0]) : 0, json: v.map(function (r) { return r[2]; }).join('') });
    }
    if (d.action === 'save') {
      var cur = sh.getLastRow() ? Number(sh.getRange(1, 1).getValue()) : 0;
      if (d.base !== undefined && cur > d.base && !d.force) return out({ ok: false, conflict: true, at: cur });
      var rows = [], j = String(d.json), at = Date.now();
      for (var i = 0; i < j.length; i += CHUNK) rows.push([at, rows.length, j.substr(i, CHUNK)]);
      sh.clearContents(); sh.getRange(1, 1, rows.length, 3).setValues(rows);
      return out({ ok: true, at: at });
    }
    return out({ ok: false, error: 'unbekannte Aktion' });
  } finally { lock.releaseLock(); }
}
