-- Tenant profile, room assignment history, and rent term history.

create extension if not exists pgcrypto;

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  hostel_id uuid not null references public.hostels(id) on delete cascade,
  name text not null,
  age integer,
  mobile text not null,
  date_of_entry date not null,
  purpose_of_stay text,
  status text not null default 'ACTIVE',
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now()),
  constraint tenants_age_check check (age is null or age between 1 and 120),
  constraint tenants_status_check check (status in ('ACTIVE', 'INACTIVE', 'VACATED'))
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  hostel_id uuid not null references public.hostels(id) on delete cascade,
  room_number text not null,
  room_type text,
  floor text,
  capacity integer,
  notes text,
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now()),
  constraint rooms_capacity_check check (capacity is null or capacity > 0)
);

create table if not exists public.tenant_room_assignments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete restrict,
  hostel_id uuid not null references public.hostels(id) on delete cascade,
  assigned_on date not null,
  vacated_on date,
  notes text,
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now()),
  constraint tenant_room_assignments_dates_check check (
    vacated_on is null or vacated_on >= assigned_on
  )
);

create table if not exists public.tenant_rent_terms (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  hostel_id uuid not null references public.hostels(id) on delete cascade,
  monthly_rent numeric(12, 2) not null,
  additional_fees numeric(12, 2) not null default 0,
  effective_from date not null,
  effective_to date,
  due_day integer not null default 5,
  notes text,
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now()),
  constraint tenant_rent_terms_monthly_rent_check check (monthly_rent >= 0),
  constraint tenant_rent_terms_additional_fees_check check (additional_fees >= 0),
  constraint tenant_rent_terms_due_day_check check (due_day between 1 and 28),
  constraint tenant_rent_terms_dates_check check (
    effective_to is null or effective_to >= effective_from
  )
);

create unique index if not exists rooms_hostel_id_room_number_idx
  on public.rooms(hostel_id, lower(room_number));

create index if not exists tenants_owner_hostel_idx
  on public.tenants(owner_id, hostel_id);

create index if not exists tenants_owner_created_idx
  on public.tenants(owner_id, created_at desc);

create index if not exists tenant_room_assignments_tenant_idx
  on public.tenant_room_assignments(tenant_id, assigned_on desc);

create unique index if not exists tenant_room_assignments_one_active_idx
  on public.tenant_room_assignments(tenant_id)
  where vacated_on is null;

create index if not exists tenant_room_assignments_room_idx
  on public.tenant_room_assignments(room_id, assigned_on desc);

create index if not exists tenant_rent_terms_tenant_idx
  on public.tenant_rent_terms(tenant_id, effective_from desc);

create unique index if not exists tenant_rent_terms_one_active_idx
  on public.tenant_rent_terms(tenant_id)
  where effective_to is null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_tenants_updated_at on public.tenants;
create trigger set_tenants_updated_at
before update on public.tenants
for each row execute function public.set_updated_at();

drop trigger if exists set_rooms_updated_at on public.rooms;
create trigger set_rooms_updated_at
before update on public.rooms
for each row execute function public.set_updated_at();

drop trigger if exists set_tenant_room_assignments_updated_at on public.tenant_room_assignments;
create trigger set_tenant_room_assignments_updated_at
before update on public.tenant_room_assignments
for each row execute function public.set_updated_at();

drop trigger if exists set_tenant_rent_terms_updated_at on public.tenant_rent_terms;
create trigger set_tenant_rent_terms_updated_at
before update on public.tenant_rent_terms
for each row execute function public.set_updated_at();

alter table public.tenants enable row level security;
alter table public.rooms enable row level security;
alter table public.tenant_room_assignments enable row level security;
alter table public.tenant_rent_terms enable row level security;

drop policy if exists "Owners can manage own tenants" on public.tenants;
drop policy if exists "Owners can manage own rooms" on public.rooms;
drop policy if exists "Owners can manage own tenant room assignments" on public.tenant_room_assignments;
drop policy if exists "Owners can manage own tenant rent terms" on public.tenant_rent_terms;

