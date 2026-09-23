"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Plataforma = { id: string; nombre: string; activa: boolean };

type Producto = {
  id: string;
  nombre: string;
  plataforma_id: string | null;
  sku: string | null;
  precio: number;
  costo: number;
  moneda_costo: "BRL" | "USD" | null;
  costo_original: number | null;
  tipo_cambio_costo: number | null;
  stock: number;
  activo: boolean;
  notas: string | null;
  imagen_url: string | null;
};

export default function EditarProductoForm({
  producto,
  plataformas,
  userId,
}: {
  producto: Producto;
  plataformas: Plataforma[];
  userId: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [nombre, setNombre] = useState(producto.nombre);
  const [plataformaId, setPlataformaId] = useState(producto.plataforma_id ?? "");
  const [sku, setSku] = useState(producto.sku ?? "");
  const [precio, setPrecio] = useState(String(producto.precio));
  const [monedaCosto, setMonedaCosto] = useState<"BRL" | "USD">(
    producto.moneda_costo === "USD" ? "USD" : "BRL",
  );
  const [costo, setCosto] = useState(String(producto.costo));
  const [costoUsd, setCostoUsd] = useState(
    producto.costo_original ? String(producto.costo_original) : "",
  );
  const [tipoCambioCosto, setTipoCambioCosto] = useState(
    producto.tipo_cambio_costo ? String(producto.tipo_cambio_costo) : "",
  );
  const [stock, setStock] = useState(String(producto.stock));
  const [activo, setActivo] = useState(producto.activo);
  const [notas, setNotas] = useState(producto.notas ?? "");
  const [imagenUrl, setImagenUrl] = useState(producto.imagen_url);
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [imagenPreview, setImagenPreview] = useState<string | null>(
    producto.imagen_url,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function handleImagenChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImagenFile(file);
    setImagenPreview(file ? URL.createObjectURL(file) : imagenUrl);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let nuevaImagenUrl = imagenUrl;

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

      nuevaImagenUrl = supabase.storage.from("productos").getPublicUrl(path)
        .data.publicUrl;
    }

    const costoFinal =
      monedaCosto === "USD"
        ? (Number(costoUsd) || 0) * (Number(tipoCambioCosto) || 0)
        : Number(costo) || 0;

    const { error } = await supabase
      .from("productos")
      .update({
        nombre,
        plataforma_id: plataformaId || null,
        sku: sku || null,
        precio: Number(precio) || 0,
        costo: costoFinal,
        moneda_costo: monedaCosto,
        costo_original: monedaCosto === "USD" ? Number(costoUsd) || 0 : null,
        tipo_cambio_costo: monedaCosto === "USD" ? Number(tipoCambioCosto) || 0 : null,
        stock: Number(stock) || 0,
        activo,
        notas: notas || null,
        imagen_url: nuevaImagenUrl,
      })
      .eq("id", producto.id);

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

  async function handleDelete() {
    if (!confirm(`Excluir "${producto.nombre}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    setDeleting(true);
    setError(null);

    const { error } = await supabase
      .from("productos")
      .delete()
      .eq("id", producto.id);

    setDeleting(false);

    if (error) {
      setError(error.message);
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
        <span className="mb-1 block text-neutral-300">Imagem</span>
        {imagenPreview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imagenPreview}
            alt="Pré-visualização"
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
        <span className="mb-1 block text-neutral-300">Estoque</span>
        <input
          type="number"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          className="w-full rounded-md border border-neutral-700 px-3 py-2 text-sm outline-none focus:border-white"
        />
      </label>

      <label className="mb-3 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={activo}
          onChange={(e) => setActivo(e.target.checked)}
          className="h-4 w-4 rounded border-neutral-700"
        />
        <span className="text-neutral-300">Produto ativo</span>
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
        disabled={loading || deleting}
        className="mb-2 w-full rounded-md bg-white px-3 py-2 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:opacity-50"
      >
        {loading ? "Salvando…" : "Salvar alterações"}
      </button>

      <button
        type="button"
        onClick={handleDelete}
        disabled={loading || deleting}
        className="w-full rounded-md border border-red-900 px-3 py-2 text-sm font-medium text-red-400 transition hover:bg-red-950 disabled:opacity-50"
      >
        {deleting ? "Excluindo…" : "Excluir produto"}
      </button>
    </form>
  );
}
