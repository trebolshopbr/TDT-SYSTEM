import { Boxes, ImageOff, Pencil, Plus, Search, Trash2 } from 'lucide-react'
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
  Segmented,
  Select,
  Table,
  Td,
  Textarea,
  Th,
} from '../components/ui'
import { cn } from '../lib/cn'
import type { Tables } from '../lib/database.types'
import { money, number } from '../lib/format'
import { supabase } from '../lib/supabase'
import { useData } from '../lib/useData'

type Producto = Tables<'productos'> & { plataformas: { nombre: string } | null }

function margen(precio: number, costo: number) {
  return precio > 0 ? ((precio - costo) / precio) * 100 : 0
}

export function Productos() {
  const { isAdmin } = useAuth()
  const [q, setQ] = useState('')
  const [vista, setVista] = useState<'activos' | 'todos'>('activos')
  const [editing, setEditing] = useState<Producto | 'new' | null>(null)

  const productos = useData(() => supabase.from('productos').select('*, plataformas(nombre)').order('nombre'), [])
  const plataformas = useData(() => supabase.from('plataformas').select('*').order('nombre'), [])

  const lista = useMemo(() => {
    const term = q.trim().toLowerCase()
    return ((productos.data ?? []) as Producto[]).filter(
      (p) =>
        (vista === 'todos' || p.activo) &&
        (!term || p.nombre.toLowerCase().includes(term) || p.sku?.toLowerCase().includes(term)),
    )
  }, [productos.data, q, vista])

  const valorStock = lista.reduce((acc, p) => acc + Number(p.costo) * Math.max(p.stock, 0), 0)

  async function eliminar(p: Producto) {
    if (!confirm(`¿Eliminar "${p.nombre}"? Si tiene pedidos asociados, mejor desactívalo.`)) return
    const { error } = await supabase.from('productos').delete().eq('id', p.id)
    if (error)
      alert(error.code === '23503' ? 'Este producto tiene pedidos asociados. Desactívalo en lugar de eliminarlo.' : error.message)
    productos.reload()
  }

  return (
    <>
      <PageHeader
        title="Productos"
        subtitle={`${lista.length} productos · Stock valorizado al costo: ${money(valorStock)}`}
        action={
          <Button onClick={() => setEditing('new')}>
            <Plus className="size-4" /> Nuevo producto
          </Button>
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-ink-100 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-400" />
            <Input placeholder="Buscar por nombre o SKU…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
          <Segmented
            value={vista}
            onChange={setVista}
            options={[
              { value: 'activos', label: 'Activos' },
              { value: 'todos', label: 'Todos' },
            ]}
          />
        </div>

        {productos.error && (
          <div className="p-4">
            <ErrorNote message={productos.error} />
          </div>
        )}

        {productos.loading ? (
          <LoadingBlock />
        ) : lista.length === 0 ? (
          <EmptyState
            icon={<Boxes className="size-5" />}
            title={productos.data?.length ? 'Ningún producto coincide' : 'Todavía no hay productos'}
            action={!productos.data?.length && <Button onClick={() => setEditing('new')}>Cargar el primero</Button>}
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Producto</Th>
                <Th>Plataforma</Th>
                <Th className="text-right">Precio</Th>
                <Th className="text-right">Costo</Th>
                <Th className="text-right">Margen</Th>
                <Th className="text-right">Stock</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {lista.map((p) => {
                const m = margen(Number(p.precio), Number(p.costo))
                return (
                  <tr key={p.id} className={cn('hover:bg-ink-50/60', !p.activo && 'opacity-60')}>
                    <Td>
                      <div className="flex items-center gap-3">
                        {p.imagen_url ? (
                          <img
                            src={p.imagen_url}
                            alt=""
                            className="size-10 shrink-0 rounded-lg border border-ink-100 object-cover"
                          />
                        ) : (
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-400">
                            <ImageOff className="size-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-medium text-ink-900">{p.nombre}</p>
                          <p className="text-xs text-ink-500">
                            {p.sku ?? 'Sin SKU'}
                            {!p.activo && ' · Inactivo'}
                          </p>
                        </div>
                      </div>
                    </Td>
                    <Td className="text-ink-600">{p.plataformas?.nombre ?? 'Todas'}</Td>
                    <Td className="text-right font-medium tabular">{money(p.precio)}</Td>
                    <Td className="text-right text-ink-600 tabular">
                      {money(p.costo)}
                      {p.moneda_costo === 'USD' && p.costo_original != null && (
                        <p className="text-xs text-ink-400">{money(p.costo_original, 'USD')}</p>
                      )}
                    </Td>
                    <Td className="text-right">
                      <Badge tone={m >= 40 ? 'green' : m >= 20 ? 'amber' : 'red'}>{m.toFixed(0)}%</Badge>
                    </Td>
                    <Td
                      className={cn(
                        'text-right font-medium tabular',
                        p.stock <= 0 ? 'text-red-600' : p.stock <= 5 && 'text-amber-600',
                      )}
                    >
                      {number(p.stock)}
                    </Td>
                    <Td className="text-right whitespace-nowrap">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(p)} aria-label="Editar">
                        <Pencil className="size-3.5" />
                      </Button>
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
                )
              })}
            </tbody>
          </Table>
        )}
      </Card>

      {editing && (
        <ProductoForm
          producto={editing === 'new' ? null : editing}
          plataformas={plataformas.data ?? []}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            productos.reload()
          }}
        />
      )}
    </>
  )
}

