// Servicios externos donde vive TDT (Vercel, GitHub, Supabase, Namecheap), para el mapa del dashboard.
// Fuente: SYSTEM/servicios/registro.json. Solo nombres, dominios y descripciones: nunca claves.
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const t = (v, max) => typeof v === 'string' ? v.slice(0, max) : '';
const nodo = (n, nivel) => ({
  id: t(n && n.id, 40), nombre: t(n && n.nombre, 80), para: t(n && n.para, 120), detalle: t(n && n.detalle, 200),
  hijos: nivel < 3 && Array.isArray(n && n.hijos) ? n.hijos.slice(0, 30).map(h => nodo(h, nivel + 1)) : []
});

export async function servicios(root) {
  const archivo = 'SYSTEM/servicios/registro.json';
  const data = JSON.parse(await readFile(resolve(root, archivo), 'utf8'));
  return { archivo, actualizado: t(data.actualizado, 40), servicios: (Array.isArray(data.servicios) ? data.servicios : []).slice(0, 20).map(s => nodo(s, 0)) };
}
