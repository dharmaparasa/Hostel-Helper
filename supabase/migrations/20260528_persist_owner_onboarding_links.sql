-- Keep owner onboarding links active as long as the owner token exists.

create or replace function public.resolve_onboarding_owner(public_token text)
returns table(owner_name text)
language sql
security definer
set search_path = public
as $$
  select owners.owner_name
  from public.owners
  where owners.onboarding_token = public_token
  limit 1;
$$;

create or replace function public.submit_tenant_onboarding_request(
  public_token text,
  tenant_full_name text,
  tenant_phone text,
  tenant_email text default null,
  tenant_emergency_contact text default null,
  tenant_preferred_hostel text default null,
  tenant_room_preference text default null,
  tenant_move_in_date date default null,
  tenant_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  matched_owner_id uuid;
  new_request_id uuid;
begin
  select id into matched_owner_id
  from public.owners
  where onboarding_token = public_token
  limit 1;

  if matched_owner_id is null then
    raise exception 'Invalid onboarding link';
  end if;

  insert into public.tenant_requests (
    owner_id,
    full_name,
    phone,
    email,
    emergency_contact,
    preferred_hostel,
    room_preference,
    move_in_date,
    notes
  )
  values (
    matched_owner_id,
    trim(tenant_full_name),
    trim(tenant_phone),
    nullif(trim(coalesce(tenant_email, '')), ''),
    nullif(trim(coalesce(tenant_emergency_contact, '')), ''),
    nullif(trim(coalesce(tenant_preferred_hostel, '')), ''),
    nullif(trim(coalesce(tenant_room_preference, '')), ''),
    tenant_move_in_date,
    nullif(trim(coalesce(tenant_notes, '')), '')
  )
  returning id into new_request_id;

  return new_request_id;
end;
$$;

revoke all on function public.resolve_onboarding_owner(text) from public;
revoke all on function public.submit_tenant_onboarding_request(text, text, text, text, text, text, text, date, text) from public;
grant execute on function public.resolve_onboarding_owner(text) to anon, authenticated;
grant execute on function public.submit_tenant_onboarding_request(text, text, text, text, text, text, text, date, text) to anon, authenticated;
