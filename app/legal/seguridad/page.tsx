import Link from "next/link";

export default function SeguridadPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto max-w-4xl rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-black uppercase tracking-[0.25em] text-[#2563EB]">Seguridad</p>
        <h1 className="mt-2 text-4xl font-black text-[#0D1B2A]">Consejos de seguridad</h1>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {[
            ["Encuentros", "Coordiná en lugares públicos, iluminados y con movimiento."],
            ["Datos personales", "No compartas claves, documentación, datos bancarios ni información sensible."],
            ["Pagos", "Verificá cualquier pago antes de entregar un producto o figurita."],
            ["Sospechas", "Si algo te parece raro, cancelá el acuerdo y reportá."],
            ["Menores", "La app es solo para mayores de 18 años."],
            ["Responsabilidad", "Cada usuario es responsable de sus acuerdos y encuentros."],
          ].map(([title, text]) => (
            <div key={title} className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
              <h2 className="text-xl font-black text-[#0D1B2A]">{title}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{text}</p>
            </div>
          ))}
        </div>
        <Link href="/" className="mt-8 inline-flex rounded-2xl bg-[#22C55E] px-5 py-3 text-sm font-black text-white">Volver al inicio</Link>
      </section>
    </main>
  );
}
