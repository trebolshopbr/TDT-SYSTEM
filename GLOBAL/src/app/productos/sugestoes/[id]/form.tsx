"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Proposta = {
  id: string;
  nombre_producto: string;
  segmento: string;
  link_proveedor: string | null;
  costo_estimado: number | null;
  precio_venta_estimado: number | null;
  precio_competencia: number | null;
  notas: string | null;
  estado: "por_investigar" | "em_analise" | "aprovado" | "descartado";
  nivel_evidencia: "pendente" | "referencia" | "verificado";
  imagem_referencias: string[] | null;
  proximo_passo: string | null;
  producto_id: string | null;
};

export default function AnaliseForm({ proposta }: { proposta: Proposta }) {
  const router = useRouter();
  const supabase = createClient();
  const [estado, setEstado] = useState(proposta.estado);
  const [evidencia, setEvidencia] = useState(proposta.nivel_evidencia);
  const [linkProveedor, setLinkProveedor] = useState(proposta.link_proveedor ?? "");
  const [costo, setCosto] = useState(proposta.costo_estimado?.toString() ?? "");
  const [venta, setVenta] = useState(proposta.precio_venta_estimado?.toString() ?? "");
  const [competencia, setCompetencia] = useState(proposta.precio_competencia?.toString() ?? "");
  const [notas, setNotas] = useState(proposta.notas ?? "");
  const [proximoPaso, setProximoPaso] = useState(proposta.proximo_passo ?? "");
  const [imagenes, setImagenes] = useState((proposta.imagem_referencias ?? []).join("\n"));
  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const [sku, setSku] = useState("");
  const [estoque, setEstoque] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const imagemRefs = imagenes.split("\n").map((v) => v.trim()).filter(Boolean);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null); setOk(null);
    let referencias = imagemRefs;
    let caminhoEnviado: string | null = null;

    if (imagemFile) {
      if (!imagemFile.type.startsWith("image/")) {
        setLoading(false); setError("Selecione um arquivo de imagem válido."); return;
      }
      if (imagemFile.size > 10 * 1024 * 1024) {
        setLoading(false); setError("A imagem deve ter no máximo 10 MB."); return;
      }

      const ext = imagemFile.name.split(".").pop()?.toLowerCase() || "jpg";
      caminhoEnviado = `sugestoes/${proposta.id}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("productos").upload(caminhoEnviado, imagemFile);
      if (uploadError) {
        setLoading(false); setError(`Não foi possível enviar a imagem: ${uploadError.message}`); return;
      }
      const url = supabase.storage.from("productos").getPublicUrl(caminhoEnviado).data.publicUrl;
      referencias = [url, ...referencias];
    }

    const { error } = await supabase.from("propuestas_productos").update({
      estado,
      nivel_evidencia: evidencia,
      link_proveedor: linkProveedor || null,
      costo_estimado: costo ? Number(costo) : null,
      precio_venta_estimado: venta ? Number(venta) : null,
      precio_competencia: competencia ? Number(competencia) : null,
      notas: notas || null,
      proximo_passo: proximoPaso || null,
      imagem_referencias: referencias,
    }).eq("id", proposta.id);
    setLoading(false);
    if (error) {
      if (caminhoEnviado) await supabase.storage.from("productos").remove([caminhoEnviado]);
      setError(error.message); return;
    }
    setImagenes(referencias.join("\n"));
    setImagemFile(null);
    setOk("Alterações salvas.");
    router.refresh();
  }

  async function adicionarAoCatalogo() {
    setLoading(true); setError(null); setOk(null);
    const { data, error } = await supabase.rpc("converter_sugestao_em_produto", {
      p_proposta_id: proposta.id,
      p_sku: sku || null,
      p_estoque: Number(estoque) || 0,
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    router.push(`/productos/${data}`);
    router.refresh();
  }

  return (
    <>
      <div className="mb-7 flex items-start justify-between gap-4">
        <div><p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">Editar sugestão</p><h1 className="text-2xl font-semibold">{proposta.nombre_producto}</h1><p className="mt-1 text-sm text-neutral-500">{proposta.segmento}</p></div>
        <Link href="/productos/sugestoes" className="shrink-0 rounded-md border border-neutral-700 px-3 py-2 text-sm hover:bg-neutral-950">← Sugestões</Link>
      </div>

      <form onSubmit={salvar} className="space-y-5 rounded-xl border border-neutral-800 bg-black p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoSelect label="Estado" value={estado} onChange={(v) => setEstado(v as Proposta["estado"])} options={[["por_investigar","Por investigar"],["em_analise","Em análise"],["aprovado","Aprovado"],["descartado","Descartado"]]} />
          <CampoSelect label="Evidência" value={evidencia} onChange={(v) => setEvidencia(v as Proposta["nivel_evidencia"])} options={[["pendente","Pendente"],["referencia","Referência"],["verificado","Verificado"]]} />
        </div>
        <Campo label="Link do fornecedor" type="url" value={linkProveedor} onChange={setLinkProveedor} placeholder="https://…" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo label="Custo estimado (R$)" type="number" value={costo} onChange={setCosto} />
          <Campo label="Venda estimada (R$)" type="number" value={venta} onChange={setVenta} />
          <Campo label="Concorrência (R$)" type="number" value={competencia} onChange={setCompetencia} />
        </div>
        <CampoArea label="Observações" value={notas} onChange={setNotas} rows={4} />
        <CampoArea label="Próximo passo" value={proximoPaso} onChange={setProximoPaso} rows={2} />

        <label className="block text-sm">
          <span className="mb-1 block text-neutral-300">Adicionar imagem</span>
          <input type="file" accept="image/*" onChange={(e) => setImagemFile(e.target.files?.[0] ?? null)} className="w-full rounded-md border border-neutral-700 px-3 py-2 outline-none file:mr-3 file:rounded file:border-0 file:bg-neutral-900 file:px-3 file:py-1 file:text-xs focus:border-white" />
          <span className="mt-1 block text-xs text-neutral-600">JPG, PNG ou WebP · máximo 10 MB</span>
        </label>

        <div>
          <p className="mb-2 text-xs text-neutral-500">Imagens vinculadas</p>
          {imagemRefs.length ? <div className="flex flex-wrap gap-3">{imagemRefs.map((src) => <div key={src} className="h-28 w-28 overflow-hidden rounded-lg border border-neutral-800 bg-white"><img src={src} alt="Imagem de referência" className="h-full w-full object-contain" /></div>)}</div> : <div className="rounded-lg border border-dashed border-neutral-800 px-4 py-8 text-center text-sm text-neutral-600">Imagem pendente</div>}
        </div>

        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
        {ok && <p role="status" className="text-sm text-emerald-400">{ok}</p>}
        <button disabled={loading} className="w-full rounded-md bg-white px-4 py-2.5 text-sm font-medium text-black hover:bg-neutral-200 disabled:opacity-50">{loading ? "Salvando…" : "Salvar alterações"}</button>
      </form>

      <section className="mt-5 rounded-xl border border-neutral-800 bg-black p-5 sm:p-6">
        <h2 className="font-semibold">Entrada no catálogo</h2>
        {proposta.producto_id ? (
          <div className="mt-3 flex items-center justify-between gap-4 text-sm"><span className="text-emerald-400">Produto operativo criado.</span><Link href={`/productos/${proposta.producto_id}`} className="underline">Abrir produto</Link></div>
        ) : (
          <><p className="mt-1 text-sm text-neutral-400">Disponível somente depois de salvar o estado como Aprovado.</p><div className="mt-4 grid gap-3 sm:grid-cols-[1fr_120px_auto]"><Campo label="SKU (opcional)" value={sku} onChange={setSku} /><Campo label="Estoque" type="number" value={estoque} onChange={setEstoque} /><button type="button" onClick={adicionarAoCatalogo} disabled={loading || proposta.estado !== "aprovado"} className="self-end rounded-md border border-neutral-600 px-4 py-2 text-sm font-medium hover:bg-neutral-950 disabled:cursor-not-allowed disabled:opacity-40">Adicionar ao catálogo</button></div></>
        )}
      </section>
    </>
  );
}

function Campo({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return <label className="block text-sm"><span className="mb-1 block text-neutral-300">{label}</span><input type={type} step={type === "number" ? "0.01" : undefined} min={type === "number" ? "0" : undefined} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-md border border-neutral-700 px-3 py-2 outline-none focus:border-white" /></label>;
}
function CampoArea({ label, value, onChange, rows }: { label: string; value: string; onChange: (v: string) => void; rows: number }) {
  return <label className="block text-sm"><span className="mb-1 block text-neutral-300">{label}</span><textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} className="w-full rounded-md border border-neutral-700 px-3 py-2 outline-none focus:border-white" /></label>;
}
function CampoSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[][] }) {
  return <label className="block text-sm"><span className="mb-1 block text-neutral-300">{label}</span><select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-md border border-neutral-700 px-3 py-2 outline-none focus:border-white">{options.map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></label>;
}
