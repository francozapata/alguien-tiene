import { User } from "firebase/auth";
import { supabase } from "@/lib/supabase";
import { getOrCreateProfile } from "@/services/profiles";
import { MUNDIAL_2026_ALBUM_NAME, TOTAL_FIGUS_MUNDIAL } from "@/types/figus";
import { formatStickerList, parseStickerCounts, parseStickerInput, STICKER_CATALOG } from "@/lib/figus/catalog";
import { ensureDailyBenefits, getPlanLimits, normalizeSubscription } from "@/services/subscriptions";

export function serializeFigus(figus: number[]) {
  // Internamente guardamos ordinales del catálogo, pero la UI muestra códigos FIFA/Panini.
  // Validamos contra STICKER_CATALOG para no depender de numeración corrida histórica.
  const validOrdinals = new Set(STICKER_CATALOG.map((sticker) => sticker.ordinal));
  return Array.from(new Set((figus ?? []).map(Number)))
    .filter((n) => Number.isInteger(n) && validOrdinals.has(n))
    .sort((a, b) => a - b);
}

export function parseFiguInput(value: string): number[] {
  return parseStickerInput(value);
}

export function parseFiguCounts(value: string): Record<number, number> {
  return parseStickerCounts(value);
}

function normalizeZone(value?: string | null) {
  return value?.trim() || null;
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function calculateDistanceKm(a?: { lat?: unknown; lng?: unknown } | null, b?: { lat?: unknown; lng?: unknown } | null) {
  const lat1 = toNumber(a?.lat);
  const lng1 = toNumber(a?.lng);
  const lat2 = toNumber(b?.lat);
  const lng2 = toNumber(b?.lng);
  if (lat1 === null || lng1 === null || lat2 === null || lng2 === null) return null;

  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const rLat1 = (lat1 * Math.PI) / 180;
  const rLat2 = (lat2 * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLng / 2) ** 2;
  const distance = Math.round(R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)) * 10) / 10;

  // MVP local: si la distancia da absurda, probablemente hay coordenadas viejas/malas.
  // Evitamos mostrar datos falsos como 7000 km.
  if (distance > 100) return null;

  return distance;
}

function distanceScore(distanceKm?: number | null) {
  if (distanceKm === null || distanceKm === undefined) return 0;
  if (distanceKm <= 1) return 18;
  if (distanceKm <= 3) return 15;
  if (distanceKm <= 5) return 11;
  if (distanceKm <= 10) return 7;
  if (distanceKm <= 20) return 3;
  return 0;
}

export async function saveMyFiguLocation(firebaseUser: User, lat: number, lng: number) {
  const profile = await getOrCreateProfile(firebaseUser);
  const { error } = await supabase
    .from("profiles")
    .update({
      lat,
      lng,
      location_updated_at: new Date().toISOString(),
    })
    .eq("id", profile.id);

  if (error) throw new Error(error.message);
}

export function calculateNeededFromOwned(ownedFigus: number[]) {
  const owned = new Set(serializeFigus(ownedFigus));
  return STICKER_CATALOG.map((sticker) => sticker.ordinal).filter((n) => !owned.has(n));
}

function calculateScore(input: {
  exchangeCount: number;
  distanceKm?: number | null;
  otherUrgent?: boolean;
  otherPriority?: number;
}) {
  // Tinder y modo simple comparten el mismo match real 1x1.
  // El score prioriza cantidad de intercambios, pero en ciudades grandes la cercanía pesa mucho.
  let score = 0;
  score += Math.min(input.exchangeCount * 18, 60);
  score += distanceScore(input.distanceKm) * 1.5;
  if (input.otherUrgent) score += 4;
  score += input.otherPriority ?? 0;
  return Math.max(1, Math.min(100, Math.round(score)));
}

function suggestMeetingPlace(city?: string | null, neighborhood?: string | null) {
  const n = (neighborhood ?? "").toLowerCase();
  if (n.includes("nueva")) return "Nueva Córdoba: Patio Olmos, Buen Pastor o Plaza España";
  if (n.includes("centro")) return "Centro: Patio Olmos, Plaza San Martín o zona peatonal";
  if (n.includes("alberdi")) return "Alberdi: Plaza Colón o zona Central de Policía";
  if (n.includes("general paz")) return "General Paz: plaza del barrio o zona 24 de Septiembre";
  if ((city ?? "").toLowerCase().includes("córdoba")) return "Córdoba: elegí un punto público, iluminado y con movimiento";
  return "Sugerencia: punto público, iluminado y con movimiento";
}


export async function getNearbyFiguUsers(firebaseUser: User, radiusKm = 10) {
  const profile = await getOrCreateProfile(firebaseUser);
  const album = await getMundialAlbum();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, display_name, email, avatar_url, city, neighborhood, lat, lng")
    .neq("id", profile.id)
    .not("lat", "is", null)
    .not("lng", "is", null);

  if (error) throw new Error(error.message);

  const ids = (profiles ?? []).map((p: any) => p.id);
  const [{ data: progressRows }, { data: repeatedRows }, { data: reputationRows }] = await Promise.all([
    ids.length ? supabase.from("user_album_progress").select("user_id, owned_figus").eq("album_id", album.id).in("user_id", ids) : Promise.resolve({ data: [] }),
    ids.length ? supabase.from("user_repeated_figus").select("user_id, quantity").eq("album_id", album.id).in("user_id", ids) : Promise.resolve({ data: [] }),
    ids.length ? supabase.from("figu_user_reputation").select("*").in("user_id", ids) : Promise.resolve({ data: [] }),
  ] as any);

  const progressByUser = new Map<string, any>((progressRows ?? []).map((row: any) => [row.user_id, row]));
  const reputationByUser = new Map<string, any>((reputationRows ?? []).map((row: any) => [row.user_id, row]));
  const repeatedByUser = new Map<string, number>();

  for (const row of repeatedRows ?? []) {
    repeatedByUser.set(row.user_id, (repeatedByUser.get(row.user_id) ?? 0) + Number(row.quantity ?? 0));
  }

  return (profiles ?? [])
    .map((other: any) => {
      const distance = calculateDistanceKm(profile as any, other);
      const progress = progressByUser.get(other.id);
      const ownedCount = progress?.owned_figus?.length ?? 0;
      const rep = reputationByUser.get(other.id);

      return {
        user_id: other.id,
        display_name: other.display_name,
        email: other.email,
        avatar_url: other.avatar_url,
        city: other.city,
        neighborhood: other.neighborhood,
        distance_km: distance,
        album_percent: Math.round((ownedCount / TOTAL_FIGUS_MUNDIAL) * 1000) / 10,
        owned_count: ownedCount,
        repeated_count: repeatedByUser.get(other.id) ?? 0,
        reviews_count: rep?.reviews_count ?? 0,
        avg_rating: rep?.avg_rating ?? null,
        successful_exchanges: rep?.fulfilled_count ?? 0,
      };
    })
    .filter((u: any) => u.distance_km !== null && u.distance_km <= radiusKm)
    .sort((a: any, b: any) => (a.distance_km ?? 9999) - (b.distance_km ?? 9999));
}

