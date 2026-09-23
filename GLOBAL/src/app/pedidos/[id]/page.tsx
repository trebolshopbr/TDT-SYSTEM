import { notFound, redirect } from "next/navigation";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import EditarPedidoForm from "./form";

export default async function EditarPedidoPage({
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

  const [{ data: pedido }, { data: plataformas }, { data: productos }] =
    await Promise.all([
      supabase.from("pedidos").select("*").eq("id", id).single(),
      supabase.from("plataformas").select("id, nombre, activa").order("nombre"),
      supabase
        .from("productos")
        .select("id, nombre, sku, precio, stock")
        .order("nombre"),
    ]);

  if (!pedido) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-6 py-10">
      <h1 className="mb-1 text-2xl font-semibold">Editar pedido</h1>
      <p className="mb-8 text-sm text-neutral-400">{pedido.cliente_nombre}</p>

      <EditarPedidoForm
        pedido={pedido}
        plataformas={plataformas ?? []}
        productos={productos ?? []}
      />
    </main>
  );
}
