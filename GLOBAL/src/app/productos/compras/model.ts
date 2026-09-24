export const categories = ["Transporte", "Importação", "Impostos e tarifas", "Armazenamento", "Seguro", "Intermediários"] as const;
export type Payment = { amount: string; currency: "BRL" | "USD"; rate: string; paidOn: string; source: string };
export type Movement = Payment & { id: string; category: string; allocation: string };
export type Lot = {
  reference: string; supplier: string; supplierId?: string; quantity: string; unitPrice: string; discount: string;
  currency: "BRL" | "USD"; rate: string; paidOn: string; source: string;
  reviewed: string[]; movements: Movement[];
};
export const emptyLot = (): Lot => ({ reference: "", supplier: "", quantity: "", unitPrice: "", discount: "", currency: "BRL", rate: "", paidOn: "", source: "", reviewed: [], movements: [] });
export const number = (value: string): number | null => value.trim() && /^\d+(\.\d+)?$/.test(value) && Number.isFinite(Number(value)) ? Number(value) : null;
const cents = (value: number) => Math.round((value + Number.EPSILON) * 100);
const convertCents = (amount: number, rate: number) => Number((BigInt(amount) * BigInt(Math.round(rate * 1000000)) + BigInt(500000)) / BigInt(1000000));
const dateValid = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
export const money = (value: number | null) => value === null ? "Pendente" : value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Parse untrusted draft before rendering or saving. Blank values remain unknown. */
export function parseLot(input: unknown): Lot | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const d = input as Record<string, unknown>;
  const keys = ["reference", "supplier", "quantity", "unitPrice", "discount", "rate", "paidOn", "source"] as const;
  if (keys.some(k => typeof d[k] !== "string" || (d[k] as string).length > 2000) || !["BRL", "USD"].includes(String(d.currency))) return null;
  if (!Array.isArray(d.reviewed) || d.reviewed.length > 6 || new Set(d.reviewed).size !== d.reviewed.length || d.reviewed.some(c => !categories.includes(c))) return null;
  if (!Array.isArray(d.movements) || d.movements.length > 100) return null;
  if (d.supplierId !== undefined && (typeof d.supplierId !== "string" || (d.supplierId !== "" && !/^[0-9a-f-]{36}$/i.test(d.supplierId)))) return null;
  const movements: Movement[] = [];
  for (const item of d.movements) {
    if (!item || typeof item !== "object" || ["id", "category", "amount", "rate", "paidOn", "source", "allocation"].some(k => typeof item[k] !== "string" || item[k].length > 2000) || !categories.includes(item.category) || !["BRL", "USD"].includes(item.currency)) return null;
    movements.push({ id: item.id, category: item.category, amount: item.amount, rate: item.rate, paidOn: item.paidOn, source: item.source, allocation: item.allocation, currency: item.currency });
  }
  if (new Set(movements.map(m => m.id)).size !== movements.length) return null;
  return { ...Object.fromEntries(keys.map(k => [k, (d[k] as string).trim()])), currency: d.currency, reviewed: d.reviewed, movements, ...(d.supplierId !== undefined ? { supplierId: d.supplierId } : {}) } as Lot;
}

export function calculate(lot: Lot) {
  const errors: string[] = [], pending: string[] = [];
  const numeric = (value: string, label: string, max: number, integer = false) => {
    const n = number(value);
    if (value !== "" && (n === null || n > max || (integer && (!Number.isInteger(n) || n <= 0)))) { errors.push(`${label}: valor inválido.`); return null; }
    return n;
  };
  const payment = (p: Omit<Payment, "amount">, label: string) => {
    if (!p.paidOn) pending.push(`${label}: data do pagamento`);
    else if (!dateValid(p.paidOn)) errors.push(`${label}: data inválida.`);
    if (!p.source.trim()) pending.push(`${label}: comprovante ou referência`);
    if (p.currency === "USD") {
      const r = numeric(p.rate, `${label}: câmbio`, 10000);
      if (r === null) pending.push(`${label}: câmbio do dia do pagamento`);
      else if (r <= 0) errors.push(`${label}: o câmbio deve ser maior que zero.`);
      return r && r > 0 ? r : null;
    }
    return 1;
  };
  if (!lot.supplier.trim()) pending.push("Fornecedor");
  const qty = numeric(lot.quantity, "Quantidade", 1000000, true);
  const price = numeric(lot.unitPrice, "Preço unitário", 100000000);
  for (const [label, value] of [["Preço unitário", lot.unitPrice], ["Desconto", lot.discount], ...lot.movements.map(m => [m.category, m.amount])]) {
    if (value && !/^\d+(\.\d{1,2})?$/.test(value)) errors.push(`${label}: use no máximo duas casas decimais.`);
  }
  for (const p of [lot, ...lot.movements]) if (p.currency === "USD" && p.rate && !/^\d+(\.\d{1,6})?$/.test(p.rate)) errors.push("Câmbio: use no máximo seis casas decimais.");
  const discount = numeric(lot.discount, "Desconto total", 100000000);
  if (qty === null) pending.push("Quantidade comprada");
  if (price === null) pending.push("Preço de compra por unidade");
  if (discount === null) pending.push("Desconto total (informe 0 se não houve)");
  const rate = payment(lot, "Compra");
  const original = qty !== null && price !== null && discount !== null ? cents(price) * qty - cents(discount) : null;
  if (original !== null && !Number.isSafeInteger(original)) errors.push("O valor de compra excede o limite suportado.");
  if (original !== null && original < 0) errors.push("O desconto não pode superar o valor da compra.");
  const purchase = original !== null && original >= 0 && Number.isSafeInteger(original) && rate !== null ? convertCents(original, rate) / 100 : null;
  let movementCents = 0;
  const movementValues: Record<string, number | null> = {};
  for (const m of lot.movements) {
    const label = m.category;
    const amount = numeric(m.amount, label, 100000000);
    if (amount === null) pending.push(`${label}: valor atribuído ao lote`);
    if (!m.allocation.trim()) pending.push(`${label}: critério de rateio`);
    const fx = payment(m, label);
    const converted = amount !== null && fx !== null ? convertCents(cents(amount), fx) : null;
    movementValues[m.id] = converted === null ? null : converted / 100;
    if (converted !== null) movementCents += converted;
  }
  for (const cat of categories) if (!lot.reviewed.includes(cat)) pending.push(`${cat}: concluir levantamento`);
  const knownTotal = (purchase === null ? 0 : cents(purchase)) + movementCents;
  if (!Number.isSafeInteger(knownTotal) || knownTotal > 100000000000000) errors.push("O total excede o limite suportado para um lote.");
  const hasKnown = purchase !== null || Object.values(movementValues).some(v => v !== null);
  const complete = !errors.length && !pending.length;
  return { errors, pending, complete, purchase, movement: Object.values(movementValues).some(v => v !== null) || (lot.reviewed.length === 6 && !lot.movements.length) ? movementCents / 100 : null, movementValues,
    knownTotal: hasKnown ? knownTotal / 100 : null,
    total: complete ? knownTotal / 100 : null,
    unit: complete && qty !== null && qty > 0 ? knownTotal / 100 / qty : null };
}
export function schemaMissing(error: { code?: string } | null) { return !!error && ["42P01", "PGRST205"].includes(error.code ?? ""); }
