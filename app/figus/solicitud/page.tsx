"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { FiguShell } from "@/components/figus/FiguShell";
import { calculateNeededFromOwned, getMyFiguBootstrap, saveFiguRequest } from "@/services/figus";
import { stickerCode } from "@/lib/figus/catalog";

export default function SolicitudPage() {
  const { user, loading } = useAuth();
  const [needed, setNeeded] = useState<number[]>([]);
  const [offered, setOffered] = useState<string[]>([]);
  const [city, setCity] = useState("Córdoba");
  const [neighborhood, setNeighborhood] = useState("");
  const [notes, setNotes] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [status, setStatus] = useState("Calculando solicitud...");
  const [saving, setSaving] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [ownedCount, setOwnedCount] = useState(0);

  useEffect(() => {
    async function load() {
      if (!user) return;

      try {
        const data = await getMyFiguBootstrap(user);
        const owned = data.progress?.owned_figus ?? [];
        const calculatedNeeded = calculateNeededFromOwned(owned);
        const repeated = (data.repeated ?? []).map((row: any) => row.quantity > 1 ? `${stickerCode(row.figu_number)}x${row.quantity}` : `${stickerCode(row.figu_number)}`);

        setOwnedCount(owned.length);
        setNeeded(calculatedNeeded);
        setOffered(repeated);

        if (data.request) {
          setCity(data.request.city ?? "Córdoba");
          setNeighborhood(data.request.neighborhood ?? "");
          setNotes(data.request.notes ?? "");
          setUrgent(Boolean(data.request.is_urgent));
        }

        setStatus("Solicitud calculada desde tu álbum y tus repetidas.");
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "No se pudo calcular.");
      }
    }

    load();
  }, [user]);

  const sampleNeeded = useMemo(() => needed.slice(0, 30).map(stickerCode), [needed]);
  const sampleOffered = useMemo(() => offered.slice(0, 20), [offered]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (needed.length === 0) {
      setStatus("Tu álbum figura completo. No hay faltantes para solicitar.");
      return;
    }

    setSaving(true);
    setCalculating(true);
    setStatus("Calculando matches cercanos...");
    try {
      await saveFiguRequest(user, { neededFigus: needed, isUrgent: false, city, neighborhood, notes: "" });
      setStatus("Matches calculados.");
      window.setTimeout(() => {
        window.location.href = "/figus/guiado";
      }, 900);
    } catch (error) {
      setCalculating(false);
      setStatus(error instanceof Error ? error.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <FiguShell><div className="rounded-[2rem] bg-white p-8">Cargando...</div></FiguShell>;
  if (!user) return <FiguShell><div className="rounded-[2rem] bg-white p-8 text-center"><h2 className="text-2xl font-black">Iniciá sesión</h2><p className="mt-2 text-slate-600">Necesitás entrar con Google para crear solicitudes.</p></div></FiguShell>;

  return (
    <FiguShell>
      {calculating ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#0D1B2A]/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-8 text-center shadow-2xl">
            <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-emerald-100 border-t-[#22C55E]" />
            <h2 className="mt-5 text-3xl font-black text-[#0D1B2A]">Calculando matches...</h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Estamos cruzando tus faltantes, repetidas y usuarios cercanos.
            </p>
          </div>
        </div>
      ) : null}

      <div className="mb-5 flex items-center justify-between">
        <Link href="/figus/mi-album" className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm ring-1 ring-slate-200">← Mi álbum</Link>
        <Link href="/figus/guiado" className="rounded-2xl bg-[#0D1B2A] px-5 py-3 text-sm font-black text-white shadow-sm">Usuarios cercanos →</Link>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-5">
        <section className="rounded-[2.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-violet-600">Paso 2 de 3</p>
            <h2 className="mt-1 text-4xl font-black text-[#0D1B2A]">Checkpoint</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
              No hace falta cargar todo de nuevo: el sistema detecta qué tenés, qué te falta y qué podés entregar.
              Solo revisá el checkpoint, confirmá y elegí cómo querés encontrar figus.
            </p>
          </div>

          <div className="mt-6 rounded-[2.5rem] bg-gradient-to-br from-violet-50 to-sky-50 p-5 ring-1 ring-violet-100">
            <h3 className="text-2xl font-black text-[#0D1B2A]">Checkpoint automático</h3>
            <p className="mt-1 text-sm font-bold text-slate-500">Calculado desde “Mi álbum” y “Mis repetidas”.</p>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-[2rem] bg-white p-5 text-center shadow-sm">
                <p className="text-4xl font-black text-[#2563EB]">{ownedCount}</p>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">tenés</p>
              </div>
              <div className="rounded-[2rem] bg-white p-5 text-center shadow-sm">
                <p className="text-4xl font-black text-red-700">{needed.length}</p>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">te faltan</p>
              </div>
              <div className="rounded-[2rem] bg-white p-5 text-center shadow-sm">
                <p className="text-4xl font-black text-[#16A34A]">{offered.length}</p>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">ofrecés</p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-[2rem] bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-lg font-black text-[#0D1B2A]">Figuritas que necesitás</h4>
                  <Link href="/figus/mi-album" className="rounded-xl bg-sky-50 px-3 py-2 text-xs font-black text-[#2563EB]">Editar álbum</Link>
                </div>
                <p className="mt-1 text-xs font-bold text-slate-500">Mostramos una vista previa. Se guardan todas las faltantes.</p>
                <div className="mt-3 flex max-h-36 flex-wrap gap-2 overflow-auto">
                  {sampleNeeded.map((n) => <span key={n} className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700">#{n}</span>)}
                  {needed.length > sampleNeeded.length ? <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">+{needed.length - sampleNeeded.length}</span> : null}
                </div>
              </div>

              <div className="rounded-[2rem] bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-lg font-black text-[#0D1B2A]">Figuritas que podés entregar</h4>
                  <Link href="/figus/mi-album" className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-[#16A34A]">Editar repetidas</Link>
                </div>
                <p className="mt-1 text-xs font-bold text-slate-500">Se usan para crear intercambios justos.</p>
                <div className="mt-3 flex max-h-36 flex-wrap gap-2 overflow-auto">
                  {sampleOffered.length === 0 ? <span className="text-sm font-bold text-slate-400">No cargaste repetidas todavía.</span> : null}
                  {sampleOffered.map((n) => <span key={n} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-[#16A34A]">#{n}</span>)}
                  {offered.length > sampleOffered.length ? <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">+{offered.length - sampleOffered.length}</span> : null}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label><span className="mb-2 block text-sm font-black text-slate-800">Ciudad</span><input value={city} onChange={(e) => setCity(e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-sky-500" /></label>
            <label><span className="mb-2 block text-sm font-black text-slate-800">Barrio / zona</span><input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Nueva Córdoba, Centro, Alberdi..." className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-sky-500" /></label>
          </div>
        </section>
          <div className="mt-6 flex flex-col gap-3 rounded-[2rem] bg-white p-5 ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-black text-[#0D1B2A]">Checkpoint listo</h3>
              <p className="mt-1 text-sm font-semibold text-slate-500">{status}</p>
            </div>
            <button disabled={saving} className="rounded-2xl bg-[#22C55E] px-6 py-4 text-sm font-black text-white disabled:opacity-60">
              {saving ? "Calculando..." : "Siguiente: ver usuarios cercanos"}
            </button>
          </div>
        </form>
    </FiguShell>
  );
}
