-- Aplicada el 2026-09-24 por autorización explícita de TT.
-- Versión remota: 20260924063146 (compras_lotes).
-- No modifica productos.costo, stock, pedidos, ventas_plataforma ni gastos.
begin;
create function public.compra_lote_datos_validos(d jsonb)
returns boolean language plpgsql immutable set search_path = '' as $$
declare k text; v jsonb; m jsonb; n numeric; total numeric := 0;
  cats text[] := array['Transporte','Importação','Impostos e tarifas','Armazenamento','Seguro','Intermediários'];
begin
  if jsonb_typeof(d) is distinct from 'object' then return false; end if;
  foreach k in array array['reference','supplier','quantity','unitPrice','discount','rate','paidOn','source','currency'] loop
    if jsonb_typeof(d->k) is distinct from 'string' or length(d->>k) > 2000 then return false; end if;
  end loop;
  if d->>'currency' not in ('BRL','USD') then return false; end if;
  foreach k in array array['quantity','unitPrice','discount','rate'] loop
    if d->>k <> '' then
      if d->>k !~ '^\d+(\.\d{1,6})?$' then return false; end if;
      n := (d->>k)::numeric;
      if n > 100000000 or (k = 'quantity' and (n < 1 or n > 1000000 or trunc(n) <> n)) or (k = 'rate' and (n <= 0 or n > 10000)) then return false; end if;
      if k in ('unitPrice','discount') and d->>k !~ '^\d+(\.\d{1,2})?$' then return false; end if;
    end if;
  end loop;
  if d->>'paidOn' <> '' and ((d->>'paidOn') !~ '^\d{4}-\d{2}-\d{2}$' or to_char((d->>'paidOn')::date,'YYYY-MM-DD') <> d->>'paidOn') then return false; end if;
  if d->>'quantity' <> '' and d->>'unitPrice' <> '' and d->>'discount' <> '' then
    n := (d->>'quantity')::numeric * (d->>'unitPrice')::numeric - (d->>'discount')::numeric;
    if n < 0 then return false; end if;
    if d->>'currency' = 'BRL' or d->>'rate' <> '' then
      total := round(n * case when d->>'currency'='USD' then (d->>'rate')::numeric else 1 end, 2);
    end if;
  end if;
  if jsonb_typeof(d->'reviewed') is distinct from 'array' or jsonb_array_length(d->'reviewed') > 6 then return false; end if;
  for v in select value from jsonb_array_elements(d->'reviewed') loop
    if jsonb_typeof(v) <> 'string' or not ((v #>> '{}') = any(cats)) then return false; end if;
  end loop;
  if (select count(distinct value) from jsonb_array_elements(d->'reviewed')) <> jsonb_array_length(d->'reviewed') then return false; end if;
  if jsonb_typeof(d->'movements') is distinct from 'array' or jsonb_array_length(d->'movements') > 100 then return false; end if;
  for m in select value from jsonb_array_elements(d->'movements') loop
    if jsonb_typeof(m) is distinct from 'object' then return false; end if;
    foreach k in array array['id','category','amount','currency','rate','paidOn','source','allocation'] loop
      if jsonb_typeof(m->k) is distinct from 'string' or length(m->>k) > 2000 then return false; end if;
    end loop;
    if m->>'id' = '' or not (m->>'category' = any(cats)) or m->>'currency' not in ('BRL','USD') then return false; end if;
    if m->>'amount' <> '' and (m->>'amount' !~ '^\d+(\.\d{1,2})?$' or (m->>'amount')::numeric > 100000000) then return false; end if;
    if m->>'rate' <> '' and (m->>'rate' !~ '^\d+(\.\d{1,6})?$' or (m->>'rate')::numeric <= 0 or (m->>'rate')::numeric > 10000) then return false; end if;
    if m->>'paidOn' <> '' and ((m->>'paidOn') !~ '^\d{4}-\d{2}-\d{2}$' or to_char((m->>'paidOn')::date,'YYYY-MM-DD') <> m->>'paidOn') then return false; end if;
    if m->>'amount' <> '' and (m->>'currency'='BRL' or m->>'rate' <> '') then
      total := total + round((m->>'amount')::numeric * case when m->>'currency'='USD' then (m->>'rate')::numeric else 1 end, 2);
    end if;
  end loop;
  if (select count(distinct value->>'id') from jsonb_array_elements(d->'movements')) <> jsonb_array_length(d->'movements') then return false; end if;
  return total <= 1000000000000;
exception when others then return false;
end;
$$;
create table public.compras_lotes (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references public.productos(id) on delete restrict,
  datos jsonb not null check (public.compra_lote_datos_validos(datos)),
  revision integer not null default 1 check (revision > 0),
  registrado_por uuid not null references public.profiles(id) on delete restrict,
  atualizado_por uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index compras_lotes_producto_idx on public.compras_lotes(producto_id);
create index compras_lotes_updated_idx on public.compras_lotes(updated_at desc);
create index compras_lotes_autor_idx on public.compras_lotes(registrado_por);
create index compras_lotes_editor_idx on public.compras_lotes(atualizado_por);
create table public.compras_lotes_revisiones (
  lote_id uuid not null references public.compras_lotes(id) on delete restrict,
  revision integer not null, datos jsonb not null,
  autor uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(), primary key (lote_id, revision)
);
create index compras_lotes_revisiones_autor_idx on public.compras_lotes_revisiones(autor);
alter table public.compras_lotes enable row level security;
alter table public.compras_lotes_revisiones enable row level security;
revoke all on public.compras_lotes, public.compras_lotes_revisiones from anon, authenticated;
grant select, insert on public.compras_lotes to authenticated;
grant update (datos, atualizado_por, revision) on public.compras_lotes to authenticated;
grant select on public.compras_lotes_revisiones to authenticated;
create policy compras_lotes_read on public.compras_lotes for select to authenticated using (true);
create policy compras_lotes_insert on public.compras_lotes for insert to authenticated
  with check (registrado_por = (select auth.uid()) and atualizado_por = (select auth.uid()) and revision = 1);
-- Colaboración de socios, igual que productos (0017). Autor original protegido.
create policy compras_lotes_update on public.compras_lotes for update to authenticated
  using (true) with check (atualizado_por = (select auth.uid()));
create policy compras_lotes_history_read on public.compras_lotes_revisiones for select to authenticated using (true);
create function public.compra_lote_guardar_revision()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    if new.revision <> old.revision + 1 then raise exception 'Revisão desatualizada'; end if;
    if new.id <> old.id or new.producto_id <> old.producto_id or new.registrado_por <> old.registrado_por then raise exception 'Identidade do lote não pode mudar'; end if;
    new.created_at := old.created_at;
  else new.created_at := now(); end if;
  new.updated_at := now(); return new;
end;
$$;
create trigger compras_lotes_revision before insert or update on public.compras_lotes
  for each row execute function public.compra_lote_guardar_revision();
-- Único writer del historial. Trigger sin SQL dinámico ni parámetros externos.
create function public.compra_lote_auditar()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.compras_lotes_revisiones(lote_id, revision, datos, autor)
    values (new.id, new.revision, new.datos, new.atualizado_por);
  return new;
end;
$$;
revoke all on function public.compra_lote_auditar() from public, anon, authenticated;
revoke all on function public.compra_lote_guardar_revision() from public, anon, authenticated;
create trigger compras_lotes_auditoria after insert or update on public.compras_lotes
  for each row execute function public.compra_lote_auditar();
comment on table public.compras_lotes is 'Borradores de compra por producto/lote. No son costo de venta ni stock. Texto vacío significa pendiente; 0 solo declarado explícitamente.';
comment on table public.compras_lotes_revisiones is 'Versiones inmutables para auditoría y futura referencia histórica de Operación.';
commit;
