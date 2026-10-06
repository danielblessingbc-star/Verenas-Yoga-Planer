/* Abgleich des kompletten Stands zwischen mehreren PCs über ein Google Sheet (Apps Script, siehe docs/sync-einrichtung.md).
   Der Stand liegt je PC im Browser (localStorage); hier wird er nach jeder Änderung hochgeladen und beim Start / Zurückkehren auf den Tab geprüft.
   Der KI-Schlüssel (settings.apiKey) wird nie hochgeladen. Web-App-Adresse und Kennwort stehen nur im Browser (nicht im öffentlichen Code). */
const SYNC_LS = 'yogaplaner.sync';
const syncCfg = () => { try { return JSON.parse(localStorage.getItem(SYNC_LS)) || {}; } catch (e) { return {}; } };
const syncSet = o => { try { localStorage.setItem(SYNC_LS, JSON.stringify(Object.assign(syncCfg(), o))); } catch (e) { } };
const syncReady = () => { const c = syncCfg(); return !!(c.url && c.key); };
async function syncCall(body) {
  const c = syncCfg();
  const r = await fetch(c.url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(Object.assign({ key: c.key }, body)) });
  return r.json();
}
const syncPayload = () => JSON.stringify(Object.assign({}, state, { settings: Object.assign({}, state.settings, { apiKey: '' }) }));
let syncBusy = false, syncPushT, syncChecked = false; // vor der ersten Prüfung gelten Speichervorgänge (Start, Vorgabedaten) nicht als Änderung
function syncMarkDirty() { if (!syncReady() || !syncChecked) return; syncSet({ dirty: true }); clearTimeout(syncPushT); syncPushT = setTimeout(() => syncPush(), 2500); }
async function syncPush(force) {
  if (!syncReady() || syncBusy) return;
  syncBusy = true;
  try {
    const res = await syncCall({ action: 'save', json: syncPayload(), base: syncCfg().at || 0, force: !!force });
    if (res.ok) { syncSet({ at: res.at, dirty: false }); syncStatus('✓ Abgeglichen'); }
    else if (res.conflict) syncResolve(res.at);
    else syncStatus('⚠ ' + (res.error || 'Fehler'));
  } catch (e) { syncStatus('⚠ Kein Abgleich möglich (offline?)'); }
  syncBusy = false;
}
function syncAdopt(json) {
  const remote = JSON.parse(json);
  remote.settings = Object.assign({}, remote.settings, { apiKey: state.settings.apiKey });
  localStorage.setItem(KEY, JSON.stringify(remote));
  location.reload();
}
async function syncResolve(remoteAt) {
  const res = await syncCall({ action: 'load' });
  if (!res.ok) return syncStatus('⚠ ' + (res.error || 'Fehler'));
  if (!res.json) return syncPush(true);
  if (!syncCfg().dirty) { syncSet({ at: res.at }); return syncAdopt(res.json); }
  if (confirm('Auf einem anderen PC wurde ein neuerer Stand gespeichert, und hier gibt es ungespeicherte Änderungen.\n\nOK = Stand vom anderen PC laden (lokale Änderungen gehen verloren)\nAbbrechen = diesen PC behalten (überschreibt den anderen Stand)')) { syncSet({ at: res.at, dirty: false }); syncAdopt(res.json); }
  else { syncSet({ at: res.at }); syncPush(true); }
}
async function syncCheck() {
  if (!syncReady() || syncBusy) return;
  try {
    syncChecked = true;
    const res = await syncCall({ action: 'load' });
    if (!res.ok) return syncStatus('⚠ ' + (res.error || 'Fehler'));
    const c = syncCfg();
    if (!res.json) return syncPush(true);
    if (res.at > (c.at || 0)) return syncResolve(res.at);
    if (c.dirty) return syncPush();
    syncStatus('✓ Abgeglichen');
  } catch (e) { syncStatus('⚠ Kein Abgleich möglich (offline?)'); }
}
function syncStatus(t) { const el = document.getElementById('syncSt'); if (el) el.textContent = t; }
function syncSetup() {
  const c = syncCfg();
  const url = prompt('Web-App-Adresse des Google-Skripts (siehe docs/sync-einrichtung.md):', c.url || ''); if (!url) return;
  const key = prompt('Abgleich-Kennwort (dasselbe wie im Skript unter SECRET):', c.key || ''); if (!key) return;
  syncSet({ url: url.trim(), key: key.trim(), at: 0, dirty: state.courses.length > 0 });
  syncCheck();
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) syncCheck(); });
setTimeout(syncCheck, 800);
