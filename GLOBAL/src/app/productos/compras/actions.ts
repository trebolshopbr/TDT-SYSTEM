"use server";

import { createClient, getSessionUser } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { calculate, parseLot, schemaMissing } from "./model";

export async function saveLot(input: unknown, id: string, productId: string, revision: number | null) {
  const user = await getSessionUser();
  if (!user) return { error: "Sua sessão terminou. Entre novamente antes de salvar." };
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const lot = parseLot(input);
  if (!lot || !uuid.test(id) || !uuid.test(productId) || (revision !== null && (!Number.isInteger(revision) || revision < 1))) return { error: "Não foi possível validar esta compra." };
  const result = calculate(lot);
  if (result.errors.length) return { error: result.errors.join(" ") };
  try {
    const db = await createClient();
    if (lot.supplierId) {
      const { data: supplier, error } = await db.from("fornecedores").select("nome").eq("id", lot.supplierId).single();
      if (error || !supplier) return { error: "Selecione um fornecedor cadastrado." };
      lot.supplier = supplier.nome;
    }
    const supplierLink = lot.supplierId !== undefined ? { fornecedor_id: lot.supplierId || null } : {};
    const query = revision === null
      ? db.from("compras_lotes").insert({ ...supplierLink, id, producto_id: productId, datos: lot, registrado_por: user.id, atualizado_por: user.id })
      : db.from("compras_lotes").update({ ...supplierLink, datos: lot, atualizado_por: user.id, revision: revision + 1 }).eq("id", id).eq("producto_id", productId).eq("revision", revision);
    const { data, error } = await query.select("id, revision").single();
    if (schemaMissing(error)) return { error: "O salvamento compartilhado ainda não foi ativado. Mantenha esta tela aberta para preservar o preenchimento." };
    if (error?.code === "PGRST116" || error?.code === "23505") return { error: "Esta compra pode ter sido salva ou alterada em outra sessão. Abra a lista de compras e confira antes de repetir." };
    if (error || !data) return { error: "Não foi possível confirmar o salvamento. Os campos continuam nesta tela. Confira seu acesso e tente novamente." };
    revalidatePath("/productos/compras");
    revalidatePath(`/productos/compras/${id}`);
    return { id: data.id as string, revision: data.revision as number };
  } catch {
    return { error: "A conexão foi interrompida. Confira a lista de compras antes de tentar salvar novamente." };
  }
}
