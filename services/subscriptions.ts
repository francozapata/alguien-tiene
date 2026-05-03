import { User } from "firebase/auth";
import { supabase } from "@/lib/supabase";
import { getOrCreateProfile } from "@/services/profiles";

export type PlanType = "FREE" | "BASICO" | "PLUS" | "PREMIUM";
export type PaidPlanType = Exclude<PlanType, "FREE">;

type Unlimited = "Ilimitado";

export const PLAN_PRICES: Record<PlanType, {
  priceLabel: string;
  periodLabel: string;
  paymentEnvKey?: string;
}> = {
  FREE: { priceLabel: "$0", periodLabel: "gratis" },
  BASICO: { priceLabel: "A definir", periodLabel: "por semana", paymentEnvKey: "NEXT_PUBLIC_MP_LINK_BASICO" },
  PLUS: { priceLabel: "A definir", periodLabel: "por semana", paymentEnvKey: "NEXT_PUBLIC_MP_LINK_PLUS" },
  PREMIUM: { priceLabel: "A definir", periodLabel: "por semana", paymentEnvKey: "NEXT_PUBLIC_MP_LINK_PREMIUM" },
};

export function normalizePlanType(plan?: string | null): PlanType {
  if (plan === "BASICO") return "BASICO";
  if (plan === "PLUS") return "PLUS";
  if (plan === "PREMIUM") return "PREMIUM";
  // Compatibilidad con nombres anteriores, por si queda algún usuario viejo en DB.
  if (plan === "EXTRAS") return "BASICO";
  if (plan === "PRO_TOTAL") return "PREMIUM";
  return "FREE";
}

export function getPlanPrice(plan: PlanType) {
  return PLAN_PRICES[plan].priceLabel;
}

export function getPlanPeriod(plan: PlanType) {
  return PLAN_PRICES[plan].periodLabel;
}

export function getPlanPaymentUrl(plan: PlanType) {
  if (plan === "FREE") return "";
  const envKey = PLAN_PRICES[plan].paymentEnvKey;
  if (!envKey) return "";

  const envMap: Record<string, string | undefined> = {
    NEXT_PUBLIC_MP_LINK_BASICO: process.env.NEXT_PUBLIC_MP_LINK_BASICO,
    NEXT_PUBLIC_MP_LINK_PLUS: process.env.NEXT_PUBLIC_MP_LINK_PLUS,
    NEXT_PUBLIC_MP_LINK_PREMIUM: process.env.NEXT_PUBLIC_MP_LINK_PREMIUM,
  };

  return envMap[envKey] || "";
}

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
  const normalized = normalizePlanType(plan);
  if (normalized === "BASICO") return "Básico";
  if (normalized === "PLUS") return "Plus";
  if (normalized === "PREMIUM") return "Premium";
  return "Gratis";
}

export function isPlanActive(profile: any) {
  const planType = normalizePlanType(profile?.plan_type);
  if (planType === "FREE") return false;
  const until = profile?.premium_until ? new Date(profile.premium_until).getTime() : 0;
  return Boolean(until > Date.now());
}

