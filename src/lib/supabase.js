import { createClient } from "@supabase/supabase-js";

let supabase;

export function getSupabaseClient() {
  if (supabase) {
    return supabase;
  }

  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  supabase = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  });

  return supabase;
}

export async function loadSession() {
  const client = getSupabaseClient();
  if (!client) {
    return null;
  }

  const { data } = await client.auth.getSession();
  return data.session;
}

export async function sendEmailLogin(email) {
  const client = getSupabaseClient();
  if (!client) {
    return { demo: true };
  }

  const { error } = await client.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin
    }
  });

  if (error) {
    throw error;
  }

  return { sent: true };
}

export async function signOut() {
  const client = getSupabaseClient();
  if (!client) {
    return;
  }

  await client.auth.signOut();
}
