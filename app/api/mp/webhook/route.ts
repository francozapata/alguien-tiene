import { NextRequest, NextResponse } from "next/server";
import { activateApprovedPayment, activateFromMerchantOrder, fetchPayment } from "@/lib/server/mpActivate";

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

  if (eventType === "merchant_order" || eventType === "merchant_orders") {
    return { ok: true, eventType, merchant_order_id: eventId, ...(await activateFromMerchantOrder(eventId)) };
  }

  if (eventType === "payment" || eventType === "payments" || eventType === "") {
    try {
      const payment = await fetchPayment(eventId);
      return { ok: true, eventType: eventType || "payment", payment_id: eventId, ...(await activateApprovedPayment(payment)) };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (!message.toLowerCase().includes("not found")) {
        throw error;
      }

      return { ok: true, eventType: "payment_or_merchant_order_fallback", merchant_order_id: eventId, ...(await activateFromMerchantOrder(eventId)) };
    }
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
