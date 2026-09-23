-- Módulo de Productos: catálogo base para inventario y pedidos

create table public.productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  sku text unique,
  precio numeric(12, 2) not null default 0,
  costo numeric(12, 2) not null default 0,
  stock integer not null default 0,
  activo boolean not null default true,
  notas text,
  registrado_por uuid not null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.productos enable row level security;

create policy "productos_select_all"
  on public.productos for select
  to authenticated
  using (true);

create policy "productos_insert_authenticated"
  on public.productos for insert
  to authenticated
  with check (registrado_por = auth.uid());

create policy "productos_update_own_or_admin"
  on public.productos for update
  to authenticated
  using (registrado_por = auth.uid() or public.is_admin());

create policy "productos_delete_admin"
  on public.productos for delete
  to authenticated
  using (public.is_admin());

create trigger set_productos_updated_at
  before update on public.productos
  for each row execute procedure public.set_updated_at();

create index productos_nombre_idx on public.productos (nombre);
