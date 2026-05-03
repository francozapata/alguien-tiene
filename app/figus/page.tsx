"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { FiguShell } from "@/components/figus/FiguShell";
import { getFiguDashboard, getMyFiguBootstrap } from "@/services/figus";
import { TOTAL_FIGUS_MUNDIAL } from "@/types/figus";
import OnboardingCard from "@/components/figus/OnboardingCard";
import { getMySubscription, getPlanExpirationText, getPlanLabel, SubscriptionState } from "@/services/subscriptions";

type Dashboard = Awaited<ReturnType<typeof getFiguDashboard>>;

function StatCard({ label, value, helper, tone }: { label: string; value: string | number; helper?: string; tone: "dark" | "blue" | "red" | "green" }) {
  const cls = {
    dark: "bg-[#0D1B2A] text-white",
    blue: "bg-sky-50 text-sky-800",
    red: "bg-red-50 text-red-800",
    green: "bg-emerald-50 text-emerald-800",
  }[tone];

  return (
    <div className={`rounded-[2rem] p-5 ${cls}`}>
      <p className="text-4xl font-black">{value}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-widest opacity-80">{label}</p>
      {helper ? <p className="mt-1 text-[11px] font-bold opacity-80">{helper}</p> : null}
    </div>
  );
}

export default function FigusPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [ownedCount, setOwnedCount] = useState(0);
  const [repeatedNumbers, setRepeatedNumbers] = useState(0);
  const [repeatedTotal, setRepeatedTotal] = useState(0);
  const [loadingPanel, setLoadingPanel] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionState | null>(null);

  useEffect(() => {
    async function load() {
      if (!user) {
        setLoadingPanel(false);
        return;
      }

      try {
        const [dash, boot, sub] = await Promise.all([getFiguDashboard(user), getMyFiguBootstrap(user), getMySubscription(user)]);

        setDashboard(dash);
        setSubscription(sub.subscription);

        const owned = boot.progress?.owned_figus ?? [];
        const repeated = boot.repeated ?? [];

        setOwnedCount(owned.length);
        setRepeatedNumbers(repeated.length);
        setRepeatedTotal(repeated.reduce((sum: number, row: any) => sum + Number(row.quantity ?? 0), 0));
      } finally {
        setLoadingPanel(false);
      }
    }

    load();
  }, [user]);

  const missingCount = Math.max(TOTAL_FIGUS_MUNDIAL - ownedCount, 0);
  const percentage = Math.round((ownedCount / TOTAL_FIGUS_MUNDIAL) * 1000) / 10;
  const progressTone = percentage >= 80 ? "from-emerald-500 to-green-400" : percentage >= 40 ? "from-sky-500 to-indigo-500" : "from-amber-400 to-orange-500";

  const guidedSteps = useMemo(() => [
    { href: "/figus/mi-album", title: "1. Cargá álbum y repetidas", text: "Marcá cantidades en la grilla. Lo que supere 1 cuenta como repetida.", icon: "📘" },
    { href: "/figus/solicitud", title: "2. Revisá el checkpoint", text: "Ves las que tenés, las que te faltan y las repetidas que ofrecés.", icon: "✅" },
    { href: "/figus/guiado", title: "3. Usuarios cercanos", text: "Lista ordenable por cercanía o por mayor cantidad de intercambios posibles.", icon: "📍" },
  ], []);

  return (
    <FiguShell>
      <OnboardingCard />
      {user ? (
        <section className="mb-6 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-[#2563EB]">Estado de cuenta</p>
              <h2 className="mt-1 text-2xl font-black text-[#0D1B2A]">
                {subscription?.plan_type && subscription.plan_type !== "FREE" ? `💎 ${getPlanLabel(subscription.plan_type)}` : "🆓 Modo Gratis"}
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">{getPlanExpirationText(subscription)}</p>
              <p className="mt-2 text-xs font-bold leading-5 text-slate-500">
                Para ver el detalle completo de beneficios, vencimientos, extras disponibles y límites diarios, entrá a tu perfil en el apartado <span className="font-black text-[#0D1B2A]">Suscripción</span> o tocá el botón <span className="font-black text-[#22C55E]">Suscribite</span>.
              </p>
            </div>
            <Link href="/figus/suscripcion" className="rounded-2xl bg-[#22C55E] px-5 py-3 text-center text-sm font-black text-white">
              Suscribite $
            </Link>
          </div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-[2.5rem] bg-white shadow-sm ring-1 ring-slate-200/70">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[#2563EB]">Tu misión</p>
            <h2 className="mt-2 text-4xl font-black tracking-tight text-[#0D1B2A]">Conseguir las que te faltan</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
              Cargá tu álbum, tus repetidas y dejá que el sistema encuentre intercambios justos cerca tuyo.
            </p>

            <div className="mt-6 h-5 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
              <div className={`h-full rounded-full bg-gradient-to-r ${progressTone} transition-all`} style={{ width: `${percentage}%` }} />
            </div>

            <div className="mt-3 flex items-center justify-between text-sm font-black text-slate-700">
              <span>{loadingPanel ? "Cargando..." : `${percentage}% completado`}</span>
              <span>{ownedCount}/{TOTAL_FIGUS_MUNDIAL}</span>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/figus/mi-album" className="rounded-2xl bg-[#0D1B2A] px-5 py-3 text-sm font-black text-white">Camino guiado</Link>
              <Link href="/figus/descubrir" className="rounded-2xl bg-[#22C55E] px-5 py-3 text-sm font-black text-white">Modo rápido</Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatCard tone="dark" value={TOTAL_FIGUS_MUNDIAL} label="figus del álbum" />
            <StatCard tone="blue" value={ownedCount} label="tenés" />
            <StatCard tone="red" value={missingCount} label="te faltan" />
            <StatCard tone="green" value={repeatedTotal} label="repetidas" helper={`${repeatedNumbers} números distintos`} />
          </div>
        </div>

        {!user ? (
          <div className="border-t border-slate-100 bg-amber-50 px-6 py-4 text-sm font-black text-amber-800 lg:px-8">
            Iniciá sesión para ver tus datos reales de álbum y repetidas.
          </div>
        ) : null}
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-200/70 lg:p-8">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-slate-400">Paso a paso</p>
              <h2 className="mt-1 text-3xl font-black text-[#0D1B2A]">Camino guiado</h2>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                Cargás álbum y repetidas, revisás el checkpoint y después ves usuarios cercanos en lista.
              </p>
            </div>
            <Link href="/figus/mi-album" className="rounded-2xl bg-[#0D1B2A] px-5 py-3 text-sm font-black text-white">
              Empezar
            </Link>
          </div>

          <div className="mt-6 space-y-3">
            {guidedSteps.map((step, index) => (
              <Link key={step.href} href={step.href} className="group grid grid-cols-[52px_1fr_auto] items-center gap-4 rounded-[2rem] bg-slate-50 p-4 ring-1 ring-slate-200 transition hover:-translate-y-1 hover:bg-sky-50 hover:shadow-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">{step.icon}</div>
                <div>
                  <p className="text-sm font-black uppercase tracking-widest text-slate-400">Paso {index + 1}</p>
                  <h3 className="text-lg font-black text-[#0D1B2A]">{step.title}</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{step.text}</p>
                </div>
                <span className="hidden rounded-2xl bg-white px-4 py-2 text-xs font-black text-slate-700 ring-1 ring-slate-200 md:inline-flex">Abrir</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-[2.5rem] bg-gradient-to-br from-emerald-500 to-sky-600 p-6 text-white shadow-xl lg:p-8">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-white/70">Modo rápido</p>
          <h2 className="mt-1 text-3xl font-black">Modo rápido tipo Tinder</h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-white/85">
            Entrás directo a tarjetas por distancia. Aceptás, guardás o descartás propuestas con swipes.
          </p>

          <div className="mt-6 rounded-[2rem] bg-white/15 p-5 ring-1 ring-white/20">
            <p className="text-sm font-black">Qué vas a ver:</p>
            <ul className="mt-3 space-y-2 text-sm font-semibold text-white/90">
              <li>• Cuántas figuritas recibís.</li>
              <li>• Cuántas entregás.</li>
              <li>• Compatibilidad y cercanía.</li>
              <li>• Si es intercambio justo o ayuda simple.</li>
            </ul>
          </div>

          <Link href="/figus/descubrir" className="mt-6 inline-flex w-full justify-center rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#16A34A] shadow-lg">
            Entrar al modo rápido
          </Link>
        </div>
      </section>

      <section className="mt-6 rounded-[2.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-200/70 lg:p-8">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-violet-500">Competencia local</p>
            <h2 className="text-3xl font-black text-[#0D1B2A]">Ranking vivo</h2>
          </div>
          <Link href="/figus/guiado" className="rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white">Ver usuarios cercanos</Link>
        </div>

        {!dashboard ? <p className="mt-3 text-sm font-semibold text-slate-500">Iniciá sesión para ver rankings y figus más buscadas.</p> : (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[2rem] bg-gradient-to-br from-violet-50 to-white p-5 ring-1 ring-violet-100">
              <h3 className="text-xl font-black text-violet-950">👑 Top álbumes</h3>
              <div className="mt-4 space-y-3 text-sm font-bold text-slate-600">
                {dashboard.progress.slice(0, 5).map((row: any, i: number) => (
                  <div key={row.user_id} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm">
                    <span>{i + 1}. {row.profiles?.display_name || row.profiles?.email || "Usuario"}</span>
                    <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-700">{row.completion_percentage ?? 0}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] bg-gradient-to-br from-red-50 to-white p-5 ring-1 ring-red-100">
              <h3 className="text-xl font-black text-red-950">🔥 Más buscadas</h3>
              <p className="mt-1 text-xs font-bold text-red-700">Las que todos quieren conseguir.</p>
              <div className="mt-4 flex flex-wrap gap-2">{dashboard.topWanted.map((x) => <span key={x.figu} className="rounded-full bg-white px-3 py-2 text-xs font-black shadow-sm ring-1 ring-red-100">#{x.figu} · {x.count}</span>)}</div>
            </div>

            <div className="rounded-[2rem] bg-gradient-to-br from-emerald-50 to-white p-5 ring-1 ring-emerald-100">
              <h3 className="text-xl font-black text-emerald-950">💎 Más ofrecidas</h3>
              <p className="mt-1 text-xs font-bold text-[#16A34A]">Las que más aparecen repetidas.</p>
              <div className="mt-4 flex flex-wrap gap-2">{dashboard.topOffered.map((x) => <span key={x.figu} className="rounded-full bg-white px-3 py-2 text-xs font-black shadow-sm ring-1 ring-emerald-100">#{x.figu} · {x.count}</span>)}</div>
            </div>
          </div>
        )}
      </section>
    </FiguShell>
  );
}
