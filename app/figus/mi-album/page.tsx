"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { FiguShell } from "@/components/figus/FiguShell";
import { getMyFiguBootstrap, saveOwnedFigus, saveRepeatedFigus } from "@/services/figus";
import { TOTAL_FIGUS_MUNDIAL } from "@/types/figus";
import { groupedStickerCatalog, parseStickerToken, stickerCode, stickerLabel } from "@/lib/figus/catalog";

const PAGE_SIZE = 100;

export default function MiAlbumPage() {
  const { user, loading } = useAuth();
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [page, setPage] = useState(1);
  const [jump, setJump] = useState("");
  const [status, setStatus] = useState("Cargando álbum...");
  const [saving, setSaving] = useState(false);
  const [selectedFigu, setSelectedFigu] = useState<number | null>(null);

  const pages = Math.ceil(TOTAL_FIGUS_MUNDIAL / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, TOTAL_FIGUS_MUNDIAL);
  const numbers = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const owned = useMemo(
    () => Object.entries(counts).filter(([, quantity]) => quantity > 0).map(([figu]) => Number(figu)).sort((a, b) => a - b),
    [counts]
  );

  const repeated = useMemo(() => {
    const next: Record<number, number> = {};
    Object.entries(counts).forEach(([figu, quantity]) => {
      if (quantity > 1) next[Number(figu)] = quantity - 1;
    });
    return next;
  }, [counts]);

  const repeatedEntries = useMemo(() => Object.entries(repeated).map(([n, q]) => [Number(n), q] as const).sort((a, b) => a[0] - b[0]), [repeated]);
  const repeatedTotal = repeatedEntries.reduce((sum, [, quantity]) => sum + Number(quantity), 0);
  const percentage = Math.round((owned.length / TOTAL_FIGUS_MUNDIAL) * 1000) / 10;
  const missing = TOTAL_FIGUS_MUNDIAL - owned.length;
  const progressTone = percentage >= 80 ? "from-emerald-500 to-green-400" : percentage >= 40 ? "from-sky-500 to-indigo-500" : "from-amber-400 to-orange-500";
  const catalogGroups = groupedStickerCatalog();

  useEffect(() => {
    async function load() {
      if (!user) return;
      try {
        const data = await getMyFiguBootstrap(user);
        const ownedFigus = data.progress?.owned_figus ?? [];
        const next: Record<number, number> = {};
        ownedFigus.forEach((figu: number) => { next[figu] = Math.max(next[figu] ?? 0, 1); });
        for (const row of data.repeated ?? []) next[row.figu_number] = Math.max(next[row.figu_number] ?? 1, Number(row.quantity) + 1);
        setCounts(next);
        setStatus("Álbum cargado.");
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "No se pudo cargar el álbum.");
      }
    }
    load();
  }, [user]);

  function selectFigu(n: number) {
    setSelectedFigu(n);
    if (!counts[n]) setCounts((prev) => ({ ...prev, [n]: 1 }));
  }

  function setFiguQuantity(figu: number, quantity: number) {
    setCounts((prev) => {
      const next = { ...prev };
      if (quantity <= 0) delete next[figu];
      else next[figu] = Math.min(99, quantity);
      return next;
    });
  }

  function jumpToFigu() {
    const parsed = parseStickerToken(jump);
    if (parsed) {
      setSelectedFigu(parsed);
      document.getElementById(`figu-${parsed}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    setStatus("Guardando álbum...");
    try {
      await saveOwnedFigus(user, owned);
      await saveRepeatedFigus(user, repeated);
      setStatus("Guardado correctamente. Ya podés ir al checkpoint.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <FiguShell><div className="rounded-[2rem] bg-white p-8">Cargando...</div></FiguShell>;
  if (!user) {
    return <FiguShell><div className="rounded-[2rem] bg-white p-8 text-center"><h2 className="text-2xl font-black">Iniciá sesión</h2><p className="mt-2 text-slate-600">Necesitás entrar con Google para cargar tu álbum.</p></div></FiguShell>;
  }

  const selectedQuantity = selectedFigu ? counts[selectedFigu] ?? 0 : 0;

  return (
    <FiguShell>
      <div className="mb-5 flex items-center justify-between">
        <Link href="/figus" className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm ring-1 ring-slate-200">← Home Figus</Link>
        <Link href="/figus/solicitud" className="rounded-2xl bg-[#0D1B2A] px-5 py-3 text-sm font-black text-white shadow-sm">Siguiente →</Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <section className="rounded-[2.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-[#2563EB]">Paso 1 de 3</p>
              <h2 className="mt-1 text-4xl font-black text-[#0D1B2A]">Cargá tu álbum</h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
                Tocá una figurita en la grilla y ajustá la cantidad con + o -. Si tenés 1, significa que la tenés. Si tenés 2 o más, el excedente cuenta como repetida.
              </p>
            </div>
            <button onClick={handleSave} disabled={saving} className="rounded-2xl bg-[#2563EB] px-5 py-3 text-sm font-black text-white disabled:opacity-60">
              {saving ? "Guardando..." : "Guardar álbum"}
            </button>
          </div>

          <div className="mb-5 grid gap-3 rounded-[2rem] bg-amber-50 p-4 ring-1 ring-amber-100 md:grid-cols-[1fr_auto]">
            <input value={jump} onChange={(e) => setJump(e.target.value)} placeholder="Buscar código: ej. ARG10, FWC0, POR20" className="rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-amber-500" />
            <button onClick={jumpToFigu} className="rounded-2xl bg-[#FBBF24] px-5 py-3 text-sm font-black text-white">Ir</button>
          </div>

          {selectedFigu ? (
            <div className="mb-5 rounded-[2rem] bg-slate-50 p-4 ring-1 ring-slate-200">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-2xl font-black text-[#0D1B2A]">{stickerLabel(selectedFigu)}</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Cantidad total que tenés. Repetidas: {Math.max(selectedQuantity - 1, 0)}.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setFiguQuantity(selectedFigu, selectedQuantity - 1)} className="h-12 w-12 rounded-xl bg-white text-xl font-black ring-1 ring-slate-200">-</button>
                  <div className="min-w-24 rounded-2xl bg-white px-5 py-2 text-center ring-1 ring-slate-200">
                    <p className="text-3xl font-black">{selectedQuantity}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">cantidad</p>
                  </div>
                  <button onClick={() => setFiguQuantity(selectedFigu, selectedQuantity + 1)} className="h-12 w-12 rounded-xl bg-[#0D1B2A] text-xl font-black text-white">+</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-5 rounded-[2rem] bg-sky-50 p-4 text-sm font-black text-sky-800 ring-1 ring-sky-100">
              Elegí una figurita de la grilla para cargar cantidad.
            </div>
          )}

          <div className="space-y-7">
            {catalogGroups.map((section) => (
              <div key={section.section} className="rounded-[2rem] border border-slate-100 bg-slate-50/50 p-4">
                <h3 className="text-xl font-black text-[#0D1B2A]">{section.section}</h3>
                <div className="mt-4 space-y-5">
                  {section.teams.map((team) => (
                    <div key={`${section.section}-${team.team}`}>
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-xl">{team.flag}</span>
                        <p className="text-sm font-black uppercase tracking-widest text-[#2563EB]">{team.team} · {team.teamName}</p>
                      </div>
                      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 xl:grid-cols-10">
                        {team.stickers.map((sticker) => {
                          const n = sticker.ordinal;
                          const qty = counts[n] ?? 0;
                          const active = qty > 0;
                          const selected = selectedFigu === n;

                          return (
                            <button
                              id={`figu-${n}`}
                              key={sticker.code}
                              onClick={() => selectFigu(n)}
                              className={`relative flex min-h-16 flex-col items-center justify-center rounded-2xl px-2 py-2 text-xs font-black ring-1 transition ${selected ? "bg-[#0D1B2A] text-white ring-slate-950" : active ? "bg-[#22C55E] text-white ring-emerald-500" : "bg-white text-slate-700 ring-slate-200 hover:bg-sky-50"}`}
                            >
                              <span className="text-base">{sticker.flag}</span>
                              <span>{sticker.code}</span>
                              <span className={`mt-0.5 text-[10px] leading-none ${active ? "text-white/90" : "text-slate-300"}`}>{qty > 0 ? `x${qty}` : "—"}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-5">
          <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
            <h3 className="text-xl font-black text-[#0D1B2A]">Resumen</h3>
            <div className="mt-4 h-5 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
              <div className={`h-full rounded-full bg-gradient-to-r ${progressTone} transition-all`} style={{ width: `${percentage}%` }} />
            </div>
            <p className="mt-2 text-center text-sm font-black text-slate-700">{percentage}% completado</p>
            <div className="mt-5 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-2xl bg-sky-50 p-3"><p className="text-2xl font-black text-[#2563EB]">{owned.length}</p><p className="text-xs font-bold">tenés</p></div>
              <div className="rounded-2xl bg-red-50 p-3"><p className="text-2xl font-black text-red-700">{missing}</p><p className="text-xs font-bold">faltan</p></div>
              <div className="rounded-2xl bg-emerald-50 p-3"><p className="text-2xl font-black text-[#16A34A]">{repeatedTotal}</p><p className="text-xs font-bold">repetidas</p></div>
              <div className="rounded-2xl bg-violet-50 p-3"><p className="text-2xl font-black text-violet-700">{repeatedEntries.length}</p><p className="text-xs font-bold">números rep.</p></div>
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-500">{status}</p>
          </div>

          <Link href="/figus/solicitud" className="block rounded-[2rem] bg-[#0D1B2A] p-6 text-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
            <h3 className="text-xl font-black">Siguiente: revisar checkpoint</h3>
            <p className="mt-2 text-sm text-slate-300">El sistema calcula qué te falta y qué podés entregar.</p>
          </Link>
        </aside>
      </div>
    </FiguShell>
  );
}
