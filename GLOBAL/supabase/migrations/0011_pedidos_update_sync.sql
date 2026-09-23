-- Permite editar pedidos ya creados manteniendo sincronizados stock y ventas_plataforma

drop trigger if exists on_pedido_estado_change on public.pedidos;
drop function if exists public.handle_pedido_estado_change();

create function public.handle_pedido_update()
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
    monto = new.monto,
    comision_plataforma = new.comision_plataforma,
    pedidos = new.cantidad
  where pedido_id = new.id;

  return new;
end;
$$;

create trigger on_pedido_update
  after update of producto_id, cantidad, monto, comision_plataforma, plataforma_id, fecha, estado
  on public.pedidos
  for each row execute procedure public.handle_pedido_update();
