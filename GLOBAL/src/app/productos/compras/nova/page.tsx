import { randomUUID } from "node:crypto";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import LoadError from "../../_components/load-error";
import PurchaseForm from "../form";
import { schemaMissing } from "../model";

export default async function NewPurchasePage() {
  if (!await getSessionUser()) redirect("/login");
  const db = await createClient();
  const [products, schema, suppliers] = await Promise.all([
    db.from("productos").select("id, nombre").order("nombre"),
    db.from("compras_lotes").select("id").limit(1),
    db.from("fornecedores").select("id,nome").order("nome"),
  ]);
  if (suppliers.error || products.error || (schema.error && !schemaMissing(schema.error))) return <LoadError title="Registrar compra" />;
  return <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10"><Link href="/productos/compras" className="text-sm text-neutral-400">← Compras e custos</Link><header className="my-8"><h1 className="text-3xl font-semibold">Registrar compra</h1></header>{!products.data?.length && <p className="mb-6 text-sm">Cadastre um produto antes de registrar sua compra.</p>}<PurchaseForm suppliers={suppliers.data ?? []} products={products.data ?? []} available={!schema.error} lotId={randomUUID()} /></main>;
}
