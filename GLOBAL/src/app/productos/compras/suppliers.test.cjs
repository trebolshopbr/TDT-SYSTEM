/* eslint-disable @typescript-eslint/no-require-imports -- Cadastro testado sem criar fornecedores reais. */
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const Module=require('node:module');const ts=require('typescript');
function fixture(user={id:'session-user'},result={data:{id:'supplier-id',nome:'Fixture isolada'},error:null}) {
 const writes=[];const filename=path.join(__dirname,'suppliers.ts');const mod=new Module(filename);
 mod.require=()=>({getSessionUser:async()=>user,createClient:async()=>({from:table=>{assert.equal(table,'fornecedores');return {insert:payload=>{writes.push(payload);return {select:()=>({single:async()=>result})};}};}})});
 mod._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,filename);
 return {add:mod.exports.addSupplier,writes};
}
test('cadastro retorna fornecedor selecionável e atribui autor da sessão',async()=>{const f=fixture();const r=await f.add(' Fixture isolada ');assert.equal(r.supplier.id,'supplier-id');assert.deepEqual(f.writes,[{nome:'Fixture isolada',registrado_por:'session-user'}]);});
test('sem sessão ou nome válido não grava fornecedor',async()=>{const f=fixture(null);assert.ok((await f.add('Fixture')).error);assert.equal(f.writes.length,0);const g=fixture();assert.ok((await g.add('  ')).error);assert.ok((await g.add('a'.repeat(201))).error);assert.equal(g.writes.length,0);});
test('duplicidade ou rejeição não anuncia cadastro concluído',async()=>{for(const code of ['23505','42501']){const f=fixture(undefined,{data:null,error:{code}});assert.ok((await f.add('Fixture')).error);}});
