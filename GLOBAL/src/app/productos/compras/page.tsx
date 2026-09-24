import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import LoadError from "../_components/load-error";
import { calculate, money, parseLot, schemaMissing } from "./model";

export default async function PurchasesPage() {
  if (!await getSessionUser()) redirect("/login");
  const db = await createClient();
  const { data, error } = await db.from("compras_lotes").select("id, datos, updated_at, productos(nombre)").order("updated_at", { ascending: false });
  if (error && !schemaMissing(error)) return <LoadError title="Compras e custos" />;
  return <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
    <Link href="/productos" className="text-sm text-neutral-400 hover:text-white">← Produtos</Link>
    <header className="my-8 flex flex-wrap items-end justify-between gap-5"><div><h1 className="text-3xl font-semibold">Compras e custos</h1></div><Link href="/productos/compras/nova" className="rounded-lg bg-white px-5 py-3 text-sm font-medium text-black">+ Registrar compra</Link></header>
    {error ? <section className="rounded-xl border border-neutral-700 p-6"><h2 className="text-lg font-medium">Compras indisponíveis</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-400">Não é possível salvar compras no momento.</p><Link href="/productos/compras/nova" className="mt-5 inline-block text-sm underline underline-offset-4">Ver formulário →</Link></section> : !data?.length ? <section className="rounded-xl border border-dashed border-neutral-700 p-8"><h2 className="text-lg font-medium">Nenhuma compra registrada</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-400">Registre uma compra para acompanhar os custos da compra.</p></section> : <section aria-label="Compras registradas" className="divide-y divide-neutral-800">{data.map(row => {
      const lot = parseLot(row.datos); const calculation = lot ? calculate(lot) : null;
      const product = row.productos as unknown as { nombre: string } | null;
      return <Link key={row.id} href={`/productos/compras/${row.id}`} className="flex flex-wrap items-center justify-between gap-4 py-6 hover:bg-neutral-950"><div><p className="font-medium">{product?.nombre ?? "Compra"}</p><p className="mt-1 text-sm text-neutral-400">{lot?.supplier || "Fornecedor pendente"}</p><p className="mt-2 text-xs text-neutral-500">{calculation?.complete ? "Dados preenchidos · aguardam conferência" : "Custo pendente"} · Atualizado em {new Date(row.updated_at).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}</p></div><div><p className="text-lg">{money(calculation?.unit ?? null)}</p><p className="text-xs text-neutral-400">por unidade →</p></div></Link>;
    })}</section>}

  </main>;
}
