"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const CATEGORIAS: { value: string; label: string }[] = [
  { value: "insumos", label: "Insumos" },
  { value: "envio", label: "Frete" },
  { value: "publicidad", label: "Publicidade" },
  { value: "comisiones", label: "Comissões" },
  { value: "alquiler", label: "Aluguel" },
  { value: "sueldos", label: "Salários" },
  { value: "otro", label: "Outro" },
];

function formatMoney(n: number) {
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

export default function NuevoGastoForm({ userId }: { userId: string }) {
  const router = useRouter();
  const supabase = createClient();

  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [moneda, setMoneda] = useState<"BRL" | "USD">("BRL");
  const [monto, setMonto] = useState("");
  const [valorUsd, setValorUsd] = useState("");
  const [tipoCambio, setTipoCambio] = useState("");
  const [categoria, setCategoria] = useState("otro");
  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const montoCalculadoUsd = (Number(valorUsd) || 0) * (Number(tipoCambio) || 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const montoFinal = moneda === "USD" ? montoCalculadoUsd : Number(monto) || 0;

    const { error } = await supabase.from("gastos").insert({
      fecha,
      monto: montoFinal,
      moneda,
      monto_original: moneda === "USD" ? Number(valorUsd) || 0 : null,
      tipo_cambio: moneda === "USD" ? Number(tipoCambio) || 0 : null,
      categoria,
      descripcion: descripcion || null,
      registrado_por: userId,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/finanzas/gastos");
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

      <div className="mb-3 flex gap-1 rounded-lg bg-neutral-900 p-1">
        {(["BRL", "USD"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMoneda(m)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
              moneda === m
                ? "bg-black text-white shadow-sm"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            {m === "BRL" ? "Pago em reais" : "Pago em dólares"}
          </button>
        ))}
      </div>

      {moneda === "BRL" ? (
        <label className="mb-3 block text-sm">
          <span className="mb-1 block text-neutral-300">Valor (R$)</span>
          <input
            type="number"
            step="0.01"
            min="0"
            required
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="w-full rounded-md border border-neutral-700 px-3 py-2 text-sm outline-none focus:border-white"
          />
        </label>
      ) : (
        <>
          <div className="mb-3 grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="mb-1 block text-neutral-300">Valor (US$)</span>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={valorUsd}
                onChange={(e) => setValorUsd(e.target.value)}
                className="w-full rounded-md border border-neutral-700 px-3 py-2 text-sm outline-none focus:border-white"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-neutral-300">
                Câmbio do dia
              </span>
              <input
                type="number"
                step="0.0001"
                min="0"
                required
                value={tipoCambio}
                onChange={(e) => setTipoCambio(e.target.value)}
                placeholder="Ex: 5.11"
                className="w-full rounded-md border border-neutral-700 px-3 py-2 text-sm outline-none focus:border-white"
              />
            </label>
          </div>
          <p className="mb-3 rounded-md bg-neutral-950 px-3 py-2 text-sm">
            <span className="text-neutral-400">Equivale a: </span>
            <span className="font-medium">{formatMoney(montoCalculadoUsd)}</span>
          </p>
        </>
      )}

      <label className="mb-3 block text-sm">
        <span className="mb-1 block text-neutral-300">Categoria</span>
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="w-full rounded-md border border-neutral-700 px-3 py-2 text-sm outline-none focus:border-white"
        >
          {CATEGORIAS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </label>

      <label className="mb-4 block text-sm">
        <span className="mb-1 block text-neutral-300">
          Descrição (opcional)
        </span>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
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
        {loading ? "Salvando…" : "Salvar despesa"}
      </button>
    </form>
  );
}
