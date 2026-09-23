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

export default async function SugestoesPage() {
  const supabase = await createClient();
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  const { data: propuestas } = await supabase
    .from("propuestas_productos")
    .select(
      "id, nombre_producto, segmento, link_proveedor, costo_estimado, precio_venta_estimado, precio_competencia, notas, created_at, profiles(nombre_completo)",
    )
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-semibold">Sugestões de produtos</h1>
          <p className="text-sm text-neutral-400">
            Propostas de produtos para vender, de qualquer sócio
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/productos"
            className="rounded-md border border-neutral-700 bg-black px-3 py-2 text-sm font-medium hover:bg-neutral-950"
          >
            ← Produtos
          </Link>
          <Link
            href="/productos/sugestoes/nova"
            className="rounded-md bg-white px-3 py-2 text-sm font-medium text-black hover:bg-neutral-200"
          >
            + Nova sugestão
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        {(propuestas ?? []).map((p) => (
          <div
            key={p.id}
            className="rounded-xl border border-neutral-800 bg-black p-5"
          >
            <div className="mb-2 flex items-start justify-between gap-4">
              <h2 className="text-base font-semibold">{p.nombre_producto}</h2>
              <span className="shrink-0 rounded-full bg-neutral-900 px-2.5 py-1 text-xs font-medium text-neutral-300">
                {p.segmento}
              </span>
            </div>

            {(p.costo_estimado || p.precio_venta_estimado || p.precio_competencia) && (
              <div className="mb-3 grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-neutral-950 p-3">
                  <p className="mb-0.5 text-xs text-neutral-400">Custo de compra</p>
                  <p className="text-sm font-semibold">
                    {p.costo_estimado ? formatMoney(Number(p.costo_estimado)) : "—"}
                  </p>
                </div>
                <div className="rounded-lg bg-emerald-950/40 p-3">
                  <p className="mb-0.5 text-xs text-emerald-400">Preço de venda</p>
                  <p className="text-sm font-semibold text-emerald-300">
                    {p.precio_venta_estimado
                      ? formatMoney(Number(p.precio_venta_estimado))
                      : "—"}
                  </p>
                </div>
                <div className="rounded-lg bg-neutral-950 p-3">
                  <p className="mb-0.5 text-xs text-neutral-400">Outros vendem a</p>
                  <p className="text-sm font-semibold">
                    {p.precio_competencia
                      ? formatMoney(Number(p.precio_competencia))
                      : "—"}
                  </p>
                </div>
              </div>
            )}

            {p.notas && (
              <p className="mb-3 text-sm text-neutral-300">{p.notas}</p>
            )}

            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span>
                Sugerido por{" "}
                {(p as unknown as { profiles: { nombre_completo: string } | null })
                  .profiles?.nombre_completo ?? "—"}{" "}
                · {p.created_at.slice(0, 10)}
              </span>
              {p.link_proveedor && (
                <a
                  href={p.link_proveedor}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-neutral-300 underline hover:text-white"
                >
                  Ver fornecedor
                </a>
              )}
            </div>
          </div>
        ))}

        {!propuestas?.length && (
          <div className="rounded-xl border border-neutral-800 bg-black p-8 text-center text-sm text-neutral-500">
            Ainda não há sugestões de produtos.{" "}
            <Link href="/productos/sugestoes/nova" className="underline">
              Sugerir o primeiro
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
