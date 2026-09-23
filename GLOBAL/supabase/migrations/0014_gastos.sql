-- Módulo de Gastos: gastos reales de la empresa, con categoría y detalle

create table public.gastos (
  id uuid primary key default gen_random_uuid(),
  fecha date not null default current_date,
  monto numeric(12, 2) not null default 0,
  categoria text not null default 'otro',
  descripcion text,
  registrado_por uuid not null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.gastos enable row level security;

create policy "gastos_select_all"
  on public.gastos for select
  to authenticated
  using (true);

create policy "gastos_insert_own"
  on public.gastos for insert
  to authenticated
  with check (registrado_por = auth.uid());

create policy "gastos_update_own_or_admin"
  on public.gastos for update
  to authenticated
  using (registrado_por = auth.uid() or public.is_admin());

create policy "gastos_delete_admin"
  on public.gastos for delete
  to authenticated
  using (public.is_admin());

create trigger set_gastos_updated_at
  before update on public.gastos
  for each row execute procedure public.set_updated_at();

create index gastos_fecha_idx on public.gastos (fecha desc);
