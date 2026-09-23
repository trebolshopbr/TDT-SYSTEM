-- Campos de precio estimado en las sugerencias de productos

alter table public.propuestas_productos add column costo_estimado numeric(12, 2);
alter table public.propuestas_productos add column precio_venta_estimado numeric(12, 2);
alter table public.propuestas_productos add column precio_competencia numeric(12, 2);
