"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { getOrCreateProfile } from "@/services/profiles";
import { supabase } from "@/lib/supabase";

export default function FigusTycPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [accepted, setAccepted] = useState(false);
  const [adult, setAdult] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function check() {
      if (!user) return;
      const profile = await getOrCreateProfile(user);
      if (profile.terms_accepted && profile.is_adult_confirmed) router.push("/figus");
    }
    check();
  }, [user, router]);

  async function acceptTerms() {
    if (!user) return;
    setMessage("");

    if (!accepted || !adult) {
      setMessage("Para continuar tenés que aceptar los términos y declarar que sos mayor de 18 años.");
      return;
    }

    try {
      const profile = await getOrCreateProfile(user);
      const { error } = await supabase
        .from("profiles")
        .update({
          terms_accepted: true,
          terms_accepted_at: new Date().toISOString(),
          is_adult_confirmed: true,
        })
        .eq("id", profile.id);

      if (error) throw error;

      router.push("/figus");
    } catch (error) {
      console.error(error);
      setMessage("No se pudo guardar la aceptación. Intentá de nuevo.");
    }
  }

  async function cancel() {
    await signOut(auth);
    router.push("/figus");
  }

  if (loading) {
    return <main className="min-h-screen bg-[#F3F4F6] px-4 py-10"><section className="mx-auto max-w-xl rounded-[2rem] bg-white p-6 shadow-sm">Cargando...</section></main>;
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#F3F4F6] px-4 py-10">
        <section className="mx-auto max-w-xl rounded-[2rem] bg-white p-6 text-center shadow-sm">
          <h1 className="text-2xl font-black text-[#0D1B2A]">Iniciá sesión</h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">Necesitás entrar con Google para aceptar los términos.</p>
          <Link href="/figus" className="mt-5 inline-flex rounded-2xl bg-[#22C55E] px-5 py-3 text-sm font-black text-white">Volver</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F3F4F6] px-4 py-10">
      <section className="mx-auto max-w-2xl rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-black uppercase tracking-[0.25em] text-[#2563EB]">Primer ingreso</p>
        <h1 className="mt-2 text-4xl font-black text-[#0D1B2A]">Antes de continuar</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
          Para usar Alguien Tiene / Figus Mundial 2026 necesitás aceptar las condiciones de uso y confirmar que sos mayor de 18 años.
        </p>

        <div className="mt-6 space-y-3 rounded-[2rem] bg-slate-50 p-5 ring-1 ring-slate-200">
          <label className="flex cursor-pointer items-start gap-3 text-sm font-bold text-slate-700">
            <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-1 h-4 w-4" />
            <span>
              Acepto los <Link href="/legal/terminos" className="font-black text-[#2563EB] underline">Términos y condiciones</Link> y la <Link href="/legal/privacidad" className="font-black text-[#2563EB] underline">Política de privacidad</Link>.
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 text-sm font-bold text-slate-700">
            <input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} className="mt-1 h-4 w-4" />
            <span>Declaro ser mayor de 18 años.</span>
          </label>
        </div>

        {message ? <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">{message}</p> : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button onClick={acceptTerms} className="rounded-2xl bg-[#22C55E] px-5 py-3 text-sm font-black text-white hover:bg-[#16A34A]">
            Aceptar y entrar
          </button>
          <button onClick={cancel} className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-700 ring-1 ring-slate-200">
            Cancelar
          </button>
        </div>
      </section>
    </main>
  );
}
