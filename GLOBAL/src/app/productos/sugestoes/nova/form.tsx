"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NovaPropostaForm({ userId }: { userId: string }) {
  const router = useRouter();
  const supabase = createClient();

  const [nombreProducto, setNombreProducto] = useState("");
  const [segmento, setSegmento] = useState("");
  const [linkProveedor, setLinkProveedor] = useState("");
  const [costoEstimado, setCostoEstimado] = useState("");
  const [precioVentaEstimado, setPrecioVentaEstimado] = useState("");
  const [precioCompetencia, setPrecioCompetencia] = useState("");
  const [notas, setNotas] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.from("propuestas_productos").insert({
      nombre_producto: nombreProducto,
      segmento,
      link_proveedor: linkProveedor || null,
      costo_estimado: costoEstimado ? Number(costoEstimado) : null,
      precio_venta_estimado: precioVentaEstimado ? Number(precioVentaEstimado) : null,
      precio_competencia: precioCompetencia ? Number(precioCompetencia) : null,
      notas: notas || null,
      propuesto_por: userId,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/productos/sugestoes");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-neutral-800 bg-black p-6"
    >
      <label className="mb-3 block text-sm">
        <span className="mb-1 block text-neutral-300">Nome do produto</span>
        <input
          type="text"
          required
          value={nombreProducto}
          onChange={(e) => setNombreProducto(e.target.value)}
          className="w-full rounded-md border border-neutral-700 px-3 py-2 text-sm outline-none focus:border-white"
        />
      </label>

      <label className="mb-3 block text-sm">
        <span className="mb-1 block text-neutral-300">Segmento</span>
        <input
          type="text"
          required
          value={segmento}
          onChange={(e) => setSegmento(e.target.value)}
          placeholder="Ex: Eletrônicos, Casa, Beleza…"
          className="w-full rounded-md border border-neutral-700 px-3 py-2 text-sm outline-none focus:border-white"
        />
      </label>

      <label className="mb-3 block text-sm">
        <span className="mb-1 block text-neutral-300">
          Link do fornecedor (opcional)
        </span>
        <input
          type="url"
          value={linkProveedor}
          onChange={(e) => setLinkProveedor(e.target.value)}
          placeholder="https://…"
          className="w-full rounded-md border border-neutral-700 px-3 py-2 text-sm outline-none focus:border-white"
        />
      </label>

      <div className="mb-3 grid grid-cols-2 gap-3">
        <label className="block text-sm">
          <span className="mb-1 block text-neutral-300">
            Custo de compra (opcional)
          </span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={costoEstimado}
            onChange={(e) => setCostoEstimado(e.target.value)}
            className="w-full rounded-md border border-neutral-700 px-3 py-2 text-sm outline-none focus:border-white"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-neutral-300">
            Preço de venda sugerido (opcional)
          </span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={precioVentaEstimado}
            onChange={(e) => setPrecioVentaEstimado(e.target.value)}
            className="w-full rounded-md border border-neutral-700 px-3 py-2 text-sm outline-none focus:border-white"
          />
        </label>
      </div>

      <label className="mb-3 block text-sm">
        <span className="mb-1 block text-neutral-300">
          Outros vendem a (opcional)
        </span>
        <input
          type="number"
          step="0.01"
          min="0"
          value={precioCompetencia}
          onChange={(e) => setPrecioCompetencia(e.target.value)}
          placeholder="Preço que a concorrência está cobrando"
          className="w-full rounded-md border border-neutral-700 px-3 py-2 text-sm outline-none focus:border-white"
        />
      </label>

      <label className="mb-4 block text-sm">
        <span className="mb-1 block text-neutral-300">
          Observações (opcional)
        </span>
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={3}
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
        {loading ? "Salvando…" : "Salvar sugestão"}
      </button>
    </form>
  );
}
