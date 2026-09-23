import { notFound, redirect } from "next/navigation";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import EditarProductoForm from "./form";

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: producto }, { data: plataformas }] = await Promise.all([
    supabase
      .from("productos")
      .select(
        "id, nombre, plataforma_id, sku, precio, costo, moneda_costo, costo_original, tipo_cambio_costo, stock, activo, notas, imagen_url",
      )
      .eq("id", id)
      .single(),
    supabase.from("plataformas").select("id, nombre, activa").order("nombre"),
  ]);

  if (!producto) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-6 py-10">
      <h1 className="mb-1 text-2xl font-semibold">Editar producto</h1>
      <p className="mb-8 text-sm text-neutral-400">{producto.nombre}</p>

      <EditarProductoForm
        producto={producto}
        plataformas={plataformas ?? []}
        userId={user.id}
      />
    </main>
  );
}
