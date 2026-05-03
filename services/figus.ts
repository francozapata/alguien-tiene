import { User } from "firebase/auth";
import { supabase } from "@/lib/supabase";
import { getOrCreateProfile } from "@/services/profiles";
import { MUNDIAL_2026_ALBUM_NAME, TOTAL_FIGUS_MUNDIAL } from "@/types/figus";
import { parseStickerCounts, parseStickerInput, STICKER_CATALOG } from "@/lib/figus/catalog";

export function serializeFigus(figus: number[]) {
  return Array.from(new Set(figus))
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= TOTAL_FIGUS_MUNDIAL)
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
  iGet: number[];
  otherGets: number[];
  isDouble: boolean;
  sameNeighborhood: boolean;
  sameCity: boolean;
  distanceKm?: number | null;
  otherUrgent?: boolean;
}) {
  let score = 0;
  score += Math.min(input.iGet.length * 8, 50);
  score += Math.min(input.otherGets.length * 5, 22);
  if (input.isDouble) score += 18;
  score += distanceScore(input.distanceKm);
  if (input.sameNeighborhood) score += 8;
  else if (input.sameCity) score += 4;
  if (input.otherUrgent) score += 3;
  return Math.max(1, Math.min(100, score));
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
}

export async function saveRepeatedFigus(firebaseUser: User, repeated: Record<number, number>) {
  const profile = await getOrCreateProfile(firebaseUser);
  const album = await getMundialAlbum();

  const { error: deleteError } = await supabase.from("user_repeated_figus").delete().eq("user_id", profile.id).eq("album_id", album.id);
  if (deleteError) throw new Error(deleteError.message);

  const rows = Object.entries(repeated)
    .map(([figu, quantity]) => ({ user_id: profile.id, album_id: album.id, figu_number: Number(figu), quantity: Math.max(1, Number(quantity)), updated_at: new Date().toISOString() }))
    .filter((row) => row.figu_number >= 1 && row.figu_number <= TOTAL_FIGUS_MUNDIAL && row.quantity > 0);

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
  const max = Math.min(currentUserGets.length, otherUserGets.length);
  return {
    currentUserGets: serializeFigus(currentUserGets).slice(0, max),
    otherUserGets: serializeFigus(otherUserGets).slice(0, max),
    count: max,
  };
}

