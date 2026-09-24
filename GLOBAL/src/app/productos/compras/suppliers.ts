"use server";
import { createClient, getSessionUser } from "@/lib/supabase/server";
export async function addSupplier(name: string) {
  const user = await getSessionUser();
  if (!user) return { error: "Entre novamente para cadastrar o fornecedor." };
  if (typeof name !== "string" || !name.trim() || name.trim().length > 200) return { error: "Informe o nome do fornecedor (até 200 caracteres)." };
  try {
    const db = await createClient();
    const { data, error } = await db.from("fornecedores").insert({ nome: name.trim(), registrado_por: user.id }).select("id,nome").single();
    if (error?.code === "23505") return { error: "Este fornecedor já está cadastrado. Selecione-o na lista." };
    if (error || !data) return { error: "Não foi possível cadastrar o fornecedor." };
    return { supplier: data as { id: string; nome: string } };
  } catch { return { error: "Confira a conexão e tente novamente." }; }
}
