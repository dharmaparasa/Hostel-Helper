import { getSupabaseClient } from "../supabase";

const TABLE_NAME = "tenant_requests";

export async function fetchTenantRequests() {
  const client = getSupabaseClient();
  if (!client) {
    return [];
  }

  const { data, error } = await client
    .from(TABLE_NAME)
    .select(
      "id, owner_id, full_name, phone, email, emergency_contact, preferred_hostel, room_preference, move_in_date, notes, status, created_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function submitTenantRequest(token, form) {
  const client = getSupabaseClient();
  if (!client) {
    return { demo: true };
  }

  const { data, error } = await client.rpc("submit_tenant_onboarding_request", {
    public_token: token,
    tenant_full_name: form.fullName,
    tenant_phone: form.phone,
    tenant_email: form.email || null,
    tenant_emergency_contact: form.emergencyContact || null,
    tenant_preferred_hostel: form.preferredHostel || null,
    tenant_room_preference: form.roomPreference || null,
    tenant_move_in_date: form.moveInDate || null,
    tenant_notes: form.notes || null
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function updateTenantRequestStatus(requestId, status) {
  const client = getSupabaseClient();
  if (!client) {
    return null;
  }

  const { data, error } = await client
    .from(TABLE_NAME)
    .update({ status })
    .eq("id", requestId)
    .select(
      "id, owner_id, full_name, phone, email, emergency_contact, preferred_hostel, room_preference, move_in_date, notes, status, created_at"
    )
    .single();

  if (error) {
    throw error;
  }

  return data;
}
