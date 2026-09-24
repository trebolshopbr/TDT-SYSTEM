"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

export default function Retry() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <button disabled={pending} onClick={() => startTransition(() => router.refresh())} className="mr-5 mt-4 inline-block text-sm underline disabled:opacity-50">{pending ? "Carregando…" : "Tentar novamente"}</button>;
}
