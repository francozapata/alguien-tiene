"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { refreshSmartLocation, syncStoredLocation } from "@/utils/location";
import PermissionsPanel from "@/components/figus/PermissionsPanel";
import RequiredLocationGate from "@/components/figus/RequiredLocationGate";
import { FiguShell } from "@/components/figus/FiguShell";
import { expressFiguInterest, getMyMatches, refreshMyFiguMatches, rejectFiguMatch } from "@/services/figus";
import { FiguMatch } from "@/types/figus";
import { formatStickerList } from "@/lib/figus/catalog";

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700 ring-1 ring-slate-200">{children}</span>;
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

export default function DescubrirIntercambiosPage() {
  const { user, loading } = useAuth();
  const [profileId, setProfileId] = useState("");
  const [matches, setMatches] = useState<FiguMatch[]>([]);
  const [index, setIndex] = useState(0);
  const [discarded, setDiscarded] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [direction, setDirection] = useState<"left" | "right" | "neutral">("neutral");
  const [status, setStatus] = useState("Cargando intercambios...");
  const [interestStatus, setInterestStatus] = useState("");

  async function load() {
    if (!user) return;
    try {
      await refreshMyFiguMatches(user);
      const data = await getMyMatches(user);
      setProfileId(data.profile.id);
      setMatches((data.matches as FiguMatch[]).filter((m) => {
        if (["INTERCAMBIADO", "CANCELADO"].includes(m.status)) return false;
        const amUser1 = m.user1_id === data.profile.id;
        if (amUser1 && m.rejected_by_user1) return false;
        if (!amUser1 && m.rejected_by_user2) return false;
        if (!m.mutual_interest && ((amUser1 && m.liked_by_user1) || (!amUser1 && m.liked_by_user2))) return false;
        return true;
      }));
      setStatus("Revisá propuestas por figuritas compatibles y cercanía.");
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
    if (!user || !current) return;
    try {
      await rejectFiguMatch(user, current.id);
    } catch {}
    animate("left", () => {
      setDiscarded((prev) => [...prev, current.id]);
      setMatches((prev) => prev.filter((m) => m.id !== current.id));
      setIndex(0);
    });
  }

  function saveForLater() {
    if (!current) return;
    setSaved((prev) => prev.includes(current.id) ? prev : [...prev, current.id]);
    animate("right", next);
  }

  async function wantThis() {
    if (!user || !current) return;

    setInterestStatus("Guardando interés...");
    try {
      const result = await expressFiguInterest(user, current.id);

      if (result.isMutual) {
        setInterestStatus("¡Match mutuo! Ya se habilitó el chat.");
        window.location.href = `/figus/chat/${current.id}`;
        return;
      }

      setInterestStatus("Listo. Si la otra persona también quiere, se habilita el chat.");
      setSaved((prev) => prev.includes(current.id) ? prev : [...prev, current.id]);
      animate("right", () => {
        setMatches((prev) => prev.filter((m) => m.id !== current.id));
        setIndex(0);
      });
    } catch (error) {
      setInterestStatus(error instanceof Error ? error.message : "No se pudo guardar.");
    }
  }

  if (loading) return <FiguShell><div className="rounded-[2rem] bg-white p-8">Cargando...</div></FiguShell>;
  if (!user) return <FiguShell><div className="rounded-[2rem] bg-white p-8 text-center"><h2 className="text-2xl font-black">Iniciá sesión</h2><p className="mt-2 text-slate-600">Necesitás entrar con Google para descubrir intercambios.</p></div></FiguShell>;

  if (!current) {
    return (
      <FiguShell>
        <RequiredLocationGate>
        <section className="rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-slate-200/70">
          <h2 className="text-3xl font-black text-[#0D1B2A]">No hay más propuestas por ahora</h2>
          <p className="mt-2 text-sm font-semibold text-slate-500">{status}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button onClick={() => { setDiscarded([]); setIndex(0); load(); }} className="rounded-2xl bg-[#0D1B2A] px-5 py-3 text-sm font-black text-white">Revisar de nuevo</button>
            <Link href="/figus/solicitud" className="rounded-2xl bg-[#2563EB] px-5 py-3 text-sm font-black text-white">Ajustar solicitud</Link>
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

  const moveClass = direction === "left" ? "-translate-x-16 rotate-[-5deg] opacity-40" : direction === "right" ? "translate-x-16 rotate-[5deg] opacity-40" : "translate-x-0 rotate-0 opacity-100";

  return (
    <FiguShell>
      <RequiredLocationGate>
      <PermissionsPanel />
      <div className="mb-5 flex items-center justify-between">
        <Link href="/figus/mi-album" className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm ring-1 ring-slate-200">← Mi álbum</Link>
        <Link href="/figus" className="rounded-2xl bg-[#0D1B2A] px-5 py-3 text-sm font-black text-white shadow-sm">Home Figus</Link>
      </div>
      <section className="mx-auto max-w-xl">
        <div className="mb-4 text-center">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-[#16A34A]">Modo descubrir</p>
          <h2 className="mt-1 text-3xl font-black text-[#0D1B2A]">Elegí rápido</h2>
          <p className="mt-2 text-sm font-semibold text-slate-500">Aceptá, guardá o descartá propuestas compatibles.</p>
        </div>

        <div className={`rounded-[2.5rem] p-5 shadow-xl ring-2 transition-all duration-200 ${moveClass} ${isExchange ? "bg-emerald-50 ring-emerald-300" : "bg-sky-50 ring-sky-300"}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className={`rounded-full px-4 py-2 text-xs font-black text-white ${isExchange ? "bg-[#22C55E]" : "bg-[#2563EB]"}`}>
                {isExchange ? "🤝 Intercambio justo" : "➡️ Ayuda simple"}
              </span>
              <h2 className="mt-4 text-3xl font-black text-[#0D1B2A]">{other?.display_name || other?.email || "Usuario"}</h2>
              {location ? <p className="mt-1 text-sm font-bold text-slate-500">📍 {location}</p> : null}
              <p className="mt-1 text-sm font-black text-[#16A34A]">📌 {distanceLabel(current.distance_km)} · {distanceHint(current.distance_km)}</p>
            </div>
            <div className="rounded-3xl bg-white p-4 text-center shadow-sm">
              <p className="text-xl font-black text-[#0D1B2A]">{exchangeLabel(iGet, otherGets, current.match_type)}</p>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">propuesta</p>
              <p className="mt-1 text-[10px] font-black text-emerald-600">{distanceLabel(current.distance_km)}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-[2rem] bg-white p-4 text-center">
              <p className="text-4xl font-black text-[#16A34A]">{iGet?.length ?? 0}</p>
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">recibís</p>
            </div>
            <div className="rounded-[2rem] bg-white p-4 text-center">
              <p className="text-4xl font-black text-[#2563EB]">{otherGets?.length ?? 0}</p>
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">entregás</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            <div className="rounded-[2rem] bg-white p-4">
              <p className="text-sm font-black text-slate-800">Figuritas que recibís</p>
              <div className="mt-3 flex flex-wrap gap-2">{(iGet ?? []).slice(0, 40).map((n) => <Chip key={n}>{n}</Chip>)}</div>
            </div>
            <div className="rounded-[2rem] bg-white p-4">
              <p className="text-sm font-black text-slate-800">Figuritas que entregás</p>
              <div className="mt-3 flex flex-wrap gap-2">{(otherGets ?? []).slice(0, 40).map((n) => <Chip key={n}>{n}</Chip>)}</div>
            </div>
          </div>

          {isExchange ? (
            <p className="mt-4 rounded-2xl bg-emerald-100 p-4 text-center text-sm font-black text-emerald-900">
              Intercambio parejo: {iGet?.length ?? 0} x {otherGets?.length ?? 0}
            </p>
          ) : (
            <p className="mt-4 rounded-2xl bg-sky-100 p-4 text-center text-sm font-black text-sky-900">
              No es intercambio parejo. Puede servir para regalo, venta o arreglo manual.
            </p>
          )}

          <p className="mt-4 rounded-2xl bg-white/70 p-3 text-sm font-bold text-slate-600">📌 {current.meeting_suggestion || "Encuentro sugerido: punto público y seguro."}</p>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <button onClick={discard} className="rounded-[2rem] bg-red-50 px-4 py-4 text-sm font-black text-red-600 ring-1 ring-red-100">❌ No me sirve</button>
            <button onClick={saveForLater} className="rounded-[2rem] bg-white px-4 py-4 text-sm font-black text-slate-700 ring-1 ring-slate-200">🤍 Ver después</button>
            <button onClick={wantThis} className="rounded-[2rem] bg-[#22C55E] px-4 py-4 text-center text-sm font-black text-white">❤️ Quiero este</button>
          </div>
        </div>

        <p className="mt-4 text-center text-sm font-semibold text-slate-500">{visible.length} propuestas disponibles · {saved.length} guardadas · {interestStatus || status}</p>
      </section>
      </RequiredLocationGate>
    </FiguShell>
  );
}
