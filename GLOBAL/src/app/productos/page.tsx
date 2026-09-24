import { redirect } from "next/navigation";
import Link from "next/link";
import LoadError from "./_components/load-error";
import { valorPositivo } from "./_lib/valores";
import { createClient, getSessionUser } from "@/lib/supabase/server";

function formatMoney(n: number) {
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

export default async function ProductosPage({ searchParams }: {
  searchParams: Promise<{ pendente?: string; salvo?: string }>;
}) {
  const { pendente, salvo } = await searchParams;
  const custosPendentes = pendente === "custo";
  const supabase = await createClient();
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  const { data: productos, error } = await supabase
    .from("productos")
    .select("id, nombre, sku, precio, costo, stock, activo, imagen_url, plataformas(nombre)")
    .order("nombre");

  if (error) return <LoadError title="Produtos" />;

  const pendientes = (productos ?? []).filter((p) => valorPositivo(p.costo) === null);
  const totalProductos = productos?.length ?? 0;
  const sinStock = (productos ?? []).filter((p) => p.stock <= 0).length;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="mb-1 text-2xl font-semibold">Produtos</h1>
          <p className="text-sm text-neutral-400">
            Catálogo base de produtos e estoque
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/productos/compras" className="rounded-md border border-neutral-700 px-3 py-2 text-sm font-medium hover:bg-neutral-950">Compras e custos</Link>
          <Link
            href="/productos/sugestoes"
            className="rounded-md border border-neutral-700 bg-black px-3 py-2 text-sm font-medium hover:bg-neutral-950"
          >
            Sugestões
          </Link>
          <Link
            href="/productos/margens"
            className="rounded-md border border-neutral-700 bg-black px-3 py-2 text-sm font-medium hover:bg-neutral-950"
          >
            Ver margens
          </Link>
          <Link
            href="/productos/nuevo"
            className="rounded-md bg-white px-3 py-2 text-sm font-medium text-black hover:bg-neutral-200"
          >
            + Novo produto
          </Link>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-neutral-800 bg-black p-5">
          <p className="mb-1 text-xs text-neutral-400">Produtos cadastrados</p>
          <p className="text-2xl font-semibold">{totalProductos}</p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-black p-5">
          <p className="mb-1 text-xs text-neutral-400">Estoque zerado ou negativo</p>
          <p className="text-2xl font-semibold">{sinStock}</p>
        </div>
      </div>

      <nav aria-label="Filtrar produtos" className="mb-5 flex flex-wrap gap-3 text-sm">
        <Link href="/productos" aria-current={!custosPendentes ? "page" : undefined} className={`rounded-md border border-neutral-700 px-3 py-2 ${!custosPendentes ? "bg-white text-black" : "text-neutral-300"}`}>Todos os produtos</Link>
        <Link href="/productos?pendente=custo" aria-current={custosPendentes ? "page" : undefined} className={`rounded-md border border-neutral-700 px-3 py-2 ${custosPendentes ? "bg-white text-black" : "text-neutral-300"}`}>Custos pendentes ({pendientes.length})</Link>
      </nav>
      {salvo === "custo" && <p role="status" className="mb-4 text-sm text-neutral-300">Custo salvo. A lista de pendências foi atualizada.</p>}
      {custosPendentes ? (
        <section aria-label="Custos pendentes">
          <h2 className="mb-2 text-lg font-semibold">Completar custos de compra</h2>
          <p className="mb-5 text-sm text-neutral-400">Preencha o custo por unidade quando tiver o valor confirmado. Até lá, a margem fica pendente.</p>
          <div className="divide-y divide-neutral-800 rounded-xl border border-neutral-800 px-4">
            {pendientes.map((p) => <article key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div><h3 className="text-sm font-medium">{p.nombre}</h3><p className="mt-1 text-xs text-neutral-400">{p.activo ? "Ativo" : "Inativo"} · Custo pendente</p></div>
              <Link href={`/productos/${p.id}?completar=custo`} className="rounded-md bg-white px-3 py-2 text-sm font-medium text-black">Completar custo<span className="sr-only"> de {p.nombre}</span></Link>
            </article>)}
            {!pendientes.length && <p className="py-6 text-sm text-neutral-300">Nenhum custo pendente. Consulte as margens dos produtos cadastrados.</p>}
          </div>
        </section>
      ) : (
      <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-black">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-800 bg-neutral-950 text-neutral-400">
            <tr>
              <th className="px-4 py-3 font-medium"></th>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Canal</th>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Preço</th>
              <th className="px-4 py-3 font-medium">Estoque</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {(productos ?? []).map((p) => (
              <tr
                key={p.id}
                className="border-b border-neutral-900 last:border-0 hover:bg-neutral-950"
              >
                <td className="px-4 py-3">
                  {p.imagen_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.imagen_url}
                      alt={p.nombre}
                      className="h-10 w-10 rounded-md border border-neutral-800 object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-md border border-dashed border-neutral-800" />
                  )}
                </td>
                <td className="px-4 py-3">
                  {p.nombre}
                  <p className="mt-1 text-xs text-neutral-400">{[
                    !p.imagen_url ? "Sem foto" : null,
                    valorPositivo(p.costo) === null ? "Custo pendente" : null,
                    valorPositivo(p.precio) === null ? "Preço pendente" : null,
                  ].filter(Boolean).join(" · ")}</p>
                </td>
                <td className="px-4 py-3 text-neutral-400">
                  {(p as unknown as { plataformas: { nombre: string } | null })
                    .plataformas?.nombre ?? "—"}
                </td>
                <td className="px-4 py-3 text-neutral-400">{p.sku ?? "—"}</td>
                <td className="px-4 py-3">{valorPositivo(p.precio) === null ? "Pendente" : formatMoney(Number(p.precio))}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      p.stock <= 0 ? "font-medium text-red-400" : "font-medium"
                    }
                  >
                    {p.stock}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      p.activo
                        ? "rounded-full bg-green-950 px-2 py-0.5 text-xs text-green-400"
                        : "rounded-full bg-neutral-900 px-2 py-0.5 text-xs text-neutral-400"
                    }
                  >
                    {p.activo ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/productos/${p.id}`}
                    className="text-neutral-400 hover:text-white hover:underline"
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
            {!productos?.length && (
              <tr>
                <td className="px-4 py-6 text-center text-neutral-500" colSpan={8}>
                  Ainda não há produtos cadastrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      )}
    </main>
  );
}
