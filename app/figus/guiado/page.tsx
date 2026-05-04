"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { FiguShell } from "@/components/figus/FiguShell";
import PermissionsPanel from "@/components/figus/PermissionsPanel";
import RequiredLocationGate from "@/components/figus/RequiredLocationGate";
import { refreshSmartLocation, syncStoredLocation } from "@/utils/location";
import { getMyMatches, proposeSimpleFiguExchange, refreshMyFiguMatches } from "@/services/figus";
import { FiguMatch } from "@/types/figus";
import { formatStickerList } from "@/lib/figus/catalog";
import { getMySubscription, getPlanLimits } from "@/services/subscriptions";

type SortMode = "DISTANCIA" | "INTERCAMBIOS";

function distanceValue(match: FiguMatch) {
  return typeof match.distance_km === "number" ? match.distance_km : 999999;
}

function exchangeCount(match: FiguMatch, profileId: string) {
  const amUser1 = match.user1_id === profileId;
  const iGet = amUser1 ? match.figus_user1_gets : match.figus_user2_gets;
  const otherGets = amUser1 ? match.figus_user2_gets : match.figus_user1_gets;
  return Math.min(iGet?.length ?? 0, otherGets?.length ?? 0);
}

function albumPercent(user: any) {
  const value = Number(user?.album_percent ?? user?.progress_percent ?? user?.album_completion ?? 0);
  if (!Number.isFinite(value)) return null;
  return value;
}

function distanceLabel(distance?: number | null) {
  if (distance === null || distance === undefined) return "Ubicación por confirmar";
  if (distance < 1) return `A ${Math.round(distance * 1000)} m`;
  return `A ${distance} km`;
}

function distanceHint(distance?: number | null) {
  if (distance === null || distance === undefined) return "sin distancia";
  if (distance <= 3) return "muy cerca";
  if (distance <= 10) return "cerca";
  if (distance <= 20) return "distancia media";
  return "lejos";
}

