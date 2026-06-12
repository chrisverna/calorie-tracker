import { createClient, type User } from "@supabase/supabase-js";
import type { AppState } from "../types";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);
export const supabase = isSupabaseConfigured ? createClient(url!, anonKey!) : null;

export async function signInWithEmail(email: string): Promise<void> {
  if (!supabase) throw new Error("Cloud sync has not been configured.");
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin }
  });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getUser(): Promise<User | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function loadCloudState(userId: string): Promise<AppState | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("user_data")
    .select("payload")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data?.payload as AppState | undefined) ?? null;
}

export async function saveCloudState(userId: string, state: AppState): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("user_data").upsert(
    {
      user_id: userId,
      payload: state,
      updated_at: state.updatedAt
    },
    { onConflict: "user_id" }
  );
  if (error) throw error;
}
