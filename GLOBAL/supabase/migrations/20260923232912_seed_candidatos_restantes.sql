-- Candidatos históricos restantes de G1.
-- Se cargan como investigación, sin afirmar proveedor, costo o autorización de compra.

insert into public.propuestas_productos (nombre_producto, segmento, notas, propuesto_por)
select
  'Mini Impressora Térmica 57 mm',
  'Eletrônicos / Impressão',
  'PESQUISA CONDICIONAL. Demanda histórica observada, mas faltam equivalência exata do SKU, kit, homologação aplicável e custo total real.',
  id
from public.profiles
where rol = 'admin'
  and not exists (select 1 from public.propuestas_productos where nombre_producto = 'Mini Impressora Térmica 57 mm')
limit 1;

insert into public.propuestas_productos (nombre_producto, segmento, notas, propuesto_por)
select
  'Seladora a Vácuo Doméstica',
  'Utilidades Domésticas',
  'PESQUISA PAUSADA. O custo preliminar pode consumir toda a margem. Reabrir somente com variante equivalente e economics materialmente melhores.',
  id
from public.profiles
where rol = 'admin'
  and not exists (select 1 from public.propuestas_productos where nombre_producto = 'Seladora a Vácuo Doméstica')
limit 1;

insert into public.propuestas_productos (nombre_producto, segmento, notas, propuesto_por)
select
  'Mini Compressor Automotivo 12 V',
  'Acessórios Automotivos',
  'PESQUISA PAUSADA. Falta confirmar equivalência de vazão, pressão, peso, ciclo de trabalho, MOQ de teste e custo total real.',
  id
from public.profiles
where rol = 'admin'
  and not exists (select 1 from public.propuestas_productos where nombre_producto = 'Mini Compressor Automotivo 12 V')
limit 1;
