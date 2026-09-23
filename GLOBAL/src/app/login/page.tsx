"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
    <main className="flex flex-1 items-center justify-center bg-black p-6 text-white">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm border border-neutral-800 bg-black p-8"
      >
        <h1 className="mb-1 text-xl font-semibold">GLOBAL</h1>
        <p className="mb-6 text-sm text-neutral-400">
          Escritório virtual — faça login
        </p>

        <label className="mb-3 block text-sm">
          <span className="mb-1 block text-neutral-400">E-mail</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-neutral-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-white"
          />
        </label>

        <label className="mb-4 block text-sm">
          <span className="mb-1 block text-neutral-400">Senha</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-neutral-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-white"
          />
        </label>

        {error && (
          <p className="mb-4 text-sm text-red-400" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full border border-white bg-black px-3 py-2 text-sm font-medium text-white transition hover:bg-white hover:text-black disabled:opacity-50"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
