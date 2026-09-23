-- Método de pago en pedidos, para conciliar con cada plataforma

create type public.metodo_pago as enum ('pix', 'credito', 'debito', 'transferencia', 'efectivo', 'otro');

alter table public.pedidos add column metodo_pago public.metodo_pago;
