"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Plataforma = { id: string; nombre: string; activa: boolean };
type Producto = { id: string; nombre: string; sku: string | null; precio: number; stock: number };

export default function NuevoPedidoForm({
  plataformas,
  productos,
  userId,
}: {
  plataformas: Plataforma[];
  productos: Producto[];
  userId: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [plataformaId, setPlataformaId] = useState((plataformas.find((p) => p.activa) ?? plataformas[0])?.id ?? "");
  const [productoId, setProductoId] = useState("");
  const [fecha, setFecha] = useState(
    new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }),
  );
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteContacto, setClienteContacto] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [monto, setMonto] = useState("");
  const [montoTocado, setMontoTocado] = useState(false);
  const [comisionPlataforma, setComisionPlataforma] = useState("0");
  const [metodoPago, setMetodoPago] = useState("");
  const [estado, setEstado] = useState("pendiente");
  const [notas, setNotas] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const productoSeleccionado = useMemo(
    () => productos.find((p) => p.id === productoId) ?? null,
    [productos, productoId],
  );

  function handleProductoChange(id: string) {
    setProductoId(id);
    const producto = productos.find((p) => p.id === id);
    if (producto && !montoTocado) {
      setMonto((producto.precio * Number(cantidad || 1)).toFixed(2));
    }
  }

  function handleCantidadChange(value: string) {
    setCantidad(value);
    if (productoSeleccionado && !montoTocado) {
      setMonto((productoSeleccionado.precio * Number(value || 1)).toFixed(2));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.from("pedidos").insert({
      plataforma_id: plataformaId,
      producto_id: productoId || null,
      fecha,
      cliente_nombre: clienteNombre,
      cliente_contacto: clienteContacto || null,
      cantidad: Number(cantidad) || 1,
      monto: Number(monto) || 0,
      comision_plataforma: Number(comisionPlataforma) || 0,
      metodo_pago: metodoPago || null,
      estado,
      notas: notas || null,
      registrado_por: userId,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/pedidos");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-neutral-800 bg-black p-6"
    >
      <label className="mb-3 block text-sm">
        <span className="mb-1 block text-neutral-300">Plataforma</span>
        <select
          required
          value={plataformaId}
          onChange={(e) => setPlataformaId(e.target.value)}
          className="w-full rounded-md border border-neutral-700 px-3 py-2 text-sm outline-none focus:border-white"
        >
          {plataformas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
              {!p.activa ? " (inactiva)" : ""}
            </option>
          ))}
        </select>
      </label>

      <label className="mb-3 block text-sm">
        <span className="mb-1 block text-neutral-300">
          Produto (opcional — desconta estoque)
        </span>
        <select
          value={productoId}
          onChange={(e) => handleProductoChange(e.target.value)}
          className="w-full rounded-md border border-neutral-700 px-3 py-2 text-sm outline-none focus:border-white"
        >
          <option value="">— Sem vincular a um produto —</option>
          {productos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre} (estoque: {p.stock})
            </option>
          ))}
        </select>
        {productoSeleccionado && (
          <p className="mt-1 text-xs text-neutral-500">
            Estoque disponível: {productoSeleccionado.stock}
          </p>
        )}
      </label>

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

      <label className="mb-3 block text-sm">
        <span className="mb-1 block text-neutral-300">Nome do cliente</span>
        <input
          type="text"
          required
          value={clienteNombre}
          onChange={(e) => setClienteNombre(e.target.value)}
          className="w-full rounded-md border border-neutral-700 px-3 py-2 text-sm outline-none focus:border-white"
        />
      </label>

      <label className="mb-3 block text-sm">
        <span className="mb-1 block text-neutral-300">
          Contato (opcional)
        </span>
        <input
          type="text"
          value={clienteContacto}
          onChange={(e) => setClienteContacto(e.target.value)}
          placeholder="Telefone ou usuário da plataforma"
          className="w-full rounded-md border border-neutral-700 px-3 py-2 text-sm outline-none focus:border-white"
        />
      </label>

      <div className="mb-3 grid grid-cols-3 gap-3">
        <label className="block text-sm">
          <span className="mb-1 block text-neutral-300">Quantidade</span>
          <input
            type="number"
            min="1"
            value={cantidad}
            onChange={(e) => handleCantidadChange(e.target.value)}
            className="w-full rounded-md border border-neutral-700 px-3 py-2 text-sm outline-none focus:border-white"
          />
        </label>
        <label className="col-span-2 block text-sm">
          <span className="mb-1 block text-neutral-300">Valor total (bruto)</span>
          <input
            type="number"
            step="0.01"
            min="0"
            required
            value={monto}
            onChange={(e) => {
              setMontoTocado(true);
              setMonto(e.target.value);
            }}
            className="w-full rounded-md border border-neutral-700 px-3 py-2 text-sm outline-none focus:border-white"
          />
        </label>
      </div>

      <label className="mb-2 block text-sm">
        <span className="mb-1 block text-neutral-300">
          Comissão / taxas da plataforma (opcional)
        </span>
        <input
          type="number"
          step="0.01"
          min="0"
          value={comisionPlataforma}
          onChange={(e) => setComisionPlataforma(e.target.value)}
          className="w-full rounded-md border border-neutral-700 px-3 py-2 text-sm outline-none focus:border-white"
        />
      </label>

      <p className="mb-4 rounded-md bg-neutral-950 px-3 py-2 text-sm">
        <span className="text-neutral-400">Você vai receber (líquido): </span>
        <span className="font-medium">
          {(
            (Number(monto) || 0) - (Number(comisionPlataforma) || 0)
          ).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </span>
      </p>

      <label className="mb-4 block text-sm">
        <span className="mb-1 block text-neutral-300">
          Forma de pagamento (opcional)
        </span>
        <select
          value={metodoPago}
          onChange={(e) => setMetodoPago(e.target.value)}
          className="w-full rounded-md border border-neutral-700 px-3 py-2 text-sm outline-none focus:border-white"
        >
          <option value="">— Não especificado —</option>
          <option value="pix">Pix</option>
          <option value="credito">Crédito</option>
          <option value="debito">Débito</option>
          <option value="transferencia">Transferência</option>
          <option value="efectivo">Dinheiro</option>
          <option value="otro">Outro</option>
        </select>
      </label>

      <label className="mb-4 block text-sm">
        <span className="mb-1 block text-neutral-300">Status</span>
        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          className="w-full rounded-md border border-neutral-700 px-3 py-2 text-sm outline-none focus:border-white"
        >
          <option value="pendiente">Pendente</option>
          <option value="enviado">Enviado</option>
          <option value="entregado">Entregue</option>
          <option value="cancelado">Cancelado</option>
        </select>
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
        {loading ? "Salvando…" : "Salvar pedido"}
      </button>
    </form>
  );
}
