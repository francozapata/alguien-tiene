-- Ejecutar una sola vez en Supabase SQL Editor para completar la Fase 3.
-- Agrega emprendimientos, destacados y datos de ubicación/contacto.

alter table public.publications
drop constraint if exists publications_category_check;

alter table public.publications
add constraint publications_category_check
check (category in ('OBJETOS', 'SERVICIOS', 'TRABAJO', 'COMUNIDAD', 'EMPRENDIMIENTOS'));

alter table public.publications
add column if not exists address text;

alter table public.publications
add column if not exists map_url text;

alter table public.publications
add column if not exists contact_name text;

alter table public.publications
add column if not exists contact_phone text;

alter table public.publications
add column if not exists is_featured boolean not null default false;

create index if not exists publications_featured_idx
on public.publications(is_featured);

create index if not exists publications_category_featured_idx
on public.publications(category, is_featured);

alter table public.publications
add column if not exists urgent boolean not null default false;

create index if not exists publications_urgent_idx
on public.publications(urgent);

create index if not exists publications_urgent_created_idx
on public.publications(urgent, created_at desc);
