-- Corrige recursión infinita en las políticas de profiles:
-- las políticas de admin consultaban la propia tabla profiles bajo RLS.
-- Usamos una función security definer que se salta RLS para chequear el rol.

create function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and rol = 'admin'
  );
$$;

drop policy if exists "profiles_select_admin" on public.profiles;
drop policy if exists "profiles_update_admin" on public.profiles;
drop policy if exists "profiles_insert_admin" on public.profiles;

create policy "profiles_select_admin"
  on public.profiles for select
  using (public.is_admin());

create policy "profiles_update_admin"
  on public.profiles for update
  using (public.is_admin());

create policy "profiles_insert_admin"
  on public.profiles for insert
  with check (public.is_admin());
