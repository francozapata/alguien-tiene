"use client";

import { parseFiguInput } from "@/services/figus";

export function FiguInput({
  label,
  value,
  onChange,
  placeholder = "Ej: 1, 2, 15, 144",
}: {
  label: string;
  value: number[];
  onChange: (figus: number[]) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-800">{label}</span>
      <textarea
        rows={4}
        value={value.join(", ")}
        onChange={(event) => onChange(parseFiguInput(event.target.value))}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-500"
      />
      <p className="mt-2 text-xs font-semibold text-slate-500">
        Se aceptan números separados por coma, espacios o saltos de línea. Solo se guardan del 1 al 980.
      </p>
    </label>
  );
}
