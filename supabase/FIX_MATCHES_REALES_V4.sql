-- FIX MATCHES REALES V4 - Mundial 2026
-- Ejecutar en Supabase SQL Editor antes de probar los dos modos.
-- Corrige: total 994, constraints viejos 1..980, columnas de planes/Tinder/chat
-- y permisos RLS para que el cálculo pueda leer álbumes/repetidas de otros usuarios.

insert into public.albums (name, total_figus)
values ('Mundial 2026', 994)
on conflict (name) do update set total_figus = 994, updated_at = now();

alter table public.user_repeated_figus drop constraint if exists user_repeated_figus_figu_number_check;
alter table public.user_repeated_figus add constraint user_repeated_figus_figu_number_check
check (figu_number between 1 and 994);

alter table public.figu_matches add column if not exists match_score int not null default 1;
alter table public.figu_matches add column if not exists distance_km numeric;
alter table public.figu_matches add column if not exists meeting_suggestion text;
alter table public.figu_matches add column if not exists completed_at timestamptz;

alter table public.figu_matches add column if not exists liked_by_user1 boolean not null default false;
alter table public.figu_matches add column if not exists liked_by_user2 boolean not null default false;
alter table public.figu_matches add column if not exists mutual_interest boolean not null default false;
alter table public.figu_matches add column if not exists rejected_by_user1 boolean not null default false;
alter table public.figu_matches add column if not exists rejected_by_user2 boolean not null default false;
alter table public.figu_matches add column if not exists hidden_by_user1 boolean not null default false;
alter table public.figu_matches add column if not exists hidden_by_user2 boolean not null default false;
alter table public.figu_matches add column if not exists trade_applied boolean not null default false;
alter table public.figu_matches add column if not exists trade_applied_at timestamptz;
alter table public.figu_matches add column if not exists user1_confirmed_trade boolean not null default false;
alter table public.figu_matches add column if not exists user2_confirmed_trade boolean not null default false;

alter table public.figu_matches drop constraint if exists figu_matches_status_check;
alter table public.figu_matches add constraint figu_matches_status_check
check (status in ('PENDIENTE','HABLANDO','ACORDADO','INTERCAMBIADO','CANCELADO'));

alter table public.figu_matches drop constraint if exists figu_matches_match_score_check;
alter table public.figu_matches add constraint figu_matches_match_score_check check (match_score between 1 and 100);

create index if not exists idx_figu_matches_distance on public.figu_matches(distance_km);
create index if not exists idx_figu_matches_mutual_interest on public.figu_matches(mutual_interest);
create index if not exists idx_figu_matches_rejected_user1 on public.figu_matches(rejected_by_user1);
create index if not exists idx_figu_matches_rejected_user2 on public.figu_matches(rejected_by_user2);
create index if not exists idx_figu_matches_hidden_user1 on public.figu_matches(hidden_by_user1);
create index if not exists idx_figu_matches_hidden_user2 on public.figu_matches(hidden_by_user2);
create index if not exists idx_figu_matches_trade_applied on public.figu_matches(trade_applied);
create index if not exists idx_figu_matches_confirm_trade on public.figu_matches(user1_confirmed_trade, user2_confirmed_trade);
create index if not exists idx_figu_chat_messages_match_created on public.figu_chat_messages(match_id, created_at desc);

alter table public.profiles add column if not exists terms_accepted boolean not null default false;
alter table public.profiles add column if not exists terms_accepted_at timestamptz;
alter table public.profiles add column if not exists is_adult_confirmed boolean not null default false;
alter table public.profiles add column if not exists notifications_enabled boolean not null default false;
alter table public.profiles add column if not exists notifications_updated_at timestamptz;
alter table public.profiles add column if not exists plan_type text not null default 'FREE';
alter table public.profiles add column if not exists is_premium boolean not null default false;
alter table public.profiles add column if not exists premium_until timestamptz;
alter table public.profiles add column if not exists boosts_available int not null default 0;
alter table public.profiles add column if not exists instant_searches_available int not null default 0;
alter table public.profiles add column if not exists radar_uses_available int not null default 0;
alter table public.profiles add column if not exists plan_granted_by_admin boolean not null default false;
alter table public.profiles add column if not exists plan_notes text;
alter table public.profiles add column if not exists free_swipes_used_today int not null default 0;
alter table public.profiles add column if not exists free_profiles_viewed_today int not null default 0;
alter table public.profiles add column if not exists free_undo_used_today int not null default 0;
alter table public.profiles add column if not exists benefits_reset_date date not null default current_date;
alter table public.profiles add column if not exists plan_updated_at timestamptz;

-- MVP/dev: permitir lectura/escritura desde la app con anon key.
-- Si después endurecemos seguridad, esta lógica conviene moverla a RPC/server actions.
alter table public.albums enable row level security;
alter table public.user_album_progress enable row level security;
alter table public.user_repeated_figus enable row level security;
alter table public.figu_requests enable row level security;
alter table public.figu_matches enable row level security;
alter table public.figu_chat_messages enable row level security;
alter table public.figu_exchange_reviews enable row level security;

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
