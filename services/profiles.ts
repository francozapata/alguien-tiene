import { User } from "firebase/auth";
import { supabase } from "@/lib/supabase";

export async function getOrCreateProfile(firebaseUser: User) {
  const { data: existingProfile, error: searchError } = await supabase
    .from("profiles")
    .select("*")
    .eq("firebase_uid", firebaseUser.uid)
    .maybeSingle();

  if (searchError) {
    throw new Error(searchError.message);
  }

  if (existingProfile) {
    const { data: updatedProfile } = await supabase
      .from("profiles")
      .update({
        display_name: existingProfile.display_name || firebaseUser.displayName,
        avatar_url: firebaseUser.photoURL,
      })
      .eq("id", existingProfile.id)
      .select()
      .single();

    return updatedProfile || existingProfile;
  }

  const { data: newProfile, error: insertError } = await supabase
    .from("profiles")
    .insert({
      firebase_uid: firebaseUser.uid,
      email: firebaseUser.email,
      display_name: firebaseUser.displayName,
      avatar_url: firebaseUser.photoURL,
      terms_accepted: false,
      terms_accepted_at: null,
      is_adult_confirmed: false,
    })
    .select()
    .single();

  if (insertError) {
    throw new Error(insertError.message);
  }

  return newProfile;
}