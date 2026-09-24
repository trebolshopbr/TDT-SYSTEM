/* eslint-disable @typescript-eslint/no-require-imports -- Mutação isolada; nunca acessa o banco real. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const ts = require('typescript');
const { emptyLot } = require('./model.ts');
const id = '11111111-1111-4111-8111-111111111111';
const product = '22222222-2222-4222-8222-222222222222';
function fixture({ session = { id: 'authenticated-user' }, result = { data: { id, revision: 1 }, error: null }, fail = false } = {}) {
  const writes = [], filters = [], refreshed = [];
  const query = { insert: p => { writes.push(['insert', p]); return query; }, update: p => { writes.push(['update', p]); return query; }, eq: (k,v) => { filters.push([k,v]); return query; }, select: () => query, single: async () => { if(fail) throw Error('offline'); return result; } };
  const filename = path.join(__dirname, 'actions.ts');
  const mod = new Module(filename);
  const mocks = {
    '@/lib/supabase/server': { getSessionUser: async () => session, createClient: async () => ({ from: name => { assert.equal(name, 'compras_lotes'); return query; } }) },
    'next/cache': { revalidatePath: p => refreshed.push(p) },
    './model': require('./model.ts'),
  };
  mod.require = name => { if (!Object.hasOwn(mocks,name)) throw Error(`Unexpected import ${name}`); return mocks[name]; };
  mod._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, filename);
  return { save: mod.exports.saveLot, writes, filters, refreshed };
}
test('salvar exige sessão e valida dados antes de escrever', async () => {
  const anon = fixture({session:null}); assert.ok((await anon.save(emptyLot(), id, product, null)).error); assert.equal(anon.writes.length,0);
  const f=fixture(); for (const draft of [null,{...emptyLot(),quantity:'-1'}]) assert.ok((await f.save(draft,id,product,null)).error);
  assert.equal(f.writes.length,0);
});
test('compra pendente salva atomicamente com autor da sessão e identidade estável', async () => {
  const f=fixture(); assert.equal((await f.save(emptyLot(),id,product,null)).id,id);
  assert.deepEqual(f.writes,[['insert',{ id, producto_id:product, datos:emptyLot(), registrado_por:'authenticated-user', atualizado_por:'authenticated-user' }]]);
  assert.equal(f.refreshed.length,2);
});
test('edição verifica revisão para não sobrescrever outro sócio', async () => {
  const f=fixture({result:{data:{id,revision:4},error:null}}); assert.equal((await f.save(emptyLot(),id,product,3)).revision,4);
  assert.deepEqual(f.filters,[['id',id],['producto_id',product],['revision',3]]);
  assert.equal(f.writes[0][1].revision,4); assert.equal(f.writes[0][1].registrado_por,undefined);
});
test('tabela ausente, conflito e permissão negada não anunciam sucesso', async () => {
  for (const code of ['42P01','PGRST205','PGRST116','23505','42501']) {
    const f=fixture({result:{data:null,error:{code}}}); assert.ok((await f.save(emptyLot(),id,product,null)).error); assert.equal(f.refreshed.length,0);
  }
});
test('falha de rede mantém resultado incerto explícito e não confirma salvamento', async () => {
  const f=fixture({fail:true}); assert.match((await f.save(emptyLot(),id,product,null)).error,/conexão/); assert.equal(f.refreshed.length,0);
});
