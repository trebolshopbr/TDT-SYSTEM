-- Módulo de Finanzas: plataformas de venta, ventas por plataforma y cierre de caja diario

create table public.plataformas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  tipo text not null default 'marketplace' check (tipo in ('marketplace', 'tienda_propia', 'red_social')),
  activa boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.plataformas enable row level security;

create policy "plataformas_select_all"
  on public.plataformas for select
  to authenticated
  using (true);

create policy "plataformas_write_admin"
  on public.plataformas for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

insert into public.plataformas (nombre, tipo, activa) values
  ('Shopee', 'marketplace', true),
  ('TikTok Shop', 'marketplace', true),
  ('Mercado Livre', 'marketplace', true),
  ('Tienda Virtual', 'tienda_propia', false);

-- Ventas registradas por plataforma y día
create table public.ventas_plataforma (
  id uuid primary key default gen_random_uuid(),
  plataforma_id uuid not null references public.plataformas(id) on delete restrict,
  fecha date not null default current_date,
  monto numeric(12, 2) not null default 0,
  pedidos integer not null default 0,
  origen text not null default 'manual' check (origen in ('manual', 'api')),
  notas text,
  registrado_por uuid not null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ventas_plataforma enable row level security;

create policy "ventas_select_all"
  on public.ventas_plataforma for select
  to authenticated
  using (true);

create policy "ventas_insert_own"
  on public.ventas_plataforma for insert
  to authenticated
  with check (registrado_por = auth.uid());

create policy "ventas_update_own_or_admin"
  on public.ventas_plataforma for update
  to authenticated
  using (registrado_por = auth.uid() or public.is_admin());

create policy "ventas_delete_admin"
  on public.ventas_plataforma for delete
  to authenticated
  using (public.is_admin());

create trigger set_ventas_updated_at
  before update on public.ventas_plataforma
  for each row execute procedure public.set_updated_at();

-- Cierre de caja diario (resumen general del día)
create table public.cierres_caja (
  id uuid primary key default gen_random_uuid(),
  fecha date not null default current_date,
  efectivo_inicial numeric(12, 2) not null default 0,
  efectivo_final numeric(12, 2) not null default 0,
  total_ventas numeric(12, 2) not null default 0,
  total_gastos numeric(12, 2) not null default 0,
  notas text,
  registrado_por uuid not null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cierres_caja enable row level security;

create policy "cierres_select_all"
  on public.cierres_caja for select
  to authenticated
  using (true);

create policy "cierres_insert_own"
  on public.cierres_caja for insert
  to authenticated
  with check (registrado_por = auth.uid());

create policy "cierres_update_own_or_admin"
  on public.cierres_caja for update
  to authenticated
  using (registrado_por = auth.uid() or public.is_admin());

create policy "cierres_delete_admin"
  on public.cierres_caja for delete
  to authenticated
  using (public.is_admin());

create trigger set_cierres_updated_at
  before update on public.cierres_caja
  for each row execute procedure public.set_updated_at();

create index ventas_plataforma_fecha_idx on public.ventas_plataforma (fecha desc);
create index cierres_caja_fecha_idx on public.cierres_caja (fecha desc);
