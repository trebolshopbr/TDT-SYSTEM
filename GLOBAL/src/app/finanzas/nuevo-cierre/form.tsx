"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NuevoCierreForm({ userId }: { userId: string }) {
  const router = useRouter();
  const supabase = createClient();

  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [efectivoInicial, setEfectivoInicial] = useState("");
  const [efectivoFinal, setEfectivoFinal] = useState("");
  const [totalVentas, setTotalVentas] = useState("");
  const [totalGastos, setTotalGastos] = useState("");
  const [notas, setNotas] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.from("cierres_caja").insert({
      fecha,
      efectivo_inicial: Number(efectivoInicial) || 0,
      efectivo_final: Number(efectivoFinal) || 0,
      total_ventas: Number(totalVentas) || 0,
      total_gastos: Number(totalGastos) || 0,
      notas: notas || null,
      registrado_por: userId,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/finanzas");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-neutral-800 bg-black p-6"
    >
      <label className="mb-3 block text-sm">
        <span className="mb-1 block text-neutral-300">Data</span>
        <input
          type="date"
          required
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="w-full rounded-md border border-neutral-700 px-3 py-2 text-sm outline-none focus:border-white"
        />
      </label>

      <div className="mb-3 grid grid-cols-2 gap-3">
        <label className="block text-sm">
          <span className="mb-1 block text-neutral-300">Caixa inicial</span>
          <input
            type="number"
            step="0.01"
            value={efectivoInicial}
            onChange={(e) => setEfectivoInicial(e.target.value)}
            className="w-full rounded-md border border-neutral-700 px-3 py-2 text-sm outline-none focus:border-white"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-neutral-300">Caixa final</span>
          <input
            type="number"
            step="0.01"
            required
            value={efectivoFinal}
            onChange={(e) => setEfectivoFinal(e.target.value)}
            className="w-full rounded-md border border-neutral-700 px-3 py-2 text-sm outline-none focus:border-white"
          />
        </label>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3">
        <label className="block text-sm">
          <span className="mb-1 block text-neutral-300">Total de vendas</span>
          <input
            type="number"
            step="0.01"
            value={totalVentas}
            onChange={(e) => setTotalVentas(e.target.value)}
            className="w-full rounded-md border border-neutral-700 px-3 py-2 text-sm outline-none focus:border-white"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-neutral-300">Total de despesas</span>
          <input
            type="number"
            step="0.01"
            value={totalGastos}
            onChange={(e) => setTotalGastos(e.target.value)}
            className="w-full rounded-md border border-neutral-700 px-3 py-2 text-sm outline-none focus:border-white"
          />
        </label>
      </div>

      <label className="mb-4 block text-sm">
        <span className="mb-1 block text-neutral-300">Observações (opcional)</span>
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-neutral-700 px-3 py-2 text-sm outline-none focus:border-white"
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
        className="w-full rounded-md bg-white px-3 py-2 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:opacity-50"
      >
        {loading ? "Salvando…" : "Salvar fechamento"}
      </button>
    </form>
  );
}
