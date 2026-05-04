"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { refreshSmartLocation, syncStoredLocation } from "@/utils/location";
import PermissionsPanel from "@/components/figus/PermissionsPanel";
import RequiredLocationGate from "@/components/figus/RequiredLocationGate";
import { FiguShell } from "@/components/figus/FiguShell";
import { expressFiguInterest, getMyTinderData, rejectFiguMatch, undoLastTinderAction } from "@/services/figus";
import { FiguMatch } from "@/types/figus";
import { stickerCode } from "@/lib/figus/catalog";


function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700 ring-1 ring-slate-200">{children}</span>;
}

function distanceLabel(distance?: number | null) {
  if (distance === null || distance === undefined) return "Ubicación por confirmar";
  if (distance < 1) return `A ${Math.round(distance * 1000)} m`;
  return `A ${distance} km`;
}


export default function DescubrirIntercambiosPage() {
  const { user, loading } = useAuth();
  const [profileId, setProfileId] = useState("");
  const [matches, setMatches] = useState<FiguMatch[]>([]);
  const [incomingLikes, setIncomingLikes] = useState<FiguMatch[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [index, setIndex] = useState(0);
  const [discarded, setDiscarded] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [direction, setDirection] = useState<"left" | "right" | "neutral">("neutral");
  const [status, setStatus] = useState("Cargando intercambios...");
  const [interestStatus, setInterestStatus] = useState("");
  const [loadingAction, setLoadingAction] = useState(false);

  async function load() {
    if (!user) return;
    try {
      const data = await getMyTinderData(user);
      setProfileId(data.profile.id);
      setMatches(data.queue as FiguMatch[]);
      setIncomingLikes(data.incomingLikes as FiguMatch[]);
      setStats(data.stats);
      setIndex(0);
      setDiscarded([]);
      setStatus(data.queue.length ? "Modo Tinder: mazo de figuritas armado desde tu álbum, tus repetidas y otros usuarios compatibles." : "No hay tarjetas Tinder por ahora. Revisá que tu álbum y repetidas estén cargados, y que existan usuarios compatibles.");
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

  const visible = useMemo(() => matches.filter((m) => !discarded.includes(m.id)), [matches, discarded]);
  const current = visible[index] ?? null;

  function animate(nextDirection: "left" | "right", cb: () => void) {
    setDirection(nextDirection);
    setTimeout(() => {
      cb();
      setDirection("neutral");
    }, 180);
  }

  function next() {
    setIndex((value) => Math.min(value + 1, Math.max(visible.length - 1, 0)));
  }

  async function discard() {
    if (!user || !current || loadingAction) return;
    setLoadingAction(true);
    try {
      await rejectFiguMatch(user, current.id);
      animate("left", () => {
        setDiscarded((prev) => [...prev, current.id]);
        setMatches((prev) => prev.filter((m) => m.id !== current.id));
        setIndex(0);
      });
    } catch (error) {
      setInterestStatus(error instanceof Error ? error.message : "No se pudo descartar.");
    } finally {
      setLoadingAction(false);
    }
  }

  function saveForLater() {
    if (!current) return;
    setSaved((prev) => prev.includes(current.id) ? prev : [...prev, current.id]);
    animate("right", next);
  }

  async function wantThis() {
    if (!user || !current || loadingAction) return;

    setLoadingAction(true);
    setInterestStatus("Guardando interés...");
    try {
      const result = await expressFiguInterest(user, current.id);

      if (result.isMutual) {
        setInterestStatus("¡Coincidencia de ambos lados! Ya se habilitó el chat.");
        window.location.href = `/figus/chat/${current.id}`;
        return;
      }

      setInterestStatus("Listo. La tarjeta se ocultó. El chat se habilita solo si la otra persona también marca interés.");
      setSaved((prev) => prev.includes(current.id) ? prev : [...prev, current.id]);
      animate("right", () => {
        setMatches((prev) => prev.filter((m) => m.id !== current.id));
        setIncomingLikes((prev) => prev.filter((m) => m.id !== current.id));
        setIndex(0);
        load();
      });
    } catch (error) {
      setInterestStatus(error instanceof Error ? error.message : "No se pudo guardar.");
    } finally {
      setLoadingAction(false);
    }
  }

  async function undoLast() {
    if (!user || loadingAction) return;
    setLoadingAction(true);
    setInterestStatus("Deshaciendo última acción...");
    try {
      await undoLastTinderAction(user);
      setInterestStatus("Listo. Recuperamos tu última tarjeta posible.");
      await load();
    } catch (error) {
      setInterestStatus(error instanceof Error ? error.message : "No se pudo deshacer.");
    } finally {
      setLoadingAction(false);
    }
  }

  function otherLikedThis(match: FiguMatch) {
    const amUser1 = match.user1_id === profileId;
    return amUser1 ? Boolean(match.liked_by_user2) : Boolean(match.liked_by_user1);
  }

  function myLikeLabel() {
    const likesLimit = stats?.likesLimit ?? "—";
    const cardsLimit = stats?.cardsLimit ?? "—";
    const undoLimit = stats?.undoLimit ?? "—";
    const fmt = (v: any) => v === "Ilimitado" ? "ilimitado" : `${v}/día`;
    return `Tarjetas ${fmt(cardsLimit)} · Me interesa ${fmt(likesLimit)} · Deshacer ${fmt(undoLimit)}`;
  }

  if (loading) return <FiguShell><div className="rounded-[2rem] bg-white p-8">Cargando...</div></FiguShell>;
  if (!user) return <FiguShell><div className="rounded-[2rem] bg-white p-8 text-center"><h2 className="text-2xl font-black">Iniciá sesión</h2><p className="mt-2 text-slate-600">Necesitás entrar con Google para descubrir intercambios.</p></div></FiguShell>;

  const likesPanel = (
    <div className="mb-5 grid gap-3 md:grid-cols-3">
      <div className="rounded-[2rem] bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Tus límites Tinder</p>
        <p className="mt-2 text-sm font-black text-[#0D1B2A]">{myLikeLabel()}</p>
      </div>
      <div className="rounded-[2rem] bg-emerald-50 p-4 shadow-sm ring-1 ring-emerald-200">
        <p className="text-xs font-black uppercase tracking-widest text-emerald-700">Te dieron like</p>
        <p className="mt-1 text-2xl font-black text-emerald-900">{stats?.incomingLikesCount ?? 0}</p>
        <p className="mt-1 text-xs font-bold text-emerald-700">{stats?.seeLikes ? "Podés ver quiénes son." : "Ver quiénes es beneficio Plus o Premium."}</p>
      </div>
      <div className="rounded-[2rem] bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Acciones</p>
        <button onClick={undoLast} disabled={loadingAction} className="mt-2 rounded-2xl bg-[#0D1B2A] px-4 py-3 text-sm font-black text-white disabled:opacity-50">↩️ Deshacer</button>
      </div>
    </div>
  );

  if (!current) {
    return (
      <FiguShell>
        <RequiredLocationGate>
        {likesPanel}
        {stats?.seeLikes && incomingLikes.length ? (
          <section className="mb-5 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-emerald-200">
            <h3 className="text-xl font-black text-[#0D1B2A]">Personas que te dieron like</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {incomingLikes.slice(0, 6).map((match) => {
                const amUser1 = match.user1_id === profileId;
                const other = amUser1 ? match.user2 : match.user1;
                const iGet = amUser1 ? match.figus_user1_gets : match.figus_user2_gets;
                const otherGets = amUser1 ? match.figus_user2_gets : match.figus_user1_gets;
                return <article key={match.id} className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
                  <p className="font-black text-[#0D1B2A]">{other?.display_name || other?.email || "Usuario"}</p>
                  <p className="mt-1 text-xs font-bold text-slate-600">Intercambio {iGet?.length ?? 0}x{otherGets?.length ?? 0} · {distanceLabel(match.distance_km)}</p>
                  <button onClick={() => { setMatches((prev) => [match, ...prev.filter((m) => m.id !== match.id)]); setIndex(0); }} className="mt-3 rounded-xl bg-[#22C55E] px-3 py-2 text-xs font-black text-white">Ver tarjeta</button>
                </article>;
              })}
            </div>
          </section>
        ) : null}
        <section className="rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-slate-200/70">
          <h2 className="text-3xl font-black text-[#0D1B2A]">No hay más propuestas por ahora</h2>
          <p className="mt-2 text-sm font-semibold text-slate-500">{status}</p>
          <p className="mx-auto mt-2 max-w-xl text-xs font-bold leading-5 text-slate-400">
            El modo Tinder ahora arma su propio mazo de tarjetas desde álbum + repetidas. El modo simple queda separado.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button onClick={() => load()} className="rounded-2xl bg-[#0D1B2A] px-5 py-3 text-sm font-black text-white">Revisar de nuevo</button>
            <Link href="/figus/guiado" className="rounded-2xl bg-[#22C55E] px-5 py-3 text-sm font-black text-white">Ver modo simple</Link>
            <Link href="/figus/mi-album" className="rounded-2xl bg-[#2563EB] px-5 py-3 text-sm font-black text-white">Ajustar álbum</Link>
          </div>
        </section>
        </RequiredLocationGate>
    </FiguShell>
    );
  }

  const amUser1 = current.user1_id === profileId;
  const other = amUser1 ? current.user2 : current.user1;
  const iGet = amUser1 ? current.figus_user1_gets : current.figus_user2_gets;
  const otherGets = amUser1 ? current.figus_user2_gets : current.figus_user1_gets;
  const location = [current.city, current.neighborhood].filter(Boolean).join(" · ");
  const isExchange = current.match_type === "DOUBLE";
  const incomingLike = otherLikedThis(current);

  const moveClass = direction === "left" ? "-translate-x-16 rotate-[-5deg] opacity-40" : direction === "right" ? "translate-x-16 rotate-[5deg] opacity-40" : "translate-x-0 rotate-0 opacity-100";

  return (
    <FiguShell>
      <RequiredLocationGate>
      <PermissionsPanel />
      <div className="mb-5 flex items-center justify-between">
        <Link href="/figus/mi-album" className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm ring-1 ring-slate-200">← Mi álbum</Link>
        <Link href="/figus" className="rounded-2xl bg-[#0D1B2A] px-5 py-3 text-sm font-black text-white shadow-sm">Home Figus</Link>
      </div>
      {likesPanel}
      <section className="mx-auto max-w-xl">
        <div className="mb-4 text-center">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-[#16A34A]">Modo Tinder</p>
          <h2 className="mt-1 text-3xl font-black text-[#0D1B2A]">Elegí rápido</h2>
          <p className="mt-2 text-sm font-semibold text-slate-500">Aceptá, guardá o descartá propuestas compatibles. El chat abre solo con coincidencia de ambos lados.</p>
        </div>

        <div className={`rounded-[2.5rem] p-5 shadow-xl ring-2 transition-all duration-200 ${moveClass} ${incomingLike ? "bg-emerald-100 ring-emerald-400" : isExchange ? "bg-emerald-50 ring-emerald-300" : "bg-sky-50 ring-sky-300"}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className={`rounded-full px-4 py-2 text-xs font-black text-white ${isExchange ? "bg-[#22C55E]" : "bg-[#2563EB]"}`}>
                  {isExchange ? "🤝 Intercambio justo" : "➡️ Ayuda simple"}
                </span>
                {incomingLike ? <span className="rounded-full bg-pink-600 px-4 py-2 text-xs font-black text-white">❤️ Ya te dio like</span> : null}
              </div>
              <h2 className="mt-4 text-3xl font-black text-[#0D1B2A]">{other?.display_name || other?.email || "Usuario"}</h2>
              {location ? <p className="mt-1 text-sm font-bold text-slate-500">📍 {location}</p> : null}
            </div>
            <span className="rounded-full bg-white px-4 py-2 text-xs font-black text-[#0D1B2A] ring-1 ring-slate-200">{distanceLabel(current.distance_km)}</span>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-[2rem] bg-white p-4">
              <p className="text-sm font-black text-slate-800">Figuritas que recibís</p>
              <p className="mt-1 text-2xl font-black text-[#16A34A]">{iGet?.length ?? 0}</p>
              <div className="mt-3 flex flex-wrap gap-2">{(iGet ?? []).slice(0, 40).map((n) => <Chip key={n}>{stickerCode(n)}</Chip>)}</div>
            </div>
            <div className="rounded-[2rem] bg-white p-4">
              <p className="text-sm font-black text-slate-800">Figuritas que entregás</p>
              <p className="mt-1 text-2xl font-black text-[#2563EB]">{otherGets?.length ?? 0}</p>
              <div className="mt-3 flex flex-wrap gap-2">{(otherGets ?? []).slice(0, 40).map((n) => <Chip key={n}>{stickerCode(n)}</Chip>)}</div>
            </div>
          </div>

          <p className="mt-4 rounded-2xl bg-emerald-100 p-4 text-center text-sm font-black text-emerald-900">
            Intercambio parejo 1x1: {iGet?.length ?? 0} x {otherGets?.length ?? 0}
          </p>

          <p className="mt-4 rounded-2xl bg-white/70 p-3 text-sm font-bold text-slate-600">📌 {current.meeting_suggestion || "Encuentro sugerido: punto público y seguro."}</p>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <button disabled={loadingAction} onClick={discard} className="rounded-[2rem] bg-red-50 px-4 py-4 text-sm font-black text-red-600 ring-1 ring-red-100 disabled:opacity-50">❌ No me sirve</button>
            <button disabled={loadingAction} onClick={saveForLater} className="rounded-[2rem] bg-white px-4 py-4 text-sm font-black text-slate-700 ring-1 ring-slate-200 disabled:opacity-50">🤍 Ver después</button>
            <button disabled={loadingAction} onClick={wantThis} className="rounded-[2rem] bg-[#22C55E] px-4 py-4 text-center text-sm font-black text-white disabled:opacity-50">❤️ Me interesa</button>
          </div>
        </div>

        <p className="mt-4 text-center text-sm font-semibold text-slate-500">{visible.length} propuestas · {saved.length} guardadas · {interestStatus || status}</p>
      </section>
      </RequiredLocationGate>
    </FiguShell>
  );
}
