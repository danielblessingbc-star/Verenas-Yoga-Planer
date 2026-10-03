const vm = require('vm'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..', 'js');
function loadCatalog(extra) {
  const ctx = vm.createContext({ console, structuredClone });
  vm.runInContext('var state = { customEx: [], exEdits: {}, vocab: {}, ratings: {} }; function save() {} function exAll() { return EX.concat(state.customEx); }', ctx);
  ['poses', 'exercises', 'skript', 'shakti', 'kategorien'].concat(extra || []).forEach(f => {
    const file = f.endsWith('.js') ? f : f + '.js';
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), ctx, { filename: file });
  });
  return ctx;
}
const run = (ctx, code) => vm.runInContext(code, ctx);
module.exports = { loadCatalog, run };
