import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import EstadoSelect from "./estado-select";

function formatMoney(n: number) {
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

const FILTROS = [
  { value: "todos", label: "Todos" },
  { value: "pendiente", label: "Pendentes" },
  { value: "enviado", label: "Enviados" },
  { value: "entregado", label: "Entregues" },
  { value: "cancelado", label: "Cancelados" },
];

const PAGO_LABELS: Record<string, string> = {
  pix: "Pix",
  credito: "Crédito",
  debito: "Débito",
  transferencia: "Transferência",
  efectivo: "Dinheiro",
  otro: "Outro",
};

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado } = await searchParams;
  const filtro = estado && FILTROS.some((f) => f.value === estado) ? estado : "todos";

  const supabase = await createClient();
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  let query = supabase
    .from("pedidos")
    .select(
      "id, fecha, cliente_nombre, cliente_contacto, cantidad, monto, monto_neto, metodo_pago, estado, plataformas(nombre), productos(nombre), profiles(nombre_completo)",
    )
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  if (filtro !== "todos") {
    query = query.eq("estado", filtro);
  }

  const { data: pedidos } = await query;

  const totalMonto = (pedidos ?? [])
    .filter((p) => p.estado !== "cancelado")
    .reduce((acc, p) => acc + Number(p.monto), 0);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-semibold">Pedidos</h1>
          <p className="text-sm text-neutral-400">
            Acompanhamento de pedidos por plataforma e status
          </p>
        </div>
        <Link
          href="/pedidos/nuevo"
          className="rounded-md bg-white px-3 py-2 text-sm font-medium text-black hover:bg-neutral-200"
        >
          + Novo pedido
        </Link>
      </div>

      <div className="mb-6 flex gap-2">
        {FILTROS.map((f) => (
          <Link
            key={f.value}
            href={f.value === "todos" ? "/pedidos" : `/pedidos?estado=${f.value}`}
            className={`rounded-full px-3 py-1.5 text-sm ${
              filtro === f.value
                ? "bg-white text-black"
                : "bg-black text-neutral-300 hover:bg-neutral-900"
            } border border-neutral-800`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="mb-4 text-sm text-neutral-400">
        {pedidos?.length ?? 0} pedido(s) — total {formatMoney(totalMonto)}
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-800 bg-black">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-800 bg-neutral-950 text-neutral-400">
            <tr>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Produto</th>
              <th className="px-4 py-3 font-medium">Plataforma</th>
              <th className="px-4 py-3 font-medium">Líquido</th>
              <th className="px-4 py-3 font-medium">Pagamento</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Registrado por</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {(pedidos ?? []).map((p) => (
              <tr key={p.id} className="border-b border-neutral-900 last:border-0">
                <td className="px-4 py-3">{p.fecha}</td>
                <td className="px-4 py-3">
                  <div>{p.cliente_nombre}</div>
                  {p.cliente_contacto && (
                    <div className="text-xs text-neutral-500">
                      {p.cliente_contacto}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-neutral-300">
                  {(p as unknown as { productos: { nombre: string } | null })
                    .productos?.nombre ?? "—"}
                  {p.cantidad > 1 && (
                    <span className="text-neutral-500"> ×{p.cantidad}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-neutral-300">
                  {(p as unknown as { plataformas: { nombre: string } | null })
                    .plataformas?.nombre ?? "—"}
                </td>
                <td className="px-4 py-3 font-medium">
                  {formatMoney(Number(p.monto_neto))}
                  <div className="text-xs font-normal text-neutral-500">
                    bruto {formatMoney(Number(p.monto))}
                  </div>
                </td>
                <td className="px-4 py-3 text-neutral-300">
                  {p.metodo_pago ? (PAGO_LABELS[p.metodo_pago] ?? p.metodo_pago) : "—"}
                </td>
                <td className="px-4 py-3">
                  <EstadoSelect pedidoId={p.id} estadoInicial={p.estado} />
                </td>
                <td className="px-4 py-3 text-neutral-400">
                  {(p as unknown as { profiles: { nombre_completo: string } | null })
                    .profiles?.nombre_completo ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/pedidos/${p.id}`}
                    className="text-neutral-400 hover:text-white hover:underline"
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
            {!pedidos?.length && (
              <tr>
                <td className="px-4 py-6 text-center text-neutral-500" colSpan={9}>
                  Não há pedidos {filtro !== "todos" ? `com status "${FILTROS.find((f) => f.value === filtro)?.label}"` : "registrados"}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
