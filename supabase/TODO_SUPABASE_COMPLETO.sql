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

alter table public.reports add column if not exists resolution_note text;
alter table public.reports add column if not exists updated_at timestamptz not null default now();

-- Normaliza estados viejos antes de recrear el CHECK.
update public.reports
set status = case
  when status is null then 'PENDIENTE'
  when upper(status) in ('PENDING', 'PENDIENTE') then 'PENDIENTE'
  when upper(status) in ('RESOLVED', 'RESUELTO') then 'RESUELTO'
  when upper(status) in ('DISMISSED', 'DESCARTADO') then 'DESCARTADO'
  else 'PENDIENTE'
end;

alter table public.reports alter column status set default 'PENDIENTE';

alter table public.reports add constraint reports_status_check
check (status in ('PENDIENTE', 'RESUELTO', 'DESCARTADO'));

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
values ('Mundial 2026', 994)
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
  figu_number int not null check (figu_number between 1 and 994),
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


-- =========================================================
-- FIGUS: REGLA DE PRODUCTO
-- =========================================================
-- Intercambio justo:
-- - match_type = 'DOUBLE'
-- - figus_user1_gets y figus_user2_gets deben tener la misma cantidad.
-- - Si una persona puede dar 4 y la otra 2, la app propone 2x2.
--
-- Ayuda simple:
-- - match_type = 'SIMPLE'
-- - No obliga paridad. Sirve para regalo, venta o arreglo manual.
--
-- Esta regla se aplica principalmente desde services/figus.ts.
-- El constraint siguiente evita que se guarden intercambios dobles desparejos.
alter table public.figu_matches drop constraint if exists figu_matches_fair_double_check;
alter table public.figu_matches add constraint figu_matches_fair_double_check
check (
  match_type <> 'DOUBLE'
  or coalesce(array_length(figus_user1_gets, 1), 0) = coalesce(array_length(figus_user2_gets, 1), 0)
);



-- =========================================================
-- LEGAL / REGISTRO
-- =========================================================
alter table public.profiles add column if not exists terms_accepted boolean not null default false;
alter table public.profiles add column if not exists terms_accepted_at timestamptz;
alter table public.profiles add column if not exists is_adult_confirmed boolean not null default false;

-- Los usuarios existentes se consideran pendientes de reaceptación si no tienen fecha.
-- Si querés forzar reaceptación, dejá terms_accepted=false manualmente.


-- =========================================================
-- ADMIN / USUARIOS / REPORTES DE CUENTAS
-- =========================================================
alter table public.profiles add column if not exists role text not null default 'USER';
alter table public.profiles add column if not exists is_blocked boolean not null default false;
alter table public.profiles add column if not exists blocked_reason text;
alter table public.profiles add column if not exists blocked_at timestamptz;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('USER', 'ADMIN'));

update public.profiles
set role = 'ADMIN'
where lower(email) = 'francogonzalozapata@gmail.com';

create table if not exists public.user_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles(id) on delete set null,
  reported_user_id uuid references public.profiles(id) on delete cascade,
  reason text not null,
  details text,
  status text not null default 'PENDIENTE',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table public.user_reports drop constraint if exists user_reports_status_check;
alter table public.user_reports add constraint user_reports_status_check
check (status in ('PENDIENTE', 'REVISADO', 'DESCARTADO'));

alter table public.user_reports enable row level security;

drop policy if exists "Users can create user reports" on public.user_reports;
create policy "Users can create user reports"
on public.user_reports
for insert
with check (true);

drop policy if exists "Admins can read user reports" on public.user_reports;
create policy "Admins can read user reports"
on public.user_reports
for select
using (
  exists (
    select 1 from public.profiles p
    where p.firebase_uid = auth.uid()::text
    and p.role = 'ADMIN'
  )
);



-- =========================================================
-- FIGUS PRO: UBICACION Y DISTANCIA
-- =========================================================
alter table public.profiles add column if not exists lat numeric;
alter table public.profiles add column if not exists lng numeric;
alter table public.profiles add column if not exists location_updated_at timestamptz;
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists neighborhood text;

alter table public.figu_matches add column if not exists distance_km numeric;

create index if not exists idx_profiles_location on public.profiles(lat, lng);
create index if not exists idx_figu_matches_distance on public.figu_matches(distance_km);



-- =========================================================
-- PERMISOS / TYC / NOTIFICACIONES
-- =========================================================
alter table public.profiles add column if not exists terms_accepted boolean not null default false;
alter table public.profiles add column if not exists terms_accepted_at timestamptz;
alter table public.profiles add column if not exists is_adult_confirmed boolean not null default false;
alter table public.profiles add column if not exists notifications_enabled boolean not null default false;
alter table public.profiles add column if not exists notifications_updated_at timestamptz;



-- =========================================================
-- DESCUBRIR: MATCH MUTUO
-- =========================================================
alter table public.figu_matches add column if not exists liked_by_user1 boolean not null default false;
alter table public.figu_matches add column if not exists liked_by_user2 boolean not null default false;
alter table public.figu_matches add column if not exists mutual_interest boolean not null default false;

-- Asegura que los estados usados por chat/match mutuo estén permitidos.
alter table public.figu_matches drop constraint if exists figu_matches_status_check;
alter table public.figu_matches add constraint figu_matches_status_check
check (status in ('PENDIENTE', 'HABLANDO', 'ACORDADO', 'INTERCAMBIADO', 'CANCELADO'));

create index if not exists idx_figu_matches_mutual_interest on public.figu_matches(mutual_interest);


-- =========================================================
-- INTERCAMBIO CUMPLIDO: APLICAR FIGUS AUTOMATICAMENTE
-- =========================================================
alter table public.figu_matches add column if not exists trade_applied boolean not null default false;
alter table public.figu_matches add column if not exists trade_applied_at timestamptz;
create index if not exists idx_figu_matches_trade_applied on public.figu_matches(trade_applied);



-- =========================================================
-- CHATS / DESCUBRIR DESCARTADOS / NOTIFICACIONES LOCALES
-- =========================================================
alter table public.figu_matches add column if not exists rejected_by_user1 boolean not null default false;
alter table public.figu_matches add column if not exists rejected_by_user2 boolean not null default false;

create index if not exists idx_figu_matches_rejected_user1 on public.figu_matches(rejected_by_user1);
create index if not exists idx_figu_matches_rejected_user2 on public.figu_matches(rejected_by_user2);
create index if not exists idx_figu_chat_messages_match_created on public.figu_chat_messages(match_id, created_at desc);



-- =========================================================
-- NOTIFICACIONES VISIBLES / BURBUJA CHAT / OCULTAR CHATS
-- =========================================================
alter table public.figu_matches add column if not exists hidden_by_user1 boolean not null default false;
alter table public.figu_matches add column if not exists hidden_by_user2 boolean not null default false;

create index if not exists idx_figu_matches_hidden_user1 on public.figu_matches(hidden_by_user1);
create index if not exists idx_figu_matches_hidden_user2 on public.figu_matches(hidden_by_user2);



-- =========================================================
-- SUSCRIPCIONES / PREMIUM / EXTRAS
-- =========================================================
alter table public.profiles add column if not exists plan_type text not null default 'FREE';
alter table public.profiles add column if not exists is_premium boolean not null default false;
alter table public.profiles add column if not exists premium_until timestamptz;
alter table public.profiles add column if not exists boosts_available integer not null default 0;
alter table public.profiles add column if not exists instant_searches_available integer not null default 0;
alter table public.profiles add column if not exists radar_uses_available integer not null default 0;
alter table public.profiles add column if not exists plan_granted_by_admin boolean not null default false;
alter table public.profiles add column if not exists plan_notes text;
alter table public.profiles add column if not exists plan_updated_at timestamptz;

alter table public.profiles drop constraint if exists profiles_plan_type_check;
alter table public.profiles add constraint profiles_plan_type_check
check (plan_type in ('FREE', 'PREMIUM', 'EXTRAS', 'PRO_TOTAL'));

create table if not exists public.subscription_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  event_type text not null,
  plan_type text,
  amount numeric(12,2),
  provider text,
  provider_payment_id text,
  starts_at timestamptz,
  ends_at timestamptz,
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table public.subscription_events enable row level security;

drop policy if exists "Admins can read subscription events" on public.subscription_events;
create policy "Admins can read subscription events"
on public.subscription_events
for select
using (
  exists (
    select 1 from public.profiles p
    where p.firebase_uid = auth.uid()::text and p.role = 'ADMIN'
  )
);

create index if not exists idx_profiles_plan_type on public.profiles(plan_type);
create index if not exists idx_profiles_premium_until on public.profiles(premium_until);
create index if not exists idx_subscription_events_user_id on public.subscription_events(user_id);


-- =========================================================
-- CATALOGO FIGURITAS MUNDIAL 2026 - CODIGOS OFICIALES APP
-- Internamente la app guarda ordinales 1..994 para mantener compatibilidad.
-- La UI muestra codigos: FWC0..FWC19, ARG1..ARG20, CC1..CC14.
-- =========================================================
create table if not exists public.figu_sticker_catalog (
  ordinal integer primary key,
  code text unique not null,
  section text not null,
  group_key text not null,
  team text not null,
  team_name text not null,
  number integer not null,
  flag text,
  created_at timestamptz not null default now()
);

alter table public.figu_sticker_catalog enable row level security;

drop policy if exists "Anyone can read sticker catalog" on public.figu_sticker_catalog;
create policy "Anyone can read sticker catalog"
on public.figu_sticker_catalog
for select
using (true);