export async function getMundialAlbum() {
  const { data: existing, error } = await supabase.from("albums").select("*").eq("name", MUNDIAL_2026_ALBUM_NAME).maybeSingle();
  if (error) throw new Error(error.message);
  if (existing) return existing;

  const { data, error: insertError } = await supabase
    .from("albums")
    .insert({ name: MUNDIAL_2026_ALBUM_NAME, total_figus: TOTAL_FIGUS_MUNDIAL })
    .select("*")
    .single();

  if (insertError) throw new Error(insertError.message);
  return data;
}

export async function getMyFiguBootstrap(firebaseUser: User) {
  const profile = await getOrCreateProfile(firebaseUser);
  const album = await getMundialAlbum();

  const [{ data: progress, error: progressError }, { data: repeated, error: repeatedError }, { data: request, error: requestError }] = await Promise.all([
    supabase.from("user_album_progress").select("*").eq("user_id", profile.id).eq("album_id", album.id).maybeSingle(),
    supabase.from("user_repeated_figus").select("figu_number, quantity").eq("user_id", profile.id).eq("album_id", album.id).order("figu_number", { ascending: true }),
    supabase.from("figu_requests").select("*").eq("user_id", profile.id).eq("album_id", album.id).eq("is_active", true).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  if (progressError) throw new Error(progressError.message);
  if (repeatedError) throw new Error(repeatedError.message);
  if (requestError) throw new Error(requestError.message);

  return { profile, album, progress, repeated: repeated ?? [], request };
}

export async function saveOwnedFigus(firebaseUser: User, ownedFigus: number[]) {
  const profile = await getOrCreateProfile(firebaseUser);
  const album = await getMundialAlbum();
  const clean = serializeFigus(ownedFigus);
  const { error } = await supabase.from("user_album_progress").upsert(
    { user_id: profile.id, album_id: album.id, owned_figus: clean, completion_percentage: Math.round((clean.length / TOTAL_FIGUS_MUNDIAL) * 10000) / 100, updated_at: new Date().toISOString() },
    { onConflict: "user_id,album_id" }
  );
  if (error) throw new Error(error.message);

  // Al guardar el álbum recalculamos matches para que el modo simple y Tinder
  // usen siempre el estado real del álbum, no una solicitud vieja.
  await refreshMyFiguMatches(firebaseUser);
}

export async function saveRepeatedFigus(firebaseUser: User, repeated: Record<number, number>) {
  const profile = await getOrCreateProfile(firebaseUser);
  const album = await getMundialAlbum();

  const { error: deleteError } = await supabase.from("user_repeated_figus").delete().eq("user_id", profile.id).eq("album_id", album.id);
  if (deleteError) throw new Error(deleteError.message);

  const rows = Object.entries(repeated)
    .map(([figu, quantity]) => ({ user_id: profile.id, album_id: album.id, figu_number: Number(figu), quantity: Math.max(1, Number(quantity)), updated_at: new Date().toISOString() }))
    .filter((row) => serializeFigus([row.figu_number]).length === 1 && row.quantity > 0);

  if (rows.length > 0) {
    const { error } = await supabase.from("user_repeated_figus").insert(rows);
    if (error) throw new Error(error.message);
  }

  await refreshMyFiguMatches(firebaseUser);
}

export async function saveFiguRequest(firebaseUser: User, input: { neededFigus: number[]; isUrgent: boolean; city: string; neighborhood: string; notes: string; }) {
  const profile = await getOrCreateProfile(firebaseUser);
  const album = await getMundialAlbum();

  await supabase.from("figu_requests").update({ is_active: false, updated_at: new Date().toISOString() }).eq("user_id", profile.id).eq("album_id", album.id).eq("is_active", true);

  const { data, error } = await supabase
    .from("figu_requests")
    .insert({ user_id: profile.id, album_id: album.id, needed_figus: serializeFigus(input.neededFigus), is_urgent: input.isUrgent, city: normalizeZone(input.city), neighborhood: normalizeZone(input.neighborhood), notes: input.notes.trim() || null, is_active: true })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  await generateMatchesForUser(profile.id, album.id);
  return data;
}


async function enrichMatchesWithReputation(matches: any[], profileId: string, albumId: string) {
  const otherIds = Array.from(new Set(matches.flatMap((match: any) => [match.user1_id, match.user2_id]).filter((id: string) => id && id !== profileId)));

  if (otherIds.length === 0) return matches;

  const [{ data: progressRows }, { data: reputationRows }] = await Promise.all([
    supabase
      .from("user_album_progress")
      .select("user_id, owned_figus")
      .eq("album_id", albumId)
      .in("user_id", otherIds),
    supabase
      .from("figu_user_reputation")
      .select("*")
      .in("user_id", otherIds),
  ]);

  const percentByUser = new Map<string, number>(
    (progressRows ?? []).map((row: any) => [
      row.user_id,
      Math.round(((row.owned_figus?.length ?? 0) / TOTAL_FIGUS_MUNDIAL) * 1000) / 10,
    ])
  );

  const reputationByUser = new Map<string, any>((reputationRows ?? []).map((row: any) => [row.user_id, row]));

  for (const match of matches as any[]) {
    for (const side of ["user1", "user2"]) {
      const id = side === "user1" ? match.user1_id : match.user2_id;
      if (!match[side]) continue;
      if (percentByUser.has(id)) match[side].album_percent = percentByUser.get(id);
      const rep = reputationByUser.get(id);
      if (rep) {
        match[side].reviews_count = rep.reviews_count ?? 0;
        match[side].avg_rating = rep.avg_rating ?? null;
        match[side].successful_exchanges = rep.fulfilled_count ?? 0;
      }
    }
  }

  return matches;
}


export async function getMyMatches(firebaseUser: User) {
  const profile = await getOrCreateProfile(firebaseUser);
  const album = await getMundialAlbum();
  const { data, error } = await supabase
    .from("figu_matches")
    .select(`*, user1:profiles!figu_matches_user1_id_fkey(display_name, avatar_url, email), user2:profiles!figu_matches_user2_id_fkey(display_name, avatar_url, email)`)
    .eq("album_id", album.id)
    .eq("is_active", true)
    .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`)
    .order("match_score", { ascending: false })
    .order("distance_km", { ascending: true, nullsFirst: false })
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);

  const matches = await enrichMatchesWithReputation(data ?? [], profile.id, album.id);

  return { profile, matches };
}

export async function refreshMyFiguMatches(firebaseUser: User) {
  const profile = await getOrCreateProfile(firebaseUser);
  const album = await getMundialAlbum();
  return generateMatchesForUser(profile.id, album.id);
}

function selectFairExchange(currentUserGets: number[], otherUserGets: number[]) {
  const cleanCurrent = serializeFigus(currentUserGets);
  const cleanOther = serializeFigus(otherUserGets);
  const max = Math.min(cleanCurrent.length, cleanOther.length);
  return {
    currentUserGets: cleanCurrent.slice(0, max),
    otherUserGets: cleanOther.slice(0, max),
    count: max,
  };
}

export async function generateMatchesForUser(userId: string, albumId: string) {
  // El match ya no depende de que ambos usuarios tengan una solicitud activa.
  // La fuente de verdad es:
  // - user_album_progress.owned_figus = todas las figuritas que el usuario tiene.
  // - user_repeated_figus = excedentes que puede entregar.
  // Regla 1x1: ambos tienen que recibir y entregar la misma cantidad.

  const { data: myRequest, error: requestError } = await supabase
    .from("figu_requests")
    .select("*")
    .eq("user_id", userId)
    .eq("album_id", albumId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (requestError) throw new Error(requestError.message);

  await supabase
    .from("figu_matches")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("album_id", albumId)
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .eq("status", "PENDIENTE");

  const { data: progressRows, error: progressError } = await supabase
    .from("user_album_progress")
    .select("user_id, owned_figus")
    .eq("album_id", albumId);

  if (progressError) throw new Error(progressError.message);

  const progressByUser = new Map<string, number[]>(
    (progressRows ?? []).map((row: any) => [row.user_id, serializeFigus((row.owned_figus ?? []) as number[])])
  );

  const myOwned = progressByUser.get(userId) ?? [];
  if (myOwned.length === 0) return [];

  const { data: allRepeated, error: repeatedError } = await supabase
    .from("user_repeated_figus")
    .select("user_id, figu_number, quantity")
    .eq("album_id", albumId);

  if (repeatedError) throw new Error(repeatedError.message);

  const repeatedByUser = new Map<string, Set<number>>();
  for (const row of allRepeated ?? []) {
    if (Number(row.quantity ?? 0) <= 0) continue;
    const set = repeatedByUser.get(row.user_id) ?? new Set<number>();
    set.add(Number(row.figu_number));
    repeatedByUser.set(row.user_id, set);
  }

  const myRepeated = repeatedByUser.get(userId) ?? new Set<number>();
  if (myRepeated.size === 0) return [];

  const candidateUserIds = Array.from(progressByUser.keys()).filter((id) => id !== userId);
  if (candidateUserIds.length === 0) return [];

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, lat, lng, city, neighborhood, plan_type, is_premium, premium_until, boosts_available, instant_searches_available, radar_uses_available, plan_granted_by_admin, plan_notes")
    .in("id", [...candidateUserIds, userId]);

  if (profilesError) throw new Error(profilesError.message);

  const profileById = new Map<string, any>((profiles ?? []).map((p: any) => [p.id, p]));
  const myProfile = profileById.get(userId) ?? null;

  const { data: requestRows, error: otherRequestsError } = await supabase
    .from("figu_requests")
    .select("user_id, is_urgent, city, neighborhood")
    .eq("album_id", albumId)
    .eq("is_active", true)
    .in("user_id", candidateUserIds);

  if (otherRequestsError) throw new Error(otherRequestsError.message);

  const requestByUser = new Map<string, any>((requestRows ?? []).map((row: any) => [row.user_id, row]));
  const myNeeded = new Set<number>(calculateNeededFromOwned(myOwned));
  const created = [];

  for (const otherUserId of candidateUserIds) {
    const otherProfile = profileById.get(otherUserId) ?? null;
    const distanceKm = calculateDistanceKm(myProfile, otherProfile);

    // La ubicación mejora el orden, pero NO debe matar el match.
    // Si falta en alguno, igual mostramos el intercambio como “Ubicación por confirmar”.

    const otherOwned = progressByUser.get(otherUserId) ?? [];
    const otherRepeatedSet = repeatedByUser.get(otherUserId) ?? new Set<number>();
    if (otherOwned.length === 0 || otherRepeatedSet.size === 0) continue;

    const otherNeeded = new Set<number>(calculateNeededFromOwned(otherOwned));

    const rawCurrentUserGets: number[] = Array.from(myNeeded).filter((figu) => otherRepeatedSet.has(figu));
    const rawOtherUserGets: number[] = Array.from(otherNeeded).filter((figu) => myRepeated.has(figu));

    // Regla final: si no hay intercambio mutuo, no hay match.
    if (rawCurrentUserGets.length === 0 || rawOtherUserGets.length === 0) continue;

    const fair = selectFairExchange(rawCurrentUserGets, rawOtherUserGets);
    if (fair.count <= 0) continue;

    const user1 = userId < otherUserId ? userId : otherUserId;
    const user2 = userId < otherUserId ? otherUserId : userId;
    const currentUserIsUser1 = user1 === userId;
    const otherSubscription = normalizeSubscription(otherProfile);
    const otherPriority = getPlanLimits(otherSubscription).priorityWeight;
    const otherRequest = requestByUser.get(otherUserId) ?? null;
    const score = calculateScore({ exchangeCount: fair.count, distanceKm, otherUrgent: Boolean(otherRequest?.is_urgent), otherPriority });

    const city = myProfile?.city ?? otherProfile?.city ?? myRequest?.city ?? otherRequest?.city ?? null;
    const neighborhood = myProfile?.neighborhood ?? otherProfile?.neighborhood ?? myRequest?.neighborhood ?? otherRequest?.neighborhood ?? null;

    const { data: existingMatch, error: existingMatchError } = await supabase
      .from("figu_matches")
      .select("id,status,liked_by_user1,liked_by_user2,mutual_interest,rejected_by_user1,rejected_by_user2,hidden_by_user1,hidden_by_user2,trade_applied,user1_confirmed_trade,user2_confirmed_trade")
      .eq("user1_id", user1)
      .eq("user2_id", user2)
      .eq("album_id", albumId)
      .maybeSingle();

    if (existingMatchError) {
      throw new Error(`No se pudo leer un match existente. Revisá/ejecutá supabase/FIX_MATCHES_REALES_V4.sql. Detalle: ${existingMatchError.message}`);
    }

    const preservedStatus = existingMatch && (existingMatch.mutual_interest || ["HABLANDO", "ACORDADO", "INTERCAMBIADO"].includes(String(existingMatch.status || "")))
      ? existingMatch.status
      : "PENDIENTE";

    const payload = {
      user1_id: user1,
      user2_id: user2,
      album_id: albumId,
      match_type: "DOUBLE",
      figus_user1_gets: currentUserIsUser1 ? fair.currentUserGets : fair.otherUserGets,
      figus_user2_gets: currentUserIsUser1 ? fair.otherUserGets : fair.currentUserGets,
      city,
      neighborhood,
      match_score: score,
      distance_km: distanceKm,
      meeting_suggestion: suggestMeetingPlace(city, neighborhood),
      status: preservedStatus,
      is_active: true,
      // MUY IMPORTANTE: al recalcular NO borramos likes, descartes ni chats.
      // Antes el modo Tinder podía romperse porque refreshMyFiguMatches volvía
      // a poner liked/rejected en false y la cola quedaba inconsistente.
      liked_by_user1: Boolean(existingMatch?.liked_by_user1),
      liked_by_user2: Boolean(existingMatch?.liked_by_user2),
      mutual_interest: Boolean(existingMatch?.mutual_interest),
      rejected_by_user1: Boolean(existingMatch?.rejected_by_user1),
      rejected_by_user2: Boolean(existingMatch?.rejected_by_user2),
      hidden_by_user1: Boolean(existingMatch?.hidden_by_user1),
      hidden_by_user2: Boolean(existingMatch?.hidden_by_user2),
      trade_applied: Boolean(existingMatch?.trade_applied),
      user1_confirmed_trade: Boolean(existingMatch?.user1_confirmed_trade),
      user2_confirmed_trade: Boolean(existingMatch?.user2_confirmed_trade),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("figu_matches")
      .upsert(payload, { onConflict: "user1_id,user2_id,album_id" })
      .select("*")
      .single();

    if (error) {
      throw new Error(`No se pudo crear/actualizar el match real 1x1. Revisá/ejecutá supabase/FIX_MATCHES_REALES_V4.sql. Detalle: ${error.message}`);
    }

    if (data) created.push(data);
  }

  return created;
}


async function insertFiguSystemMessage(matchId: string, senderId: string, message: string) {
  const { error } = await supabase.from("figu_chat_messages").insert({ match_id: matchId, sender_id: senderId, message });
  if (error) throw new Error(error.message);
}

export async function proposeSimpleFiguExchange(firebaseUser: User, matchId: string) {
  const profile = await getOrCreateProfile(firebaseUser);
  await ensureDailyBenefits(profile);

  const { data: freshProfile } = await supabase.from("profiles").select("*").eq("id", profile.id).single();
  const effectiveProfile = freshProfile ?? profile;
  const limits = getPlanLimits(normalizeSubscription(effectiveProfile));
  const maxContacts = limits.manualContactsPerDay;
  const usedContacts = Number(effectiveProfile.free_profiles_viewed_today ?? 0);

  if (maxContacts !== "Ilimitado" && usedContacts >= maxContacts) {
    throw new Error(`Llegaste al límite de ${maxContacts} contactos diarios de tu plan.`);
  }

  const { data: match, error: matchError } = await supabase
    .from("figu_matches")
    .select("id,user1_id,user2_id,figus_user1_gets,figus_user2_gets,status,mutual_interest")
    .eq("id", matchId)
    .eq("is_active", true)
    .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`)
    .single();

  if (matchError || !match) throw new Error(matchError?.message ?? "No tenés acceso a este intercambio.");

  const proposalMatch = match as any;
  const amUser1 = proposalMatch.user1_id === profile.id;
  const iGet = amUser1 ? proposalMatch.figus_user1_gets : proposalMatch.figus_user2_gets;
  const otherGets = amUser1 ? proposalMatch.figus_user2_gets : proposalMatch.figus_user1_gets;

  const { error } = await supabase.from("figu_matches").update({ status: "HABLANDO", updated_at: new Date().toISOString() }).eq("id", matchId);
  if (error) throw new Error(error.message);

  await insertFiguSystemMessage(matchId, profile.id, `MODERADOR: ${effectiveProfile.display_name || effectiveProfile.email || "Un usuario"} quiere intercambiar con vos. Recibe ${formatStickerList(iGet, 20)} y entrega ${formatStickerList(otherGets, 20)}. Coordiná por este chat en un punto público y, cuando se concrete, presionen “Intercambio realizado, actualizar mi álbum”.`);

  if (maxContacts !== "Ilimitado") {
    await supabase.from("profiles").update({ free_profiles_viewed_today: usedContacts + 1, plan_updated_at: new Date().toISOString() }).eq("id", profile.id);
  }

  return { matchId };
}

export async function confirmFiguExchange(firebaseUser: User, matchId: string) {
  const profile = await getOrCreateProfile(firebaseUser);
  const { data: match, error: matchError } = await supabase
    .from("figu_matches")
    .select("id,album_id,user1_id,user2_id,user1_confirmed_trade,user2_confirmed_trade,trade_applied")
    .eq("id", matchId)
    .eq("is_active", true)
    .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`)
    .single();

  if (matchError || !match) throw new Error(matchError?.message ?? "No tenés acceso a este intercambio.");
  const tradeMatch = match as any;
  if (tradeMatch.trade_applied) return { completed: true };

  const amUser1 = tradeMatch.user1_id === profile.id;
  const otherConfirmed = amUser1 ? Boolean(tradeMatch.user2_confirmed_trade) : Boolean(tradeMatch.user1_confirmed_trade);
  const payload: Record<string, unknown> = { status: otherConfirmed ? "INTERCAMBIADO" : "ACORDADO", updated_at: new Date().toISOString() };
  if (amUser1) payload.user1_confirmed_trade = true;
  else payload.user2_confirmed_trade = true;

  const { error } = await supabase.from("figu_matches").update(payload).eq("id", matchId);
  if (error) throw new Error(error.message);

  if (otherConfirmed) {
    await applyCompletedFiguTrade(matchId);
    await insertFiguSystemMessage(matchId, profile.id, "MODERADOR: Ambos usuarios confirmaron el intercambio. Actualizamos automáticamente el álbum y las repetidas de los dos.");
    return { completed: true };
  }

  await insertFiguSystemMessage(matchId, profile.id, `MODERADOR: ${profile.display_name || profile.email || "Un usuario"} indicó que el intercambio fue correcto. Si también se concretó para vos, presioná “Intercambio realizado, actualizar mi álbum” para actualizar tu álbum.`);
  return { completed: false };
}

export async function updateFiguMatchStatus(firebaseUser: User, matchId: string, status: "PENDIENTE" | "HABLANDO" | "ACORDADO" | "INTERCAMBIADO" | "CANCELADO") {
  const profile = await getOrCreateProfile(firebaseUser);
  const { error } = await supabase
    .from("figu_matches")
    .update({ status, completed_at: status === "INTERCAMBIADO" ? new Date().toISOString() : null, updated_at: new Date().toISOString() })
    .eq("id", matchId)
    .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`);
  if (error) throw new Error(error.message);
}


