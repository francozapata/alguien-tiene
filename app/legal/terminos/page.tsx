import Link from "next/link";

export default function TerminosPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto max-w-4xl rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-black uppercase tracking-[0.25em] text-[#2563EB]">Legal</p>
        <h1 className="mt-2 text-4xl font-black text-[#0D1B2A]">Términos y condiciones</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
          Al usar Alguien Tiene aceptás estas condiciones. La app está destinada exclusivamente a personas mayores de 18 años.
        </p>

        <div className="mt-8 space-y-6 text-sm leading-7 text-slate-700">
          <section>
            <h2 className="text-xl font-black text-[#0D1B2A]">1. Rol de la plataforma</h2>
            <p>Alguien Tiene funciona como intermediario tecnológico para que usuarios publiquen, busquen, ofrezcan, intercambien o coordinen bienes, servicios, figuritas u otros elementos permitidos. No somos parte de los acuerdos entre usuarios.</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#0D1B2A]">2. Responsabilidad de los usuarios</h2>
            <p>Cada usuario es responsable de la veracidad de sus publicaciones, del estado de los productos, de sus conversaciones, acuerdos, entregas, pagos, encuentros e intercambios. La plataforma no garantiza que una operación se concrete ni responde por incumplimientos, daños, pérdidas, robos, estafas o conflictos entre usuarios.</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#0D1B2A]">3. Mayores de 18 años</h2>
            <p>El uso de la app es exclusivo para mayores de 18 años. Al registrarte declarás bajo tu responsabilidad que sos mayor de edad y que tenés capacidad para aceptar estos términos.</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#0D1B2A]">4. Encuentros y seguridad</h2>
            <p>Recomendamos coordinar encuentros en lugares públicos, iluminados y con movimiento. No compartas datos sensibles, claves, información bancaria innecesaria ni documentación personal. Si una situación te parece sospechosa, no concretes la operación y reportá la publicación o usuario.</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#0D1B2A]">5. Contenido prohibido</h2>
            <p>No se permite publicar contenido ilegal, engañoso, ofensivo, discriminatorio, peligroso, robado, falsificado, regulado sin autorización o que infrinja derechos de terceros. Podemos ocultar, eliminar o moderar publicaciones y cuentas cuando lo consideremos necesario.</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#0D1B2A]">6. Moderación</h2>
            <p>La plataforma puede revisar reportes, ocultar publicaciones, reactivar contenido, eliminar contenido o limitar cuentas para proteger la comunidad. Esto no implica obligación de monitoreo permanente ni responsabilidad por acciones de terceros.</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#0D1B2A]">7. Figuritas e intercambios</h2>
            <p>Las funciones de Figus Mundial 2026 solo ayudan a detectar compatibilidades entre usuarios. La disponibilidad, estado de las figuritas, acuerdos de intercambio, regalos, ventas o entregas quedan bajo exclusiva responsabilidad de los usuarios.</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#0D1B2A]">8. Cambios</h2>
            <p>Podemos modificar estos términos para mejorar la app o adecuarla a nuevas funciones. El uso continuado de la plataforma implica aceptación de los cambios.</p>
          </section>
        </div>

        <Link href="/" className="mt-8 inline-flex rounded-2xl bg-[#22C55E] px-5 py-3 text-sm font-black text-white">Volver al inicio</Link>
      </section>
    </main>
  );
}
