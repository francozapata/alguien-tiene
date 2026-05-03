"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getFiguNotificationSummary } from "@/services/figus";

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

export default function FloatingChatButton() {
  const { user } = useAuth();
  const [incoming, setIncoming] = useState(0);
  const [incomingIds, setIncomingIds] = useState<string[]>([]);

  async function load() {
    if (!user) return;
    try {
      const data = await getFiguNotificationSummary(user);
      const seen = getSeenIds();
      const ids = (data.incoming_message_ids ?? []).filter((id: string) => !seen.has(id));
      setIncoming(ids.length);
      setIncomingIds(ids);
    } catch {}
  }

  function markVisibleAsSeen() {
    if (!incomingIds.length) return;
    const seen = getSeenIds();
    incomingIds.forEach((id) => seen.add(id));
    saveSeenIds(seen);
    setIncoming(0);
    setIncomingIds([]);
  }

  useEffect(() => {
    load();
    const id = window.setInterval(load, 8000);
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
    <div className="fixed bottom-5 right-5 z-[70] flex items-center gap-3">
      <a
        href="https://cafecito.app/alguientiene"
        rel="noopener"
        target="_blank"
        className="hidden rounded-full bg-white p-1 shadow-2xl ring-2 ring-white transition hover:scale-105 sm:block"
        title="Invitame un café en cafecito.app"
      >
        <img
          src="https://cdn.cafecito.app/imgs/buttons/button_1.png"
          srcSet="https://cdn.cafecito.app/imgs/buttons/button_1.png 1x, https://cdn.cafecito.app/imgs/buttons/button_1_2x.png 2x, https://cdn.cafecito.app/imgs/buttons/button_1_3.75x.png 3.75x"
          alt="Invitame un café en cafecito.app"
          className="h-10 w-auto"
        />
      </a>

      <Link
        href="/figus/chats"
        onClick={markVisibleAsSeen}
        className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[#22C55E] text-3xl shadow-2xl ring-4 ring-white transition hover:scale-105"
        title="Abrir mensajes"
      >
        💬
        {incoming > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-7 min-w-7 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-black text-white ring-2 ring-white">
            {incoming > 9 ? "9+" : incoming}
          </span>
        ) : null}
      </Link>
    </div>
  );
}
