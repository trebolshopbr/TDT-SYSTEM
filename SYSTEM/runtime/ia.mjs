// Registro de lo que hacen las IA. Cada IA anota su trabajo en SYSTEM/ia/agentes/registro.json.
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const texto = (v, max = 4000) => typeof v === 'string' ? v.slice(0, max) : '';
const lista = (v, max = 60) => Array.isArray(v) ? v.slice(0, max).map(x => texto(String(x), 600)) : [];
const FORMAS = ['circulo', 'cuadrado', 'rombo', 'hexagono', 'pildora'];

// La identidad visual es libre pero acotada: solo valores que se pueden mostrar sin riesgo.
function agente(v) {
  if (!v || typeof v !== 'object') return null;
  return {
    nombre: texto(v.nombre, 60),
    simbolo: [...texto(v.simbolo, 20)].slice(0, 4).join(''),
    color: /^#[0-9a-fA-F]{6}$/.test(v.color) ? v.color : '#FFFFFF',
    forma: FORMAS.includes(v.forma) ? v.forma : 'circulo',
    lema: texto(v.lema, 160)
  };
}

const secciones = v => (Array.isArray(v) ? v.slice(0, 20) : []).map(s => ({
  titulo: texto(s && s.titulo, 120), texto: texto(s && s.texto, 4000), items: lista(s && s.items)
}));

export async function ia(root) {
  const archivo = 'SYSTEM/ia/agentes/registro.json';
  const data = JSON.parse(await readFile(resolve(root, archivo), 'utf8'));
  const herramientas = {};
  for (const [id, h] of Object.entries(data.herramientas || {})) {
    herramientas[id] = {
      nombre: texto(h.nombre, 60) || id,
      activos: (Array.isArray(h.activos) ? h.activos : []).map(a => ({
        id: texto(a.id, 80), titulo: texto(a.titulo, 160), estado: texto(a.estado, 30) || 'activo', responsable: texto(a.responsable, 160),
        haciendo: texto(a.haciendo), hecho: lista(a.hecho), siguiente: texto(a.siguiente), bloqueos: lista(a.bloqueos),
        archivos: lista(a.archivos), fuente: texto(a.fuente, 200), actualizado: texto(a.actualizado, 40),
        agente: agente(a.agente), secciones: secciones(a.secciones)
      }))
    };
  }
  return { archivo, herramientas };
}