function uniqueNumbers(values?: number[] | null) {
  return Array.from(new Set((values ?? []).map(Number).filter((n) => Number.isInteger(n) && n > 0))).sort((a, b) => a - b);
}

async function getAlbumProgress(userId: string, albumId: string) {
  const { data, error } = await supabase
    .from("user_album_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("album_id", albumId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

async function setAlbumOwnedFigus(userId: string, albumId: string, ownedFigus: number[]) {
  const { error } = await supabase.from("user_album_progress").upsert({
    user_id: userId,
    album_id: albumId,
    owned_figus: uniqueNumbers(ownedFigus),
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,album_id" });

  if (error) throw new Error(error.message);
}

async function decrementRepeated(userId: string, albumId: string, figuNumbers: number[]) {
  for (const figuNumber of uniqueNumbers(figuNumbers)) {
    const { data: current, error: currentError } = await supabase
      .from("user_repeated_figus")
      .select("id, quantity")
      .eq("user_id", userId)
      .eq("album_id", albumId)
      .eq("figu_number", figuNumber)
      .maybeSingle();

    if (currentError) throw new Error(currentError.message);
    if (!current) continue;

    const nextQuantity = Math.max(0, Number(current.quantity ?? 0) - 1);

    if (nextQuantity <= 0) {
      const { error } = await supabase.from("user_repeated_figus").delete().eq("id", current.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("user_repeated_figus").update({ quantity: nextQuantity }).eq("id", current.id);
      if (error) throw new Error(error.message);
    }
  }
}

async function applyCompletedFiguTrade(matchId: string) {
  const { data: match, error } = await supabase
    .from("figu_matches")
    .select("id, album_id, user1_id, user2_id, figus_user1_gets, figus_user2_gets, trade_applied,user1_confirmed_trade,user2_confirmed_trade")
    .eq("id", matchId)
    .single();

  if (error) throw new Error(error.message);
  const tradeMatch = match as any;
  if (!tradeMatch || tradeMatch.trade_applied) return;

  const user1Gets = uniqueNumbers(tradeMatch.figus_user1_gets);
  const user2Gets = uniqueNumbers(tradeMatch.figus_user2_gets);

  const [user1Progress, user2Progress] = await Promise.all([
    getAlbumProgress(tradeMatch.user1_id, tradeMatch.album_id),
    getAlbumProgress(tradeMatch.user2_id, tradeMatch.album_id),
  ]);

  const user1Owned = uniqueNumbers([...(user1Progress?.owned_figus ?? []), ...user1Gets]);
  const user2Owned = uniqueNumbers([...(user2Progress?.owned_figus ?? []), ...user2Gets]);

  await setAlbumOwnedFigus(tradeMatch.user1_id, tradeMatch.album_id, user1Owned);
  await setAlbumOwnedFigus(tradeMatch.user2_id, tradeMatch.album_id, user2Owned);

  // Lo que user1 recibe sale de las repetidas de user2. Lo que user2 recibe sale de las repetidas de user1.
  await decrementRepeated(tradeMatch.user2_id, tradeMatch.album_id, user1Gets);
  await decrementRepeated(tradeMatch.user1_id, tradeMatch.album_id, user2Gets);

  const { error: updateError } = await supabase
    .from("figu_matches")
    .update({
      trade_applied: true,
      trade_applied_at: new Date().toISOString(),
      status: "INTERCAMBIADO",
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", matchId);

  if (updateError) throw new Error(updateError.message);
}


export async function saveFiguReview(firebaseUser: User, matchId: string, input: { rating: number; fulfilled: boolean; noShow: boolean; goodCondition: boolean; comment: string }) {
  const profile = await getOrCreateProfile(firebaseUser);
  const { data: match, error: matchError } = await supabase.from("figu_matches").select("user1_id,user2_id").eq("id", matchId).or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`).single();
  if (matchError) throw new Error(matchError.message);
  const reviewMatch = match as any;
  const reviewedUserId = reviewMatch.user1_id === profile.id ? reviewMatch.user2_id : reviewMatch.user1_id;
  const { error } = await supabase.from("figu_exchange_reviews").upsert({ match_id: matchId, reviewer_id: profile.id, reviewed_user_id: reviewedUserId, rating: Math.max(1, Math.min(5, input.rating)), fulfilled: input.fulfilled, no_show: input.noShow, good_condition: input.goodCondition, comment: input.comment.trim() || null }, { onConflict: "match_id,reviewer_id" });
  if (error) throw new Error(error.message);

}


export async function reportFiguUser(firebaseUser: User, matchId: string, reason: string, details: string) {
  const profile = await getOrCreateProfile(firebaseUser);
  const { data: match, error: matchError } = await supabase
    .from("figu_matches")
    .select("user1_id,user2_id")
    .eq("id", matchId)
    .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`)
    .single();

  if (matchError) throw new Error(matchError.message);

  const reportMatch = match as any;
  const reportedUserId = reportMatch.user1_id === profile.id ? reportMatch.user2_id : reportMatch.user1_id;

  const { error } = await supabase.from("user_reports").insert({
    reporter_id: profile.id,
    reported_user_id: reportedUserId,
    reason,
    details: details.trim() || null,
    status: "PENDIENTE",
  });

  if (error) throw new Error(error.message);
}

export async function getFiguDashboard(firebaseUser: User) {
  const profile = await getOrCreateProfile(firebaseUser);
  const album = await getMundialAlbum();
  const [{ data: progress }, { data: requests }, { data: repeated }] = await Promise.all([
    supabase.from("user_album_progress").select("user_id, owned_figus, completion_percentage, profiles(display_name, email)").eq("album_id", album.id).order("completion_percentage", { ascending: false }).limit(10),
    supabase.from("figu_requests").select("needed_figus, city, neighborhood").eq("album_id", album.id).eq("is_active", true).limit(500),
    supabase.from("user_repeated_figus").select("figu_number, quantity").eq("album_id", album.id).limit(5000),
  ]);

  const wanted = new Map<number, number>();
  for (const row of (requests ?? []) as any[]) for (const n of (row.needed_figus ?? []) as number[]) wanted.set(Number(n), (wanted.get(Number(n)) ?? 0) + 1);
  const offered = new Map<number, number>();
  for (const row of (repeated ?? []) as any[]) offered.set(Number(row.figu_number), (offered.get(Number(row.figu_number)) ?? 0) + Number(row.quantity ?? 0));

  const topWanted = [...wanted.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([figu, count]) => ({ figu, count }));
  const topOffered = [...offered.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([figu, count]) => ({ figu, count }));
  return { profile, progress: progress ?? [], topWanted, topOffered };
}



export async function rejectFiguMatch(firebaseUser: User, matchId: string) {
  const profile = await getOrCreateProfile(firebaseUser);

  const { data: match, error: matchError } = await supabase
    .from("figu_matches")
    .select("id,user1_id,user2_id,rejected_by_user1,rejected_by_user2")
    .eq("id", matchId)
    .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`)
    .single();

  if (matchError) throw new Error(matchError.message);

  const amUser1 = match.user1_id === profile.id;

  if ((amUser1 && match.rejected_by_user1) || (!amUser1 && match.rejected_by_user2)) {
    throw new Error("Ya descartaste esta propuesta.");
  }

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (amUser1) updatePayload.rejected_by_user1 = true;
  else updatePayload.rejected_by_user2 = true;

  const { error } = await supabase
    .from("figu_matches")
    .update(updatePayload)
    .eq("id", matchId);

  if (error) throw new Error(error.message);
}

export async function expressFiguInterest(firebaseUser: User, matchId: string) {
  const profile = await getOrCreateProfile(firebaseUser);
  await ensureDailyBenefits(profile);

  const { data: freshProfile } = await supabase.from("profiles").select("*").eq("id", profile.id).single();
  const effectiveProfile = freshProfile ?? profile;
  const limits = getPlanLimits(normalizeSubscription(effectiveProfile));
  const maxLikes = limits.tinderLikesPerDay;
  const usedLikes = Number(effectiveProfile.free_swipes_used_today ?? 0);

  if (maxLikes !== "Ilimitado" && usedLikes >= maxLikes) {
    throw new Error(`Llegaste al límite de ${maxLikes} “me interesa” diarios de tu plan.`);
  }

  const { data: match, error: matchError } = await supabase
    .from("figu_matches")
    .select("id,user1_id,user2_id,liked_by_user1,liked_by_user2,rejected_by_user1,rejected_by_user2,status")
    .eq("id", matchId)
    .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`)
    .single();

  if (matchError) throw new Error(matchError.message);

  const amUser1 = match.user1_id === profile.id;

  if ((amUser1 && match.rejected_by_user1) || (!amUser1 && match.rejected_by_user2)) {
    throw new Error("Ya descartaste esta propuesta.");
  }

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (amUser1) updatePayload.liked_by_user1 = true;
  else updatePayload.liked_by_user2 = true;

  const likedByUser1 = amUser1 ? true : Boolean(match.liked_by_user1);
  const likedByUser2 = amUser1 ? Boolean(match.liked_by_user2) : true;
  const isMutual = likedByUser1 && likedByUser2;

  if (isMutual) {
    updatePayload.mutual_interest = true;
    updatePayload.status = "HABLANDO";
  } else if (!match.status || match.status === "PENDIENTE") {
    updatePayload.status = "PENDIENTE";
  }

  const { data, error } = await supabase
    .from("figu_matches")
    .update(updatePayload)
    .eq("id", matchId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  if (maxLikes !== "Ilimitado") {
    await supabase
      .from("profiles")
      .update({ free_swipes_used_today: usedLikes + 1, plan_updated_at: new Date().toISOString() })
      .eq("id", profile.id);
  }

  return { match: data, isMutual };
}



export async function getMyTinderData(firebaseUser: User) {
  const profile = await getOrCreateProfile(firebaseUser);
  const album = await getMundialAlbum();

  // Primero recalculamos, igual que el modo simple.
  // Si el modo simple tiene resultados, Tinder debe partir de la misma base.
  await refreshMyFiguMatches(firebaseUser);

  const { data: freshProfile } = await supabase.from("profiles").select("*").eq("id", profile.id).single();
  const effectiveProfile = freshProfile ?? profile;
  const limits = getPlanLimits(normalizeSubscription(effectiveProfile));
  const maxCards = limits.tinderCardsPerDay === "Ilimitado" ? Number.POSITIVE_INFINITY : Number(limits.tinderCardsPerDay ?? 0);
  const maxRadius = limits.radiusKm === "Ilimitado" ? Number.POSITIVE_INFINITY : Number(limits.radiusKm ?? 0);

  const { data, error } = await supabase
    .from("figu_matches")
    .select(`*, user1:profiles!figu_matches_user1_id_fkey(display_name, avatar_url, email), user2:profiles!figu_matches_user2_id_fkey(display_name, avatar_url, email)`)
    .eq("album_id", album.id)
    .eq("is_active", true)
    .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`)
    .order("match_score", { ascending: false })
    .order("distance_km", { ascending: true, nullsFirst: false })
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);

  const enriched = await enrichMatchesWithReputation(data ?? [], profile.id, album.id);

  const isUser1 = (m: any) => m.user1_id === profile.id;
  const likedByMe = (m: any) => isUser1(m) ? Boolean(m.liked_by_user1) : Boolean(m.liked_by_user2);
  const likedByOther = (m: any) => isUser1(m) ? Boolean(m.liked_by_user2) : Boolean(m.liked_by_user1);
  const rejectedByMe = (m: any) => isUser1(m) ? Boolean(m.rejected_by_user1) : Boolean(m.rejected_by_user2);

  const hasRealExchange = (m: any) => {
    const iGet = isUser1(m) ? m.figus_user1_gets : m.figus_user2_gets;
    const iGive = isUser1(m) ? m.figus_user2_gets : m.figus_user1_gets;
    return Array.isArray(iGet) && Array.isArray(iGive) && iGet.length > 0 && iGet.length === iGive.length;
  };

  const passesRadius = (m: any) => {
    // Si no hay distancia válida, no se elimina la propuesta.
    if (typeof m.distance_km !== "number") return true;
    return m.distance_km <= maxRadius;
  };

  const isFinalOrChat = (m: any) => {
    const status = String(m.status || "PENDIENTE").toUpperCase();
    return ["HABLANDO", "ACORDADO", "INTERCAMBIADO", "CANCELADO"].includes(status) || Boolean(m.mutual_interest);
  };

  const base = (enriched as any[]).filter((m) => hasRealExchange(m) && passesRadius(m));
  const tinderCandidates = base.filter((m) => !isFinalOrChat(m));

  const sortTinderCards = (items: any[]) => [...items].sort((a, b) => {
    const likeDiff = Number(likedByOther(b)) - Number(likedByOther(a));
    if (likeDiff !== 0) return likeDiff;
    const scoreDiff = (b.match_score ?? 0) - (a.match_score ?? 0);
    if (scoreDiff !== 0) return scoreDiff;
    return (a.distance_km ?? 9999) - (b.distance_km ?? 9999);
  });

  const incomingLikes = sortTinderCards(
    tinderCandidates.filter((m) => likedByOther(m) && !likedByMe(m) && !rejectedByMe(m))
  );

  // Cola normal: tarjetas frescas reales 1x1.
  const strictQueue = sortTinderCards(
    tinderCandidates.filter((m) => !likedByMe(m) && !rejectedByMe(m))
  );

  // Fallback 1: si en pruebas se descartaron todas, las reofrecemos.
  const withRejectedAgain = sortTinderCards(
    tinderCandidates.filter((m) => !likedByMe(m))
  );

  // Fallback 2: si por estados heredados quedó todo fuera, usamos la misma base del modo simple,
  // pero seguimos excluyendo matches mutuos/finalizados. Esto evita que Tinder quede vacío
  // mientras “Buscar intercambio” sí muestra resultados.
  const compatibleNonFinal = sortTinderCards(
    base.filter((m) => {
      const status = String(m.status || "PENDIENTE").toUpperCase();
      return !["INTERCAMBIADO", "CANCELADO"].includes(status) && !Boolean(m.mutual_interest) && !likedByMe(m);
    })
  );

  const rawQueue = strictQueue.length > 0 ? strictQueue : (withRejectedAgain.length > 0 ? withRejectedAgain : compatibleNonFinal);
  const queue = rawQueue.slice(0, Number.isFinite(maxCards) ? maxCards : undefined);

  const waitingForOther = base.filter((m) => likedByMe(m) && !likedByOther(m) && !m.mutual_interest).length;
  const mutual = base.filter((m) => Boolean(m.mutual_interest) || ["HABLANDO", "ACORDADO"].includes(String(m.status || "").toUpperCase())).length;

  return {
    profile,
    subscription: effectiveProfile,
    limits,
    queue,
    incomingLikes,
    stats: {
      incomingLikesCount: incomingLikes.length,
      waitingForOther,
      mutual,
      cardsLimit: limits.tinderCardsPerDay,
      likesLimit: limits.tinderLikesPerDay,
      undoLimit: limits.undoPerDay,
      seeLikes: limits.seeLikes,
      debug: {
        activeMatches: (enriched as any[]).length,
        realExchangeMatches: base.length,
        tinderCandidates: tinderCandidates.length,
        strictQueue: strictQueue.length,
        fallbackQueue: rawQueue.length,
      },
    },
  };
}

export async function undoLastTinderAction(firebaseUser: User) {
  const profile = await getOrCreateProfile(firebaseUser);
  await ensureDailyBenefits(profile);

  const { data: freshProfile } = await supabase.from("profiles").select("*").eq("id", profile.id).single();
  const effectiveProfile = freshProfile ?? profile;
  const limits = getPlanLimits(normalizeSubscription(effectiveProfile));

  if (limits.undoPerDay === 0) {
    throw new Error("Deshacer está disponible desde el Plan Básico.");
  }

  const album = await getMundialAlbum();
  const { data: matches, error } = await supabase
    .from("figu_matches")
    .select("id,user1_id,user2_id,liked_by_user1,liked_by_user2,rejected_by_user1,rejected_by_user2,mutual_interest,status,updated_at")
    .eq("album_id", album.id)
    .eq("is_active", true)
    .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`)
    .order("updated_at", { ascending: false })
    .limit(30);

  if (error) throw new Error(error.message);

  const target = (matches ?? []).find((m: any) => {
    const amUser1 = m.user1_id === profile.id;
    const rejected = amUser1 ? m.rejected_by_user1 : m.rejected_by_user2;
    const liked = amUser1 ? m.liked_by_user1 : m.liked_by_user2;
    return !m.mutual_interest && !["HABLANDO", "ACORDADO", "INTERCAMBIADO"].includes(String(m.status || "")) && (rejected || liked);
  }) as any;

  if (!target) throw new Error("No encontré una acción reciente para deshacer.");

  const amUser1 = target.user1_id === profile.id;
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString(), status: "PENDIENTE" };
  if (amUser1) {
    payload.rejected_by_user1 = false;
    payload.liked_by_user1 = false;
  } else {
    payload.rejected_by_user2 = false;
    payload.liked_by_user2 = false;
  }

  const { error: updateError } = await supabase.from("figu_matches").update(payload).eq("id", target.id);
  if (updateError) throw new Error(updateError.message);

  return { restoredMatchId: target.id };
}


export async function getMyFiguChats(firebaseUser: User) {
  const profile = await getOrCreateProfile(firebaseUser);
  const album = await getMundialAlbum();

  const { data: matches, error } = await supabase
    .from("figu_matches")
    .select(`*, user1:profiles!figu_matches_user1_id_fkey(display_name, avatar_url, email), user2:profiles!figu_matches_user2_id_fkey(display_name, avatar_url, email)`)
    .eq("album_id", album.id)
    .eq("is_active", true)
    .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`)
    .or(`status.eq.HABLANDO,status.eq.ACORDADO,status.eq.INTERCAMBIADO,mutual_interest.eq.true`)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);

  const matchIds = (matches ?? []).map((m: any) => m.id);
  let lastMessages: any[] = [];

  if (matchIds.length) {
    const { data: messages, error: messagesError } = await supabase
      .from("figu_chat_messages")
      .select("id, match_id, sender_id, message, created_at")
      .in("match_id", matchIds)
      .order("created_at", { ascending: false });

    if (messagesError) throw new Error(messagesError.message);

    const seen = new Set<string>();
    lastMessages = (messages ?? []).filter((message: any) => {
      if (seen.has(message.match_id)) return false;
      seen.add(message.match_id);
      return true;
    });
  }

  const lastByMatch = new Map<string, any>(lastMessages.map((message: any) => [message.match_id, message]));

  const visibleMatches = (matches ?? []).filter((match: any) => {
    const amUser1 = match.user1_id === profile.id;
    if (amUser1 && match.hidden_by_user1) return false;
    if (!amUser1 && match.hidden_by_user2) return false;
    return true;
  });

  return {
    profile,
    chats: visibleMatches.map((match: any) => ({
      ...match,
      last_message: lastByMatch.get(match.id) ?? null,
    })),
  };
}



export async function hideFiguChat(firebaseUser: User, matchId: string) {
  const profile = await getOrCreateProfile(firebaseUser);

  const { data: match, error: matchError } = await supabase
    .from("figu_matches")
    .select("id,user1_id,user2_id")
    .eq("id", matchId)
    .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`)
    .single();

  if (matchError) throw new Error(matchError.message);

  const hideMatch = match as any;
  const amUser1 = hideMatch.user1_id === profile.id;
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (amUser1) payload.hidden_by_user1 = true;
  else payload.hidden_by_user2 = true;

  const { error } = await supabase.from("figu_matches").update(payload).eq("id", matchId);
  if (error) throw new Error(error.message);
}

export async function getFiguNotificationSummary(firebaseUser: User) {
  const profile = await getOrCreateProfile(firebaseUser);
  const album = await getMundialAlbum();

  const { data: matches, error } = await supabase
    .from("figu_matches")
    .select("id,user1_id,user2_id,mutual_interest,status,updated_at,hidden_by_user1,hidden_by_user2")
    .eq("album_id", album.id)
    .eq("is_active", true)
    .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`)
    .or(`status.eq.HABLANDO,status.eq.ACORDADO,mutual_interest.eq.true`);

  if (error) throw new Error(error.message);

  const visible = (matches ?? []).filter((m: any) => {
    const amUser1 = m.user1_id === profile.id;
    if (amUser1 && m.hidden_by_user1) return false;
    if (!amUser1 && m.hidden_by_user2) return false;
    return true;
  });

  const ids = visible.map((m: any) => m.id);
  let latestMessages: any[] = [];

  if (ids.length) {
    const { data: messages, error: messageError } = await supabase
      .from("figu_chat_messages")
      .select("id, match_id, sender_id, message, created_at")
      .in("match_id", ids)
      .order("created_at", { ascending: false })
      .limit(30);

    if (messageError) throw new Error(messageError.message);
    latestMessages = messages ?? [];
  }

  const incoming = latestMessages.filter((m: any) => m.sender_id !== profile.id);

  return {
    profile,
    chats_count: visible.length,
    incoming_count: incoming.length,
    latest_incoming: incoming[0] ?? null,
    incoming_messages: incoming,
    incoming_message_ids: incoming.map((message: any) => message.id),
  };
}


export async function getMatchWithMessages(firebaseUser: User, matchId: string) {
  const profile = await getOrCreateProfile(firebaseUser);
  const { data: match, error: matchError } = await supabase
    .from("figu_matches")
    .select(`*, user1:profiles!figu_matches_user1_id_fkey(display_name, avatar_url, email), user2:profiles!figu_matches_user2_id_fkey(display_name, avatar_url, email)`)
    .eq("id", matchId)
    .eq("is_active", true)
    .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`)
    .single();
  if (matchError) throw new Error(matchError.message);

  const chatEnabled = Boolean((match as any).mutual_interest) || ["HABLANDO", "ACORDADO", "INTERCAMBIADO"].includes(String((match as any).status || ""));
  if (!chatEnabled) throw new Error("El chat se habilita recién cuando ambos marcan interés.");

  const { data: messages, error: messagesError } = await supabase.from("figu_chat_messages").select("*, profiles(display_name, avatar_url)").eq("match_id", matchId).order("created_at", { ascending: true });
  if (messagesError) throw new Error(messagesError.message);
  return { profile, match, messages: messages ?? [] };
}

export async function sendFiguMessage(firebaseUser: User, matchId: string, message: string) {
  const profile = await getOrCreateProfile(firebaseUser);
  const text = message.trim();
  if (!text) return null;

  const { data: match, error: matchError } = await supabase.from("figu_matches").select("id, user1_id, user2_id, is_active").eq("id", matchId).eq("is_active", true).or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`).single();
  if (matchError || !match) throw new Error(matchError?.message ?? "No tenés acceso a este chat.");

  await updateFiguMatchStatus(firebaseUser, matchId, "HABLANDO");
  const { data, error } = await supabase.from("figu_chat_messages").insert({ match_id: matchId, sender_id: profile.id, message: text }).select("*").single();
  if (error) throw new Error(error.message);
  return data;
}
