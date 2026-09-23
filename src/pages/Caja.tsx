import { Plus, Trash2, Wallet } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
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
  Table,
  Td,
  Textarea,
  Th,
} from '../components/ui'
import { cn } from '../lib/cn'
import type { Tables } from '../lib/database.types'
import { longDate, money, today } from '../lib/format'
import { supabase } from '../lib/supabase'
import { useData } from '../lib/useData'

type Cierre = Tables<'cierres_caja'> & { profiles: { nombre_completo: string } | null }

function diferencia(c: Pick<Cierre, 'efectivo_inicial' | 'efectivo_final' | 'total_ventas' | 'total_gastos'>) {
  const esperado = Number(c.efectivo_inicial) + Number(c.total_ventas) - Number(c.total_gastos)
  return Number(c.efectivo_final) - esperado
}

export function Caja() {
  const { isAdmin } = useAuth()
  const [nuevo, setNuevo] = useState(false)
  const cierres = useData(
    () => supabase.from('cierres_caja').select('*, profiles(nombre_completo)').order('fecha', { ascending: false }).limit(120),
    [],
  )
  const lista = (cierres.data ?? []) as Cierre[]

  async function eliminar(c: Cierre) {
    if (!confirm(`¿Eliminar el cierre del ${longDate(c.fecha)}?`)) return
    const { error } = await supabase.from('cierres_caja').delete().eq('id', c.id)
    if (error) alert(error.message)
    cierres.reload()
  }

  return (
    <>
      <PageHeader
        title="Cierres de caja"
        subtitle="Controla que el efectivo contado coincida con lo esperado según ventas y gastos del día."
        action={
          <Button onClick={() => setNuevo(true)}>
            <Plus className="size-4" /> Nuevo cierre
          </Button>
        }
      />

      <Card>
        {cierres.error && (
          <div className="p-4">
            <ErrorNote message={cierres.error} />
          </div>
        )}
        {cierres.loading ? (
          <LoadingBlock />
        ) : lista.length === 0 ? (
          <EmptyState
            icon={<Wallet className="size-5" />}
            title="Todavía no hay cierres"
            text="Al final del día, registra el efectivo inicial y final para detectar diferencias."
            action={<Button onClick={() => setNuevo(true)}>Hacer el primer cierre</Button>}
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Fecha</Th>
                <Th className="text-right">Inicial</Th>
                <Th className="text-right">Ventas</Th>
                <Th className="text-right">Gastos</Th>
                <Th className="text-right">Final</Th>
                <Th className="text-right">Diferencia</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {lista.map((c) => {
                const d = diferencia(c)
                return (
                  <tr key={c.id} className="hover:bg-ink-50/60">
                    <Td>
                      <p className="font-medium whitespace-nowrap text-ink-900">{longDate(c.fecha)}</p>
                      <p className="text-xs text-ink-500">{c.profiles?.nombre_completo}</p>
                    </Td>
                    <Td className="text-right tabular">{money(c.efectivo_inicial)}</Td>
                    <Td className="text-right text-brand-700 tabular">
                      {Number(c.total_ventas) ? '+' : ''}
                      {money(c.total_ventas)}
                    </Td>
                    <Td className={cn('text-right tabular', Number(c.total_gastos) ? 'text-red-600' : 'text-ink-400')}>
                      {Number(c.total_gastos) ? '−' : ''}
                      {money(c.total_gastos)}
                    </Td>
                    <Td className="text-right font-medium tabular">{money(c.efectivo_final)}</Td>
                    <Td className="text-right">
                      {Math.abs(d) < 0.01 ? (
                        <Badge tone="green">Cuadra</Badge>
                      ) : (
                        <Badge tone={d > 0 ? 'blue' : 'red'}>
                          {d > 0 ? '+' : '−'}
                          {money(Math.abs(d))}
                        </Badge>
                      )}
                    </Td>
                    <Td className="text-right">
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => eliminar(c)}
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

      {nuevo && (
        <CierreForm
          onClose={() => setNuevo(false)}
          onSaved={() => {
            setNuevo(false)
            cierres.reload()
          }}
        />
      )}
    </>
  )
}

function CierreForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { profile } = useAuth()
  const [form, setForm] = useState({
    fecha: today(),
    efectivo_inicial: '0',
    efectivo_final: '',
    total_ventas: '',
    total_gastos: '',
    notas: '',
  })
  const [sugerido, setSugerido] = useState<{ ventas: number; gastos: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    let cancelled = false
    Promise.all([
      supabase.from('pedidos').select('monto').eq('fecha', form.fecha).eq('metodo_pago', 'efectivo').neq('estado', 'cancelado'),
      supabase.from('gastos').select('monto').eq('fecha', form.fecha),
    ]).then(([p, g]) => {
      if (cancelled) return
      const ventas = (p.data ?? []).reduce((a, x) => a + Number(x.monto), 0)
      const gastos = (g.data ?? []).reduce((a, x) => a + Number(x.monto), 0)
      setSugerido({ ventas, gastos })
      setForm((f) => ({ ...f, total_ventas: String(ventas), total_gastos: String(gastos) }))
    })
    return () => {
      cancelled = true
    }
  }, [form.fecha])

  const valores = {
    efectivo_inicial: Number(form.efectivo_inicial || 0),
    efectivo_final: Number(form.efectivo_final || 0),
    total_ventas: Number(form.total_ventas || 0),
    total_gastos: Number(form.total_gastos || 0),
  }
  const esperado = valores.efectivo_inicial + valores.total_ventas - valores.total_gastos
  const d = diferencia(valores)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!profile) return
    setBusy(true)
    setError(null)
    const { error } = await supabase
      .from('cierres_caja')
      .insert({ ...valores, fecha: form.fecha, notas: form.notas.trim() || null, registrado_por: profile.id })
    setBusy(false)
    if (error) setError(error.message)
    else onSaved()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Nuevo cierre de caja"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="cierre-form" disabled={busy}>
            {busy ? 'Guardando…' : 'Guardar cierre'}
          </Button>
        </>
      }
    >
      <form id="cierre-form" onSubmit={onSubmit} className="grid grid-cols-2 gap-4">
        <Field label="Fecha">
          <Input type="date" required value={form.fecha} onChange={set('fecha')} />
        </Field>
        <Field label="Efectivo inicial (R$)">
          <Input type="number" step="0.01" min={0} required value={form.efectivo_inicial} onChange={set('efectivo_inicial')} />
        </Field>
        <Field label="Ventas en efectivo (R$)" hint={sugerido ? `Registrado: ${money(sugerido.ventas)}` : undefined}>
          <Input type="number" step="0.01" min={0} required value={form.total_ventas} onChange={set('total_ventas')} />
        </Field>
        <Field label="Gastos del día (R$)" hint={sugerido ? `Registrado: ${money(sugerido.gastos)}` : undefined}>
          <Input type="number" step="0.01" min={0} required value={form.total_gastos} onChange={set('total_gastos')} />
        </Field>
        <Field label="Efectivo contado al cierre (R$)" className="col-span-2">
          <Input type="number" step="0.01" min={0} required value={form.efectivo_final} onChange={set('efectivo_final')} />
        </Field>
        <div className="col-span-2 grid grid-cols-2 gap-3 rounded-lg bg-ink-50 p-3 text-sm">
          <div>
            <p className="text-xs text-ink-500">Esperado en caja</p>
            <p className="font-semibold tabular">{money(esperado)}</p>
          </div>
          <div>
            <p className="text-xs text-ink-500">Diferencia</p>
            <p
              className={cn(
                'font-semibold tabular',
                Math.abs(d) < 0.01 ? 'text-brand-700' : d > 0 ? 'text-sky-700' : 'text-red-600',
              )}
            >
              {form.efectivo_final === '' ? '—' : `${d >= 0 ? '+' : '−'}${money(Math.abs(d))}`}
            </p>
          </div>
        </div>
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
