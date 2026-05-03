import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isPaidPlan, MP_PLAN_CONFIG } from "@/lib/mercadopago";

function getAccessToken() {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) throw new Error("Falta MP_ACCESS_TOKEN.");
  return accessToken;
}

export async function mpGet(path: string) {
  const response = await fetch(`https://api.mercadopago.com${path}`, {
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
    },
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || data?.error || `Mercado Pago error ${response.status}`;
    throw new Error(message);
  }

  return data;
}

export async function fetchPayment(paymentId: string) {
  return mpGet(`/v1/payments/${paymentId}`);
}

export async function fetchMerchantOrder(orderId: string) {
  return mpGet(`/merchant_orders/${orderId}`);
}

export async function activateApprovedPayment(payment: any) {
  const status = payment?.status;
  const externalReference = payment?.external_reference;
  const paymentId = String(payment?.id || "");

  if (!externalReference) return { activated: false, reason: "El pago no trajo external_reference." };

  const { data: order } = await supabaseAdmin
    .from("subscription_orders")
    .select("*")
    .eq("external_reference", externalReference)
    .maybeSingle();

  if (!order) return { activated: false, reason: "No se encontró orden local para ese pago." };

  const plan = String(order.plan_type || "").toUpperCase();

  await supabaseAdmin
    .from("subscription_orders")
    .update({
      status: status === "approved" ? "APPROVED" : String(status || "UNKNOWN").toUpperCase(),
      mp_payment_id: paymentId,
      payer_email: payment?.payer?.email || null,
      raw_payment: payment,
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  if (status !== "approved") {
    return { activated: false, reason: `Pago no aprobado: ${status}` };
  }

  if (!isPaidPlan(plan)) {
    return { activated: false, reason: "Plan inválido." };
  }

  if (order.activated_at) {
    return { activated: true, alreadyActivated: true, plan };
  }

  const config = MP_PLAN_CONFIG[plan];
  const now = new Date();

  const { data: currentProfile } = await supabaseAdmin
    .from("profiles")
    .select("premium_until")
    .eq("id", order.user_id)
    .single();

  const currentMs = currentProfile?.premium_until ? new Date(currentProfile.premium_until).getTime() : 0;
  const baseTime = plan === "EXTRAS" ? now.getTime() : Math.max(Date.now(), currentMs || 0);
  const premiumUntil = new Date(baseTime + config.days * 24 * 60 * 60 * 1000).toISOString();

  const payload: Record<string, unknown> = {
    plan_type: plan,
    is_premium: plan === "PREMIUM" || plan === "PRO_TOTAL",
    premium_until: premiumUntil,
    boosts_available: config.boosts,
    instant_searches_available: config.instantSearches,
    radar_uses_available: config.radarUses,
    plan_granted_by_admin: false,
    plan_notes: `Pago Mercado Pago aprobado: ${paymentId}`,
    plan_updated_at: now.toISOString(),
    free_usage_day: now.toISOString().slice(0, 10),
    free_swipes_used_today: 0,
    free_profiles_viewed_today: 0,
  };

  const { error: updateError } = await supabaseAdmin
    .from("profiles")
    .update(payload)
    .eq("id", order.user_id);

  if (updateError) throw new Error(updateError.message);

  await supabaseAdmin
    .from("subscription_orders")
    .update({
      activated_at: new Date().toISOString(),
      expires_at: premiumUntil,
      status: "ACTIVATED",
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  await supabaseAdmin.from("subscription_events").insert({
    user_id: order.user_id,
    plan_type: plan,
    event_type: "MP_PAYMENT_APPROVED",
    notes: `Pago ${paymentId} aprobado y plan activado.`,
    metadata: {
      order_id: order.id,
      payment_id: paymentId,
      external_reference: externalReference,
    },
  });

  return { activated: true, plan };
}

export async function activateFromMerchantOrder(merchantOrderId: string) {
  const merchantOrder = await fetchMerchantOrder(merchantOrderId);
  const payments = Array.isArray(merchantOrder?.payments) ? merchantOrder.payments : [];
  const approved = payments.find((p: any) => p?.status === "approved") || payments[0];

  if (!approved?.id) {
    return { activated: false, reason: "Merchant order sin pagos." };
  }

  const payment = await fetchPayment(String(approved.id));
  return activateApprovedPayment(payment);
}
