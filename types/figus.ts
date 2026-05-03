export const TOTAL_FIGUS_MUNDIAL = 994;
export const MUNDIAL_2026_ALBUM_NAME = "Mundial 2026";

export type FiguRequest = {
  id: string;
  user_id: string;
  album_id: string;
  needed_figus: number[];
  is_urgent: boolean;
  city: string | null;
  neighborhood: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  profiles?: { display_name: string | null; avatar_url: string | null; email: string | null } | null;
};

export type FiguMatchStatus = "PENDIENTE" | "HABLANDO" | "ACORDADO" | "INTERCAMBIADO" | "CANCELADO";

export type FiguMatch = {
  id: string;
  user1_id: string;
  user2_id: string;
  album_id: string;
  match_type: "DOUBLE" | "SIMPLE";
  figus_user1_gets: number[];
  figus_user2_gets: number[];
  city: string | null;
  neighborhood: string | null;
  match_score: number | null;
  distance_km?: number | null;
  status: FiguMatchStatus;
  meeting_suggestion: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
  liked_by_user1?: boolean | null;
  liked_by_user2?: boolean | null;
  mutual_interest?: boolean | null;
  rejected_by_user1?: boolean | null;
  rejected_by_user2?: boolean | null;
  last_message?: { id: string; match_id: string; sender_id: string; message: string; created_at: string } | null;
  user1?: { display_name: string | null; avatar_url: string | null; email: string | null; album_percent?: number | null; reviews_count?: number | null; avg_rating?: number | null; successful_exchanges?: number | null } | null;
  user2?: { display_name: string | null; avatar_url: string | null; email: string | null; album_percent?: number | null; reviews_count?: number | null; avg_rating?: number | null; successful_exchanges?: number | null } | null;
};

export type FiguChatMessage = {
  id: string;
  match_id: string;
  sender_id: string;
  message: string;
  created_at: string;
  profiles?: { display_name: string | null; avatar_url: string | null } | null;
};


export type FiguNearbyUser = {
  user_id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  city?: string | null;
  neighborhood?: string | null;
  distance_km?: number | null;
  album_percent?: number | null;
  owned_count?: number;
  repeated_count?: number;
  reviews_count?: number;
  avg_rating?: number | null;
  successful_exchanges?: number;
};
