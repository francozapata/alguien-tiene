"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import GoogleLoginButton from "@/components/GoogleLoginButton";
import { getOrCreateProfile } from "@/services/profiles";
import { supabase } from "@/lib/supabase";

export default function PerfilPage() {
  const { user, loading } = useAuth();

  const [profileId, setProfileId] = useState("");
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;

      const profile = await getOrCreateProfile(user);

      setProfileId(profile.id);
      setName(profile.display_name || user.displayName || "");
      setAvatarUrl(user.photoURL || profile.avatar_url || null);
    }

    loadProfile();
  }, [user]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setMessage("");

    if (!user || !profileId) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: name.trim() || user.displayName || user.email,
          avatar_url: user.photoURL,
        })
        .eq("id", profileId);

      if (error) throw error;

      setAvatarUrl(user.photoURL || null);
      setMessage("Perfil actualizado correctamente.");
    } catch (error) {
      console.error(error);
      setMessage("No se pudo actualizar el perfil.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <section className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-gray-500">Cargando perfil...</p>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <section className="mx-auto max-w-3xl rounded-3xl bg-white p-6 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-[#2563EB]">Mi perfil</h1>
          <p className="mt-3 text-gray-600">
            Iniciá sesión para ver tus datos y administrar tus publicaciones.
          </p>
          <div className="mt-5">
            <GoogleLoginButton />
          </div>
        </section>
      </main>
    );
  }

  const previewAvatar = avatarUrl;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto max-w-3xl overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className="bg-gradient-to-r from-[#0D1B2A] to-[#0D1B2A] px-6 py-10 text-white">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-200">
            Mi cuenta
          </p>
          <h1 className="mt-2 text-3xl font-bold">Perfil Figus Mundial 2026</h1>
          <p className="mt-2 text-slate-200">
            Tu cuenta se usa para cargar álbum, intercambios y coordinación de Figus Mundial 2026.
          </p>
        </div>

        <form onSubmit={handleSave} className="p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative h-24 w-24 overflow-hidden rounded-3xl bg-emerald-50">
              {previewAvatar ? (
                <img
                  src={previewAvatar}
                  alt="Foto de perfil de Google"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-[#2563EB]">
                  {(name || user.email || "U").charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1">
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-gray-700">
                  Nombre visible
                </span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 p-3 text-gray-900 outline-none focus:border-blue-500"
                  placeholder="Tu nombre"
                />
              </label>

              <p className="mt-2 text-sm text-gray-500">{user.email}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <p className="inline-block rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-700">
                  Sesión activa
                </p>
                <p className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-[#2563EB]">
                  Foto sincronizada con Google
                </p>
                <p className="inline-block rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
                  +18 confirmado al registrarte
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-600">
            Por seguridad y consistencia, la foto de perfil no se cambia desde la app. Se usa la imagen asociada a tu cuenta de Google.
          </div>

          {message && (
            <p className="mt-4 rounded-2xl bg-emerald-50 p-3 text-sm font-medium text-[#2563EB]">
              {message}
            </p>
          )}

          <button
            disabled={saving}
            className="mt-6 w-full rounded-2xl bg-[#22C55E] px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-[#16A34A] disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar nombre"}
          </button>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Link
              href="/figus"
              className="rounded-2xl border border-sky-100 bg-sky-50 p-5 font-semibold text-sky-700 hover:bg-sky-100"
            >
              Ir a Figus 2026
            </Link>
            <Link
              href="/figus/mi-album"
              className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 font-semibold text-emerald-700 hover:bg-emerald-100"
            >
              Mi álbum
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
