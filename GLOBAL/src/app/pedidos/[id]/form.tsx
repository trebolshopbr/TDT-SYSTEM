"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Plataforma = { id: string; nombre: string; activa: boolean };
type Producto = { id: string; nombre: string; sku: string | null; precio: number; stock: number };
type Pedido = {
  id: string;
  plataforma_id: string;
  producto_id: string | null;
  fecha: string;
  cliente_nombre: string;
  cliente_contacto: string | null;
  cantidad: number;
  monto: number;
  comision_plataforma: number;
  metodo_pago: string | null;
  estado: string;
  notas: string | null;
};

export default function EditarPedidoForm({
  pedido,
  plataformas,
  productos,
}: {
  pedido: Pedido;
  plataformas: Plataforma[];
  productos: Producto[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const [plataformaId, setPlataformaId] = useState(pedido.plataforma_id);
  const [productoId, setProductoId] = useState(pedido.producto_id ?? "");
  const [fecha, setFecha] = useState(pedido.fecha);
  const [clienteNombre, setClienteNombre] = useState(pedido.cliente_nombre);
  const [clienteContacto, setClienteContacto] = useState(
    pedido.cliente_contacto ?? "",
  );
  const [cantidad, setCantidad] = useState(String(pedido.cantidad));
  const [monto, setMonto] = useState(String(pedido.monto));
  const [comisionPlataforma, setComisionPlataforma] = useState(
    String(pedido.comision_plataforma),
  );
  const [metodoPago, setMetodoPago] = useState(pedido.metodo_pago ?? "");
  const [estado, setEstado] = useState(pedido.estado);
  const [notas, setNotas] = useState(pedido.notas ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const productoSeleccionado = useMemo(
    () => productos.find((p) => p.id === productoId) ?? null,
    [productos, productoId],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase
      .from("pedidos")
      .update({
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
      })
      .eq("id", pedido.id);

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/pedidos");
    router.refresh();
  }

  async function handleDelete() {
    if (
      !confirm(
        `Excluir o pedido de "${pedido.cliente_nombre}"? Esta ação não pode ser desfeita.`,
      )
    ) {
      return;
    }

    setDeleting(true);
    setError(null);

    const { error } = await supabase.from("pedidos").delete().eq("id", pedido.id);

    setDeleting(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/pedidos");
    router.refresh();
  }

  const neto = (Number(monto) || 0) - (Number(comisionPlataforma) || 0);

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
          onChange={(e) => setProductoId(e.target.value)}
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
            {pedido.producto_id === productoId &&
              " (já descontado por este pedido)"}
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
            onChange={(e) => setCantidad(e.target.value)}
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
            onChange={(e) => setMonto(e.target.value)}
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
          {neto.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
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
        {deleting ? "Excluindo…" : "Excluir pedido"}
      </button>
    </form>
  );
}
