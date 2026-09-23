import { redirect } from "next/navigation";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import NuevoGastoForm from "./form";

export default async function NuevoGastoPage() {
  const supabase = await createClient();
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-6 py-10">
      <h1 className="mb-1 text-2xl font-semibold">Registrar despesa</h1>
      <p className="mb-8 text-sm text-neutral-400">
        Registre uma despesa real da empresa
      </p>

      <NuevoGastoForm userId={user.id} />
    </main>
  );
}
