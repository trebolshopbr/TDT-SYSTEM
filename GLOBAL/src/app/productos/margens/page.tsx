import { redirect } from "next/navigation";
import Link from "next/link";
import LoadError from "../_components/load-error";
import { calcularMargem, resumirMargens, valorPositivo } from "../_lib/valores";
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

  const { data: productos, error } = await supabase
    .from("productos")
    .select("id, nombre, sku, precio, costo, moneda_costo, costo_original, tipo_cambio_costo, activo")
    .order("nombre");

  if (error) return <LoadError title="Margens por produto" />;

  const linhas = (productos ?? []).map((p) => ({ ...p, margem: calcularMargem(p.precio, p.costo) }));
  const resumo = resumirMargens(productos ?? []);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="mb-1 text-2xl font-semibold">Margens por produto</h1>
          <p className="text-sm text-neutral-400">
            Venda menos custo de compra. Não desconta comissões, frete, impostos ou outras despesas.
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
        <p className="mb-1 text-xs text-neutral-400">Margem de compra e venda</p>
        <p
          className={`text-2xl font-semibold ${
            resumo.percentual === null ? "text-neutral-400" : resumo.percentual >= 0 ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {resumo.percentual === null ? "Pendente" : `${resumo.percentual.toFixed(1)}%`}
        </p>
        <p className="mt-2 text-sm text-neutral-400">{resumo.incluidos} de {linhas.length} produtos com preço e custo preenchidos. {resumo.pendentes} pendente(s).</p>
        <p className="mt-1 text-xs text-neutral-500">Calculada sobre a soma dos preços, com uma unidade de cada produto válido, incluindo inativos. Não representa o lucro das vendas.</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-black">
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
                  {valorPositivo(l.costo) === null ? (
                    <span className="text-amber-400">Custo pendente</span>
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
                <td className="px-4 py-3">{valorPositivo(l.precio) === null ? "Preço pendente" : formatMoney(Number(l.precio))}</td>
                <td
                  className={`px-4 py-3 font-medium ${
                    l.margem === null ? "text-neutral-500" : l.margem.valor >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {l.margem === null ? "Pendente" : formatMoney(l.margem.valor)}
                </td>
                <td
                  className={`px-4 py-3 font-medium ${
                    l.margem === null ? "text-neutral-500" : l.margem.valor >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {l.margem === null ? "Pendente" : `${l.margem.percentual.toFixed(1)}%`}
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