export default function CaminoGuiadoUsuariosPage() {
  const { user, loading } = useAuth();
  const [profileId, setProfileId] = useState("");
  const [matches, setMatches] = useState<FiguMatch[]>([]);
  const [radiusKm, setRadiusKm] = useState(3);
  const [maxRadiusKm, setMaxRadiusKm] = useState(3);
  const [maxResults, setMaxResults] = useState<number | "Ilimitado">(3);
  const [sortMode, setSortMode] = useState<SortMode>("DISTANCIA");
  const [status, setStatus] = useState("Buscando usuarios cercanos...");
  const [refreshing, setRefreshing] = useState(false);
  const [contactingId, setContactingId] = useState<string | null>(null);

  async function load() {
    if (!user) return;
    try {
      await refreshMyFiguMatches(user);
      const [data, subscriptionData] = await Promise.all([getMyMatches(user), getMySubscription(user)]);
      const limits = getPlanLimits(subscriptionData.subscription);
      const allowedRadius = limits.radiusKm === "Ilimitado" ? 50 : limits.radiusKm;
      const allowedResults = limits.manualProfilesPerSearch;
      setMaxRadiusKm(allowedRadius);
      setMaxResults(allowedResults);
      const effectiveRadius = Math.min(radiusKm, allowedRadius);
      if (radiusKm > allowedRadius) setRadiusKm(allowedRadius);
      setProfileId(data.profile.id);
      const filteredMatches = (data.matches as FiguMatch[]).filter((m) => {
        if (["HABLANDO", "ACORDADO", "INTERCAMBIADO", "CANCELADO"].includes(m.status)) return false;
        const amUser1 = m.user1_id === data.profile.id;
        if (amUser1 && m.rejected_by_user1) return false;
        if (!amUser1 && m.rejected_by_user2) return false;
        // Si no hay distancia todavía, igual mostramos el match real.
        // El radio solo filtra cuando hay distance_km numérica.
        if (typeof m.distance_km !== "number") return true;
        return m.distance_km <= effectiveRadius;
      });
      const limitedMatches = allowedResults === "Ilimitado" ? filteredMatches : filteredMatches.slice(0, allowedResults);
      setMatches(limitedMatches);
      setStatus(limitedMatches.length ? "Modo simple: combinaciones reales 1x1 cargadas." : "No hay combinaciones reales 1x1 por ahora. Revisá que vos y otros usuarios tengan álbum y repetidas cargadas.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "No se pudo cargar.");
    }
  }

  useEffect(() => {
    async function start() {
      if (user) {
        await syncStoredLocation(user);
        await refreshSmartLocation(user, { force: true });
        await syncStoredLocation(user);
      }
      await load();
    }
    start();
  }, [user, radiusKm]);

  async function refresh() {
    if (!user) return;
    setRefreshing(true);
    setStatus("Actualizando ubicación y recalculando...");
    try {
      await syncStoredLocation(user);
      await refreshSmartLocation(user, { force: true });
      await syncStoredLocation(user);
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  async function contact(matchId: string) {
    if (!user) return;
    setContactingId(matchId);
    setStatus("Abriendo chat y enviando propuesta automática...");
    try {
      await proposeSimpleFiguExchange(user, matchId);
      window.location.href = `/figus/chat/${matchId}`;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "No se pudo contactar.");
    } finally {
      setContactingId(null);
    }
  }

  const sorted = useMemo(() => {
    const copy = [...matches];
    copy.sort((a, b) => {
      if (sortMode === "DISTANCIA") {
        const d = distanceValue(a) - distanceValue(b);
        if (d !== 0) return d;
        return exchangeCount(b, profileId) - exchangeCount(a, profileId);
      }

      const e = exchangeCount(b, profileId) - exchangeCount(a, profileId);
      if (e !== 0) return e;
      return distanceValue(a) - distanceValue(b);
    });
    return copy;
  }, [matches, profileId, sortMode]);

  if (loading) return <FiguShell><div className="rounded-[2rem] bg-white p-8">Cargando...</div></FiguShell>;
  if (!user) return <FiguShell><div className="rounded-[2rem] bg-white p-8 text-center"><h2 className="text-2xl font-black">Iniciá sesión</h2><p className="mt-2 text-slate-600">Necesitás entrar para ver usuarios cercanos.</p></div></FiguShell>;

  return (
    <FiguShell>
      <RequiredLocationGate>
        <PermissionsPanel />

        <div className="mb-5 flex items-center justify-between">
          <Link href="/figus" className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm ring-1 ring-slate-200">← Home Figus</Link>
          <Link href="/figus" className="rounded-2xl bg-[#0D1B2A] px-5 py-3 text-sm font-black text-white shadow-sm">Home Figus →</Link>
        </div>

        <section className="rounded-[2.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-[#2563EB]">Buscar intercambios</p>
              <h1 className="mt-1 text-4xl font-black text-[#0D1B2A]">Intercambios posibles</h1>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
                Muestra directamente personas con intercambio real. Siempre es mano a mano: recibís y entregás la misma cantidad de figuritas.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSortMode("DISTANCIA")}
                className={`rounded-2xl px-4 py-3 text-sm font-black ${sortMode === "DISTANCIA" ? "bg-[#22C55E] text-white" : "bg-slate-100 text-slate-700"}`}
              >
                📍 Cercanía
              </button>
              <button
                onClick={() => setSortMode("INTERCAMBIOS")}
                className={`rounded-2xl px-4 py-3 text-sm font-black ${sortMode === "INTERCAMBIOS" ? "bg-[#22C55E] text-white" : "bg-slate-100 text-slate-700"}`}
              >
                🔁 Más intercambio
              </button>
              <select value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value))} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">
                <option value={1}>1 km</option>
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
                <option value={20}>20 km</option>
                <option value={50}>50 km</option>
              </select>
              <button onClick={refresh} disabled={refreshing} className="rounded-2xl bg-[#0D1B2A] px-4 py-3 text-sm font-black text-white disabled:opacity-60">
                {refreshing ? "Actualizando..." : "Actualizar"}
              </button>
            </div>
          </div>

          {sorted.length === 0 ? (
            <div className="mt-6 rounded-[2rem] border border-dashed border-slate-300 p-10 text-center">
              <p className="text-lg font-black text-[#0D1B2A]">No hay matches reales por ahora.</p>
              <p className="mt-2 text-sm font-semibold text-slate-500">{status}</p>
              <p className="mx-auto mt-2 max-w-xl text-xs font-bold leading-5 text-slate-400">
                El modo simple ya no muestra “usuarios cercanos” sin intercambio. Solo aparecen personas con intercambio mutuo mano a mano.
              </p>
              <Link href="/figus/mi-album" className="mt-5 inline-flex rounded-2xl bg-[#22C55E] px-5 py-3 text-sm font-black text-white">Ajustar mi álbum</Link>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {sorted.map((match) => {
                const amUser1 = match.user1_id === profileId;
                const other = amUser1 ? match.user2 : match.user1;
                const iGet = amUser1 ? match.figus_user1_gets : match.figus_user2_gets;
                const otherGets = amUser1 ? match.figus_user2_gets : match.figus_user1_gets;
                const exchange = exchangeCount(match, profileId);
                const percent = albumPercent(other);
                const location = [match.city, match.neighborhood].filter(Boolean).join(" · ");

                return (
                  <article key={match.id} className="rounded-[2rem] bg-emerald-50 p-5 ring-1 ring-emerald-200">
                    <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-[#22C55E] px-3 py-1 text-xs font-black text-white">
                            {match.match_type === "DOUBLE" ? `Intercambio ${iGet?.length ?? 0}x${otherGets?.length ?? 0}` : "Ayuda simple"}
                          </span>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#0D1B2A] ring-1 ring-slate-200">
                            📍 {distanceLabel(match.distance_km)} · {distanceHint(match.distance_km)}
                          </span>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#0D1B2A] ring-1 ring-slate-200">
                            🔁 {exchange} intercambio{exchange === 1 ? "" : "s"} posible{exchange === 1 ? "" : "s"}
                          </span>
                        </div>

                        <h2 className="mt-3 text-2xl font-black text-[#0D1B2A]">{other?.display_name || other?.email || "Usuario"}</h2>
                        {location ? <p className="mt-1 text-sm font-bold text-slate-500">📍 {location}</p> : null}

                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                          <div className="rounded-3xl bg-white p-4">
                            <p className="text-2xl font-black text-[#16A34A]">{iGet?.length ?? 0}</p>
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">vos recibís</p>
                            <p className="mt-2 text-sm font-bold text-slate-700">{formatStickerList(iGet, 8)}</p>
                          </div>
                          <div className="rounded-3xl bg-white p-4">
                            <p className="text-2xl font-black text-[#2563EB]">{otherGets?.length ?? 0}</p>
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">vos entregás</p>
                            <p className="mt-2 text-sm font-bold text-slate-700">{formatStickerList(otherGets, 8)}</p>
                          </div>
                          <div className="rounded-3xl bg-white p-4">
                            <p className="text-2xl font-black text-[#0D1B2A]">{percent === null ? "—" : `${percent}%`}</p>
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">álbum completo</p>
                            <p className="mt-2 text-sm font-bold text-slate-500">⭐ {other?.avg_rating ? `${other.avg_rating}/5` : "Sin reputación"} · {other?.successful_exchanges ?? 0} cumplidos</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <button onClick={() => contact(match.id)} disabled={contactingId === match.id} className="rounded-2xl bg-[#0D1B2A] px-5 py-3 text-center text-sm font-black text-white disabled:opacity-60">
                          {contactingId === match.id ? "Abriendo..." : "Proponer intercambio"}
                        </button>
                        <Link href="/figus/descubrir" className="rounded-2xl bg-white px-5 py-3 text-center text-sm font-black text-[#0D1B2A] ring-1 ring-slate-200">
                          Ver modo rápido
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <p className="mt-4 text-sm font-semibold text-slate-500">{status}</p>
        </section>
      </RequiredLocationGate>
    </FiguShell>
  );
}
