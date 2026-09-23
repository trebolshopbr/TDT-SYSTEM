-- Canal de venta (plataforma) asociado a cada producto

alter table public.productos add column plataforma_id uuid references public.plataformas(id) on delete set null;
