const assert = require('node:assert');
const { loadCatalog, run } = require('./helpers');
const base = require('./fixtures/kat-baseline.json');
const ctx = loadCatalog();
let n = 0;
for (const id of Object.keys(base)) {
  const r = JSON.parse(run(ctx, `(() => { const e = JSON.parse(JSON.stringify(EX.find(x => x.id === ${JSON.stringify(id)}))); delete e.kat; delete e.chakraSrc; delete e.peak; deriveKat(e); return JSON.stringify({ kat: e.kat, chakraSrc: e.chakraSrc, peak: e.peak }); })()`));
  assert.deepStrictEqual(r, base[id], 'Abweichung bei ' + id); n++;
}
console.log('derive_matches_baseline OK', n);
const c = JSON.parse(run(ctx, `(() => { const e = { id: 'c_x', n: 'T', c: 'stand', lv: 1, m: 2, pose: 'tree', t: ['balance'], x: [], s: 1 }; deriveKat(e); return JSON.stringify(e.kat); })()`));
assert.ok(c.pos.includes('balance')); assert.deepStrictEqual(c.mat, ['matte']);
console.log('derive_custom_exercise OK');
