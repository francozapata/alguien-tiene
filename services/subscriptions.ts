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
