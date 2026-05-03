import Image from "next/image";
import Link from "next/link";

export default function FooterLegal() {
  return (
    <footer className="bg-[#0D1B2A] px-4 py-8 text-white">
      <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-[1fr_1.5fr_1fr] md:items-center">
        <div>
          <Image src="/brand/alguien-tiene-logo.jpeg" alt="Alguien Tiene" width={210} height={80} className="h-14 w-auto object-contain" />
          <p className="mt-2 text-xs font-semibold text-slate-300">Lo que buscás, alguien lo tiene.</p>
        </div>

        <div className="text-center">
          <p className="inline-flex rounded-full border border-emerald-400/40 px-4 py-2 text-sm font-black text-emerald-300">18+</p>
          <p className="mt-3 text-sm font-semibold text-slate-200">Alguien Tiene es una plataforma de intercambios entre personas mayores de 18 años.</p>
          <div className="mt-3 flex flex-wrap justify-center gap-3 text-sm">
            <Link href="/legal/terminos" className="font-black text-[#22C55E] hover:underline">Términos y condiciones</Link>
            <span className="text-slate-500">|</span>
            <Link href="/legal/privacidad" className="font-black text-[#22C55E] hover:underline">Política de privacidad</Link>
            <span className="text-slate-500">|</span>
            <Link href="/legal/seguridad" className="font-black text-[#22C55E] hover:underline">Seguridad</Link>
          </div>
        </div>

        <div className="rounded-3xl bg-white/10 p-4 text-sm ring-1 ring-white/10">
          <p className="font-black">🛡️ Intercambios responsables</p>
          <p className="mt-1 text-slate-300">La plataforma solo facilita el contacto. Los acuerdos son responsabilidad de cada usuario.</p>
        </div>
      </div>
    </footer>
  );
}
