import { NextRequest, NextResponse } from "next/server";
import { activateApprovedPayment, activateFromMerchantOrder, fetchPayment } from "@/lib/server/mpActivate";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const paymentId = String(body.payment_id || body.collection_id || "");
    const merchantOrderId = String(body.merchant_order_id || "");
    const status = String(body.status || body.collection_status || "");

    if (status && status !== "approved") {
      return NextResponse.json({ ok: true, activated: false, reason: `Estado recibido: ${status}` });
    }

    if (paymentId) {
      try {
        const payment = await fetchPayment(paymentId);
        return NextResponse.json({ ok: true, payment_id: paymentId, ...(await activateApprovedPayment(payment)) });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        if (!message.toLowerCase().includes("not found")) {
          throw error;
        }

        if (merchantOrderId) {
          return NextResponse.json({ ok: true, merchant_order_id: merchantOrderId, ...(await activateFromMerchantOrder(merchantOrderId)) });
        }

        return NextResponse.json({
          ok: false,
          activated: false,
          error: "Mercado Pago respondió Payment not found. Revisá que MP_ACCESS_TOKEN sea de producción y de la misma cuenta que cobró el pago.",
          payment_id: paymentId,
        }, { status: 409 });
      }
    }

    if (merchantOrderId) {
      return NextResponse.json({ ok: true, merchant_order_id: merchantOrderId, ...(await activateFromMerchantOrder(merchantOrderId)) });
    }

    return NextResponse.json({ ok: false, error: "Falta payment_id o merchant_order_id." }, { status: 400 });
  } catch (error) {
    console.error("MP confirm error", error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Error confirmando pago." }, { status: 500 });
  }
}
