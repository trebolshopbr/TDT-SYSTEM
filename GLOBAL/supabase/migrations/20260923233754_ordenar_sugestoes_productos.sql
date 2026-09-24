-- Convierte Sugestiones en un flujo trazable de investigación y aprobación.

alter table public.propuestas_productos
  add column estado text not null default 'por_investigar'
    check (estado in ('por_investigar', 'em_analise', 'aprovado', 'descartado')),
  add column nivel_evidencia text not null default 'pendente'
    check (nivel_evidencia in ('pendente', 'referencia', 'verificado')),
  add column imagem_referencias text[] not null default '{}',
  add column proximo_passo text,
  add column ordem integer,
  add column producto_id uuid unique references public.productos(id) on delete set null;

create index propuestas_estado_ordem_idx
  on public.propuestas_productos (estado, ordem, created_at);

update public.propuestas_productos
set
  ordem = 1,
  estado = 'em_analise',
  nivel_evidencia = 'referencia',
  proximo_passo = 'Confirmar o modelo exato, o custo total importado e a demanda antes de aprovar.'
where nombre_producto = 'Suporte Magnético Automotivo para Celular (Pack 2)';

update public.propuestas_productos
set
  ordem = 2,
  estado = 'em_analise',
  nivel_evidencia = 'referencia',
  imagem_referencias = array[
    '/products/a23f32138035c36a2b554356d962ded50db7fe19cbe58ca0b07e78970ae9330b.jpg',
    '/products/d6f247552f0213fc2d177ca64d6f3084d0de8b474f28e67e45f23be24a3dae5e.jpg'
  ],
  proximo_passo = 'Confirmar se as fotos correspondem ao modelo do fornecedor e validar o custo total real.'
where nombre_producto = 'Papa-Bolinhas Portátil USB Recarregável';

update public.propuestas_productos
set
  ordem = 3,
  proximo_passo = 'Localizar fornecedor, variante equivalente, imagem e custo total real.'
where nombre_producto = 'Mini Impressora Térmica 57 mm';

update public.propuestas_productos
set
  ordem = 4,
  proximo_passo = 'Reabrir somente se aparecer uma variante com margem materialmente melhor.'
where nombre_producto = 'Seladora a Vácuo Doméstica';

update public.propuestas_productos
set
  ordem = 5,
  proximo_passo = 'Validar vazão, pressão, peso, ciclo de trabalho, MOQ e custo total real.'
where nombre_producto = 'Mini Compressor Automotivo 12 V';

-- Toda atualização exige que o usuário siga sendo o proponente ou seja admin.
drop policy if exists "propuestas_update_own_or_admin" on public.propuestas_productos;
create policy "propuestas_update_own_or_admin"
  on public.propuestas_productos for update
  to authenticated
  using (propuesto_por = (select auth.uid()) or public.is_admin())
  with check (propuesto_por = (select auth.uid()) or public.is_admin());

create or replace function public.converter_sugestao_em_produto(
  p_proposta_id uuid,
  p_sku text default null,
  p_estoque integer default 0
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_proposta public.propuestas_productos%rowtype;
  v_produto_id uuid;
begin
  select * into v_proposta
  from public.propuestas_productos
  where id = p_proposta_id
  for update;

  if not found then
    raise exception 'Sugestão não encontrada';
  end if;

  if v_proposta.producto_id is not null then
    return v_proposta.producto_id;
  end if;

  if v_proposta.estado <> 'aprovado' then
    raise exception 'A sugestão precisa estar aprovada antes de entrar no catálogo';
  end if;

  insert into public.productos (
    nombre, sku, precio, costo, stock, notas, imagen_url, registrado_por
  ) values (
    v_proposta.nombre_producto,
    nullif(trim(p_sku), ''),
    coalesce(v_proposta.precio_venta_estimado, 0),
    coalesce(v_proposta.costo_estimado, 0),
    greatest(p_estoque, 0),
    v_proposta.notas,
    v_proposta.imagem_referencias[1],
    (select auth.uid())
  )
  returning id into v_produto_id;

  update public.propuestas_productos
  set producto_id = v_produto_id
  where id = p_proposta_id;

  return v_produto_id;
end;
$$;

revoke all on function public.converter_sugestao_em_produto(uuid, text, integer) from public;
revoke all on function public.converter_sugestao_em_produto(uuid, text, integer) from anon;
grant execute on function public.converter_sugestao_em_produto(uuid, text, integer) to authenticated;
