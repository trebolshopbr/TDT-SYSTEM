import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createTdtServer} from '../server.mjs';
const token='test.'+Buffer.from(JSON.stringify({exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')+'.verified-by-test-double';
const repoRoot=fileURLToPath(new URL('../../..',import.meta.url));

test('local server protects the System dashboard and clears access on logout',async()=>{
 const server=createTdtServer({root:repoRoot,verifyUser:async t=>t===token?{id:'user-1',email:'admin@example.test',app_metadata:{role:'admin'}}:null});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
 try{
  let r=await fetch(origin+'/sistema/dashboard-maestro.html',{redirect:'manual'});assert.equal(r.status,302);
  r=await fetch(origin+'/_tdt/session',{method:'POST',headers:{Origin:'http://evil.test',Authorization:'Bearer '+token}});assert.equal(r.status,403);
  r=await fetch(origin+'/_tdt/session',{method:'POST',headers:{Origin:origin,Authorization:'Bearer invalid'}});assert.equal(r.status,401);
  r=await fetch(origin+'/_tdt/session',{method:'POST',headers:{Origin:origin,Authorization:'Bearer '+token}});assert.equal(r.status,204);assert.match(r.headers.get('set-cookie'),/HttpOnly; SameSite=Strict/);const cookie=r.headers.get('set-cookie').split(';')[0];
  r=await fetch(origin+'/sistema/dashboard-maestro.html',{headers:{Cookie:cookie}});assert.equal(r.status,200);assert.match(await r.text(),/<title>TDT · Dashboard maestro<\/title>/);
  r=await fetch(origin+'/.env');assert.equal(r.status,404);
  r=await fetch(origin+'/growth');assert.equal(r.status,404);
  r=await fetch(origin+'/_tdt/session',{method:'DELETE',headers:{Origin:origin,Cookie:cookie}});assert.equal(r.status,204);
  r=await fetch(origin+'/sistema/dashboard-maestro.html',{headers:{Cookie:cookie},redirect:'manual'});assert.equal(r.status,302);
 }finally{server.closeAllConnections();server.close()}
});
