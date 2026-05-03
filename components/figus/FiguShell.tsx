"use client";

import Image from "next/image";

export function FiguShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#F3F4F6] px-4 py-8 text-[#374151]">
      <section className="mx-auto max-w-7xl">
        <div className="mb-6 overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#0B4D3A] via-[#22C55E] to-[#2563EB] text-white shadow-xl">
          <div className="grid gap-6 p-6 md:grid-cols-[1fr_360px] md:items-center md:p-8">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.28em] text-white/80">Mundial 2026</p>
              <h1 className="mt-2 text-4xl font-black tracking-tight md:text-6xl">Figus Mundial 2026</h1>
              <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-white md:text-base">
                Cargá tu álbum, marcá tus repetidas y encontrá intercambios responsables cerca tuyo.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/20 px-4 py-2 text-xs font-black ring-1 ring-white/30">994 figuritas</span>
                <span className="rounded-full bg-white/20 px-4 py-2 text-xs font-black ring-1 ring-white/30">Intercambios justos</span>
                <span className="rounded-full bg-white/20 px-4 py-2 text-xs font-black ring-1 ring-white/30">Cerca tuyo</span>
              </div>
            </div>

            <div className="relative hidden md:block">
              <Image src="/brand/figus-hero.png" alt="Álbum y figuritas Mundial 2026" width={420} height={245} className="drop-shadow-2xl" priority />
            </div>
          </div>
        </div>

        {children}
      </section>
    </main>
  );
}
