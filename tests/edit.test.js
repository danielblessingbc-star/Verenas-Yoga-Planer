const assert = require('node:assert');
const { loadCatalog, run } = require('./helpers');
const ctx = loadCatalog(['katalog-edit']);
const J = code => JSON.parse(run(ctx, `JSON.stringify((() => { ${code} })())`));
const reset = () => run(ctx, 'state.exEdits = {}; state.vocab = {}; state.customEx = []; applyCatalogState();');
let n = 0; const t = (name, fn) => { reset(); fn(); console.log('OK', name); n++; };
const treeId = J("return EX.find(e => e.pose === 'tree').id");

t('edit_field_overlay', () => {
  run(ctx, `exEdit(${JSON.stringify(treeId)}, { fields: { n: 'Baum neu', pose: 'warrior1' } })`);
  assert.deepStrictEqual(J(`const e = EX.find(x => x.id === ${JSON.stringify(treeId)}); return [e.n, e.pose, exIsEdited(e.id)]`), ['Baum neu', 'warrior1', true]);
  run(ctx, `exEditReset(${JSON.stringify(treeId)})`);
  assert.deepStrictEqual(J(`const e = EX.find(x => x.id === ${JSON.stringify(treeId)}); return [e.pose, e.n !== 'Baum neu', exIsEdited(e.id)]`), ['tree', true, false]);
});
t('manual_group_survives_pose_change', () => {
  const id = JSON.stringify(treeId);
  run(ctx, `exEdit(${id}, { kat: { reg: ['nacken'] } }); exEdit(${id}, { fields: { pose: 'warrior1' } })`);
  assert.deepStrictEqual(J(`return EX.find(x => x.id === ${id}).kat.reg`), ['nacken']);
  const auto = J(`const e = JSON.parse(JSON.stringify(EX.find(x => x.id === ${id}))); deriveKat(e); return e.kat.pos`);
  assert.deepStrictEqual(J(`return EX.find(x => x.id === ${id}).kat.pos`), auto);
  assert.deepStrictEqual(J(`return manualGroups(${id})`), ['reg']);
});
t('manual_empty_stays_empty', () => {
  const id = JSON.stringify(treeId);
  run(ctx, `exEdit(${id}, { kat: { mus: [], en: '' } }); exEdit(${id}, { fields: { pose: 'child' } })`);
  assert.deepStrictEqual(J(`const k = EX.find(x => x.id === ${id}).kat; return [k.mus, k.en]`), [[], '']);
});
t('auto_and_recalc', () => {
  const id = JSON.stringify(treeId);
  const orig = J(`return EX.find(x => x.id === ${id}).kat.reg`);
  run(ctx, `exEdit(${id}, { kat: { reg: ['nacken'], mus: [] } }); exEdit(${id}, { auto: ['reg'] })`);
  assert.deepStrictEqual(J(`return EX.find(x => x.id === ${id}).kat.reg`), orig);
  assert.deepStrictEqual(J(`return manualGroups(${id})`), ['mus']);
  run(ctx, `exEdit(${id}, { recalcAll: true })`);
  assert.deepStrictEqual(J(`return manualGroups(${id})`), []);
});
t('br_edit_and_reset', () => {
  const o = J('return { id: BR[0].id, n: BR[0].n, st: BR[0].st, x: BR[0].x }');
  run(ctx, `exEdit(${JSON.stringify(o.id)}, { fields: { n: 'X', ic: 'ujjayi', st: ['yin'], x: ['knie'] } })`);
  assert.deepStrictEqual(J('return [BR[0].n, BR[0].ic, BR[0].st, BR[0].x]'), ['X', 'ujjayi', ['yin'], ['knie']]);
  run(ctx, `exEditReset(${JSON.stringify(o.id)})`);
  assert.deepStrictEqual(J('return [BR[0].n, BR[0].ic, BR[0].st, BR[0].x]'), [o.n, null, o.st, o.x]);
});
t('custom_edit', () => {
  run(ctx, "state.customEx.push({ id: 'c_t', n: 'T', c: 'stand', lv: 1, m: 2, pose: 'ratlos', t: [], x: [], e: '', h: '', s: 1, o: 1000, custom: true }); applyCatalogState();");
  assert.ok(J("return !!state.customEx[0].kat"));
  run(ctx, "exEdit('c_t', { fields: { pose: 'tree' }, kat: { mat: ['matte', 'block'] } })");
  assert.deepStrictEqual(J('const e = state.customEx[0]; return [e.pose, e.kat.mat]'), ['tree', ['matte', 'block']]);
  run(ctx, "exEditReset('c_t')");
  assert.deepStrictEqual(J('return state.customEx[0].kat.mat'), ['matte']);
});
t('vocab_add_use_remove', () => {
  const id = J("return vocabAdd('stile', 'Faszien')");
  assert.strictEqual(J(`return STILE[${JSON.stringify(id)}]`), 'Faszien');
  assert.strictEqual(J("return vocabAdd('stile', 'Faszien')"), id);
  const x = JSON.stringify(treeId);
  run(ctx, `exEdit(${x}, { fields: { st: [${JSON.stringify(id)}] } })`);
  assert.strictEqual(J(`return vocabRemove('stile', ${JSON.stringify(id)})`), false);
  assert.strictEqual(J(`return STILE[${JSON.stringify(id)}]`), 'Faszien');
  run(ctx, `exEdit(${x}, { fields: { st: [] } })`);
  assert.strictEqual(J(`return vocabRemove('stile', ${JSON.stringify(id)})`), true);
  assert.strictEqual(J(`return STILE[${JSON.stringify(id)}] === undefined`), true);
  const g = J("return vocabAdd('kat', 'Lendenwirbel', 'reg')");
  assert.strictEqual(J(`return KAT.reg[${JSON.stringify(g)}]`), 'Lendenwirbel');
  run(ctx, `exEdit(${x}, { kat: { reg: [${JSON.stringify(g)}] } })`);
  assert.strictEqual(J(`return vocabRemove('kat', ${JSON.stringify(g)}, 'reg')`), false);
  const c = J("return vocabAdd('cats', 'Faszienflow')");
  assert.deepStrictEqual(J(`return [CATS[${JSON.stringify(c)}], typeof state.vocab.cats[${JSON.stringify(c)}].color]`), ['Faszienflow', 'string']);
  run(ctx, `vocabRename('cats', ${JSON.stringify(c)}, 'Flow neu')`);
  assert.strictEqual(J(`return CATS[${JSON.stringify(c)}]`), 'Flow neu');
});
t('merge_import_vocab', () => {
  run(ctx, "mergeCatalogImport({ courses: [] })");
  assert.deepStrictEqual(J('return [state.exEdits, state.vocab]'), [{}, {}]);
  run(ctx, `mergeCatalogImport({ vocab: { stile: { v_x: 'X' } }, exEdits: { ${JSON.stringify(treeId)}: { fields: { n: 'N' } } } })`);
  assert.strictEqual(J("return STILE.v_x"), 'X');
  assert.strictEqual(J(`return EX.find(e => e.id === ${JSON.stringify(treeId)}).n`), 'N');
  run(ctx, `mergeCatalogImport({ vocab: { stile: { v_x: 'ANDERS' } }, exEdits: { ${JSON.stringify(treeId)}: { fields: { n: 'M' } } } })`);
  assert.deepStrictEqual(J(`return [STILE.v_x, EX.find(e => e.id === ${JSON.stringify(treeId)}).n]`), ['X', 'N']);
});
t('final_custom_exercise_style_saved', () => {
  const r = J("const o = { id: 'c_n', n: 'N', c: 'stand', lv: 1, m: 2, pose: 'ratlos', t: [], x: [], s: 1 }; return diffFields({ n: 'N', st: ['hatha'], x: [] }, o, true)");
  assert.deepStrictEqual(r.fields, { st: ['hatha'] });
});
t('final_builtin_unchanged_and_unset', () => {
  const r = J("const o = EX_ORIG.get('baum'); return diffFields({ n: o.n, m: o.m, st: ['yin'] }, o, false)");
  assert.deepStrictEqual(r.fields, { st: ['yin'] }); assert.ok(r.unset.includes('n') && r.unset.includes('m'));
});
t('final_geb_in_use_by_course_not_removable', () => {
  const g = J("return vocabAdd('geb', 'Tinnitus')");
  run(ctx, `state.courses = [{ gebrechen: [${JSON.stringify(g)}], sessions: [{ flt: { geb: [] } }] }]`);
  assert.strictEqual(J(`return vocabRemove('geb', ${JSON.stringify(g)})`), false);
  run(ctx, `state.courses = [{ gebrechen: [], sessions: [{ flt: { geb: [${JSON.stringify(g)}] } }] }]`);
  assert.strictEqual(J(`return vocabRemove('geb', ${JSON.stringify(g)})`), false);
  run(ctx, 'state.courses = []');
  assert.strictEqual(J(`return vocabRemove('geb', ${JSON.stringify(g)})`), true);
});
console.log(n, 'Tests OK');
