"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getFiguNotificationSummary } from "@/services/figus";
import { notifyLocalMatch } from "@/utils/notifications";

export default function NotificationBell() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const [incoming, setIncoming] = useState(0);
  const [latest, setLatest] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const lastIncomingId = useRef<string | null>(null);
  const initialized = useRef(false);

  async function load() {
    if (!user) return;
    try {
      const data = await getFiguNotificationSummary(user);
      setCount(data.chats_count ?? 0);
      setIncoming(data.incoming_count ?? 0);
      setLatest(data.latest_incoming ?? null);

      if (initialized.current && data.latest_incoming?.id && data.latest_incoming.id !== lastIncomingId.current) {
        notifyLocalMatch("Nuevo mensaje en Alguien Tiene", data.latest_incoming.message || "Tenés un mensaje nuevo.");
      }

      if (data.latest_incoming?.id) lastIncomingId.current = data.latest_incoming.id;
      initialized.current = true;
    } catch {
      // No bloquea navbar.
    }
  }

  useEffect(() => {
    load();
    const id = window.setInterval(load, 7000);
    return () => window.clearInterval(id);
  }, [user]);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        title="Notificaciones"
        className="relative inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-3 py-2 text-sm font-black text-white hover:bg-white/15"
      >
        🔔
        {incoming > 0 ? (
          <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-black text-white ring-2 ring-[#0D1B2A]">
            {incoming > 9 ? "9+" : incoming}
          </span>
        ) : count > 0 ? (
          <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-[#22C55E] ring-2 ring-[#0D1B2A]" />
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-[90] w-80 rounded-[1.5rem] bg-white p-4 text-[#0D1B2A] shadow-2xl ring-1 ring-slate-200">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-black">Notificaciones</h3>
              <p className="mt-1 text-xs font-bold text-slate-500">
                Avisos importantes sobre mensajes, matches e intercambios.
              </p>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-full bg-slate-100 px-2 py-1 text-xs font-black text-slate-500">✕</button>
          </div>

          <div className="mt-4 space-y-3">
            {latest ? (
              <div className="rounded-2xl bg-emerald-50 p-3 ring-1 ring-emerald-100">
                <p className="text-sm font-black text-emerald-800">Nuevo mensaje</p>
                <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-700">{latest.message}</p>
                <p className="mt-2 text-xs font-bold text-slate-500">Entrá desde la burbuja de chat para responder.</p>
              </div>
            ) : null}

            {count > 0 ? (
              <div className="rounded-2xl bg-sky-50 p-3 ring-1 ring-sky-100">
                <p className="text-sm font-black text-sky-800">Chats abiertos</p>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  Tenés {count} conversación{count === 1 ? "" : "es"} activa{count === 1 ? "" : "s"}.
                </p>
              </div>
            ) : null}

            {!latest && count === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
                <p className="text-sm font-black text-slate-800">Sin novedades</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Cuando haya mensajes o matches, van a aparecer acá.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
