import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createTdtServer} from '../server.mjs';
import {hashPin} from '../pin.mjs';
const repoRoot=fileURLToPath(new URL('../../..',import.meta.url));

test('System PIN opens a local session, rejects wrong PINs and locks after 5 failures',async()=>{
 const pinStore=await hashPin('4821');
 const server=createTdtServer({root:repoRoot,verifyUser:async()=>null,pinStore});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
 const pin=v=>fetch(origin+'/_tdt/pin',{method:'POST',headers:{Origin:origin},body:v});
 try{
  let r=await fetch(origin+'/_tdt/pin',{method:'POST',headers:{Origin:'http://evil.test'},body:'4821'});assert.equal(r.status,403);
  r=await pin('0000');assert.equal(r.status,401);
  r=await pin('4821');assert.equal(r.status,204);const cookie=r.headers.get('set-cookie').split(';')[0];
  r=await fetch(origin+'/_tdt/session',{headers:{Cookie:cookie}});assert.equal(r.status,204);
  r=await fetch(origin+'/sistema/dashboard-maestro.html',{headers:{Cookie:cookie}});assert.equal(r.status,200);
  r=await fetch(origin+'/_tdt/estructura');assert.equal(r.status,401);
  r=await fetch(origin+'/_tdt/estructura',{headers:{Cookie:cookie}});assert.equal(r.status,200);
  const e=await r.json();assert.ok(e.carpetas.some(c=>c.name==='SYSTEM'));assert.ok(!JSON.stringify(e).includes('node_modules'));
  r=await fetch(origin+'/_tdt/memoria');assert.equal(r.status,401);
  r=await fetch(origin+'/_tdt/memoria',{headers:{Cookie:cookie}});assert.equal(r.status,200);assert.equal((await r.json()).documentos.length,6);
  r=await fetch(origin+'/_tdt/promt');assert.equal(r.status,401);
  r=await fetch(origin+'/_tdt/promt',{headers:{Cookie:cookie}});assert.equal(r.status,200);assert.ok(Array.isArray((await r.json()).preparados));
  r=await fetch(origin+'/_tdt/direccion');assert.equal(r.status,401);
  r=await fetch(origin+'/_tdt/direccion',{headers:{Cookie:cookie}});assert.equal(r.status,200);assert.ok((await r.json()).estado.ahora);
  r=await fetch(origin+'/_tdt/session');assert.equal(r.status,401);
  for(let i=0;i<4;i++)assert.equal((await pin('1111')).status,401);
  assert.equal((await pin('1111')).status,429);
  assert.equal((await pin('4821')).status,429);
 }finally{server.closeAllConnections();server.close()}
});
