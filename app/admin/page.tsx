"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getOrCreateProfile } from "@/services/profiles";
import { supabase } from "@/lib/supabase";
import { clearUserSubscription, getBenefitDetails, getDaysLeft, getPlanExpirationText, getPlanLabel, grantUserSubscription, PlanType } from "@/services/subscriptions";

type Report = {
  id: string;
  reason: string;
  details: string | null;
  status: "PENDIENTE" | "REVISADO" | "DESCARTADO";
  created_at: string;
  publications: {
    id: string;
    title: string;
    status: string;
    deleted_at: string | null;
  } | null;
};

type AdminPublication = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  mode: string;
  category: string;
  city: string | null;
  neighborhood: string | null;
  is_featured: boolean;
  created_at: string;
  deleted_at: string | null;
};


type AdminUser = {
  id: string;
  firebase_uid: string | null;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: string | null;
  is_blocked: boolean | null;
  blocked_reason: string | null;
  created_at: string | null;
  plan_type: string | null;
  is_premium: boolean | null;
  premium_until: string | null;
  boosts_available: number | null;
  instant_searches_available: number | null;
  radar_uses_available: number | null;
  plan_granted_by_admin: boolean | null;
  plan_notes: string | null;
  plan_updated_at: string | null;
};

type AdminTab = "REPORTES" | "PUBLICACIONES" | "BORRADAS" | "USUARIOS";