export function getDaysLeft(until?: string | null) {
  if (!until) return 0;
  const diff = new Date(until).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export type BenefitKey =
  | "manualSearches"
  | "manualResults"
  | "manualContacts"
  | "radius"
  | "tinderCards"
  | "tinderLikes"
  | "undo"
  | "seeLikes"
  | "priority";

export type BenefitDetail = {
  key: BenefitKey;
  label: string;
  value: string;
  detail: string;
  remaining?: number | Unlimited;
};

export const PLAN_BENEFITS: Record<PlanType, {
  label: string;
  short: string;
  durationLabel: string;
  manualSearchesPerDay: number | Unlimited;
  manualProfilesPerSearch: number | Unlimited;
  manualContactsPerDay: number | Unlimited;
  tinderCardsPerDay: number | Unlimited;
  tinderLikesPerDay: number | Unlimited;
  undoPerDay: number | Unlimited;
  radiusKm: number | Unlimited;
  advancedFilters: boolean;
  seeLikes: boolean;
  priorityWeight: number;
  boosts: number;
  instantSearches: number;
  radarUses: number;
}> = {
  FREE: {
    label: "Gratis",
    short: "Para probar la app y conseguir intercambios cercanos con límites diarios.",
    durationLabel: "Gratis · límites diarios",
    manualSearchesPerDay: 5,
    manualProfilesPerSearch: 3,
    manualContactsPerDay: 1,
    tinderCardsPerDay: 10,
    tinderLikesPerDay: 3,
    undoPerDay: 0,
    radiusKm: 3,
    advancedFilters: false,
    seeLikes: false,
    priorityWeight: 0,
    boosts: 0,
    instantSearches: 0,
    radarUses: 0,
  },
  BASICO: {
    label: "Básico",
    short: "Para uso normal semanal con más búsquedas, más tarjetas y mejor radio.",
    durationLabel: "Plan semanal",
    manualSearchesPerDay: 20,
    manualProfilesPerSearch: 10,
    manualContactsPerDay: 5,
    tinderCardsPerDay: 40,
    tinderLikesPerDay: 15,
    undoPerDay: 1,
    radiusKm: 8,
    advancedFilters: true,
    seeLikes: false,
    priorityWeight: 5,
    boosts: 0,
    instantSearches: 0,
    radarUses: 0,
  },
  PLUS: {
    label: "Plus",
    short: "El punto fuerte: muchas más oportunidades, filtros avanzados y ver interesados.",
    durationLabel: "Plan semanal",
    manualSearchesPerDay: "Ilimitado",
    manualProfilesPerSearch: 30,
    manualContactsPerDay: 20,
    tinderCardsPerDay: 150,
    tinderLikesPerDay: 60,
    undoPerDay: 5,
    radiusKm: 20,
    advancedFilters: true,
    seeLikes: true,
    priorityWeight: 12,
    boosts: 0,
    instantSearches: 0,
    radarUses: 0,
  },
  PREMIUM: {
    label: "Premium",
    short: "Para usuarios intensivos: todo ilimitado, máximo alcance y prioridad.",
    durationLabel: "Plan semanal",
    manualSearchesPerDay: "Ilimitado",
    manualProfilesPerSearch: "Ilimitado",
    manualContactsPerDay: "Ilimitado",
    tinderCardsPerDay: "Ilimitado",
    tinderLikesPerDay: "Ilimitado",
    undoPerDay: "Ilimitado",
    radiusKm: 50,
    advancedFilters: true,
    seeLikes: true,
    priorityWeight: 25,
    boosts: 0,
    instantSearches: 0,
    radarUses: 0,
  },
};

export function getEffectivePlan(subscription?: SubscriptionState | null): PlanType {
  if (!subscription) return "FREE";
  const plan = normalizePlanType(subscription.plan_type);
  if (plan === "FREE") return "FREE";
  const active = subscription.premium_until ? new Date(subscription.premium_until).getTime() > Date.now() : false;
  return active ? plan : "FREE";
}

export function getPlanLimits(planOrSubscription?: PlanType | SubscriptionState | null) {
  const plan = typeof planOrSubscription === "string" ? normalizePlanType(planOrSubscription) : getEffectivePlan(planOrSubscription);
  return PLAN_BENEFITS[plan];
}

export function getBenefitDetails(subscription?: SubscriptionState | null): BenefitDetail[] {
  const plan = getEffectivePlan(subscription);
  const config = PLAN_BENEFITS[plan];

  return [
    {
      key: "manualSearches",
      label: "Búsquedas manuales",
      value: config.manualSearchesPerDay === "Ilimitado" ? "Ilimitadas" : `${config.manualSearchesPerDay}/día`,
      detail: "El modo simple muestra combinaciones reales 1x1 y deja ordenar por cercanía o cantidad.",
      remaining: config.manualSearchesPerDay,
    },
    {
      key: "manualResults",
      label: "Usuarios por búsqueda",
      value: config.manualProfilesPerSearch === "Ilimitado" ? "Ilimitados" : `${config.manualProfilesPerSearch}`,
      detail: "Cantidad máxima visible por búsqueda simple/manual.",
      remaining: config.manualProfilesPerSearch,
    },
    {
      key: "manualContacts",
      label: "Contactos diarios",
      value: config.manualContactsPerDay === "Ilimitado" ? "Ilimitados" : `${config.manualContactsPerDay}/día`,
      detail: "Cantidad de conversaciones nuevas recomendada para iniciar por día.",
      remaining: config.manualContactsPerDay,
    },
    {
      key: "radius",
      label: "Radio de búsqueda",
      value: config.radiusKm === "Ilimitado" ? "Ilimitado" : `${config.radiusKm} km`,
      detail: "Siempre se usa ubicación real del permiso, no ciudad/barrio escrito a mano.",
    },
    {
      key: "tinderCards",
      label: "Tarjetas Tinder",
      value: config.tinderCardsPerDay === "Ilimitado" ? "Ilimitadas" : `${config.tinderCardsPerDay}/día`,
      detail: "El modo rápido ordena automáticamente de mejor a peor oportunidad.",
      remaining: config.tinderCardsPerDay,
    },
    {
      key: "tinderLikes",
      label: "Me interesa",
      value: config.tinderLikesPerDay === "Ilimitado" ? "Ilimitados" : `${config.tinderLikesPerDay}/día`,
      detail: "Cantidad de intereses diarios disponibles en modo rápido.",
      remaining: config.tinderLikesPerDay,
    },
    {
      key: "undo",
      label: "Deshacer pase",
      value: config.undoPerDay === "Ilimitado" ? "Ilimitado" : `${config.undoPerDay}/día`,
      detail: config.undoPerDay === 0 ? "Disponible desde Básico." : "Permite recuperar una propuesta pasada por error.",
      remaining: config.undoPerDay,
    },
    {
      key: "seeLikes",
      label: "Ver interesados",
      value: config.seeLikes ? "Activo" : "Bloqueado",
      detail: config.seeLikes ? "Podés ver quién marcó interés por tus intercambios." : "Disponible desde Plus.",
    },
    {
      key: "priority",
      label: "Prioridad",
      value: config.priorityWeight > 0 ? "Activa" : "Normal",
      detail: config.priorityWeight > 0 ? "Tu perfil gana prioridad dentro del ranking inteligente." : "Ranking estándar por intercambio y cercanía.",
    },
  ];
}

export function getPlanExpirationText(subscription?: SubscriptionState | null) {
  const plan = getEffectivePlan(subscription);
  if (plan === "FREE") return "Modo gratis: se renueva diariamente con límites.";
  const days = getDaysLeft(subscription?.premium_until);
  return days > 0 ? `${getPlanLabel(plan)} semanal activo. Te quedan ${days} día${days === 1 ? "" : "s"}.` : "Beneficio vencido.";
}

export function normalizeSubscription(profile: any): SubscriptionState {
  const active = isPlanActive(profile);
  const planType = active ? normalizePlanType(profile?.plan_type) : "FREE";

  return {
    plan_type: planType,
    is_premium: active && planType !== "FREE",
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
  await ensureDailyBenefits(profile);
  const { data: refreshed } = await supabase.from("profiles").select("*").eq("id", profile.id).single();
  return { profile: refreshed ?? profile, subscription: normalizeSubscription(refreshed ?? profile) };
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
  const planType = normalizePlanType(input.planType);
  const days = planType === "FREE" ? 0 : Math.max(1, input.days || 7);
  const until = days > 0 ? new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString() : null;
  const config = PLAN_BENEFITS[planType];

  const payload: Record<string, unknown> = {
    plan_type: planType,
    is_premium: planType !== "FREE",
    premium_until: until,
    boosts_available: input.boosts ?? config.boosts,
    instant_searches_available: input.instantSearches ?? config.instantSearches,
    radar_uses_available: input.radarUses ?? config.radarUses,
    plan_granted_by_admin: planType !== "FREE",
    plan_notes: input.notes || (planType === "FREE" ? null : `Otorgado por admin: ${getPlanLabel(planType)} semanal`),
    plan_updated_at: now.toISOString(),
    free_usage_day: now.toISOString().slice(0, 10),
    free_swipes_used_today: 0,
    free_profiles_viewed_today: 0,
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

export async function renewDailyPlanBenefits(userId: string, planType: PlanType) {
  const config = PLAN_BENEFITS[normalizePlanType(planType)];

  const { error } = await supabase
    .from("profiles")
    .update({
      boosts_available: config.boosts,
      instant_searches_available: config.instantSearches,
      radar_uses_available: config.radarUses,
      free_swipes_used_today: 0,
      free_profiles_viewed_today: 0,
      free_usage_day: new Date().toISOString().slice(0, 10),
      plan_updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) throw new Error(error.message);
}

export async function ensureDailyBenefits(profile: any) {
  const today = new Date().toISOString().slice(0, 10);
  const usageDay = profile?.free_usage_day ? String(profile.free_usage_day).slice(0, 10) : "";
  if (usageDay === today) return;

  const subscription = normalizeSubscription(profile);
  const plan = getEffectivePlan(subscription);
  const config = PLAN_BENEFITS[plan];

  await supabase
    .from("profiles")
    .update({
      boosts_available: config.boosts,
      instant_searches_available: config.instantSearches,
      radar_uses_available: config.radarUses,
      free_swipes_used_today: 0,
      free_profiles_viewed_today: 0,
      free_usage_day: today,
      plan_updated_at: new Date().toISOString(),
    })
    .eq("id", profile.id);
}
