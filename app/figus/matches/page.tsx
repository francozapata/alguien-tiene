"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { refreshSmartLocation, syncStoredLocation } from "@/utils/location";
import PermissionsPanel from "@/components/figus/PermissionsPanel";
import RequiredLocationGate from "@/components/figus/RequiredLocationGate";
import { FiguShell } from "@/components/figus/FiguShell";
import { getMyMatches, refreshMyFiguMatches } from "@/services/figus";
import { FiguMatch } from "@/types/figus";

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">{children}</span>;
}

function distanceLabel(distance?: number | null) {
  if (distance === null || distance === undefined) return "Ubicación por confirmar";
  if (distance < 1) return `A ${Math.round(distance * 1000)} m`;
  return `A ${distance} km`;
}

function exchangeLabel(iGet?: number[] | null, otherGets?: number[] | null, type?: string | null) {
  const receive = iGet?.length ?? 0;
  const give = otherGets?.length ?? 0;
  if (type === "DOUBLE") return `Intercambio ${receive}x${give}`;
  if (receive > 0) return `Te sirve: ${receive} figu${receive === 1 ? "" : "s"}`;
  return "Ayuda simple";
}

function distanceHint(distance?: number | null) {
  if (distance === null || distance === undefined) return "Actualizá ubicación si querés mayor precisión";
  if (distance <= 3) return "Muy cerca";
  if (distance <= 10) return "Cerca";
  if (distance <= 20) return "Distancia media";
  return "Ubicación por confirmar";
}

