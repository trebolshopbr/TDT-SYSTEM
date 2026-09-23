// Lectura protegida de la memoria activa de TDT. Solo expone los seis archivos canónicos.
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const DOCUMENTOS = [
  ['leeme', 'Orientación', 'LEEME.md', 'Cómo leer, entender y mantener el sistema.'],
  ['mapa', 'Mapa', 'mapa.md', 'Dónde está cada pieza y cómo se conecta.'],
  ['estado', 'Estado', 'estado.md', 'Qué está hecho y qué sigue pendiente.'],
  ['decisiones', 'Decisiones', 'decisiones.md', 'Decisiones confirmadas por TT.'],
  ['bitacora', 'Bitácora', 'bitacora.md', 'Cambios terminados y archivos afectados.'],
  ['revision', 'Revisión', 'revision.md', 'Material histórico conservado fuera del sistema activo.']
];

export async function memoria(root) {
  const base = resolve(root, 'SYSTEM/memoria');
  const documentos = await Promise.all(DOCUMENTOS.map(async ([id, nombre, archivo, funcion]) => {
    const ruta = resolve(base, archivo);
    const [contenido, info] = await Promise.all([readFile(ruta, 'utf8'), stat(ruta)]);
    return { id, nombre, archivo, funcion, actualizado: info.mtime.toISOString(), lineas: contenido.split('\n').length, contenido };
  }));
  return { actualizado: new Date().toISOString(), documentos };
}
