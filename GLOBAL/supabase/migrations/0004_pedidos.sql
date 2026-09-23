-- Módulo de Pedidos: seguimiento de pedidos por plataforma y estado

create type public.estado_pedido as enum ('pendiente', 'enviado', 'entregado', 'cancelado');

create table public.pedidos (
  id uuid primary key default gen_random_uuid(),
  plataforma_id uuid not null references public.plataformas(id) on delete restrict,
  fecha date not null default current_date,
  cliente_nombre text not null,
  cliente_contacto text,
  monto numeric(12, 2) not null default 0,
  estado public.estado_pedido not null default 'pendiente',
  notas text,
  registrado_por uuid not null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pedidos enable row level security;

create policy "pedidos_select_all"
  on public.pedidos for select
  to authenticated
  using (true);

create policy "pedidos_insert_own"
  on public.pedidos for insert
  to authenticated
  with check (registrado_por = auth.uid());

create policy "pedidos_update_own_or_admin"
  on public.pedidos for update
  to authenticated
  using (registrado_por = auth.uid() or public.is_admin());

create policy "pedidos_delete_admin"
  on public.pedidos for delete
  to authenticated
  using (public.is_admin());

create trigger set_pedidos_updated_at
  before update on public.pedidos
  for each row execute procedure public.set_updated_at();

create index pedidos_fecha_idx on public.pedidos (fecha desc);
create index pedidos_estado_idx on public.pedidos (estado);
