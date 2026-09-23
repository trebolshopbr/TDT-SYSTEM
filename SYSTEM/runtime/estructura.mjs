// Lectura en vivo de cómo está ordenado TDT NUEVO, para el apartado "Mapa" del dashboard maestro.
// Solo devuelve nombres de carpetas y archivos, descripciones de SYSTEM/memoria/mapa.md y el estado de las direcciones locales.
// Nunca devuelve el contenido de los archivos.
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const SKIP = new Set(['node_modules', '.git', '.next', '.vercel', '.wrangler', '.temp', '.claude']);
const hidden = n => n.startsWith('.') || SKIP.has(n) || n.endsWith('.tsbuildinfo');

async function tree(dir, depth) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const out = [];
  for (const e of entries.sort((a, b) => (b.isDirectory() - a.isDirectory()) || a.name.localeCompare(b.name))) {
    if (hidden(e.name)) continue;
    const node = { name: e.name, dir: e.isDirectory() };
    if (node.dir && depth > 1) node.children = await tree(resolve(dir, e.name), depth - 1);
    else if (node.dir) node.count = (await readdir(resolve(dir, e.name)).catch(() => [])).filter(n => !hidden(n)).length;
    out.push(node);
    if (out.length >= 60) break;
  }
  return out;
}

async function descriptions(root) {
  const text = await readFile(resolve(root, 'SYSTEM/memoria/mapa.md'), 'utf8').catch(() => '');
  const map = {};
  for (const m of text.matchAll(/^\| `([^`]+)` \| (.+?) \|$/gm)) map[m[1].replace(/\/$/, '')] = m[2].replace(/`/g, '');
  const simple = {};
  for (const m of text.matchAll(/^- `([^`]+)` — (.+)$/gm)) simple[m[1]] = m[2];
  return { map, simple };
}

async function up(url) {
  return fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(1500) }).then(r => r.status < 500, () => false);
}

export async function estructura(root, origin) {
  const [carpetas, { map: desc, simple }] = await Promise.all([
    tree(root, 3),
    descriptions(root)
  ]);
  const rutas = [
    ['Portada', origin + '/'], ['Proyectos', origin + '/proyectos.html'], ['System', origin + '/system.html'],
    ['Landing Global', origin + '/global.html'], ['Landing Growth', origin + '/growth.html'], ['Landing Digital', origin + '/digital.html'],
    ['Personal', origin + '/personal.html'], ['App Global', 'http://127.0.0.1:3000/login']
  ];
  const estados = await Promise.all(rutas.map(([, u]) => up(u)));
  return {
    raiz: root,
    actualizado: new Date().toISOString(),
    carpetas, desc, simple,
    rutas: rutas.map(([nombre, url], i) => ({ nombre, url: url.replace('127.0.0.1', 'localhost'), activa: estados[i] }))
  };
}