create policy "Owners can manage own tenants"
on public.tenants
for all
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy "Owners can manage own rooms"
on public.rooms
for all
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy "Owners can manage own tenant room assignments"
on public.tenant_room_assignments
for all
using (
  exists (
    select 1
    from public.tenants
    where tenants.id = tenant_room_assignments.tenant_id
      and tenants.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.tenants
    where tenants.id = tenant_room_assignments.tenant_id
      and tenants.owner_id = auth.uid()
  )
);

create policy "Owners can manage own tenant rent terms"
on public.tenant_rent_terms
for all
using (
  exists (
    select 1
    from public.tenants
    where tenants.id = tenant_rent_terms.tenant_id
      and tenants.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.tenants
    where tenants.id = tenant_rent_terms.tenant_id
      and tenants.owner_id = auth.uid()
  )
);

create or replace function public.create_tenant_with_room_and_rent(
  input_hostel_id uuid,
  tenant_name text,
  tenant_age integer,
  tenant_mobile text,
  tenant_room_number text,
  tenant_date_of_entry date,
  tenant_monthly_rent numeric,
  tenant_additional_fees numeric default 0,
  tenant_purpose_of_stay text default null,
  tenant_room_type text default null,
  tenant_floor text default null,
  tenant_capacity integer default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  active_owner_id uuid := auth.uid();
  matched_room_id uuid;
  new_tenant_id uuid;
begin
  if active_owner_id is null then
    raise exception 'User not authenticated.';
  end if;

  if not exists (
    select 1
    from public.hostels
    where hostels.id = input_hostel_id
      and hostels.owner_id = active_owner_id
  ) then
    raise exception 'Hostel not found for current owner.';
  end if;

  select rooms.id into matched_room_id
  from public.rooms
  where rooms.hostel_id = input_hostel_id
    and lower(rooms.room_number) = lower(trim(tenant_room_number))
  limit 1;

  if matched_room_id is null then
    insert into public.rooms (
      owner_id,
      hostel_id,
      room_number,
      room_type,
      floor,
      capacity
    )
    values (
      active_owner_id,
      input_hostel_id,
      trim(tenant_room_number),
      nullif(trim(coalesce(tenant_room_type, '')), ''),
      nullif(trim(coalesce(tenant_floor, '')), ''),
      tenant_capacity
    )
    returning id into matched_room_id;
  end if;

  insert into public.tenants (
    owner_id,
    hostel_id,
    name,
    age,
    mobile,
    date_of_entry,
    purpose_of_stay
  )
  values (
    active_owner_id,
    input_hostel_id,
    trim(tenant_name),
    tenant_age,
    trim(tenant_mobile),
    tenant_date_of_entry,
    nullif(trim(coalesce(tenant_purpose_of_stay, '')), '')
  )
  returning id into new_tenant_id;

  insert into public.tenant_room_assignments (
    tenant_id,
    room_id,
    hostel_id,
    assigned_on
  )
  values (
    new_tenant_id,
    matched_room_id,
    input_hostel_id,
    tenant_date_of_entry
  );

  insert into public.tenant_rent_terms (
    tenant_id,
    hostel_id,
    monthly_rent,
    additional_fees,
    effective_from
  )
  values (
    new_tenant_id,
    input_hostel_id,
    tenant_monthly_rent,
    coalesce(tenant_additional_fees, 0),
    tenant_date_of_entry
  );

  return new_tenant_id;
end;
$$;

revoke all on function public.create_tenant_with_room_and_rent(
  uuid,
  text,
  integer,
  text,
  text,
  date,
  numeric,
  numeric,
  text,
  text,
  text,
  integer
) from public;

grant execute on function public.create_tenant_with_room_and_rent(
  uuid,
  text,
  integer,
  text,
  text,
  date,
  numeric,
  numeric,
  text,
  text,
  text,
  integer
) to authenticated;
