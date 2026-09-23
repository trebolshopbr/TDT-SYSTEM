-- Esquema base: perfiles de socios y roles para GLOBAL

create type public.rol_socio as enum ('admin', 'socio');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre_completo text not null,
  email text not null,
  rol public.rol_socio not null default 'socio',
  empresa text,
  telefono text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Cada socio puede ver y editar su propio perfil
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Los admins pueden ver y gestionar todos los perfiles
create policy "profiles_select_admin"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.rol = 'admin'
    )
  );

create policy "profiles_update_admin"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.rol = 'admin'
    )
  );

create policy "profiles_insert_admin"
  on public.profiles for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.rol = 'admin'
    )
  );

-- Trigger: crea automáticamente un perfil "socio" cuando se registra un usuario nuevo
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nombre_completo, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'nombre_completo', new.email), new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Mantener updated_at al día
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();
