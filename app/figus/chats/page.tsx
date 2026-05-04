"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { FiguShell } from "@/components/figus/FiguShell";
import { getMyFiguChats } from "@/services/figus";
import { FiguMatch } from "@/types/figus";
import { formatStickerList } from "@/lib/figus/catalog";
import { notifyLocalMatch } from "@/utils/notifications";


const SEEN_KEY = "figu_seen_incoming_message_ids";

function markIncomingMessagesSeen(messages: Array<{ id: string; sender_id: string }>, profileId: string) {
  if (typeof window === "undefined") return;
  try {
    const seen = new Set<string>(JSON.parse(window.localStorage.getItem(SEEN_KEY) || "[]"));
    messages.forEach((message) => {
      if (message.sender_id !== profileId) seen.add(message.id);
    });
    window.localStorage.setItem(SEEN_KEY, JSON.stringify(Array.from(seen).slice(-250)));
    window.dispatchEvent(new Event("figu-notifications-seen"));
  } catch {}
}

function exchangeText(match: FiguMatch, profileId: string) {
  const amUser1 = match.user1_id === profileId;
  const iGet = amUser1 ? match.figus_user1_gets : match.figus_user2_gets;
  const otherGets = amUser1 ? match.figus_user2_gets : match.figus_user1_gets;
  return `Recibís ${formatStickerList(iGet, 8)} · Entregás ${formatStickerList(otherGets, 8)}`;
}

export default function FiguChatsPage() {
  const { user, loading } = useAuth();
  const [profileId, setProfileId] = useState("");
  const [chats, setChats] = useState<FiguMatch[]>([]);
  const [status, setStatus] = useState("Cargando chats...");
  const knownLastMessageIds = useRef<Set<string>>(new Set());
  const initialized = useRef(false);

  async function load() {
    if (!user) return;

    try {
      const data = await getMyFiguChats(user);
      setProfileId(data.profile.id);
      setChats(data.chats as FiguMatch[]);
      markIncomingMessagesSeen((data.chats as FiguMatch[]).map((chat) => chat.last_message).filter(Boolean) as any[], data.profile.id);
      setStatus(data.chats.length ? "Chats cargados." : "Todavía no tenés chats abiertos.");

      const nextIds = new Set<string>();
      for (const chat of data.chats as FiguMatch[]) {
        const msg = chat.last_message;
        if (!msg) continue;
        nextIds.add(msg.id);

        if (initialized.current && msg.sender_id !== data.profile.id && !knownLastMessageIds.current.has(msg.id)) {
          const other = chat.user1_id === data.profile.id ? chat.user2 : chat.user1;
          notifyLocalMatch("Nuevo mensaje en Alguien Tiene", `${other?.display_name || other?.email || "Un usuario"} te escribió.`);
        }
      }
      knownLastMessageIds.current = nextIds;
      initialized.current = true;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "No se pudieron cargar los chats.");
    }
  }

  useEffect(() => {
    load();
    const id = window.setInterval(load, 6000);
    return () => window.clearInterval(id);
  }, [user]);

  function markAllAsRead() {
    markIncomingMessagesSeen(chats.map((chat) => chat.last_message).filter(Boolean) as any[], profileId);
    setStatus("Mensajes marcados como leídos.");
  }

  const ordered = useMemo(() => [...chats].sort((a, b) => {
    const da = a.last_message?.created_at || a.updated_at || a.created_at;
    const db = b.last_message?.created_at || b.updated_at || b.created_at;
    return new Date(db).getTime() - new Date(da).getTime();
  }), [chats]);

  if (loading) return <FiguShell><div className="rounded-[2rem] bg-white p-8">Cargando...</div></FiguShell>;
  if (!user) return <FiguShell><div className="rounded-[2rem] bg-white p-8 text-center"><h2 className="text-2xl font-black">Iniciá sesión</h2></div></FiguShell>;

  return (
    <FiguShell>
      <div className="mb-5 flex items-center justify-between">
        <Link href="/figus" className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm ring-1 ring-slate-200">← Home Figus</Link>
        <div className="flex flex-wrap gap-2"><button onClick={markAllAsRead} className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-emerald-700 shadow-sm ring-1 ring-emerald-100">Marcar todo leído</button><Link href="/figus/guiado" className="rounded-2xl bg-[#0D1B2A] px-5 py-3 text-sm font-black text-white shadow-sm">Buscar intercambios</Link></div>
      </div>

      <section className="rounded-[2.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
        <div className="mb-6">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-[#2563EB]">Mensajes</p>
          <h1 className="mt-1 text-4xl font-black text-[#0D1B2A]">Tus chats</h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            Entrá a cualquier conversación abierta para coordinar intercambios.
          </p>
        </div>

        {ordered.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-slate-300 p-10 text-center">
            <p className="text-lg font-black text-[#0D1B2A]">No tenés chats abiertos.</p>
            <p className="mt-2 text-sm font-semibold text-slate-500">{status}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {ordered.map((chat) => {
              const other = chat.user1_id === profileId ? chat.user2 : chat.user1;
              const msg = chat.last_message;

              return (
                <Link key={chat.id} href={`/figus/chat/${chat.id}`} className="block rounded-[2rem] bg-slate-50 p-5 ring-1 ring-slate-200 transition hover:-translate-y-1 hover:bg-emerald-50 hover:shadow-lg">
                  <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                    <div>
                      <h2 className="text-2xl font-black text-[#0D1B2A]">{other?.display_name || other?.email || "Usuario"}</h2>
                      <p className="mt-1 text-sm font-bold text-slate-600">{exchangeText(chat, profileId)}</p>
                      <p className="mt-2 line-clamp-1 text-sm font-semibold text-slate-500">
                        {msg ? `${msg.sender_id === profileId ? "Vos: " : ""}${msg.message}` : "Sin mensajes todavía."}
                      </p>
                    </div>
                    <span className="rounded-2xl bg-[#0D1B2A] px-4 py-3 text-center text-sm font-black text-white">Abrir chat</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <p className="mt-4 text-sm font-semibold text-slate-500">{status}</p>
      </section>
    </FiguShell>
  );
}
