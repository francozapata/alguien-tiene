import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isPaidPlan, MP_PLAN_CONFIG } from "@/lib/mercadopago";

async function fetchPayment(paymentId: string) {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) throw new Error("Falta MP_ACCESS_TOKEN.");

  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const payment = await response.json();
  if (!response.ok) throw new Error(payment?.message || "No se pudo consultar el pago.");
  return payment;
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
  const currentUntil = order.user_id
    ? await supabaseAdmin.from("profiles").select("premium_until").eq("id", order.user_id).single()
    : null;

  const currentMs = currentUntil?.data?.premium_until ? new Date(currentUntil.data.premium_until).getTime() : 0;
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const paymentId = String(
      body?.data?.id ||
      body?.id ||
      request.nextUrl.searchParams.get("data.id") ||
      request.nextUrl.searchParams.get("id") ||
      ""
    );

    if (!paymentId) {
      return NextResponse.json({ ok: true, ignored: "Sin payment id" });
    }

    const payment = await fetchPayment(paymentId);
    const result = await activatePayment(payment);

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("MP webhook error", error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Error webhook MP" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const paymentId = String(
      request.nextUrl.searchParams.get("data.id") ||
      request.nextUrl.searchParams.get("id") ||
      ""
    );

    if (!paymentId) {
      return NextResponse.json({ ok: true, ignored: "Sin payment id" });
    }

    const payment = await fetchPayment(paymentId);
    const result = await activatePayment(payment);

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("MP webhook GET error", error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Error webhook MP" }, { status: 500 });
  }
}
