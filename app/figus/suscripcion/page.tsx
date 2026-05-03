"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { FiguShell } from "@/components/figus/FiguShell";
import { getBenefitDetails, getMySubscription, getPlanExpirationText, getPlanLabel, getPlanPeriod, getPlanPrice, PLAN_BENEFITS, PlanType, SubscriptionState } from "@/services/subscriptions";

type PlanCardProps = {
  plan: PlanType;
  title: string;
  icon: string;
  helper: string;
  userId?: string;
  dark?: boolean;
};

function PlanCard({ plan, title, icon, helper, userId, dark = false }: PlanCardProps) {
  const [paying, setPaying] = useState(false);

  async function startPayment() {
    if (!userId) {
      alert("Primero iniciá sesión con Google.");
      return;
    }

    setPaying(true);

    try {
      const response = await fetch("/api/mp/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "No se pudo iniciar el pago.");
      }

      const url = data.init_point || data.sandbox_init_point;
      if (!url) throw new Error("Mercado Pago no devolvió link de pago.");

      window.location.href = url;
    } catch (error) {
      alert(error instanceof Error ? error.message : "No se pudo iniciar el pago.");
    } finally {
      setPaying(false);
    }
  }

  const fakeSubscription = {
    plan_type: plan,
    is_premium: plan === "PREMIUM" || plan === "PRO_TOTAL",
    premium_until: plan === "FREE" || plan === "EXTRAS" ? null : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    boosts_available: PLAN_BENEFITS[plan].boosts,
    instant_searches_available: PLAN_BENEFITS[plan].instantSearches,
    radar_uses_available: PLAN_BENEFITS[plan].radarUses,
    plan_granted_by_admin: false,
    plan_notes: null,
  };

  return (
    <article className={`rounded-[2.5rem] p-6 shadow-sm ring-1 ${dark ? "bg-[#0D1B2A] text-white ring-[#0D1B2A]" : "bg-white text-[#0D1B2A] ring-slate-200"}`}>
      <p className="text-4xl">{icon}</p>
      <h2 className="mt-3 text-3xl font-black">{title}</h2>
      <p className={`mt-2 text-sm font-semibold ${dark ? "text-white/70" : "text-slate-500"}`}>{helper}</p>
      <p className={`mt-5 text-4xl font-black ${dark ? "text-[#22C55E]" : "text-[#16A34A]"}`}>{getPlanPrice(plan)}</p>
      <p className={`mt-1 text-xs font-black uppercase tracking-widest ${dark ? "text-white/50" : "text-slate-400"}`}>{getPlanPeriod(plan)}</p>
      <p className={`mt-2 text-xs font-bold ${dark ? "text-white/50" : "text-slate-400"}`}>{PLAN_BENEFITS[plan].durationLabel}</p>

      <div className="mt-5 space-y-3">
        {getBenefitDetails(fakeSubscription).map((benefit) => (
          <div key={benefit.key} className={`rounded-2xl p-3 ring-1 ${dark ? "bg-white/10 ring-white/10" : "bg-slate-50 ring-slate-200"}`}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-black">{benefit.label}</p>
              <span className={`rounded-full px-2 py-1 text-xs font-black ${dark ? "bg-white/15 text-white" : "bg-white text-[#2563EB] ring-1 ring-slate-200"}`}>{benefit.value}</span>
            </div>
            <p className={`mt-1 text-xs font-semibold leading-5 ${dark ? "text-white/70" : "text-slate-500"}`}>{benefit.detail}</p>
          </div>
        ))}
      </div>

      {plan === "FREE" ? (
        <button type="button" className={`mt-6 w-full rounded-2xl px-5 py-4 text-sm font-black ${dark ? "bg-[#22C55E] text-white" : "bg-[#0D1B2A] text-white"}`}>
          Plan actual gratis
        </button>
      ) : (
        <button
          type="button"
          disabled={paying}
          onClick={startPayment}
          className={`mt-6 w-full rounded-2xl px-5 py-4 text-sm font-black disabled:opacity-60 ${dark ? "bg-[#22C55E] text-white" : "bg-[#0D1B2A] text-white"}`}
        >
          {paying ? "Abriendo Mercado Pago..." : `Pagar ${getPlanPrice(plan)}`}
        </button>
      )}
    </article>
  );
}

