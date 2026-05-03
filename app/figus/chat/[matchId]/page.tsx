"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { FiguShell } from "@/components/figus/FiguShell";
import { FiguChatMessage, FiguMatch } from "@/types/figus";
import { getMatchWithMessages, hideFiguChat, reportFiguUser, saveFiguReview, sendFiguMessage } from "@/services/figus";
import { notifyLocalMatch } from "@/utils/notifications";
import { supabase } from "@/lib/supabase";
import { formatStickerList } from "@/lib/figus/catalog";


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

function distanceLabel(distance?: number | null) {
  if (distance === null || distance === undefined) return "Ubicación por confirmar";
  if (distance < 1) return `A ${Math.round(distance * 1000)} m`;
  return `A ${distance} km`;
}

export default function FiguChatPage() {
  const params = useParams<{ matchId: string }>();
  const matchId = params.matchId;
  const { user, loading } = useAuth();
  const [profileId, setProfileId] = useState("");
  const [match, setMatch] = useState<FiguMatch | null>(null);
  const [messages, setMessages] = useState<FiguChatMessage[]>([]);
  const [text, setText] = useState("");
  const [status, setStatus] = useState("Cargando chat...");
  const [sending, setSending] = useState(false);
  const [reviewStatus, setReviewStatus] = useState("");
  const knownMessageIds = useRef<Set<string>>(new Set());
  const initialized = useRef(false);

  async function load(options?: { silent?: boolean }) {
    if (!user) return;
    try {
      const data = await getMatchWithMessages(user, matchId);
      const nextMessages = data.messages as FiguChatMessage[];

      setProfileId(data.profile.id);
      setMatch(data.match as FiguMatch);
      setMessages(nextMessages);
      markIncomingMessagesSeen(nextMessages, data.profile.id);
      if (!options?.silent) setStatus("Chat cargado.");

      const nextIds = new Set<string>();
      for (const message of nextMessages) {
        nextIds.add(message.id);
        if (initialized.current && message.sender_id !== data.profile.id && !knownMessageIds.current.has(message.id)) {
          notifyLocalMatch("Nuevo mensaje en Alguien Tiene", message.message);
        }
      }
      knownMessageIds.current = nextIds;
      initialized.current = true;
    } catch (error) {
      if (!options?.silent) setStatus(error instanceof Error ? error.message : "No se pudo cargar.");
    }
  }

  useEffect(() => {
    load();
    const id = window.setInterval(() => load({ silent: true }), 4000);

    const channel = supabase
      .channel(`figu-chat-${matchId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "figu_chat_messages", filter: `match_id=eq.${matchId}` }, () => {
        load({ silent: true });
      })
      .subscribe();

    return () => {
      window.clearInterval(id);
      supabase.removeChannel(channel);
    };
  }, [user, matchId]);

  async function proposeMeeting() {
    if (!user) return;
    const proposal = window.prompt("Proponer punto de encuentro:", "¿Te parece encontrarnos en un punto público y con movimiento?");
    if (!proposal) return;
    setText(`📍 Propuesta de encuentro: ${proposal}`);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !text.trim()) return;
    setSending(true);
    try {
      await sendFiguMessage(user, matchId, text);
      setText("");
      await load();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "No se pudo enviar.");
    } finally {
      setSending(false);
    }
  }

  async function deleteChat() {
    if (!user) return;
    const ok = window.confirm("¿Querés borrar este chat de tu lista? Solo se ocultará para vos.");
    if (!ok) return;

    try {
      await hideFiguChat(user, matchId);
      window.location.href = "/figus/chats";
    } catch (error) {
      setReviewStatus(error instanceof Error ? error.message : "No se pudo borrar el chat.");
    }
  }

  async function reportUser() {
    if (!user) return;
    const reason = prompt("Motivo del reporte:", "Conducta sospechosa");
    if (!reason) return;
    const details = prompt("Detalle opcional:", "") || "";
    try {
      await reportFiguUser(user, matchId, reason, details);
      setReviewStatus("Usuario reportado. Administración lo revisará.");
    } catch (error) {
      setReviewStatus(error instanceof Error ? error.message : "No se pudo reportar.");
    }
  }

  async function markReview(kind: "ok" | "noshow") {
    if (!user) return;
    try {
      await saveFiguReview(user, matchId, { rating: kind === "ok" ? 5 : 1, fulfilled: kind === "ok", noShow: kind === "noshow", goodCondition: kind === "ok", comment: kind === "ok" ? "Intercambio realizado correctamente." : "La otra persona no se presentó." });
      setReviewStatus(kind === "ok" ? "Intercambio cumplido. Álbum y repetidas actualizados automáticamente." : "Reputación guardada.");

    } catch (error) {
      setReviewStatus(error instanceof Error ? error.message : "No se pudo guardar la reputación.");
    }
  }

  if (loading) return <FiguShell><div className="rounded-[2rem] bg-white p-8">Cargando...</div></FiguShell>;
  if (!user) return <FiguShell><div className="rounded-[2rem] bg-white p-8 text-center"><h2 className="text-2xl font-black">Iniciá sesión</h2></div></FiguShell>;

  const amUser1 = match?.user1_id === profileId;
  const other = amUser1 ? match?.user2 : match?.user1;
  const iGet = amUser1 ? match?.figus_user1_gets : match?.figus_user2_gets;
  const otherGets = amUser1 ? match?.figus_user2_gets : match?.figus_user1_gets;

  return (
    <FiguShell>
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <Link href="/figus/matches" className="text-sm font-black text-[#2563EB]">← Volver a matches</Link>
              <h2 className="mt-2 text-3xl font-black text-[#0D1B2A]">Chat con {other?.display_name || other?.email || "usuario"}</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">{status}</p>
            </div>
          </div>

          <div className="mb-4 min-h-[420px] space-y-3 rounded-[2rem] bg-slate-50 p-4">
            {messages.length === 0 ? (
              <div className="flex h-[360px] items-center justify-center text-center text-sm font-bold text-slate-500">Todavía no hay mensajes. Escribí para coordinar el intercambio.</div>
            ) : messages.map((message) => {
              const mine = message.sender_id === profileId;
              return (
                <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-3xl px-4 py-3 text-sm font-semibold ${mine ? "bg-[#2563EB] text-white" : "bg-white text-slate-800 shadow-sm ring-1 ring-slate-200"}`}>
                    <p>{message.message}</p>
                    <p className={`mt-1 text-[10px] font-bold ${mine ? "text-sky-100" : "text-slate-400"}`}>{new Date(message.created_at).toLocaleString("es-AR")}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleSend} className="grid gap-3 md:grid-cols-[1fr_auto]">
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Escribir mensaje..." className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-sky-500" />
            <button disabled={sending} className="rounded-2xl bg-[#0D1B2A] px-5 py-3 text-sm font-black text-white disabled:opacity-60">{sending ? "Enviando..." : "Enviar"}</button>
          </form>
        </section>

        <aside className="space-y-5">
          <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
            <h3 className="text-xl font-black text-[#0D1B2A]">Intercambio</h3>
            <div className="mt-3 rounded-3xl bg-slate-50 p-4"><p className="text-sm font-black">Estado</p><p className="mt-2 text-sm font-semibold text-slate-700">Chat abierto para coordinar. Si marcás “Cumplió”, se actualizan automáticamente los álbumes y repetidas.</p></div>
            <div className="mt-4 rounded-3xl bg-emerald-50 p-4"><p className="text-sm font-black">Vos recibís</p><p className="mt-2 text-sm font-semibold text-slate-700">{formatStickerList(iGet, 12)}</p></div>
            <div className="mt-3 rounded-3xl bg-sky-50 p-4"><p className="text-sm font-black">La otra persona recibe</p><p className="mt-2 text-sm font-semibold text-slate-700">{formatStickerList(otherGets, 12)}</p></div>
            <div className="mt-3 rounded-3xl bg-amber-50 p-4"><p className="text-sm font-black">Encuentro sugerido</p><p className="mt-2 text-sm font-semibold text-slate-700">{match?.meeting_suggestion || "Punto público y seguro."}</p><p className="mt-2 text-xs font-black text-emerald-700">📍 {distanceLabel(match?.distance_km)}</p></div>
            <div className="mt-3 rounded-3xl bg-violet-50 p-4"><p className="text-sm font-black">Reputación</p><div className="mt-3 grid grid-cols-2 gap-2"><button onClick={() => markReview("ok")} className="rounded-2xl bg-[#22C55E] px-3 py-2 text-xs font-black text-white">Cumplió</button><button onClick={() => markReview("noshow")} className="rounded-2xl bg-red-600 px-3 py-2 text-xs font-black text-white">No apareció</button></div><button onClick={reportUser} className="mt-2 w-full rounded-2xl bg-orange-500 px-3 py-2 text-xs font-black text-white">Reportar usuario</button><button onClick={deleteChat} className="mt-2 w-full rounded-2xl bg-red-50 px-3 py-2 text-xs font-black text-red-700 ring-1 ring-red-100">Borrar chat de mi lista</button><p className="mt-2 text-xs font-bold text-slate-500">{reviewStatus}</p></div>
          </div>
        </aside>
      </div>
    </FiguShell>
  );
}
