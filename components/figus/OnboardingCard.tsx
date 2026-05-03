"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function OnboardingCard() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(window.localStorage.getItem("figus_onboarding_done") !== "true");
  }, []);

  function close() {
    window.localStorage.setItem("figus_onboarding_done", "true");
    setShow(false);
  }

  if (!show) return null;

  return (
    <section className="mb-6 rounded-[2.5rem] bg-[#0D1B2A] p-6 text-white shadow-xl">
      <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-[#22C55E]">Primeros pasos</p>
          <h2 className="mt-2 text-3xl font-black">Cómo funciona Alguien Tiene</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-3xl bg-white/10 p-4 ring-1 ring-white/10"><p className="text-2xl">📘</p><h3 className="mt-2 font-black">1. Cargá tu álbum</h3><p className="mt-1 text-sm text-white/75">Marcá las figuritas que tenés y sus cantidades.</p></div>
            <div className="rounded-3xl bg-white/10 p-4 ring-1 ring-white/10"><p className="text-2xl">🔁</p><h3 className="mt-2 font-black">2. Repetidas</h3><p className="mt-1 text-sm text-white/75">Todo lo que tenés más de una vez se usa para intercambiar.</p></div>
            <div className="rounded-3xl bg-white/10 p-4 ring-1 ring-white/10"><p className="text-2xl">📍</p><h3 className="mt-2 font-black">3. Cerca tuyo</h3><p className="mt-1 text-sm text-white/75">Encontrás usuarios compatibles por distancia.</p></div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/figus/mi-album" onClick={close} className="rounded-2xl bg-[#22C55E] px-5 py-3 text-sm font-black text-white">Empezar</Link>
          <button onClick={close} className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-white ring-1 ring-white/20">Ya entendí</button>
        </div>
      </div>
    </section>
  );
}
