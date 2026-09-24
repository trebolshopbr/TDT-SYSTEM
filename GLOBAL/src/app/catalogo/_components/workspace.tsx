"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { initialDraft, preparation, money, type CatalogProduct, type Draft } from "../_lib/drafts";
import { useDrafts } from "./use-drafts";
import Photo from "./photo";

const fieldStyle = "mt-2 w-full rounded-lg border border-neutral-700 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-white";
const lines = (value: string) => value.split("\n").map((v) => v.trim()).filter(Boolean);

export default function Workspace({ product, userId, initialMode }: { product: CatalogProduct; userId: string; initialMode: string }) {
  const { drafts, loaded, save } = useDrafts(userId);
  const saved = drafts[product.id] ?? initialDraft(product);
  const [working, setWorking] = useState<Draft | null>(null);
  const [mode, setMode] = useState(initialMode === "editar" ? "edit" : initialMode === "preview" ? "preview" : "overview");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const firstField = useRef<HTMLInputElement>(null);
  const draft = working ?? saved;
  const dirty = working !== null && JSON.stringify(working) !== JSON.stringify(saved);
  const progress = preparation(product, draft);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    const guardLink = (event: MouseEvent) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
      const link = event.target instanceof Element ? event.target.closest("a") : null;
      if (!link || link.target === "_blank" || !link.href || link.getAttribute("href")?.startsWith("#")) return;
      if (!window.confirm("Sair sem salvar as alterações desta ficha?")) {
        event.preventDefault(); event.stopImmediatePropagation();
      }
    };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", guardLink, true);
    return () => { window.removeEventListener("beforeunload", warn); document.removeEventListener("click", guardLink, true); };
  }, [dirty]);
  function change<K extends keyof Draft>(key: K, value: Draft[K]) {
    setWorking({ ...draft, [key]: value, ...(key !== "contentReviewed" && key !== "included" ? { contentReviewed: false } : {}) });
    setNotice(""); setError("");
  }
  function persist() {
    if (!draft.title.trim()) { setError("Informe o nome de apresentação."); firstField.current?.focus(); return; }
    try {
      save(product.id, { ...draft, savedAt: new Date().toISOString() });
      setWorking(null); setError(""); setNotice("Rascunho salvo neste navegador.");
    } catch { setError("Não foi possível salvar neste navegador. Seu texto continua aberto; copie-o antes de sair."); }
  }
  function cancel() {
    if (dirty && !window.confirm("Descartar as alterações que ainda não foram salvas?")) return;
    setWorking(null); setError(""); setNotice(""); setMode("overview");
  }
  const title = draft.title || product.nombre;

  if (!loaded) return <p className="py-12 text-sm text-neutral-400">Carregando apresentação…</p>;
  return <>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-500"><Link href="/catalogo" className="text-sm text-neutral-400 hover:text-white">← Catálogo</Link><span>Rascunho local · {dirty ? "Alterações não salvas" : saved.savedAt ? "Salvo neste navegador" : "Ainda não preparado"}</span></div>
    <header className="mb-7 flex flex-wrap items-start justify-between gap-5">
      <div><p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-neutral-500">{draft.category || "Categoria a definir"}</p><h1 className="max-w-2xl text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">{title}</h1></div>
      <div className="flex gap-2">{mode !== "edit" && <button onClick={() => setMode("edit")} className="rounded-full bg-white px-4 py-2.5 text-sm font-medium text-black">Preparar ficha</button>}{mode !== "preview" && <button onClick={() => setMode("preview")} className="rounded-full border border-neutral-700 px-4 py-2.5 text-sm">Ver prévia ↗</button>}</div>
    </header>
    <nav aria-label="Ficha comercial" className="mb-7 flex gap-6 border-b border-neutral-800 text-sm">
      {[{ id: "overview", name: "Apresentação" }, { id: "edit", name: "Preparar conteúdo" }, { id: "preview", name: "Prévia" }].map((tab) => <button key={tab.id} onClick={() => setMode(tab.id)} aria-pressed={mode === tab.id} className={`border-b-2 pb-3 ${mode === tab.id ? "border-white" : "border-transparent text-neutral-500"}`}>{tab.name}</button>)}
    </nav>
    {notice && <p role="status" className="mb-5 rounded-lg border border-neutral-700 px-4 py-3 text-sm">{notice}</p>}
    {error && <p role="alert" className="mb-5 text-sm text-red-300">{error}</p>}

    {mode === "edit" ? <form onSubmit={(e) => { e.preventDefault(); persist(); }}>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-7">
          <section className="rounded-xl border border-neutral-800 p-5 sm:p-6"><h2 className="mb-5 text-lg font-medium"><span className="mr-3 text-neutral-600">01</span>Identidade comercial</h2>
            <label className="block text-sm">Nome de apresentação<input ref={firstField} value={draft.title} onChange={(e) => change("title", e.target.value)} maxLength={160} required className={fieldStyle} /></label>
            <label className="mt-5 block text-sm">Categoria<input value={draft.category} onChange={(e) => change("category", e.target.value)} maxLength={80} placeholder="Defina como este produto será agrupado" className={fieldStyle} /></label>
            <p className="mt-3 text-xs text-neutral-500">O nome de apresentação não altera a ficha operacional de Produtos.</p>
          </section>
          <section className="rounded-xl border border-neutral-800 p-5 sm:p-6"><h2 className="mb-5 text-lg font-medium"><span className="mr-3 text-neutral-600">02</span>O que vamos comunicar</h2>
            <label className="block text-sm">Descrição comercial<textarea rows={4} value={draft.description} onChange={(e) => change("description", e.target.value)} maxLength={3000} placeholder="O que é o produto e qual necessidade ele atende?" className={fieldStyle} /></label>
            <label className="mt-5 block text-sm">Para quem é indicado<textarea rows={2} value={draft.audience} onChange={(e) => change("audience", e.target.value)} maxLength={1000} placeholder="Descreva o público ou a situação de uso" className={fieldStyle} /></label>
            <label className="mt-5 block text-sm">Destaques<textarea rows={3} value={draft.highlights} onChange={(e) => change("highlights", e.target.value)} maxLength={2000} placeholder="Um destaque confirmado por linha" className={fieldStyle} /></label>
          </section>
          <section className="rounded-xl border border-neutral-800 p-5 sm:p-6"><h2 className="mb-5 text-lg font-medium"><span className="mr-3 text-neutral-600">03</span>Informação e evidência</h2>
            <label className="block text-sm">Características confirmadas<textarea rows={4} value={draft.specifications} onChange={(e) => change("specifications", e.target.value)} maxLength={3000} placeholder="Uma característica por linha. Use apenas dados da versão oferecida." className={fieldStyle} /></label>
            <label className="mt-5 block text-sm">Fonte das informações<textarea rows={2} value={draft.source} onChange={(e) => change("source", e.target.value)} maxLength={2000} placeholder="Link do fabricante, documento ou referência consultada" className={fieldStyle} /></label>
          </section>
        </div>
        <aside className="space-y-5 lg:sticky lg:top-5">
          <Photo src={product.imagen_url} name={product.nombre} className="aspect-[4/3] rounded-xl" />
          <div className="rounded-xl border border-neutral-800 p-5"><h2 className="mb-4 font-medium">Revisão da apresentação</h2>
            <label className="flex gap-3 text-sm leading-6"><input type="checkbox" disabled={!product.imagen_url} checked={draft.imageReviewed} onChange={(e) => change("imageReviewed", e.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-white" />A foto representa a versão oferecida.</label>
            <label className="mt-4 flex gap-3 text-sm leading-6"><input type="checkbox" checked={draft.contentReviewed} onChange={(e) => change("contentReviewed", e.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-white" />Conferi o conteúdo com a fonte indicada.</label>
            <p className="mt-4 text-xs leading-5 text-neutral-500">Editar o conteúdo exige uma nova revisão.</p>
          </div>
          <div className="rounded-xl border border-neutral-800 p-5"><h2 className="mb-4 font-medium">Na apresentação</h2>
            <label className="flex gap-3 text-sm"><input type="checkbox" checked={draft.included} onChange={(e) => change("included", e.target.checked)} className="h-4 w-4 accent-white" />Incluir na seleção</label>
            <label className="mt-4 flex gap-3 text-sm"><input type="checkbox" checked={draft.showPrice} onChange={(e) => change("showPrice", e.target.checked)} className="h-4 w-4 accent-white" />Exibir preço de referência</label>
            <p className="mt-3 text-xs text-neutral-500">{Number(product.precio) > 0 ? money(product.precio) : "Preço ainda não cadastrado"} · Fonte: Produtos</p>
          </div>
          <p className="text-xs leading-5 text-neutral-500">Este rascunho fica apenas neste navegador e nesta conta. Outros sócios ainda não verão suas alterações.</p>
        </aside>
      </div>
      <div className="sticky bottom-0 mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-800 bg-black/95 py-4 backdrop-blur"><p className="text-xs text-neutral-400">{progress.done}/{progress.total} etapas preenchidas</p><div className="flex gap-3"><button type="button" onClick={cancel} className="px-3 py-2 text-sm text-neutral-400">Cancelar</button><button type="submit" className="rounded-full bg-white px-5 py-3 text-sm font-medium text-black">Salvar rascunho</button></div></div>
    </form> : mode === "preview" ? <section aria-label="Prévia da apresentação">
      <div className="mb-5 flex flex-wrap justify-between gap-2 rounded-lg border border-neutral-800 px-4 py-3 text-xs text-neutral-400"><span>Prévia interna {dirty ? "· Inclui alterações não salvas" : ""}</span><span>{progress.ready ? "Conteúdo revisado localmente" : "Rascunho incompleto"} · Ainda não publicado</span></div>
      <div className="overflow-hidden rounded-2xl border border-neutral-800">
        <div className="flex justify-between border-b border-neutral-800 px-6 py-5"><span className="text-sm font-semibold tracking-[0.18em]">GLOBAL</span><span className="text-xs text-neutral-500">{draft.category || "Categoria a definir"}</span></div>
        <div className="grid lg:grid-cols-2"><Photo src={product.imagen_url} name={title} className="aspect-square max-h-[440px] w-full" /><div className="flex flex-col justify-center p-6 sm:p-10"><h2 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{title}</h2><p className="mt-5 whitespace-pre-line text-base leading-7 text-neutral-300">{draft.description || "Descrição em preparação."}</p>{draft.showPrice && <p className="mt-6 text-2xl">{Number(product.precio) > 0 ? money(product.precio) : "Preço a confirmar"}<span className="mt-1 block text-xs text-neutral-500">Preço de referência · Confirmar condições</span></p>}{draft.audience && <div className="mt-7 border-t border-neutral-800 pt-5"><p className="text-xs uppercase tracking-widest text-neutral-500">Para quem</p><p className="mt-2 text-sm leading-6 text-neutral-300">{draft.audience}</p></div>}</div></div>
        <div className="grid gap-8 border-t border-neutral-800 p-6 sm:grid-cols-2 sm:p-10"><div><h3 className="mb-4 text-lg font-medium">Destaques</h3><ul className="space-y-3 text-sm leading-6 text-neutral-300">{lines(draft.highlights).map((line, i) => <li key={i} className="flex gap-3"><span className="text-neutral-600">↗</span>{line}</li>)}</ul>{!draft.highlights.trim() && <p className="text-sm text-neutral-500">Destaques em preparação.</p>}</div><div><h3 className="mb-4 text-lg font-medium">Características</h3><ul className="divide-y divide-neutral-800 text-sm text-neutral-300">{lines(draft.specifications).map((line, i) => <li key={i} className="py-3 first:pt-0">{line}</li>)}</ul>{!draft.specifications.trim() && <p className="text-sm text-neutral-500">Características em preparação.</p>}</div></div>
        <p className="border-t border-neutral-800 px-6 py-4 text-xs text-neutral-500">Disponibilidade e condições comerciais sob confirmação.</p>
      </div>
    </section> : <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div><Photo src={product.imagen_url} name={title} className="aspect-[4/3] max-h-[420px] rounded-xl" />
        <section className="mt-7"><h2 className="text-xl font-medium">A apresentação do produto</h2><p className="mt-3 whitespace-pre-line text-sm leading-7 text-neutral-400">{draft.description || "A foto e o nome já estão aqui. O próximo passo é transformar essa base em uma apresentação: o que o produto faz, para quem é indicado e quais características foram confirmadas."}</p><button onClick={() => setMode("edit")} className="mt-5 text-sm font-medium underline underline-offset-4">{draft.description ? "Editar apresentação" : "Começar pela descrição"}</button></section>
        {draft.source && <section className="mt-7 border-t border-neutral-800 pt-5"><h2 className="text-xs uppercase tracking-widest text-neutral-500">Fonte informada</h2><p className="mt-3 whitespace-pre-line break-words text-sm text-neutral-300">{draft.source}</p></section>}
      </div>
      <aside className="rounded-xl border border-neutral-800 bg-neutral-950 p-5"><div className="flex items-start justify-between"><h2 className="font-medium">Preparação da ficha</h2><span className="text-sm text-neutral-400">{progress.done}/{progress.total}</span></div><div className="my-5 h-1 rounded-full bg-neutral-800"><div className="h-full rounded-full bg-white" style={{ width: `${progress.done / progress.total * 100}%` }} /></div><ol className="space-y-4">{progress.steps.map((step, i) => <li key={step.label} className="flex items-center gap-3 text-sm"><span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs ${step.done ? "border-white bg-white text-black" : "border-neutral-700 text-neutral-500"}`}>{step.done ? "✓" : i + 1}</span><span className={step.done ? "text-white" : "text-neutral-400"}>{step.label}</span></li>)}</ol><button onClick={() => setMode("edit")} className="mt-6 w-full rounded-full bg-white px-4 py-3 text-sm font-medium text-black">Continuar preparação</button><p className="mt-4 text-xs leading-5 text-neutral-500">{progress.ready ? "Revisado neste navegador. Ainda não publicado nem compartilhado." : "A ficha fica em preparação até concluir todos os itens."}</p></aside>
    </div>}
  </>;
}
