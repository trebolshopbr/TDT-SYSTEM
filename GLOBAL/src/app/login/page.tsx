"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "E-mail ou senha incorretos."
          : error.message,
      );
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-[calc(100vh-60px)] flex-1 items-center justify-center bg-black p-6 text-white">
      <div className="w-full max-w-sm">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-neutral-800/90 bg-neutral-950/70 p-8 shadow-2xl backdrop-blur"
        >
          {/* Brand Lockup */}
          <div className="mb-6 flex flex-col items-center text-center">
            <svg
              className="h-7 w-auto text-white"
              viewBox="0 0 830 259"
              fill="currentColor"
              role="img"
              aria-label="TDT"
            >
              <path d="M0 0H270V52H0Z" />
              <path d="M108 52L162 89V259H108Z" />
              <path d="M291 0H460A100 100 0 0 1 560 100V158A100 100 0 0 1 460 258H291V89H347V201H457A44 44 0 0 0 501 157V96A44 44 0 0 0 457 52H291Z" />
              <path d="M538 0H830V52H578A127 127 0 0 0 538 0Z" />
              <path d="M669 52L723 89V259H669Z" />
            </svg>
            <span className="mt-2 pl-[0.35em] text-xs font-semibold uppercase tracking-[0.35em] text-neutral-200">
              GLOBAL
            </span>
            <p className="mt-2 text-xs text-neutral-400">
              Escritório virtual — faça login para entrar
            </p>
          </div>

          <label className="mb-3 block text-sm">
            <span className="mb-1 block text-xs font-medium text-neutral-400">
              E-mail
            </span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-neutral-800 bg-black px-3 py-2 text-sm text-white outline-none transition focus:border-neutral-400"
              placeholder="seu@email.com"
            />
          </label>

          <label className="mb-5 block text-sm">
            <span className="mb-1 block text-xs font-medium text-neutral-400">
              Senha
            </span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-neutral-800 bg-black px-3 py-2 text-sm text-white outline-none transition focus:border-neutral-400"
              placeholder="••••••••"
            />
          </label>

          {error && (
            <div
              className="mb-4 rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-xs text-red-300"
              role="alert"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-white py-2.5 text-sm font-semibold text-black transition hover:bg-neutral-200 active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? "Entrando…" : "Entrar no escritório →"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-xs text-neutral-500 transition hover:text-neutral-300"
          >
            ← Voltar para o início
          </Link>
        </div>
      </div>
    </main>
  );
}
