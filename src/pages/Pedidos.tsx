import { ClipboardList, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthProvider'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorNote,
  Field,
  Input,
  LoadingBlock,
  Modal,
  PageHeader,
  Select,
  Table,
  Td,
  Textarea,
  Th,
} from '../components/ui'
import { Constants, type Enums, type Tables } from '../lib/database.types'
import { longDate, money, today } from '../lib/format'
import { estadoPedido, metodoPago } from '../lib/labels'
import { supabase } from '../lib/supabase'
import { useData } from '../lib/useData'
import { cn } from '../lib/cn'

const estadoSelect: Record<Enums<'estado_pedido'>, string> = {
  pendiente: 'bg-amber-50 text-amber-800 ring-amber-200',
  enviado: 'bg-sky-50 text-sky-700 ring-sky-200',
  entregado: 'bg-brand-50 text-brand-700 ring-brand-200',
  cancelado: 'bg-red-50 text-red-700 ring-red-200',
}

type Pedido = Tables<'pedidos'> & {
  plataformas: { nombre: string } | null
  productos: { nombre: string } | null
}

export function Pedidos() {
  const { profile, isAdmin } = useAuth()
  const [q, setQ] = useState('')
  const [estado, setEstado] = useState<'' | Enums<'estado_pedido'>>('')
  const [plataforma, setPlataforma] = useState('')
  const [editing, setEditing] = useState<Pedido | 'new' | null>(null)

  const pedidos = useData(
    () =>
      supabase
        .from('pedidos')
        .select('*, plataformas(nombre), productos(nombre)')
        .order('fecha', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(500),
    [],
  )
  const plataformas = useData(() => supabase.from('plataformas').select('*').order('nombre'), [])
  const productos = useData(() => supabase.from('productos').select('*').eq('activo', true).order('nombre'), [])

  const filtrados = useMemo(() => {
    const term = q.trim().toLowerCase()
    return ((pedidos.data ?? []) as Pedido[]).filter(
      (p) =>
        (!estado || p.estado === estado) &&
        (!plataforma || p.plataforma_id === plataforma) &&
        (!term ||
          p.cliente_nombre.toLowerCase().includes(term) ||
          p.productos?.nombre.toLowerCase().includes(term) ||
          p.cliente_contacto?.toLowerCase().includes(term)),
    )
  }, [pedidos.data, q, estado, plataforma])

  const total = filtrados.filter((p) => p.estado !== 'cancelado').reduce((acc, p) => acc + Number(p.monto), 0)

  async function cambiarEstado(p: Pedido, nuevo: Enums<'estado_pedido'>) {
    const { error } = await supabase.from('pedidos').update({ estado: nuevo }).eq('id', p.id)
    if (error) alert(error.message)
    pedidos.reload()
  }

  async function eliminar(p: Pedido) {
    if (!confirm(`¿Eliminar el pedido de ${p.cliente_nombre}? Esta acción no se puede deshacer.`)) return
    const { error } = await supabase.from('pedidos').delete().eq('id', p.id)
    if (error) alert(error.message)
    pedidos.reload()
  }

  const puedeEditar = (p: Pedido) => isAdmin || p.registrado_por === profile?.id

  return (
    <>
      <PageHeader
        title="Pedidos"
        subtitle="Cada pedido descuenta stock y se suma a las ventas de su plataforma automáticamente."
        action={
          <Button onClick={() => setEditing('new')}>
            <Plus className="size-4" /> Nuevo pedido
          </Button>
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-ink-100 p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-400" />
            <Input
              placeholder="Buscar cliente, contacto o producto…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={estado} onChange={(e) => setEstado(e.target.value as typeof estado)} className="md:w-52">
            <option value="">Todos los estados</option>
            {Constants.public.Enums.estado_pedido.map((e) => (
              <option key={e} value={e}>
                {estadoPedido[e].label}
              </option>
            ))}
          </Select>
          <Select value={plataforma} onChange={(e) => setPlataforma(e.target.value)} className="md:w-56">
            <option value="">Todas las plataformas</option>
            {plataformas.data?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </Select>
        </div>

        {pedidos.error && (
          <div className="p-4">
            <ErrorNote message={pedidos.error} />
          </div>
        )}

        {pedidos.loading ? (
          <LoadingBlock />
        ) : filtrados.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="size-5" />}
            title={pedidos.data?.length ? 'Ningún pedido coincide con los filtros' : 'Todavía no hay pedidos'}
            action={!pedidos.data?.length && <Button onClick={() => setEditing('new')}>Registrar el primero</Button>}
          />
        ) : (
          <>
            <ul className="divide-y divide-ink-100 md:hidden">
              {filtrados.map((p) => (
                <li key={p.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink-900">{p.cliente_nombre}</p>
                      <p className="truncate text-xs text-ink-500">
                        {p.productos?.nombre ?? 'Sin producto'}
                        {p.cantidad > 1 && ` ×${p.cantidad}`} · {p.plataformas?.nombre}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold tabular">{money(p.monto)}</p>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-xs text-ink-500">{longDate(p.fecha)}</span>
                    <div className="flex items-center gap-1">
                      <Badge tone={estadoPedido[p.estado].tone}>{estadoPedido[p.estado].label}</Badge>
                      {puedeEditar(p) && (
                        <Button variant="ghost" size="sm" onClick={() => setEditing(p)} aria-label="Editar">
                          <Pencil className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="hidden md:block">
              <Table>
                <thead>
                  <tr>
                    <Th>Fecha</Th>
                    <Th>Cliente</Th>
                    <Th>Producto</Th>
                    <Th>Plataforma</Th>
                    <Th>Estado</Th>
                    <Th className="text-right">Monto</Th>
                    <Th className="text-right">Neto</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((p) => (
                    <tr key={p.id} className="hover:bg-ink-50/60">
                      <Td className="whitespace-nowrap text-ink-600">{longDate(p.fecha)}</Td>
                      <Td>
                        <p className="font-medium text-ink-900">{p.cliente_nombre}</p>
                        {p.cliente_contacto && <p className="text-xs text-ink-500">{p.cliente_contacto}</p>}
                      </Td>
                      <Td>
                        {p.productos?.nombre ?? <span className="text-ink-400">—</span>}
                        {p.cantidad > 1 && <span className="ml-1 text-xs text-ink-500">×{p.cantidad}</span>}
                      </Td>
                      <Td className="text-ink-600">{p.plataformas?.nombre}</Td>
                      <Td>
                        {puedeEditar(p) ? (
                          <select
                            value={p.estado}
                            onChange={(e) => cambiarEstado(p, e.target.value as Enums<'estado_pedido'>)}
                            className={cn(
                              'cursor-pointer rounded-full border-0 py-0.5 pr-6 pl-2 text-xs font-medium ring-1 ring-inset focus:ring-2 focus:ring-brand-500/40',
                              estadoSelect[p.estado],
                            )}
                            aria-label="Cambiar estado"
                          >
                            {Constants.public.Enums.estado_pedido.map((e) => (
                              <option key={e} value={e}>
                                {estadoPedido[e].label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <Badge tone={estadoPedido[p.estado].tone}>{estadoPedido[p.estado].label}</Badge>
                        )}
                      </Td>
                      <Td className="text-right font-medium tabular">{money(p.monto)}</Td>
                      <Td className="text-right text-ink-600 tabular">{money(p.monto_neto)}</Td>
                      <Td className="text-right whitespace-nowrap">
                        {puedeEditar(p) && (
                          <Button variant="ghost" size="sm" onClick={() => setEditing(p)} aria-label="Editar">
                            <Pencil className="size-3.5" />
                          </Button>
                        )}
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => eliminar(p)}
                            aria-label="Eliminar"
                            className="hover:text-red-600"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
            <div className="flex flex-col gap-1 px-4 py-3 text-sm text-ink-600 sm:flex-row sm:items-center sm:justify-between">
              <span>
                {filtrados.length} pedido{filtrados.length === 1 ? '' : 's'}
              </span>
              <span>
                Total (sin cancelados): <strong className="text-ink-900 tabular">{money(total)}</strong>
              </span>
            </div>
          </>
        )}
      </Card>

      {editing && (
        <PedidoForm
          pedido={editing === 'new' ? null : editing}
          plataformas={plataformas.data ?? []}
          productos={productos.data ?? []}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            pedidos.reload()
          }}
        />
      )}
    </>
  )
}

function PedidoForm({
  pedido,
  plataformas,
  productos,
  onClose,
  onSaved,
}: {
  pedido: Pedido | null
  plataformas: Tables<'plataformas'>[]
  productos: Tables<'productos'>[]
  onClose: () => void
  onSaved: () => void
}) {
  const { profile } = useAuth()
  const [form, setForm] = useState({
    fecha: pedido?.fecha ?? today(),
    cliente_nombre: pedido?.cliente_nombre ?? '',
    cliente_contacto: pedido?.cliente_contacto ?? '',
    plataforma_id: pedido?.plataforma_id ?? plataformas.find((p) => p.activa)?.id ?? '',
    producto_id: pedido?.producto_id ?? '',
    cantidad: String(pedido?.cantidad ?? 1),
    monto: pedido ? String(pedido.monto) : '',
    comision_plataforma: pedido ? String(pedido.comision_plataforma) : '0',
    metodo_pago: pedido?.metodo_pago ?? '',
    estado: pedido?.estado ?? 'pendiente',
    notas: pedido?.notas ?? '',
  })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }))

  function elegirProducto(id: string) {
    const prod = productos.find((p) => p.id === id)
    setForm((f) => ({
      ...f,
      producto_id: id,
      monto: prod && !f.monto ? String(Number(prod.precio) * Number(f.cantidad || 1)) : f.monto,
    }))
  }

  const neto = Number(form.monto || 0) - Number(form.comision_plataforma || 0)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!profile) return
    setBusy(true)
    setError(null)
    const payload = {
      fecha: form.fecha,
      cliente_nombre: form.cliente_nombre.trim(),
      cliente_contacto: form.cliente_contacto.trim() || null,
      plataforma_id: form.plataforma_id,
      producto_id: form.producto_id || null,
      cantidad: Number(form.cantidad),
      monto: Number(form.monto),
      comision_plataforma: Number(form.comision_plataforma || 0),
      metodo_pago: (form.metodo_pago || null) as Enums<'metodo_pago'> | null,
      estado: form.estado as Enums<'estado_pedido'>,
      notas: form.notas.trim() || null,
    }
    const { error } = pedido
      ? await supabase.from('pedidos').update(payload).eq('id', pedido.id)
      : await supabase.from('pedidos').insert({ ...payload, registrado_por: profile.id })
    setBusy(false)
    if (error) setError(error.message)
    else onSaved()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={pedido ? 'Editar pedido' : 'Nuevo pedido'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="pedido-form" disabled={busy}>
            {busy ? 'Guardando…' : 'Guardar'}
          </Button>
        </>
      }
    >
      <form id="pedido-form" onSubmit={onSubmit} className="grid grid-cols-2 gap-4">
        <Field label="Cliente" className="col-span-2 sm:col-span-1">
          <Input required value={form.cliente_nombre} onChange={set('cliente_nombre')} />
        </Field>
        <Field label="Contacto" className="col-span-2 sm:col-span-1">
          <Input value={form.cliente_contacto} onChange={set('cliente_contacto')} placeholder="WhatsApp, email…" />
        </Field>
        <Field label="Fecha">
          <Input type="date" required value={form.fecha} onChange={set('fecha')} />
        </Field>
        <Field label="Plataforma">
          <Select required value={form.plataforma_id} onChange={set('plataforma_id')}>
            <option value="" disabled>
              Elegir…
            </option>
            {plataformas
              .filter((p) => p.activa || p.id === form.plataforma_id)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
          </Select>
        </Field>
        <Field label="Producto" className="col-span-2 sm:col-span-1">
          <Select value={form.producto_id} onChange={(e) => elegirProducto(e.target.value)}>
            <option value="">Sin producto</option>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} ({p.stock} u.)
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Cantidad" className="col-span-2 sm:col-span-1">
          <Input type="number" min={1} required value={form.cantidad} onChange={set('cantidad')} />
        </Field>
        <Field label="Monto cobrado (R$)">
          <Input type="number" step="0.01" min={0} required value={form.monto} onChange={set('monto')} />
        </Field>
        <Field label="Comisión plataforma (R$)" hint={`Neto: ${money(neto)}`}>
          <Input type="number" step="0.01" min={0} value={form.comision_plataforma} onChange={set('comision_plataforma')} />
        </Field>
        <Field label="Método de pago">
          <Select value={form.metodo_pago} onChange={set('metodo_pago')}>
            <option value="">—</option>
            {Constants.public.Enums.metodo_pago.map((m) => (
              <option key={m} value={m}>
                {metodoPago[m]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Estado">
          <Select value={form.estado} onChange={set('estado')}>
            {Constants.public.Enums.estado_pedido.map((e) => (
              <option key={e} value={e}>
                {estadoPedido[e].label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Notas" className="col-span-2">
          <Textarea value={form.notas} onChange={set('notas')} rows={2} />
        </Field>
        {error && (
          <div className="col-span-2">
            <ErrorNote message={error} />
          </div>
        )}
      </form>
    </Modal>
  )
}
