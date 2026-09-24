-- Compras: proveedores seleccionables y comprobantes privados. Autorizado por TT.
create table public.fornecedores (
 id uuid primary key default gen_random_uuid(),
 nome text not null check (length(btrim(nome)) between 1 and 200),
 registrado_por uuid not null references public.profiles(id) on delete restrict,
 created_at timestamptz not null default now()
);
create unique index fornecedores_nome_unique on public.fornecedores (lower(btrim(nome)));
create index fornecedores_autor_idx on public.fornecedores(registrado_por);
alter table public.fornecedores enable row level security;
revoke all on public.fornecedores from anon, authenticated;
grant select, insert on public.fornecedores to authenticated;
create policy fornecedores_read on public.fornecedores for select to authenticated using (true);
create policy fornecedores_insert on public.fornecedores for insert to authenticated with check (registrado_por=(select auth.uid()));
alter table public.compras_lotes add column fornecedor_id uuid references public.fornecedores(id) on delete restrict;
create index compras_lotes_fornecedor_idx on public.compras_lotes(fornecedor_id);
grant update (fornecedor_id) on public.compras_lotes to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('compras-comprovantes','compras-comprovantes',false,10485760,array['application/pdf','image/jpeg','image/png','image/webp']);
create policy compras_comprovantes_read on storage.objects for select to authenticated using (bucket_id='compras-comprovantes');
create policy compras_comprovantes_insert on storage.objects for insert to authenticated
with check (bucket_id='compras-comprovantes' and (storage.foldername(name))[1]=(select auth.uid())::text);
-- No UPDATE/DELETE: al sustituir un archivo, las revisiones anteriores conservan el original.
