import { randomUUID } from "node:crypto";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { RECEIPT_BUCKET, RECEIPT_PREFIX, receiptError, receiptPath } from "../attachments";

export async function POST(request: Request) {
  // Same-origin upload with the current user's session, never a service key.
  if (request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ error: "Origem inválida." }, { status: 403 });
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Entre novamente para anexar o comprovante." }, { status: 401 });
  try {
    const data = await request.formData();
    const file = data.get("file");
    if (!(file instanceof File)) return Response.json({ error: "Selecione um arquivo." }, { status: 400 });
    const invalid = receiptError(file);
    if (invalid) return Response.json({ error: invalid }, { status: 400 });
    const name = file.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_.-]/g,"_").replace(/\.{2,}/g,"_").slice(-150) || "comprovante";
    const path = `${user.id}/${randomUUID()}/${name}`;
    const db = await createClient();
    const { error } = await db.storage.from(RECEIPT_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
    if (error) return Response.json({ error: "Não foi possível guardar o comprovante. Tente novamente." }, { status: 502 });
    return Response.json({ source: RECEIPT_PREFIX + path });
  } catch { return Response.json({ error: "O envio foi interrompido. Tente novamente." }, { status: 500 }); }
}
export async function GET(request: Request) {
  if (!await getSessionUser()) return new Response("Entre novamente para abrir o comprovante.", { status: 401 });
  const path = receiptPath(new URL(request.url).searchParams.get("source") ?? "");
  if (!path) return new Response("Comprovante inválido.", { status: 400 });
  const db = await createClient();
  const { data, error } = await db.storage.from(RECEIPT_BUCKET).createSignedUrl(path, 60);
  if (error || !data) return new Response("Não foi possível abrir o comprovante.", { status: 404 });
  return new Response(null, { status: 302, headers: { Location: data.signedUrl, "Cache-Control": "private, no-store" } });
}
