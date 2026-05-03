import Link from "next/link";
import { FiguShell } from "@/components/figus/FiguShell";

export default function PagoPage() {
  return (
    <FiguShell>
      <section className="rounded-[2.5rem] bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-black uppercase tracking-[0.25em] text-emerald-600">Mercado Pago</p>
        <h1 className="mt-3 text-4xl font-black text-[#0D1B2A]">Pago aprobado</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-500">Si Mercado Pago ya confirmó el pago, tu plan se activa automáticamente. Si todavía no lo ves, esperá unos segundos y refrescá.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/figus" className="rounded-2xl bg-[#0D1B2A] px-5 py-3 text-sm font-black text-white">Volver a Figus</Link>
          <Link href="/figus/suscripcion" className="rounded-2xl bg-[#22C55E] px-5 py-3 text-sm font-black text-white">Ver suscripción</Link>
        </div>
      </section>
    </FiguShell>
  );
}
