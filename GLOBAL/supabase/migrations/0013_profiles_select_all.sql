-- Todos los socios autenticados pueden ver los perfiles de los demás
-- (nombre, rol, etc.) para que el dashboard general sea igual para todos.

create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);
