import http from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { randomBytes } from 'node:crypto';
import { verifyPin } from './pin.mjs';
import { estructura } from './estructura.mjs';
import { memoria } from './memoria.mjs';
import { promt } from './promt.mjs';
import { ia } from './ia.mjs';
import { roles } from './roles.mjs';
import { guardarDireccion, leerDireccion } from './direccion.mjs';

const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.css':'text/css'};
export function createTdtServer({root,verifyUser,pinStore=null,requirePin=true}) {
 const sessions=new Map();
 // PIN de System: 5 intentos fallidos bloquean 10 minutos.
 const pinGuard={fails:0,lockedUntil:0};
 const landing=resolve(root,'SYSTEM/landing-sistema'),system=resolve(root,'SYSTEM/dashboard');
 const projectLanding={
  '/global.html':resolve(root,'GLOBAL/landing'),
  '/personal.html':resolve(root,'PERSONAL/landing/operador-no-guru'),
  '/growth.html':resolve(root,'GROWTH/landing'),
  '/digital.html':resolve(root,'DIGITAL/landing')
 };
 const cookieName='tdt_local_session';
 const idFor=req=>String(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName+'='))?.slice(cookieName.length+1);
 const respond=(res,status,body,headers={})=>{res.writeHead(status,{'Cache-Control':'no-store',...headers});res.end(body)};
 async function identity(req){
  const id=idFor(req),s=sessions.get(id);if(!s)return null;
  if(s.expires<=Date.now()){sessions.delete(id);return null}
  if(!s.pin&&Date.now()-s.checked>30000){
   const u=await verifyUser(s.token).catch(()=>null);
   if(!u||u.app_metadata?.role!=='admin'||u.id!==s.user.id){sessions.delete(id);return null}
   s.user=u;s.checked=Date.now();
  }
  return s.user;
 }
 async function body(req){let n=0,chunks=[];for await(const b of req){n+=b.length;if(n>12*1024*1024)throw Error('body too large');chunks.push(b)}return Buffer.concat(chunks)}
 const server=http.createServer(async(req,res)=>{
  try{
   const host=req.headers.host;
   if(!/^((localhost)|(127\.0\.0\.1)):\d+$/.test(host||''))return respond(res,403,'Host no permitido');
   const origin='http://'+host;
   if(req.headers.origin&&req.headers.origin!==origin)return respond(res,403,'Origen no permitido');
   if(req.headers['sec-fetch-site']==='cross-site')return respond(res,403,'Origen no permitido');
   const url=new URL(req.url,origin),path=decodeURIComponent(url.pathname);
   if(path==='/_tdt/health')return respond(res,200,JSON.stringify({service:'tdt-local',root,pinRequired:requirePin}),{'Content-Type':'application/json'});
   if(path==='/_tdt/pin'){
    if(req.method!=='POST'||req.headers.origin!==origin)return respond(res,403,'Origen no permitido');
    if(!pinStore)return respond(res,503,'PIN no configurado');
    if(pinGuard.lockedUntil>Date.now())return respond(res,429,String(Math.ceil((pinGuard.lockedUntil-Date.now())/60000)));
    const pin=String(await body(req).catch(()=>'')).trim();
    if(!/^\d{4}$/.test(pin)||!(await verifyPin(pinStore,pin))){
     if(++pinGuard.fails>=5){pinGuard.fails=0;pinGuard.lockedUntil=Date.now()+600000;return respond(res,429,'10')}
     return respond(res,401,'PIN incorrecto');
    }
    pinGuard.fails=0;
    const seconds=8*3600,id=randomBytes(32).toString('hex');
    sessions.delete(idFor(req));
    sessions.set(id,{user:{id:'system-pin',email:'tt@system.local',app_metadata:{role:'admin'}},pin:true,checked:Date.now(),expires:Date.now()+seconds*1000});
    return respond(res,204,'',{'Set-Cookie':`${cookieName}=${id}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${seconds}`});
   }
   if(path==='/_tdt/session'){
    if(req.method==='GET')return respond(res,(!requirePin||await identity(req))?204:401,'');
    if(req.method==='DELETE'){sessions.delete(idFor(req));return respond(res,204,'',{'Set-Cookie':cookieName+'=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0'})}
    if(req.method!=='POST'||req.headers.origin!==origin)return respond(res,403,'Origen no permitido');
    const token=String(req.headers.authorization||'').replace(/^Bearer /,'');
    const user=await verifyUser(token).catch(()=>null);
    if(!user||!user.email||user.app_metadata?.role!=='admin')return respond(res,401,'Acceso no autorizado');
    // Read expiry only AFTER the token has been verified by Supabase.
    let expiry=0;try{expiry=JSON.parse(Buffer.from(token.split('.')[1],'base64url')).exp*1000}catch{}
    const seconds=Math.min(3600,Math.floor((expiry-Date.now())/1000));
    if(seconds<=0)return respond(res,401,'Sesión vencida');
    const previous=idFor(req);sessions.delete(previous);
    for(const [id,s] of sessions)if(s.expires<=Date.now())sessions.delete(id);
    const id=randomBytes(32).toString('hex');sessions.set(id,{user,token,checked:Date.now(),expires:Date.now()+seconds*1000});
    return respond(res,204,'',{'Set-Cookie':`${cookieName}=${id}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${seconds}`});
   }
   const privateRoute=path.startsWith('/sistema/');
   const user=requirePin?await identity(req):{id:'local-owner',email:'tt@system.local',app_metadata:{role:'admin'}};
   if(privateRoute&&!user)return respond(res,302,'',{'Location':'/system.html'});
   if(path==='/_tdt/estructura'){
    if(!user)return respond(res,401,'{"error":"Unauthorized"}',{'Content-Type':'application/json'});
    return respond(res,200,JSON.stringify(await estructura(root,origin)),{'Content-Type':'application/json'});
   }
   if(path==='/_tdt/memoria'){
    if(!user)return respond(res,401,'{"error":"Unauthorized"}',{'Content-Type':'application/json'});
    return respond(res,200,JSON.stringify(await memoria(root)),{'Content-Type':'application/json'});
   }
   if(path==='/_tdt/roles'){
    if(!user)return respond(res,401,'{"error":"Unauthorized"}',{'Content-Type':'application/json'});
    return respond(res,200,JSON.stringify(await roles(root)),{'Content-Type':'application/json'});
   }
   if(path==='/_tdt/ia'){
    if(!user)return respond(res,401,'{"error":"Unauthorized"}',{'Content-Type':'application/json'});
    return respond(res,200,JSON.stringify(await ia(root)),{'Content-Type':'application/json'});
   }
   if(path==='/_tdt/promt'){
    if(!user)return respond(res,401,'{"error":"Unauthorized"}',{'Content-Type':'application/json'});
    return respond(res,200,JSON.stringify(await promt(root)),{'Content-Type':'application/json'});
   }
   if(path==='/_tdt/direccion'){
    if(!user)return respond(res,401,'{"error":"Unauthorized"}',{'Content-Type':'application/json'});
    if(req.method==='GET')return respond(res,200,JSON.stringify(await leerDireccion(root)),{'Content-Type':'application/json'});
    if(req.method!=='PUT'||req.headers.origin!==origin)return respond(res,403,'Origen no permitido');
    const entrada=JSON.parse(String(await body(req)));
    return respond(res,200,JSON.stringify({estado:await guardarDireccion(root,entrada)}),{'Content-Type':'application/json'});
   }
   if(path==='/index.html')return respond(res,301,'',{'Location':'/'});
   if(path.startsWith('/sistema/')||path==='/'||/^\/(tdtsystem|proyectos|dashboard|system|personal|global|growth|digital)\.html$/.test(path)||/^\/(auth|config)\.js$/.test(path)||path.startsWith('/marca/')){
    if(!['GET','HEAD'].includes(req.method))return respond(res,405,'Método no permitido');
    const base=path.startsWith('/sistema/')?system:projectLanding[path]??landing;
    const rel=path.startsWith('/sistema/')?path.slice(9):path==='/'?'tdtsystem.html':path.slice(1);
    if(rel.split('/').some(x=>x.startsWith('.')))return respond(res,404,'No disponible');
    const file=await realpath(resolve(base,rel)).catch(()=>null);
    if(!file||!file.startsWith(base+sep)||!mime[extname(file)])return respond(res,404,'No disponible');
    const bytes=await readFile(file);return respond(res,200,req.method==='HEAD'?'':bytes,{'Content-Type':mime[extname(file)],'X-Content-Type-Options':'nosniff'});
   }
   return respond(res,404,'No disponible');
  }catch(error){respond(res,500,'Error del servidor local de TDT.');console.error('TDT request failed:',error.message)}
 });
 return server;
}

export async function supabaseVerifier(root){
 const text=await readFile(resolve(root,'SYSTEM/landing-sistema/config.js'),'utf8');
 const url=text.match(/url:\s*'([^']+)'/)?.[1],key=text.match(/publishableKey:\s*'([^']+)'/)?.[1];
 if(!/^https:\/\/[\w-]+\.supabase\.co$/.test(url||'')||!key)throw Error('Configuración de acceso TDT incompleta');
 return async token=>{
  if(!token||token.length>10000)return null;
  const r=await fetch(url+'/auth/v1/user',{headers:{apikey:key,Authorization:'Bearer '+token},signal:AbortSignal.timeout(12000)});
  return r.ok?await r.json():null;
 };
}
