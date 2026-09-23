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

export default async function MargensPage() {
  const supabase = await createClient();
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  const { data: productos } = await supabase
    .from("productos")
    .select("id, nombre, sku, precio, costo, moneda_costo, costo_original, tipo_cambio_costo, activo")
    .order("nombre");

  const linhas = (productos ?? []).map((p) => {
    const precio = Number(p.precio);
    const costo = Number(p.costo);
    const margemValor = precio - costo;
    const margemPercentual = precio > 0 ? (margemValor / precio) * 100 : 0;
    return { ...p, precio, costo, margemValor, margemPercentual };
  });

  const totalCusto = linhas.reduce((acc, l) => acc + l.costo, 0);
  const totalPreco = linhas.reduce((acc, l) => acc + l.precio, 0);
  const margemMediaGeral = totalPreco > 0 ? ((totalPreco - totalCusto) / totalPreco) * 100 : 0;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-semibold">Margens por produto</h1>
          <p className="text-sm text-neutral-400">
            Comparativo entre custo de compra e preço de venda
          </p>
        </div>
        <Link
          href="/productos"
          className="rounded-md border border-neutral-700 bg-black px-3 py-2 text-sm font-medium hover:bg-neutral-950"
        >
          ← Produtos
        </Link>
      </div>

      <div className="mb-6 rounded-xl border border-neutral-800 bg-black p-5">
        <p className="mb-1 text-xs text-neutral-400">Margem média do catálogo</p>
        <p
          className={`text-2xl font-semibold ${
            margemMediaGeral >= 0 ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {margemMediaGeral.toFixed(1)}%
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-800 bg-black">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-800 bg-neutral-950 text-neutral-400">
            <tr>
              <th className="px-4 py-3 font-medium">Produto</th>
              <th className="px-4 py-3 font-medium">Custo (compra)</th>
              <th className="px-4 py-3 font-medium">Preço (venda)</th>
              <th className="px-4 py-3 font-medium">Margem R$</th>
              <th className="px-4 py-3 font-medium">Margem %</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.id} className="border-b border-neutral-900 last:border-0">
                <td className="px-4 py-3">
                  {l.nombre}
                  {!l.activo && (
                    <span className="ml-2 text-xs text-neutral-500">(inativo)</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {l.costo === 0 ? (
                    <span className="text-amber-400">não cadastrado</span>
                  ) : (
                    <>
                      {formatMoney(l.costo)}
                      {l.moneda_costo === "USD" && l.costo_original && (
                        <div className="text-xs font-normal text-neutral-500">
                          US$ {Number(l.costo_original).toFixed(2)} × {Number(l.tipo_cambio_costo).toFixed(2)}
                        </div>
                      )}
                    </>
                  )}
                </td>
                <td className="px-4 py-3">{formatMoney(l.precio)}</td>
                <td
                  className={`px-4 py-3 font-medium ${
                    l.margemValor >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {formatMoney(l.margemValor)}
                </td>
                <td
                  className={`px-4 py-3 font-medium ${
                    l.margemValor >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {l.margemPercentual.toFixed(1)}%
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/productos/${l.id}`}
                    className="text-neutral-400 hover:text-white hover:underline"
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
            {!linhas.length && (
              <tr>
                <td className="px-4 py-6 text-center text-neutral-500" colSpan={6}>
                  Ainda não há produtos cadastrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
