-- ================================================================
-- ALGUIEN TIENE / YO TENGO - SUPABASE COMPLETO
-- Incluye base del proyecto + Fase 1 + Fase 2/3 + Figus Mundial 2026
-- Ejecutar UNA SOLA VEZ en Supabase > SQL Editor.
-- Si ya tenías tablas creadas, este script intenta ser idempotente.
-- ================================================================

create extension if not exists pgcrypto;

-- =========================
-- 1) PERFILES
-- =========================
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  firebase_uid text not null unique,
  email text unique,
  display_name text,
  avatar_url text,
  city text,
  neighborhood text,
  bio text,
  contact_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists neighborhood text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists contact_phone text;
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

create index if not exists profiles_firebase_uid_idx on public.profiles(firebase_uid);
create index if not exists profiles_email_idx on public.profiles(email);

-- =========================
-- 2) PUBLICACIONES
-- =========================
create table if not exists public.publications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  mode text not null default 'OFREZCO',
  category text not null default 'OBJETOS',
  subcategory text,
  price numeric(12,2),
  is_free boolean not null default false,
  city text,
  neighborhood text,
  address text,
  map_url text,
  contact_name text,
  contact_phone text,
  image_url text,
  is_featured boolean not null default false,
  urgent boolean not null default false,
  status text not null default 'ACTIVA',
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.publications drop constraint if exists publications_mode_check;
alter table public.publications add constraint publications_mode_check check (mode in ('BUSCO', 'OFREZCO'));

alter table public.publications drop constraint if exists publications_category_check;
alter table public.publications add constraint publications_category_check check (category in ('OBJETOS', 'SERVICIOS', 'TRABAJO', 'COMUNIDAD', 'EMPRENDIMIENTOS'));

alter table public.publications drop constraint if exists publications_status_check;
alter table public.publications add constraint publications_status_check check (status in ('ACTIVA', 'PAUSADA', 'RESUELTA'));

alter table public.publications add column if not exists address text;
alter table public.publications add column if not exists map_url text;
alter table public.publications add column if not exists contact_name text;
alter table public.publications add column if not exists contact_phone text;
alter table public.publications add column if not exists image_url text;
alter table public.publications add column if not exists is_featured boolean not null default false;
alter table public.publications add column if not exists urgent boolean not null default false;
alter table public.publications add column if not exists status text not null default 'ACTIVA';
alter table public.publications add column if not exists deleted_at timestamptz;
alter table public.publications add column if not exists updated_at timestamptz not null default now();

update public.publications
set status = case when is_active = true then 'ACTIVA' else 'PAUSADA' end
where status is null;

create index if not exists publications_user_idx on public.publications(user_id);
create index if not exists publications_status_idx on public.publications(status);
create index if not exists publications_mode_idx on public.publications(mode);
create index if not exists publications_category_idx on public.publications(category);
create index if not exists publications_city_idx on public.publications(city);
create index if not exists publications_featured_idx on public.publications(is_featured);
create index if not exists publications_category_featured_idx on public.publications(category, is_featured);
create index if not exists publications_urgent_idx on public.publications(urgent);
create index if not exists publications_urgent_created_idx on public.publications(urgent, created_at desc);
create index if not exists publications_deleted_idx on public.publications(deleted_at);

-- =========================
-- 3) REPORTES / MODERACION
-- =========================
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  publication_id uuid not null references public.publications(id) on delete cascade,
  reporter_id uuid references public.profiles(id) on delete set null,
  reason text not null,
  details text,
  status text not null default 'PENDIENTE',
  resolution_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.reports drop constraint if exists reports_status_check;
alter table public.reports add constraint reports_status_check check (status in ('PENDIENTE', 'RESUELTO', 'DESCARTADO'));

alter table public.reports add column if not exists resolution_note text;
alter table public.reports add column if not exists updated_at timestamptz not null default now();

create index if not exists reports_publication_idx on public.reports(publication_id);
create index if not exists reports_reporter_idx on public.reports(reporter_id);
create index if not exists reports_status_idx on public.reports(status);

-- =========================
-- 4) FIGUS MUNDIAL 2026
-- =========================
create table if not exists public.albums (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  total_figus int not null check (total_figus > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.albums add column if not exists updated_at timestamptz not null default now();

insert into public.albums (name, total_figus)
values ('Mundial 2026', 980)
on conflict (name) do update set total_figus = excluded.total_figus, updated_at = now();

create table if not exists public.user_album_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  album_id uuid not null references public.albums(id) on delete cascade,
  owned_figus int[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, album_id)
);

create table if not exists public.user_repeated_figus (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  album_id uuid not null references public.albums(id) on delete cascade,
  figu_number int not null check (figu_number between 1 and 980),
  quantity int not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, album_id, figu_number)
);

