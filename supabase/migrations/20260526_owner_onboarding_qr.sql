-- Owner-level QR onboarding system

create extension if not exists pgcrypto;

create table if not exists public.owners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  owner_name text not null default '',
  phone_number text,
  owner_address text,
  onboarding_token text not null unique,
  created_at timestamp with time zone not null default timezone('utc', now())
);

create table if not exists public.tenant_requests (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.owners(id) on delete cascade,
  full_name text not null,
  phone text not null,
  email text,
  emergency_contact text,
  preferred_hostel text,
  room_preference text,
  move_in_date date,
  notes text,
  status text not null default 'PENDING',
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now()),
  constraint tenant_requests_status_check check (
    status in ('PENDING', 'APPROVED', 'REJECTED', 'ACTIVATED')
  )
);

create index if not exists owners_user_id_idx on public.owners(user_id);
create index if not exists owners_onboarding_token_idx on public.owners(onboarding_token);
create index if not exists tenant_requests_owner_status_idx
  on public.tenant_requests(owner_id, status, created_at desc);
create index if not exists tenant_requests_owner_created_idx
  on public.tenant_requests(owner_id, created_at desc);

create or replace function public.generate_owner_onboarding_token()
returns text
language plpgsql
as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  token_body text := '';
  i integer;
begin
  for i in 1..9 loop
    token_body := token_body || substr(alphabet, 1 + floor(random() * length(alphabet))::integer, 1);
  end loop;

  return 'own_' || token_body;
end;
$$;

create or replace function public.set_owner_onboarding_token()
returns trigger
language plpgsql
as $$
begin
  if new.onboarding_token is null or new.onboarding_token = '' then
    loop
      new.onboarding_token := public.generate_owner_onboarding_token();
      exit when not exists (
        select 1 from public.owners where onboarding_token = new.onboarding_token
      );
    end loop;
  end if;

  return new;
end;
$$;

drop trigger if exists set_owner_onboarding_token on public.owners;
create trigger set_owner_onboarding_token
before insert on public.owners
for each row execute function public.set_owner_onboarding_token();

create or replace function public.set_tenant_request_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_tenant_request_updated_at on public.tenant_requests;
create trigger set_tenant_request_updated_at
before update on public.tenant_requests
for each row execute function public.set_tenant_request_updated_at();

alter table public.owners enable row level security;
alter table public.tenant_requests enable row level security;

drop policy if exists "Owners can read own owner profile" on public.owners;
drop policy if exists "Owners can create own owner profile" on public.owners;
drop policy if exists "Owners can update own owner profile" on public.owners;
drop policy if exists "Owners can read own tenant requests" on public.tenant_requests;
drop policy if exists "Owners can update own tenant requests" on public.tenant_requests;

create policy "Owners can read own owner profile"
on public.owners
for select
using (auth.uid() = user_id);

create policy "Owners can create own owner profile"
on public.owners
for insert
with check (auth.uid() = user_id);

create policy "Owners can update own owner profile"
on public.owners
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Owners can read own tenant requests"
on public.tenant_requests
for select
using (
  exists (
    select 1
    from public.owners
    where owners.id = tenant_requests.owner_id
      and owners.user_id = auth.uid()
  )
);

create policy "Owners can update own tenant requests"
on public.tenant_requests
for update
using (
  exists (
    select 1
    from public.owners
    where owners.id = tenant_requests.owner_id
      and owners.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.owners
    where owners.id = tenant_requests.owner_id
      and owners.user_id = auth.uid()
  )
);

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
