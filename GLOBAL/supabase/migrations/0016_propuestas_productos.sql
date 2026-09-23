-- Propuestas de productos: los socios sugieren productos para vender

create table public.propuestas_productos (
  id uuid primary key default gen_random_uuid(),
  nombre_producto text not null,
  segmento text not null,
  link_proveedor text,
  notas text,
  propuesto_por uuid not null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.propuestas_productos enable row level security;

create policy "propuestas_select_all"
  on public.propuestas_productos for select
  to authenticated
  using (true);

create policy "propuestas_insert_own"
  on public.propuestas_productos for insert
  to authenticated
  with check (propuesto_por = auth.uid());

create policy "propuestas_update_own_or_admin"
  on public.propuestas_productos for update
  to authenticated
  using (propuesto_por = auth.uid() or public.is_admin());

create policy "propuestas_delete_own_or_admin"
  on public.propuestas_productos for delete
  to authenticated
  using (propuesto_por = auth.uid() or public.is_admin());

create trigger set_propuestas_updated_at
  before update on public.propuestas_productos
  for each row execute procedure public.set_updated_at();

create index propuestas_created_at_idx on public.propuestas_productos (created_at desc);