alter table public.user_album_progress add column if not exists completion_percentage numeric(5,2) not null default 0;

alter table public.user_repeated_figus add column if not exists updated_at timestamptz not null default now();

create table if not exists public.figu_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  album_id uuid not null references public.albums(id) on delete cascade,
  needed_figus int[] not null default '{}',
  is_urgent boolean not null default false,
  city text,
  neighborhood text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.figu_requests add column if not exists updated_at timestamptz not null default now();

create table if not exists public.figu_matches (
  id uuid primary key default gen_random_uuid(),
  user1_id uuid not null references public.profiles(id) on delete cascade,
  user2_id uuid not null references public.profiles(id) on delete cascade,
  album_id uuid not null references public.albums(id) on delete cascade,
  match_type text not null check (match_type in ('DOUBLE', 'SIMPLE')),
  figus_user1_gets int[] not null default '{}',
  figus_user2_gets int[] not null default '{}',
  city text,
  neighborhood text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user1_id, user2_id, album_id),
  check (user1_id <> user2_id)
);

alter table public.figu_matches add column if not exists is_active boolean not null default true;
alter table public.figu_matches add column if not exists updated_at timestamptz not null default now();
alter table public.figu_matches add column if not exists match_score int not null default 1 check (match_score between 1 and 100);
alter table public.figu_matches add column if not exists status text not null default 'PENDIENTE' check (status in ('PENDIENTE','HABLANDO','ACORDADO','INTERCAMBIADO','CANCELADO'));
alter table public.figu_matches add column if not exists meeting_suggestion text;
alter table public.figu_matches add column if not exists completed_at timestamptz;

