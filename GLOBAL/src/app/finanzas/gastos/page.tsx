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

const CATEGORIA_LABELS: Record<string, string> = {
  insumos: "Insumos",
  envio: "Frete",
  publicidad: "Publicidade",
  comisiones: "Comissões",
  alquiler: "Aluguel",
  sueldos: "Salários",
  otro: "Outro",
};

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

export default async function GastosPage({
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

  const { data: gastos } = await supabase
    .from("gastos")
    .select(
      "id, fecha, monto, moneda, monto_original, tipo_cambio, categoria, descripcion, profiles(nombre_completo)",
    )
    .gte("fecha", inicio)
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false });

  const totalGastos = (gastos ?? []).reduce((acc, g) => acc + Number(g.monto), 0);

  const porCategoria = new Map<string, number>();
  for (const g of gastos ?? []) {
    porCategoria.set(g.categoria, (porCategoria.get(g.categoria) ?? 0) + Number(g.monto));
  }
  const categoriasOrdenadas = [...porCategoria.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-semibold">Despesas</h1>
          <p className="text-sm text-neutral-400">Despesas reais da empresa</p>
        </div>
        <Link
          href="/finanzas/gastos/nuevo"
          className="rounded-md bg-white px-3 py-2 text-sm font-medium text-black hover:bg-neutral-200"
        >
          + Registrar despesa
        </Link>
      </div>

      <div className="mb-6 flex gap-1 rounded-lg bg-neutral-900 p-1">
        {PERIODOS.map((p) => (
          <Link
            key={p.value}
            href={p.value === "mes" ? "/finanzas/gastos" : `/finanzas/gastos?periodo=${p.value}`}
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

      <div className="mb-6 rounded-2xl border border-red-900 bg-gradient-to-br from-red-950/40 to-black p-6">
        <p className="mb-1 text-sm font-medium text-red-400">Total gasto</p>
        <p className="text-4xl font-semibold tracking-tight text-red-300">
          {formatMoney(totalGastos)}
        </p>
      </div>

      {categoriasOrdenadas.length > 0 && (
        <div className="mb-6 rounded-xl border border-neutral-800 bg-black p-6">
          <h2 className="mb-4 text-sm font-medium text-neutral-400">
            Por categoria
          </h2>
          <div className="space-y-3">
            {categoriasOrdenadas.map(([categoria, monto]) => (
              <div key={categoria} className="flex items-center justify-between">
                <span className="text-sm text-neutral-300">
                  {CATEGORIA_LABELS[categoria] ?? categoria}
                </span>
                <span className="text-sm font-medium">{formatMoney(monto)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-neutral-800 bg-black">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-800 bg-neutral-950 text-neutral-400">
            <tr>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium">Descrição</th>
              <th className="px-4 py-3 font-medium">Valor</th>
              <th className="px-4 py-3 font-medium">Registrado por</th>
            </tr>
          </thead>
          <tbody>
            {(gastos ?? []).map((g) => (
              <tr key={g.id} className="border-b border-neutral-900 last:border-0">
                <td className="px-4 py-3">{g.fecha}</td>
                <td className="px-4 py-3 text-neutral-300">
                  {CATEGORIA_LABELS[g.categoria] ?? g.categoria}
                </td>
                <td className="px-4 py-3 text-neutral-400">
                  {g.descripcion ?? "—"}
                </td>
                <td className="px-4 py-3 font-medium">
                  {formatMoney(Number(g.monto))}
                  {g.moneda === "USD" && g.monto_original && (
                    <div className="text-xs font-normal text-neutral-500">
                      US$ {Number(g.monto_original).toFixed(2)} × {Number(g.tipo_cambio).toFixed(2)}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-neutral-400">
                  {(g as unknown as { profiles: { nombre_completo: string } | null })
                    .profiles?.nombre_completo ?? "—"}
                </td>
              </tr>
            ))}
            {!gastos?.length && (
              <tr>
                <td className="px-4 py-6 text-center text-neutral-500" colSpan={5}>
                  Não há despesas registradas neste período.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
