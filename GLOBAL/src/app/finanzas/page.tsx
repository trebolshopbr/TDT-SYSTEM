import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, getSessionUser } from "@/lib/supabase/server";

function formatMoney(n: number) {
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

const PERIODOS = [
  { value: "dia", label: "Dia" },
  { value: "semana", label: "Semana" },
  { value: "mes", label: "Mês" },
  { value: "anio", label: "Ano" },
];

function calcularInicio(periodo: string) {
  const hoy = new Date();

  if (periodo === "dia") return toISODate(hoy);

  if (periodo === "semana") {
    const diaSemana = (hoy.getDay() + 6) % 7;
    const inicio = new Date(hoy);
    inicio.setDate(hoy.getDate() - diaSemana);
    return toISODate(inicio);
  }

  if (periodo === "anio") return `${hoy.getFullYear()}-01-01`;

  return toISODate(hoy).slice(0, 7) + "-01";
}

function formatRangoLabel(inicio: string, periodo: string) {
  const inicioDate = new Date(inicio + "T00:00:00");
  const hoy = new Date();
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };

  if (periodo === "dia") {
    return hoy.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
  }
  if (periodo === "anio") {
    return `Ano ${hoy.getFullYear()}`;
  }
  return `${inicioDate.toLocaleDateString("pt-BR", opts)} — ${hoy.toLocaleDateString("pt-BR", opts)}`;
}

function IconMinus() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
      <path d="M3.5 8h9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function IconEquals() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
      <path d="M3.5 6.25h9M3.5 9.75h9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function IconMoney() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 5v6M6.2 9.5c0 .83.8 1.5 1.8 1.5s1.8-.5 1.8-1.3c0-.9-.8-1.2-1.8-1.4C6.9 8.1 6.2 7.8 6.2 7c0-.8.8-1.3 1.8-1.3s1.8.5 1.8 1.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

type FilaCascada = {
  label: string;
  valor: number;
  tipo: "base" | "resta" | "total";
  href?: string;
};

function Cascada({ filas }: { filas: FilaCascada[] }) {
  return (
    <div className="divide-y divide-neutral-900">
      {filas.map((f, i) => {
        const contenido = (
          <div
            className={`flex items-center justify-between py-3 ${
              f.tipo === "total" ? "pt-4" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                  f.tipo === "resta"
                    ? "bg-red-950 text-red-400"
                    : f.tipo === "total"
                      ? f.valor >= 0
                        ? "bg-emerald-950 text-emerald-400"
                        : "bg-red-950 text-red-400"
                      : "bg-neutral-900 text-neutral-400"
                }`}
              >
                {f.tipo === "resta" ? (
                  <IconMinus />
                ) : f.tipo === "total" ? (
                  <IconEquals />
                ) : (
                  <IconMoney />
                )}
              </span>
              <span
                className={
                  f.tipo === "total"
                    ? "text-sm font-medium text-white"
                    : "text-sm text-neutral-300"
                }
              >
                {f.label}
              </span>
            </div>
            <span
              className={
                f.tipo === "total"
                  ? `text-lg font-semibold ${f.valor >= 0 ? "text-emerald-400" : "text-red-400"}`
                  : f.tipo === "resta"
                    ? "text-sm font-medium text-red-400"
                    : "text-sm font-medium text-white"
              }
            >
              {f.tipo === "resta" && f.valor > 0 ? "− " : ""}
              {formatMoney(Math.abs(f.valor))}
            </span>
          </div>
        );

        return f.href ? (
          <Link key={i} href={f.href} className="block transition hover:bg-neutral-950">
            {contenido}
          </Link>
        ) : (
          <div key={i}>{contenido}</div>
        );
      })}
    </div>
  );
}

