import { redirect } from "next/navigation";
import { createClient, getSessionUser } from "@/lib/supabase/server";

function formatMoney(n: number) {
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

type Pedido = {
  plataforma_id: string;
  producto_id: string | null;
  cantidad: number;
  monto: number;
  monto_neto: number;
  estado: string;
};

type Producto = {
  id: string;
  nombre: string;
  imagen_url: string | null;
  plataforma_id: string | null;
};

export default async function PlataformasPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const [{ data: plataformas }, { data: productosData }, { data: pedidosData }] =
    await Promise.all([
      supabase.from("plataformas").select("id, nombre, activa").order("nombre"),
      supabase.from("productos").select("id, nombre, imagen_url, plataforma_id"),
      supabase
        .from("pedidos")
        .select("plataforma_id, producto_id, cantidad, monto, monto_neto, estado"),
    ]);

  const productos = (productosData ?? []) as Producto[];
  const pedidos = ((pedidosData ?? []) as Pedido[]).filter((p) => p.estado !== "cancelado");
  const productoPorId = new Map(productos.map((p) => [p.id, p]));

  const resumen = (plataformas ?? []).map((plat) => {
    const suyos = pedidos.filter((p) => p.plataforma_id === plat.id);
    const unidadesPorProducto = new Map<string, number>();
    for (const p of suyos) {
      if (!p.producto_id) continue;
      unidadesPorProducto.set(p.producto_id, (unidadesPorProducto.get(p.producto_id) ?? 0) + p.cantidad);
    }
    const idsProductos = new Set([
      ...productos.filter((p) => p.plataforma_id === plat.id).map((p) => p.id),
      ...unidadesPorProducto.keys(),
    ]);
    const lista = [...idsProductos]
      .map((id) => ({ producto: productoPorId.get(id), unidades: unidadesPorProducto.get(id) ?? 0 }))
      .filter((x) => x.producto)
      .sort((a, b) => b.unidades - a.unidades);

    return {
      ...plat,
      pedidos: suyos.length,
      unidades: suyos.reduce((acc, p) => acc + p.cantidad, 0),
      bruto: suyos.reduce((acc, p) => acc + Number(p.monto), 0),
      neto: suyos.reduce((acc, p) => acc + Number(p.monto_neto), 0),
      lista,
    };
  });

  const maxNeto = Math.max(1, ...resumen.map((r) => r.neto));

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <div className="mb-6">
        <h1 className="mb-1 text-2xl font-semibold">Plataformas</h1>
        <p className="text-sm text-neutral-400">
          Produtos e vendas de cada canal (pedidos cancelados não contam)
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {resumen.map((r) => (
          <section
            key={r.id}
            className={`rounded-xl border border-neutral-800 bg-black p-5 ${r.activa ? "" : "opacity-60"}`}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{r.nombre}</h2>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  r.activa ? "bg-green-950 text-green-400" : "bg-neutral-900 text-neutral-500"
                }`}
              >
                {r.activa ? "Ativa" : "Inativa"}
              </span>
            </div>

            <div className="mb-4 grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-neutral-500">Pedidos</p>
                <p className="text-xl font-semibold">{r.pedidos}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Unidades</p>
                <p className="text-xl font-semibold">{r.unidades}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Líquido</p>
                <p className="text-xl font-semibold">{formatMoney(r.neto)}</p>
              </div>
            </div>

            <div className="mb-1 h-1.5 w-full overflow-hidden rounded-full bg-neutral-900">
              <div className="h-full bg-white" style={{ width: `${(r.neto / maxNeto) * 100}%` }} />
            </div>
            <p className="mb-4 text-xs text-neutral-500">Bruto {formatMoney(r.bruto)}</p>

            {r.lista.length ? (
              <ul className="divide-y divide-neutral-900 border-t border-neutral-900">
                {r.lista.map(({ producto, unidades }) => (
                  <li key={producto!.id} className="flex items-center gap-3 py-2">
                    {producto!.imagen_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={producto!.imagen_url}
                        alt=""
                        loading="lazy"
                        className="h-8 w-8 rounded border border-neutral-800 object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded border border-dashed border-neutral-800" />
                    )}
                    <span className="flex-1 truncate text-sm text-neutral-300">{producto!.nombre}</span>
                    <span className="text-sm font-medium">
                      {unidades} <span className="text-xs font-normal text-neutral-500">vend.</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="border-t border-neutral-900 pt-3 text-sm text-neutral-500">
                Sem produtos nem vendas ainda.
              </p>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
