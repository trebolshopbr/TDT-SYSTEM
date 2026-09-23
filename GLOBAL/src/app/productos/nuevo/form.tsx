"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Plataforma = { id: string; nombre: string; activa: boolean };

export default function NuevoProductoForm({
  userId,
  plataformas,
}: {
  userId: string;
  plataformas: Plataforma[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const [nombre, setNombre] = useState("");
  const [plataformaId, setPlataformaId] = useState("");
  const [sku, setSku] = useState("");
  const [precio, setPrecio] = useState("");
  const [monedaCosto, setMonedaCosto] = useState<"BRL" | "USD">("BRL");
  const [costo, setCosto] = useState("");
  const [costoUsd, setCostoUsd] = useState("");
  const [tipoCambioCosto, setTipoCambioCosto] = useState("");
  const [stock, setStock] = useState("");
  const [notas, setNotas] = useState("");
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleImagenChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImagenFile(file);
    setImagenPreview(file ? URL.createObjectURL(file) : null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let imagen_url: string | null = null;

    if (imagenFile) {
      const ext = imagenFile.name.split(".").pop();
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("productos")
        .upload(path, imagenFile);

      if (uploadError) {
        setLoading(false);
        setError(`Não foi possível enviar a imagem: ${uploadError.message}`);
        return;
      }

      imagen_url = supabase.storage.from("productos").getPublicUrl(path)
        .data.publicUrl;
    }

    const costoFinal =
      monedaCosto === "USD"
        ? (Number(costoUsd) || 0) * (Number(tipoCambioCosto) || 0)
        : Number(costo) || 0;

    const { error } = await supabase.from("productos").insert({
      nombre,
      plataforma_id: plataformaId || null,
      sku: sku || null,
      precio: Number(precio) || 0,
      costo: costoFinal,
      moneda_costo: monedaCosto,
      costo_original: monedaCosto === "USD" ? Number(costoUsd) || 0 : null,
      tipo_cambio_costo: monedaCosto === "USD" ? Number(tipoCambioCosto) || 0 : null,
      stock: Number(stock) || 0,
      notas: notas || null,
      imagen_url,
      registrado_por: userId,
    });

    setLoading(false);

    if (error) {
      setError(
        error.message.includes("productos_sku_key")
          ? "Já existe um produto com esse SKU."
          : error.message,
      );
      return;
    }

    router.push("/productos");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-neutral-800 bg-black p-6"
    >
      <label className="mb-4 block text-sm">
        <span className="mb-1 block text-neutral-300">Imagem (opcional)</span>
        {imagenPreview && (
          <Image
            src={imagenPreview}
            alt="Pré-visualização"
            width={96}
            height={96}
            unoptimized
            className="mb-2 h-24 w-24 rounded-md border border-neutral-800 object-cover"
          />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={handleImagenChange}
          className="w-full rounded-md border border-neutral-700 px-3 py-2 text-sm outline-none file:mr-3 file:rounded file:border-0 file:bg-neutral-900 file:px-2 file:py-1 file:text-xs focus:border-white"
        />
      </label>

      <label className="mb-3 block text-sm">
        <span className="mb-1 block text-neutral-300">Nome</span>
        <input
          type="text"
          required
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full rounded-md border border-neutral-700 px-3 py-2 text-sm outline-none focus:border-white"
        />
      </label>

      <label className="mb-3 block text-sm">
        <span className="mb-1 block text-neutral-300">Canal de venda (opcional)</span>
        <select
          value={plataformaId}
          onChange={(e) => setPlataformaId(e.target.value)}
          className="w-full rounded-md border border-neutral-700 px-3 py-2 text-sm outline-none focus:border-white"
        >
          <option value="">— Não especificado —</option>
          {plataformas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
              {!p.activa ? " (inativa)" : ""}
            </option>
          ))}
        </select>
      </label>

      <label className="mb-3 block text-sm">
        <span className="mb-1 block text-neutral-300">SKU (opcional)</span>
        <input
          type="text"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          className="w-full rounded-md border border-neutral-700 px-3 py-2 text-sm outline-none focus:border-white"
        />
      </label>

      <label className="mb-3 block text-sm">
        <span className="mb-1 block text-neutral-300">Preço de venda</span>
        <input
          type="number"
          step="0.01"
          min="0"
          required
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
          className="w-full rounded-md border border-neutral-700 px-3 py-2 text-sm outline-none focus:border-white"
        />
      </label>

      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm text-neutral-300">Custo de compra (opcional)</span>
        <div className="flex gap-1 rounded-lg bg-neutral-900 p-1">
          {(["BRL", "USD"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMonedaCosto(m)}
              className={`rounded-md px-2 py-1 text-xs font-medium transition ${
                monedaCosto === m
                  ? "bg-black text-white shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {monedaCosto === "BRL" ? (
        <label className="mb-3 block text-sm">
          <input
            type="number"
            step="0.01"
            min="0"
            value={costo}
            onChange={(e) => setCosto(e.target.value)}
            className="w-full rounded-md border border-neutral-700 px-3 py-2 text-sm outline-none focus:border-white"
          />
        </label>
      ) : (
        <div className="mb-3 grid grid-cols-2 gap-3">
          <input
            type="number"
            step="0.01"
            min="0"
            value={costoUsd}
            onChange={(e) => setCostoUsd(e.target.value)}
            placeholder="US$"
            className="w-full rounded-md border border-neutral-700 px-3 py-2 text-sm outline-none focus:border-white"
          />
          <input
            type="number"
            step="0.0001"
            min="0"
            value={tipoCambioCosto}
            onChange={(e) => setTipoCambioCosto(e.target.value)}
            placeholder="Câmbio (ex: 5.11)"
            className="w-full rounded-md border border-neutral-700 px-3 py-2 text-sm outline-none focus:border-white"
          />
        </div>
      )}

      <label className="mb-3 block text-sm">
        <span className="mb-1 block text-neutral-300">Estoque inicial</span>
        <input
          type="number"
          min="0"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          className="w-full rounded-md border border-neutral-700 px-3 py-2 text-sm outline-none focus:border-white"
        />
      </label>

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
        {loading ? "Salvando…" : "Salvar produto"}
      </button>
    </form>
  );
}
