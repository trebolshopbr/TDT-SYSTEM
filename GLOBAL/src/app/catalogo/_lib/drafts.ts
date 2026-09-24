export type CatalogProduct = { id: string; nombre: string; imagen_url: string | null; precio: number };
export type Draft = {
  title: string; category: string; description: string; audience: string;
  highlights: string; specifications: string; source: string;
  imageReviewed: boolean; contentReviewed: boolean; included: boolean; showPrice: boolean;
  savedAt: string;
};
export function initialDraft(p: CatalogProduct): Draft {
  return { title: p.nombre, category: "", description: "", audience: "", highlights: "", specifications: "", source: "", imageReviewed: false, contentReviewed: false, included: true, showPrice: false, savedAt: "" };
}
export function readDrafts(raw: string): Record<string, Draft> {
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object" || Array.isArray(data)) return {};
    return Object.fromEntries(Object.entries(data).filter((entry): entry is [string, Draft] => {
      const d = entry[1] as Partial<Draft> | null;
      return !!d && ["title", "category", "description", "audience", "highlights", "specifications", "source", "savedAt"].every((k) => typeof d[k as keyof Draft] === "string") && ["imageReviewed", "contentReviewed", "included", "showPrice"].every((k) => typeof d[k as keyof Draft] === "boolean");
    }));
  } catch { return {}; }
}
export function preparation(p: CatalogProduct, d: Draft) {
  const steps = [
    { label: "Nome e categoria", done: !!d.title.trim() && !!d.category.trim() },
    { label: "Descrição e público", done: !!d.description.trim() && !!d.audience.trim() },
    { label: "Destaques e características", done: !!d.highlights.trim() && !!d.specifications.trim() },
    { label: "Fonte da informação", done: !!d.source.trim() },
    { label: "Foto conferida", done: !!p.imagen_url && d.imageReviewed },
    { label: "Conteúdo revisado", done: d.contentReviewed },
  ];
  const done = steps.filter((s) => s.done).length;
  return { steps, done, total: steps.length, ready: done === steps.length };
}
export const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
export const money = (n: number) => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
