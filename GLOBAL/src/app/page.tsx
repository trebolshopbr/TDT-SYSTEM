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

const PERIODOS = [
  { value: "dia", label: "Dia" },
  { value: "semana", label: "Semana" },
  { value: "mes", label: "Mês" },
  { value: "anio", label: "Ano" },
];

function calcularInicio(periodo: string) {
  const hoy = new Date();

  if (periodo === "dia") {
    return toISODate(hoy);
  }

  if (periodo === "semana") {
    const diaSemana = (hoy.getDay() + 6) % 7; // lunes = 0
    const inicio = new Date(hoy);
    inicio.setDate(hoy.getDate() - diaSemana);
    return toISODate(inicio);
  }

  if (periodo === "anio") {
    return `${hoy.getFullYear()}-01-01`;
  }

  // mes (default)
  return toISODate(hoy).slice(0, 7) + "-01";
}

type PedidoConCosto = {
  monto: number;
  monto_neto: number;
  cantidad: number;
  estado: string;
  fecha: string;
  productos: { costo: number } | null;
};

function IconBag() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
      <path
        d="M5.5 7.5V6a4.5 4.5 0 0 1 9 0v1.5M3.5 7.5h13l.8 9.5a1.5 1.5 0 0 1-1.5 1.6H4.2a1.5 1.5 0 0 1-1.5-1.6l.8-9.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconTrend() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
      <path
        d="M2.5 14.5 8 9l3 3 6.5-6.5M17.5 5.5h-4M17.5 5.5v4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconWallet() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
      <path
        d="M2.5 6.5A2 2 0 0 1 4.5 4.5h9a2 2 0 0 1 2 2v.5M2.5 6.5v8a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-3a1.5 1.5 0 0 0 0 3h3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconSpark() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
      <path
        d="M10 2.5 11.6 7.4 16.5 9l-4.9 1.6L10 15.5l-1.6-4.9L3.5 9l4.9-1.6L10 2.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default async function Home({
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("nombre_completo")
    .eq("id", user.id)
    .single();

  const inicio = calcularInicio(periodo);

  const [{ data: pedidos }, { count: productosSinCosto }] = await Promise.all([
    supabase
      .from("pedidos")
      .select("monto, monto_neto, cantidad, estado, fecha, productos(costo)")
      .gte("fecha", inicio),
    supabase
      .from("productos")
      .select("id", { count: "exact", head: true })
      .eq("costo", 0)
      .eq("activo", true),
  ]);

  const validos = ((pedidos ?? []) as unknown as PedidoConCosto[]).filter(
    (p) => p.estado !== "cancelado",
  );

  const totalPedidos = validos.length;
  const totalVendidoBruto = validos.reduce((acc, p) => acc + Number(p.monto), 0);
  const totalRecibidoNeto = validos.reduce(
    (acc, p) => acc + Number(p.monto_neto),
    0,
  );
  const gananciaTotal = validos.reduce((acc, p) => {
    const costoUnitario = p.productos?.costo ? Number(p.productos.costo) : 0;
    return acc + (Number(p.monto_neto) - costoUnitario * p.cantidad);
  }, 0);

  const margen = totalRecibidoNeto > 0 ? (gananciaTotal / totalRecibidoNeto) * 100 : 0;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mb-1 text-2xl font-semibold">
            Bem-vindo{profile?.nombre_completo ? `, ${profile.nombre_completo}` : ""}
          </h1>
          <p className="text-sm text-neutral-400">
            {formatRangoLabel(inicio, periodo)}
          </p>
        </div>

        <div className="flex gap-1 rounded-lg bg-neutral-900 p-1">
          {PERIODOS.map((p) => (
            <Link
              key={p.value}
              href={p.value === "mes" ? "/" : `/?periodo=${p.value}`}
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
      </div>

      {/* Hero: Ganancia */}
      <div className="mb-4 rounded-2xl border border-emerald-900 bg-gradient-to-br from-emerald-950/40 to-black p-6">
        <div className="mb-3 flex items-center gap-2 text-emerald-400">
          <IconSpark />
          <span className="text-sm font-medium">Lucro da empresa</span>
        </div>
        <p className="mb-1 text-4xl font-semibold tracking-tight text-emerald-300">
          {formatMoney(gananciaTotal)}
        </p>
        <p className="text-sm text-emerald-400">
          {totalRecibidoNeto > 0
            ? `Margem de ${margen.toFixed(0)}% sobre o recebido`
            : "Sem vendas neste período"}
        </p>
      </div>

      {/* Soporte: Pedidos / Vendido / Recibido */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-800 bg-black p-4">
          <div className="mb-2 flex items-center gap-2 text-neutral-500">
            <IconBag />
            <span className="text-xs font-medium uppercase tracking-wide">
              Pedidos
            </span>
          </div>
          <p className="text-xl font-semibold">{totalPedidos}</p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-black p-4">
          <div className="mb-2 flex items-center gap-2 text-neutral-500">
            <IconTrend />
            <span className="text-xs font-medium uppercase tracking-wide">
              Vendido (bruto)
            </span>
          </div>
          <p className="text-xl font-semibold">{formatMoney(totalVendidoBruto)}</p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-black p-4">
          <div className="mb-2 flex items-center gap-2 text-neutral-500">
            <IconWallet />
            <span className="text-xs font-medium uppercase tracking-wide">
              Recebido (líquido)
            </span>
          </div>
          <p className="text-xl font-semibold">{formatMoney(totalRecibidoNeto)}</p>
        </div>
      </div>

      {!!productosSinCosto && (
        <div className="rounded-xl border border-amber-900 bg-amber-950/40 px-4 py-3 text-sm text-amber-300">
          {productosSinCosto} produto{productosSinCosto > 1 ? "s" : ""} ativo
          {productosSinCosto > 1 ? "s" : ""} sem custo cadastrado — por isso o
          lucro aparece igual ao líquido.{" "}
          <Link href="/productos" className="font-medium underline">
            Completar custos
          </Link>
        </div>
      )}
    </main>
  );
}
