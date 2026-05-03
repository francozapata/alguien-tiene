"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { updatePublicationStatus } from "@/services/publications";
import { PublicationStatus } from "@/types/publication";

type Props = {
  publicationId: string;
  currentStatus: PublicationStatus;
  authorFirebaseUid?: string | null;
};

export default function PublicationStatusSelect({
  publicationId,
  currentStatus,
  authorFirebaseUid,
}: Props) {
  const router = useRouter();
  const { user } = useAuth();

  const [status, setStatus] = useState<PublicationStatus>(currentStatus);
  const [saving, setSaving] = useState(false);

  const canEdit = user?.uid && authorFirebaseUid && user.uid === authorFirebaseUid;

  if (!canEdit) return null;

  async function handleChange(newStatus: PublicationStatus) {
    try {
      setSaving(true);
      setStatus(newStatus);

      await updatePublicationStatus(publicationId, newStatus);

      router.refresh();
    } catch (error) {
      console.error(error);
      setStatus(currentStatus);
      alert("No se pudo cambiar el estado.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <select
      value={status}
      disabled={saving}
      onChange={(e) => handleChange(e.target.value as PublicationStatus)}
      className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 disabled:opacity-60"
    >
      <option value="ACTIVA">Activa</option>
      <option value="PAUSADA">Pausada</option>
      <option value="RESUELTA">Resuelta</option>
    </select>
  );
}