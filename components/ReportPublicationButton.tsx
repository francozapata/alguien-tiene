"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createReport } from "@/services/reports";
import { getOrCreateProfile } from "@/services/profiles";

type Props = {
  publicationId: string;
  authorFirebaseUid?: string | null;
};

export default function ReportPublicationButton({
  publicationId,
  authorFirebaseUid,
}: Props) {
  const { user } = useAuth();

  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("PUBLICACION_INAPROPIADA");
  const [details, setDetails] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [reporterId, setReporterId] = useState<string | null>(null);

  const isOwnPublication = Boolean(
    user?.uid && authorFirebaseUid && user.uid === authorFirebaseUid
  );

  useEffect(() => {
    async function loadReporterProfile() {
      if (!user || isOwnPublication) return;

      try {
        const profile = await getOrCreateProfile(user);
        setReporterId(profile.id);
      } catch (error) {
        console.error(error);
      }
    }

    loadReporterProfile();
  }, [user, isOwnPublication]);

  async function handleSubmit() {
    if (!user) {
      alert("Tenés que iniciar sesión para reportar una publicación.");
      return;
    }

    if (isOwnPublication) return;

    try {
      setSaving(true);

      await createReport({
        publication_id: publicationId,
        reporter_id: reporterId,
        reason,
        details: details.trim() || null,
      });

      setDone(true);
      setOpen(false);
      setDetails("");
    } catch (error) {
      console.error(error);
      alert("No se pudo enviar el reporte.");
    } finally {
      setSaving(false);
    }
  }

  if (isOwnPublication) return null;

  if (!user) {
    return (
      <p className="mt-3 text-xs font-semibold text-slate-400">
        Iniciá sesión para reportar esta publicación.
      </p>
    );
  }

  if (done) {
    return (
      <div className="mt-3 rounded-2xl border border-green-100 bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
        Reporte enviado. Gracias, será revisado por administración.
      </div>
    );
  }

  return (
    <div className="mt-3">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs font-semibold text-red-500 hover:text-red-600"
        >
          Reportar publicación
        </button>
      ) : (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-3">
          <label className="block text-xs font-semibold text-red-700">
            Motivo
          </label>

          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-1 w-full rounded-xl border border-red-100 bg-white px-3 py-2 text-sm text-gray-700"
          >
            <option value="PUBLICACION_INAPROPIADA">
              Publicación inapropiada
            </option>
            <option value="ESTAFA">Posible estafa</option>
            <option value="SPAM">Spam</option>
            <option value="DATO_FALSO">Dato falso</option>
            <option value="OTRO">Otro</option>
          </select>

          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Opcional: contanos un poco más"
            className="mt-2 min-h-20 w-full rounded-xl border border-red-100 bg-white px-3 py-2 text-sm text-gray-700"
          />

          <div className="mt-2 flex gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={handleSubmit}
              className="rounded-xl bg-red-500 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Enviando..." : "Enviar reporte"}
            </button>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-gray-600"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