insert into public.figu_sticker_catalog (ordinal, code, section, group_key, team, team_name, number, flag) values
(1, 'FWC0', 'Especiales', 'FWC', 'FWC', 'Especiales Mundial', 0, '🏆'),
(2, 'FWC1', 'Especiales', 'FWC', 'FWC', 'Especiales Mundial', 1, '🏆'),
(3, 'FWC2', 'Especiales', 'FWC', 'FWC', 'Especiales Mundial', 2, '🏆'),
(4, 'FWC3', 'Especiales', 'FWC', 'FWC', 'Especiales Mundial', 3, '🏆'),
(5, 'FWC4', 'Especiales', 'FWC', 'FWC', 'Especiales Mundial', 4, '🏆'),
(6, 'FWC5', 'Especiales', 'FWC', 'FWC', 'Especiales Mundial', 5, '🏆'),
(7, 'FWC6', 'Especiales', 'FWC', 'FWC', 'Especiales Mundial', 6, '🏆'),
(8, 'FWC7', 'Especiales', 'FWC', 'FWC', 'Especiales Mundial', 7, '🏆'),
(9, 'FWC8', 'Especiales', 'FWC', 'FWC', 'Especiales Mundial', 8, '🏆'),
(10, 'FWC9', 'Especiales', 'FWC', 'FWC', 'Especiales Mundial', 9, '🏆'),
(11, 'FWC10', 'Especiales', 'FWC', 'FWC', 'Especiales Mundial', 10, '🏆'),
(12, 'FWC11', 'Especiales', 'FWC', 'FWC', 'Especiales Mundial', 11, '🏆'),
(13, 'FWC12', 'Especiales', 'FWC', 'FWC', 'Especiales Mundial', 12, '🏆'),
(14, 'FWC13', 'Especiales', 'FWC', 'FWC', 'Especiales Mundial', 13, '🏆'),
(15, 'FWC14', 'Especiales', 'FWC', 'FWC', 'Especiales Mundial', 14, '🏆'),
(16, 'FWC15', 'Especiales', 'FWC', 'FWC', 'Especiales Mundial', 15, '🏆'),
(17, 'FWC16', 'Especiales', 'FWC', 'FWC', 'Especiales Mundial', 16, '🏆'),
(18, 'FWC17', 'Especiales', 'FWC', 'FWC', 'Especiales Mundial', 17, '🏆'),
(19, 'FWC18', 'Especiales', 'FWC', 'FWC', 'Especiales Mundial', 18, '🏆'),
(20, 'FWC19', 'Especiales', 'FWC', 'FWC', 'Especiales Mundial', 19, '🏆'),
(21, 'MEX1', 'Grupo A', 'A', 'MEX', 'México', 1, '🇲🇽'),
(22, 'MEX2', 'Grupo A', 'A', 'MEX', 'México', 2, '🇲🇽'),
(23, 'MEX3', 'Grupo A', 'A', 'MEX', 'México', 3, '🇲🇽'),
(24, 'MEX4', 'Grupo A', 'A', 'MEX', 'México', 4, '🇲🇽'),
(25, 'MEX5', 'Grupo A', 'A', 'MEX', 'México', 5, '🇲🇽'),
(26, 'MEX6', 'Grupo A', 'A', 'MEX', 'México', 6, '🇲🇽'),
(27, 'MEX7', 'Grupo A', 'A', 'MEX', 'México', 7, '🇲🇽'),
(28, 'MEX8', 'Grupo A', 'A', 'MEX', 'México', 8, '🇲🇽'),
(29, 'MEX9', 'Grupo A', 'A', 'MEX', 'México', 9, '🇲🇽'),
(30, 'MEX10', 'Grupo A', 'A', 'MEX', 'México', 10, '🇲🇽'),
(31, 'MEX11', 'Grupo A', 'A', 'MEX', 'México', 11, '🇲🇽'),
(32, 'MEX12', 'Grupo A', 'A', 'MEX', 'México', 12, '🇲🇽'),
(33, 'MEX13', 'Grupo A', 'A', 'MEX', 'México', 13, '🇲🇽'),
(34, 'MEX14', 'Grupo A', 'A', 'MEX', 'México', 14, '🇲🇽'),
(35, 'MEX15', 'Grupo A', 'A', 'MEX', 'México', 15, '🇲🇽'),
(36, 'MEX16', 'Grupo A', 'A', 'MEX', 'México', 16, '🇲🇽'),
(37, 'MEX17', 'Grupo A', 'A', 'MEX', 'México', 17, '🇲🇽'),
(38, 'MEX18', 'Grupo A', 'A', 'MEX', 'México', 18, '🇲🇽'),
(39, 'MEX19', 'Grupo A', 'A', 'MEX', 'México', 19, '🇲🇽'),
(40, 'MEX20', 'Grupo A', 'A', 'MEX', 'México', 20, '🇲🇽'),
(41, 'RSA1', 'Grupo A', 'A', 'RSA', 'Sudáfrica', 1, '🇿🇦'),
(42, 'RSA2', 'Grupo A', 'A', 'RSA', 'Sudáfrica', 2, '🇿🇦'),
(43, 'RSA3', 'Grupo A', 'A', 'RSA', 'Sudáfrica', 3, '🇿🇦'),
(44, 'RSA4', 'Grupo A', 'A', 'RSA', 'Sudáfrica', 4, '🇿🇦'),
(45, 'RSA5', 'Grupo A', 'A', 'RSA', 'Sudáfrica', 5, '🇿🇦'),
(46, 'RSA6', 'Grupo A', 'A', 'RSA', 'Sudáfrica', 6, '🇿🇦'),
(47, 'RSA7', 'Grupo A', 'A', 'RSA', 'Sudáfrica', 7, '🇿🇦'),
(48, 'RSA8', 'Grupo A', 'A', 'RSA', 'Sudáfrica', 8, '🇿🇦'),
(49, 'RSA9', 'Grupo A', 'A', 'RSA', 'Sudáfrica', 9, '🇿🇦'),
(50, 'RSA10', 'Grupo A', 'A', 'RSA', 'Sudáfrica', 10, '🇿🇦'),
(51, 'RSA11', 'Grupo A', 'A', 'RSA', 'Sudáfrica', 11, '🇿🇦'),
(52, 'RSA12', 'Grupo A', 'A', 'RSA', 'Sudáfrica', 12, '🇿🇦'),
(53, 'RSA13', 'Grupo A', 'A', 'RSA', 'Sudáfrica', 13, '🇿🇦'),
(54, 'RSA14', 'Grupo A', 'A', 'RSA', 'Sudáfrica', 14, '🇿🇦'),
(55, 'RSA15', 'Grupo A', 'A', 'RSA', 'Sudáfrica', 15, '🇿🇦'),
(56, 'RSA16', 'Grupo A', 'A', 'RSA', 'Sudáfrica', 16, '🇿🇦'),
(57, 'RSA17', 'Grupo A', 'A', 'RSA', 'Sudáfrica', 17, '🇿🇦'),
(58, 'RSA18', 'Grupo A', 'A', 'RSA', 'Sudáfrica', 18, '🇿🇦'),
(59, 'RSA19', 'Grupo A', 'A', 'RSA', 'Sudáfrica', 19, '🇿🇦'),
(60, 'RSA20', 'Grupo A', 'A', 'RSA', 'Sudáfrica', 20, '🇿🇦'),
(61, 'KOR1', 'Grupo A', 'A', 'KOR', 'Corea', 1, '🇰🇷'),
(62, 'KOR2', 'Grupo A', 'A', 'KOR', 'Corea', 2, '🇰🇷'),
(63, 'KOR3', 'Grupo A', 'A', 'KOR', 'Corea', 3, '🇰🇷'),
(64, 'KOR4', 'Grupo A', 'A', 'KOR', 'Corea', 4, '🇰🇷'),
(65, 'KOR5', 'Grupo A', 'A', 'KOR', 'Corea', 5, '🇰🇷'),
(66, 'KOR6', 'Grupo A', 'A', 'KOR', 'Corea', 6, '🇰🇷'),
(67, 'KOR7', 'Grupo A', 'A', 'KOR', 'Corea', 7, '🇰🇷'),
(68, 'KOR8', 'Grupo A', 'A', 'KOR', 'Corea', 8, '🇰🇷'),
(69, 'KOR9', 'Grupo A', 'A', 'KOR', 'Corea', 9, '🇰🇷'),
(70, 'KOR10', 'Grupo A', 'A', 'KOR', 'Corea', 10, '🇰🇷'),
(71, 'KOR11', 'Grupo A', 'A', 'KOR', 'Corea', 11, '🇰🇷'),
(72, 'KOR12', 'Grupo A', 'A', 'KOR', 'Corea', 12, '🇰🇷'),
(73, 'KOR13', 'Grupo A', 'A', 'KOR', 'Corea', 13, '🇰🇷'),
(74, 'KOR14', 'Grupo A', 'A', 'KOR', 'Corea', 14, '🇰🇷'),
(75, 'KOR15', 'Grupo A', 'A', 'KOR', 'Corea', 15, '🇰🇷'),
(76, 'KOR16', 'Grupo A', 'A', 'KOR', 'Corea', 16, '🇰🇷'),
(77, 'KOR17', 'Grupo A', 'A', 'KOR', 'Corea', 17, '🇰🇷'),
(78, 'KOR18', 'Grupo A', 'A', 'KOR', 'Corea', 18, '🇰🇷'),
(79, 'KOR19', 'Grupo A', 'A', 'KOR', 'Corea', 19, '🇰🇷'),
(80, 'KOR20', 'Grupo A', 'A', 'KOR', 'Corea', 20, '🇰🇷'),
(81, 'CZE1', 'Grupo A', 'A', 'CZE', 'Chequia', 1, '🇨🇿'),
(82, 'CZE2', 'Grupo A', 'A', 'CZE', 'Chequia', 2, '🇨🇿'),
(83, 'CZE3', 'Grupo A', 'A', 'CZE', 'Chequia', 3, '🇨🇿'),
(84, 'CZE4', 'Grupo A', 'A', 'CZE', 'Chequia', 4, '🇨🇿'),
(85, 'CZE5', 'Grupo A', 'A', 'CZE', 'Chequia', 5, '🇨🇿'),
(86, 'CZE6', 'Grupo A', 'A', 'CZE', 'Chequia', 6, '🇨🇿'),
(87, 'CZE7', 'Grupo A', 'A', 'CZE', 'Chequia', 7, '🇨🇿'),
(88, 'CZE8', 'Grupo A', 'A', 'CZE', 'Chequia', 8, '🇨🇿'),
(89, 'CZE9', 'Grupo A', 'A', 'CZE', 'Chequia', 9, '🇨🇿'),
(90, 'CZE10', 'Grupo A', 'A', 'CZE', 'Chequia', 10, '🇨🇿'),
(91, 'CZE11', 'Grupo A', 'A', 'CZE', 'Chequia', 11, '🇨🇿'),
(92, 'CZE12', 'Grupo A', 'A', 'CZE', 'Chequia', 12, '🇨🇿'),
(93, 'CZE13', 'Grupo A', 'A', 'CZE', 'Chequia', 13, '🇨🇿'),
(94, 'CZE14', 'Grupo A', 'A', 'CZE', 'Chequia', 14, '🇨🇿'),
(95, 'CZE15', 'Grupo A', 'A', 'CZE', 'Chequia', 15, '🇨🇿'),
(96, 'CZE16', 'Grupo A', 'A', 'CZE', 'Chequia', 16, '🇨🇿'),
(97, 'CZE17', 'Grupo A', 'A', 'CZE', 'Chequia', 17, '🇨🇿'),
(98, 'CZE18', 'Grupo A', 'A', 'CZE', 'Chequia', 18, '🇨🇿'),
(99, 'CZE19', 'Grupo A', 'A', 'CZE', 'Chequia', 19, '🇨🇿'),
(100, 'CZE20', 'Grupo A', 'A', 'CZE', 'Chequia', 20, '🇨🇿'),
(101, 'CAN1', 'Grupo B', 'B', 'CAN', 'Canadá', 1, '🇨🇦'),
(102, 'CAN2', 'Grupo B', 'B', 'CAN', 'Canadá', 2, '🇨🇦'),
(103, 'CAN3', 'Grupo B', 'B', 'CAN', 'Canadá', 3, '🇨🇦'),
(104, 'CAN4', 'Grupo B', 'B', 'CAN', 'Canadá', 4, '🇨🇦'),
(105, 'CAN5', 'Grupo B', 'B', 'CAN', 'Canadá', 5, '🇨🇦'),
(106, 'CAN6', 'Grupo B', 'B', 'CAN', 'Canadá', 6, '🇨🇦'),
(107, 'CAN7', 'Grupo B', 'B', 'CAN', 'Canadá', 7, '🇨🇦'),
(108, 'CAN8', 'Grupo B', 'B', 'CAN', 'Canadá', 8, '🇨🇦'),
(109, 'CAN9', 'Grupo B', 'B', 'CAN', 'Canadá', 9, '🇨🇦'),
(110, 'CAN10', 'Grupo B', 'B', 'CAN', 'Canadá', 10, '🇨🇦'),
(111, 'CAN11', 'Grupo B', 'B', 'CAN', 'Canadá', 11, '🇨🇦'),
(112, 'CAN12', 'Grupo B', 'B', 'CAN', 'Canadá', 12, '🇨🇦'),
(113, 'CAN13', 'Grupo B', 'B', 'CAN', 'Canadá', 13, '🇨🇦'),
(114, 'CAN14', 'Grupo B', 'B', 'CAN', 'Canadá', 14, '🇨🇦'),
(115, 'CAN15', 'Grupo B', 'B', 'CAN', 'Canadá', 15, '🇨🇦'),
(116, 'CAN16', 'Grupo B', 'B', 'CAN', 'Canadá', 16, '🇨🇦'),
(117, 'CAN17', 'Grupo B', 'B', 'CAN', 'Canadá', 17, '🇨🇦'),
(118, 'CAN18', 'Grupo B', 'B', 'CAN', 'Canadá', 18, '🇨🇦'),
(119, 'CAN19', 'Grupo B', 'B', 'CAN', 'Canadá', 19, '🇨🇦'),
(120, 'CAN20', 'Grupo B', 'B', 'CAN', 'Canadá', 20, '🇨🇦'),
(121, 'BIH1', 'Grupo B', 'B', 'BIH', 'Bosnia', 1, '🇧🇦'),
(122, 'BIH2', 'Grupo B', 'B', 'BIH', 'Bosnia', 2, '🇧🇦'),
(123, 'BIH3', 'Grupo B', 'B', 'BIH', 'Bosnia', 3, '🇧🇦'),
(124, 'BIH4', 'Grupo B', 'B', 'BIH', 'Bosnia', 4, '🇧🇦'),
(125, 'BIH5', 'Grupo B', 'B', 'BIH', 'Bosnia', 5, '🇧🇦'),
(126, 'BIH6', 'Grupo B', 'B', 'BIH', 'Bosnia', 6, '🇧🇦'),
(127, 'BIH7', 'Grupo B', 'B', 'BIH', 'Bosnia', 7, '🇧🇦'),
(128, 'BIH8', 'Grupo B', 'B', 'BIH', 'Bosnia', 8, '🇧🇦'),
(129, 'BIH9', 'Grupo B', 'B', 'BIH', 'Bosnia', 9, '🇧🇦'),
(130, 'BIH10', 'Grupo B', 'B', 'BIH', 'Bosnia', 10, '🇧🇦'),
(131, 'BIH11', 'Grupo B', 'B', 'BIH', 'Bosnia', 11, '🇧🇦'),
(132, 'BIH12', 'Grupo B', 'B', 'BIH', 'Bosnia', 12, '🇧🇦'),
(133, 'BIH13', 'Grupo B', 'B', 'BIH', 'Bosnia', 13, '🇧🇦'),
(134, 'BIH14', 'Grupo B', 'B', 'BIH', 'Bosnia', 14, '🇧🇦'),
(135, 'BIH15', 'Grupo B', 'B', 'BIH', 'Bosnia', 15, '🇧🇦'),
(136, 'BIH16', 'Grupo B', 'B', 'BIH', 'Bosnia', 16, '🇧🇦'),
(137, 'BIH17', 'Grupo B', 'B', 'BIH', 'Bosnia', 17, '🇧🇦'),
(138, 'BIH18', 'Grupo B', 'B', 'BIH', 'Bosnia', 18, '🇧🇦'),
(139, 'BIH19', 'Grupo B', 'B', 'BIH', 'Bosnia', 19, '🇧🇦'),
(140, 'BIH20', 'Grupo B', 'B', 'BIH', 'Bosnia', 20, '🇧🇦'),
(141, 'QAT1', 'Grupo B', 'B', 'QAT', 'Qatar', 1, '🇶🇦'),
(142, 'QAT2', 'Grupo B', 'B', 'QAT', 'Qatar', 2, '🇶🇦'),
(143, 'QAT3', 'Grupo B', 'B', 'QAT', 'Qatar', 3, '🇶🇦'),
(144, 'QAT4', 'Grupo B', 'B', 'QAT', 'Qatar', 4, '🇶🇦'),
(145, 'QAT5', 'Grupo B', 'B', 'QAT', 'Qatar', 5, '🇶🇦'),
(146, 'QAT6', 'Grupo B', 'B', 'QAT', 'Qatar', 6, '🇶🇦'),
(147, 'QAT7', 'Grupo B', 'B', 'QAT', 'Qatar', 7, '🇶🇦'),
(148, 'QAT8', 'Grupo B', 'B', 'QAT', 'Qatar', 8, '🇶🇦'),
(149, 'QAT9', 'Grupo B', 'B', 'QAT', 'Qatar', 9, '🇶🇦'),
(150, 'QAT10', 'Grupo B', 'B', 'QAT', 'Qatar', 10, '🇶🇦'),
(151, 'QAT11', 'Grupo B', 'B', 'QAT', 'Qatar', 11, '🇶🇦'),
(152, 'QAT12', 'Grupo B', 'B', 'QAT', 'Qatar', 12, '🇶🇦'),
(153, 'QAT13', 'Grupo B', 'B', 'QAT', 'Qatar', 13, '🇶🇦'),
(154, 'QAT14', 'Grupo B', 'B', 'QAT', 'Qatar', 14, '🇶🇦'),
(155, 'QAT15', 'Grupo B', 'B', 'QAT', 'Qatar', 15, '🇶🇦'),
(156, 'QAT16', 'Grupo B', 'B', 'QAT', 'Qatar', 16, '🇶🇦'),
(157, 'QAT17', 'Grupo B', 'B', 'QAT', 'Qatar', 17, '🇶🇦'),
(158, 'QAT18', 'Grupo B', 'B', 'QAT', 'Qatar', 18, '🇶🇦'),
(159, 'QAT19', 'Grupo B', 'B', 'QAT', 'Qatar', 19, '🇶🇦'),
(160, 'QAT20', 'Grupo B', 'B', 'QAT', 'Qatar', 20, '🇶🇦'),
(161, 'SUI1', 'Grupo B', 'B', 'SUI', 'Suiza', 1, '🇨🇭'),
(162, 'SUI2', 'Grupo B', 'B', 'SUI', 'Suiza', 2, '🇨🇭'),
(163, 'SUI3', 'Grupo B', 'B', 'SUI', 'Suiza', 3, '🇨🇭'),
(164, 'SUI4', 'Grupo B', 'B', 'SUI', 'Suiza', 4, '🇨🇭'),
(165, 'SUI5', 'Grupo B', 'B', 'SUI', 'Suiza', 5, '🇨🇭'),
(166, 'SUI6', 'Grupo B', 'B', 'SUI', 'Suiza', 6, '🇨🇭'),
(167, 'SUI7', 'Grupo B', 'B', 'SUI', 'Suiza', 7, '🇨🇭'),
(168, 'SUI8', 'Grupo B', 'B', 'SUI', 'Suiza', 8, '🇨🇭'),
(169, 'SUI9', 'Grupo B', 'B', 'SUI', 'Suiza', 9, '🇨🇭'),
(170, 'SUI10', 'Grupo B', 'B', 'SUI', 'Suiza', 10, '🇨🇭'),
(171, 'SUI11', 'Grupo B', 'B', 'SUI', 'Suiza', 11, '🇨🇭'),
(172, 'SUI12', 'Grupo B', 'B', 'SUI', 'Suiza', 12, '🇨🇭'),
(173, 'SUI13', 'Grupo B', 'B', 'SUI', 'Suiza', 13, '🇨🇭'),
(174, 'SUI14', 'Grupo B', 'B', 'SUI', 'Suiza', 14, '🇨🇭'),
(175, 'SUI15', 'Grupo B', 'B', 'SUI', 'Suiza', 15, '🇨🇭'),
(176, 'SUI16', 'Grupo B', 'B', 'SUI', 'Suiza', 16, '🇨🇭'),
(177, 'SUI17', 'Grupo B', 'B', 'SUI', 'Suiza', 17, '🇨🇭'),
(178, 'SUI18', 'Grupo B', 'B', 'SUI', 'Suiza', 18, '🇨🇭'),
(179, 'SUI19', 'Grupo B', 'B', 'SUI', 'Suiza', 19, '🇨🇭'),
(180, 'SUI20', 'Grupo B', 'B', 'SUI', 'Suiza', 20, '🇨🇭'),
(181, 'BRA1', 'Grupo C', 'C', 'BRA', 'Brasil', 1, '🇧🇷'),
(182, 'BRA2', 'Grupo C', 'C', 'BRA', 'Brasil', 2, '🇧🇷'),
(183, 'BRA3', 'Grupo C', 'C', 'BRA', 'Brasil', 3, '🇧🇷'),
(184, 'BRA4', 'Grupo C', 'C', 'BRA', 'Brasil', 4, '🇧🇷'),
(185, 'BRA5', 'Grupo C', 'C', 'BRA', 'Brasil', 5, '🇧🇷'),
(186, 'BRA6', 'Grupo C', 'C', 'BRA', 'Brasil', 6, '🇧🇷'),
(187, 'BRA7', 'Grupo C', 'C', 'BRA', 'Brasil', 7, '🇧🇷'),
(188, 'BRA8', 'Grupo C', 'C', 'BRA', 'Brasil', 8, '🇧🇷'),
(189, 'BRA9', 'Grupo C', 'C', 'BRA', 'Brasil', 9, '🇧🇷'),
(190, 'BRA10', 'Grupo C', 'C', 'BRA', 'Brasil', 10, '🇧🇷'),
(191, 'BRA11', 'Grupo C', 'C', 'BRA', 'Brasil', 11, '🇧🇷'),
(192, 'BRA12', 'Grupo C', 'C', 'BRA', 'Brasil', 12, '🇧🇷'),
(193, 'BRA13', 'Grupo C', 'C', 'BRA', 'Brasil', 13, '🇧🇷'),
(194, 'BRA14', 'Grupo C', 'C', 'BRA', 'Brasil', 14, '🇧🇷'),
(195, 'BRA15', 'Grupo C', 'C', 'BRA', 'Brasil', 15, '🇧🇷'),
(196, 'BRA16', 'Grupo C', 'C', 'BRA', 'Brasil', 16, '🇧🇷'),
(197, 'BRA17', 'Grupo C', 'C', 'BRA', 'Brasil', 17, '🇧🇷'),
(198, 'BRA18', 'Grupo C', 'C', 'BRA', 'Brasil', 18, '🇧🇷'),
(199, 'BRA19', 'Grupo C', 'C', 'BRA', 'Brasil', 19, '🇧🇷'),
(200, 'BRA20', 'Grupo C', 'C', 'BRA', 'Brasil', 20, '🇧🇷'),
(201, 'MAR1', 'Grupo C', 'C', 'MAR', 'Marruecos', 1, '🇲🇦'),
(202, 'MAR2', 'Grupo C', 'C', 'MAR', 'Marruecos', 2, '🇲🇦'),
(203, 'MAR3', 'Grupo C', 'C', 'MAR', 'Marruecos', 3, '🇲🇦'),
(204, 'MAR4', 'Grupo C', 'C', 'MAR', 'Marruecos', 4, '🇲🇦'),
(205, 'MAR5', 'Grupo C', 'C', 'MAR', 'Marruecos', 5, '🇲🇦'),
(206, 'MAR6', 'Grupo C', 'C', 'MAR', 'Marruecos', 6, '🇲🇦'),
(207, 'MAR7', 'Grupo C', 'C', 'MAR', 'Marruecos', 7, '🇲🇦'),
(208, 'MAR8', 'Grupo C', 'C', 'MAR', 'Marruecos', 8, '🇲🇦'),
(209, 'MAR9', 'Grupo C', 'C', 'MAR', 'Marruecos', 9, '🇲🇦'),
(210, 'MAR10', 'Grupo C', 'C', 'MAR', 'Marruecos', 10, '🇲🇦'),
(211, 'MAR11', 'Grupo C', 'C', 'MAR', 'Marruecos', 11, '🇲🇦'),
(212, 'MAR12', 'Grupo C', 'C', 'MAR', 'Marruecos', 12, '🇲🇦'),
(213, 'MAR13', 'Grupo C', 'C', 'MAR', 'Marruecos', 13, '🇲🇦'),
(214, 'MAR14', 'Grupo C', 'C', 'MAR', 'Marruecos', 14, '🇲🇦'),
(215, 'MAR15', 'Grupo C', 'C', 'MAR', 'Marruecos', 15, '🇲🇦'),
(216, 'MAR16', 'Grupo C', 'C', 'MAR', 'Marruecos', 16, '🇲🇦'),
(217, 'MAR17', 'Grupo C', 'C', 'MAR', 'Marruecos', 17, '🇲🇦'),
(218, 'MAR18', 'Grupo C', 'C', 'MAR', 'Marruecos', 18, '🇲🇦'),
(219, 'MAR19', 'Grupo C', 'C', 'MAR', 'Marruecos', 19, '🇲🇦'),
(220, 'MAR20', 'Grupo C', 'C', 'MAR', 'Marruecos', 20, '🇲🇦'),
(221, 'HAI1', 'Grupo C', 'C', 'HAI', 'Haití', 1, '🇭🇹'),
(222, 'HAI2', 'Grupo C', 'C', 'HAI', 'Haití', 2, '🇭🇹'),
(223, 'HAI3', 'Grupo C', 'C', 'HAI', 'Haití', 3, '🇭🇹'),
(224, 'HAI4', 'Grupo C', 'C', 'HAI', 'Haití', 4, '🇭🇹'),
(225, 'HAI5', 'Grupo C', 'C', 'HAI', 'Haití', 5, '🇭🇹'),
(226, 'HAI6', 'Grupo C', 'C', 'HAI', 'Haití', 6, '🇭🇹'),
(227, 'HAI7', 'Grupo C', 'C', 'HAI', 'Haití', 7, '🇭🇹'),
(228, 'HAI8', 'Grupo C', 'C', 'HAI', 'Haití', 8, '🇭🇹'),
(229, 'HAI9', 'Grupo C', 'C', 'HAI', 'Haití', 9, '🇭🇹'),
(230, 'HAI10', 'Grupo C', 'C', 'HAI', 'Haití', 10, '🇭🇹'),
(231, 'HAI11', 'Grupo C', 'C', 'HAI', 'Haití', 11, '🇭🇹'),
(232, 'HAI12', 'Grupo C', 'C', 'HAI', 'Haití', 12, '🇭🇹'),
(233, 'HAI13', 'Grupo C', 'C', 'HAI', 'Haití', 13, '🇭🇹'),
(234, 'HAI14', 'Grupo C', 'C', 'HAI', 'Haití', 14, '🇭🇹'),
(235, 'HAI15', 'Grupo C', 'C', 'HAI', 'Haití', 15, '🇭🇹'),
(236, 'HAI16', 'Grupo C', 'C', 'HAI', 'Haití', 16, '🇭🇹'),
(237, 'HAI17', 'Grupo C', 'C', 'HAI', 'Haití', 17, '🇭🇹'),
(238, 'HAI18', 'Grupo C', 'C', 'HAI', 'Haití', 18, '🇭🇹'),
(239, 'HAI19', 'Grupo C', 'C', 'HAI', 'Haití', 19, '🇭🇹'),
(240, 'HAI20', 'Grupo C', 'C', 'HAI', 'Haití', 20, '🇭🇹'),
(241, 'SCO1', 'Grupo C', 'C', 'SCO', 'Escocia', 1, '🏴'),
(242, 'SCO2', 'Grupo C', 'C', 'SCO', 'Escocia', 2, '🏴'),
(243, 'SCO3', 'Grupo C', 'C', 'SCO', 'Escocia', 3, '🏴'),
(244, 'SCO4', 'Grupo C', 'C', 'SCO', 'Escocia', 4, '🏴'),
(245, 'SCO5', 'Grupo C', 'C', 'SCO', 'Escocia', 5, '🏴'),
(246, 'SCO6', 'Grupo C', 'C', 'SCO', 'Escocia', 6, '🏴'),
(247, 'SCO7', 'Grupo C', 'C', 'SCO', 'Escocia', 7, '🏴'),
(248, 'SCO8', 'Grupo C', 'C', 'SCO', 'Escocia', 8, '🏴'),
(249, 'SCO9', 'Grupo C', 'C', 'SCO', 'Escocia', 9, '🏴'),
(250, 'SCO10', 'Grupo C', 'C', 'SCO', 'Escocia', 10, '🏴'),
(251, 'SCO11', 'Grupo C', 'C', 'SCO', 'Escocia', 11, '🏴'),
(252, 'SCO12', 'Grupo C', 'C', 'SCO', 'Escocia', 12, '🏴'),
(253, 'SCO13', 'Grupo C', 'C', 'SCO', 'Escocia', 13, '🏴'),
(254, 'SCO14', 'Grupo C', 'C', 'SCO', 'Escocia', 14, '🏴'),
(255, 'SCO15', 'Grupo C', 'C', 'SCO', 'Escocia', 15, '🏴'),
(256, 'SCO16', 'Grupo C', 'C', 'SCO', 'Escocia', 16, '🏴'),
(257, 'SCO17', 'Grupo C', 'C', 'SCO', 'Escocia', 17, '🏴'),
(258, 'SCO18', 'Grupo C', 'C', 'SCO', 'Escocia', 18, '🏴'),
(259, 'SCO19', 'Grupo C', 'C', 'SCO', 'Escocia', 19, '🏴'),
(260, 'SCO20', 'Grupo C', 'C', 'SCO', 'Escocia', 20, '🏴'),
(261, 'USA1', 'Grupo D', 'D', 'USA', 'EE.UU.', 1, '🇺🇸'),
(262, 'USA2', 'Grupo D', 'D', 'USA', 'EE.UU.', 2, '🇺🇸'),
(263, 'USA3', 'Grupo D', 'D', 'USA', 'EE.UU.', 3, '🇺🇸'),
(264, 'USA4', 'Grupo D', 'D', 'USA', 'EE.UU.', 4, '🇺🇸'),
(265, 'USA5', 'Grupo D', 'D', 'USA', 'EE.UU.', 5, '🇺🇸'),
(266, 'USA6', 'Grupo D', 'D', 'USA', 'EE.UU.', 6, '🇺🇸'),
(267, 'USA7', 'Grupo D', 'D', 'USA', 'EE.UU.', 7, '🇺🇸'),
(268, 'USA8', 'Grupo D', 'D', 'USA', 'EE.UU.', 8, '🇺🇸'),
(269, 'USA9', 'Grupo D', 'D', 'USA', 'EE.UU.', 9, '🇺🇸'),
(270, 'USA10', 'Grupo D', 'D', 'USA', 'EE.UU.', 10, '🇺🇸'),
(271, 'USA11', 'Grupo D', 'D', 'USA', 'EE.UU.', 11, '🇺🇸'),
(272, 'USA12', 'Grupo D', 'D', 'USA', 'EE.UU.', 12, '🇺🇸'),
(273, 'USA13', 'Grupo D', 'D', 'USA', 'EE.UU.', 13, '🇺🇸'),
(274, 'USA14', 'Grupo D', 'D', 'USA', 'EE.UU.', 14, '🇺🇸'),
(275, 'USA15', 'Grupo D', 'D', 'USA', 'EE.UU.', 15, '🇺🇸'),
(276, 'USA16', 'Grupo D', 'D', 'USA', 'EE.UU.', 16, '🇺🇸'),
(277, 'USA17', 'Grupo D', 'D', 'USA', 'EE.UU.', 17, '🇺🇸'),
(278, 'USA18', 'Grupo D', 'D', 'USA', 'EE.UU.', 18, '🇺🇸'),
(279, 'USA19', 'Grupo D', 'D', 'USA', 'EE.UU.', 19, '🇺🇸'),
(280, 'USA20', 'Grupo D', 'D', 'USA', 'EE.UU.', 20, '🇺🇸'),
(281, 'PAR1', 'Grupo D', 'D', 'PAR', 'Paraguay', 1, '🇵🇾'),
(282, 'PAR2', 'Grupo D', 'D', 'PAR', 'Paraguay', 2, '🇵🇾'),
(283, 'PAR3', 'Grupo D', 'D', 'PAR', 'Paraguay', 3, '🇵🇾'),
(284, 'PAR4', 'Grupo D', 'D', 'PAR', 'Paraguay', 4, '🇵🇾'),
(285, 'PAR5', 'Grupo D', 'D', 'PAR', 'Paraguay', 5, '🇵🇾'),
(286, 'PAR6', 'Grupo D', 'D', 'PAR', 'Paraguay', 6, '🇵🇾'),
(287, 'PAR7', 'Grupo D', 'D', 'PAR', 'Paraguay', 7, '🇵🇾'),
(288, 'PAR8', 'Grupo D', 'D', 'PAR', 'Paraguay', 8, '🇵🇾'),
(289, 'PAR9', 'Grupo D', 'D', 'PAR', 'Paraguay', 9, '🇵🇾'),
(290, 'PAR10', 'Grupo D', 'D', 'PAR', 'Paraguay', 10, '🇵🇾'),
(291, 'PAR11', 'Grupo D', 'D', 'PAR', 'Paraguay', 11, '🇵🇾'),
(292, 'PAR12', 'Grupo D', 'D', 'PAR', 'Paraguay', 12, '🇵🇾'),
(293, 'PAR13', 'Grupo D', 'D', 'PAR', 'Paraguay', 13, '🇵🇾'),
(294, 'PAR14', 'Grupo D', 'D', 'PAR', 'Paraguay', 14, '🇵🇾'),
(295, 'PAR15', 'Grupo D', 'D', 'PAR', 'Paraguay', 15, '🇵🇾'),
(296, 'PAR16', 'Grupo D', 'D', 'PAR', 'Paraguay', 16, '🇵🇾'),
(297, 'PAR17', 'Grupo D', 'D', 'PAR', 'Paraguay', 17, '🇵🇾'),
(298, 'PAR18', 'Grupo D', 'D', 'PAR', 'Paraguay', 18, '🇵🇾'),
(299, 'PAR19', 'Grupo D', 'D', 'PAR', 'Paraguay', 19, '🇵🇾'),
(300, 'PAR20', 'Grupo D', 'D', 'PAR', 'Paraguay', 20, '🇵🇾'),
(301, 'AUS1', 'Grupo D', 'D', 'AUS', 'Australia', 1, '🇦🇺'),
(302, 'AUS2', 'Grupo D', 'D', 'AUS', 'Australia', 2, '🇦🇺'),
(303, 'AUS3', 'Grupo D', 'D', 'AUS', 'Australia', 3, '🇦🇺'),
(304, 'AUS4', 'Grupo D', 'D', 'AUS', 'Australia', 4, '🇦🇺'),
(305, 'AUS5', 'Grupo D', 'D', 'AUS', 'Australia', 5, '🇦🇺'),
(306, 'AUS6', 'Grupo D', 'D', 'AUS', 'Australia', 6, '🇦🇺'),
(307, 'AUS7', 'Grupo D', 'D', 'AUS', 'Australia', 7, '🇦🇺'),
(308, 'AUS8', 'Grupo D', 'D', 'AUS', 'Australia', 8, '🇦🇺'),
(309, 'AUS9', 'Grupo D', 'D', 'AUS', 'Australia', 9, '🇦🇺'),
(310, 'AUS10', 'Grupo D', 'D', 'AUS', 'Australia', 10, '🇦🇺'),
(311, 'AUS11', 'Grupo D', 'D', 'AUS', 'Australia', 11, '🇦🇺'),
(312, 'AUS12', 'Grupo D', 'D', 'AUS', 'Australia', 12, '🇦🇺'),
(313, 'AUS13', 'Grupo D', 'D', 'AUS', 'Australia', 13, '🇦🇺'),
(314, 'AUS14', 'Grupo D', 'D', 'AUS', 'Australia', 14, '🇦🇺'),
(315, 'AUS15', 'Grupo D', 'D', 'AUS', 'Australia', 15, '🇦🇺'),
(316, 'AUS16', 'Grupo D', 'D', 'AUS', 'Australia', 16, '🇦🇺'),
(317, 'AUS17', 'Grupo D', 'D', 'AUS', 'Australia', 17, '🇦🇺'),
(318, 'AUS18', 'Grupo D', 'D', 'AUS', 'Australia', 18, '🇦🇺'),
(319, 'AUS19', 'Grupo D', 'D', 'AUS', 'Australia', 19, '🇦🇺'),
(320, 'AUS20', 'Grupo D', 'D', 'AUS', 'Australia', 20, '🇦🇺'),
(321, 'TUR1', 'Grupo D', 'D', 'TUR', 'Turquía', 1, '🇹🇷'),
(322, 'TUR2', 'Grupo D', 'D', 'TUR', 'Turquía', 2, '🇹🇷'),
(323, 'TUR3', 'Grupo D', 'D', 'TUR', 'Turquía', 3, '🇹🇷'),
(324, 'TUR4', 'Grupo D', 'D', 'TUR', 'Turquía', 4, '🇹🇷'),
(325, 'TUR5', 'Grupo D', 'D', 'TUR', 'Turquía', 5, '🇹🇷'),
(326, 'TUR6', 'Grupo D', 'D', 'TUR', 'Turquía', 6, '🇹🇷'),
(327, 'TUR7', 'Grupo D', 'D', 'TUR', 'Turquía', 7, '🇹🇷'),
(328, 'TUR8', 'Grupo D', 'D', 'TUR', 'Turquía', 8, '🇹🇷'),
(329, 'TUR9', 'Grupo D', 'D', 'TUR', 'Turquía', 9, '🇹🇷'),
(330, 'TUR10', 'Grupo D', 'D', 'TUR', 'Turquía', 10, '🇹🇷'),
(331, 'TUR11', 'Grupo D', 'D', 'TUR', 'Turquía', 11, '🇹🇷'),
(332, 'TUR12', 'Grupo D', 'D', 'TUR', 'Turquía', 12, '🇹🇷'),
(333, 'TUR13', 'Grupo D', 'D', 'TUR', 'Turquía', 13, '🇹🇷'),
(334, 'TUR14', 'Grupo D', 'D', 'TUR', 'Turquía', 14, '🇹🇷'),
(335, 'TUR15', 'Grupo D', 'D', 'TUR', 'Turquía', 15, '🇹🇷'),
(336, 'TUR16', 'Grupo D', 'D', 'TUR', 'Turquía', 16, '🇹🇷'),
(337, 'TUR17', 'Grupo D', 'D', 'TUR', 'Turquía', 17, '🇹🇷'),
(338, 'TUR18', 'Grupo D', 'D', 'TUR', 'Turquía', 18, '🇹🇷'),
(339, 'TUR19', 'Grupo D', 'D', 'TUR', 'Turquía', 19, '🇹🇷'),
(340, 'TUR20', 'Grupo D', 'D', 'TUR', 'Turquía', 20, '🇹🇷'),
(341, 'GER1', 'Grupo E', 'E', 'GER', 'Alemania', 1, '🇩🇪'),
(342, 'GER2', 'Grupo E', 'E', 'GER', 'Alemania', 2, '🇩🇪'),
(343, 'GER3', 'Grupo E', 'E', 'GER', 'Alemania', 3, '🇩🇪'),
(344, 'GER4', 'Grupo E', 'E', 'GER', 'Alemania', 4, '🇩🇪'),
(345, 'GER5', 'Grupo E', 'E', 'GER', 'Alemania', 5, '🇩🇪'),
(346, 'GER6', 'Grupo E', 'E', 'GER', 'Alemania', 6, '🇩🇪'),
(347, 'GER7', 'Grupo E', 'E', 'GER', 'Alemania', 7, '🇩🇪'),
(348, 'GER8', 'Grupo E', 'E', 'GER', 'Alemania', 8, '🇩🇪'),
(349, 'GER9', 'Grupo E', 'E', 'GER', 'Alemania', 9, '🇩🇪'),
(350, 'GER10', 'Grupo E', 'E', 'GER', 'Alemania', 10, '🇩🇪'),
(351, 'GER11', 'Grupo E', 'E', 'GER', 'Alemania', 11, '🇩🇪'),
(352, 'GER12', 'Grupo E', 'E', 'GER', 'Alemania', 12, '🇩🇪'),
(353, 'GER13', 'Grupo E', 'E', 'GER', 'Alemania', 13, '🇩🇪'),
(354, 'GER14', 'Grupo E', 'E', 'GER', 'Alemania', 14, '🇩🇪'),
(355, 'GER15', 'Grupo E', 'E', 'GER', 'Alemania', 15, '🇩🇪'),
(356, 'GER16', 'Grupo E', 'E', 'GER', 'Alemania', 16, '🇩🇪'),
(357, 'GER17', 'Grupo E', 'E', 'GER', 'Alemania', 17, '🇩🇪'),
(358, 'GER18', 'Grupo E', 'E', 'GER', 'Alemania', 18, '🇩🇪'),
(359, 'GER19', 'Grupo E', 'E', 'GER', 'Alemania', 19, '🇩🇪'),
(360, 'GER20', 'Grupo E', 'E', 'GER', 'Alemania', 20, '🇩🇪'),
(361, 'CUW1', 'Grupo E', 'E', 'CUW', 'Curazao', 1, '🇨🇼'),
(362, 'CUW2', 'Grupo E', 'E', 'CUW', 'Curazao', 2, '🇨🇼'),
(363, 'CUW3', 'Grupo E', 'E', 'CUW', 'Curazao', 3, '🇨🇼'),
(364, 'CUW4', 'Grupo E', 'E', 'CUW', 'Curazao', 4, '🇨🇼'),
(365, 'CUW5', 'Grupo E', 'E', 'CUW', 'Curazao', 5, '🇨🇼'),
(366, 'CUW6', 'Grupo E', 'E', 'CUW', 'Curazao', 6, '🇨🇼'),
(367, 'CUW7', 'Grupo E', 'E', 'CUW', 'Curazao', 7, '🇨🇼'),
(368, 'CUW8', 'Grupo E', 'E', 'CUW', 'Curazao', 8, '🇨🇼'),
(369, 'CUW9', 'Grupo E', 'E', 'CUW', 'Curazao', 9, '🇨🇼'),
(370, 'CUW10', 'Grupo E', 'E', 'CUW', 'Curazao', 10, '🇨🇼'),
(371, 'CUW11', 'Grupo E', 'E', 'CUW', 'Curazao', 11, '🇨🇼'),
(372, 'CUW12', 'Grupo E', 'E', 'CUW', 'Curazao', 12, '🇨🇼'),
(373, 'CUW13', 'Grupo E', 'E', 'CUW', 'Curazao', 13, '🇨🇼'),
(374, 'CUW14', 'Grupo E', 'E', 'CUW', 'Curazao', 14, '🇨🇼'),
(375, 'CUW15', 'Grupo E', 'E', 'CUW', 'Curazao', 15, '🇨🇼'),
(376, 'CUW16', 'Grupo E', 'E', 'CUW', 'Curazao', 16, '🇨🇼'),
(377, 'CUW17', 'Grupo E', 'E', 'CUW', 'Curazao', 17, '🇨🇼'),
(378, 'CUW18', 'Grupo E', 'E', 'CUW', 'Curazao', 18, '🇨🇼'),
(379, 'CUW19', 'Grupo E', 'E', 'CUW', 'Curazao', 19, '🇨🇼'),
(380, 'CUW20', 'Grupo E', 'E', 'CUW', 'Curazao', 20, '🇨🇼'),
(381, 'CIV1', 'Grupo E', 'E', 'CIV', 'Costa de Marfil', 1, '🇨🇮'),
(382, 'CIV2', 'Grupo E', 'E', 'CIV', 'Costa de Marfil', 2, '🇨🇮'),
(383, 'CIV3', 'Grupo E', 'E', 'CIV', 'Costa de Marfil', 3, '🇨🇮'),
(384, 'CIV4', 'Grupo E', 'E', 'CIV', 'Costa de Marfil', 4, '🇨🇮'),
(385, 'CIV5', 'Grupo E', 'E', 'CIV', 'Costa de Marfil', 5, '🇨🇮'),
(386, 'CIV6', 'Grupo E', 'E', 'CIV', 'Costa de Marfil', 6, '🇨🇮'),
(387, 'CIV7', 'Grupo E', 'E', 'CIV', 'Costa de Marfil', 7, '🇨🇮'),
(388, 'CIV8', 'Grupo E', 'E', 'CIV', 'Costa de Marfil', 8, '🇨🇮'),
(389, 'CIV9', 'Grupo E', 'E', 'CIV', 'Costa de Marfil', 9, '🇨🇮'),
(390, 'CIV10', 'Grupo E', 'E', 'CIV', 'Costa de Marfil', 10, '🇨🇮'),
(391, 'CIV11', 'Grupo E', 'E', 'CIV', 'Costa de Marfil', 11, '🇨🇮'),
(392, 'CIV12', 'Grupo E', 'E', 'CIV', 'Costa de Marfil', 12, '🇨🇮'),
(393, 'CIV13', 'Grupo E', 'E', 'CIV', 'Costa de Marfil', 13, '🇨🇮'),
(394, 'CIV14', 'Grupo E', 'E', 'CIV', 'Costa de Marfil', 14, '🇨🇮'),
(395, 'CIV15', 'Grupo E', 'E', 'CIV', 'Costa de Marfil', 15, '🇨🇮'),
(396, 'CIV16', 'Grupo E', 'E', 'CIV', 'Costa de Marfil', 16, '🇨🇮'),
(397, 'CIV17', 'Grupo E', 'E', 'CIV', 'Costa de Marfil', 17, '🇨🇮'),
(398, 'CIV18', 'Grupo E', 'E', 'CIV', 'Costa de Marfil', 18, '🇨🇮'),
(399, 'CIV19', 'Grupo E', 'E', 'CIV', 'Costa de Marfil', 19, '🇨🇮'),
(400, 'CIV20', 'Grupo E', 'E', 'CIV', 'Costa de Marfil', 20, '🇨🇮'),
(401, 'ECU1', 'Grupo E', 'E', 'ECU', 'Ecuador', 1, '🇪🇨'),
(402, 'ECU2', 'Grupo E', 'E', 'ECU', 'Ecuador', 2, '🇪🇨'),
(403, 'ECU3', 'Grupo E', 'E', 'ECU', 'Ecuador', 3, '🇪🇨'),
(404, 'ECU4', 'Grupo E', 'E', 'ECU', 'Ecuador', 4, '🇪🇨'),
(405, 'ECU5', 'Grupo E', 'E', 'ECU', 'Ecuador', 5, '🇪🇨'),
(406, 'ECU6', 'Grupo E', 'E', 'ECU', 'Ecuador', 6, '🇪🇨'),
(407, 'ECU7', 'Grupo E', 'E', 'ECU', 'Ecuador', 7, '🇪🇨'),
(408, 'ECU8', 'Grupo E', 'E', 'ECU', 'Ecuador', 8, '🇪🇨'),
(409, 'ECU9', 'Grupo E', 'E', 'ECU', 'Ecuador', 9, '🇪🇨'),
(410, 'ECU10', 'Grupo E', 'E', 'ECU', 'Ecuador', 10, '🇪🇨'),
(411, 'ECU11', 'Grupo E', 'E', 'ECU', 'Ecuador', 11, '🇪🇨'),
(412, 'ECU12', 'Grupo E', 'E', 'ECU', 'Ecuador', 12, '🇪🇨'),
(413, 'ECU13', 'Grupo E', 'E', 'ECU', 'Ecuador', 13, '🇪🇨'),
(414, 'ECU14', 'Grupo E', 'E', 'ECU', 'Ecuador', 14, '🇪🇨'),
(415, 'ECU15', 'Grupo E', 'E', 'ECU', 'Ecuador', 15, '🇪🇨'),
(416, 'ECU16', 'Grupo E', 'E', 'ECU', 'Ecuador', 16, '🇪🇨'),
(417, 'ECU17', 'Grupo E', 'E', 'ECU', 'Ecuador', 17, '🇪🇨'),
(418, 'ECU18', 'Grupo E', 'E', 'ECU', 'Ecuador', 18, '🇪🇨'),
(419, 'ECU19', 'Grupo E', 'E', 'ECU', 'Ecuador', 19, '🇪🇨'),
(420, 'ECU20', 'Grupo E', 'E', 'ECU', 'Ecuador', 20, '🇪🇨'),
(421, 'NED1', 'Grupo F', 'F', 'NED', 'Países Bajos', 1, '🇳🇱'),
(422, 'NED2', 'Grupo F', 'F', 'NED', 'Países Bajos', 2, '🇳🇱'),
(423, 'NED3', 'Grupo F', 'F', 'NED', 'Países Bajos', 3, '🇳🇱'),
(424, 'NED4', 'Grupo F', 'F', 'NED', 'Países Bajos', 4, '🇳🇱'),
(425, 'NED5', 'Grupo F', 'F', 'NED', 'Países Bajos', 5, '🇳🇱'),
(426, 'NED6', 'Grupo F', 'F', 'NED', 'Países Bajos', 6, '🇳🇱'),
(427, 'NED7', 'Grupo F', 'F', 'NED', 'Países Bajos', 7, '🇳🇱'),
(428, 'NED8', 'Grupo F', 'F', 'NED', 'Países Bajos', 8, '🇳🇱'),
(429, 'NED9', 'Grupo F', 'F', 'NED', 'Países Bajos', 9, '🇳🇱'),
(430, 'NED10', 'Grupo F', 'F', 'NED', 'Países Bajos', 10, '🇳🇱'),
(431, 'NED11', 'Grupo F', 'F', 'NED', 'Países Bajos', 11, '🇳🇱'),
(432, 'NED12', 'Grupo F', 'F', 'NED', 'Países Bajos', 12, '🇳🇱'),
(433, 'NED13', 'Grupo F', 'F', 'NED', 'Países Bajos', 13, '🇳🇱'),
(434, 'NED14', 'Grupo F', 'F', 'NED', 'Países Bajos', 14, '🇳🇱'),
(435, 'NED15', 'Grupo F', 'F', 'NED', 'Países Bajos', 15, '🇳🇱'),
(436, 'NED16', 'Grupo F', 'F', 'NED', 'Países Bajos', 16, '🇳🇱'),
(437, 'NED17', 'Grupo F', 'F', 'NED', 'Países Bajos', 17, '🇳🇱'),
(438, 'NED18', 'Grupo F', 'F', 'NED', 'Países Bajos', 18, '🇳🇱'),
(439, 'NED19', 'Grupo F', 'F', 'NED', 'Países Bajos', 19, '🇳🇱'),
(440, 'NED20', 'Grupo F', 'F', 'NED', 'Países Bajos', 20, '🇳🇱'),
(441, 'JPN1', 'Grupo F', 'F', 'JPN', 'Japón', 1, '🇯🇵'),
(442, 'JPN2', 'Grupo F', 'F', 'JPN', 'Japón', 2, '🇯🇵'),
(443, 'JPN3', 'Grupo F', 'F', 'JPN', 'Japón', 3, '🇯🇵'),
(444, 'JPN4', 'Grupo F', 'F', 'JPN', 'Japón', 4, '🇯🇵'),
(445, 'JPN5', 'Grupo F', 'F', 'JPN', 'Japón', 5, '🇯🇵'),
(446, 'JPN6', 'Grupo F', 'F', 'JPN', 'Japón', 6, '🇯🇵'),
(447, 'JPN7', 'Grupo F', 'F', 'JPN', 'Japón', 7, '🇯🇵'),
(448, 'JPN8', 'Grupo F', 'F', 'JPN', 'Japón', 8, '🇯🇵'),
(449, 'JPN9', 'Grupo F', 'F', 'JPN', 'Japón', 9, '🇯🇵'),
(450, 'JPN10', 'Grupo F', 'F', 'JPN', 'Japón', 10, '🇯🇵'),
(451, 'JPN11', 'Grupo F', 'F', 'JPN', 'Japón', 11, '🇯🇵'),
(452, 'JPN12', 'Grupo F', 'F', 'JPN', 'Japón', 12, '🇯🇵'),
(453, 'JPN13', 'Grupo F', 'F', 'JPN', 'Japón', 13, '🇯🇵'),
(454, 'JPN14', 'Grupo F', 'F', 'JPN', 'Japón', 14, '🇯🇵'),
(455, 'JPN15', 'Grupo F', 'F', 'JPN', 'Japón', 15, '🇯🇵'),
(456, 'JPN16', 'Grupo F', 'F', 'JPN', 'Japón', 16, '🇯🇵'),
(457, 'JPN17', 'Grupo F', 'F', 'JPN', 'Japón', 17, '🇯🇵'),
(458, 'JPN18', 'Grupo F', 'F', 'JPN', 'Japón', 18, '🇯🇵'),
(459, 'JPN19', 'Grupo F', 'F', 'JPN', 'Japón', 19, '🇯🇵'),
(460, 'JPN20', 'Grupo F', 'F', 'JPN', 'Japón', 20, '🇯🇵'),
(461, 'SWE1', 'Grupo F', 'F', 'SWE', 'Suecia', 1, '🇸🇪'),
(462, 'SWE2', 'Grupo F', 'F', 'SWE', 'Suecia', 2, '🇸🇪'),
(463, 'SWE3', 'Grupo F', 'F', 'SWE', 'Suecia', 3, '🇸🇪'),
(464, 'SWE4', 'Grupo F', 'F', 'SWE', 'Suecia', 4, '🇸🇪'),
(465, 'SWE5', 'Grupo F', 'F', 'SWE', 'Suecia', 5, '🇸🇪'),
(466, 'SWE6', 'Grupo F', 'F', 'SWE', 'Suecia', 6, '🇸🇪'),
(467, 'SWE7', 'Grupo F', 'F', 'SWE', 'Suecia', 7, '🇸🇪'),
(468, 'SWE8', 'Grupo F', 'F', 'SWE', 'Suecia', 8, '🇸🇪'),
(469, 'SWE9', 'Grupo F', 'F', 'SWE', 'Suecia', 9, '🇸🇪'),
(470, 'SWE10', 'Grupo F', 'F', 'SWE', 'Suecia', 10, '🇸🇪'),
(471, 'SWE11', 'Grupo F', 'F', 'SWE', 'Suecia', 11, '🇸🇪'),
(472, 'SWE12', 'Grupo F', 'F', 'SWE', 'Suecia', 12, '🇸🇪'),
(473, 'SWE13', 'Grupo F', 'F', 'SWE', 'Suecia', 13, '🇸🇪'),
(474, 'SWE14', 'Grupo F', 'F', 'SWE', 'Suecia', 14, '🇸🇪'),
(475, 'SWE15', 'Grupo F', 'F', 'SWE', 'Suecia', 15, '🇸🇪'),
(476, 'SWE16', 'Grupo F', 'F', 'SWE', 'Suecia', 16, '🇸🇪'),
(477, 'SWE17', 'Grupo F', 'F', 'SWE', 'Suecia', 17, '🇸🇪'),
(478, 'SWE18', 'Grupo F', 'F', 'SWE', 'Suecia', 18, '🇸🇪'),
(479, 'SWE19', 'Grupo F', 'F', 'SWE', 'Suecia', 19, '🇸🇪'),
(480, 'SWE20', 'Grupo F', 'F', 'SWE', 'Suecia', 20, '🇸🇪'),
(481, 'TUN1', 'Grupo F', 'F', 'TUN', 'Túnez', 1, '🇹🇳'),
(482, 'TUN2', 'Grupo F', 'F', 'TUN', 'Túnez', 2, '🇹🇳'),
(483, 'TUN3', 'Grupo F', 'F', 'TUN', 'Túnez', 3, '🇹🇳'),
(484, 'TUN4', 'Grupo F', 'F', 'TUN', 'Túnez', 4, '🇹🇳'),
(485, 'TUN5', 'Grupo F', 'F', 'TUN', 'Túnez', 5, '🇹🇳'),
(486, 'TUN6', 'Grupo F', 'F', 'TUN', 'Túnez', 6, '🇹🇳'),
(487, 'TUN7', 'Grupo F', 'F', 'TUN', 'Túnez', 7, '🇹🇳'),
(488, 'TUN8', 'Grupo F', 'F', 'TUN', 'Túnez', 8, '🇹🇳'),
(489, 'TUN9', 'Grupo F', 'F', 'TUN', 'Túnez', 9, '🇹🇳'),
(490, 'TUN10', 'Grupo F', 'F', 'TUN', 'Túnez', 10, '🇹🇳'),
(491, 'TUN11', 'Grupo F', 'F', 'TUN', 'Túnez', 11, '🇹🇳'),
(492, 'TUN12', 'Grupo F', 'F', 'TUN', 'Túnez', 12, '🇹🇳'),
(493, 'TUN13', 'Grupo F', 'F', 'TUN', 'Túnez', 13, '🇹🇳'),
(494, 'TUN14', 'Grupo F', 'F', 'TUN', 'Túnez', 14, '🇹🇳'),
(495, 'TUN15', 'Grupo F', 'F', 'TUN', 'Túnez', 15, '🇹🇳'),
(496, 'TUN16', 'Grupo F', 'F', 'TUN', 'Túnez', 16, '🇹🇳'),
(497, 'TUN17', 'Grupo F', 'F', 'TUN', 'Túnez', 17, '🇹🇳'),
(498, 'TUN18', 'Grupo F', 'F', 'TUN', 'Túnez', 18, '🇹🇳'),
(499, 'TUN19', 'Grupo F', 'F', 'TUN', 'Túnez', 19, '🇹🇳'),
(500, 'TUN20', 'Grupo F', 'F', 'TUN', 'Túnez', 20, '🇹🇳'),
(501, 'BEL1', 'Grupo G', 'G', 'BEL', 'Bélgica', 1, '🇧🇪'),
(502, 'BEL2', 'Grupo G', 'G', 'BEL', 'Bélgica', 2, '🇧🇪'),
(503, 'BEL3', 'Grupo G', 'G', 'BEL', 'Bélgica', 3, '🇧🇪'),
(504, 'BEL4', 'Grupo G', 'G', 'BEL', 'Bélgica', 4, '🇧🇪'),
(505, 'BEL5', 'Grupo G', 'G', 'BEL', 'Bélgica', 5, '🇧🇪'),
(506, 'BEL6', 'Grupo G', 'G', 'BEL', 'Bélgica', 6, '🇧🇪'),
(507, 'BEL7', 'Grupo G', 'G', 'BEL', 'Bélgica', 7, '🇧🇪'),
(508, 'BEL8', 'Grupo G', 'G', 'BEL', 'Bélgica', 8, '🇧🇪'),
(509, 'BEL9', 'Grupo G', 'G', 'BEL', 'Bélgica', 9, '🇧🇪'),
(510, 'BEL10', 'Grupo G', 'G', 'BEL', 'Bélgica', 10, '🇧🇪'),
(511, 'BEL11', 'Grupo G', 'G', 'BEL', 'Bélgica', 11, '🇧🇪'),
(512, 'BEL12', 'Grupo G', 'G', 'BEL', 'Bélgica', 12, '🇧🇪'),
(513, 'BEL13', 'Grupo G', 'G', 'BEL', 'Bélgica', 13, '🇧🇪'),
(514, 'BEL14', 'Grupo G', 'G', 'BEL', 'Bélgica', 14, '🇧🇪'),
(515, 'BEL15', 'Grupo G', 'G', 'BEL', 'Bélgica', 15, '🇧🇪'),
(516, 'BEL16', 'Grupo G', 'G', 'BEL', 'Bélgica', 16, '🇧🇪'),
(517, 'BEL17', 'Grupo G', 'G', 'BEL', 'Bélgica', 17, '🇧🇪'),
(518, 'BEL18', 'Grupo G', 'G', 'BEL', 'Bélgica', 18, '🇧🇪'),
(519, 'BEL19', 'Grupo G', 'G', 'BEL', 'Bélgica', 19, '🇧🇪'),
(520, 'BEL20', 'Grupo G', 'G', 'BEL', 'Bélgica', 20, '🇧🇪'),
(521, 'EGY1', 'Grupo G', 'G', 'EGY', 'Egipto', 1, '🇪🇬'),
(522, 'EGY2', 'Grupo G', 'G', 'EGY', 'Egipto', 2, '🇪🇬'),
(523, 'EGY3', 'Grupo G', 'G', 'EGY', 'Egipto', 3, '🇪🇬'),
(524, 'EGY4', 'Grupo G', 'G', 'EGY', 'Egipto', 4, '🇪🇬'),
(525, 'EGY5', 'Grupo G', 'G', 'EGY', 'Egipto', 5, '🇪🇬'),
(526, 'EGY6', 'Grupo G', 'G', 'EGY', 'Egipto', 6, '🇪🇬'),
(527, 'EGY7', 'Grupo G', 'G', 'EGY', 'Egipto', 7, '🇪🇬'),
(528, 'EGY8', 'Grupo G', 'G', 'EGY', 'Egipto', 8, '🇪🇬'),
(529, 'EGY9', 'Grupo G', 'G', 'EGY', 'Egipto', 9, '🇪🇬'),
(530, 'EGY10', 'Grupo G', 'G', 'EGY', 'Egipto', 10, '🇪🇬'),
(531, 'EGY11', 'Grupo G', 'G', 'EGY', 'Egipto', 11, '🇪🇬'),
(532, 'EGY12', 'Grupo G', 'G', 'EGY', 'Egipto', 12, '🇪🇬'),
(533, 'EGY13', 'Grupo G', 'G', 'EGY', 'Egipto', 13, '🇪🇬'),
(534, 'EGY14', 'Grupo G', 'G', 'EGY', 'Egipto', 14, '🇪🇬'),
(535, 'EGY15', 'Grupo G', 'G', 'EGY', 'Egipto', 15, '🇪🇬'),
(536, 'EGY16', 'Grupo G', 'G', 'EGY', 'Egipto', 16, '🇪🇬'),
(537, 'EGY17', 'Grupo G', 'G', 'EGY', 'Egipto', 17, '🇪🇬'),
(538, 'EGY18', 'Grupo G', 'G', 'EGY', 'Egipto', 18, '🇪🇬'),
(539, 'EGY19', 'Grupo G', 'G', 'EGY', 'Egipto', 19, '🇪🇬'),
(540, 'EGY20', 'Grupo G', 'G', 'EGY', 'Egipto', 20, '🇪🇬'),
(541, 'IRN1', 'Grupo G', 'G', 'IRN', 'Irán', 1, '🇮🇷'),
(542, 'IRN2', 'Grupo G', 'G', 'IRN', 'Irán', 2, '🇮🇷'),
(543, 'IRN3', 'Grupo G', 'G', 'IRN', 'Irán', 3, '🇮🇷'),
(544, 'IRN4', 'Grupo G', 'G', 'IRN', 'Irán', 4, '🇮🇷'),
(545, 'IRN5', 'Grupo G', 'G', 'IRN', 'Irán', 5, '🇮🇷'),
(546, 'IRN6', 'Grupo G', 'G', 'IRN', 'Irán', 6, '🇮🇷'),
(547, 'IRN7', 'Grupo G', 'G', 'IRN', 'Irán', 7, '🇮🇷'),
(548, 'IRN8', 'Grupo G', 'G', 'IRN', 'Irán', 8, '🇮🇷'),
(549, 'IRN9', 'Grupo G', 'G', 'IRN', 'Irán', 9, '🇮🇷'),
(550, 'IRN10', 'Grupo G', 'G', 'IRN', 'Irán', 10, '🇮🇷'),
(551, 'IRN11', 'Grupo G', 'G', 'IRN', 'Irán', 11, '🇮🇷'),
(552, 'IRN12', 'Grupo G', 'G', 'IRN', 'Irán', 12, '🇮🇷'),
(553, 'IRN13', 'Grupo G', 'G', 'IRN', 'Irán', 13, '🇮🇷'),
(554, 'IRN14', 'Grupo G', 'G', 'IRN', 'Irán', 14, '🇮🇷'),
(555, 'IRN15', 'Grupo G', 'G', 'IRN', 'Irán', 15, '🇮🇷'),
(556, 'IRN16', 'Grupo G', 'G', 'IRN', 'Irán', 16, '🇮🇷'),
(557, 'IRN17', 'Grupo G', 'G', 'IRN', 'Irán', 17, '🇮🇷'),
(558, 'IRN18', 'Grupo G', 'G', 'IRN', 'Irán', 18, '🇮🇷'),
(559, 'IRN19', 'Grupo G', 'G', 'IRN', 'Irán', 19, '🇮🇷'),
(560, 'IRN20', 'Grupo G', 'G', 'IRN', 'Irán', 20, '🇮🇷'),
(561, 'NZL1', 'Grupo G', 'G', 'NZL', 'Nueva Zelanda', 1, '🇳🇿'),
(562, 'NZL2', 'Grupo G', 'G', 'NZL', 'Nueva Zelanda', 2, '🇳🇿'),
(563, 'NZL3', 'Grupo G', 'G', 'NZL', 'Nueva Zelanda', 3, '🇳🇿'),
(564, 'NZL4', 'Grupo G', 'G', 'NZL', 'Nueva Zelanda', 4, '🇳🇿'),
(565, 'NZL5', 'Grupo G', 'G', 'NZL', 'Nueva Zelanda', 5, '🇳🇿'),
(566, 'NZL6', 'Grupo G', 'G', 'NZL', 'Nueva Zelanda', 6, '🇳🇿'),
(567, 'NZL7', 'Grupo G', 'G', 'NZL', 'Nueva Zelanda', 7, '🇳🇿'),
(568, 'NZL8', 'Grupo G', 'G', 'NZL', 'Nueva Zelanda', 8, '🇳🇿'),
(569, 'NZL9', 'Grupo G', 'G', 'NZL', 'Nueva Zelanda', 9, '🇳🇿'),
(570, 'NZL10', 'Grupo G', 'G', 'NZL', 'Nueva Zelanda', 10, '🇳🇿'),
(571, 'NZL11', 'Grupo G', 'G', 'NZL', 'Nueva Zelanda', 11, '🇳🇿'),
(572, 'NZL12', 'Grupo G', 'G', 'NZL', 'Nueva Zelanda', 12, '🇳🇿'),
(573, 'NZL13', 'Grupo G', 'G', 'NZL', 'Nueva Zelanda', 13, '🇳🇿'),
(574, 'NZL14', 'Grupo G', 'G', 'NZL', 'Nueva Zelanda', 14, '🇳🇿'),
(575, 'NZL15', 'Grupo G', 'G', 'NZL', 'Nueva Zelanda', 15, '🇳🇿'),
(576, 'NZL16', 'Grupo G', 'G', 'NZL', 'Nueva Zelanda', 16, '🇳🇿'),
(577, 'NZL17', 'Grupo G', 'G', 'NZL', 'Nueva Zelanda', 17, '🇳🇿'),
(578, 'NZL18', 'Grupo G', 'G', 'NZL', 'Nueva Zelanda', 18, '🇳🇿'),
(579, 'NZL19', 'Grupo G', 'G', 'NZL', 'Nueva Zelanda', 19, '🇳🇿'),
(580, 'NZL20', 'Grupo G', 'G', 'NZL', 'Nueva Zelanda', 20, '🇳🇿'),
(581, 'ESP1', 'Grupo H', 'H', 'ESP', 'España', 1, '🇪🇸'),
(582, 'ESP2', 'Grupo H', 'H', 'ESP', 'España', 2, '🇪🇸'),
(583, 'ESP3', 'Grupo H', 'H', 'ESP', 'España', 3, '🇪🇸'),
(584, 'ESP4', 'Grupo H', 'H', 'ESP', 'España', 4, '🇪🇸'),
(585, 'ESP5', 'Grupo H', 'H', 'ESP', 'España', 5, '🇪🇸'),
(586, 'ESP6', 'Grupo H', 'H', 'ESP', 'España', 6, '🇪🇸'),
(587, 'ESP7', 'Grupo H', 'H', 'ESP', 'España', 7, '🇪🇸'),
(588, 'ESP8', 'Grupo H', 'H', 'ESP', 'España', 8, '🇪🇸'),
(589, 'ESP9', 'Grupo H', 'H', 'ESP', 'España', 9, '🇪🇸'),
(590, 'ESP10', 'Grupo H', 'H', 'ESP', 'España', 10, '🇪🇸'),
(591, 'ESP11', 'Grupo H', 'H', 'ESP', 'España', 11, '🇪🇸'),
(592, 'ESP12', 'Grupo H', 'H', 'ESP', 'España', 12, '🇪🇸'),
(593, 'ESP13', 'Grupo H', 'H', 'ESP', 'España', 13, '🇪🇸'),
(594, 'ESP14', 'Grupo H', 'H', 'ESP', 'España', 14, '🇪🇸'),
(595, 'ESP15', 'Grupo H', 'H', 'ESP', 'España', 15, '🇪🇸'),
(596, 'ESP16', 'Grupo H', 'H', 'ESP', 'España', 16, '🇪🇸'),
(597, 'ESP17', 'Grupo H', 'H', 'ESP', 'España', 17, '🇪🇸'),
(598, 'ESP18', 'Grupo H', 'H', 'ESP', 'España', 18, '🇪🇸'),
(599, 'ESP19', 'Grupo H', 'H', 'ESP', 'España', 19, '🇪🇸'),
(600, 'ESP20', 'Grupo H', 'H', 'ESP', 'España', 20, '🇪🇸'),
(601, 'CPV1', 'Grupo H', 'H', 'CPV', 'Cabo Verde', 1, '🇨🇻'),
(602, 'CPV2', 'Grupo H', 'H', 'CPV', 'Cabo Verde', 2, '🇨🇻'),
(603, 'CPV3', 'Grupo H', 'H', 'CPV', 'Cabo Verde', 3, '🇨🇻'),
(604, 'CPV4', 'Grupo H', 'H', 'CPV', 'Cabo Verde', 4, '🇨🇻'),
(605, 'CPV5', 'Grupo H', 'H', 'CPV', 'Cabo Verde', 5, '🇨🇻'),
(606, 'CPV6', 'Grupo H', 'H', 'CPV', 'Cabo Verde', 6, '🇨🇻'),
(607, 'CPV7', 'Grupo H', 'H', 'CPV', 'Cabo Verde', 7, '🇨🇻'),
(608, 'CPV8', 'Grupo H', 'H', 'CPV', 'Cabo Verde', 8, '🇨🇻'),
(609, 'CPV9', 'Grupo H', 'H', 'CPV', 'Cabo Verde', 9, '🇨🇻'),
(610, 'CPV10', 'Grupo H', 'H', 'CPV', 'Cabo Verde', 10, '🇨🇻'),
(611, 'CPV11', 'Grupo H', 'H', 'CPV', 'Cabo Verde', 11, '🇨🇻'),
(612, 'CPV12', 'Grupo H', 'H', 'CPV', 'Cabo Verde', 12, '🇨🇻'),
(613, 'CPV13', 'Grupo H', 'H', 'CPV', 'Cabo Verde', 13, '🇨🇻'),
(614, 'CPV14', 'Grupo H', 'H', 'CPV', 'Cabo Verde', 14, '🇨🇻'),
(615, 'CPV15', 'Grupo H', 'H', 'CPV', 'Cabo Verde', 15, '🇨🇻'),
(616, 'CPV16', 'Grupo H', 'H', 'CPV', 'Cabo Verde', 16, '🇨🇻'),
(617, 'CPV17', 'Grupo H', 'H', 'CPV', 'Cabo Verde', 17, '🇨🇻'),
(618, 'CPV18', 'Grupo H', 'H', 'CPV', 'Cabo Verde', 18, '🇨🇻'),
(619, 'CPV19', 'Grupo H', 'H', 'CPV', 'Cabo Verde', 19, '🇨🇻'),
(620, 'CPV20', 'Grupo H', 'H', 'CPV', 'Cabo Verde', 20, '🇨🇻'),
(621, 'KSA1', 'Grupo H', 'H', 'KSA', 'Arabia Saudita', 1, '🇸🇦'),
(622, 'KSA2', 'Grupo H', 'H', 'KSA', 'Arabia Saudita', 2, '🇸🇦'),
(623, 'KSA3', 'Grupo H', 'H', 'KSA', 'Arabia Saudita', 3, '🇸🇦'),
(624, 'KSA4', 'Grupo H', 'H', 'KSA', 'Arabia Saudita', 4, '🇸🇦'),
(625, 'KSA5', 'Grupo H', 'H', 'KSA', 'Arabia Saudita', 5, '🇸🇦'),
(626, 'KSA6', 'Grupo H', 'H', 'KSA', 'Arabia Saudita', 6, '🇸🇦'),
(627, 'KSA7', 'Grupo H', 'H', 'KSA', 'Arabia Saudita', 7, '🇸🇦'),
(628, 'KSA8', 'Grupo H', 'H', 'KSA', 'Arabia Saudita', 8, '🇸🇦'),
(629, 'KSA9', 'Grupo H', 'H', 'KSA', 'Arabia Saudita', 9, '🇸🇦'),
(630, 'KSA10', 'Grupo H', 'H', 'KSA', 'Arabia Saudita', 10, '🇸🇦'),
(631, 'KSA11', 'Grupo H', 'H', 'KSA', 'Arabia Saudita', 11, '🇸🇦'),
(632, 'KSA12', 'Grupo H', 'H', 'KSA', 'Arabia Saudita', 12, '🇸🇦'),
(633, 'KSA13', 'Grupo H', 'H', 'KSA', 'Arabia Saudita', 13, '🇸🇦'),
(634, 'KSA14', 'Grupo H', 'H', 'KSA', 'Arabia Saudita', 14, '🇸🇦'),
(635, 'KSA15', 'Grupo H', 'H', 'KSA', 'Arabia Saudita', 15, '🇸🇦'),
(636, 'KSA16', 'Grupo H', 'H', 'KSA', 'Arabia Saudita', 16, '🇸🇦'),
(637, 'KSA17', 'Grupo H', 'H', 'KSA', 'Arabia Saudita', 17, '🇸🇦'),
(638, 'KSA18', 'Grupo H', 'H', 'KSA', 'Arabia Saudita', 18, '🇸🇦'),
(639, 'KSA19', 'Grupo H', 'H', 'KSA', 'Arabia Saudita', 19, '🇸🇦'),
(640, 'KSA20', 'Grupo H', 'H', 'KSA', 'Arabia Saudita', 20, '🇸🇦'),
(641, 'URU1', 'Grupo H', 'H', 'URU', 'Uruguay', 1, '🇺🇾'),
(642, 'URU2', 'Grupo H', 'H', 'URU', 'Uruguay', 2, '🇺🇾'),
(643, 'URU3', 'Grupo H', 'H', 'URU', 'Uruguay', 3, '🇺🇾'),
(644, 'URU4', 'Grupo H', 'H', 'URU', 'Uruguay', 4, '🇺🇾'),
(645, 'URU5', 'Grupo H', 'H', 'URU', 'Uruguay', 5, '🇺🇾'),
(646, 'URU6', 'Grupo H', 'H', 'URU', 'Uruguay', 6, '🇺🇾'),
(647, 'URU7', 'Grupo H', 'H', 'URU', 'Uruguay', 7, '🇺🇾'),
(648, 'URU8', 'Grupo H', 'H', 'URU', 'Uruguay', 8, '🇺🇾'),
(649, 'URU9', 'Grupo H', 'H', 'URU', 'Uruguay', 9, '🇺🇾'),
(650, 'URU10', 'Grupo H', 'H', 'URU', 'Uruguay', 10, '🇺🇾'),
(651, 'URU11', 'Grupo H', 'H', 'URU', 'Uruguay', 11, '🇺🇾'),
(652, 'URU12', 'Grupo H', 'H', 'URU', 'Uruguay', 12, '🇺🇾'),
(653, 'URU13', 'Grupo H', 'H', 'URU', 'Uruguay', 13, '🇺🇾'),
(654, 'URU14', 'Grupo H', 'H', 'URU', 'Uruguay', 14, '🇺🇾'),
(655, 'URU15', 'Grupo H', 'H', 'URU', 'Uruguay', 15, '🇺🇾'),
(656, 'URU16', 'Grupo H', 'H', 'URU', 'Uruguay', 16, '🇺🇾'),
(657, 'URU17', 'Grupo H', 'H', 'URU', 'Uruguay', 17, '🇺🇾'),
(658, 'URU18', 'Grupo H', 'H', 'URU', 'Uruguay', 18, '🇺🇾'),
(659, 'URU19', 'Grupo H', 'H', 'URU', 'Uruguay', 19, '🇺🇾'),
(660, 'URU20', 'Grupo H', 'H', 'URU', 'Uruguay', 20, '🇺🇾'),
(661, 'FRA1', 'Grupo I', 'I', 'FRA', 'Francia', 1, '🇫🇷'),
(662, 'FRA2', 'Grupo I', 'I', 'FRA', 'Francia', 2, '🇫🇷'),
(663, 'FRA3', 'Grupo I', 'I', 'FRA', 'Francia', 3, '🇫🇷'),
(664, 'FRA4', 'Grupo I', 'I', 'FRA', 'Francia', 4, '🇫🇷'),
(665, 'FRA5', 'Grupo I', 'I', 'FRA', 'Francia', 5, '🇫🇷'),
(666, 'FRA6', 'Grupo I', 'I', 'FRA', 'Francia', 6, '🇫🇷'),
(667, 'FRA7', 'Grupo I', 'I', 'FRA', 'Francia', 7, '🇫🇷'),
(668, 'FRA8', 'Grupo I', 'I', 'FRA', 'Francia', 8, '🇫🇷'),
(669, 'FRA9', 'Grupo I', 'I', 'FRA', 'Francia', 9, '🇫🇷'),
(670, 'FRA10', 'Grupo I', 'I', 'FRA', 'Francia', 10, '🇫🇷'),
(671, 'FRA11', 'Grupo I', 'I', 'FRA', 'Francia', 11, '🇫🇷'),
(672, 'FRA12', 'Grupo I', 'I', 'FRA', 'Francia', 12, '🇫🇷'),
(673, 'FRA13', 'Grupo I', 'I', 'FRA', 'Francia', 13, '🇫🇷'),
(674, 'FRA14', 'Grupo I', 'I', 'FRA', 'Francia', 14, '🇫🇷'),
(675, 'FRA15', 'Grupo I', 'I', 'FRA', 'Francia', 15, '🇫🇷'),
(676, 'FRA16', 'Grupo I', 'I', 'FRA', 'Francia', 16, '🇫🇷'),
(677, 'FRA17', 'Grupo I', 'I', 'FRA', 'Francia', 17, '🇫🇷'),
(678, 'FRA18', 'Grupo I', 'I', 'FRA', 'Francia', 18, '🇫🇷'),
(679, 'FRA19', 'Grupo I', 'I', 'FRA', 'Francia', 19, '🇫🇷'),
(680, 'FRA20', 'Grupo I', 'I', 'FRA', 'Francia', 20, '🇫🇷'),
(681, 'SEN1', 'Grupo I', 'I', 'SEN', 'Senegal', 1, '🇸🇳'),
(682, 'SEN2', 'Grupo I', 'I', 'SEN', 'Senegal', 2, '🇸🇳'),
(683, 'SEN3', 'Grupo I', 'I', 'SEN', 'Senegal', 3, '🇸🇳'),
(684, 'SEN4', 'Grupo I', 'I', 'SEN', 'Senegal', 4, '🇸🇳'),
(685, 'SEN5', 'Grupo I', 'I', 'SEN', 'Senegal', 5, '🇸🇳'),
(686, 'SEN6', 'Grupo I', 'I', 'SEN', 'Senegal', 6, '🇸🇳'),
(687, 'SEN7', 'Grupo I', 'I', 'SEN', 'Senegal', 7, '🇸🇳'),
(688, 'SEN8', 'Grupo I', 'I', 'SEN', 'Senegal', 8, '🇸🇳'),
(689, 'SEN9', 'Grupo I', 'I', 'SEN', 'Senegal', 9, '🇸🇳'),
(690, 'SEN10', 'Grupo I', 'I', 'SEN', 'Senegal', 10, '🇸🇳'),
(691, 'SEN11', 'Grupo I', 'I', 'SEN', 'Senegal', 11, '🇸🇳'),
(692, 'SEN12', 'Grupo I', 'I', 'SEN', 'Senegal', 12, '🇸🇳'),
(693, 'SEN13', 'Grupo I', 'I', 'SEN', 'Senegal', 13, '🇸🇳'),
(694, 'SEN14', 'Grupo I', 'I', 'SEN', 'Senegal', 14, '🇸🇳'),
(695, 'SEN15', 'Grupo I', 'I', 'SEN', 'Senegal', 15, '🇸🇳'),
(696, 'SEN16', 'Grupo I', 'I', 'SEN', 'Senegal', 16, '🇸🇳'),
(697, 'SEN17', 'Grupo I', 'I', 'SEN', 'Senegal', 17, '🇸🇳'),
(698, 'SEN18', 'Grupo I', 'I', 'SEN', 'Senegal', 18, '🇸🇳'),
(699, 'SEN19', 'Grupo I', 'I', 'SEN', 'Senegal', 19, '🇸🇳'),
(700, 'SEN20', 'Grupo I', 'I', 'SEN', 'Senegal', 20, '🇸🇳'),
(701, 'IRQ1', 'Grupo I', 'I', 'IRQ', 'Irak', 1, '🇮🇶'),
(702, 'IRQ2', 'Grupo I', 'I', 'IRQ', 'Irak', 2, '🇮🇶'),
(703, 'IRQ3', 'Grupo I', 'I', 'IRQ', 'Irak', 3, '🇮🇶'),
(704, 'IRQ4', 'Grupo I', 'I', 'IRQ', 'Irak', 4, '🇮🇶'),
(705, 'IRQ5', 'Grupo I', 'I', 'IRQ', 'Irak', 5, '🇮🇶'),
(706, 'IRQ6', 'Grupo I', 'I', 'IRQ', 'Irak', 6, '🇮🇶'),
(707, 'IRQ7', 'Grupo I', 'I', 'IRQ', 'Irak', 7, '🇮🇶'),
(708, 'IRQ8', 'Grupo I', 'I', 'IRQ', 'Irak', 8, '🇮🇶'),
(709, 'IRQ9', 'Grupo I', 'I', 'IRQ', 'Irak', 9, '🇮🇶'),
(710, 'IRQ10', 'Grupo I', 'I', 'IRQ', 'Irak', 10, '🇮🇶'),
(711, 'IRQ11', 'Grupo I', 'I', 'IRQ', 'Irak', 11, '🇮🇶'),
(712, 'IRQ12', 'Grupo I', 'I', 'IRQ', 'Irak', 12, '🇮🇶'),
(713, 'IRQ13', 'Grupo I', 'I', 'IRQ', 'Irak', 13, '🇮🇶'),
(714, 'IRQ14', 'Grupo I', 'I', 'IRQ', 'Irak', 14, '🇮🇶'),
(715, 'IRQ15', 'Grupo I', 'I', 'IRQ', 'Irak', 15, '🇮🇶'),
(716, 'IRQ16', 'Grupo I', 'I', 'IRQ', 'Irak', 16, '🇮🇶'),
(717, 'IRQ17', 'Grupo I', 'I', 'IRQ', 'Irak', 17, '🇮🇶'),
(718, 'IRQ18', 'Grupo I', 'I', 'IRQ', 'Irak', 18, '🇮🇶'),
(719, 'IRQ19', 'Grupo I', 'I', 'IRQ', 'Irak', 19, '🇮🇶'),
(720, 'IRQ20', 'Grupo I', 'I', 'IRQ', 'Irak', 20, '🇮🇶'),
(721, 'NOR1', 'Grupo I', 'I', 'NOR', 'Noruega', 1, '🇳🇴'),
(722, 'NOR2', 'Grupo I', 'I', 'NOR', 'Noruega', 2, '🇳🇴'),
(723, 'NOR3', 'Grupo I', 'I', 'NOR', 'Noruega', 3, '🇳🇴'),
(724, 'NOR4', 'Grupo I', 'I', 'NOR', 'Noruega', 4, '🇳🇴'),
(725, 'NOR5', 'Grupo I', 'I', 'NOR', 'Noruega', 5, '🇳🇴'),
(726, 'NOR6', 'Grupo I', 'I', 'NOR', 'Noruega', 6, '🇳🇴'),
(727, 'NOR7', 'Grupo I', 'I', 'NOR', 'Noruega', 7, '🇳🇴'),
(728, 'NOR8', 'Grupo I', 'I', 'NOR', 'Noruega', 8, '🇳🇴'),
(729, 'NOR9', 'Grupo I', 'I', 'NOR', 'Noruega', 9, '🇳🇴'),
(730, 'NOR10', 'Grupo I', 'I', 'NOR', 'Noruega', 10, '🇳🇴'),
(731, 'NOR11', 'Grupo I', 'I', 'NOR', 'Noruega', 11, '🇳🇴'),
(732, 'NOR12', 'Grupo I', 'I', 'NOR', 'Noruega', 12, '🇳🇴'),
(733, 'NOR13', 'Grupo I', 'I', 'NOR', 'Noruega', 13, '🇳🇴'),
(734, 'NOR14', 'Grupo I', 'I', 'NOR', 'Noruega', 14, '🇳🇴'),
(735, 'NOR15', 'Grupo I', 'I', 'NOR', 'Noruega', 15, '🇳🇴'),
(736, 'NOR16', 'Grupo I', 'I', 'NOR', 'Noruega', 16, '🇳🇴'),
(737, 'NOR17', 'Grupo I', 'I', 'NOR', 'Noruega', 17, '🇳🇴'),
(738, 'NOR18', 'Grupo I', 'I', 'NOR', 'Noruega', 18, '🇳🇴'),
(739, 'NOR19', 'Grupo I', 'I', 'NOR', 'Noruega', 19, '🇳🇴'),
(740, 'NOR20', 'Grupo I', 'I', 'NOR', 'Noruega', 20, '🇳🇴'),
(741, 'ARG1', 'Grupo J', 'J', 'ARG', 'Argentina', 1, '🇦🇷'),
(742, 'ARG2', 'Grupo J', 'J', 'ARG', 'Argentina', 2, '🇦🇷'),
(743, 'ARG3', 'Grupo J', 'J', 'ARG', 'Argentina', 3, '🇦🇷'),
(744, 'ARG4', 'Grupo J', 'J', 'ARG', 'Argentina', 4, '🇦🇷'),
(745, 'ARG5', 'Grupo J', 'J', 'ARG', 'Argentina', 5, '🇦🇷'),
(746, 'ARG6', 'Grupo J', 'J', 'ARG', 'Argentina', 6, '🇦🇷'),
(747, 'ARG7', 'Grupo J', 'J', 'ARG', 'Argentina', 7, '🇦🇷'),
(748, 'ARG8', 'Grupo J', 'J', 'ARG', 'Argentina', 8, '🇦🇷'),
(749, 'ARG9', 'Grupo J', 'J', 'ARG', 'Argentina', 9, '🇦🇷'),
(750, 'ARG10', 'Grupo J', 'J', 'ARG', 'Argentina', 10, '🇦🇷'),
(751, 'ARG11', 'Grupo J', 'J', 'ARG', 'Argentina', 11, '🇦🇷'),
(752, 'ARG12', 'Grupo J', 'J', 'ARG', 'Argentina', 12, '🇦🇷'),
(753, 'ARG13', 'Grupo J', 'J', 'ARG', 'Argentina', 13, '🇦🇷'),
(754, 'ARG14', 'Grupo J', 'J', 'ARG', 'Argentina', 14, '🇦🇷'),
(755, 'ARG15', 'Grupo J', 'J', 'ARG', 'Argentina', 15, '🇦🇷'),
(756, 'ARG16', 'Grupo J', 'J', 'ARG', 'Argentina', 16, '🇦🇷'),
(757, 'ARG17', 'Grupo J', 'J', 'ARG', 'Argentina', 17, '🇦🇷'),
(758, 'ARG18', 'Grupo J', 'J', 'ARG', 'Argentina', 18, '🇦🇷'),
(759, 'ARG19', 'Grupo J', 'J', 'ARG', 'Argentina', 19, '🇦🇷'),
(760, 'ARG20', 'Grupo J', 'J', 'ARG', 'Argentina', 20, '🇦🇷'),
(761, 'ALG1', 'Grupo J', 'J', 'ALG', 'Argelia', 1, '🇩🇿'),
(762, 'ALG2', 'Grupo J', 'J', 'ALG', 'Argelia', 2, '🇩🇿'),
(763, 'ALG3', 'Grupo J', 'J', 'ALG', 'Argelia', 3, '🇩🇿'),
(764, 'ALG4', 'Grupo J', 'J', 'ALG', 'Argelia', 4, '🇩🇿'),
(765, 'ALG5', 'Grupo J', 'J', 'ALG', 'Argelia', 5, '🇩🇿'),
(766, 'ALG6', 'Grupo J', 'J', 'ALG', 'Argelia', 6, '🇩🇿'),
(767, 'ALG7', 'Grupo J', 'J', 'ALG', 'Argelia', 7, '🇩🇿'),
(768, 'ALG8', 'Grupo J', 'J', 'ALG', 'Argelia', 8, '🇩🇿'),
(769, 'ALG9', 'Grupo J', 'J', 'ALG', 'Argelia', 9, '🇩🇿'),
(770, 'ALG10', 'Grupo J', 'J', 'ALG', 'Argelia', 10, '🇩🇿'),
(771, 'ALG11', 'Grupo J', 'J', 'ALG', 'Argelia', 11, '🇩🇿'),
(772, 'ALG12', 'Grupo J', 'J', 'ALG', 'Argelia', 12, '🇩🇿'),
(773, 'ALG13', 'Grupo J', 'J', 'ALG', 'Argelia', 13, '🇩🇿'),
(774, 'ALG14', 'Grupo J', 'J', 'ALG', 'Argelia', 14, '🇩🇿'),
(775, 'ALG15', 'Grupo J', 'J', 'ALG', 'Argelia', 15, '🇩🇿'),
(776, 'ALG16', 'Grupo J', 'J', 'ALG', 'Argelia', 16, '🇩🇿'),
(777, 'ALG17', 'Grupo J', 'J', 'ALG', 'Argelia', 17, '🇩🇿'),
(778, 'ALG18', 'Grupo J', 'J', 'ALG', 'Argelia', 18, '🇩🇿'),
(779, 'ALG19', 'Grupo J', 'J', 'ALG', 'Argelia', 19, '🇩🇿'),
(780, 'ALG20', 'Grupo J', 'J', 'ALG', 'Argelia', 20, '🇩🇿'),
(781, 'AUT1', 'Grupo J', 'J', 'AUT', 'Austria', 1, '🇦🇹'),
(782, 'AUT2', 'Grupo J', 'J', 'AUT', 'Austria', 2, '🇦🇹'),
(783, 'AUT3', 'Grupo J', 'J', 'AUT', 'Austria', 3, '🇦🇹'),
(784, 'AUT4', 'Grupo J', 'J', 'AUT', 'Austria', 4, '🇦🇹'),
(785, 'AUT5', 'Grupo J', 'J', 'AUT', 'Austria', 5, '🇦🇹'),
(786, 'AUT6', 'Grupo J', 'J', 'AUT', 'Austria', 6, '🇦🇹'),
(787, 'AUT7', 'Grupo J', 'J', 'AUT', 'Austria', 7, '🇦🇹'),
(788, 'AUT8', 'Grupo J', 'J', 'AUT', 'Austria', 8, '🇦🇹'),
(789, 'AUT9', 'Grupo J', 'J', 'AUT', 'Austria', 9, '🇦🇹'),
(790, 'AUT10', 'Grupo J', 'J', 'AUT', 'Austria', 10, '🇦🇹'),
(791, 'AUT11', 'Grupo J', 'J', 'AUT', 'Austria', 11, '🇦🇹'),
(792, 'AUT12', 'Grupo J', 'J', 'AUT', 'Austria', 12, '🇦🇹'),
(793, 'AUT13', 'Grupo J', 'J', 'AUT', 'Austria', 13, '🇦🇹'),
(794, 'AUT14', 'Grupo J', 'J', 'AUT', 'Austria', 14, '🇦🇹'),
(795, 'AUT15', 'Grupo J', 'J', 'AUT', 'Austria', 15, '🇦🇹'),
(796, 'AUT16', 'Grupo J', 'J', 'AUT', 'Austria', 16, '🇦🇹'),
(797, 'AUT17', 'Grupo J', 'J', 'AUT', 'Austria', 17, '🇦🇹'),
(798, 'AUT18', 'Grupo J', 'J', 'AUT', 'Austria', 18, '🇦🇹'),
(799, 'AUT19', 'Grupo J', 'J', 'AUT', 'Austria', 19, '🇦🇹'),
(800, 'AUT20', 'Grupo J', 'J', 'AUT', 'Austria', 20, '🇦🇹'),
(801, 'JOR1', 'Grupo J', 'J', 'JOR', 'Jordania', 1, '🇯🇴'),
(802, 'JOR2', 'Grupo J', 'J', 'JOR', 'Jordania', 2, '🇯🇴'),
(803, 'JOR3', 'Grupo J', 'J', 'JOR', 'Jordania', 3, '🇯🇴'),
(804, 'JOR4', 'Grupo J', 'J', 'JOR', 'Jordania', 4, '🇯🇴'),
(805, 'JOR5', 'Grupo J', 'J', 'JOR', 'Jordania', 5, '🇯🇴'),
(806, 'JOR6', 'Grupo J', 'J', 'JOR', 'Jordania', 6, '🇯🇴'),
(807, 'JOR7', 'Grupo J', 'J', 'JOR', 'Jordania', 7, '🇯🇴'),
(808, 'JOR8', 'Grupo J', 'J', 'JOR', 'Jordania', 8, '🇯🇴'),
(809, 'JOR9', 'Grupo J', 'J', 'JOR', 'Jordania', 9, '🇯🇴'),
(810, 'JOR10', 'Grupo J', 'J', 'JOR', 'Jordania', 10, '🇯🇴'),
(811, 'JOR11', 'Grupo J', 'J', 'JOR', 'Jordania', 11, '🇯🇴'),
(812, 'JOR12', 'Grupo J', 'J', 'JOR', 'Jordania', 12, '🇯🇴'),
(813, 'JOR13', 'Grupo J', 'J', 'JOR', 'Jordania', 13, '🇯🇴'),
(814, 'JOR14', 'Grupo J', 'J', 'JOR', 'Jordania', 14, '🇯🇴'),
(815, 'JOR15', 'Grupo J', 'J', 'JOR', 'Jordania', 15, '🇯🇴'),
(816, 'JOR16', 'Grupo J', 'J', 'JOR', 'Jordania', 16, '🇯🇴'),
(817, 'JOR17', 'Grupo J', 'J', 'JOR', 'Jordania', 17, '🇯🇴'),
(818, 'JOR18', 'Grupo J', 'J', 'JOR', 'Jordania', 18, '🇯🇴'),
(819, 'JOR19', 'Grupo J', 'J', 'JOR', 'Jordania', 19, '🇯🇴'),
(820, 'JOR20', 'Grupo J', 'J', 'JOR', 'Jordania', 20, '🇯🇴'),
(821, 'POR1', 'Grupo K', 'K', 'POR', 'Portugal', 1, '🇵🇹'),
(822, 'POR2', 'Grupo K', 'K', 'POR', 'Portugal', 2, '🇵🇹'),
(823, 'POR3', 'Grupo K', 'K', 'POR', 'Portugal', 3, '🇵🇹'),
(824, 'POR4', 'Grupo K', 'K', 'POR', 'Portugal', 4, '🇵🇹'),
(825, 'POR5', 'Grupo K', 'K', 'POR', 'Portugal', 5, '🇵🇹'),
(826, 'POR6', 'Grupo K', 'K', 'POR', 'Portugal', 6, '🇵🇹'),
(827, 'POR7', 'Grupo K', 'K', 'POR', 'Portugal', 7, '🇵🇹'),
(828, 'POR8', 'Grupo K', 'K', 'POR', 'Portugal', 8, '🇵🇹'),
(829, 'POR9', 'Grupo K', 'K', 'POR', 'Portugal', 9, '🇵🇹'),
(830, 'POR10', 'Grupo K', 'K', 'POR', 'Portugal', 10, '🇵🇹'),
(831, 'POR11', 'Grupo K', 'K', 'POR', 'Portugal', 11, '🇵🇹'),
(832, 'POR12', 'Grupo K', 'K', 'POR', 'Portugal', 12, '🇵🇹'),
(833, 'POR13', 'Grupo K', 'K', 'POR', 'Portugal', 13, '🇵🇹'),
(834, 'POR14', 'Grupo K', 'K', 'POR', 'Portugal', 14, '🇵🇹'),
(835, 'POR15', 'Grupo K', 'K', 'POR', 'Portugal', 15, '🇵🇹'),
(836, 'POR16', 'Grupo K', 'K', 'POR', 'Portugal', 16, '🇵🇹'),
(837, 'POR17', 'Grupo K', 'K', 'POR', 'Portugal', 17, '🇵🇹'),
(838, 'POR18', 'Grupo K', 'K', 'POR', 'Portugal', 18, '🇵🇹'),
(839, 'POR19', 'Grupo K', 'K', 'POR', 'Portugal', 19, '🇵🇹'),
(840, 'POR20', 'Grupo K', 'K', 'POR', 'Portugal', 20, '🇵🇹'),
(841, 'COD1', 'Grupo K', 'K', 'COD', 'R.D. Congo', 1, '🇨🇩'),
(842, 'COD2', 'Grupo K', 'K', 'COD', 'R.D. Congo', 2, '🇨🇩'),
(843, 'COD3', 'Grupo K', 'K', 'COD', 'R.D. Congo', 3, '🇨🇩'),
(844, 'COD4', 'Grupo K', 'K', 'COD', 'R.D. Congo', 4, '🇨🇩'),
(845, 'COD5', 'Grupo K', 'K', 'COD', 'R.D. Congo', 5, '🇨🇩'),
(846, 'COD6', 'Grupo K', 'K', 'COD', 'R.D. Congo', 6, '🇨🇩'),
(847, 'COD7', 'Grupo K', 'K', 'COD', 'R.D. Congo', 7, '🇨🇩'),
(848, 'COD8', 'Grupo K', 'K', 'COD', 'R.D. Congo', 8, '🇨🇩'),
(849, 'COD9', 'Grupo K', 'K', 'COD', 'R.D. Congo', 9, '🇨🇩'),
(850, 'COD10', 'Grupo K', 'K', 'COD', 'R.D. Congo', 10, '🇨🇩'),
(851, 'COD11', 'Grupo K', 'K', 'COD', 'R.D. Congo', 11, '🇨🇩'),
(852, 'COD12', 'Grupo K', 'K', 'COD', 'R.D. Congo', 12, '🇨🇩'),
(853, 'COD13', 'Grupo K', 'K', 'COD', 'R.D. Congo', 13, '🇨🇩'),
(854, 'COD14', 'Grupo K', 'K', 'COD', 'R.D. Congo', 14, '🇨🇩'),
(855, 'COD15', 'Grupo K', 'K', 'COD', 'R.D. Congo', 15, '🇨🇩'),
(856, 'COD16', 'Grupo K', 'K', 'COD', 'R.D. Congo', 16, '🇨🇩'),
(857, 'COD17', 'Grupo K', 'K', 'COD', 'R.D. Congo', 17, '🇨🇩'),
(858, 'COD18', 'Grupo K', 'K', 'COD', 'R.D. Congo', 18, '🇨🇩'),
(859, 'COD19', 'Grupo K', 'K', 'COD', 'R.D. Congo', 19, '🇨🇩'),
(860, 'COD20', 'Grupo K', 'K', 'COD', 'R.D. Congo', 20, '🇨🇩'),
(861, 'UZB1', 'Grupo K', 'K', 'UZB', 'Uzbekistán', 1, '🇺🇿'),
(862, 'UZB2', 'Grupo K', 'K', 'UZB', 'Uzbekistán', 2, '🇺🇿'),
(863, 'UZB3', 'Grupo K', 'K', 'UZB', 'Uzbekistán', 3, '🇺🇿'),
(864, 'UZB4', 'Grupo K', 'K', 'UZB', 'Uzbekistán', 4, '🇺🇿'),
(865, 'UZB5', 'Grupo K', 'K', 'UZB', 'Uzbekistán', 5, '🇺🇿'),
(866, 'UZB6', 'Grupo K', 'K', 'UZB', 'Uzbekistán', 6, '🇺🇿'),
(867, 'UZB7', 'Grupo K', 'K', 'UZB', 'Uzbekistán', 7, '🇺🇿'),
(868, 'UZB8', 'Grupo K', 'K', 'UZB', 'Uzbekistán', 8, '🇺🇿'),
(869, 'UZB9', 'Grupo K', 'K', 'UZB', 'Uzbekistán', 9, '🇺🇿'),
(870, 'UZB10', 'Grupo K', 'K', 'UZB', 'Uzbekistán', 10, '🇺🇿'),
(871, 'UZB11', 'Grupo K', 'K', 'UZB', 'Uzbekistán', 11, '🇺🇿'),
(872, 'UZB12', 'Grupo K', 'K', 'UZB', 'Uzbekistán', 12, '🇺🇿'),
(873, 'UZB13', 'Grupo K', 'K', 'UZB', 'Uzbekistán', 13, '🇺🇿'),
(874, 'UZB14', 'Grupo K', 'K', 'UZB', 'Uzbekistán', 14, '🇺🇿'),
(875, 'UZB15', 'Grupo K', 'K', 'UZB', 'Uzbekistán', 15, '🇺🇿'),
(876, 'UZB16', 'Grupo K', 'K', 'UZB', 'Uzbekistán', 16, '🇺🇿'),
(877, 'UZB17', 'Grupo K', 'K', 'UZB', 'Uzbekistán', 17, '🇺🇿'),
(878, 'UZB18', 'Grupo K', 'K', 'UZB', 'Uzbekistán', 18, '🇺🇿'),
(879, 'UZB19', 'Grupo K', 'K', 'UZB', 'Uzbekistán', 19, '🇺🇿'),
(880, 'UZB20', 'Grupo K', 'K', 'UZB', 'Uzbekistán', 20, '🇺🇿'),
(881, 'COL1', 'Grupo K', 'K', 'COL', 'Colombia', 1, '🇨🇴'),
(882, 'COL2', 'Grupo K', 'K', 'COL', 'Colombia', 2, '🇨🇴'),
(883, 'COL3', 'Grupo K', 'K', 'COL', 'Colombia', 3, '🇨🇴'),
(884, 'COL4', 'Grupo K', 'K', 'COL', 'Colombia', 4, '🇨🇴'),
(885, 'COL5', 'Grupo K', 'K', 'COL', 'Colombia', 5, '🇨🇴'),
(886, 'COL6', 'Grupo K', 'K', 'COL', 'Colombia', 6, '🇨🇴'),
(887, 'COL7', 'Grupo K', 'K', 'COL', 'Colombia', 7, '🇨🇴'),
(888, 'COL8', 'Grupo K', 'K', 'COL', 'Colombia', 8, '🇨🇴'),
(889, 'COL9', 'Grupo K', 'K', 'COL', 'Colombia', 9, '🇨🇴'),
(890, 'COL10', 'Grupo K', 'K', 'COL', 'Colombia', 10, '🇨🇴'),
(891, 'COL11', 'Grupo K', 'K', 'COL', 'Colombia', 11, '🇨🇴'),
(892, 'COL12', 'Grupo K', 'K', 'COL', 'Colombia', 12, '🇨🇴'),
(893, 'COL13', 'Grupo K', 'K', 'COL', 'Colombia', 13, '🇨🇴'),
(894, 'COL14', 'Grupo K', 'K', 'COL', 'Colombia', 14, '🇨🇴'),
(895, 'COL15', 'Grupo K', 'K', 'COL', 'Colombia', 15, '🇨🇴'),
(896, 'COL16', 'Grupo K', 'K', 'COL', 'Colombia', 16, '🇨🇴'),
(897, 'COL17', 'Grupo K', 'K', 'COL', 'Colombia', 17, '🇨🇴'),
(898, 'COL18', 'Grupo K', 'K', 'COL', 'Colombia', 18, '🇨🇴'),
(899, 'COL19', 'Grupo K', 'K', 'COL', 'Colombia', 19, '🇨🇴'),
(900, 'COL20', 'Grupo K', 'K', 'COL', 'Colombia', 20, '🇨🇴'),
(901, 'ENG1', 'Grupo L', 'L', 'ENG', 'Inglaterra', 1, '🏴'),
(902, 'ENG2', 'Grupo L', 'L', 'ENG', 'Inglaterra', 2, '🏴'),
(903, 'ENG3', 'Grupo L', 'L', 'ENG', 'Inglaterra', 3, '🏴'),
(904, 'ENG4', 'Grupo L', 'L', 'ENG', 'Inglaterra', 4, '🏴'),
(905, 'ENG5', 'Grupo L', 'L', 'ENG', 'Inglaterra', 5, '🏴'),
(906, 'ENG6', 'Grupo L', 'L', 'ENG', 'Inglaterra', 6, '🏴'),
(907, 'ENG7', 'Grupo L', 'L', 'ENG', 'Inglaterra', 7, '🏴'),
(908, 'ENG8', 'Grupo L', 'L', 'ENG', 'Inglaterra', 8, '🏴'),
(909, 'ENG9', 'Grupo L', 'L', 'ENG', 'Inglaterra', 9, '🏴'),
(910, 'ENG10', 'Grupo L', 'L', 'ENG', 'Inglaterra', 10, '🏴'),
(911, 'ENG11', 'Grupo L', 'L', 'ENG', 'Inglaterra', 11, '🏴'),
(912, 'ENG12', 'Grupo L', 'L', 'ENG', 'Inglaterra', 12, '🏴'),
(913, 'ENG13', 'Grupo L', 'L', 'ENG', 'Inglaterra', 13, '🏴'),
(914, 'ENG14', 'Grupo L', 'L', 'ENG', 'Inglaterra', 14, '🏴'),
(915, 'ENG15', 'Grupo L', 'L', 'ENG', 'Inglaterra', 15, '🏴'),
(916, 'ENG16', 'Grupo L', 'L', 'ENG', 'Inglaterra', 16, '🏴'),
(917, 'ENG17', 'Grupo L', 'L', 'ENG', 'Inglaterra', 17, '🏴'),
(918, 'ENG18', 'Grupo L', 'L', 'ENG', 'Inglaterra', 18, '🏴'),
(919, 'ENG19', 'Grupo L', 'L', 'ENG', 'Inglaterra', 19, '🏴'),
(920, 'ENG20', 'Grupo L', 'L', 'ENG', 'Inglaterra', 20, '🏴'),
(921, 'CRO1', 'Grupo L', 'L', 'CRO', 'Croacia', 1, '🇭🇷'),
(922, 'CRO2', 'Grupo L', 'L', 'CRO', 'Croacia', 2, '🇭🇷'),
(923, 'CRO3', 'Grupo L', 'L', 'CRO', 'Croacia', 3, '🇭🇷'),
(924, 'CRO4', 'Grupo L', 'L', 'CRO', 'Croacia', 4, '🇭🇷'),
(925, 'CRO5', 'Grupo L', 'L', 'CRO', 'Croacia', 5, '🇭🇷'),
(926, 'CRO6', 'Grupo L', 'L', 'CRO', 'Croacia', 6, '🇭🇷'),
(927, 'CRO7', 'Grupo L', 'L', 'CRO', 'Croacia', 7, '🇭🇷'),
(928, 'CRO8', 'Grupo L', 'L', 'CRO', 'Croacia', 8, '🇭🇷'),
(929, 'CRO9', 'Grupo L', 'L', 'CRO', 'Croacia', 9, '🇭🇷'),
(930, 'CRO10', 'Grupo L', 'L', 'CRO', 'Croacia', 10, '🇭🇷'),
(931, 'CRO11', 'Grupo L', 'L', 'CRO', 'Croacia', 11, '🇭🇷'),
(932, 'CRO12', 'Grupo L', 'L', 'CRO', 'Croacia', 12, '🇭🇷'),
(933, 'CRO13', 'Grupo L', 'L', 'CRO', 'Croacia', 13, '🇭🇷'),
(934, 'CRO14', 'Grupo L', 'L', 'CRO', 'Croacia', 14, '🇭🇷'),
(935, 'CRO15', 'Grupo L', 'L', 'CRO', 'Croacia', 15, '🇭🇷'),
(936, 'CRO16', 'Grupo L', 'L', 'CRO', 'Croacia', 16, '🇭🇷'),
(937, 'CRO17', 'Grupo L', 'L', 'CRO', 'Croacia', 17, '🇭🇷'),
(938, 'CRO18', 'Grupo L', 'L', 'CRO', 'Croacia', 18, '🇭🇷'),
(939, 'CRO19', 'Grupo L', 'L', 'CRO', 'Croacia', 19, '🇭🇷'),
(940, 'CRO20', 'Grupo L', 'L', 'CRO', 'Croacia', 20, '🇭🇷'),
(941, 'GHA1', 'Grupo L', 'L', 'GHA', 'Ghana', 1, '🇬🇭'),
(942, 'GHA2', 'Grupo L', 'L', 'GHA', 'Ghana', 2, '🇬🇭'),
(943, 'GHA3', 'Grupo L', 'L', 'GHA', 'Ghana', 3, '🇬🇭'),
(944, 'GHA4', 'Grupo L', 'L', 'GHA', 'Ghana', 4, '🇬🇭'),
(945, 'GHA5', 'Grupo L', 'L', 'GHA', 'Ghana', 5, '🇬🇭'),
(946, 'GHA6', 'Grupo L', 'L', 'GHA', 'Ghana', 6, '🇬🇭'),
(947, 'GHA7', 'Grupo L', 'L', 'GHA', 'Ghana', 7, '🇬🇭'),
(948, 'GHA8', 'Grupo L', 'L', 'GHA', 'Ghana', 8, '🇬🇭'),
(949, 'GHA9', 'Grupo L', 'L', 'GHA', 'Ghana', 9, '🇬🇭'),
(950, 'GHA10', 'Grupo L', 'L', 'GHA', 'Ghana', 10, '🇬🇭'),
(951, 'GHA11', 'Grupo L', 'L', 'GHA', 'Ghana', 11, '🇬🇭'),
(952, 'GHA12', 'Grupo L', 'L', 'GHA', 'Ghana', 12, '🇬🇭'),
(953, 'GHA13', 'Grupo L', 'L', 'GHA', 'Ghana', 13, '🇬🇭'),
(954, 'GHA14', 'Grupo L', 'L', 'GHA', 'Ghana', 14, '🇬🇭'),
(955, 'GHA15', 'Grupo L', 'L', 'GHA', 'Ghana', 15, '🇬🇭'),
(956, 'GHA16', 'Grupo L', 'L', 'GHA', 'Ghana', 16, '🇬🇭'),
(957, 'GHA17', 'Grupo L', 'L', 'GHA', 'Ghana', 17, '🇬🇭'),
(958, 'GHA18', 'Grupo L', 'L', 'GHA', 'Ghana', 18, '🇬🇭'),
(959, 'GHA19', 'Grupo L', 'L', 'GHA', 'Ghana', 19, '🇬🇭'),
(960, 'GHA20', 'Grupo L', 'L', 'GHA', 'Ghana', 20, '🇬🇭'),
(961, 'PAN1', 'Grupo L', 'L', 'PAN', 'Panamá', 1, '🇵🇦'),
(962, 'PAN2', 'Grupo L', 'L', 'PAN', 'Panamá', 2, '🇵🇦'),
(963, 'PAN3', 'Grupo L', 'L', 'PAN', 'Panamá', 3, '🇵🇦'),
(964, 'PAN4', 'Grupo L', 'L', 'PAN', 'Panamá', 4, '🇵🇦'),
(965, 'PAN5', 'Grupo L', 'L', 'PAN', 'Panamá', 5, '🇵🇦'),
(966, 'PAN6', 'Grupo L', 'L', 'PAN', 'Panamá', 6, '🇵🇦'),
(967, 'PAN7', 'Grupo L', 'L', 'PAN', 'Panamá', 7, '🇵🇦'),
(968, 'PAN8', 'Grupo L', 'L', 'PAN', 'Panamá', 8, '🇵🇦'),
(969, 'PAN9', 'Grupo L', 'L', 'PAN', 'Panamá', 9, '🇵🇦'),
(970, 'PAN10', 'Grupo L', 'L', 'PAN', 'Panamá', 10, '🇵🇦'),
(971, 'PAN11', 'Grupo L', 'L', 'PAN', 'Panamá', 11, '🇵🇦'),
(972, 'PAN12', 'Grupo L', 'L', 'PAN', 'Panamá', 12, '🇵🇦'),
(973, 'PAN13', 'Grupo L', 'L', 'PAN', 'Panamá', 13, '🇵🇦'),
(974, 'PAN14', 'Grupo L', 'L', 'PAN', 'Panamá', 14, '🇵🇦'),
(975, 'PAN15', 'Grupo L', 'L', 'PAN', 'Panamá', 15, '🇵🇦'),
(976, 'PAN16', 'Grupo L', 'L', 'PAN', 'Panamá', 16, '🇵🇦'),
(977, 'PAN17', 'Grupo L', 'L', 'PAN', 'Panamá', 17, '🇵🇦'),
(978, 'PAN18', 'Grupo L', 'L', 'PAN', 'Panamá', 18, '🇵🇦'),
(979, 'PAN19', 'Grupo L', 'L', 'PAN', 'Panamá', 19, '🇵🇦'),
(980, 'PAN20', 'Grupo L', 'L', 'PAN', 'Panamá', 20, '🇵🇦'),
(981, 'CC1', 'CC', 'CC', 'CC', 'Especiales CC', 1, '⭐'),
(982, 'CC2', 'CC', 'CC', 'CC', 'Especiales CC', 2, '⭐'),
(983, 'CC3', 'CC', 'CC', 'CC', 'Especiales CC', 3, '⭐'),
(984, 'CC4', 'CC', 'CC', 'CC', 'Especiales CC', 4, '⭐'),
(985, 'CC5', 'CC', 'CC', 'CC', 'Especiales CC', 5, '⭐'),
(986, 'CC6', 'CC', 'CC', 'CC', 'Especiales CC', 6, '⭐'),
(987, 'CC7', 'CC', 'CC', 'CC', 'Especiales CC', 7, '⭐'),
(988, 'CC8', 'CC', 'CC', 'CC', 'Especiales CC', 8, '⭐'),
(989, 'CC9', 'CC', 'CC', 'CC', 'Especiales CC', 9, '⭐'),
(990, 'CC10', 'CC', 'CC', 'CC', 'Especiales CC', 10, '⭐'),
(991, 'CC11', 'CC', 'CC', 'CC', 'Especiales CC', 11, '⭐'),
(992, 'CC12', 'CC', 'CC', 'CC', 'Especiales CC', 12, '⭐'),
(993, 'CC13', 'CC', 'CC', 'CC', 'Especiales CC', 13, '⭐'),
(994, 'CC14', 'CC', 'CC', 'CC', 'Especiales CC', 14, '⭐')
on conflict (ordinal) do update set code=excluded.code, section=excluded.section, group_key=excluded.group_key, team=excluded.team, team_name=excluded.team_name, number=excluded.number, flag=excluded.flag;


-- =========================================================
-- USO GRATUITO / LIMITES DIARIOS
-- =========================================================
alter table public.profiles add column if not exists free_swipes_used_today integer not null default 0;
alter table public.profiles add column if not exists free_profiles_viewed_today integer not null default 0;
alter table public.profiles add column if not exists free_usage_day date default current_date;


-- =========================================================
-- PLANES COMERCIALES CONFIGURADOS EN APP
-- Gratis: $0, límites diarios.
-- Premium: $2.000/semana.
-- Extras: $1.500/semana, beneficios se renuevan diariamente.
-- Pro Total: $3.000/semana.
-- Los links de pago se configuran en Vercel con variables NEXT_PUBLIC_MP_LINK_*
-- =========================================================
