-- Conecta Pedidos con Productos (stock) y Ventas por plataforma

alter table public.pedidos add column producto_id uuid references public.productos(id) on delete set null;
alter table public.pedidos add column cantidad integer not null default 1;
alter table public.ventas_plataforma add column pedido_id uuid references public.pedidos(id) on delete set null;

-- Al crear un pedido con producto: descuenta stock y registra la venta automáticamente
create function public.handle_pedido_insert()
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
    plataforma_id, fecha, monto, pedidos, origen, registrado_por, pedido_id
  )
  values (
    new.plataforma_id, new.fecha, new.monto, new.cantidad, 'manual', new.registrado_por, new.id
  );

  return new;
end;
$$;

create trigger on_pedido_insert
  after insert on public.pedidos
  for each row execute procedure public.handle_pedido_insert();

-- Si un pedido se cancela o se reactiva: ajusta el stock del producto
create function public.handle_pedido_estado_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.producto_id is not null and old.estado <> new.estado then
    if new.estado = 'cancelado' and old.estado <> 'cancelado' then
      update public.productos set stock = stock + old.cantidad where id = new.producto_id;
    elsif old.estado = 'cancelado' and new.estado <> 'cancelado' then
      update public.productos set stock = stock - new.cantidad where id = new.producto_id;
    end if;
  end if;

  return new;
end;
$$;

create trigger on_pedido_estado_change
  after update of estado on public.pedidos
  for each row execute procedure public.handle_pedido_estado_change();
