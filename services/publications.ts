import { supabase } from "@/lib/supabase";
import {
  PublicationCategory,
  PublicationMode,
  PublicationStatus,
} from "@/types/publication";

type CreatePublicationInput = {
  user_id: string;
  title: string;
  description: string;
  mode: PublicationMode;
  category: PublicationCategory;
  subcategory: string;
  price: number | null;
  city: string;
  neighborhood: string;
  address?: string | null;
  map_url?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  image_url?: string | null;
  urgent?: boolean;
};

type GetPublicationsFilters = {
  mode?: PublicationMode | "TODAS";
  category?: PublicationCategory | "TODAS";
  status?: PublicationStatus | "TODAS";
  city?: string;
  subcategory?: string;
  featuredOnly?: boolean;
  urgentOnly?: boolean;
};

const publicationSelect = `
  *,
  profiles:user_id (
    id,
    firebase_uid,
    display_name,
    avatar_url
  )
`;

export async function createPublication(input: CreatePublicationInput) {
  const { data, error } = await supabase
    .from("publications")
    .insert({
      ...input,
      address: input.address || null,
      map_url: input.map_url || null,
      contact_name: input.contact_name || null,
      contact_phone: input.contact_phone || null,
      is_free: input.price === null || input.price === 0,
      is_featured: false,
      urgent: Boolean(input.urgent),
      status: "ACTIVA",
      is_active: true,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getPublications(filters: GetPublicationsFilters = {}) {
  let query = supabase
    .from("publications")
    .select(publicationSelect)
    .is("deleted_at", null)
    .order("urgent", { ascending: false })
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters.status && filters.status !== "TODAS") {
    query = query.eq("status", filters.status);
  } else if (!filters.status) {
    query = query.eq("status", "ACTIVA");
  }

  if (filters.mode && filters.mode !== "TODAS") query = query.eq("mode", filters.mode);
  if (filters.category && filters.category !== "TODAS") query = query.eq("category", filters.category);
  if (filters.featuredOnly) query = query.eq("is_featured", true);
  if (filters.urgentOnly) query = query.eq("urgent", true);

  if (filters.city?.trim()) query = query.ilike("city", `%${filters.city.trim()}%`);
  if (filters.subcategory?.trim()) query = query.ilike("subcategory", `%${filters.subcategory.trim()}%`);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getPublicationById(publicationId: string) {
  const { data, error } = await supabase
    .from("publications")
    .select(publicationSelect)
    .eq("id", publicationId)
    .is("deleted_at", null)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updatePublicationStatus(
  publicationId: string,
  status: PublicationStatus
) {
  const { data, error } = await supabase
    .from("publications")
    .update({ status, is_active: status === "ACTIVA" })
    .eq("id", publicationId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
