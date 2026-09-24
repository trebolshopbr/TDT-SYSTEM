import { redirect } from "next/navigation";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import Retry from "./_components/retry";
import Explorer from "./_components/explorer";

export default async function CatalogoPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const supabase = await createClient();
  const { data: products, error } = await supabase.from("productos")
    .select("id, nombre, imagen_url, precio").eq("activo", true).order("nombre");
  return <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-8 sm:px-8 sm:py-10">
    {error ? <div role="alert"><h1 className="mb-5 text-3xl font-semibold">Catálogo</h1><p>Não foi possível carregar a seleção.</p><Retry /></div> : <Explorer products={products ?? []} userId={user.id} />}
  </main>;
}
