import Retry from "../_components/retry";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import Workspace from "../_components/workspace";

export default async function CommercialProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ modo?: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const { modo } = await searchParams;
  const supabase = await createClient();
  const { data: product, error } = await supabase.from("productos")
    .select("id, nombre, imagen_url, precio").eq("id", id).eq("activo", true).maybeSingle();
  if (error) return <main className="mx-auto w-full max-w-6xl px-6 py-10"><p role="alert">Não foi possível carregar a apresentação.</p><Retry /><Link href="/catalogo" className="underline">Voltar ao catálogo</Link></main>;
  if (!product) notFound();
  return <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-8 sm:px-8"><Workspace key={id} product={product} userId={user.id} initialMode={modo ?? ""} /></main>;
}
