import type { Tone } from '../components/ui'
import type { Enums } from './database.types'

export const estadoPedido: Record<Enums<'estado_pedido'>, { label: string; tone: Tone }> = {
  pendiente: { label: 'Pendiente', tone: 'amber' },
  enviado: { label: 'Enviado', tone: 'blue' },
  entregado: { label: 'Entregado', tone: 'green' },
  cancelado: { label: 'Cancelado', tone: 'red' },
}

export const metodoPago: Record<Enums<'metodo_pago'>, string> = {
  pix: 'Pix',
  credito: 'Crédito',
  debito: 'Débito',
  transferencia: 'Transferencia',
  efectivo: 'Efectivo',
  otro: 'Otro',
}

export const tipoPlataforma: Record<string, string> = {
  marketplace: 'Marketplace',
  tienda_propia: 'Tienda propia',
  red_social: 'Red social',
}

export const categoriasGasto: Record<string, string> = {
  mercaderia: 'Mercadería',
  envios: 'Envíos',
  publicidad: 'Publicidad',
  comisiones: 'Comisiones',
  servicios: 'Servicios',
  impuestos: 'Impuestos',
  otro: 'Otro',
}

export const platformColors = ['#10b96b', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ef4444', '#64748b']
