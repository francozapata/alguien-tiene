-- Ejecutar una sola vez en Supabase SQL Editor para completar la Fase 1.
-- Agrega estados reales a las publicaciones: ACTIVA / PAUSADA / RESUELTA.

alter table public.publications
add column if not exists status text not null default 'ACTIVA'
check (status in ('ACTIVA', 'PAUSADA', 'RESUELTA'));

update public.publications
set status = case
  when is_active = true then 'ACTIVA'
  else 'PAUSADA'
end
where status is null;

create index if not exists publications_status_idx
on public.publications(status);

create index if not exists publications_mode_idx
on public.publications(mode);

create index if not exists publications_category_idx
on public.publications(category);

create index if not exists publications_city_idx
on public.publications(city);
