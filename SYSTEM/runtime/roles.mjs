// Lee el rol desde SYSTEM/CLAUDE.md, que es su única fuente, para mostrarlo en el mapa del dashboard.
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const limpio = t => t.replace(/\*\*/g, '').replace(/`/g, '').trim();

export async function roles(root) {
  const archivo = 'SYSTEM/CLAUDE.md';
  const texto = await readFile(resolve(root, archivo), 'utf8').catch(() => null);
  if (!texto) return { archivo, roles: [] };
  const nombre = limpio((texto.match(/^#\s+Rol:\s*(.+)$/m) || [])[1] || '');
  const secciones = {};
  texto.split(/^##\s+/m).slice(1).forEach(s => { const i = s.indexOf('\n'); secciones[s.slice(0, i).trim()] = s.slice(i + 1); });
  const hace = (secciones['Qué haces'] || '').split('\n').map(l => l.match(/^\d+\.\s+(.*)$/)).filter(Boolean).map(m => limpio(m[1]));
  return { archivo, roles: nombre ? [{ nombre, hace }] : [] };
}
