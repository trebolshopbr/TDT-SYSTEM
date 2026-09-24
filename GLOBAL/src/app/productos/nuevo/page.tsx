import { redirect } from "next/navigation";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import Link from "next/link";
import LoadError from "../_components/load-error";
import NuevoProductoForm from "./form";

export default async function NuevoProductoPage() {
  const supabase = await createClient();
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  const { data: plataformas, error } = await supabase
    .from("plataformas")
    .select("id, nombre, activa")
    .order("nombre");

  if (error) return <LoadError title="Novo produto" />;

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-6 py-10">
      <Link href="/productos" className="mb-4 inline-block text-sm text-neutral-400 hover:text-white">← Produtos</Link>
      <h1 className="mb-1 text-2xl font-semibold">Novo produto</h1>
      <p className="mb-8 text-sm text-neutral-400">
        Adicione um produto ao catálogo
      </p>

      <NuevoProductoForm userId={user.id} plataformas={plataformas ?? []} />
    </main>
  );
}
