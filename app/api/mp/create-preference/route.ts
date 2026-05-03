import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAppUrl, isPaidPlan, MP_PLAN_CONFIG } from "@/lib/mercadopago";

export async function POST(request: NextRequest) {
  try {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json({ error: "Falta configurar MP_ACCESS_TOKEN en Vercel." }, { status: 500 });
    }

    const body = await request.json();
    const plan = String(body.plan || "").toUpperCase();
    const userId = String(body.userId || "");

    if (!isPaidPlan(plan)) {
      return NextResponse.json({ error: "Plan inválido." }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: "Falta userId." }, { status: 400 });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id,email,display_name")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
    }

    const config = MP_PLAN_CONFIG[plan];
    const appUrl = getAppUrl();
    const externalReference = `figus:${profile.id}:${plan}:${Date.now()}`;

    const { data: order, error: orderError } = await supabaseAdmin
      .from("subscription_orders")
      .insert({
        user_id: profile.id,
        plan_type: plan,
        amount: config.unitPrice,
        currency: "ARS",
        status: "CREATED",
        external_reference: externalReference,
        metadata: {
          source: "checkout_pro",
          plan,
          days: config.days,
        },
      })
      .select("id")
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: orderError?.message || "No se pudo crear la orden." }, { status: 500 });
    }

    const preferenceBody = {
      items: [
        {
          id: plan,
          title: config.title,
          quantity: 1,
          currency_id: "ARS",
          unit_price: config.unitPrice,
        },
      ],
      payer: {
        email: profile.email || undefined,
        name: profile.display_name || undefined,
      },
      external_reference: externalReference,
      metadata: {
        order_id: order.id,
        user_id: profile.id,
        plan_type: plan,
      },
      back_urls: {
        success: `${appUrl}/figus/pago/success`,
        failure: `${appUrl}/figus/pago/failure`,
        pending: `${appUrl}/figus/pago/pending`,
      },
      auto_return: "approved",
      notification_url: `${appUrl}/api/mp/webhook`,
      statement_descriptor: "ALGUIEN TIENE",
    };

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preferenceBody),
    });

    const preference = await mpResponse.json();

    if (!mpResponse.ok) {
      await supabaseAdmin.from("subscription_orders").update({
        status: "MP_ERROR",
        metadata: { preference_error: preference },
      }).eq("id", order.id);

      return NextResponse.json({ error: preference?.message || "Mercado Pago rechazó la preferencia.", detail: preference }, { status: 500 });
    }

    await supabaseAdmin.from("subscription_orders").update({
      mp_preference_id: preference.id,
      status: "PREFERENCE_CREATED",
      init_point: preference.init_point,
      sandbox_init_point: preference.sandbox_init_point,
    }).eq("id", order.id);

    return NextResponse.json({
      init_point: preference.init_point,
      sandbox_init_point: preference.sandbox_init_point,
      preference_id: preference.id,
      order_id: order.id,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error creando preferencia." }, { status: 500 });
  }
}
