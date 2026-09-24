export const RECEIPT_BUCKET = "compras-comprovantes";
export const RECEIPT_PREFIX = "arquivo:";
export const MAX_RECEIPT_SIZE = 10 * 1024 * 1024;
export function receiptError(file: { size: number; type: string }) {
  if (!file.size) return "O arquivo está vazio.";
  if (file.size > MAX_RECEIPT_SIZE) return "O arquivo deve ter até 10 MB.";
  if (!["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(file.type)) return "Escolha um PDF ou uma imagem JPG, PNG ou WebP.";
  return null;
}
export function receiptPath(source: string) {
  if (!source.startsWith(RECEIPT_PREFIX)) return null;
  const path = source.slice(RECEIPT_PREFIX.length);
  return /^[0-9a-f-]{36}\/[0-9a-f-]{36}\/[a-zA-Z0-9_.-]{1,160}$/.test(path) && !path.includes('..') ? path : null;
}
