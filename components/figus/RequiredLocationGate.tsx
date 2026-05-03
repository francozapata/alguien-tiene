"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  canAskBrowserLocation,
  hasLocationAllowedOnDevice,
  refreshSmartLocation,
  syncStoredLocation,
} from "@/utils/location";

type RequiredLocationGateProps = {
  children: React.ReactNode;
};

export default function RequiredLocationGate({ children }: RequiredLocationGateProps) {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasLocation, setHasLocation] = useState(false);
  const [status, setStatus] = useState("Verificando ubicación...");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function start() {
      if (!mounted) return;

      setChecking(true);

      // Si ya estaba guardada en este dispositivo, la sincronizamos a Supabase.
      if (hasLocationAllowedOnDevice()) {
        if (user) await syncStoredLocation(user);
        setHasLocation(true);
        setStatus("Ubicación activa.");
        setChecking(false);
        return;
      }

      setHasLocation(false);
      setChecking(false);
      setStatus("Necesitamos tu ubicación para ordenar intercambios por cercanía.");
    }

    start();
  }, [mounted, user]);

  async function activateLocation() {
    setChecking(true);

    if (!canAskBrowserLocation()) {
      setHasLocation(false);
      setChecking(false);
      return;
    }

    const ok = await refreshSmartLocation(user, { force: true });
    if (ok) {
      await syncStoredLocation(user);
      setHasLocation(true);
      setStatus("Ubicación guardada. Ya podés continuar.");
    } else {
      setHasLocation(false);
      setStatus("No se pudo obtener ubicación. Revisá permisos del navegador.");
    }

    setChecking(false);
  }

  if (!mounted) return null;

  if (hasLocation) return <>{children}</>;

  const secureProblem = !canAskBrowserLocation();

  return (
    <section className="rounded-[2rem] bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">
      <div className="mx-auto max-w-2xl">
        <p className="text-sm font-black uppercase tracking-[0.25em] text-[#2563EB]">Ubicación requerida</p>
        <h2 className="mt-2 text-3xl font-black text-[#0D1B2A]">Activá tu ubicación para buscar figus</h2>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
          Para que los intercambios sean reales y cercanos, necesitamos guardar tu ubicación aproximada.
          Sin ubicación no se habilitan Intercambios ni Descubrir.
        </p>

        {secureProblem ? (
          <div className="mt-5 rounded-3xl bg-amber-50 p-4 text-left text-sm font-bold leading-6 text-amber-800 ring-1 ring-amber-200">
            <p className="font-black">En este dispositivo el navegador bloqueó la ubicación.</p>
            <p className="mt-2">
              Esto pasa cuando entrás desde el celular con <b>http://192.168...</b>. Para que funcione necesitás abrir la app con <b>HTTPS</b>, por ejemplo deploy o túnel HTTPS.
            </p>
          </div>
        ) : null}

        <p className="mt-4 text-sm font-black text-slate-500">{checking ? "Verificando..." : status}</p>

        <button
          onClick={activateLocation}
          disabled={checking || secureProblem}
          className="mt-5 rounded-2xl bg-[#22C55E] px-6 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          📍 Activar ubicación
        </button>

        {secureProblem ? (
          <p className="mt-4 text-xs font-bold text-slate-500">
            En PC con localhost puede funcionar. En celular, usá HTTPS.
          </p>
        ) : null}
      </div>
    </section>
  );
}