create table if not exists public.figu_exchange_reviews (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.figu_matches(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  reviewed_user_id uuid not null references public.profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  fulfilled boolean not null default true,
  no_show boolean not null default false,
  good_condition boolean not null default true,
  comment text,
  created_at timestamptz not null default now(),
  unique(match_id, reviewer_id),
  check (reviewer_id <> reviewed_user_id)
);

create table if not exists public.figu_chat_messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.figu_matches(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  message text not null check (char_length(trim(message)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists user_album_progress_user_album_idx on public.user_album_progress(user_id, album_id);
create index if not exists user_repeated_figus_album_figu_idx on public.user_repeated_figus(album_id, figu_number);
create index if not exists user_repeated_figus_user_album_idx on public.user_repeated_figus(user_id, album_id);
create index if not exists figu_requests_album_active_zone_idx on public.figu_requests(album_id, is_active, city, neighborhood);
create index if not exists figu_requests_user_album_active_idx on public.figu_requests(user_id, album_id, is_active);
create index if not exists figu_matches_user1_idx on public.figu_matches(user1_id);
create index if not exists figu_matches_user2_idx on public.figu_matches(user2_id);
create index if not exists figu_matches_album_active_idx on public.figu_matches(album_id, is_active);
create index if not exists figu_matches_score_idx on public.figu_matches(album_id, is_active, match_score desc);
create index if not exists figu_matches_status_idx on public.figu_matches(status);
create index if not exists figu_chat_messages_match_idx on public.figu_chat_messages(match_id, created_at);
create index if not exists figu_exchange_reviews_reviewed_idx on public.figu_exchange_reviews(reviewed_user_id);

-- =========================
-- 5) FUNCIONES UTILES
-- =========================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();

drop trigger if exists publications_set_updated_at on public.publications;
create trigger publications_set_updated_at before update on public.publications for each row execute function public.set_updated_at();

drop trigger if exists reports_set_updated_at on public.reports;
create trigger reports_set_updated_at before update on public.reports for each row execute function public.set_updated_at();

drop trigger if exists albums_set_updated_at on public.albums;
create trigger albums_set_updated_at before update on public.albums for each row execute function public.set_updated_at();

drop trigger if exists user_album_progress_set_updated_at on public.user_album_progress;
create trigger user_album_progress_set_updated_at before update on public.user_album_progress for each row execute function public.set_updated_at();

drop trigger if exists user_repeated_figus_set_updated_at on public.user_repeated_figus;
create trigger user_repeated_figus_set_updated_at before update on public.user_repeated_figus for each row execute function public.set_updated_at();

drop trigger if exists figu_requests_set_updated_at on public.figu_requests;
create trigger figu_requests_set_updated_at before update on public.figu_requests for each row execute function public.set_updated_at();

drop trigger if exists figu_matches_set_updated_at on public.figu_matches;
create trigger figu_matches_set_updated_at before update on public.figu_matches for each row execute function public.set_updated_at();

-- =========================
-- 6) STORAGE BUCKETS
-- =========================
insert into storage.buckets (id, name, public)
values ('profile-images', 'profile-images', true)
on conflict (id) do update set public = excluded.public;

insert into storage.buckets (id, name, public)
values ('publication-images', 'publication-images', true)
on conflict (id) do update set public = excluded.public;

-- =========================
-- 7) RLS / POLITICAS MVP
-- =========================
alter table public.profiles enable row level security;
alter table public.publications enable row level security;
alter table public.reports enable row level security;
alter table public.albums enable row level security;
alter table public.user_album_progress enable row level security;
alter table public.user_repeated_figus enable row level security;
alter table public.figu_requests enable row level security;
alter table public.figu_matches enable row level security;
alter table public.figu_chat_messages enable row level security;
alter table public.figu_exchange_reviews enable row level security;

-- MVP abierto porque la app usa Firebase Auth en cliente y Supabase anon key.
-- Para producción real: mover escrituras críticas a API/server actions con Firebase Admin.
drop policy if exists "profiles_all_mvp" on public.profiles;
create policy "profiles_all_mvp" on public.profiles for all using (true) with check (true);

drop policy if exists "publications_all_mvp" on public.publications;
create policy "publications_all_mvp" on public.publications for all using (true) with check (true);

drop policy if exists "reports_all_mvp" on public.reports;
create policy "reports_all_mvp" on public.reports for all using (true) with check (true);

drop policy if exists "albums_all_mvp" on public.albums;
create policy "albums_all_mvp" on public.albums for all using (true) with check (true);

drop policy if exists "progress_all_mvp" on public.user_album_progress;
create policy "progress_all_mvp" on public.user_album_progress for all using (true) with check (true);

drop policy if exists "repeated_all_mvp" on public.user_repeated_figus;
create policy "repeated_all_mvp" on public.user_repeated_figus for all using (true) with check (true);

drop policy if exists "requests_all_mvp" on public.figu_requests;
create policy "requests_all_mvp" on public.figu_requests for all using (true) with check (true);

drop policy if exists "matches_all_mvp" on public.figu_matches;
create policy "matches_all_mvp" on public.figu_matches for all using (true) with check (true);

drop policy if exists "chat_all_mvp" on public.figu_chat_messages;
create policy "chat_all_mvp" on public.figu_chat_messages for all using (true) with check (true);

drop policy if exists "figu_reviews_all_mvp" on public.figu_exchange_reviews;
create policy "figu_reviews_all_mvp" on public.figu_exchange_reviews for all using (true) with check (true);

-- Storage policies MVP
drop policy if exists "profile_images_public_select" on storage.objects;
create policy "profile_images_public_select" on storage.objects for select using (bucket_id = 'profile-images');

drop policy if exists "profile_images_public_insert" on storage.objects;
create policy "profile_images_public_insert" on storage.objects for insert with check (bucket_id = 'profile-images');

drop policy if exists "profile_images_public_update" on storage.objects;
create policy "profile_images_public_update" on storage.objects for update using (bucket_id = 'profile-images') with check (bucket_id = 'profile-images');

drop policy if exists "publication_images_public_select" on storage.objects;
create policy "publication_images_public_select" on storage.objects for select using (bucket_id = 'publication-images');

drop policy if exists "publication_images_public_insert" on storage.objects;
create policy "publication_images_public_insert" on storage.objects for insert with check (bucket_id = 'publication-images');

drop policy if exists "publication_images_public_update" on storage.objects;
create policy "publication_images_public_update" on storage.objects for update using (bucket_id = 'publication-images') with check (bucket_id = 'publication-images');

-- =========================
-- FIN
-- =========================


-- =========================
-- 8) VISTA: reputacion_figus
-- =========================
create or replace view public.figu_user_reputation as
select
  reviewed_user_id as user_id,
  count(*)::int as reviews_count,
  round(avg(rating)::numeric, 2) as avg_rating,
  count(*) filter (where fulfilled)::int as fulfilled_count,
  count(*) filter (where no_show)::int as no_show_count,
  count(*) filter (where good_condition)::int as good_condition_count
from public.figu_exchange_reviews
group by reviewed_user_id;
