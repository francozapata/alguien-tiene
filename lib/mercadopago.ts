import { PlanType, PLAN_BENEFITS } from "@/services/subscriptions";

export const MP_PLAN_CONFIG: Record<Exclude<PlanType, "FREE">, {
  title: string;
  unitPrice: number;
  days: number;
  boosts: number;
  instantSearches: number;
  radarUses: number;
}> = {
  PREMIUM: {
    title: "Premium semanal - Alguien Tiene",
    unitPrice: 2000,
    days: 7,
    boosts: PLAN_BENEFITS.PREMIUM.boosts,
    instantSearches: PLAN_BENEFITS.PREMIUM.instantSearches,
    radarUses: PLAN_BENEFITS.PREMIUM.radarUses,
  },
  EXTRAS: {
    title: "Extras semanal - Alguien Tiene",
    unitPrice: 1500,
    days: 7,
    boosts: PLAN_BENEFITS.EXTRAS.boosts,
    instantSearches: PLAN_BENEFITS.EXTRAS.instantSearches,
    radarUses: PLAN_BENEFITS.EXTRAS.radarUses,
  },
  PRO_TOTAL: {
    title: "Pro Total semanal - Alguien Tiene",
    unitPrice: 3000,
    days: 7,
    boosts: PLAN_BENEFITS.PRO_TOTAL.boosts,
    instantSearches: PLAN_BENEFITS.PRO_TOTAL.instantSearches,
    radarUses: PLAN_BENEFITS.PRO_TOTAL.radarUses,
  },
};

export function isPaidPlan(plan: string): plan is Exclude<PlanType, "FREE"> {
  return plan === "PREMIUM" || plan === "EXTRAS" || plan === "PRO_TOTAL";
}

export function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` ||
    process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}` ||
    "http://localhost:3000"
  );
}
