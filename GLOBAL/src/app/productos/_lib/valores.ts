type Valor = number | string | null | undefined;

export function valorPositivo(value: Valor): number | null {
  if (value == null || String(value).trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function calcularMargem(preco: Valor, custo: Valor) {
  const venda = valorPositivo(preco);
  const compra = valorPositivo(custo);
  if (venda === null || compra === null) return null;
  const valor = venda - compra;
  return { valor, percentual: (valor / venda) * 100 };
}

export function resumirMargens(produtos: { precio: Valor; costo: Valor }[]) {
  // O esquema atual usa zero para custo/preço ainda não cadastrado.
  const completos = produtos.filter((p) => calcularMargem(p.precio, p.costo) !== null);
  const preco = completos.reduce((total, p) => total + Number(p.precio), 0);
  const custo = completos.reduce((total, p) => total + Number(p.costo), 0);
  return {
    incluidos: completos.length,
    pendentes: produtos.length - completos.length,
    percentual: completos.length ? ((preco - custo) / preco) * 100 : null,
  };
}

export function validarFicha(input: {
  nombre: string; precio: string; costo: string; monedaCosto: "BRL" | "USD";
  costoUsd: string; tipoCambioCosto: string; stock: string;
}) {
  if (!input.nombre.trim()) return "Informe o nome do produto.";
  if (!input.precio.trim() || !Number.isFinite(Number(input.precio)) || Number(input.precio) < 0)
    return "Informe um preço válido. Use zero se ainda estiver pendente.";
  if (!Number.isFinite(Number(input.stock)) || !Number.isInteger(Number(input.stock)))
    return "Informe o estoque em unidades inteiras.";
  if (input.monedaCosto === "BRL") {
    if (!Number.isFinite(Number(input.costo)) || Number(input.costo) < 0)
      return "Informe um custo válido ou deixe em branco.";
  } else if (input.costoUsd.trim() || input.tipoCambioCosto.trim()) {
    if (valorPositivo(input.costoUsd) === null || valorPositivo(input.tipoCambioCosto) === null)
      return "Informe o custo em US$ e o câmbio, ambos maiores que zero, ou deixe os dois em branco.";
    if (!Number.isFinite(Number(input.costoUsd) * Number(input.tipoCambioCosto)))
      return "O custo convertido é inválido.";
  }
  return null;
}
