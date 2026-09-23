-- Soporte de moneda original (USD) + tipo de cambio del día, para gastos y costo de productos.
-- El campo existente (monto / costo) sigue siendo la fuente de verdad en BRL para todos los
-- cálculos; estos campos nuevos son metadata para no perder el detalle de origen.

alter table public.gastos add column moneda text not null default 'BRL' check (moneda in ('BRL', 'USD'));
alter table public.gastos add column monto_original numeric(12, 2);
alter table public.gastos add column tipo_cambio numeric(10, 4);

alter table public.productos add column moneda_costo text not null default 'BRL' check (moneda_costo in ('BRL', 'USD'));
alter table public.productos add column costo_original numeric(12, 2);
alter table public.productos add column tipo_cambio_costo numeric(10, 4);
