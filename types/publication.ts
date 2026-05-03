export type PublicationMode = "BUSCO" | "OFREZCO";

export type PublicationCategory =
  | "OBJETOS"
  | "SERVICIOS"
  | "TRABAJO"
  | "COMUNIDAD"
  | "EMPRENDIMIENTOS";

export type PublicationStatus = "ACTIVA" | "PAUSADA" | "RESUELTA";

export type PublicationProfile = {
  id: string;
  firebase_uid: string;
  display_name: string | null;
  avatar_url: string | null;
};

export type Publication = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  mode: PublicationMode;
  category: PublicationCategory;
  subcategory: string | null;
  price: number | null;
  is_free: boolean;
  city: string | null;
  neighborhood: string | null;
  address: string | null;
  map_url: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  is_featured: boolean;
  urgent: boolean;
  status: PublicationStatus;
  is_active: boolean;
  created_at: string;
  profiles?: PublicationProfile | PublicationProfile[] | null;
  image_url: string | null;
};
