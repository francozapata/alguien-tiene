import Link from "next/link";

export default function SeguridadPage() {
  const items = [
    ["Encuentros", "Coordiná en lugares públicos, iluminados y con movimiento. Si podés, avisale a alguien dónde vas a estar."],
    ["Intercambios 1x1", "Aunque la app sugiera compatibilidades, revisá presencialmente que la figurita o producto sea el acordado antes de entregar lo tuyo."],
    ["Chat", "El chat se abre solo cuando ambas personas muestran interés. Usalo para coordinar sin compartir datos sensibles de entrada."],
    ["Datos personales", "No compartas claves, documentación, datos bancarios, códigos de verificación ni información sensible."],
    ["Pagos entre usuarios", "Si pactás una compra o venta, verificá cualquier pago antes de entregar. La plataforma no intermedia pagos entre usuarios."],
    ["Planes de la app", "Los planes pagos se compran desde la sección Suscribite y se acreditan según la confirmación del proveedor de pago."],
    ["Cafecito", "Los aportes por Cafecito son donaciones voluntarias: no reemplazan suscripciones ni habilitan beneficios de plan."],
    ["Sospechas", "Si algo te parece raro, cancelá el acuerdo, no concretes el encuentro y reportá."],
    ["Menores", "La app es solo para mayores de 18 años."],
    ["Responsabilidad", "Cada usuario es responsable de sus acuerdos, encuentros e intercambios."],
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto max-w-4xl rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-black uppercase tracking-[0.25em] text-[#2563EB]">Seguridad</p>
        <h1 className="mt-2 text-4xl font-black text-[#000F22]">Consejos de seguridad</h1>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {items.map(([title, text]) => (
            <div key={title} className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
              <h2 className="text-xl font-black text-[#000F22]">{title}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{text}</p>
            </div>
          ))}
        </div>
        <Link href="/" className="mt-8 inline-flex rounded-2xl bg-[#22C55E] px-5 py-3 text-sm font-black text-white">Volver al inicio</Link>
      </section>
    </main>
  );
}
