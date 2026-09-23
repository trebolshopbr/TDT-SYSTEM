import { readdir } from "node:fs/promises";
import { join } from "node:path";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";

export default async function ImagensHistoricasPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const pasta = join(process.cwd(), "public", "products");
  const imagens = (await readdir(pasta)).filter((nome) => /\.(webp|jpe?g|png)$/i.test(nome)).sort();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">Referência histórica</p>
          <h1 className="mb-2 text-2xl font-semibold">Imagens de produtos</h1>
          <p className="max-w-2xl text-sm text-neutral-400">
            Arquivo visual anterior. As imagens ainda não estão associadas a sugestões ou SKUs confirmados.
          </p>
        </div>
        <Link href="/productos/sugestoes" className="rounded-md border border-neutral-700 px-3 py-2 text-sm font-medium hover:bg-neutral-950">
          ← Sugestões
        </Link>
      </div>

      <div className="mb-5 text-sm text-neutral-500">{imagens.length} imagens para classificar</div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {imagens.map((nome) => (
          <figure key={nome} className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950">
            <div className="relative aspect-square bg-white">
              <Image src={`/products/${nome}`} alt="Produto histórico sem classificação" fill sizes="(max-width: 640px) 50vw, 20vw" className="object-contain" />
            </div>
            <figcaption className="truncate px-3 py-2 font-mono text-[10px] text-neutral-500" title={nome}>{nome.slice(0, 12)}</figcaption>
          </figure>
        ))}
      </div>
    </main>
  );
}