export default function MatchesPage() {
  const { user, loading } = useAuth();
  const [profileId, setProfileId] = useState("");
  const [matches, setMatches] = useState<FiguMatch[]>([]);
  const [status, setStatus] = useState("Cargando intercambios...");
  const [type, setType] = useState("TODOS");
  const [statusFilter, setStatusFilter] = useState("ACTIVOS");
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    if (!user) return;
    try {
      const data = await getMyMatches(user);
      setProfileId(data.profile.id);
      setMatches(data.matches as FiguMatch[]);
      setStatus(data.matches.length ? "Intercambios cargados por compatibilidad y cercanía." : "Todavía no hay intercambios. Creá una solicitud o ajustá la zona.");
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
  }, [user]);

  async function handleRefresh() {
    if (!user) return;
    setRefreshing(true);
    setStatus("Recalculando intercambios...");
    try { await refreshMyFiguMatches(user); await load(); }
    catch (error) { setStatus(error instanceof Error ? error.message : "No se pudieron recalcular los intercambios."); }
    finally { setRefreshing(false); }
  }

  const filtered = useMemo(() => matches.filter((m) => {
    const byType = type === "TODOS" || m.match_type === type;
    const byStatus = statusFilter === "TODOS" || (statusFilter === "ACTIVOS" ? !["INTERCAMBIADO", "CANCELADO"].includes(m.status) : m.status === statusFilter);
    return byType && byStatus;
  }), [matches, type, statusFilter]);

  const multiPlan = useMemo(() => {
    const covered = new Set<number>();
    const chosen: FiguMatch[] = [];
    for (const match of filtered) {
      const amUser1 = match.user1_id === profileId;
      const iGet = amUser1 ? match.figus_user1_gets : match.figus_user2_gets;
      const newOnes = (iGet ?? []).filter((n) => !covered.has(n));
      if (newOnes.length > 0) {
        chosen.push(match);
        newOnes.forEach((n) => covered.add(n));
      }
      if (chosen.length === 3) break;
    }
    return { chosen, total: covered.size };
  }, [filtered, profileId]);

  if (loading) return <FiguShell><div className="rounded-[2rem] bg-white p-8">Cargando...</div></FiguShell>;
  if (!user) return <FiguShell><div className="rounded-[2rem] bg-white p-8 text-center"><h2 className="text-2xl font-black">Iniciá sesión</h2><p className="mt-2 text-slate-600">Necesitás entrar con Google para ver matches.</p></div></FiguShell>;

  return (
    <FiguShell>
      <RequiredLocationGate>
      <PermissionsPanel />
      <div className="mb-5 flex items-center justify-between">
        <Link href="/figus/solicitud" className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm ring-1 ring-slate-200">← Checkpoint</Link>
        <Link href="/figus/descubrir" className="rounded-2xl bg-[#0D1B2A] px-5 py-3 text-sm font-black text-white shadow-sm">Encontrar figus →</Link>
      </div>
      <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-black text-[#0D1B2A]">Intercambios inteligentes</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">Ordenados por figuritas compatibles, cercanía real y cantidad. Los intercambios se proponen siempre parejos: misma cantidad para ambos.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/figus/descubrir" className="rounded-2xl bg-[#22C55E] px-4 py-3 text-sm font-black text-white">Modo descubrir</Link>
            <button onClick={handleRefresh} disabled={refreshing} className="rounded-2xl bg-[#0D1B2A] px-4 py-3 text-sm font-black text-white disabled:opacity-60">{refreshing ? "Recalculando..." : "Recalcular"}</button>
            <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black outline-none focus:border-sky-500">
              <option value="TODOS">Todos</option><option value="DOUBLE">Solo intercambios</option><option value="SIMPLE">Solo ayudas simples</option>
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black outline-none focus:border-sky-500">
              <option value="ACTIVOS">Activos</option>
              <option value="TODOS">Todos los estados</option>
              <option value="PENDIENTE">Pendientes</option>
              <option value="HABLANDO">Hablando</option>
              <option value="ACORDADO">Acordados</option>
              <option value="INTERCAMBIADO">Intercambiados</option>
              <option value="CANCELADO">Cancelados</option>
            </select>
          </div>
        </div>

        {multiPlan.chosen.length > 1 ? (
          <div className="mb-5 rounded-[2rem] bg-violet-50 p-5 ring-1 ring-violet-200">
            <h3 className="text-xl font-black text-violet-950">🧠 Plan múltiple sugerido</h3>
            <p className="mt-1 text-sm font-bold text-violet-800">Con {multiPlan.chosen.length} personas podrías conseguir hasta {multiPlan.total} figuritas distintas.</p>
            <div className="mt-3 flex flex-wrap gap-2">{multiPlan.chosen.map((m) => <Link key={m.id} href={`/figus/chat/${m.id}`} className="rounded-2xl bg-violet-700 px-4 py-2 text-xs font-black text-white">Abrir chat</Link>)}</div>
          </div>
        ) : null}

        {filtered.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-slate-300 p-10 text-center">
            <p className="text-lg font-black text-slate-900">No hay intercambios con este filtro.</p>
            <p className="mt-2 text-sm font-semibold text-slate-500">{status}</p>
            <Link href="/figus/solicitud" className="mt-5 inline-flex rounded-2xl bg-[#2563EB] px-5 py-3 text-sm font-black text-white">Crear solicitud</Link>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {filtered.map((match) => {
              const amUser1 = match.user1_id === profileId;
              const other = amUser1 ? match.user2 : match.user1;
              const iGet = amUser1 ? match.figus_user1_gets : match.figus_user2_gets;
              const otherGets = amUser1 ? match.figus_user2_gets : match.figus_user1_gets;
              const location = [match.city, match.neighborhood].filter(Boolean).join(" · ");
              const almostDone = (iGet?.length ?? 0) <= 5 && (iGet?.length ?? 0) > 0;
              return (
                <article key={match.id} className={`rounded-[2rem] p-5 shadow-sm ring-1 ${match.match_type === "DOUBLE" ? "bg-emerald-50 ring-emerald-200" : "bg-white ring-slate-200"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-black text-white ${match.match_type === "DOUBLE" ? "bg-[#22C55E]" : "bg-[#2563EB]"}`}>{match.match_type === "DOUBLE" ? "🤝 Intercambio" : "➡️ Ayuda simple"}</span>
                        <span className="rounded-full bg-[#0D1B2A] px-3 py-1 text-xs font-black text-white">{exchangeLabel(iGet, otherGets, match.match_type)}</span>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#0D1B2A] ring-1 ring-slate-200">📍 {distanceLabel(match.distance_km)} · {distanceHint(match.distance_km)}</span>
                        {almostDone ? <span className="rounded-full bg-[#FBBF24] px-3 py-1 text-xs font-black text-white">modo me falta una</span> : null}
                      </div>
                      <h3 className="mt-3 text-xl font-black text-[#0D1B2A]">{other?.display_name || other?.email || "Usuario"}</h3>
                      {location ? <p className="mt-1 text-sm font-bold text-slate-500">📍 {location}</p> : null}
                    </div>
                    <Link href={`/figus/chat/${match.id}`} className="rounded-2xl bg-[#0D1B2A] px-4 py-3 text-sm font-black text-white">Chat</Link>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                    <p className="rounded-2xl bg-white/70 p-3 text-sm font-bold text-slate-600">📌 {match.meeting_suggestion || "Encuentro sugerido: punto público y seguro."}</p>
                    <span className="rounded-2xl bg-white px-4 py-3 text-xs font-black text-slate-600 ring-1 ring-slate-200">
                      {match.status === "HABLANDO" ? "Chat habilitado" : "Disponible"}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <div className="rounded-3xl bg-white/80 p-4"><p className="text-sm font-black text-slate-800">Vos recibís ({iGet?.length ?? 0})</p><div className="mt-3 flex flex-wrap gap-2">{(iGet ?? []).slice(0, 30).map((n) => <Chip key={n}>{n}</Chip>)}{(iGet?.length ?? 0) > 30 ? <Chip>+{(iGet?.length ?? 0) - 30}</Chip> : null}</div></div>
                    <div className="rounded-3xl bg-white/80 p-4"><p className="text-sm font-black text-slate-800">Vos entregás ({otherGets?.length ?? 0})</p><div className="mt-3 flex flex-wrap gap-2">{(otherGets ?? []).slice(0, 30).map((n) => <Chip key={n}>{n}</Chip>)}{(otherGets?.length ?? 0) > 30 ? <Chip>+{(otherGets?.length ?? 0) - 30}</Chip> : null}</div></div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        <p className="mt-5 text-sm font-semibold text-slate-500">{status}</p>
      </section>
      </RequiredLocationGate>
    </FiguShell>
  );
}
