import { redirect } from "next/navigation";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import NuevoPedidoForm from "./form";

export default async function NuevoPedidoPage() {
  const supabase = await createClient();
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: plataformas }, { data: productos }] = await Promise.all([
    supabase.from("plataformas").select("id, nombre, activa").order("nombre"),
    supabase
      .from("productos")
      .select("id, nombre, sku, precio, stock")
      .eq("activo", true)
      .order("nombre"),
  ]);

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-6 py-10">
      <h1 className="mb-1 text-2xl font-semibold">Novo pedido</h1>
      <p className="mb-8 text-sm text-neutral-400">
        Registre um pedido recebido em alguma plataforma
      </p>

      <NuevoPedidoForm
        plataformas={plataformas ?? []}
        productos={productos ?? []}
        userId={user.id}
      />
    </main>
  );
}
