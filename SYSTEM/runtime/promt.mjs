// Registro local del subapartado temporal "Promt".
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export async function promt(root) {
  const archivo = 'SYSTEM/ia/promt/registro.json';
  const data = JSON.parse(await readFile(resolve(root, archivo), 'utf8'));
  return {
    archivo,
    preparados: Array.isArray(data.preparados) ? data.preparados : [],
    usos: Array.isArray(data.usos) ? data.usos : []
  };
}
