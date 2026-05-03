import { PaidPlanType, PLAN_BENEFITS } from "@/services/subscriptions";

export const MP_PLAN_CONFIG: Record<PaidPlanType, {
  title: string;
  unitPrice: number;
  days: number;
  boosts: number;
  instantSearches: number;
  radarUses: number;
}> = {
  BASICO: {
    title: "Básico semanal - Alguien Tiene",
    unitPrice: Number(process.env.MP_PRICE_BASICO || 0),
    days: 7,
    boosts: PLAN_BENEFITS.BASICO.boosts,
    instantSearches: PLAN_BENEFITS.BASICO.instantSearches,
    radarUses: PLAN_BENEFITS.BASICO.radarUses,
  },
  PLUS: {
    title: "Plus semanal - Alguien Tiene",
    unitPrice: Number(process.env.MP_PRICE_PLUS || 0),
    days: 7,
    boosts: PLAN_BENEFITS.PLUS.boosts,
    instantSearches: PLAN_BENEFITS.PLUS.instantSearches,
    radarUses: PLAN_BENEFITS.PLUS.radarUses,
  },
  PREMIUM: {
    title: "Premium semanal - Alguien Tiene",
    unitPrice: Number(process.env.MP_PRICE_PREMIUM || 0),
    days: 7,
    boosts: PLAN_BENEFITS.PREMIUM.boosts,
    instantSearches: PLAN_BENEFITS.PREMIUM.instantSearches,
    radarUses: PLAN_BENEFITS.PREMIUM.radarUses,
  },
};

export function isPaidPlan(plan: string): plan is PaidPlanType {
  return plan === "BASICO" || plan === "PLUS" || plan === "PREMIUM";
}

export function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` ||
    process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}` ||
    "http://localhost:3000"
  );
}
