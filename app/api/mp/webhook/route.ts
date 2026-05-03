import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isPaidPlan, MP_PLAN_CONFIG } from "@/lib/mercadopago";

function getAccessToken() {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) throw new Error("Falta MP_ACCESS_TOKEN.");
  return accessToken;
}

async function mpGet(path: string) {
  const response = await fetch(`https://api.mercadopago.com${path}`, {
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
    },
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || data?.error || `Mercado Pago error ${response.status}`);
  }

  return data;
}

async function fetchPayment(paymentId: string) {
  return mpGet(`/v1/payments/${paymentId}`);
}

async function fetchMerchantOrder(orderId: string) {
  return mpGet(`/merchant_orders/${orderId}`);
}

async function activatePayment(payment: any) {
  const status = payment?.status;
  const externalReference = payment?.external_reference;
  const paymentId = String(payment?.id || "");

  if (!externalReference) return { activated: false, reason: "Sin external_reference" };

  const { data: order } = await supabaseAdmin
    .from("subscription_orders")
    .select("*")
    .eq("external_reference", externalReference)
    .maybeSingle();

  if (!order) return { activated: false, reason: "Orden no encontrada" };

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
    return { activated: false, reason: "Plan inválido" };
  }

  if (order.activated_at) {
    return { activated: false, reason: "Ya estaba activado" };
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
    premium_until: plan === "EXTRAS" ? null : premiumUntil,
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
      expires_at: plan === "EXTRAS" ? new Date(Date.now() + config.days * 24 * 60 * 60 * 1000).toISOString() : premiumUntil,
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

function getEventId(request: NextRequest, body: any) {
  return String(
    body?.data?.id ||
    body?.id ||
    request.nextUrl.searchParams.get("data.id") ||
    request.nextUrl.searchParams.get("id") ||
    ""
  );
}

function getEventType(request: NextRequest, body: any) {
  return String(
    body?.type ||
    body?.topic ||
    request.nextUrl.searchParams.get("type") ||
    request.nextUrl.searchParams.get("topic") ||
    ""
  );
}

async function handleMercadoPagoEvent(request: NextRequest, body: any = {}) {
  const eventId = getEventId(request, body);
  const eventType = getEventType(request, body);

  if (!eventId) {
    return { ok: true, ignored: "Sin id de evento" };
  }

  // Caso 1: Mercado Pago manda payment.
  if (eventType === "payment" || eventType === "payments" || eventType === "") {
    try {
      const payment = await fetchPayment(eventId);
      return { ok: true, eventType: eventType || "payment", payment_id: eventId, ...(await activatePayment(payment)) };
    } catch (error) {
      // Si no era realmente un payment id, probamos merchant_order antes de fallar.
      const message = error instanceof Error ? error.message : String(error);

      if (!message.toLowerCase().includes("not found")) {
        throw error;
      }
    }
  }

  // Caso 2: Mercado Pago manda merchant_order.
  if (eventType === "merchant_order" || eventType === "merchant_orders" || eventType === "") {
    const merchantOrder = await fetchMerchantOrder(eventId);
    const payments = Array.isArray(merchantOrder?.payments) ? merchantOrder.payments : [];
    const approved = payments.find((p: any) => p?.status === "approved") || payments[0];

    if (!approved?.id) {
      return { ok: true, eventType: "merchant_order", ignored: "Merchant order sin pagos" };
    }

    const payment = await fetchPayment(String(approved.id));
    return { ok: true, eventType: "merchant_order", merchant_order_id: eventId, payment_id: String(approved.id), ...(await activatePayment(payment)) };
  }

  return { ok: true, ignored: `Evento no soportado: ${eventType}` };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const result = await handleMercadoPagoEvent(request, body);
    return NextResponse.json(result);
  } catch (error) {
    console.error("MP webhook error", error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Error webhook MP" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const result = await handleMercadoPagoEvent(request, {});
    return NextResponse.json(result);
  } catch (error) {
    console.error("MP webhook GET error", error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Error webhook MP" }, { status: 500 });
  }
}
