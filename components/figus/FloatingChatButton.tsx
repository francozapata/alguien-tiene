"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getFiguNotificationSummary } from "@/services/figus";

export default function FloatingChatButton() {
  const { user } = useAuth();
  const [incoming, setIncoming] = useState(0);

  async function load() {
    if (!user) return;
    try {
      const data = await getFiguNotificationSummary(user);
      setIncoming(data.incoming_count ?? 0);
    } catch {}
  }

  useEffect(() => {
    load();
    const id = window.setInterval(load, 8000);
    return () => window.clearInterval(id);
  }, [user]);

  if (!user) return null;

  return (
    <Link
      href="/figus/chats"
      className="fixed bottom-5 right-5 z-[70] flex h-16 w-16 items-center justify-center rounded-full bg-[#22C55E] text-3xl shadow-2xl ring-4 ring-white transition hover:scale-105"
      title="Abrir mensajes"
    >
      💬
      {incoming > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-7 min-w-7 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-black text-white ring-2 ring-white">
          {incoming > 9 ? "9+" : incoming}
        </span>
      ) : null}
    </Link>
  );
}
