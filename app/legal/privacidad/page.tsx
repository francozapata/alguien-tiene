import Link from "next/link";

export default function PrivacidadPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto max-w-4xl rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-black uppercase tracking-[0.25em] text-[#2563EB]">Legal</p>
        <h1 className="mt-2 text-4xl font-black text-[#000F22]">Política de privacidad</h1>
        <div className="mt-8 space-y-6 text-sm leading-7 text-slate-700">
          <section>
            <h2 className="text-xl font-black text-[#000F22]">Datos que usamos</h2>
            <p>Al iniciar sesión con Google podemos usar tu nombre, email, identificador de cuenta y foto de perfil. También guardamos publicaciones, figuritas cargadas, repetidas, faltantes calculadas, solicitudes, matches, intereses, chats, notificaciones, reportes, plan activo, órdenes de pago y datos necesarios para operar la plataforma.</p>
          </section>
          <section>
            <h2 className="text-xl font-black text-[#000F22]">Ubicación</h2>
            <p>Si aceptás compartir ubicación, usamos latitud y longitud para calcular cercanía, ordenar matches y aplicar el radio de búsqueda de cada plan. La ciudad o barrio cargados manualmente pueden usarse como dato visual o complementario, pero las funciones de coincidencia priorizan la ubicación real otorgada por permiso.</p>
          </section>
          <section>
            <h2 className="text-xl font-black text-[#000F22]">Pagos y planes</h2>
            <p>Para activar planes pagos podemos guardar datos técnicos de la operación, como tipo de plan, estado, fecha de inicio, fecha de vencimiento, identificadores de orden o pago y respuesta del proveedor. Los datos de tarjeta, cuenta o medio de pago son procesados por Mercado Pago u otros proveedores externos y no son almacenados por Alguien Tiene.</p>
          </section>
          <section>
            <h2 className="text-xl font-black text-[#000F22]">Finalidad</h2>
            <p>Usamos los datos para crear tu perfil, mostrar publicaciones, generar coincidencias reales 1x1, ordenar resultados por cercanía o cantidad de intercambio, habilitar chat cuando hay interés mutuo, mostrar notificaciones, aplicar límites de plan, mejorar seguridad, moderar contenido y prevenir abuso.</p>
          </section>
          <section>
            <h2 className="text-xl font-black text-[#000F22]">Notificaciones y mensajes</h2>
            <p>Podemos registrar eventos de notificación, mensajes no leídos, intereses recibidos y actividad relacionada para mostrar globos, avisos y accesos rápidos. Al abrir, leer o marcar como visto, esos indicadores pueden actualizarse para reflejar el estado real.</p>
          </section>
          <section>
            <h2 className="text-xl font-black text-[#000F22]">Responsabilidad</h2>
            <p>No compartas datos sensibles dentro de chats o publicaciones. Los datos que decidas entregar a otros usuarios quedan bajo tu responsabilidad. Los acuerdos y encuentros se realizan fuera del control directo de la plataforma.</p>
          </section>
          <section>
            <h2 className="text-xl font-black text-[#000F22]">Eliminación o consultas</h2>
            <p>Podés solicitar revisión o eliminación de datos de cuenta según corresponda. Algunas acciones pueden conservarse si son necesarias por seguridad, auditoría, pagos, prevención de abuso o moderación.</p>
          </section>
        </div>
        <Link href="/" className="mt-8 inline-flex rounded-2xl bg-[#22C55E] px-5 py-3 text-sm font-black text-white">Volver al inicio</Link>
      </section>
    </main>
  );
}
