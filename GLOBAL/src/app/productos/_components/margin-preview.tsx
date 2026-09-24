import { calcularMargem, valorPositivo } from "../_lib/valores";

export default function MarginPreview({ preco, custo }: { preco: string; custo: number }) {
  const margem = calcularMargem(preco, custo);
  return (
    <div className="mb-4 rounded-md border border-neutral-800 p-3 text-sm" aria-live="polite">
      <p className="font-medium">Margem de compra e venda</p>
      <p className="mt-1">
        {margem ? `${margem.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} · ${margem.percentual.toFixed(1)}%` :
          [valorPositivo(preco) === null ? "Preço pendente" : null, valorPositivo(custo) === null ? "Custo pendente" : null].filter(Boolean).join(" · ")}
      </p>
      <p className="mt-2 text-xs text-neutral-400">Diferença entre venda e compra, com percentual sobre a venda. Não desconta comissões, frete, impostos ou outras despesas.</p>
    </div>
  );
}
