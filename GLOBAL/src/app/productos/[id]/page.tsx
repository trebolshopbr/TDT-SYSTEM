import { notFound, redirect } from "next/navigation";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import Link from "next/link";
import LoadError from "../_components/load-error";
import EditarProductoForm from "./form";
import CostForm from "./cost-form";

export default async function EditarProductoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ completar?: string }>;
}) {
  const { id } = await params;
  const { completar } = await searchParams;
  const somenteCusto = completar === "custo";
  const supabase = await createClient();
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: producto, error: productoError }, { data: plataformas, error: plataformasError }] = await Promise.all([
    supabase
      .from("productos")
      .select(
        "id, nombre, plataforma_id, sku, precio, costo, moneda_costo, costo_original, tipo_cambio_costo, stock, activo, notas, imagen_url",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.from("plataformas").select("id, nombre, activa").order("nombre"),
  ]);

  if (productoError || plataformasError) return <LoadError title="Editar produto" />;

  if (!producto) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-6 py-10">
      <Link href={somenteCusto ? "/productos?pendente=custo" : "/productos"} className="mb-4 inline-block text-sm text-neutral-400 hover:text-white">{somenteCusto ? "← Custos pendentes" : "← Produtos"}</Link>
      <h1 className="mb-1 text-2xl font-semibold">{somenteCusto ? "Completar custo" : "Editar produto"}</h1>
      <p className="mb-8 text-sm text-neutral-400">{producto.nombre}</p>

      {somenteCusto ? <CostForm producto={producto} /> : <EditarProductoForm
        producto={producto}
        plataformas={plataformas ?? []}
        userId={user.id}
      />}
    </main>
  );
}
