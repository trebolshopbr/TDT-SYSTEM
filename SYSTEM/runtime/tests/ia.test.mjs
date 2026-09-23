import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createTdtServer} from '../server.mjs';
const repoRoot=fileURLToPath(new URL('../../..',import.meta.url));

test('AI registry is served to the dashboard and only with a session',async()=>{
 const server=createTdtServer({root:repoRoot,verifyUser:async()=>null,requirePin:true});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
 const open=createTdtServer({root:repoRoot,verifyUser:async()=>null,requirePin:false});
 await new Promise(r=>open.listen(0,'127.0.0.1',r));const openOrigin=`http://127.0.0.1:${open.address().port}`;
 try{
  assert.equal((await fetch(origin+'/_tdt/ia')).status,401);
  const r=await fetch(openOrigin+'/_tdt/ia');assert.equal(r.status,200);
  const d=await r.json();
  for(const id of ['gpt-work','claude-code','antigravity-ide'])assert.ok(Array.isArray(d.herramientas[id].activos),id);
  const a=d.herramientas['claude-code'].activos[0];
  assert.ok(a.haciendo&&Array.isArray(a.hecho)&&a.actualizado);
  assert.equal(a.agente.nombre,'claude system1');
  assert.match(a.agente.color,/^#[0-9A-Fa-f]{6}$/);
  assert.ok(['circulo','cuadrado','rombo','hexagono','pildora'].includes(a.agente.forma));
  assert.ok(a.secciones.length>0&&a.secciones.every(x=>x.titulo));
  const q=await (await fetch(openOrigin+'/_tdt/promt')).json();
  assert.ok(q.preparados.length>=1&&q.preparados[0].id&&q.preparados[0].texto.length>200);
  assert.ok(Array.isArray(q.usos));
 }finally{server.closeAllConnections();server.close();open.closeAllConnections();open.close()}
});
