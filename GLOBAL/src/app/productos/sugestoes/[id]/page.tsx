import { notFound, redirect } from "next/navigation";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import AnaliseForm from "./form";

export default async function AnaliseSugestaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { data: proposta } = await supabase
    .from("propuestas_productos")
    .select("id, nombre_producto, segmento, link_proveedor, costo_estimado, precio_venta_estimado, precio_competencia, notas, estado, nivel_evidencia, imagem_referencias, proximo_passo, producto_id")
    .eq("id", id)
    .single();

  if (!proposta) notFound();

  return <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-8 sm:px-6 sm:py-10"><AnaliseForm proposta={proposta} /></main>;
}