export default async function FinanzasPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const { periodo: periodoParam } = await searchParams;
  const periodo =
    periodoParam && PERIODOS.some((p) => p.value === periodoParam)
      ? periodoParam
      : "mes";

  const supabase = await createClient();
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  const inicio = calcularInicio(periodo);

  const [{ data: ventas }, { data: pedidos }, { data: gastos }, { data: ultimoCierre }, { data: cierresRecientes }, { data: plataformas }] =
    await Promise.all([
      supabase
        .from("ventas_plataforma")
        .select("monto, monto_neto, plataforma_id, plataformas(nombre)")
        .gte("fecha", inicio),
      supabase
        .from("pedidos")
        .select("cantidad, estado, productos(costo)")
        .gte("fecha", inicio),
      supabase.from("gastos").select("monto").gte("fecha", inicio),
      supabase
        .from("cierres_caja")
        .select("*")
        .order("fecha", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("cierres_caja")
        .select("id, fecha, efectivo_final, total_ventas, total_gastos, registrado_por, profiles(nombre_completo)")
        .order("fecha", { ascending: false })
        .limit(10),
      supabase.from("plataformas").select("id, nombre, tipo, activa").order("nombre"),
    ]);

  const totalBruto = (ventas ?? []).reduce((acc, v) => acc + Number(v.monto), 0);
  const totalNeto = (ventas ?? []).reduce((acc, v) => acc + Number(v.monto_neto), 0);
  const totalComisiones = totalBruto - totalNeto;
  const totalGastos = (gastos ?? []).reduce((acc, g) => acc + Number(g.monto), 0);

  const pedidosValidos = (
    (pedidos ?? []) as unknown as {
      cantidad: number;
      estado: string;
      productos: { costo: number } | null;
    }[]
  ).filter((p) => p.estado !== "cancelado");

  const costoProdutos = pedidosValidos.reduce((acc, p) => {
    const costoUnitario = p.productos?.costo ? Number(p.productos.costo) : 0;
    return acc + costoUnitario * p.cantidad;
  }, 0);

  const lucroReal = totalNeto - costoProdutos - totalGastos;

  const porPlataforma = new Map<string, number>();
  for (const v of ventas ?? []) {
    const nombre = (v as unknown as { plataformas: { nombre: string } | null }).plataformas?.nombre ?? "—";
    porPlataforma.set(nombre, (porPlataforma.get(nombre) ?? 0) + Number(v.monto_neto));
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mb-1 text-2xl font-semibold">Financeiro</h1>
          <p className="text-sm text-neutral-400">{formatRangoLabel(inicio, periodo)}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 rounded-lg bg-neutral-900 p-1">
            {PERIODOS.map((p) => (
              <Link
                key={p.value}
                href={p.value === "mes" ? "/finanzas" : `/finanzas?periodo=${p.value}`}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  periodo === p.value
                    ? "bg-black text-white shadow-sm"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {p.label}
              </Link>
            ))}
          </div>
          <Link
            href="/finanzas/gastos/nuevo"
            className="rounded-md border border-neutral-700 bg-black px-3 py-2 text-sm font-medium hover:bg-neutral-950"
          >
            + Despesa
          </Link>
          <Link
            href="/finanzas/nuevo-cierre"
            className="rounded-md bg-white px-3 py-2 text-sm font-medium text-black hover:bg-neutral-200"
          >
            + Fechar caixa
          </Link>
        </div>
      </div>

      {/* Cascada do dinheiro */}
      <div className="mb-4 rounded-2xl border border-neutral-800 bg-black px-6 py-2">
        <Cascada
          filas={[
            { label: "Total pago pelos clientes", valor: totalBruto, tipo: "base" },
            { label: "Comissões das plataformas", valor: totalComisiones, tipo: "resta" },
            { label: "Recebido líquido", valor: totalNeto, tipo: "total" },
            { label: "Custo dos produtos", valor: costoProdutos, tipo: "resta" },
            {
              label: "Despesas",
              valor: totalGastos,
              tipo: "resta",
              href: "/finanzas/gastos",
            },
            { label: "Lucro real", valor: lucroReal, tipo: "total" },
          ]}
        />
      </div>

      {costoProdutos === 0 && totalNeto > 0 && (
        <div className="mb-6 rounded-xl border border-amber-900 bg-amber-950/40 px-4 py-3 text-sm text-amber-300">
          Nenhum pedido deste período tem custo de produto cadastrado — o lucro
          real pode estar superestimado.{" "}
          <Link href="/productos" className="font-medium underline">
            Completar custos
          </Link>
        </div>
      )}

      {/* Último fechamento */}
      <div className="mb-6 rounded-xl border border-neutral-800 bg-black p-5">
        <p className="mb-1 text-xs text-neutral-400">
          Último fechamento de caixa{ultimoCierre ? ` — ${ultimoCierre.fecha}` : ""}
        </p>
        <p className="text-2xl font-semibold">
          {ultimoCierre ? formatMoney(Number(ultimoCierre.efectivo_final)) : "—"}
        </p>
      </div>

      {/* Recibido por plataforma */}
      <div className="mb-6 rounded-xl border border-neutral-800 bg-black p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium text-neutral-400">
            Recebido líquido por plataforma
          </h2>
          <Link
            href="/pedidos"
            className="text-sm text-neutral-400 hover:text-white hover:underline"
          >
            Ver pedidos
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(plataformas ?? []).map((p) => (
            <div key={p.id} className="rounded-lg bg-neutral-950 p-4">
              <p className="mb-1 truncate text-xs text-neutral-400">
                {p.nombre}
                {!p.activa && " (inativa)"}
              </p>
              <p className="text-lg font-semibold">
                {formatMoney(porPlataforma.get(p.nombre) ?? 0)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Fechamentos recentes */}
      <div className="overflow-hidden rounded-xl border border-neutral-800 bg-black">
        <div className="border-b border-neutral-800 px-6 py-4">
          <h2 className="text-sm font-medium text-neutral-400">
            Fechamentos de caixa recentes
          </h2>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-800 bg-neutral-950 text-neutral-400">
            <tr>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Vendas</th>
              <th className="px-4 py-3 font-medium">Despesas</th>
              <th className="px-4 py-3 font-medium">Caixa final</th>
              <th className="px-4 py-3 font-medium">Registrado por</th>
            </tr>
          </thead>
          <tbody>
            {(cierresRecientes ?? []).map((c) => (
              <tr key={c.id} className="border-b border-neutral-900 last:border-0">
                <td className="px-4 py-3">{c.fecha}</td>
                <td className="px-4 py-3">{formatMoney(Number(c.total_ventas))}</td>
                <td className="px-4 py-3">{formatMoney(Number(c.total_gastos))}</td>
                <td className="px-4 py-3 font-medium">
                  {formatMoney(Number(c.efectivo_final))}
                </td>
                <td className="px-4 py-3 text-neutral-400">
                  {(c as unknown as { profiles: { nombre_completo: string } | null }).profiles
                    ?.nombre_completo ?? "—"}
                </td>
              </tr>
            ))}
            {!cierresRecientes?.length && (
              <tr>
                <td className="px-4 py-6 text-center text-neutral-500" colSpan={5}>
                  Ainda não há fechamentos de caixa registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
