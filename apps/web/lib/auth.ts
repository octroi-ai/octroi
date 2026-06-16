import { createBrowserClient } from "@supabase/ssr";
import { AUTH_CONFIGURED, AUTH_URL, AUTH_ANON } from "./auth-config";

function getSupabase() {
  if (!AUTH_CONFIGURED) {
    // Never construct a client without a real anon key — it throws and crashes.
    throw new Error("Authentification non configurée (mode démo).");
  }
  return createBrowserClient(AUTH_URL!, AUTH_ANON!);
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUpWithEmail(email: string, password: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  if (!AUTH_CONFIGURED) return;
  const supabase = getSupabase();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  if (!AUTH_CONFIGURED) return null;
  const supabase = getSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}
