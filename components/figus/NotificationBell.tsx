"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getFiguNotificationSummary } from "@/services/figus";
import { notifyLocalMatch } from "@/utils/notifications";

const SEEN_KEY = "figu_seen_incoming_message_ids";

function getSeenIds() {
  if (typeof window === "undefined") return new Set<string>();
  try {
    return new Set<string>(JSON.parse(window.localStorage.getItem(SEEN_KEY) || "[]"));
  } catch {
    return new Set<string>();
  }
}

function saveSeenIds(ids: Set<string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SEEN_KEY, JSON.stringify(Array.from(ids).slice(-250)));
  window.dispatchEvent(new Event("figu-notifications-seen"));
}

export default function NotificationBell() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const [incoming, setIncoming] = useState(0);
  const [latest, setLatest] = useState<any>(null);
  const [incomingIds, setIncomingIds] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const lastIncomingId = useRef<string | null>(null);
  const initialized = useRef(false);

  async function load() {
    if (!user) return;
    try {
      const data = await getFiguNotificationSummary(user);
      const seen = getSeenIds();
      const allIncoming = data.incoming_messages ?? [];
      const unseenIncoming = allIncoming.filter((message: any) => !seen.has(message.id));

      setCount(data.chats_count ?? 0);
      setIncoming(unseenIncoming.length);
      setLatest(unseenIncoming[0] ?? null);
      setIncomingIds((data.incoming_message_ids ?? []).filter((id: string) => !seen.has(id)));

      if (initialized.current && unseenIncoming[0]?.id && unseenIncoming[0].id !== lastIncomingId.current) {
        notifyLocalMatch("Nuevo mensaje en Alguien Tiene", unseenIncoming[0].message || "Tenés un mensaje nuevo.");
      }

      if (unseenIncoming[0]?.id) lastIncomingId.current = unseenIncoming[0].id;
      initialized.current = true;
    } catch {
      // No bloquea navbar.
    }
  }

  function markVisibleAsSeen() {
    if (!incomingIds.length) return;
    const seen = getSeenIds();
    incomingIds.forEach((id) => seen.add(id));
    saveSeenIds(seen);
    setIncoming(0);
    setLatest(null);
    setIncomingIds([]);
  }

  useEffect(() => {
    load();
    const id = window.setInterval(load, 7000);
    window.addEventListener("figu-notifications-seen", load);
    window.addEventListener("focus", load);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("figu-notifications-seen", load);
      window.removeEventListener("focus", load);
    };
  }, [user]);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          const nextOpen = !open;
          setOpen(nextOpen);
          if (nextOpen) markVisibleAsSeen();
        }}
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
            <div className="flex gap-1"><button onClick={markVisibleAsSeen} className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">Leído todo</button><button onClick={() => setOpen(false)} className="rounded-full bg-slate-100 px-2 py-1 text-xs font-black text-slate-500">✕</button></div>
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
