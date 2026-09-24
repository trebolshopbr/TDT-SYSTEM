import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, getSessionUser } from "@/lib/supabase/server";

const ESTADOS = {
  por_investigar: { label: "Por investigar", className: "bg-neutral-900 text-neutral-300" },
  em_analise: { label: "Em análise", className: "bg-amber-950/60 text-amber-300" },
  aprovado: { label: "Aprovado", className: "bg-emerald-950/60 text-emerald-300" },
  descartado: { label: "Descartado", className: "bg-red-950/50 text-red-300" },
} as const;

function formatMoney(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function SugestoesPage() {
  const supabase = await createClient();
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { data: propostas } = await supabase
    .from("propuestas_productos")
    .select("id, nombre_producto, segmento, costo_estimado, precio_venta_estimado, precio_competencia, estado, imagem_referencias, proximo_passo, ordem, producto_id")
    .order("ordem", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8 sm:px-6 sm:py-10">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">Pesquisa antes do catálogo</p>
          <h1 className="mb-1 text-2xl font-semibold">Sugestões de produtos</h1>
          <p className="text-sm text-neutral-400">Cinco candidatos em ordem, com evidência e próximo passo.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/productos/sugestoes/imagens" className="rounded-md border border-neutral-700 px-3 py-2 text-sm font-medium hover:bg-neutral-950">Imagens históricas</Link>
          <Link href="/productos" className="rounded-md border border-neutral-700 px-3 py-2 text-sm font-medium hover:bg-neutral-950">← Produtos</Link>
          <Link href="/productos/sugestoes/nova" className="rounded-md bg-white px-3 py-2 text-sm font-medium text-black hover:bg-neutral-200">+ Nova sugestão</Link>
        </div>
      </header>

      <div className="space-y-4">
        {(propostas ?? []).map((p, index) => {
          const estado = ESTADOS[p.estado as keyof typeof ESTADOS] ?? ESTADOS.por_investigar;
          const imagens = (p.imagem_referencias as string[] | null) ?? [];
          const margem = p.precio_venta_estimado != null && p.costo_estimado != null
            ? Number(p.precio_venta_estimado) - Number(p.costo_estimado)
            : null;

          return (
            <article key={p.id} className="overflow-hidden rounded-xl border border-neutral-800 bg-black">
              <div className="grid md:grid-cols-[190px_1fr]">
                <div className="relative min-h-44 border-b border-neutral-800 bg-neutral-950 md:border-b-0 md:border-r">
                  {imagens[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imagens[0]} alt={`Referência de ${p.nombre_producto}`} className="absolute inset-0 h-full w-full object-contain p-3" />
                  ) : (
                    <Link href={`/productos/sugestoes/${p.id}`} className="flex h-full min-h-44 items-center justify-center px-5 text-center text-sm text-neutral-500 hover:text-white">Imagem pendente · Editar</Link>
                  )}
                  {imagens.length > 1 && <span className="absolute bottom-3 right-3 rounded-full bg-black/80 px-2 py-1 text-xs text-neutral-300">+{imagens.length - 1}</span>}
                </div>

                <div className="p-5">
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div className="flex gap-3">
                      <span className="mt-0.5 font-mono text-sm text-neutral-600">{String(p.ordem ?? index + 1).padStart(2, "0")}</span>
                      <div><h2 className="font-semibold">{p.nombre_producto}</h2><p className="mt-1 text-xs text-neutral-500">{p.segmento}</p></div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${estado.className}`}>{estado.label}</span>
                  </div>

                  <div className="mb-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    <Dato label="Custo" value={p.costo_estimado != null ? formatMoney(Number(p.costo_estimado)) : "Pendente"} />
                    <Dato label="Venda" value={p.precio_venta_estimado != null ? formatMoney(Number(p.precio_venta_estimado)) : "Pendente"} />
                    <Dato label="Concorrência" value={p.precio_competencia != null ? formatMoney(Number(p.precio_competencia)) : "Pendente"} />
                    <Dato label="Margem bruta estimada" value={margem != null ? formatMoney(margem) : "Pendente"} />
                  </div>

                  <div className="flex flex-wrap items-end justify-between gap-4 border-t border-neutral-900 pt-4">
                    <div className="max-w-2xl"><p className="mb-1 text-xs uppercase tracking-wider text-neutral-600">Próximo passo</p><p className="text-sm text-neutral-300">{p.proximo_passo || "Definir a próxima verificação."}</p></div>
                    <Link href={`/productos/sugestoes/${p.id}`} className="shrink-0 rounded-md border border-neutral-700 px-3 py-2 text-sm font-medium hover:bg-neutral-950">Editar →</Link>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
        {!propostas?.length && <div className="rounded-xl border border-neutral-800 p-8 text-center text-sm text-neutral-500">Ainda não há sugestões.</div>}
      </div>
    </main>
  );
}

function Dato({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs text-neutral-500">{label}</p><p className="mt-1 font-medium">{value}</p></div>;
}
