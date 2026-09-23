import { Pencil, Plus, Receipt, Trash2 } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthProvider'
import {
  Badge,
  Button,
  Card,
  CardHeader,
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
import type { Tables } from '../lib/database.types'
import { longDate, money, toISODate, today } from '../lib/format'
import { categoriasGasto } from '../lib/labels'
import { supabase } from '../lib/supabase'
import { useData } from '../lib/useData'

type Gasto = Tables<'gastos'> & { profiles: { nombre_completo: string } | null }

function mesActual() {
  return today().slice(0, 7)
}

export function Gastos() {
  const { profile, isAdmin } = useAuth()
  const [mes, setMes] = useState(mesActual())
  const [editing, setEditing] = useState<Gasto | 'new' | null>(null)

  const [y, m] = mes.split('-').map(Number)
  const desde = `${mes}-01`
  const hasta = toISODate(new Date(y, m, 0))

  const gastos = useData(
    () =>
      supabase
        .from('gastos')
        .select('*, profiles(nombre_completo)')
        .gte('fecha', desde)
        .lte('fecha', hasta)
        .order('fecha', { ascending: false })
        .order('created_at', { ascending: false }),
    [desde, hasta],
  )

  const lista = useMemo(() => (gastos.data ?? []) as Gasto[], [gastos.data])
  const total = lista.reduce((acc, g) => acc + Number(g.monto), 0)

  const porCategoria = useMemo(() => {
    const map = new Map<string, number>()
    for (const g of lista) map.set(g.categoria, (map.get(g.categoria) ?? 0) + Number(g.monto))
    return [...map].map(([categoria, monto]) => ({ categoria, monto })).sort((a, b) => b.monto - a.monto)
  }, [lista])

  async function eliminar(g: Gasto) {
    if (!confirm('¿Eliminar este gasto?')) return
    const { error } = await supabase.from('gastos').delete().eq('id', g.id)
    if (error) alert(error.message)
    gastos.reload()
  }

  const puedeEditar = (g: Gasto) => isAdmin || g.registrado_por === profile?.id

  return (
    <>
      <PageHeader
        title="Gastos"
        subtitle="Gastos operativos del negocio. Se descuentan de la ganancia en el resumen."
        action={
          <>
            <Input type="month" value={mes} onChange={(e) => e.target.value && setMes(e.target.value)} className="w-40" />
            <Button onClick={() => setEditing('new')}>
              <Plus className="size-4" /> Nuevo gasto
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Total del mes" />
          <div className="px-5 py-4">
            <p className="text-3xl font-semibold tracking-tight tabular">{money(total)}</p>
            <p className="mt-1 text-xs text-ink-500">
              {lista.length} gasto{lista.length === 1 ? '' : 's'} registrado{lista.length === 1 ? '' : 's'}
            </p>
            <ul className="mt-6 space-y-3">
              {porCategoria.map((c) => (
                <li key={c.categoria}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-ink-700">{categoriasGasto[c.categoria] ?? c.categoria}</span>
                    <span className="font-medium tabular">{money(c.monto)}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-ink-100">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{ width: `${total ? (c.monto / total) * 100 : 0}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          {gastos.error && (
            <div className="p-4">
              <ErrorNote message={gastos.error} />
            </div>
          )}
          {gastos.loading ? (
            <LoadingBlock />
          ) : lista.length === 0 ? (
            <EmptyState
              icon={<Receipt className="size-5" />}
              title="Sin gastos este mes"
              action={<Button onClick={() => setEditing('new')}>Registrar gasto</Button>}
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Fecha</Th>
                  <Th>Descripción</Th>
                  <Th>Categoría</Th>
                  <Th className="text-right">Monto</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {lista.map((g) => (
                  <tr key={g.id} className="hover:bg-ink-50/60">
                    <Td className="whitespace-nowrap text-ink-600">{longDate(g.fecha)}</Td>
                    <Td>
                      <p className="text-ink-900">{g.descripcion || <span className="text-ink-400">Sin descripción</span>}</p>
                      <p className="text-xs text-ink-500">{g.profiles?.nombre_completo}</p>
                    </Td>
                    <Td>
                      <Badge>{categoriasGasto[g.categoria] ?? g.categoria}</Badge>
                    </Td>
                    <Td className="text-right tabular">
                      <span className="font-medium">{money(g.monto)}</span>
                      {g.moneda === 'USD' && g.monto_original != null && (
                        <p className="text-xs text-ink-400">{money(g.monto_original, 'USD')}</p>
                      )}
                    </Td>
                    <Td className="text-right whitespace-nowrap">
                      {puedeEditar(g) && (
                        <Button variant="ghost" size="sm" onClick={() => setEditing(g)} aria-label="Editar">
                          <Pencil className="size-3.5" />
                        </Button>
                      )}
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => eliminar(g)}
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
          )}
        </Card>
      </div>

      {editing && (
        <GastoForm
          gasto={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            gastos.reload()
          }}
        />
      )}
    </>
  )
}

function GastoForm({ gasto, onClose, onSaved }: { gasto: Gasto | null; onClose: () => void; onSaved: () => void }) {
  const { profile } = useAuth()
  const [form, setForm] = useState({
    fecha: gasto?.fecha ?? today(),
    descripcion: gasto?.descripcion ?? '',
    categoria: gasto?.categoria ?? 'otro',
    moneda: gasto?.moneda ?? 'BRL',
    monto: gasto ? String(gasto.monto) : '',
    monto_original: gasto?.monto_original != null ? String(gasto.monto_original) : '',
    tipo_cambio: gasto?.tipo_cambio != null ? String(gasto.tipo_cambio) : '',
  })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const usd = form.moneda === 'USD'
  const montoBRL = usd ? Number(form.monto_original || 0) * Number(form.tipo_cambio || 0) : Number(form.monto || 0)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!profile) return
    setBusy(true)
    setError(null)
    const payload = {
      fecha: form.fecha,
      descripcion: form.descripcion.trim() || null,
      categoria: form.categoria,
      moneda: form.moneda,
      monto: Number(montoBRL.toFixed(2)),
      monto_original: usd ? Number(form.monto_original) : null,
      tipo_cambio: usd ? Number(form.tipo_cambio) : null,
    }
    const { error } = gasto
      ? await supabase.from('gastos').update(payload).eq('id', gasto.id)
      : await supabase.from('gastos').insert({ ...payload, registrado_por: profile.id })
    setBusy(false)
    if (error) setError(error.message)
    else onSaved()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={gasto ? 'Editar gasto' : 'Nuevo gasto'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="gasto-form" disabled={busy}>
            {busy ? 'Guardando…' : 'Guardar'}
          </Button>
        </>
      }
    >
      <form id="gasto-form" onSubmit={onSubmit} className="grid grid-cols-2 gap-4">
        <Field label="Descripción" className="col-span-2">
          <Textarea value={form.descripcion} onChange={set('descripcion')} rows={2} placeholder="Ej.: Anuncios TikTok semana 2" />
        </Field>
        <Field label="Fecha">
          <Input type="date" required value={form.fecha} onChange={set('fecha')} />
        </Field>
        <Field label="Categoría">
          <Select value={form.categoria} onChange={set('categoria')}>
            {Object.entries(categoriasGasto).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Moneda" className="col-span-2" group>
          <Segmented
            value={form.moneda as 'BRL' | 'USD'}
            onChange={(v) => setForm((f) => ({ ...f, moneda: v }))}
            options={[
              { value: 'BRL', label: 'R$ BRL' },
              { value: 'USD', label: 'US$ USD' },
            ]}
          />
        </Field>
        {usd ? (
          <>
            <Field label="Monto (US$)">
              <Input type="number" step="0.01" min={0} required value={form.monto_original} onChange={set('monto_original')} />
            </Field>
            <Field label="Tipo de cambio (R$ por US$)" hint={`Equivale a ${money(montoBRL)}`}>
              <Input type="number" step="0.0001" min={0} required value={form.tipo_cambio} onChange={set('tipo_cambio')} />
            </Field>
          </>
        ) : (
          <Field label="Monto (R$)" className="col-span-2">
            <Input type="number" step="0.01" min={0} required value={form.monto} onChange={set('monto')} />
          </Field>
        )}
        {error && (
          <div className="col-span-2">
            <ErrorNote message={error} />
          </div>
        )}
      </form>
    </Modal>
  )
}
