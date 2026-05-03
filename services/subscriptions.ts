import { User } from "firebase/auth";
import { supabase } from "@/lib/supabase";
import { getOrCreateProfile } from "@/services/profiles";

export type PlanType = "FREE" | "PREMIUM" | "EXTRAS" | "PRO_TOTAL";

export type SubscriptionState = {
  plan_type: PlanType;
  is_premium: boolean;
  premium_until: string | null;
  boosts_available: number;
  instant_searches_available: number;
  radar_uses_available: number;
  plan_granted_by_admin: boolean;
  plan_notes: string | null;
};

export function getPlanLabel(plan?: string | null) {
  if (plan === "PREMIUM") return "Premium";
  if (plan === "EXTRAS") return "Extras";
  if (plan === "PRO_TOTAL") return "Pro Total";
  return "Gratis";
}

export function isPlanActive(profile: any) {
  const until = profile?.premium_until ? new Date(profile.premium_until).getTime() : 0;
  return Boolean(profile?.is_premium && until > Date.now());
}

export function getDaysLeft(until?: string | null) {
  if (!until) return 0;
  const diff = new Date(until).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}


export type BenefitKey = "swipes" | "profiles" | "radius" | "smartMatches" | "seeLikes" | "boosts" | "instantSearches" | "radar";

export type BenefitDetail = {
  key: BenefitKey;
  label: string;
  value: string;
  detail: string;
  remaining?: number | "Ilimitado";
};

export const PLAN_BENEFITS: Record<PlanType, {
  label: string;
  short: string;
  durationLabel: string;
  swipesPerDay: number | "Ilimitado";
  profilesPerDay: number | "Ilimitado";
  radiusKm: number | "Ciudad completa";
  smartMatches: boolean;
  seeLikes: boolean;
  priority: boolean;
  boosts: number;
  instantSearches: number;
  radarUses: number;
}> = {
  FREE: {
    label: "Gratis",
    short: "Ideal para probar la app sin pagar.",
    durationLabel: "Se renueva cada día",
    swipesPerDay: 10,
    profilesPerDay: 10,
    radiusKm: 5,
    smartMatches: false,
    seeLikes: false,
    priority: false,
    boosts: 0,
    instantSearches: 0,
    radarUses: 0,
  },
  PREMIUM: {
    label: "Premium",
    short: "Para buscar sin límites y aparecer mejor.",
    durationLabel: "Beneficios por tiempo contratado",
    swipesPerDay: "Ilimitado",
    profilesPerDay: "Ilimitado",
    radiusKm: 50,
    smartMatches: true,
    seeLikes: true,
    priority: true,
    boosts: 0,
    instantSearches: 0,
    radarUses: 0,
  },
  EXTRAS: {
    label: "Extras",
    short: "Para acelerar resultados puntuales.",
    durationLabel: "Extras disponibles hasta agotarse",
    swipesPerDay: 10,
    profilesPerDay: 10,
    radiusKm: 5,
    smartMatches: false,
    seeLikes: false,
    priority: false,
    boosts: 3,
    instantSearches: 5,
    radarUses: 3,
  },
  PRO_TOTAL: {
    label: "Pro Total",
    short: "Premium + extras incluidos.",
    durationLabel: "Máxima ventaja por tiempo contratado",
    swipesPerDay: "Ilimitado",
    profilesPerDay: "Ilimitado",
    radiusKm: "Ciudad completa",
    smartMatches: true,
    seeLikes: true,
    priority: true,
    boosts: 10,
    instantSearches: 999,
    radarUses: 999,
  },
};

export function getEffectivePlan(subscription?: SubscriptionState | null): PlanType {
  if (!subscription) return "FREE";
  if (subscription.plan_type === "PRO_TOTAL") return "PRO_TOTAL";
  if (subscription.is_premium && subscription.plan_type === "PREMIUM") return "PREMIUM";
  if (subscription.plan_type === "EXTRAS") return "EXTRAS";
  return "FREE";
}