function ProductoForm({
  producto,
  plataformas,
  onClose,
  onSaved,
}: {
  producto: Producto | null
  plataformas: Tables<'plataformas'>[]
  onClose: () => void
  onSaved: () => void
}) {
  const { profile } = useAuth()
  const [form, setForm] = useState({
    nombre: producto?.nombre ?? '',
    sku: producto?.sku ?? '',
    precio: producto ? String(producto.precio) : '',
    moneda_costo: producto?.moneda_costo ?? 'BRL',
    costo: producto ? String(producto.costo) : '',
    costo_original: producto?.costo_original != null ? String(producto.costo_original) : '',
    tipo_cambio_costo: producto?.tipo_cambio_costo != null ? String(producto.tipo_cambio_costo) : '',
    stock: String(producto?.stock ?? 0),
    plataforma_id: producto?.plataforma_id ?? '',
    imagen_url: producto?.imagen_url ?? '',
    activo: producto?.activo ?? true,
    notas: producto?.notas ?? '',
  })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const usd = form.moneda_costo === 'USD'
  const costoBRL = usd ? Number(form.costo_original || 0) * Number(form.tipo_cambio_costo || 0) : Number(form.costo || 0)
  const m = margen(Number(form.precio || 0), costoBRL)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!profile) return
    setBusy(true)
    setError(null)
    const payload = {
      nombre: form.nombre.trim(),
      sku: form.sku.trim() || null,
      precio: Number(form.precio),
      moneda_costo: form.moneda_costo,
      costo: Number(costoBRL.toFixed(2)),
      costo_original: usd ? Number(form.costo_original) : null,
      tipo_cambio_costo: usd ? Number(form.tipo_cambio_costo) : null,
      stock: Number(form.stock),
      plataforma_id: form.plataforma_id || null,
      imagen_url: form.imagen_url.trim() || null,
      activo: form.activo,
      notas: form.notas.trim() || null,
    }
    const { error } = producto
      ? await supabase.from('productos').update(payload).eq('id', producto.id)
      : await supabase.from('productos').insert({ ...payload, registrado_por: profile.id })
    setBusy(false)
    if (error) setError(error.code === '23505' ? 'Ya existe un producto con ese SKU.' : error.message)
    else onSaved()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={producto ? 'Editar producto' : 'Nuevo producto'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="producto-form" disabled={busy}>
            {busy ? 'Guardando…' : 'Guardar'}
          </Button>
        </>
      }
    >
      <form id="producto-form" onSubmit={onSubmit} className="grid grid-cols-2 gap-4">
        <Field label="Nombre" className="col-span-2">
          <Input required value={form.nombre} onChange={set('nombre')} />
        </Field>
        <Field label="SKU">
          <Input value={form.sku} onChange={set('sku')} />
        </Field>
        <Field label="Plataforma">
          <Select value={form.plataforma_id} onChange={set('plataforma_id')}>
            <option value="">Todas</option>
            {plataformas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Precio de venta (R$)">
          <Input type="number" step="0.01" min={0} required value={form.precio} onChange={set('precio')} />
        </Field>
        <Field label="Moneda del costo" group>
          <Segmented
            value={form.moneda_costo as 'BRL' | 'USD'}
            onChange={(v) => setForm((f) => ({ ...f, moneda_costo: v }))}
            options={[
              { value: 'BRL', label: 'R$ BRL' },
              { value: 'USD', label: 'US$ USD' },
            ]}
          />
        </Field>
        {usd ? (
          <>
            <Field label="Costo (US$)">
              <Input type="number" step="0.01" min={0} required value={form.costo_original} onChange={set('costo_original')} />
            </Field>
            <Field label="Tipo de cambio (R$ por US$)">
              <Input
                type="number"
                step="0.0001"
                min={0}
                required
                value={form.tipo_cambio_costo}
                onChange={set('tipo_cambio_costo')}
              />
            </Field>
          </>
        ) : (
          <Field label="Costo (R$)" className="col-span-2 sm:col-span-1">
            <Input type="number" step="0.01" min={0} required value={form.costo} onChange={set('costo')} />
          </Field>
        )}
        <div className="col-span-2 flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2.5 text-sm">
          <span className="text-ink-600">
            Costo en R$: <strong className="text-ink-900 tabular">{money(costoBRL)}</strong>
          </span>
          <span className="text-ink-600">
            Margen:{' '}
            <strong className={cn('tabular', m >= 40 ? 'text-brand-700' : m >= 20 ? 'text-amber-700' : 'text-red-700')}>
              {m.toFixed(1)}%
            </strong>
          </span>
        </div>
        <Field label="Stock (unidades)">
          <Input type="number" required value={form.stock} onChange={set('stock')} />
        </Field>
        <Field label="Estado" group>
          <Segmented
            value={form.activo ? 'si' : 'no'}
            onChange={(v) => setForm((f) => ({ ...f, activo: v === 'si' }))}
            options={[
              { value: 'si', label: 'Activo' },
              { value: 'no', label: 'Inactivo' },
            ]}
          />
        </Field>
        <Field label="URL de imagen" className="col-span-2">
          <Input type="url" value={form.imagen_url} onChange={set('imagen_url')} placeholder="https://…" />
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
