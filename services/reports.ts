import { supabase } from "@/lib/supabase";

type CreateReportInput = {
  publication_id: string;
  reporter_id?: string | null;
  reason: string;
  details?: string | null;
};

export async function createReport(input: CreateReportInput) {
  const { data, error } = await supabase
    .from("reports")
    .insert({
      publication_id: input.publication_id,
      reporter_id: input.reporter_id || null,
      reason: input.reason,
      details: input.details || null,
      status: "PENDIENTE",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data;
}