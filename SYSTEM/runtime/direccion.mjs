import { appendFile, readFile, rename, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const CAMPOS_AHORA = ['prioridad', 'decision', 'espera', 'bloqueo', 'delegar', 'noHacer'];
const CAMPOS_HORIZONTE = ['dias7', 'dias30', 'dias90', 'meses12'];
const limpio = valor => String(valor ?? '').trim().slice(0, 5000);

function normalizar(data = {}) {
  return {
    ahora: Object.fromEntries(CAMPOS_AHORA.map(k => [k, limpio(data.ahora?.[k])])),
    horizontes: Object.fromEntries(CAMPOS_HORIZONTE.map(k => [k, limpio(data.horizontes?.[k])])),
    inbox: Array.isArray(data.inbox) ? data.inbox.slice(0, 200).map(x => ({
      id: limpio(x.id).slice(0, 80), texto: limpio(x.texto), creado: limpio(x.creado).slice(0, 40)
    })).filter(x => x.id && x.texto) : [],
    actualizado: data.actualizado || null
  };
}

async function decisiones(root) {
  const text = await readFile(resolve(root, 'SYSTEM/memoria/decisiones.md'), 'utf8').catch(() => '');
  return [...text.matchAll(/^- (.+)$/gm)].slice(0, 8).map(m => m[1]);
}

export async function leerDireccion(root, sub = 'estado') {
  const file = sub === 'global' ? 'global.json' : 'estado.json';
  const archivo = resolve(root, `SYSTEM/direccion/${file}`);
  const estado = normalizar(JSON.parse(await readFile(archivo, 'utf8').catch(() => '{}')));
  return { estado, decisiones: await decisiones(root) };
}

export async function guardarDireccion(root, entrada, sub = 'estado') {
  const file = sub === 'global' ? 'global.json' : 'estado.json';
  const archivo = resolve(root, `SYSTEM/direccion/${file}`);
  const anterior = normalizar(JSON.parse(await readFile(archivo, 'utf8').catch(() => '{}')));
  const estado = normalizar(entrada);
  estado.actualizado = new Date().toISOString();
  const hist = sub === 'global' ? 'historial-global.ndjson' : 'historial.ndjson';
  await appendFile(resolve(root, `SYSTEM/direccion/${hist}`), JSON.stringify({ fecha: estado.actualizado, estado: anterior }) + '\n').catch(() => {});
  const temporal = archivo + '.tmp';
  await writeFile(temporal, JSON.stringify(estado, null, 2) + '\n');
  await rename(temporal, archivo);
  return estado;
}
