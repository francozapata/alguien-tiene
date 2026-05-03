import Image from "next/image";

export default function BrandPage() {
  const colors = [
    ["#0D1B2A", "Azul profundo", "Principal"],
    ["#22C55E", "Verde energía", "Secundario"],
    ["#2563EB", "Azul confianza", "Acento"],
    ["#FBBF24", "Amarillo", "Detalle"],
    ["#F3F4F6", "Gris claro", "Fondo"],
    ["#374151", "Gris oscuro", "Texto"],
  ];

  return (
    <main className="min-h-screen bg-[#F3F4F6] px-4 py-10">
      <section className="mx-auto max-w-6xl rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-4xl font-black text-[#0D1B2A]">Marca Alguien Tiene</h1>
        <p className="mt-2 font-semibold text-slate-500">Lo que buscás, alguien lo tiene.</p>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl bg-white p-5 text-center ring-1 ring-slate-200"><h2 className="mb-4 font-black">Solo logo</h2><Image src="/brand/logo-mark-light.png" alt="Logo claro" width={190} height={190} className="mx-auto" /><Image src="/brand/logo-mark-dark.png" alt="Logo oscuro" width={190} height={190} className="mx-auto mt-4 rounded-3xl" /></div>
          <div className="rounded-3xl bg-white p-5 text-center ring-1 ring-slate-200"><h2 className="mb-4 font-black">Solo texto</h2><Image src="/brand/logo-text-light.png" alt="Texto claro" width={260} height={110} className="mx-auto" /><Image src="/brand/logo-text-dark.png" alt="Texto oscuro" width={260} height={110} className="mx-auto mt-4 rounded-3xl" /></div>
          <div className="rounded-3xl bg-white p-5 text-center ring-1 ring-slate-200"><h2 className="mb-4 font-black">Logo + texto</h2><Image src="/brand/logo-full-light.png" alt="Full claro" width={320} height={120} className="mx-auto" /><Image src="/brand/logo-full-dark.png" alt="Full oscuro" width={320} height={120} className="mx-auto mt-4 rounded-3xl" /></div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-6">
          {colors.map(([hex, name, use]) => (
            <div key={hex} className="rounded-3xl bg-white p-4 text-center ring-1 ring-slate-200">
              <div className="mx-auto h-20 w-20 rounded-2xl ring-1 ring-slate-200" style={{ background: hex }} />
              <p className="mt-3 text-sm font-black">{hex}</p>
              <p className="text-xs font-bold text-slate-500">{name}</p>
              <p className="text-xs text-slate-400">{use}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
