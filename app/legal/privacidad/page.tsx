import Link from "next/link";

export default function PrivacidadPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto max-w-4xl rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-black uppercase tracking-[0.25em] text-[#2563EB]">Legal</p>
        <h1 className="mt-2 text-4xl font-black text-[#0D1B2A]">Política de privacidad</h1>
        <div className="mt-8 space-y-6 text-sm leading-7 text-slate-700">
          <section>
            <h2 className="text-xl font-black text-[#0D1B2A]">Datos que usamos</h2>
            <p>Al iniciar sesión con Google podemos usar tu nombre, email, identificador de cuenta y foto de perfil de Google. También guardamos publicaciones, figuritas cargadas, repetidas, solicitudes, chats, reportes y datos necesarios para operar la plataforma.</p>
          </section>
          <section>
            <h2 className="text-xl font-black text-[#0D1B2A]">Ubicación</h2>
            <p>Si aceptás compartir ubicación, puede usarse para priorizar intercambios o publicaciones cercanas. Si no aceptás, podés usar ciudad y barrio manualmente.</p>
          </section>
          <section>
            <h2 className="text-xl font-black text-[#0D1B2A]">Finalidad</h2>
            <p>Usamos los datos para crear tu perfil, mostrar publicaciones, generar coincidencias, permitir contacto entre usuarios, mejorar seguridad, moderar contenido y prevenir abuso.</p>
          </section>
          <section>
            <h2 className="text-xl font-black text-[#0D1B2A]">Responsabilidad</h2>
            <p>No compartas datos sensibles dentro de chats o publicaciones. Los datos que decidas entregar a otros usuarios quedan bajo tu responsabilidad.</p>
          </section>
          <section>
            <h2 className="text-xl font-black text-[#0D1B2A]">Eliminación o consultas</h2>
            <p>Podés solicitar revisión o eliminación de datos de cuenta según corresponda. Algunas acciones pueden conservarse si son necesarias por seguridad, auditoría o moderación.</p>
          </section>
        </div>
        <Link href="/" className="mt-8 inline-flex rounded-2xl bg-[#22C55E] px-5 py-3 text-sm font-black text-white">Volver al inicio</Link>
      </section>
    </main>
  );
}
