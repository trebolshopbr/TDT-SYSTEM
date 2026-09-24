"use client";
import { useState } from "react";
import Link from "next/link";
import { initialDraft, preparation, normalize, type CatalogProduct } from "../_lib/drafts";
import { useDrafts } from "./use-drafts";
import Photo from "./photo";

export default function Explorer({ products, userId }: { products: CatalogProduct[]; userId: string }) {
  const { drafts, loaded } = useDrafts(userId);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("selection");
  const [view, setView] = useState("grid");
  const entries = products.map((p) => {
    const draft = drafts[p.id] ?? initialDraft(p);
    return { product: p, draft, progress: preparation(p, draft) };
  });
  const selected = entries.filter((e) => e.draft.included);
  const ready = selected.filter((e) => e.progress.ready).length;
  const categories = [...new Set(entries.map((e) => e.draft.category.trim()).filter(Boolean))].sort();
  const visible = entries.filter(({ product, draft, progress }) =>
    (status === "outside" ? !draft.included : draft.included) &&
    (status !== "pending" || !progress.ready) && (status !== "ready" || progress.ready) &&
    (!category || (category === "uncategorized" ? !draft.category.trim() : draft.category.trim() === category)) &&
    normalize(`${draft.title} ${product.nombre} ${draft.category}`).includes(normalize(search.trim())));
  const next = selected.find((e) => !e.progress.ready);

  return <>
    <header className="flex flex-wrap items-end justify-between gap-5 pb-7">
      <div><p className="mb-3 text-[11px] uppercase tracking-[0.25em] text-neutral-500">Global / Apresentação comercial</p><h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Catálogo<span className="text-neutral-600">.</span></h1><p className="mt-3 text-sm text-neutral-400">Escolha a oferta. Prepare cada produto para ser apresentado.</p></div>
      {next && <Link href={`/catalogo/${next.product.id}?modo=editar`} className="rounded-full bg-white px-5 py-3 text-sm font-medium text-black hover:bg-neutral-200">Preparar próximo produto <span aria-hidden="true" className="ml-3">↗</span></Link>}
    </header>
    <section aria-label="Preparação do catálogo" className="mb-7 grid grid-cols-3 divide-x divide-neutral-800 rounded-xl border border-neutral-800 bg-neutral-950 py-4">
      {[{ value: selected.length, label: "Na seleção", tab: "selection" }, { value: selected.length - ready, label: "Em preparação", tab: "pending" }, { value: ready, label: "Revisados", tab: "ready" }].map((item) => <button key={item.tab} onClick={() => setStatus(item.tab)} aria-pressed={status === item.tab} className="px-3 text-left sm:px-5"><span className="text-2xl font-medium tabular-nums">{loaded ? item.value : "—"}</span><span className="mt-1 block text-xs text-neutral-400">{item.label}</span></button>)}
    </section>
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <label className="min-w-0 flex-1 basis-48"><span className="sr-only">Buscar no catálogo</span><input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar produto ou categoria…" className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm outline-none focus:border-neutral-400" /></label>
      <label><span className="sr-only">Categoria</span><select value={category} onChange={(e) => setCategory(e.target.value)} className="max-w-48 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-3 text-sm"><option value="">Todas as categorias</option><option value="uncategorized">Sem categoria</option>{categories.map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
      <div className="flex rounded-lg border border-neutral-800 p-1" aria-label="Visualização">{[{ id: "grid", name: "Cards", icon: "▦" }, { id: "list", name: "Lista", icon: "☰" }].map((v) => <button key={v.id} aria-label={v.name} aria-pressed={view === v.id} onClick={() => setView(v.id)} className={`rounded px-3 py-2 ${view === v.id ? "bg-neutral-800 text-white" : "text-neutral-500"}`}>{v.icon}</button>)}</div>
    </div>
    <nav aria-label="Estado da seleção" className="mb-6 flex gap-5 overflow-x-auto border-b border-neutral-800 text-sm">
      {[{ id: "selection", name: "Seleção" }, { id: "pending", name: "Em preparação" }, { id: "ready", name: "Revisados" }, { id: "outside", name: "Fora da seleção" }].map((s) => <button key={s.id} onClick={() => setStatus(s.id)} aria-pressed={status === s.id} className={`shrink-0 border-b-2 pb-3 ${status === s.id ? "border-white text-white" : "border-transparent text-neutral-500 hover:text-white"}`}>{s.name}</button>)}
    </nav>
    {!loaded ? <p className="py-10 text-sm text-neutral-400">Carregando rascunhos…</p> : <div className={view === "grid" ? "grid gap-5 sm:grid-cols-2 xl:grid-cols-3" : "space-y-3"}>
      {visible.map(({ product: p, draft: d, progress }) => <article key={p.id} className={`group overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950 ${view === "list" ? "flex flex-wrap sm:flex-nowrap" : ""}`}>
        <Link href={`/catalogo/${p.id}`} aria-label={`Abrir apresentação de ${d.title || p.nombre}`} className={view === "list" ? "w-full shrink-0 sm:w-40" : "block"}><Photo src={p.imagen_url} name={d.title || p.nombre} className={view === "list" ? "h-44 sm:h-full sm:min-h-44" : "aspect-[4/3]"} /></Link>
        <div className="flex min-w-0 flex-1 flex-col p-5">
          <div className="mb-3 flex items-center justify-between gap-2 text-[10px] uppercase tracking-widest text-neutral-500"><span>{d.category || "Categoria a definir"}</span><span className={progress.ready ? "text-white" : "text-neutral-400"}>{progress.ready ? "Revisado" : "Rascunho"}</span></div>
          <Link href={`/catalogo/${p.id}`} className="text-lg font-medium leading-6 hover:underline">{d.title || p.nombre}</Link>
          <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-neutral-400">{d.description || "A apresentação começa aqui. Prepare a descrição e os destaques deste produto."}</p>
          <div className="mt-5"><div className="mb-2 flex justify-between text-xs text-neutral-500"><span>Preparação da ficha</span><span>{progress.done}/{progress.total}</span></div><div className="h-1 overflow-hidden rounded-full bg-neutral-800"><div className="h-full bg-white transition-all" style={{ width: `${progress.done / progress.total * 100}%` }} /></div></div>
          <div className="mt-5 flex items-center justify-between gap-3 border-t border-neutral-800 pt-4"><Link href={`/catalogo/${p.id}?modo=editar`} className="text-sm font-medium hover:underline">Preparar ficha <span aria-hidden="true">↗</span></Link><Link href={`/catalogo/${p.id}?modo=preview`} className="text-xs text-neutral-400 hover:text-white">Prévia</Link></div>
        </div>
      </article>)}
    </div>}
    {loaded && !visible.length && <div className="rounded-xl border border-dashed border-neutral-800 px-6 py-12 text-center"><h2 className="font-medium">{status === "ready" ? "Ainda não há fichas revisadas" : "Nenhum produto nesta seleção"}</h2><p className="mt-2 text-sm text-neutral-400">{status === "ready" ? "Complete a apresentação e confira as informações de cada produto." : "Ajuste a busca, a categoria ou o estado para continuar."}</p><button onClick={() => { setSearch(""); setCategory(""); setStatus("selection"); }} className="mt-5 text-sm underline">Ver seleção completa</button></div>}
    <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-800 pt-5 text-xs leading-5 text-neutral-500"><p>Rascunhos salvos neste navegador, para esta conta.<br />A edição compartilhada entre os sócios ainda não está conectada.</p><p>Seleção interna · Sem confirmação de estoque</p></footer>
  </>;
}
