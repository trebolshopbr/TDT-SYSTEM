"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { calculate, categories, emptyLot, money, type Lot, type Movement } from "./model";
import { saveLot } from "./actions";
import Receipt from "./receipt";
import { addSupplier } from "./suppliers";

const inputClass = "mt-2 w-full min-w-0 rounded-lg border border-neutral-700 bg-black px-3 py-2.5 text-white focus:border-white focus:outline-none";
function Field({ label, value, onChange, type = "text", step }: { label: string; value: string; onChange: (value: string) => void; type?: string; step?: string }) {
  return <label className="block min-w-0 text-sm text-neutral-300">{label}<input type={type} value={value} onChange={e => onChange(e.target.value)} step={step} min={type === "number" ? "0" : undefined} maxLength={2000} className={inputClass} /></label>;
}
function Currency({ value, onChange }: { value: string; onChange: (value: "BRL" | "USD") => void }) {
  return <label className="block text-sm text-neutral-300">Moeda<select value={value} onChange={e => onChange(e.target.value as "BRL" | "USD")} className={inputClass}><option value="BRL">BRL · Real</option><option value="USD">USD · Dólar</option></select></label>;
}
export default function PurchaseForm({ products, suppliers, initial, initialProduct = "", lotId, initialRevision = null, available }: {
  products: { id: string; nombre: string }[]; suppliers: { id: string; nome: string }[]; initial?: Lot; initialProduct?: string;
  lotId: string; initialRevision?: number | null; available: boolean;
}) {
  const router = useRouter();
  const [lot, setLot] = useState(initial ?? emptyLot);
  const [product, setProduct] = useState(initialProduct);
  const [supplierList, setSupplierList] = useState(suppliers);
  const [supplierName, setSupplierName] = useState("");
  const [addingSupplier, setAddingSupplier] = useState(false);
  const [supplierError, setSupplierError] = useState("");
  const [supplierBusy, setSupplierBusy] = useState(false);
  const [files, setFiles] = useState<Record<string, File>>({});
  const [revision, setRevision] = useState(initialRevision);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, startTransition] = useTransition();
  const result = calculate(lot);
  const change = (patch: Partial<Lot>) => { setLot(current => ({ ...current, ...patch })); setDirty(true); setMessage(""); };
  const movement = (id: string, patch: Partial<Movement>) => change({ movements: lot.movements.map(m => m.id === id ? { ...m, ...patch } : m) });
  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    const click = (event: MouseEvent) => {
      const anchor = (event.target as Element)?.closest?.("a[href]");
      if (anchor && anchor.getAttribute("target") !== "_blank" && !window.confirm("Há alterações não salvas. Sair e descartar o preenchimento?")) { event.preventDefault(); event.stopPropagation(); }
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", click, true);
    return () => { window.removeEventListener("beforeunload", beforeUnload); document.removeEventListener("click", click, true); };
  }, [dirty]);
  function save(event: React.FormEvent) {
    event.preventDefault();
    if (!available || saving || supplierBusy) return;
    if (!product) { setMessage("Escolha o produto desta compra."); return; }
    if (result.errors.length) { setMessage(result.errors.join(" ")); return; }
    startTransition(async () => {
      try {
        let draft = lot;
        for (const [key, file] of Object.entries(files)) {
          const data = new FormData(); data.set("file", file);
          const upload = await fetch("/productos/compras/comprovantes", { method: "POST", body: data });
          const uploaded = await upload.json();
          if (!upload.ok || !uploaded.source) { setMessage(uploaded.error || "Não foi possível anexar o comprovante."); return; }
          draft = key === "purchase" ? { ...draft, source: uploaded.source } : { ...draft, movements: draft.movements.map(m => m.id === key ? { ...m, source: uploaded.source } : m) };
          setLot(draft);
          setFiles(current => { const next = { ...current }; delete next[key]; return next; });
        }
        const response = await saveLot(draft, lotId, product, revision);
        if (response.error) { setMessage(response.error); return; }
        setRevision(response.revision ?? null); setDirty(false); setMessage("Compra salva. Você pode completar os dados pendentes depois.");
        router.replace(`/productos/compras/${lotId}`); router.refresh();
      } catch { setMessage("Não foi possível confirmar o salvamento. O preenchimento continua nesta tela."); }
    });
  }
  const chooseFile = (key: string, file?: File) => { if (file) { setFiles(current => ({ ...current, [key]: file })); setDirty(true); setMessage(""); } };
  async function createSupplier() {
    if (supplierBusy || saving) return;
    setSupplierBusy(true); setSupplierError("");
    try {
      const response = await addSupplier(supplierName);
      if (!response.supplier) { setSupplierError(response.error || "Não foi possível cadastrar."); return; }
      setSupplierList(current => [...current, response.supplier!].sort((a,b) => a.nome.localeCompare(b.nome)));
      change({ supplier: response.supplier.nome, supplierId: response.supplier.id });
      setAddingSupplier(false); setSupplierName("");
    } catch { setSupplierError("Não foi possível cadastrar. Tente novamente."); }
    finally { setSupplierBusy(false); }
  }
  return <form onSubmit={save}>
    {!available && <div role="status" className="mb-8 rounded-lg border border-neutral-700 p-4 text-sm leading-6 text-neutral-300"><strong className="block text-white">Salvamento indisponível</strong>Os dados preenchidos não serão guardados ao sair.</div>}
    <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
      <fieldset disabled={saving} className="min-w-0 space-y-10 disabled:opacity-70">
        <section><div className="mb-6 flex items-baseline gap-3"><h2 className="text-xl font-medium">Dados da compra</h2></div>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm text-neutral-300 sm:col-span-2">Produto<select value={product} disabled={revision !== null} onChange={e => { setProduct(e.target.value); setDirty(true); }} className={inputClass}><option value="">Selecione um produto cadastrado</option>{products.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></label>
            <div className="sm:col-span-2"><label className="block text-sm text-neutral-300">Fornecedor<select className={inputClass} value={lot.supplierId || ""} onChange={event => { const supplier = supplierList.find(item => item.id === event.target.value); change({ supplierId: supplier?.id || "", supplier: supplier?.nome || "" }); }}>
              <option value="">{lot.supplier && !lot.supplierId ? `${lot.supplier} (registro anterior)` : "Selecione um fornecedor"}</option>
              {supplierList.map(supplier => <option key={supplier.id} value={supplier.id}>{supplier.nome}</option>)}
            </select></label>
            {!addingSupplier ? <button type="button" onClick={() => setAddingSupplier(true)} className="mt-3 text-sm underline">+ Cadastrar fornecedor</button> : <div className="mt-4 rounded-lg border border-neutral-800 p-4"><Field label="Nome do fornecedor" value={supplierName} onChange={setSupplierName} /><div className="mt-3 flex gap-4"><button type="button" disabled={supplierBusy || !supplierName.trim()} onClick={createSupplier} className="rounded bg-white px-3 py-2 text-sm text-black disabled:opacity-40">{supplierBusy ? "Cadastrando…" : "Cadastrar e selecionar"}</button><button type="button" disabled={supplierBusy} onClick={() => setAddingSupplier(false)} className="text-sm text-neutral-400">Cancelar</button></div>{supplierError && <p role="alert" className="mt-3 text-sm text-red-300">{supplierError}</p>}</div>}
            </div>
            <Field label="Quantidade comprada (unidades)" type="number" step="1" value={lot.quantity} onChange={quantity => change({ quantity })} />
            <Currency value={lot.currency} onChange={currency => change({ currency, rate: "" })} />
            <Field label={`Preço de compra por unidade (${lot.currency})`} type="number" step="0.01" value={lot.unitPrice} onChange={unitPrice => change({ unitPrice })} />
            <div><Field label="Desconto" type="number" step="0.01" value={lot.discount} onChange={discount => change({ discount })} /><p className="mt-2 text-xs text-neutral-500">Sem desconto: 0. Valor desconhecido: deixe em branco.</p></div>
            <Field label="Data do pagamento da compra" type="date" value={lot.paidOn} onChange={paidOn => change({ paidOn })} />
            {lot.currency === "USD" && <Field label="Câmbio do dia do pagamento (R$ por US$)" type="number" step="0.000001" value={lot.rate} onChange={rate => change({ rate })} />}
            <div className="sm:col-span-2"><Receipt source={lot.source} file={files.purchase} onFile={file => chooseFile("purchase", file)} /></div>
          </div>
          <p className="mt-4 text-xs leading-5 text-neutral-500">Compra com pagamento único.</p>
        </section>
        <section className="border-t border-neutral-800 pt-8"><div className="mb-3 flex items-baseline gap-3"><h2 className="text-xl font-medium">Gastos de movimento</h2></div>
          <div className="divide-y divide-neutral-800 border-y border-neutral-800">{categories.map(category => {
            const items = lot.movements.filter(m => m.category === category);
            const reviewed = lot.reviewed.includes(category);
            return <details key={category} className="group py-4"><summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 text-sm"><span className="font-medium">{category} <span className="ml-2 text-neutral-500">+</span></span><span className="text-xs text-neutral-400">{reviewed ? items.length ? `${items.length} pagamento(s) · informado` : "Sem gasto declarado" : "Pendente"}</span></summary><div className="mt-5 space-y-5">
              {items.map((m, index) => <div key={m.id} className="rounded-lg border border-neutral-800 p-4"><div className="mb-4 flex items-center justify-between gap-3"><h3 className="text-sm">Pagamento {index + 1}</h3><button type="button" className="text-xs text-neutral-400 underline" onClick={() => { if (window.confirm("Remover este pagamento do preenchimento?")) { change({ movements: lot.movements.filter(item => item.id !== m.id), reviewed: lot.reviewed.filter(c => c !== category) }); setFiles(current => { const next = { ...current }; delete next[m.id]; return next; }); } }}>Remover<span className="sr-only"> {category} {index + 1}</span></button></div>
                <div className="grid gap-4 sm:grid-cols-2"><Field label={`Valor deste lote (${m.currency})`} type="number" step="0.01" value={m.amount} onChange={amount => movement(m.id, { amount })} /><Currency value={m.currency} onChange={currency => movement(m.id, { currency, rate: "" })} /><Field label="Data deste pagamento" type="date" value={m.paidOn} onChange={paidOn => movement(m.id, { paidOn })} />{m.currency === "USD" && <Field label="Câmbio deste pagamento (R$ por US$)" type="number" step="0.000001" value={m.rate} onChange={rate => movement(m.id, { rate })} />}<div className="sm:col-span-2"><Receipt source={m.source} file={files[m.id]} onFile={file => chooseFile(m.id, file)} /></div><div className="sm:col-span-2"><Field label="Critério de rateio" value={m.allocation} onChange={allocation => movement(m.id, { allocation })} /><p className="mt-2 text-xs leading-5 text-neutral-500">Gasto exclusivo: indique “integral”. Compartilhado: informe o total, os lotes e a divisão; lance só a parcela deste lote.</p></div></div><p className="mt-4 text-sm text-neutral-400">Parcela em reais: {money(result.movementValues[m.id])}</p>
              </div>)}
              <button type="button" disabled={lot.movements.length >= 100} onClick={() => change({ movements: [...lot.movements, { id: crypto.randomUUID(), category, amount: "", currency: "BRL", rate: "", paidOn: "", source: "", allocation: "" }], reviewed: lot.reviewed.filter(c => c !== category) })} className="rounded-lg border border-neutral-700 px-3 py-2 text-sm disabled:opacity-50">+ Adicionar pagamento<span className="sr-only"> de {category}</span></button>
              <label className="flex items-start gap-3 text-sm text-neutral-300"><input type="checkbox" checked={reviewed} onChange={e => change({ reviewed: e.target.checked ? [...lot.reviewed, category] : lot.reviewed.filter(c => c !== category) })} className="mt-1 accent-white" /><span>Concluí o levantamento de {category.toLowerCase()}{!items.length && ": não houve gasto para este lote"}.</span></label>
            </div></details>;
          })}</div>
        </section>
      </fieldset>
      <aside className="rounded-xl border border-neutral-700 p-6 lg:sticky lg:top-24" aria-label="Resumo do custo"><p className="text-xs uppercase tracking-widest text-neutral-500">Custo por unidade</p><h2 className="mt-4 text-2xl font-semibold">{money(result.unit)}</h2><p className="mt-1 text-sm text-neutral-400">por unidade{result.complete ? " · dados preenchidos" : " · faltam informações"}</p>
        <dl className="mt-6 space-y-4 text-sm"><div className="flex justify-between gap-4"><dt className="text-neutral-400">Compra após desconto</dt><dd>{money(result.purchase)}</dd></div><div className="flex justify-between gap-4"><dt className="text-neutral-400">Movimento informado</dt><dd>{lot.movements.length ? money(result.movement) : lot.reviewed.length === 6 ? money(0) : "Pendente"}</dd></div><div className="flex justify-between gap-4 border-t border-neutral-800 pt-4"><dt>{result.complete ? "Total do lote" : "Subtotal conhecido"}</dt><dd>{money(result.knownTotal)}</dd></div></dl>
        {!result.complete && <p className="mt-4 text-xs leading-5 text-neutral-400">Subtotal parcial. Complete as pendências para obter o custo por unidade.</p>}
        {!!result.errors.length && <ul role="alert" className="mt-5 list-inside list-disc space-y-2 text-sm text-red-300">{result.errors.map((error, i) => <li key={i}>{error}</li>)}</ul>}
        {!!result.pending.length && <details className="mt-6 text-sm"><summary className="cursor-pointer">Ver {result.pending.length} pendência(s)</summary><ul className="mt-3 space-y-2 text-xs leading-5 text-neutral-400">{result.pending.map((item, i) => <li key={i}>· {item}</li>)}</ul></details>}
        <button type="submit" disabled={!available || saving || supplierBusy || !products.length} className="mt-6 w-full rounded-lg bg-white px-4 py-3 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-40">{saving ? "Salvando…" : available ? "Salvar compra" : "Salvamento aguardando ativação"}</button>
        {message && <p role="status" className="mt-4 text-sm leading-6">{message}</p>}
        <p className="mt-4 text-xs leading-5 text-neutral-500">{available ? "Você pode salvar com pendências e continuar depois." : "Nenhum dado deste formulário foi salvo."}</p>
        <details className="mt-5 border-t border-neutral-800 pt-4 text-xs text-neutral-400"><summary className="cursor-pointer">O que entra neste custo?</summary><p className="mt-3 leading-5">Compra após descontos + gastos de movimento, divididos pela quantidade comprada. Não inclui comissões de venda, entrega ao cliente, perdas ou custos fixos.</p><p className="mt-3 leading-5">Salvar a compra não altera estoque ou custos de pedidos. Confira os valores com os comprovantes antes de usá-los.</p></details>
        <Link href="/productos/compras" className="mt-5 block text-center text-sm text-neutral-400 underline">Voltar às compras</Link>
      </aside>
    </div>
  </form>;
}
