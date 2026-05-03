"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FiguShell } from "@/components/figus/FiguShell";

function PagoSuccessContent() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<"checking" | "activated" | "already" | "pending" | "error">("checking");
  const [message, setMessage] = useState("Estamos confirmando tu pago con Mercado Pago...");

  useEffect(() => {
    async function confirmPayment() {
      const payload = {
        payment_id: searchParams.get("payment_id"),
        collection_id: searchParams.get("collection_id"),
        merchant_order_id: searchParams.get("merchant_order_id"),
        status: searchParams.get("status"),
        collection_status: searchParams.get("collection_status"),
        external_reference: searchParams.get("external_reference"),
      };

      try {
        const response = await fetch("/api/mp/confirm-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok || data.ok === false) {
          setState("error");
          setMessage(data.error || "No pudimos confirmar el pago automáticamente.");
          return;
        }

        if (data.alreadyActivated) {
          setState("already");
          setMessage("Tu plan ya estaba activado.");
          return;
        }

        if (data.activated) {
          setState("activated");
          setMessage("Pago confirmado. Tu plan ya fue activado automáticamente.");
          return;
        }

        setState("pending");
        setMessage(data.reason || "Mercado Pago recibió el pago, pero todavía no pudimos activarlo. Probá refrescar en unos segundos.");
      } catch (error) {
        setState("error");
        setMessage(error instanceof Error ? error.message : "No pudimos confirmar el pago.");
      }
    }

    confirmPayment();
  }, [searchParams]);

  const tone = state === "activated" || state === "already" ? "text-emerald-600" : state === "error" ? "text-red-600" : "text-amber-600";
  const title = state === "activated" || state === "already" ? "Pago aprobado y plan activo" : state === "error" ? "Pago aprobado, activación pendiente" : "Pago aprobado";

  return (
    <section className="rounded-[2.5rem] bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
      <p className={`text-sm font-black uppercase tracking-[0.25em] ${tone}`}>Mercado Pago</p>
      <h1 className="mt-3 text-4xl font-black text-[#0D1B2A]">{title}</h1>
      <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-500">{message}</p>

      {state === "checking" ? (
        <p className="mt-5 text-sm font-black text-slate-400">Verificando...</p>
      ) : null}

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/figus" className="rounded-2xl bg-[#0D1B2A] px-5 py-3 text-sm font-black text-white">Volver a Figus</Link>
        <Link href="/figus/suscripcion" className="rounded-2xl bg-[#22C55E] px-5 py-3 text-sm font-black text-white">Ver suscripción</Link>
        <Link href="/perfil" className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#0D1B2A] ring-1 ring-slate-200">Mi perfil</Link>
      </div>
    </section>
  );
}

export default function PagoSuccessPage() {
  return (
    <FiguShell>
      <Suspense fallback={<section className="rounded-[2.5rem] bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">Confirmando pago...</section>}>
        <PagoSuccessContent />
      </Suspense>
    </FiguShell>
  );
}
