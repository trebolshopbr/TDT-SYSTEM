/* eslint-disable @typescript-eslint/no-require-imports -- Testes isolados, sem enviar arquivos reais. */
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const receipts = require('./attachments.ts');
function fixture({user={id:'11111111-1111-4111-8111-111111111111'},failure=false}={}) {
 const calls=[];
 const file=path.join(__dirname,'comprovantes/route.ts');
 const mod=new Module(file);
 const real=Module.createRequire(file);
 mod.require=name=>name==='@/lib/supabase/server'?{
  getSessionUser:async()=>user,
  createClient:async()=>({storage:{from:bucket=>({
   upload:async(p,f,o)=>{calls.push({bucket,path:p,file:f,options:o});return {error:failure?{message:'rejected'}:null};},
   createSignedUrl:async(p,seconds)=>{calls.push({bucket,path:p,seconds});return failure?{error:{message:'missing'}}:{data:{signedUrl:'https://example.invalid/private-signed-file'},error:null};}
  })}})
 }:name==='../attachments'?receipts:real(name);
 mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,file);
 return {...mod.exports,calls};
}
function request(type='application/pdf',name='nota.pdf') {
 const data=new FormData();data.set('file',new File(['%PDF-1.4 teste isolado'],name,{type}));
 return new Request('http://localhost:3000/productos/compras/comprovantes',{method:'POST',headers:{origin:'http://localhost:3000'},body:data});
}
test('upload privado conserva caminho e não sobrescreve documentos',async()=>{
 const f=fixture();const response=await f.POST(request());assert.equal(response.status,200);
 const result=await response.json();assert.ok(receipts.receiptPath(result.source));assert.equal(f.calls[0].bucket,'compras-comprovantes');assert.equal(f.calls[0].options.upsert,false);assert.equal(await f.calls[0].file.text(),'%PDF-1.4 teste isolado');
});
test('upload rejeita sessão ausente, origem externa e formato não permitido',async()=>{
 const anon=fixture({user:null});assert.equal((await anon.POST(request())).status,401);assert.equal(anon.calls.length,0);
 const f=fixture();assert.equal((await f.POST(new Request('http://localhost:3000/productos/compras/comprovantes',{method:'POST',headers:{origin:'https://example.invalid'}}))).status,403);
 assert.equal((await f.POST(request('text/html','arquivo.html'))).status,400);assert.equal(f.calls.length,0);
});
test('falha no armazenamento não retorna referência de arquivo salvo',async()=>{
 const f=fixture({failure:true});const response=await f.POST(request());assert.equal(response.status,502);assert.equal((await response.json()).source,undefined);
});
test('arquivo privado abre só com sessão, URL curta e sem cache',async()=>{
 const source='arquivo:11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222/nota.pdf';
 const request=new Request('http://localhost:3000/productos/compras/comprovantes?source='+encodeURIComponent(source));
 const f=fixture();const response=await f.GET(request);assert.equal(response.status,302);assert.equal(f.calls[0].seconds,60);assert.match(response.headers.get('cache-control'),/no-store/);
 assert.equal((await fixture({user:null}).GET(request)).status,401);
});
test('tamanho, arquivo vazio e caminhos inválidos são rejeitados',()=>{
 assert.ok(receipts.receiptError({size:0,type:'application/pdf'}));assert.ok(receipts.receiptError({size:receipts.MAX_RECEIPT_SIZE+1,type:'application/pdf'}));
 assert.equal(receipts.receiptPath('arquivo:../../secret'),null);assert.equal(receipts.receiptPath('https://example.invalid'),null);
});
