-- Parte 1. Un pedido cancelado no es una venta: su fila en ventas_plataforma pasa a 0 mientras esté
-- cancelado y vuelve a los valores del pedido si se reactiva. No se borra nada.
-- El pedido conserva su monto y comisión originales; solo cambia lo que suma Finanzas.

create or replace function public.handle_pedido_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  old_efecto integer := 0;
  new_efecto integer := 0;
begin
  if old.producto_id is not null and old.estado <> 'cancelado' then
    old_efecto := old.cantidad;
  end if;

  if new.producto_id is not null and new.estado <> 'cancelado' then
    new_efecto := new.cantidad;
  end if;

  if old.producto_id is not null and old_efecto <> 0 then
    update public.productos set stock = stock + old_efecto where id = old.producto_id;
  end if;

  if new.producto_id is not null and new_efecto <> 0 then
    update public.productos set stock = stock - new_efecto where id = new.producto_id;
  end if;

  update public.ventas_plataforma
  set
    plataforma_id = new.plataforma_id,
    fecha = new.fecha,
    monto = case when new.estado = 'cancelado' then 0 else new.monto end,
    comision_plataforma = case when new.estado = 'cancelado' then 0 else new.comision_plataforma end,
    pedidos = case when new.estado = 'cancelado' then 0 else new.cantidad end
  where pedido_id = new.id;

  return new;
end;
$$;

-- Parte 1b. Un pedido que nace cancelado también registra su venta en 0.
-- El pedido conserva sus valores originales.

create or replace function public.handle_pedido_insert()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.producto_id is not null and new.estado <> 'cancelado' then
    update public.productos
    set stock = stock - new.cantidad
    where id = new.producto_id;
  end if;

  insert into public.ventas_plataforma (
    plataforma_id, fecha, monto, comision_plataforma, pedidos, origen, registrado_por, pedido_id
  )
  values (
    new.plataforma_id,
    new.fecha,
    case when new.estado = 'cancelado' then 0 else new.monto end,
    case when new.estado = 'cancelado' then 0 else new.comision_plataforma end,
    case when new.estado = 'cancelado' then 0 else new.cantidad end,
    'manual',
    new.registrado_por,
    new.id
  );

  return new;
end;
$$;

-- Alinea lo que ya estuviera cancelado antes de este cambio.
update public.ventas_plataforma v
set monto = 0, comision_plataforma = 0, pedidos = 0
from public.pedidos p
where v.pedido_id = p.id and p.estado = 'cancelado';

-- Parte 2. Excluir un pedido: hoy su venta queda huérfana (pedido_id en null) y sigue sumando
-- en Finanzas, y el stock no vuelve. Al excluir, se retira su venta y se devuelve el stock
-- si el pedido no estaba cancelado (los cancelados ya lo devolvieron).

create or replace function public.handle_pedido_delete()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if old.producto_id is not null and old.estado <> 'cancelado' then
    update public.productos set stock = stock + old.cantidad where id = old.producto_id;
  end if;

  delete from public.ventas_plataforma where pedido_id = old.id;

  return old;
end;
$$;

drop trigger if exists on_pedido_delete on public.pedidos;
create trigger on_pedido_delete
  before delete on public.pedidos
  for each row execute procedure public.handle_pedido_delete();