export default function AdminPage() {
  const { user, loading } = useAuth();

  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [publications, setPublications] = useState<AdminPublication[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [adminTab, setAdminTab] = useState<AdminTab>("REPORTES");

  useEffect(() => {
    async function loadAdmin() {
      if (!user) {
        setChecking(false);
        return;
      }

      const profile = await getOrCreateProfile(user);

      const isEmailAdmin = user.email?.toLowerCase() === "francogonzalozapata@gmail.com";
      if (profile.role !== "ADMIN" && !isEmailAdmin) {
        setIsAdmin(false);
        setChecking(false);
        return;
      }

      if (isEmailAdmin && profile.role !== "ADMIN") {
        await supabase.from("profiles").update({ role: "ADMIN" }).eq("id", profile.id);
      }

      setIsAdmin(true);

      const { data: reportsData } = await supabase
        .from("reports")
        .select(`
          id,
          reason,
          details,
          status,
          created_at,
          publications:publication_id (
            id,
            title,
            status,
            deleted_at
          )
        `)
        .eq("status", "PENDIENTE")
        .order("created_at", { ascending: false });

      const pendingReports = ((reportsData || []) as unknown as Report[]).filter(
        (report) => !report.publications?.deleted_at
      );

      setReports(pendingReports);

      const { data: publicationsData } = await supabase
        .from("publications")
        .select(`
          id,
          title,
          description,
          status,
          mode,
          category,
          city,
          neighborhood,
          is_featured,
          created_at,
          deleted_at
        `)
        .order("created_at", { ascending: false });

      setPublications((publicationsData || []) as AdminPublication[]);

      const { data: usersData } = await supabase
        .from("profiles")
        .select("id, firebase_uid, email, display_name, avatar_url, role, is_blocked, blocked_reason, created_at, plan_type, is_premium, premium_until, boosts_available, instant_searches_available, radar_uses_available, plan_granted_by_admin, plan_notes, plan_updated_at")
        .order("created_at", { ascending: false });

      setUsers((usersData || []) as AdminUser[]);
      setChecking(false);
    }

    loadAdmin();
  }, [user]);

  async function hidePublication(publicationId: string, reportId?: string) {
    const ok = confirm("¿Seguro que querés ocultar esta publicación?");
    if (!ok) return;

    const { error } = await supabase
      .from("publications")
      .update({
        status: "PAUSADA",
        is_active: false,
      })
      .eq("id", publicationId);

    if (error) {
      alert("No se pudo ocultar la publicación.");
      return;
    }

    if (reportId) {
      await supabase
        .from("reports")
        .update({ status: "REVISADO" })
        .eq("id", reportId);

      setReports((prev) => prev.filter((report) => report.id !== reportId));
    }

    setPublications((prev) =>
      prev.map((pub) =>
        pub.id === publicationId ? { ...pub, status: "PAUSADA" } : pub
      )
    );
  }

  async function reactivatePublication(publicationId: string, reportId: string) {
    const ok = confirm("¿Seguro que querés reactivar esta publicación?");
    if (!ok) return;

    const { error } = await supabase
      .from("publications")
      .update({
        status: "ACTIVA",
        is_active: true,
      })
      .eq("id", publicationId);

    if (error) {
      alert("No se pudo reactivar la publicación.");
      return;
    }

    await supabase
      .from("reports")
      .update({ status: "DESCARTADO" })
      .eq("id", reportId);

    setReports((prev) => prev.filter((report) => report.id !== reportId));

    setPublications((prev) =>
      prev.map((pub) =>
        pub.id === publicationId ? { ...pub, status: "ACTIVA" } : pub
      )
    );
  }

  async function deletePublication(publicationId: string, reportId?: string) {
    const ok = confirm(
      "¿Seguro que querés eliminar esta publicación? No volverá a mostrarse."
    );
    if (!ok) return;

    const deletedAt = new Date().toISOString();

    const { error } = await supabase
      .from("publications")
      .update({
        deleted_at: deletedAt,
        status: "PAUSADA",
        is_active: false,
      })
      .eq("id", publicationId);

    if (error) {
      alert("No se pudo eliminar la publicación.");
      return;
    }

    if (reportId) {
      await supabase
        .from("reports")
        .update({ status: "REVISADO" })
        .eq("id", reportId);

      setReports((prev) => prev.filter((report) => report.id !== reportId));
    }

    setPublications((prev) =>
      prev.map((pub) =>
        pub.id === publicationId
          ? { ...pub, deleted_at: deletedAt, status: "PAUSADA" }
          : pub
      )
    );
  }


  async function toggleFeatured(publicationId: string, currentValue: boolean) {
    const { error } = await supabase
      .from("publications")
      .update({ is_featured: !currentValue })
      .eq("id", publicationId);

    if (error) {
      alert("No se pudo actualizar el destacado.");
      return;
    }

    setPublications((prev) =>
      prev.map((pub) =>
        pub.id === publicationId ? { ...pub, is_featured: !currentValue } : pub
      )
    );
  }

  function publicationStatusLabel(
    status?: string | null,
    deletedAt?: string | null
  ) {
    if (deletedAt) return "ELIMINADA";
    return status || "SIN ESTADO";
  }

  function publicationStatusClass(
    status?: string | null,
    deletedAt?: string | null
  ) {
    if (deletedAt) return "text-red-600";
    if (status === "ACTIVA") return "text-green-600";
    if (status === "PAUSADA") return "text-orange-600";
    return "text-blue-600";
  }



  async function grantPlanToUser(targetUser: AdminUser, planType: PlanType) {
    const daysRaw = prompt(`¿Cuántos días querés dar de ${planType}?`, planType === "EXTRAS" ? "7" : "7");
    const days = Number(daysRaw || 7);
    if (!Number.isFinite(days) || days <= 0) return;

    const boostsRaw = prompt("Boosts disponibles:", planType === "PRO_TOTAL" ? "10" : planType === "EXTRAS" ? "3" : "0");
    const instantRaw = prompt("Búsquedas instantáneas disponibles:", planType === "PRO_TOTAL" ? "999" : planType === "EXTRAS" ? "5" : "0");
    const radarRaw = prompt("Radar cercano disponible:", planType === "PRO_TOTAL" ? "999" : planType === "EXTRAS" ? "3" : "0");
    const notes = prompt("Nota interna del beneficio:", `Otorgado manualmente por admin: ${planType}`);

    try {
      await grantUserSubscription({
        userId: targetUser.id,
        planType,
        days,
        boosts: Number(boostsRaw || 0),
        instantSearches: Number(instantRaw || 0),
        radarUses: Number(radarRaw || 0),
        notes: notes || `Otorgado manualmente por admin: ${planType}`,
      });
      alert("Beneficio aplicado.");
      window.location.reload();
    } catch (error) {
      alert(error instanceof Error ? error.message : "No se pudo aplicar.");
    }
  }

  async function editUserExtras(targetUser: AdminUser) {
    const boostsRaw = prompt("Nuevo saldo de boosts:", String(targetUser.boosts_available ?? 0));
    if (boostsRaw === null) return;
    const instantRaw = prompt("Nuevo saldo de búsquedas instantáneas:", String(targetUser.instant_searches_available ?? 0));
    if (instantRaw === null) return;
    const radarRaw = prompt("Nuevo saldo de radar cercano:", String(targetUser.radar_uses_available ?? 0));
    if (radarRaw === null) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        boosts_available: Math.max(0, Number(boostsRaw || 0)),
        instant_searches_available: Math.max(0, Number(instantRaw || 0)),
        radar_uses_available: Math.max(0, Number(radarRaw || 0)),
        plan_updated_at: new Date().toISOString(),
      })
      .eq("id", targetUser.id);

    if (error) {
      alert("No se pudieron editar los extras.");
      return;
    }

    window.location.reload();
  }

  async function extendPremiumDays(targetUser: AdminUser) {
    const daysRaw = prompt("¿Cuántos días querés sumar?", "7");
    const days = Number(daysRaw || 0);
    if (!Number.isFinite(days) || days <= 0) return;

    const current = targetUser.premium_until ? new Date(targetUser.premium_until).getTime() : Date.now();
    const baseTime = Math.max(current, Date.now());
    const nextUntil = new Date(baseTime + days * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from("profiles")
      .update({
        is_premium: true,
        plan_type: targetUser.plan_type === "PRO_TOTAL" ? "PRO_TOTAL" : "PREMIUM",
        premium_until: nextUntil,
        plan_granted_by_admin: true,
        plan_notes: `Admin sumó ${days} días`,
        plan_updated_at: new Date().toISOString(),
      })
      .eq("id", targetUser.id);

    if (error) {
      alert("No se pudieron sumar días.");
      return;
    }

    window.location.reload();
  }

  async function clearPlanFromUser(targetUser: AdminUser) {
    const ok = confirm(`¿Quitar plan y extras de ${targetUser.email || targetUser.display_name}?`);
    if (!ok) return;

    try {
      await clearUserSubscription(targetUser.id);
      alert("Plan quitado.");
      window.location.reload();
    } catch (error) {
      alert(error instanceof Error ? error.message : "No se pudo quitar.");
    }
  }

  async function toggleBlockUser(targetUser: AdminUser) {
    if (targetUser.email?.toLowerCase() === "francogonzalozapata@gmail.com") {
      alert("No podés bloquear la cuenta administradora principal.");
      return;
    }

    const nextBlocked = !targetUser.is_blocked;
    const reason = nextBlocked ? prompt("Motivo del bloqueo:", "Incumplimiento de normas") || "Bloqueado por administración" : null;

    const { error } = await supabase
      .from("profiles")
      .update({
        is_blocked: nextBlocked,
        blocked_reason: reason,
        blocked_at: nextBlocked ? new Date().toISOString() : null,
      })
      .eq("id", targetUser.id);

    if (error) {
      alert("No se pudo actualizar el usuario.");
      return;
    }

    setUsers((prev) =>
      prev.map((u) => u.id === targetUser.id ? { ...u, is_blocked: nextBlocked, blocked_reason: reason } : u)
    );
  }

  async function resetUserAlbum(targetUser: AdminUser) {
    const ok = confirm(`¿Resetear álbum y figuritas de ${targetUser.email || targetUser.display_name}? Esto vuelve su álbum a cero.`);
    if (!ok) return;

    const { data: album } = await supabase
      .from("albums")
      .select("id")
      .eq("name", "Mundial 2026")
      .maybeSingle();

    if (!album?.id) {
      alert("No se encontró el álbum Mundial 2026.");
      return;
    }

    await supabase.from("user_album_progress").delete().eq("user_id", targetUser.id).eq("album_id", album.id);
    await supabase.from("user_repeated_figus").delete().eq("user_id", targetUser.id).eq("album_id", album.id);
    await supabase.from("figu_requests").update({ is_active: false }).eq("user_id", targetUser.id).eq("album_id", album.id);
    await supabase.from("figu_matches").update({ is_active: false }).eq("album_id", album.id).or(`user1_id.eq.${targetUser.id},user2_id.eq.${targetUser.id}`);

    alert("Álbum reseteado.");
  }

  async function adminReportUser(targetUser: AdminUser) {
    const reason = prompt("Motivo del reporte de usuario:", "Conducta sospechosa");
    if (!reason) return;

    const { error } = await supabase.from("user_reports").insert({
      reported_user_id: targetUser.id,
      reason,
      details: "Reporte generado desde panel admin",
      status: "PENDIENTE",
    });

    if (error) {
      alert("No se pudo reportar el usuario.");
      return;
    }

    alert("Usuario reportado.");
  }


  const visiblePublications = publications.filter((pub) => !pub.deleted_at);
  const deletedPublications = publications.filter((pub) => pub.deleted_at);

  if (loading || checking) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <section className="mx-auto max-w-5xl rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-gray-600">Cargando panel...</p>
        </section>
      </main>
    );
  }

  if (!user || !isAdmin) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <section className="mx-auto max-w-3xl rounded-3xl bg-white p-6 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-red-600">Acceso denegado</h1>
          <p className="mt-2 text-gray-600">
            No tenés permisos para entrar al panel admin.
          </p>
          <Link
            href="/"
            className="mt-5 inline-block rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white"
          >
            Volver al inicio
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto max-w-6xl">
        <div className="mb-6 rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Administración
          </p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            Panel admin básico
          </h1>
          <p className="mt-2 text-gray-600">
            Revisá reportes, publicaciones y usuarios de la plataforma.
          </p>
        </div>

        <div className="mb-4 flex gap-3 rounded-3xl bg-white p-3 shadow-sm">
          <button
            type="button"
            onClick={() => setAdminTab("REPORTES")}
            className={`flex-1 rounded-2xl px-4 py-3 text-sm font-bold transition ${
              adminTab === "REPORTES"
                ? "bg-blue-600 text-white"
                : "bg-slate-50 text-gray-700 hover:bg-slate-100"
            }`}
          >
            Reportes pendientes
          </button>

          <button
            type="button"
            onClick={() => setAdminTab("PUBLICACIONES")}
            className={`flex-1 rounded-2xl px-4 py-3 text-sm font-bold transition ${
              adminTab === "PUBLICACIONES"
                ? "bg-blue-600 text-white"
                : "bg-slate-50 text-gray-700 hover:bg-slate-100"
            }`}
          >
            Todas las publicaciones
          </button>

          <button
            type="button"
            onClick={() => setAdminTab("USUARIOS")}
            className={`flex-1 rounded-2xl px-4 py-3 text-sm font-bold transition ${
              adminTab === "USUARIOS"
                ? "bg-blue-600 text-white"
                : "bg-slate-50 text-gray-700 hover:bg-slate-100"
            }`}
          >
            Usuarios
          </button>
        </div>

        <div className="mb-6 flex justify-end">
          <button
            type="button"
            onClick={() => setAdminTab("BORRADAS")}
            className={`rounded-2xl px-4 py-2 text-xs font-bold transition ${
              adminTab === "BORRADAS"
                ? "bg-red-600 text-white"
                : "bg-red-50 text-red-600 hover:bg-red-100"
            }`}
          >
            Publicaciones borradas
          </button>
        </div>

        {adminTab === "REPORTES" && (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">
              Reportes pendientes
            </h2>

            {reports.length === 0 ? (
              <p className="mt-4 text-gray-500">
                No hay reportes pendientes.
              </p>
            ) : (
              <div className="mt-5 space-y-4">
                {reports.map((report) => (
                  <article
                    key={report.id}
                    className="rounded-2xl border border-gray-200 p-4"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-sm font-bold text-red-600">
                          Motivo: {report.reason}
                        </p>

                        <p className="mt-1 text-xs font-semibold text-gray-500">
                          Estado reporte:{" "}
                          <span className="text-orange-600">
                            {report.status}
                          </span>
                        </p>

                        <h3 className="mt-2 text-lg font-bold text-gray-900">
                          {report.publications?.title || "Publicación eliminada"}
                        </h3>

                        <p className="mt-1 text-xs font-semibold text-gray-500">
                          Estado publicación:{" "}
                          <span
                            className={publicationStatusClass(
                              report.publications?.status,
                              report.publications?.deleted_at
                            )}
                          >
                            {publicationStatusLabel(
                              report.publications?.status,
                              report.publications?.deleted_at
                            )}
                          </span>
                        </p>

                        {report.details && (
                          <p className="mt-2 text-sm text-gray-600">
                            Detalle: {report.details}
                          </p>
                        )}

                        <p className="mt-2 text-xs text-gray-400">
                          {new Date(report.created_at).toLocaleString("es-AR")}
                        </p>
                      </div>

                      {report.publications?.id && !report.publications.deleted_at ? (
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <button
                            type="button"
                            onClick={() =>
                              hidePublication(report.publications!.id, report.id)
                            }
                            className="rounded-xl bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                          >
                            Ocultar
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              deletePublication(report.publications!.id, report.id)
                            }
                            className="rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
                          >
                            Eliminar
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              reactivatePublication(report.publications!.id, report.id)
                            }
                            className="rounded-xl bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700"
                          >
                            Reactivar
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm font-semibold text-gray-400">
                          Sin acciones disponibles
                        </p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {adminTab === "PUBLICACIONES" && (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">
              Todas las publicaciones
            </h2>

            {visiblePublications.length === 0 ? (
              <p className="mt-4 text-gray-500">
                Todavía no hay publicaciones visibles.
              </p>
            ) : (
              <div className="mt-5 space-y-4">
                {visiblePublications.map((pub) => (
                  <article
                    key={pub.id}
                    className="rounded-2xl border border-gray-200 p-4"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {pub.title}
                        </h3>

                        <p className="mt-1 text-xs font-semibold text-gray-500">
                          Estado publicación:{" "}
                          <span
                            className={publicationStatusClass(
                              pub.status,
                              pub.deleted_at
                            )}
                          >
                            {publicationStatusLabel(pub.status, pub.deleted_at)}
                          </span>
                        </p>

                        <p className="mt-2 text-sm text-gray-600">
                          {pub.mode} · {pub.category}
                          {pub.city ? ` · ${pub.city}` : ""}
                          {pub.neighborhood ? ` · ${pub.neighborhood}` : ""}
                        </p>

                        {pub.is_featured && (
                          <p className="mt-2 inline-block rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-800">
                            ⭐ Destacada
                          </p>
                        )}

                        {pub.description && (
                          <p className="mt-2 text-sm text-gray-500">
                            {pub.description}
                          </p>
                        )}

                        <p className="mt-2 text-xs text-gray-400">
                          {new Date(pub.created_at).toLocaleString("es-AR")}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row">
                        {pub.category === "EMPRENDIMIENTOS" && (
                          <button
                            type="button"
                            onClick={() => toggleFeatured(pub.id, pub.is_featured)}
                            className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                              pub.is_featured
                                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                : "bg-emerald-600 text-white hover:bg-emerald-700"
                            }`}
                          >
                            {pub.is_featured ? "Quitar destacado" : "Destacar"}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => hidePublication(pub.id)}
                          className="rounded-xl bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                        >
                          Ocultar
                        </button>

                        <button
                          type="button"
                          onClick={() => deletePublication(pub.id)}
                          className="rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}


        {adminTab === "USUARIOS" && (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">
              Usuarios
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Solo la cuenta administradora puede bloquear usuarios, reportarlos o resetear álbumes.
            </p>

            {users.length === 0 ? (
              <p className="mt-4 text-gray-500">No hay usuarios cargados.</p>
            ) : (
              <div className="mt-5 space-y-4">
                {users.map((appUser) => (
                  <article key={appUser.id} className="rounded-2xl border border-gray-200 p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 overflow-hidden rounded-2xl bg-blue-50">
                          {appUser.avatar_url ? (
                            <img src={appUser.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center font-black text-blue-700">
                              {(appUser.display_name || appUser.email || "U").charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{appUser.display_name || "Sin nombre"}</h3>
                          <p className="text-sm font-semibold text-gray-500">{appUser.email || "Sin email"}</p>
                          <div className="mt-1 flex flex-wrap gap-2">
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{appUser.role || "USER"}</span>
                            {appUser.is_blocked ? (
                              <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">BLOQUEADO</span>
                            ) : (
                              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">ACTIVO</span>
                            )}
                          </div>
                          {appUser.blocked_reason ? <p className="mt-2 text-xs text-red-600">Motivo: {appUser.blocked_reason}</p> : null}

                          <div className="mt-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Suscripción y beneficios</p>
                            <p className="mt-1 text-sm font-black text-slate-800">
                              {appUser.is_premium && appUser.premium_until && getDaysLeft(appUser.premium_until) > 0
                                ? `${getPlanLabel(appUser.plan_type)} · ${getDaysLeft(appUser.premium_until)} días restantes`
                                : getPlanLabel(appUser.plan_type)}
                            </p>
                            <p className="mt-1 text-xs font-bold text-slate-500">
                              {getPlanExpirationText({
                                plan_type: (appUser.plan_type as PlanType) || "FREE",
                                is_premium: Boolean(appUser.is_premium),
                                premium_until: appUser.premium_until,
                                boosts_available: appUser.boosts_available ?? 0,
                                instant_searches_available: appUser.instant_searches_available ?? 0,
                                radar_uses_available: appUser.radar_uses_available ?? 0,
                                plan_granted_by_admin: Boolean(appUser.plan_granted_by_admin),
                                plan_notes: appUser.plan_notes,
                              })}
                            </p>
                            <div className="mt-3 grid gap-2 md:grid-cols-2">
                              {getBenefitDetails({
                                plan_type: (appUser.plan_type as PlanType) || "FREE",
                                is_premium: Boolean(appUser.is_premium),
                                premium_until: appUser.premium_until,
                                boosts_available: appUser.boosts_available ?? 0,
                                instant_searches_available: appUser.instant_searches_available ?? 0,
                                radar_uses_available: appUser.radar_uses_available ?? 0,
                                plan_granted_by_admin: Boolean(appUser.plan_granted_by_admin),
                                plan_notes: appUser.plan_notes,
                              }).map((benefit) => (
                                <div key={benefit.key} className="rounded-xl bg-white p-2 ring-1 ring-slate-200">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{benefit.label}</p>
                                  <p className="text-xs font-black text-slate-800">{benefit.value}</p>
                                </div>
                              ))}
                            </div>
                            {appUser.premium_until ? <p className="mt-2 text-xs font-bold text-slate-400">Vence: {new Date(appUser.premium_until).toLocaleDateString("es-AR")}</p> : null}
                            {appUser.plan_notes ? <p className="mt-1 text-xs font-bold text-slate-400">Nota: {appUser.plan_notes}</p> : null}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => toggleBlockUser(appUser)}
                          className={`rounded-xl px-3 py-2 text-sm font-semibold text-white ${appUser.is_blocked ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
                        >
                          {appUser.is_blocked ? "Desbloquear" : "Bloquear"}
                        </button>
                        <button
                          type="button"
                          onClick={() => adminReportUser(appUser)}
                          className="rounded-xl bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                        >
                          Reportar
                        </button>
                        <button
                          type="button"
                          onClick={() => resetUserAlbum(appUser)}
                          className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                        >
                          Resetear álbum
                        </button>
                        <button type="button" onClick={() => grantPlanToUser(appUser, "PREMIUM")} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                          Dar Premium
                        </button>
                        <button type="button" onClick={() => grantPlanToUser(appUser, "EXTRAS")} className="rounded-xl bg-yellow-500 px-3 py-2 text-sm font-semibold text-white hover:bg-yellow-600">
                          Dar Extras
                        </button>
                        <button type="button" onClick={() => grantPlanToUser(appUser, "PRO_TOTAL")} className="rounded-xl bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700">
                          Dar Pro Total
                        </button>
                        <button type="button" onClick={() => extendPremiumDays(appUser)} className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                          Sumar días
                        </button>
                        <button type="button" onClick={() => editUserExtras(appUser)} className="rounded-xl bg-cyan-600 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-700">
                          Editar extras
                        </button>
                        <button type="button" onClick={() => clearPlanFromUser(appUser)} className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-50">
                          Quitar plan
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {adminTab === "BORRADAS" && (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-red-600">
              Publicaciones borradas
            </h2>

            {deletedPublications.length === 0 ? (
              <p className="mt-4 text-gray-500">
                No hay publicaciones borradas.
              </p>
            ) : (
              <div className="mt-5 space-y-4">
                {deletedPublications.map((pub) => (
                  <article
                    key={pub.id}
                    className="rounded-2xl border border-red-100 bg-red-50/40 p-4"
                  >
                    <h3 className="text-lg font-bold text-gray-900">
                      {pub.title}
                    </h3>

                    <p className="mt-1 text-xs font-semibold text-red-600">
                      Estado publicación: ELIMINADA
                    </p>

                    <p className="mt-2 text-sm text-gray-600">
                      {pub.mode} · {pub.category}
                      {pub.city ? ` · ${pub.city}` : ""}
                      {pub.neighborhood ? ` · ${pub.neighborhood}` : ""}
                    </p>

                    {pub.description && (
                      <p className="mt-2 text-sm text-gray-500">
                        {pub.description}
                      </p>
                    )}

                    <p className="mt-2 text-xs text-gray-400">
                      Creada: {new Date(pub.created_at).toLocaleString("es-AR")}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}