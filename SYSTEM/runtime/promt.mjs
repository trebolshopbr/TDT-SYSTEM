// Registro local del subapartado "Promt": prompts preparados por sector y los que ya se usaron.
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const t = (v, max = 400) => typeof v === 'string' ? v.slice(0, max) : '';

export async function promt(root) {
  const archivo = 'SYSTEM/ia/promt/registro.json';
  const data = JSON.parse(await readFile(resolve(root, archivo), 'utf8'));
  return {
    archivo,
    preparados: (Array.isArray(data.preparados) ? data.preparados : []).map(p => ({
      id: t(p.id, 80), sector: t(p.sector, 60), titulo: t(p.titulo, 160), para: t(p.para, 200),
      autor: t(p.autor, 60), creado: t(p.creado, 40), texto: t(p.texto, 20000)
    })),
    usos: (Array.isArray(data.usos) ? data.usos : []).map(u => ({
      promptId: t(u.promptId, 80), agente: t(u.agente, 60), fecha: t(u.fecha, 40), nota: t(u.nota, 600)
    }))
  };
}
