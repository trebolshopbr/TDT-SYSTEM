// Lee los roles desde sus archivos, que son su única fuente: SYSTEM/CLAUDE.md (Guardián del sistema) y SYSTEM/roles/*.md.
// Cada archivo declara su área en "## Área" (System, Global, Growth, Digital o Personal) y su herramienta en "## Herramienta" (id del registro de IA).
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const limpio = t => t.replace(/\*\*/g, '').replace(/`/g, '').trim();

async function leerRol(root, archivo) {
  const texto = await readFile(resolve(root, archivo), 'utf8').catch(() => null);
  if (!texto) return null;
  const nombre = limpio((texto.match(/^#\s+Rol:\s*(.+)$/m) || [])[1] || '');
  if (!nombre) return null;
  const secciones = {};
  texto.split(/^##\s+/m).slice(1).forEach(s => { const i = s.indexOf('\n'); secciones[s.slice(0, i).trim()] = s.slice(i + 1); });
  const hace = (secciones['Qué haces'] || '').split('\n').map(l => l.match(/^\d+\.\s+(.*)$/)).filter(Boolean).map(m => limpio(m[1]));
  const herramienta = limpio(secciones['Herramienta'] || '') || 'claude-code';
  const area = limpio(secciones['Área'] || '') || 'System';
  const carril = limpio(secciones['Tu carril'] || '').slice(0, 400);
  return { nombre, herramienta, area, carril, hace, archivo };
}

export async function roles(root) {
  const extra = (await readdir(resolve(root, 'SYSTEM/roles')).catch(() => [])).filter(f => f.endsWith('.md')).sort().map(f => 'SYSTEM/roles/' + f);
  const lista = (await Promise.all(['SYSTEM/CLAUDE.md', ...extra].map(a => leerRol(root, a)))).filter(Boolean);
  return { roles: lista };
}
