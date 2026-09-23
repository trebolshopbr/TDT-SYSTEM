-- Cualquier socio autenticado puede editar productos (por ejemplo, cargar el costo real
-- de compra), no solo quien lo creó o el admin.

drop policy if exists "productos_update_own_or_admin" on public.productos;

create policy "productos_update_authenticated"
  on public.productos for update
  to authenticated
  using (true);
