"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="rounded-md border border-neutral-700 px-3 py-1.5 text-neutral-300 transition hover:bg-neutral-900"
    >
      Sair
    </button>
  );
}
