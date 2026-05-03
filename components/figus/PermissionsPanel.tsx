"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  canAskBrowserLocation,
  hasLocationAllowedOnDevice,
  isLocationUnavailableOnDevice,
  refreshSmartLocation,
} from "@/utils/location";
import { ensureNotificationsPermission, getNotificationsState } from "@/utils/notifications";

export default function PermissionsPanel({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [locationStatus, setLocationStatus] = useState("");
  const [notificationStatus, setNotificationStatus] = useState("");
  const [locationAllowed, setLocationAllowed] = useState(false);
  const [locationUnavailable, setLocationUnavailable] = useState(false);
  const [notificationState, setNotificationState] = useState("default");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setMounted(true);
    setLocationAllowed(hasLocationAllowedOnDevice());
    setLocationUnavailable(isLocationUnavailableOnDevice() || !canAskBrowserLocation());
    setNotificationState(getNotificationsState());
  }, []);

  const notificationsResolved = notificationState === "granted" || notificationState === "denied" || notificationState === "unsupported";
  const locationResolved = locationAllowed || locationUnavailable;
  const shouldHide = dismissed || (locationResolved && notificationsResolved);

  const locationHelp = useMemo(() => {
    if (!mounted) return "";
    if (locationAllowed) return "Ubicación activada.";
    if (!canAskBrowserLocation()) return "En celular por IP local el navegador bloquea ubicación. Probalo con HTTPS/deploy.";
    if (locationUnavailable) return "No se pudo obtener ubicación. Podés seguir con ciudad/barrio.";
    return "";
  }, [mounted, locationAllowed, locationUnavailable]);

  const notificationHelp = useMemo(() => {
    if (!mounted) return "";
    if (notificationState === "granted") return "Notificaciones activadas.";
    if (notificationState === "denied") return "Notificaciones bloqueadas en el navegador.";
    if (notificationState === "unsupported") return "Este navegador no soporta notificaciones.";
    return "";
  }, [mounted, notificationState]);

  async function activateLocation() {
    setLocationStatus("Actualizando ubicación...");
    const ok = await refreshSmartLocation(user, { force: true });
    setLocationAllowed(hasLocationAllowedOnDevice());
    setLocationUnavailable(isLocationUnavailableOnDevice() || !canAskBrowserLocation());
    setLocationStatus(ok ? "Ubicación actualizada." : "No se pudo obtener ubicación.");
  }

  async function activateNotifications() {
    setNotificationStatus("Solicitando permiso...");
    const result = await ensureNotificationsPermission();
    setNotificationState(result);
    if (result === "granted") setNotificationStatus("Notificaciones activadas.");
    else if (result === "denied") setNotificationStatus("Notificaciones bloqueadas en el navegador.");
    else setNotificationStatus("Este navegador no soporta notificaciones.");
  }

  // Evita hydration mismatch: el server y el primer render del cliente devuelven lo mismo.
  if (!mounted || shouldHide) return null;

  return (
    <div className={`rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 ${compact ? "" : "mb-6"}`}>
      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-[#0D1B2A]">Permisos recomendados</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Activá ubicación para ordenar por cercanía y notificaciones para avisos importantes de intercambios.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500 hover:bg-slate-200"
            >
              Cerrar
            </button>
          </div>

          {(locationStatus || notificationStatus || locationHelp || notificationHelp) ? (
            <div className="mt-2 space-y-1 text-xs font-black">
              {locationStatus || locationHelp ? (
                <p className={locationAllowed ? "text-emerald-700" : "text-amber-700"}>
                  📍 {locationStatus || locationHelp}
                </p>
              ) : null}
              {notificationStatus || notificationHelp ? (
                <p className={notificationState === "granted" ? "text-emerald-700" : "text-blue-700"}>
                  🔔 {notificationStatus || notificationHelp}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {!locationResolved ? (
            <button onClick={activateLocation} className="rounded-2xl bg-[#22C55E] px-4 py-3 text-sm font-black text-white">
              📍 Ubicación
            </button>
          ) : null}

          {!notificationsResolved ? (
            <button onClick={activateNotifications} className="rounded-2xl bg-[#0D1B2A] px-4 py-3 text-sm font-black text-white">
              🔔 Notificaciones
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
