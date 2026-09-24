import Link from "next/link";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import SignOutButton from "@/components/sign-out-button";
import NavLinks from "@/components/nav-links";

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
    <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-y-2 border-b border-neutral-800/80 bg-black/90 px-4 py-2.5 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 pr-2 text-sm font-semibold tracking-wider text-white hover:opacity-90"
        >
          <span className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] font-bold text-black">
            TDT
          </span>
          <span>GLOBAL</span>
        </Link>
        <NavLinks rol={rol} />
      </div>

      <div className="flex shrink-0 items-center gap-3 text-xs">
        <div className="hidden flex-col text-right sm:flex">
          <span className="max-w-[160px] truncate font-medium text-white">
            {nombre ?? user.email}
          </span>
          {rol && (
            <span className="text-[10px] uppercase tracking-wider text-neutral-400">
              {rol === "admin" ? "Admin" : "Sócio"}
            </span>
          )}
        </div>
        <SignOutButton />
      </div>
    </header>
  );
}
