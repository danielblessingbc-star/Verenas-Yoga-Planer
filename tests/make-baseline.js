const { loadCatalog, run } = require('./helpers');
const ctx = loadCatalog();
const out = JSON.parse(run(ctx, 'JSON.stringify(Object.fromEntries(EX.map(e => [e.id, { kat: e.kat, chakraSrc: e.chakraSrc, peak: e.peak }])))'));
require('fs').writeFileSync(__dirname + '/fixtures/kat-baseline.json', JSON.stringify(out));
console.log(Object.keys(out).length, 'Einträge');
