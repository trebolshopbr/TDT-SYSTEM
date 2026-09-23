import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, getSessionUser } from "@/lib/supabase/server";

function formatMoney(n: number) {
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

type Producto = {
  id: string;
  nombre: string;
  sku: string | null;
  precio: number;
  stock: number;
  activo: boolean;
  imagen_url: string | null;
  plataformas: { nombre: string } | null;
};

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ canal?: string }>;
}) {
  const { canal } = await searchParams;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const [{ data: productosData }, { data: plataformas }] = await Promise.all([
    supabase
      .from("productos")
      .select("id, nombre, sku, precio, stock, activo, imagen_url, plataforma_id, plataformas(nombre)")
      .eq("activo", true)
      .order("nombre"),
    supabase.from("plataformas").select("id, nombre").order("nombre"),
  ]);

  const todos = (productosData ?? []) as unknown as (Producto & { plataforma_id: string | null })[];
  const productos = canal ? todos.filter((p) => p.plataforma_id === canal) : todos;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mb-1 text-2xl font-semibold">Catálogo</h1>
          <p className="text-sm text-neutral-400">
            {productos.length} produto{productos.length === 1 ? "" : "s"} ativo
            {productos.length === 1 ? "" : "s"}
          </p>
        </div>
        <Link
          href="/productos/nuevo"
          className="rounded-md bg-white px-3 py-2 text-sm font-medium text-black hover:bg-neutral-200"
        >
          + Novo produto
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/catalogo"
          className={`rounded-full border border-neutral-800 px-3 py-1.5 text-sm ${
            !canal ? "bg-white text-black" : "text-neutral-300 hover:bg-neutral-900"
          }`}
        >
          Todos
        </Link>
        {(plataformas ?? []).map((p) => (
          <Link
            key={p.id}
            href={`/catalogo?canal=${p.id}`}
            className={`rounded-full border border-neutral-800 px-3 py-1.5 text-sm ${
              canal === p.id ? "bg-white text-black" : "text-neutral-300 hover:bg-neutral-900"
            }`}
          >
            {p.nombre}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {productos.map((p) => (
          <Link
            key={p.id}
            href={`/productos/${p.id}`}
            className="group overflow-hidden rounded-xl border border-neutral-800 bg-black transition hover:border-neutral-600"
          >
            <div className="aspect-square bg-neutral-950">
              {p.imagen_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.imagen_url}
                  alt={p.nombre}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center font-mono text-xs uppercase tracking-widest text-neutral-600">
                  Sem foto
                </div>
              )}
            </div>
            <div className="p-3">
              <p className="mb-1 line-clamp-2 text-sm font-medium">{p.nombre}</p>
              <p className="text-base font-semibold">{formatMoney(Number(p.precio))}</p>
              <div className="mt-2 flex items-center justify-between text-xs text-neutral-500">
                <span>{p.plataformas?.nombre ?? "Sem canal"}</span>
                {p.sku && <span className="font-mono">{p.sku}</span>}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {!productos.length && (
        <div className="rounded-xl border border-neutral-800 p-8 text-center text-sm text-neutral-500">
          Nenhum produto neste filtro.
        </div>
      )}
    </main>
  );
}
