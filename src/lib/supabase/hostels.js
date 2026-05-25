import { getSupabaseClient } from "../supabase";

const TABLE_NAME = "hostels";

export function isUserVerified(user) {
  return Boolean(
    user?.email_confirmed_at ||
    user?.confirmed_at ||
    user?.email_confirmed
  );
}

export async function fetchHostelsByOwner(ownerId) {
  if (!ownerId) {
    return [];
  }

  const client = getSupabaseClient();
  if (!client) {
    return [];
  }

  const { data, error } = await client
    .from(TABLE_NAME)
    .select("id, name, owner_id")
    .eq("owner_id", ownerId);

  if (error) {
    throw error;
  }

  return data || [];
}

export async function createHostelForOwner(name, ownerId) {
  if (!name || !ownerId) {
    throw new Error("Hostel name and authenticated owner ID are required.");
  }

  const client = getSupabaseClient();
  if (!client) {
    return null;
  }

  const { data, error } = await client
    .from(TABLE_NAME)
    .insert({ name, owner_id: ownerId })
    .select("id, name, owner_id")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateHostelForOwner(hostelId, ownerId, updates) {
  if (!hostelId || !ownerId) {
    throw new Error("Hostel ID and owner ID are required for update.");
  }

  const client = getSupabaseClient();
  if (!client) {
    return null;
  }

  const { data, error } = await client
    .from(TABLE_NAME)
    .update(updates)
    .eq("id", hostelId)
    .eq("owner_id", ownerId)
    .select("id, name, owner_id")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteHostelForOwner(hostelId, ownerId) {
  if (!hostelId || !ownerId) {
    throw new Error("Hostel ID and owner ID are required for delete.");
  }

  const client = getSupabaseClient();
  if (!client) {
    return null;
  }

  const { error } = await client
    .from(TABLE_NAME)
    .delete()
    .eq("id", hostelId)
    .eq("owner_id", ownerId);

  if (error) {
    throw error;
  }

  return true;
}
