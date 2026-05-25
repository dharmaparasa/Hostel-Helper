import { getSupabaseClient } from "../supabase";

const TABLE_NAME = "hostels";

export function isUserVerified(user) {
  return Boolean(
    user?.email_confirmed_at ||
    user?.confirmed_at ||
    user?.email_confirmed
  );
}

export async function fetchHostels() {
  const client = getSupabaseClient();
  if (!client) {
    return [];
  }

  const { data, error } = await client
    .from(TABLE_NAME)
    .select("id, name")
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function createHostel(name) {
  if (!name) {
    throw new Error("Hostel name is required.");
  }

  const client = getSupabaseClient();
  if (!client) {
    return null;
  }

  const { data, error } = await client
    .from(TABLE_NAME)
    .insert({ name })
    .select("id, name")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateHostel(hostelId, updates) {
  if (!hostelId) {
    throw new Error("Hostel ID is required for update.");
  }

  const client = getSupabaseClient();
  if (!client) {
    return null;
  }

  const { data, error } = await client
    .from(TABLE_NAME)
    .update(updates)
    .eq("id", hostelId)
    .select("id, name")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteHostel(hostelId) {
  if (!hostelId) {
    throw new Error("Hostel ID is required for delete.");
  }

  const client = getSupabaseClient();
  if (!client) {
    return null;
  }

  const { error } = await client
    .from(TABLE_NAME)
    .delete()
    .eq("id", hostelId);

  if (error) {
    throw error;
  }

  return true;
}
