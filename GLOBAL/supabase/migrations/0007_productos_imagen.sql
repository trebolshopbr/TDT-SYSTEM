-- Imagen de producto: columna + bucket de almacenamiento público

alter table public.productos add column imagen_url text;

insert into storage.buckets (id, name, public)
values ('productos', 'productos', true)
on conflict (id) do nothing;

create policy "productos_imagenes_select_public"
  on storage.objects for select
  to public
  using (bucket_id = 'productos');

create policy "productos_imagenes_insert_authenticated"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'productos');

create policy "productos_imagenes_update_own_or_admin"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'productos' and (owner = auth.uid() or public.is_admin()));

create policy "productos_imagenes_delete_own_or_admin"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'productos' and (owner = auth.uid() or public.is_admin()));
