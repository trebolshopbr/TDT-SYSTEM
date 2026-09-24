"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoadError({ title }: { title: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [attempted, setAttempted] = useState(false);
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <h1 className="mb-3 text-2xl font-semibold">{title}</h1>
      <p role="alert" className="mb-4 text-sm text-neutral-300">
        Não foi possível carregar os dados. Verifique sua conexão e tente novamente.
        {attempted && !pending ? " Se o problema continuar, tente mais tarde." : ""}
      </p>
      <div className="flex flex-wrap gap-4">
        <button disabled={pending} onClick={() => { setAttempted(true); startTransition(() => router.refresh()); }} className="rounded-md bg-white px-3 py-2 text-sm text-black disabled:opacity-50">
          {pending ? "Carregando…" : "Tentar novamente"}
        </button>
        <Link href="/productos" className="px-3 py-2 text-sm underline">Voltar a Produtos</Link>
      </div>
    </main>
  );
}
