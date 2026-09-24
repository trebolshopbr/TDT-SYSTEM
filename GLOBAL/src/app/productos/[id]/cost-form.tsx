"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import MarginPreview from "../_components/margin-preview";
import { valorPositivo } from "../_lib/valores";

type Produto = {
  id: string; precio: number; costo: number; moneda_costo: string | null;
  costo_original: number | null; tipo_cambio_costo: number | null;
};

export default function CostForm({ producto }: { producto: Produto }) {
  const router = useRouter();
  const [moeda, setMoeda] = useState(producto.moneda_costo === "USD" ? "USD" : "BRL");
  const [brl, setBrl] = useState(producto.costo > 0 ? String(producto.costo) : "");
  const [usd, setUsd] = useState(producto.costo_original ? String(producto.costo_original) : "");
  const [cambio, setCambio] = useState(producto.tipo_cambio_costo ? String(producto.tipo_cambio_costo) : "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const convertido = moeda === "BRL" ? Number(brl) : Math.round(Number(usd) * Number(cambio) * 100) / 100;

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (loading) return;
    if (valorPositivo(convertido) === null || (moeda === "USD" && (valorPositivo(usd) === null || valorPositivo(cambio) === null))) {
      setError("Informe o custo por unidade. Em US$, informe também o câmbio utilizado na compra. Se ainda não souber, deixe para depois.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error: saveError } = await createClient().from("productos").update({
        costo: convertido,
        moneda_costo: moeda,
        costo_original: moeda === "USD" ? Number(usd) : null,
        tipo_cambio_costo: moeda === "USD" ? Number(cambio) : null,
      }).eq("id", producto.id).select("id").single();
      if (saveError) {
        setError("Não foi possível confirmar o salvamento. Verifique sua conexão e, se continuar, peça a TT para conferir seu acesso.");
        return;
      }
      router.push("/productos?pendente=custo&salvo=custo");
      router.refresh();
    } catch {
      setError("Não foi possível confirmar o salvamento. Confira a ficha antes de tentar novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={save} className="rounded-xl border border-neutral-800 bg-black p-5">
      <p className="mb-5 text-sm text-neutral-300">Informe quanto foi pago por uma unidade, com base no comprovante da compra. Se ainda não tiver esse valor, pode deixar para depois.</p>
      <fieldset disabled={loading} className="min-w-0">
        <label className="mb-4 block text-sm">
          <span className="mb-1 block">Moeda da compra</span>
          <select value={moeda} onChange={(e) => setMoeda(e.target.value)} className="w-full rounded-md border border-neutral-700 bg-black px-3 py-2">
            <option value="BRL">Real (R$)</option>
            <option value="USD">Dólar (US$)</option>
          </select>
        </label>
        <label className="mb-4 block text-sm">
          <span className="mb-1 block">Custo por unidade ({moeda === "BRL" ? "R$" : "US$"})</span>
          <input type="number" required min="0.01" step="0.01" value={moeda === "BRL" ? brl : usd} onChange={(e) => moeda === "BRL" ? setBrl(e.target.value) : setUsd(e.target.value)} className="w-full rounded-md border border-neutral-700 bg-black px-3 py-2" />
        </label>
        {moeda === "USD" && <label className="mb-4 block text-sm">
          <span className="mb-1 block">Câmbio da compra (R$ por US$)</span>
          <input type="number" required min="0.0001" step="0.0001" value={cambio} onChange={(e) => setCambio(e.target.value)} className="w-full rounded-md border border-neutral-700 bg-black px-3 py-2" />
        </label>}
        <p className="mb-3 text-sm text-neutral-400">Preço de venda cadastrado: {valorPositivo(producto.precio) === null ? "Pendente" : Number(producto.precio).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
        <MarginPreview preco={String(producto.precio)} custo={convertido} />
        {error && <p role="alert" className="mb-4 text-sm text-red-400">{error}</p>}
        <button type="submit" className="w-full rounded-md bg-white px-3 py-2 text-sm font-medium text-black disabled:opacity-50" disabled={loading}>{loading ? "Salvando…" : "Salvar custo e continuar"}</button>
      </fieldset>
      {!loading && <Link href="/productos?pendente=custo" className="mt-4 block text-center text-sm text-neutral-300 underline">Deixar para depois</Link>}
    </form>
  );
}
