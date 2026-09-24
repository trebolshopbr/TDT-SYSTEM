-- Global Producto -> Datos. Solo lectura. No aplica migraciones ni crea compras.
-- Ejecutar bloque 1 primero. Si faltan objetos, no ejecutar bloque 2.
-- No sustituye las pruebas de acceso y guardado con sesión de socio.

-- BLOQUE 1: estructura y permisos esperados.
with objects as (
  select to_regclass('public.compras_lotes') as lotes,
         to_regclass('public.compras_lotes_revisiones') as historial
), checks as (
  select 'Tabla de lotes' as comprobacion, lotes is not null as correcto from objects
  union all select 'Tabla de revisiones', historial is not null from objects
  union all select 'RLS en ambas tablas',
    (select count(*)=2 from pg_class where oid in (lotes,historial) and relrowsecurity) from objects
  union all select 'Socio puede leer e insertar lotes',
    coalesce(has_table_privilege('authenticated',lotes,'SELECT') and has_table_privilege('authenticated',lotes,'INSERT'),false) from objects
  union all select 'Socio puede editar datos y revision',
    coalesce(has_column_privilege('authenticated',lotes,'datos','UPDATE') and has_column_privilege('authenticated',lotes,'revision','UPDATE') and has_column_privilege('authenticated',lotes,'atualizado_por','UPDATE'),false) from objects
  union all select 'Identidad protegida contra edicion directa',
    coalesce(not has_column_privilege('authenticated',lotes,'producto_id','UPDATE') and not has_column_privilege('authenticated',lotes,'registrado_por','UPDATE'),false) from objects
  union all select 'Socio no puede borrar lotes', coalesce(not has_table_privilege('authenticated',lotes,'DELETE'),false) from objects
  union all select 'Historial de solo lectura para socios',
    coalesce(has_table_privilege('authenticated',historial,'SELECT') and not has_table_privilege('authenticated',historial,'INSERT') and not has_table_privilege('authenticated',historial,'UPDATE') and not has_table_privilege('authenticated',historial,'DELETE'),false) from objects
  union all select 'Anon sin acceso a lotes ni historial',
    coalesce(not has_table_privilege('anon',lotes,'SELECT,INSERT,UPDATE,DELETE') and not has_table_privilege('anon',historial,'SELECT,INSERT,UPDATE,DELETE'),false) from objects
  union all select 'Triggers de revision e historial activos',
    (select count(*)=2 from pg_trigger where tgrelid=lotes and not tgisinternal and tgenabled='O' and tgname in ('compras_lotes_revision','compras_lotes_auditoria')) from objects
)
select comprobacion, case when correcto then 'PASS' else 'PENDIENTE / REVISAR' end as resultado from checks;

-- BLOQUE 2: contrato de datos. Requiere la migración ya instalada.
-- Valores exclusivamente de prueba, calculados en memoria de la consulta.
with base as (
  select '{"reference":"PRUEBA SIN GUARDAR","supplier":"","quantity":"","unitPrice":"","discount":"","currency":"BRL","rate":"","paidOn":"","source":"","reviewed":[],"movements":[]}'::jsonb as d
), cases as (
  select 'Borrador con pendientes' as comprobacion, d, true as esperado from base
  union all select 'Cero declarado', d || '{"quantity":"1","unitPrice":"0","discount":"0"}',true from base
  union all select 'Cantidad negativa', d || '{"quantity":"-1"}',false from base
  union all select 'Cantidad fraccionaria', d || '{"quantity":"1.5"}',false from base
  union all select 'Descuento superior a compra', d || '{"quantity":"1","unitPrice":"10","discount":"11"}',false from base
  union all select 'Fecha inexistente', d || '{"paidOn":"2026-02-30"}',false from base
  union all select 'USD sin cambio conserva pendiente', d || '{"currency":"USD","rate":""}',true from base
  union all select 'Cambio cero invalido', d || '{"currency":"USD","rate":"0"}',false from base
  union all select 'Categoria inventada', d || '{"reviewed":["Otra"]}',false from base
  union all select 'Categoria duplicada', d || '{"reviewed":["Transporte","Transporte"]}',false from base
  union all select 'Importe con exceso de decimales', d || '{"unitPrice":"1.001"}',false from base
)
select comprobacion,
  case when public.compra_lote_datos_validos(d)=esperado then 'PASS' else 'FAIL' end as resultado
from cases;
