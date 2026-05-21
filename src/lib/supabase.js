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

function getRedirectTarget() {
  const base = import.meta.env.BASE_URL || "/";
  return window.location.origin + base;
}

export async function sendEmailLogin(email) {
  const client = getSupabaseClient();
  if (!client) {
    return { demo: true };
  }

  const { error } = await client.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: getRedirectTarget()
    }
  });

  if (error) {
    throw error;
  }

  return { sent: true };
}

export async function signUpUser(email, password) {
  const client = getSupabaseClient();
  if (!client) {
    return { demo: true };
  }

  const redirectTo = getRedirectTarget();

  const { error } = await client.auth.signUp(
    {
      email,
      password
    },
    {
      options: {
        emailRedirectTo: redirectTo
      }
    }
  );

  if (error) {
    throw error;
  }

  return { sent: true };
}

export async function signInWithGoogle() {
  const client = getSupabaseClient();
  if (!client) {
    return { demo: true };
  }

  const redirectTo = getRedirectTarget();

  const { error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo
    }
  });

  if (error) {
    throw error;
  }

  return { started: true };
}

export async function signOut() {
  const client = getSupabaseClient();
  if (!client) {
    return;
  }

  await client.auth.signOut();
}
