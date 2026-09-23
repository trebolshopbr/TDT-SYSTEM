import Link from "next/link";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import SignOutButton from "@/components/sign-out-button";

export default async function Topbar() {
  const supabase = await createClient();
  const user = await getSessionUser();

  let rol: string | null = null;
  let nombre: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("rol, nombre_completo")
      .eq("id", user.id)
      .single();
    rol = profile?.rol ?? null;
    nombre = profile?.nombre_completo ?? null;
  }

  if (!user) return null;

  return (
    <header className="flex flex-wrap items-center justify-between gap-y-2 border-b border-neutral-800 bg-black px-6 py-4">
      <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <Link href="/" className="shrink-0 whitespace-nowrap font-semibold">
          GLOBAL
        </Link>
        <Link
          href="/"
          className="shrink-0 whitespace-nowrap text-neutral-300 hover:text-white"
        >
          Meu escritório
        </Link>
        {user && (
          <Link
            href="/finanzas"
            className="shrink-0 whitespace-nowrap text-neutral-300 hover:text-white"
          >
            Financeiro
          </Link>
        )}
        {user && (
          <Link
            href="/pedidos"
            className="shrink-0 whitespace-nowrap text-neutral-300 hover:text-white"
          >
            Pedidos
          </Link>
        )}
        {user && (
          <Link
            href="/catalogo"
            className="shrink-0 whitespace-nowrap text-neutral-300 hover:text-white"
          >
            Catálogo
          </Link>
        )}
        {user && (
          <Link
            href="/plataformas"
            className="shrink-0 whitespace-nowrap text-neutral-300 hover:text-white"
          >
            Plataformas
          </Link>
        )}
        {user && (
          <Link
            href="/productos"
            className="shrink-0 whitespace-nowrap text-neutral-300 hover:text-white"
          >
            Produtos
          </Link>
        )}
        {rol === "admin" && (
          <Link
            href="/admin/socios"
            className="shrink-0 whitespace-nowrap text-neutral-300 hover:text-white"
          >
            Sócios
          </Link>
        )}
      </nav>

      {user && (
        <div className="flex shrink-0 items-center gap-4 text-sm">
          <span className="whitespace-nowrap text-neutral-400">
            {nombre ?? user.email}
          </span>
          <SignOutButton />
        </div>
      )}
    </header>
  );
}
