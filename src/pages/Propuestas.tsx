import { ExternalLink, Lightbulb, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
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
  Textarea,
} from '../components/ui'
import { cn } from '../lib/cn'
import type { Tables } from '../lib/database.types'
import { longDate, money } from '../lib/format'
import { supabase } from '../lib/supabase'
import { useData } from '../lib/useData'

type Propuesta = Tables<'propuestas_productos'> & { profiles: { nombre_completo: string } | null }

function margenEstimado(p: Pick<Propuesta, 'costo_estimado' | 'precio_venta_estimado'>) {
  if (p.costo_estimado == null || !p.precio_venta_estimado) return null
  return ((Number(p.precio_venta_estimado) - Number(p.costo_estimado)) / Number(p.precio_venta_estimado)) * 100
}

export function Propuestas() {
  const { profile, isAdmin } = useAuth()
  const [editing, setEditing] = useState<Propuesta | 'new' | null>(null)
  const propuestas = useData(
    () => supabase.from('propuestas_productos').select('*, profiles(nombre_completo)').order('created_at', { ascending: false }),
    [],
  )
  const lista = (propuestas.data ?? []) as Propuesta[]

  async function eliminar(p: Propuesta) {
    if (!confirm(`¿Eliminar la propuesta "${p.nombre_producto}"?`)) return
    const { error } = await supabase.from('propuestas_productos').delete().eq('id', p.id)
    if (error) alert(error.message)
    propuestas.reload()
  }

  return (
    <>
      <PageHeader
        title="Propuestas de productos"
        subtitle="Ideas de nuevos productos para evaluar entre los socios."
        action={
          <Button onClick={() => setEditing('new')}>
            <Plus className="size-4" /> Nueva propuesta
          </Button>
        }
      />

      {propuestas.error && <ErrorNote message={propuestas.error} />}

      {propuestas.loading ? (
        <LoadingBlock />
      ) : lista.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Lightbulb className="size-5" />}
            title="Todavía no hay propuestas"
            text="Comparte un producto que te parezca prometedor, con su costo y precio estimados."
            action={<Button onClick={() => setEditing('new')}>Proponer un producto</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {lista.map((p) => {
            const m = margenEstimado(p)
            const puede = isAdmin || p.propuesto_por === profile?.id
            return (
              <Card key={p.id} className="flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Badge tone="violet">{p.segmento}</Badge>
                    <h3 className="mt-2 font-semibold text-ink-900">{p.nombre_producto}</h3>
                    <p className="mt-0.5 text-xs text-ink-500">
                      {p.profiles?.nombre_completo} · {longDate(p.created_at)}
                    </p>
                  </div>
                  {m != null && (
                    <div className="text-right">
                      <p className="text-[11px] text-ink-500">Margen</p>
                      <p
                        className={cn(
                          'text-lg font-semibold tabular',
                          m >= 40 ? 'text-brand-700' : m >= 20 ? 'text-amber-700' : 'text-red-600',
                        )}
                      >
                        {m.toFixed(0)}%
                      </p>
                    </div>
                  )}
                </div>

                <dl className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-ink-50 p-3 text-center">
                  <div>
                    <dt className="text-[11px] text-ink-500">Costo</dt>
                    <dd className="text-sm font-medium tabular">{p.costo_estimado != null ? money(p.costo_estimado) : '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-ink-500">Venta</dt>
                    <dd className="text-sm font-medium tabular">
                      {p.precio_venta_estimado != null ? money(p.precio_venta_estimado) : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-ink-500">Competencia</dt>
                    <dd className="text-sm font-medium tabular">
                      {p.precio_competencia != null ? money(p.precio_competencia) : '—'}
                    </dd>
                  </div>
                </dl>

                {p.notas && <p className="mt-3 line-clamp-3 text-sm text-ink-600">{p.notas}</p>}

                <div className="mt-auto flex items-center justify-between pt-4">
                  {p.link_proveedor ? (
                    <a
                      href={p.link_proveedor}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:text-brand-800"
                    >
                      Ver proveedor <ExternalLink className="size-3" />
                    </a>
                  ) : (
                    <span />
                  )}
                  {puede && (
                    <div>
                      <Button variant="ghost" size="sm" onClick={() => setEditing(p)} aria-label="Editar">
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => eliminar(p)}
                        aria-label="Eliminar"
                        className="hover:text-red-600"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {editing && (
        <PropuestaForm
          propuesta={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            propuestas.reload()
          }}
        />
      )}
    </>
  )
}

function PropuestaForm({
  propuesta,
  onClose,
  onSaved,
}: {
  propuesta: Propuesta | null
  onClose: () => void
  onSaved: () => void
}) {
  const { profile } = useAuth()
  const str = (v: number | null | undefined) => (v != null ? String(v) : '')
  const [form, setForm] = useState({
    nombre_producto: propuesta?.nombre_producto ?? '',
    segmento: propuesta?.segmento ?? '',
    link_proveedor: propuesta?.link_proveedor ?? '',
    costo_estimado: str(propuesta?.costo_estimado),
    precio_venta_estimado: str(propuesta?.precio_venta_estimado),
    precio_competencia: str(propuesta?.precio_competencia),
    notas: propuesta?.notas ?? '',
  })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const num = (v: string) => (v === '' ? null : Number(v))

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!profile) return
    setBusy(true)
    setError(null)
    const payload = {
      nombre_producto: form.nombre_producto.trim(),
      segmento: form.segmento.trim(),
      link_proveedor: form.link_proveedor.trim() || null,
      costo_estimado: num(form.costo_estimado),
      precio_venta_estimado: num(form.precio_venta_estimado),
      precio_competencia: num(form.precio_competencia),
      notas: form.notas.trim() || null,
    }
    const { error } = propuesta
      ? await supabase.from('propuestas_productos').update(payload).eq('id', propuesta.id)
      : await supabase.from('propuestas_productos').insert({ ...payload, propuesto_por: profile.id })
    setBusy(false)
    if (error) setError(error.message)
    else onSaved()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={propuesta ? 'Editar propuesta' : 'Nueva propuesta'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="propuesta-form" disabled={busy}>
            {busy ? 'Guardando…' : 'Guardar'}
          </Button>
        </>
      }
    >
      <form id="propuesta-form" onSubmit={onSubmit} className="grid grid-cols-2 gap-4">
        <Field label="Producto" className="col-span-2 sm:col-span-1">
          <Input required value={form.nombre_producto} onChange={set('nombre_producto')} />
        </Field>
        <Field label="Segmento" className="col-span-2 sm:col-span-1">
          <Input required value={form.segmento} onChange={set('segmento')} placeholder="Ej.: Hogar, Belleza…" />
        </Field>
        <Field label="Link del proveedor" className="col-span-2">
          <Input type="url" value={form.link_proveedor} onChange={set('link_proveedor')} placeholder="https://…" />
        </Field>
        <Field label="Costo estimado (R$)">
          <Input type="number" step="0.01" min={0} value={form.costo_estimado} onChange={set('costo_estimado')} />
        </Field>
        <Field label="Precio de venta (R$)">
          <Input type="number" step="0.01" min={0} value={form.precio_venta_estimado} onChange={set('precio_venta_estimado')} />
        </Field>
        <Field label="Precio competencia (R$)" className="col-span-2 sm:col-span-1">
          <Input type="number" step="0.01" min={0} value={form.precio_competencia} onChange={set('precio_competencia')} />
        </Field>
        <Field label="Notas" className="col-span-2">
          <Textarea value={form.notas} onChange={set('notas')} rows={3} placeholder="¿Por qué crees que se vendería bien?" />
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