export default function SuscripcionPage() {
  const { user, loading } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionState | null>(null);
  const [profileId, setProfileId] = useState("");

  useEffect(() => {
    async function load() {
      if (!user) return;
      const data = await getMySubscription(user);
      setProfileId(data.profile.id);
      setSubscription(data.subscription);
    }
    load();
  }, [user]);

  if (loading) return <FiguShell><div className="rounded-[2rem] bg-white p-8">Cargando...</div></FiguShell>;

  return (
    <FiguShell>
      <div className="mb-5 flex items-center justify-between">
        <Link href="/figus" className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm ring-1 ring-slate-200">← Home Figus</Link>
      </div>

      <section className="rounded-[2.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
        <p className="text-sm font-black uppercase tracking-[0.25em] text-[#2563EB]">Suscribite</p>
        <h1 className="mt-2 text-5xl font-black text-[#0D1B2A]">Conseguí figus más rápido</h1>
        <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
          La app sigue funcionando gratis. La suscripción te da más alcance, más velocidad y prioridad para encontrar intercambios.
        </p>

        {user && subscription ? (
          <div className="mt-6 rounded-[2rem] bg-emerald-50 p-5 ring-1 ring-emerald-100">
            <h2 className="text-xl font-black text-emerald-900">Tu estado actual: {getPlanLabel(subscription.plan_type)}</h2>
            <p className="mt-1 text-sm font-bold text-emerald-700">{getPlanExpirationText(subscription)}</p>
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {getBenefitDetails(subscription).map((benefit) => (
                <div key={benefit.key} className="rounded-2xl bg-white/70 p-3 text-xs font-bold text-slate-600 ring-1 ring-emerald-100">
                  <span className="font-black text-emerald-900">{benefit.label}:</span> {benefit.value}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-4">
        <PlanCard
          userId={profileId}
          plan="FREE"
          icon="🆓"
          title="Gratis"
          helper="Para probar y usar la app con límites diarios."
        />

        <PlanCard
          userId={profileId}
          plan="PREMIUM"
          icon="💎"
          title="Premium"
          helper="Para quienes quieren buscar sin límites."
        />

        <PlanCard
          userId={profileId}
          plan="EXTRAS"
          icon="⚡"
          title="Extras"
          helper="Compras rápidas para acelerar resultados."
        />

        <PlanCard
          userId={profileId}
          plan="PRO_TOTAL"
          icon="🏆"
          title="Pro Total"
          helper="Premium + extras incluidos."
          dark
        />
      </section>

      <section className="mt-6 rounded-[2.5rem] bg-[#0D1B2A] p-6 text-white shadow-xl">
        <h2 className="text-3xl font-black">Cuándo conviene suscribirse</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-3xl bg-white/10 p-4 ring-1 ring-white/10">
            <p className="text-2xl">🔥</p>
            <h3 className="mt-2 font-black">Te quedaste sin swipes</h3>
            <p className="mt-1 text-sm text-white/70">Premium libera el uso completo.</p>
          </div>
          <div className="rounded-3xl bg-white/10 p-4 ring-1 ring-white/10">
            <p className="text-2xl">📍</p>
            <h3 className="mt-2 font-black">Querés ampliar radio</h3>
            <p className="mt-1 text-sm text-white/70">Encontrá usuarios fuera de tu zona inmediata.</p>
          </div>
          <div className="rounded-3xl bg-white/10 p-4 ring-1 ring-white/10">
            <p className="text-2xl">👀</p>
            <h3 className="mt-2 font-black">Querés ver likes</h3>
            <p className="mt-1 text-sm text-white/70">Sabé quién quiere intercambiar con vos.</p>
          </div>
        </div>
      </section>
    </FiguShell>
  );
}