export async function generateMatchesForUser(userId: string, albumId: string) {
  const { data: myRequest, error: requestError } = await supabase.from("figu_requests").select("*").eq("user_id", userId).eq("album_id", albumId).eq("is_active", true).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (requestError) throw new Error(requestError.message);
  if (!myRequest) return [];

  await supabase.from("figu_matches").update({ is_active: false, updated_at: new Date().toISOString() }).eq("album_id", albumId).or(`user1_id.eq.${userId},user2_id.eq.${userId}`).not("status", "in", "(INTERCAMBIADO,CANCELADO)");

  const { data: myRepeatedRows, error: myRepeatedError } = await supabase.from("user_repeated_figus").select("figu_number, quantity").eq("user_id", userId).eq("album_id", albumId);
  if (myRepeatedError) throw new Error(myRepeatedError.message);

  let query = supabase.from("figu_requests").select("*").eq("album_id", albumId).eq("is_active", true).neq("user_id", userId);
  if (myRequest.city?.trim()) query = query.ilike("city", myRequest.city.trim());
  if (myRequest.neighborhood?.trim()) query = query.ilike("neighborhood", myRequest.neighborhood.trim());

  const { data: otherRequests, error: otherError } = await query.limit(500);
  if (otherError) throw new Error(otherError.message);
  const otherUserIds = (otherRequests ?? []).map((request) => request.user_id);
  if (otherUserIds.length === 0) return [];

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, lat, lng, city, neighborhood")
    .in("id", [...otherUserIds, userId]);

  if (profilesError) throw new Error(profilesError.message);

  const profileById = new Map((profiles ?? []).map((p: any) => [p.id, p]));
  const myProfile = profileById.get(userId) ?? null;

  const { data: allRepeated, error: repeatedError } = await supabase.from("user_repeated_figus").select("user_id, figu_number, quantity").eq("album_id", albumId).in("user_id", [...otherUserIds, userId]);
  if (repeatedError) throw new Error(repeatedError.message);

  const myRepeated = new Set((myRepeatedRows ?? []).filter((row) => row.quantity > 0).map((row) => row.figu_number));
  const myNeeded = new Set(myRequest.needed_figus ?? []);
  const created = [];

  for (const otherRequest of otherRequests ?? []) {
    const otherRepeated = (allRepeated ?? []).filter((row) => row.user_id === otherRequest.user_id && row.quantity > 0).map((row) => row.figu_number);
    const otherRepeatedSet = new Set(otherRepeated);

    const rawCurrentUserGets = [...myNeeded].filter((figu) => otherRepeatedSet.has(figu));
    const rawOtherUserGets = (otherRequest.needed_figus ?? []).filter((figu: number) => myRepeated.has(figu));

    if (rawCurrentUserGets.length === 0 && rawOtherUserGets.length === 0) continue;

    const hasBothSides = rawCurrentUserGets.length > 0 && rawOtherUserGets.length > 0;
    let sortedCurrentUserGets = serializeFigus(rawCurrentUserGets);
    let sortedOtherUserGets = serializeFigus(rawOtherUserGets);
    let matchType = "SIMPLE";

    // Regla central: un INTERCAMBIO siempre debe ser justo, misma cantidad para ambos.
    // Si una persona puede dar 4 y la otra 2, se propone un intercambio 2x2.
    if (hasBothSides) {
      const fair = selectFairExchange(sortedCurrentUserGets, sortedOtherUserGets);
      sortedCurrentUserGets = fair.currentUserGets;
      sortedOtherUserGets = fair.otherUserGets;
      matchType = fair.count > 0 ? "DOUBLE" : "SIMPLE";
    }

    // Ayuda simple: existe compatibilidad de un solo lado. No se fuerza paridad.
    if (matchType === "SIMPLE") {
      if (sortedCurrentUserGets.length === 0 && sortedOtherUserGets.length > 0) {
        // A la otra persona le servís vos, pero a vos no te da nada. Igual puede aparecer como ayuda simple.
        sortedOtherUserGets = serializeFigus(sortedOtherUserGets);
      } else {
        sortedCurrentUserGets = serializeFigus(sortedCurrentUserGets);
        sortedOtherUserGets = [];
      }
    }

    if (sortedCurrentUserGets.length === 0 && sortedOtherUserGets.length === 0) continue;

    const user1 = userId < otherRequest.user_id ? userId : otherRequest.user_id;
    const user2 = userId < otherRequest.user_id ? otherRequest.user_id : userId;
    const currentUserIsUser1 = user1 === userId;
    const otherProfile = profileById.get(otherRequest.user_id) ?? null;
    const distanceKm = calculateDistanceKm(myProfile, otherProfile);
    const sameNeighborhood = Boolean(myRequest.neighborhood && otherRequest.neighborhood && myRequest.neighborhood.toLowerCase() === otherRequest.neighborhood.toLowerCase());
    const sameCity = Boolean(myRequest.city && otherRequest.city && myRequest.city.toLowerCase() === otherRequest.city.toLowerCase());
    const score = calculateScore({ iGet: sortedCurrentUserGets, otherGets: sortedOtherUserGets, isDouble: matchType === "DOUBLE", sameNeighborhood, sameCity, distanceKm, otherUrgent: otherRequest.is_urgent });
    const city = myRequest.city ?? otherRequest.city ?? null;
    const neighborhood = myRequest.neighborhood ?? otherRequest.neighborhood ?? null;

    const payload = {
      user1_id: user1,
      user2_id: user2,
      album_id: albumId,
      match_type: matchType,
      figus_user1_gets: currentUserIsUser1 ? sortedCurrentUserGets : sortedOtherUserGets,
      figus_user2_gets: currentUserIsUser1 ? sortedOtherUserGets : sortedCurrentUserGets,
      city,
      neighborhood,
      match_score: score,
      distance_km: distanceKm,
      meeting_suggestion: suggestMeetingPlace(city, neighborhood),
      status: "PENDIENTE",
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from("figu_matches").upsert(payload, { onConflict: "user1_id,user2_id,album_id" }).select("*").single();
    if (!error && data) created.push(data);
  }
  return created;
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
    .select("id, album_id, user1_id, user2_id, figus_user1_gets, figus_user2_gets, trade_applied")
    .eq("id", matchId)
    .single();

  if (error) throw new Error(error.message);
  if (!match || match.trade_applied) return;

  const user1Gets = uniqueNumbers(match.figus_user1_gets);
  const user2Gets = uniqueNumbers(match.figus_user2_gets);

  const [user1Progress, user2Progress] = await Promise.all([
    getAlbumProgress(match.user1_id, match.album_id),
    getAlbumProgress(match.user2_id, match.album_id),
  ]);

  const user1Owned = uniqueNumbers([...(user1Progress?.owned_figus ?? []), ...user1Gets]);
  const user2Owned = uniqueNumbers([...(user2Progress?.owned_figus ?? []), ...user2Gets]);

  await setAlbumOwnedFigus(match.user1_id, match.album_id, user1Owned);
  await setAlbumOwnedFigus(match.user2_id, match.album_id, user2Owned);

  // Lo que user1 recibe sale de las repetidas de user2. Lo que user2 recibe sale de las repetidas de user1.
  await decrementRepeated(match.user2_id, match.album_id, user1Gets);
  await decrementRepeated(match.user1_id, match.album_id, user2Gets);

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
  const reviewedUserId = match.user1_id === profile.id ? match.user2_id : match.user1_id;
  const { error } = await supabase.from("figu_exchange_reviews").upsert({ match_id: matchId, reviewer_id: profile.id, reviewed_user_id: reviewedUserId, rating: Math.max(1, Math.min(5, input.rating)), fulfilled: input.fulfilled, no_show: input.noShow, good_condition: input.goodCondition, comment: input.comment.trim() || null }, { onConflict: "match_id,reviewer_id" });
  if (error) throw new Error(error.message);

  if (input.fulfilled) {
    await applyCompletedFiguTrade(matchId);
  }
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

  const reportedUserId = match.user1_id === profile.id ? match.user2_id : match.user1_id;

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
  for (const row of requests ?? []) for (const n of row.needed_figus ?? []) wanted.set(n, (wanted.get(n) ?? 0) + 1);
  const offered = new Map<number, number>();
  for (const row of repeated ?? []) offered.set(row.figu_number, (offered.get(row.figu_number) ?? 0) + row.quantity);

  const topWanted = [...wanted.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([figu, count]) => ({ figu, count }));
  const topOffered = [...offered.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([figu, count]) => ({ figu, count }));
  return { profile, progress: progress ?? [], topWanted, topOffered };
}



export async function rejectFiguMatch(firebaseUser: User, matchId: string) {
  const profile = await getOrCreateProfile(firebaseUser);

  const { data: match, error: matchError } = await supabase
    .from("figu_matches")
    .select("id,user1_id,user2_id")
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

  return { match: data, isMutual };
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

  const lastByMatch = new Map(lastMessages.map((message: any) => [message.match_id, message]));

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

  const amUser1 = match.user1_id === profile.id;
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
