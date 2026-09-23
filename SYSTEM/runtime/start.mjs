import {createTdtServer,supabaseVerifier} from './server.mjs';
import {loadPinStore} from './pin.mjs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const root=resolve(fileURLToPath(new URL('../..',import.meta.url)));
const current=await fetch('http://127.0.0.1:8790/_tdt/health').then(r=>r.json()).catch(()=>null);
if(current?.service==='tdt-local'&&current.root===root){console.log('TDT ya está abierto: http://localhost:8790');process.exit(0)}
// Durante la construcción local TT entra directo. Cambiar a true reactiva el PIN existente.
const server=createTdtServer({root,verifyUser:await supabaseVerifier(root),pinStore:await loadPinStore(),requirePin:false});
await new Promise((ok,fail)=>{server.once('error',fail);server.listen(8790,'127.0.0.1',ok)});
function stop(){server.close();setTimeout(()=>process.exit(0),500).unref()}
process.on('SIGTERM',stop);process.on('SIGINT',stop);
console.log('TDT listo: http://localhost:8790');
