-- Carga inicial de sugerencias de productos candidatos investigados con links a 1688 y Mercado Livre

insert into public.propuestas_productos (
  nombre_producto,
  segmento,
  link_proveedor,
  costo_estimado,
  precio_venta_estimado,
  precio_competencia,
  notas,
  propuesto_por
)
select
  'Suporte Magnético Automotivo para Celular (Pack 2)',
  'Acessórios Automotivos',
  'https://detail.1688.com/offer/596058718145.html',
  6.53,
  34.00,
  34.00,
  'Suporte magnético com ímã de neodímio para saída de ar veicular. MOQ 2 unidades na 1688.',
  id
from public.profiles
where rol = 'admin'
limit 1;

insert into public.propuestas_productos (
  nombre_producto,
  segmento,
  link_proveedor,
  costo_estimado,
  precio_venta_estimado,
  precio_competencia,
  notas,
  propuesto_por
)
select
  'Papa-Bolinhas Portátil USB Recarregável',
  'Utilidades Domésticas',
  'https://detail.1688.com/offer/695037120016.html',
  6.88,
  29.89,
  29.89,
  'Removedor elétrico de pelos e bolinhas de roupas com lâminas rotativas e bateria recarregável USB.',
  id
from public.profiles
where rol = 'admin'
limit 1;
