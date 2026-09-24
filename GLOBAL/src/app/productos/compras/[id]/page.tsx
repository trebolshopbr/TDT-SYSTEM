import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import LoadError from "../../_components/load-error";
import PurchaseForm from "../form";
import { parseLot } from "../model";

export default async function PurchasePage({ params }: { params: Promise<{ id: string }> }) {
  if (!await getSessionUser()) redirect("/login");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = await createClient();
  const [row, products, suppliers] = await Promise.all([
    db.from("compras_lotes").select("id, producto_id, datos, revision").eq("id", id).maybeSingle(),
    db.from("productos").select("id, nombre").order("nombre"),
    db.from("fornecedores").select("id,nome").order("nome"),
  ]);
  if (row.error || products.error || suppliers.error) return <LoadError title="Compra" />;
  if (!row.data) notFound();
  const lot = parseLot(row.data.datos);
  if (!lot) return <LoadError title="Compra indisponível para edição" />;
  return <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10"><Link href="/productos/compras" className="text-sm text-neutral-400">← Compras e custos</Link><header className="my-8"><h1 className="text-3xl font-semibold">Editar compra</h1><p className="mt-3 text-sm text-neutral-400">Registro compartilhado · mantenha os comprovantes junto aos valores.</p></header><PurchaseForm suppliers={suppliers.data ?? []} key={`${id}:${row.data.revision}`} products={products.data ?? []} initial={lot} initialProduct={row.data.producto_id} initialRevision={row.data.revision} lotId={id} available /></main>;
}
