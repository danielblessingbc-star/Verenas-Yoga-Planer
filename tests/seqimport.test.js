// Prüft die mitgelieferten Sequenzen (js/sequenzen-import.js): jede Übung existiert im Katalog, IDs und Namen sind eindeutig, Quellen sind Links.
const assert = require('node:assert');
const { loadCatalog, run } = require('./helpers');
const ctx = loadCatalog(['sequenzen-import']);
const J = code => JSON.parse(run(ctx, `JSON.stringify((() => { ${code} })())`));
let n = 0; const t = (name, fn) => { fn(); console.log('OK', name); n++; };

t('alle_uebungen_vorhanden', () => {
  const missing = J("const ids = new Set(EX.map(e => e.id)); return SEQ_IMPORT.flatMap(s => s.items.map(i => i[0]).filter(id => !ids.has(id)).map(id => s.imp + ':' + id))");
  assert.deepStrictEqual(missing, []);
});
t('ids_und_namen_eindeutig', () => {
  const r = J("return [SEQ_IMPORT.length, new Set(SEQ_IMPORT.map(s => s.imp)).size, new Set(SEQ_IMPORT.map(s => s.name)).size]");
  assert.strictEqual(r[0], r[1]); assert.strictEqual(r[0], r[2]);
});
t('felder_und_quellen', () => {
  const bad = J("return SEQ_IMPORT.filter(s => !['mobilisation', 'asana', 'cooldown'].includes(s.type) || !s.desc || !/^https:\\/\\//.test((s.src || {}).u) || !(s.src || {}).n || !s.items.length || s.items.some(i => !(i[1] > 0))).map(s => s.imp)");
  assert.deepStrictEqual(bad, []);
});
t('keine_gedankenstriche', () => {
  const bad = J("return SEQ_IMPORT.filter(s => /[–—]/.test(s.name + s.desc + s.src.n)).map(s => s.imp)");
  assert.deepStrictEqual(bad, []);
});
t('neue_uebungen_nur_manuell', () => {
  const r = J("return EX.filter(e => e.src && /Satyananda|Sonnengruß \\(Schritt 6\\)/.test(e.src)).map(e => [e.id, e.man === true])");
  assert.ok(r.length >= 11); assert.ok(r.every(x => x[1]));
});
console.log(n + ' Tests OK');
