import { redirect } from "next/navigation";
import { createClient, getSessionUser } from "@/lib/supabase/server";

export default async function SociosPage() {
  const supabase = await createClient();
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  const { data: me } = await supabase
    .from("profiles")
    .select("rol")
    .eq("id", user.id)
    .single();

  if (me?.rol !== "admin") {
    redirect("/");
  }

  const { data: socios } = await supabase
    .from("profiles")
    .select("id, nombre_completo, email, empresa, rol, activo, created_at")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <h1 className="mb-1 text-2xl font-semibold">Sócios</h1>
      <p className="mb-8 text-sm text-neutral-400">
        Gestão de sócios registrados na GLOBAL
      </p>

      <div className="overflow-hidden rounded-xl border border-neutral-800 bg-black">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-800 bg-neutral-950 text-neutral-400">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">E-mail</th>
              <th className="px-4 py-3 font-medium">Empresa</th>
              <th className="px-4 py-3 font-medium">Função</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {socios?.map((s) => (
              <tr key={s.id} className="border-b border-neutral-900 last:border-0">
                <td className="px-4 py-3">{s.nombre_completo}</td>
                <td className="px-4 py-3 text-neutral-300">{s.email}</td>
                <td className="px-4 py-3 text-neutral-300">
                  {s.empresa ?? "—"}
                </td>
                <td className="px-4 py-3">{s.rol === "admin" ? "Admin" : "Sócio"}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      s.activo
                        ? "rounded-full bg-green-950 px-2 py-0.5 text-xs text-green-400"
                        : "rounded-full bg-neutral-900 px-2 py-0.5 text-xs text-neutral-400"
                    }
                  >
                    {s.activo ? "Ativo" : "Inativo"}
                  </span>
                </td>
              </tr>
            ))}
            {!socios?.length && (
              <tr>
                <td className="px-4 py-6 text-center text-neutral-500" colSpan={5}>
                  Ainda não há sócios registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