export function getBenefitDetails(subscription?: SubscriptionState | null): BenefitDetail[] {
  const plan = getEffectivePlan(subscription);
  const config = PLAN_BENEFITS[plan];

  return [
    {
      key: "swipes",
      label: "Swipes diarios",
      value: config.swipesPerDay === "Ilimitado" ? "Ilimitado" : `${config.swipesPerDay}/día`,
      detail: config.swipesPerDay === "Ilimitado" ? "Podés usar el modo rápido sin límite diario." : `Tenés ${config.swipesPerDay} swipes gratis por día.`,
      remaining: config.swipesPerDay,
    },
    {
      key: "profiles",
      label: "Perfiles manuales",
      value: config.profilesPerDay === "Ilimitado" ? "Ilimitado" : `${config.profilesPerDay}/día`,
      detail: config.profilesPerDay === "Ilimitado" ? "Podés revisar todos los usuarios cercanos disponibles." : `Podés ver ${config.profilesPerDay} perfiles por día en búsqueda manual.`,
      remaining: config.profilesPerDay,
    },
    {
      key: "radius",
      label: "Radio de búsqueda",
      value: typeof config.radiusKm === "number" ? `${config.radiusKm} km` : config.radiusKm,
      detail: config.priority ? "Se priorizan usuarios cercanos y mejores oportunidades." : "Orden básico por cercanía disponible.",
    },
    {
      key: "smartMatches",
      label: "Matches inteligentes",
      value: config.smartMatches ? "Activo" : "Básico",
      detail: config.smartMatches ? "Se priorizan personas que más te sirven para completar el álbum." : "Ves compatibilidades básicas según tus figus.",
    },
    {
      key: "seeLikes",
      label: "Ver likes",
      value: config.seeLikes ? "Activo" : "Bloqueado",
      detail: config.seeLikes ? "Podés ver quién quiere intercambiar con vos." : "Disponible con Premium o Pro Total.",
    },
    {
      key: "boosts",
      label: "Boosts",
      value: String(subscription?.boosts_available ?? config.boosts),
      detail: "Te da más visibilidad temporal en cercanos y modo rápido.",
      remaining: subscription?.boosts_available ?? config.boosts,
    },
    {
      key: "instantSearches",
      label: "Búsquedas instantáneas",
      value: String(subscription?.instant_searches_available ?? config.instantSearches),
      detail: "Fuerza una búsqueda nueva de oportunidades en el momento.",
      remaining: subscription?.instant_searches_available ?? config.instantSearches,
    },
    {
      key: "radar",
      label: "Radar cercano",
      value: String(subscription?.radar_uses_available ?? config.radarUses),
      detail: "Detecta oportunidades cercanas con más prioridad.",
      remaining: subscription?.radar_uses_available ?? config.radarUses,
    },
  ];
}

export function getPlanExpirationText(subscription?: SubscriptionState | null) {
  const plan = getEffectivePlan(subscription);
  if (plan === "FREE") return "Modo gratis: se renueva diariamente con límites.";
  const days = getDaysLeft(subscription?.premium_until);
  if (plan === "EXTRAS") return "Extras activos hasta agotarse o hasta que el admin los quite.";
  return days > 0 ? `Te quedan ${days} día${days === 1 ? "" : "s"} de beneficios.` : "Beneficio vencido.";
}

export function normalizeSubscription(profile: any): SubscriptionState {
  const active = isPlanActive(profile);
  return {
    plan_type: active ? (profile.plan_type || "PREMIUM") : "FREE",
    is_premium: active,
    premium_until: active ? profile.premium_until : null,
    boosts_available: Number(profile.boosts_available ?? 0),
    instant_searches_available: Number(profile.instant_searches_available ?? 0),
    radar_uses_available: Number(profile.radar_uses_available ?? 0),
    plan_granted_by_admin: Boolean(profile.plan_granted_by_admin),
    plan_notes: profile.plan_notes ?? null,
  };
}

export async function getMySubscription(firebaseUser: User) {
  const profile = await getOrCreateProfile(firebaseUser);
  return { profile, subscription: normalizeSubscription(profile) };
}

export async function grantUserSubscription(input: {
  userId: string;
  planType: PlanType;
  days: number;
  boosts?: number;
  instantSearches?: number;
  radarUses?: number;
  notes?: string;
}) {
  const now = new Date();
  const until = new Date(now.getTime() + Math.max(1, input.days) * 24 * 60 * 60 * 1000).toISOString();

  const planType = input.planType;
  const payload: Record<string, unknown> = {
    plan_type: planType,
    is_premium: planType === "PREMIUM" || planType === "PRO_TOTAL",
    premium_until: planType === "PREMIUM" || planType === "PRO_TOTAL" ? until : null,
    boosts_available: input.boosts ?? (planType === "EXTRAS" ? 3 : planType === "PRO_TOTAL" ? 10 : 0),
    instant_searches_available: input.instantSearches ?? (planType === "EXTRAS" ? 5 : planType === "PRO_TOTAL" ? 999 : 0),
    radar_uses_available: input.radarUses ?? (planType === "EXTRAS" ? 3 : planType === "PRO_TOTAL" ? 999 : 0),
    plan_granted_by_admin: true,
    plan_notes: input.notes || `Otorgado por admin: ${planType}`,
    plan_updated_at: now.toISOString(),
  };

  const { error } = await supabase.from("profiles").update(payload).eq("id", input.userId);
  if (error) throw new Error(error.message);
}

export async function clearUserSubscription(userId: string) {
  const { error } = await supabase.from("profiles").update({
    plan_type: "FREE",
    is_premium: false,
    premium_until: null,
    boosts_available: 0,
    instant_searches_available: 0,
    radar_uses_available: 0,
    plan_granted_by_admin: false,
    plan_notes: null,
    plan_updated_at: new Date().toISOString(),
  }).eq("id", userId);

  if (error) throw new Error(error.message);
}
