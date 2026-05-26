import { getSupabaseClient } from "../supabase";

const TABLE_NAME = "owners";

function getOwnerNameFromUser(user) {
  return (
    user?.user_metadata?.name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Hostel owner"
  );
}

export async function fetchCurrentOwner() {
  const client = getSupabaseClient();
  if (!client) {
    return null;
  }

  const { data, error } = await client
    .from(TABLE_NAME)
    .select("id, user_id, owner_name, phone_number, owner_address, onboarding_token, created_at")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data || null;
}

export async function ensureCurrentOwnerProfile() {
  const client = getSupabaseClient();
  if (!client) {
    return null;
  }

  const {
    data: { user },
    error: userError
  } = await client.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user?.id) {
    throw new Error("User not authenticated.");
  }

  const existing = await fetchCurrentOwner();
  if (existing) {
    return existing;
  }

  const { data, error } = await client
    .from(TABLE_NAME)
    .insert({
      user_id: user.id,
      owner_name: getOwnerNameFromUser(user)
    })
    .select("id, user_id, owner_name, phone_number, owner_address, onboarding_token, created_at")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function resolveOnboardingOwner(token) {
  const client = getSupabaseClient();
  if (!client) {
    return null;
  }

  const { data, error } = await client.rpc("resolve_onboarding_owner", {
    public_token: token
  });

  if (error) {
    throw error;
  }

  return data?.[0] || null;
}
