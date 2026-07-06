import { getSupabaseClient } from "../supabase";

function buildMonth(tenant, rentTerm) {
  const entryDate = tenant.date_of_entry || new Date().toISOString().slice(0, 10);
  const monthKey = entryDate.slice(0, 7);
  const monthlyRent = Number(rentTerm?.monthly_rent || 0);
  const additionalFees = Number(rentTerm?.additional_fees || 0);
  const dueDay = String(rentTerm?.due_day || 5).padStart(2, "0");

  return {
    id: rentTerm?.id || `${monthKey}-${tenant.id}`,
    monthKey,
    rentDue: monthlyRent + additionalFees,
    paid: 0,
    dueDate: `${monthKey}-${dueDay}`,
    closedOn: null
  };
}

function mapTenant(row) {
  const activeRoomAssignment =
    row.tenant_room_assignments?.find((assignment) => !assignment.vacated_on) ||
    row.tenant_room_assignments?.[0];
  const activeRentTerm =
    row.tenant_rent_terms?.find((term) => !term.effective_to) || row.tenant_rent_terms?.[0];

  return {
    id: row.id,
    hostelId: row.hostel_id,
    name: row.name,
    age: row.age ? String(row.age) : "",
    mobile: row.mobile,
    roomNumber: activeRoomAssignment?.rooms?.room_number || "",
    roomId: activeRoomAssignment?.room_id || activeRoomAssignment?.rooms?.id || "",
    rentId: activeRentTerm?.id || "",
    entryDate: row.date_of_entry,
    monthlyRent: Number(activeRentTerm?.monthly_rent || 0),
    additionalFees: Number(activeRentTerm?.additional_fees || 0),
    purposeOfStay: row.purpose_of_stay || "",
    months: [buildMonth(row, activeRentTerm)]
  };
}

export async function fetchTenants() {
  const client = getSupabaseClient();
  if (!client) {
    return [];
  }

  const { data, error } = await client
    .from("tenants")
    .select(
      `
        id,
        hostel_id,
        name,
        age,
        mobile,
        date_of_entry,
        purpose_of_stay,
        status,
        created_at,
        tenant_room_assignments (
          id,
          room_id,
          assigned_on,
          vacated_on,
          rooms (
            id,
            room_number
          )
        ),
        tenant_rent_terms (
          id,
          monthly_rent,
          additional_fees,
          effective_from,
          effective_to,
          due_day
        )
      `
    )
    .eq("status", "ACTIVE")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []).map(mapTenant);
}

export async function createTenantWithRoomAndRent(tenantInput) {
  const client = getSupabaseClient();
  if (!client) {
    return null;
  }
  const age = Number(tenantInput.age);

  const { data, error } = await client.rpc("create_tenant_with_room_and_rent", {
    input_hostel_id: tenantInput.hostelId,
    tenant_name: tenantInput.name,
    tenant_age: Number.isFinite(age) && age > 0 ? age : null,
    tenant_mobile: tenantInput.mobile,
    tenant_room_number: tenantInput.roomNumber,
    tenant_date_of_entry: tenantInput.entryDate,
    tenant_monthly_rent: Number(tenantInput.monthlyRent || 0),
    tenant_additional_fees: Number(tenantInput.additionalFees || 0),
    tenant_purpose_of_stay: tenantInput.purposeOfStay || null
  });

  if (error) {
    throw error;
  }

  return data;
}
