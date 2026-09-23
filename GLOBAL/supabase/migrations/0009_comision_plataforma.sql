-- Distingue monto bruto (lo que paga el cliente) de monto neto (lo que realmente se recibe,
-- tras descontar comisiones/tarifas de la plataforma)

alter table public.pedidos add column comision_plataforma numeric(12, 2) not null default 0;
alter table public.pedidos add column monto_neto numeric(12, 2) generated always as (monto - comision_plataforma) stored;

alter table public.ventas_plataforma add column comision_plataforma numeric(12, 2) not null default 0;
alter table public.ventas_plataforma add column monto_neto numeric(12, 2) generated always as (monto - comision_plataforma) stored;

-- Actualiza el trigger de creación de pedido para propagar bruto/neto a la venta
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
    new.plataforma_id, new.fecha, new.monto, new.comision_plataforma, new.cantidad, 'manual', new.registrado_por, new.id
  );

  return new;
end;
$$;
