import { AlertTriangle, ArrowDownRight, ArrowUpRight, ClipboardList, PackageOpen } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAuth } from '../auth/AuthProvider'
import { Badge, Card, CardHeader, EmptyState, ErrorNote, LoadingBlock, PageHeader, Segmented } from '../components/ui'
import { cn } from '../lib/cn'
import { money, number, parseDate, percent, shortDate, toISODate } from '../lib/format'
import { estadoPedido, platformColors } from '../lib/labels'
import { supabase } from '../lib/supabase'
import { useData } from '../lib/useData'

type Periodo = 'mes' | '30' | '90' | 'anio'

function rango(periodo: Periodo) {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  let desde: Date
  if (periodo === 'mes') desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  else if (periodo === 'anio') desde = new Date(hoy.getFullYear(), 0, 1)
  else desde = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - Number(periodo) + 1)
  const dias = Math.round((hoy.getTime() - desde.getTime()) / 86_400_000) + 1
  const prevHasta = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate() - 1)
  const prevDesde = new Date(prevHasta.getFullYear(), prevHasta.getMonth(), prevHasta.getDate() - dias + 1)
  return { desde, hasta: hoy, dias, prevDesde }
}

export function Dashboard() {
  const { profile } = useAuth()
  const [periodo, setPeriodo] = useState<Periodo>('mes')
  const r = useMemo(() => rango(periodo), [periodo])

  const pedidos = useData(
    () =>
      supabase
        .from('pedidos')
        .select(
          'id, fecha, monto, monto_neto, comision_plataforma, cantidad, estado, cliente_nombre, plataforma_id, plataformas(nombre), productos(nombre, costo)',
        )
        .gte('fecha', toISODate(r.prevDesde))
        .lte('fecha', toISODate(r.hasta))
        .order('fecha', { ascending: false })
        .order('created_at', { ascending: false }),
    [r],
  )
  const gastos = useData(
    () => supabase.from('gastos').select('fecha, monto').gte('fecha', toISODate(r.prevDesde)).lte('fecha', toISODate(r.hasta)),
    [r],
  )
  const stockBajo = useData(
    () => supabase.from('productos').select('id, nombre, stock, sku').eq('activo', true).lte('stock', 5).order('stock'),
    [],
  )

  const stats = useMemo(() => {
    const desdeISO = toISODate(r.desde)
    const all = pedidos.data ?? []
    const validos = all.filter((p) => p.estado !== 'cancelado')
    const actual = validos.filter((p) => p.fecha >= desdeISO)
    const previo = validos.filter((p) => p.fecha < desdeISO)
    const gActual = (gastos.data ?? []).filter((g) => g.fecha >= desdeISO)
    const gPrevio = (gastos.data ?? []).filter((g) => g.fecha < desdeISO)

    const sum = <T,>(arr: T[], f: (x: T) => number) => arr.reduce((acc, x) => acc + Number(f(x) ?? 0), 0)
    const resumen = (ps: typeof actual, gs: typeof gActual) => {
      const bruto = sum(ps, (p) => p.monto)
      const neto = sum(ps, (p) => p.monto_neto ?? p.monto - p.comision_plataforma)
      const costo = sum(ps, (p) => (p.productos?.costo ?? 0) * p.cantidad)
      const gasto = sum(gs, (g) => g.monto)
      return { bruto, neto, costo, gasto, ganancia: neto - costo - gasto, pedidos: ps.length }
    }
    const a = resumen(actual, gActual)
    const b = resumen(previo, gPrevio)
    const delta = (x: number, y: number) => (y === 0 ? (x === 0 ? 0 : Infinity) : ((x - y) / Math.abs(y)) * 100)

    const porDia = new Map<string, number>()
    for (let i = 0; i < r.dias; i++) {
      porDia.set(toISODate(new Date(r.desde.getFullYear(), r.desde.getMonth(), r.desde.getDate() + i)), 0)
    }
    for (const p of actual) porDia.set(p.fecha, (porDia.get(p.fecha) ?? 0) + Number(p.monto))
    const serie = [...porDia].map(([fecha, monto]) => ({ fecha, monto }))

    const porPlataforma = new Map<string, number>()
    for (const p of actual) {
      const k = p.plataformas?.nombre ?? 'Sin plataforma'
      porPlataforma.set(k, (porPlataforma.get(k) ?? 0) + Number(p.monto))
    }
    const plataformas = [...porPlataforma].map(([nombre, monto]) => ({ nombre, monto })).sort((x, y) => y.monto - x.monto)

    const pendientes = all.filter((p) => p.estado === 'pendiente').length
    const recientes = all.filter((p) => p.fecha >= desdeISO).slice(0, 6)

    return {
      a,
      deltas: {
        bruto: delta(a.bruto, b.bruto),
        neto: delta(a.neto, b.neto),
        gasto: delta(a.gasto, b.gasto),
        ganancia: delta(a.ganancia, b.ganancia),
      },
      serie,
      plataformas,
      pendientes,
      recientes,
    }
  }, [pedidos.data, gastos.data, r])

  const loading = pedidos.loading || gastos.loading
  const nombre = profile?.nombre_completo?.split(' ')[0]

  return (
    <>
      <PageHeader
        title={nombre ? `Hola, ${nombre}` : 'Resumen'}
        subtitle="Así va el negocio en el período seleccionado."
        action={
          <Segmented
            value={periodo}
            onChange={setPeriodo}
            options={[
              { value: 'mes', label: 'Este mes' },
              { value: '30', label: '30 días' },
              { value: '90', label: '90 días' },
              { value: 'anio', label: 'Este año' },
            ]}
          />
        }
      />

      {pedidos.error && <ErrorNote message={pedidos.error} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Ventas brutas"
          value={money(stats.a.bruto)}
          delta={stats.deltas.bruto}
          loading={loading}
          hint={`${number(stats.a.pedidos)} pedidos`}
        />
        <Kpi
          label="Ingreso neto"
          value={money(stats.a.neto)}
          delta={stats.deltas.neto}
          loading={loading}
          hint="Después de comisiones"
        />
        <Kpi
          label="Gastos"
          value={money(stats.a.gasto)}
          delta={stats.deltas.gasto}
          loading={loading}
          invert
          hint="Operativos registrados"
        />
        <Kpi
          label="Ganancia estimada"
          value={money(stats.a.ganancia)}
          delta={stats.deltas.ganancia}
          loading={loading}
          highlight
          hint="Neto − costo mercadería − gastos"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Ventas por día" subtitle={`${shortDate(toISODate(r.desde))} – ${shortDate(toISODate(r.hasta))}`} />
          <div className="h-72 px-2 pt-4 pb-2">
            {loading ? (
              <LoadingBlock />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.serie} margin={{ left: 8, right: 12, top: 4 }}>
                  <defs>
                    <linearGradient id="ventas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b96b" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#10b96b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#eef0f0" />
                  <XAxis
                    dataKey="fecha"
                    tickFormatter={(v: string) =>
                      r.dias > 60 ? parseDate(v).toLocaleDateString('es-AR', { month: 'short' }) : shortDate(v)
                    }
                    tick={{ fontSize: 11, fill: '#6b7373' }}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={24}
                  />
                  <YAxis
                    tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : String(v))}
                    tick={{ fontSize: 11, fill: '#6b7373' }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip
                    formatter={(v) => [money(Number(v)), 'Ventas']}
                    labelFormatter={(v) => shortDate(String(v))}
                    contentStyle={{ borderRadius: 10, border: '1px solid #dfe2e2', fontSize: 12 }}
                  />
                  <Area type="monotone" dataKey="monto" stroke="#059657" strokeWidth={2} fill="url(#ventas)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Por plataforma" subtitle="Participación en ventas brutas" />
          {loading ? (
            <LoadingBlock />
          ) : stats.plataformas.length === 0 ? (
            <EmptyState icon={<PackageOpen className="size-5" />} title="Sin ventas en el período" />
          ) : (
            <div className="px-5 py-4">
              <div className="relative mx-auto h-40 w-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.plataformas}
                      dataKey="monto"
                      nameKey="nombre"
                      innerRadius={52}
                      outerRadius={76}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {stats.plataformas.map((_, i) => (
                        <Cell key={i} fill={platformColors[i % platformColors.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[11px] text-ink-500">Total</span>
                  <span className="text-sm font-semibold tabular">{money(stats.a.bruto)}</span>
                </div>
              </div>
              <ul className="mt-4 space-y-2.5">
                {stats.plataformas.map((p, i) => (
                  <li key={p.nombre} className="flex items-center gap-3 text-sm">
                    <span className="size-2.5 rounded-full" style={{ background: platformColors[i % platformColors.length] }} />
                    <span className="flex-1 text-ink-700">{p.nombre}</span>
                    <span className="text-xs text-ink-500 tabular">
                      {stats.a.bruto ? ((p.monto / stats.a.bruto) * 100).toFixed(0) : 0}%
                    </span>
                    <span className="w-24 text-right font-medium tabular">{money(p.monto)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Últimos pedidos"
            subtitle={
              stats.pendientes ? `${stats.pendientes} pendiente${stats.pendientes === 1 ? '' : 's'} de envío` : 'Todo al día'
            }
            action={
              <Link to="/pedidos" className="text-xs font-medium text-brand-700 hover:text-brand-800">
                Ver todos →
              </Link>
            }
          />
          {loading ? (
            <LoadingBlock />
          ) : stats.recientes.length === 0 ? (
            <EmptyState icon={<ClipboardList className="size-5" />} title="Sin pedidos en el período" />
          ) : (
            <ul className="divide-y divide-ink-100">
              {stats.recientes.map((p) => (
                <li key={p.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-900">{p.cliente_nombre}</p>
                    <p className="truncate text-xs text-ink-500">
                      {p.plataformas?.nombre} · {p.productos?.nombre ?? 'Sin producto'} · {shortDate(p.fecha)}
                    </p>
                  </div>
                  <Badge tone={estadoPedido[p.estado].tone}>{estadoPedido[p.estado].label}</Badge>
                  <span className="w-24 text-right text-sm font-medium tabular">{money(p.monto)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Stock bajo" subtitle="Productos activos con 5 unidades o menos" />
          {stockBajo.loading ? (
            <LoadingBlock />
          ) : !stockBajo.data?.length ? (
            <EmptyState
              icon={<PackageOpen className="size-5" />}
              title="Stock en orden"
              text="Ningún producto está por agotarse."
            />
          ) : (
            <ul className="divide-y divide-ink-100">
              {stockBajo.data.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                  <AlertTriangle className={cn('size-4 shrink-0', p.stock <= 0 ? 'text-red-500' : 'text-amber-500')} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-900">{p.nombre}</p>
                    {p.sku && <p className="text-xs text-ink-500">{p.sku}</p>}
                  </div>
                  <Badge tone={p.stock <= 0 ? 'red' : 'amber'}>{p.stock <= 0 ? 'Agotado' : `${p.stock} u.`}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  )
}

function Kpi({
  label,
  value,
  delta,
  hint,
  loading,
  invert,
  highlight,
}: {
  label: string
  value: string
  delta: number
  hint?: string
  loading?: boolean
  invert?: boolean
  highlight?: boolean
}) {
  const good = invert ? delta <= 0 : delta >= 0
  const showDelta = Number.isFinite(delta) && delta !== 0
  return (
    <div
      className={cn(
        'rounded-2xl border p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
        highlight ? 'border-brand-800 bg-brand-950 text-white' : 'border-ink-200/70 bg-white',
      )}
    >
      <p className={cn('text-xs font-medium', highlight ? 'text-brand-200/80' : 'text-ink-500')}>{label}</p>
      {loading ? (
        <div className={cn('mt-3 h-8 w-32 animate-pulse rounded-md', highlight ? 'bg-white/10' : 'bg-ink-100')} />
      ) : (
        <p className="mt-2 text-2xl font-semibold tracking-tight tabular">{value}</p>
      )}
      <div className="mt-2 flex items-center gap-2 text-xs">
        {showDelta && !loading && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium',
              good
                ? highlight
                  ? 'bg-brand-400/15 text-brand-300'
                  : 'bg-brand-50 text-brand-700'
                : highlight
                  ? 'bg-red-400/15 text-red-300'
                  : 'bg-red-50 text-red-700',
            )}
          >
            {delta >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {percent(delta)}
          </span>
        )}
        {hint && <span className={highlight ? 'text-brand-200/60' : 'text-ink-500'}>{hint}</span>}
      </div>
    </div>
  )
}
