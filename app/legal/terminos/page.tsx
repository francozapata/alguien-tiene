import Link from "next/link";

export default function TerminosPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto max-w-4xl rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-black uppercase tracking-[0.25em] text-[#2563EB]">Legal</p>
        <h1 className="mt-2 text-4xl font-black text-[#000F22]">Términos y condiciones</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
          Al usar Alguien Tiene aceptás estas condiciones. La app está destinada exclusivamente a personas mayores de 18 años.
        </p>

        <div className="mt-8 space-y-6 text-sm leading-7 text-slate-700">
          <section>
            <h2 className="text-xl font-black text-[#000F22]">1. Rol de la plataforma</h2>
            <p>Alguien Tiene funciona como intermediario tecnológico para que usuarios publiquen, busquen, ofrezcan, intercambien o coordinen bienes, servicios, figuritas u otros elementos permitidos. La plataforma facilita coincidencias, búsqueda, contacto, chat, notificaciones y herramientas de organización, pero no forma parte de los acuerdos entre usuarios.</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#000F22]">2. Responsabilidad de los usuarios</h2>
            <p>Cada usuario es responsable de la veracidad de su información, de sus publicaciones, del estado de los productos o figuritas, de sus conversaciones, acuerdos, entregas, pagos, encuentros e intercambios. La plataforma no garantiza que una operación se concrete ni responde por incumplimientos, daños, pérdidas, robos, estafas o conflictos entre usuarios.</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#000F22]">3. Mayores de 18 años</h2>
            <p>El uso de la app es exclusivo para mayores de 18 años. Al registrarte declarás bajo tu responsabilidad que sos mayor de edad y que tenés capacidad para aceptar estos términos.</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#000F22]">4. Figus, matches e intercambios</h2>
            <p>Las funciones de Figus Mundial 2026 detectan compatibilidades reales entre usuarios según álbum cargado, repetidas, faltantes, ubicación autorizada, límites de plan y actividad. Los intercambios sugeridos son siempre mano a mano: una figurita por una figurita. El chat se habilita únicamente cuando existe interés de ambas partes. La disponibilidad, autenticidad, estado de las figuritas y concreción del intercambio quedan bajo responsabilidad exclusiva de los usuarios.</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#000F22]">5. Ubicación</h2>
            <p>Para las funciones de cercanía se utiliza la ubicación real otorgada por permiso del navegador o dispositivo. La ciudad o barrio cargados manualmente pueden mostrarse como información complementaria, pero no reemplazan la ubicación autorizada para calcular distancia y ordenar resultados.</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#000F22]">6. Planes pagos y beneficios</h2>
            <p>Alguien Tiene puede ofrecer planes pagos con beneficios adicionales, como mayor cantidad de búsquedas, tarjetas en modo rápido, intereses, contactos, radio de búsqueda, prioridad o funciones avanzadas. Los planes Básico y Plus se otorgan por 7 días desde la acreditación del pago. El plan Premium se otorga por 14 días desde la acreditación del pago. Los pagos actuales son únicos y no implican renovación automática, salvo que expresamente se indique lo contrario en el futuro.</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#000F22]">7. Pagos, acreditación y vencimiento</h2>
            <p>Los pagos se procesan mediante proveedores externos como Mercado Pago. La activación del plan depende de la aprobación y comunicación del pago por parte del proveedor. Si un pago queda pendiente, rechazado, cancelado o no puede vincularse correctamente con la cuenta, el beneficio puede no activarse hasta su revisión. Al vencer el período contratado, la cuenta vuelve al plan gratuito salvo nueva compra o activación administrativa.</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#000F22]">8. Donaciones</h2>
            <p>El botón de Cafecito permite realizar aportes voluntarios para apoyar el proyecto. Las donaciones no compran un plan, no habilitan beneficios pagos y no reemplazan las compras realizadas desde la sección de suscripción.</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#000F22]">9. Encuentros y seguridad</h2>
            <p>Recomendamos coordinar encuentros en lugares públicos, iluminados y con movimiento. No compartas datos sensibles, claves, información bancaria innecesaria ni documentación personal. Si una situación te parece sospechosa, no concretes la operación y reportá la publicación o usuario.</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#000F22]">10. Contenido prohibido y moderación</h2>
            <p>No se permite publicar contenido ilegal, engañoso, ofensivo, discriminatorio, peligroso, robado, falsificado, regulado sin autorización o que infrinja derechos de terceros. La plataforma puede revisar reportes, ocultar, reactivar, eliminar contenido o limitar cuentas para proteger la comunidad. Esto no implica obligación de monitoreo permanente ni responsabilidad por acciones de terceros.</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#000F22]">11. Cambios</h2>
            <p>Podemos modificar estos términos para mejorar la app, ajustar planes, precios, beneficios o adecuarla a nuevas funciones. El uso continuado de la plataforma implica aceptación de los cambios.</p>
          </section>
        </div>

        <Link href="/" className="mt-8 inline-flex rounded-2xl bg-[#22C55E] px-5 py-3 text-sm font-black text-white">Volver al inicio</Link>
      </section>
    </main>
  );
}
