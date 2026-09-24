"use client";
import { useState } from "react";
import { receiptError, receiptPath } from "./attachments";
export default function Receipt({ source, file, onFile }: { source: string; file?: File; onFile: (file?: File) => void }) {
  const [error,setError] = useState("");
  const path = receiptPath(source);
  return <div className="text-sm"><label className="block text-neutral-300">Comprovante<input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="mt-2 block w-full min-w-0 rounded-lg border border-neutral-700 p-3 text-xs file:mr-3 file:rounded file:border-0 file:bg-white file:px-3 file:py-2 file:text-black" onChange={event => {
    const selected = event.target.files?.[0];
    if (!selected) return;
    const invalid = receiptError(selected);
    if (invalid) { setError(invalid); event.target.value=""; return; }
    setError(""); onFile(selected);
  }} /></label><p className="mt-2 text-xs text-neutral-500">PDF, JPG, PNG ou WebP · até 10 MB</p>
  {file ? <p className="mt-2 break-words text-xs">{file.name} · será anexado ao salvar</p> : path ? <a className="mt-3 inline-block break-all underline" href={`/productos/compras/comprovantes?source=${encodeURIComponent(source)}`} target="_blank" rel="noopener noreferrer">Abrir {path.split('/').at(-1)}</a> : source ? <p className="mt-2 break-words text-xs text-neutral-400">Referência anterior: {source}</p> : null}
  {error && <p role="alert" className="mt-2 text-sm text-red-300">{error}</p>}</div>;
}
