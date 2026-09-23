"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ESTADOS = ["pendiente", "enviado", "entregado", "cancelado"] as const;

const ESTADO_LABELS: Record<string, string> = {
  pendiente: "Pendente",
  enviado: "Enviado",
  entregado: "Entregue",
  cancelado: "Cancelado",
};

const ESTADO_STYLES: Record<string, string> = {
  pendiente: "bg-amber-950 text-amber-400",
  enviado: "bg-blue-950 text-blue-400",
  entregado: "bg-green-950 text-green-400",
  cancelado: "bg-red-950 text-red-400",
};

export default function EstadoSelect({
  pedidoId,
  estadoInicial,
}: {
  pedidoId: string;
  estadoInicial: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [estado, setEstado] = useState(estadoInicial);
  const [isPending, startTransition] = useTransition();

  async function handleChange(nuevo: string) {
    setEstado(nuevo);
    const { error } = await supabase
      .from("pedidos")
      .update({ estado: nuevo })
      .eq("id", pedidoId);

    if (!error) {
      startTransition(() => router.refresh());
    }
  }

  return (
    <select
      value={estado}
      disabled={isPending}
      onChange={(e) => handleChange(e.target.value)}
      className={`rounded-full border-0 px-2 py-0.5 text-xs font-medium outline-none disabled:opacity-50 ${ESTADO_STYLES[estado]}`}
    >
      {ESTADOS.map((e) => (
        <option key={e} value={e} className="bg-black text-white">
          {ESTADO_LABELS[e]}
        </option>
      ))}
    </select>
  );
}
