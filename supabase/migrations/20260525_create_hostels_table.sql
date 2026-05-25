-- Supabase migration: create hostels table

create table if not exists hostels (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamp with time zone default timezone('utc', now()),
  updated_at timestamp with time zone default timezone('utc', now())
);

alter table hostels enable row level security;

drop policy if exists "Owners can manage own hostels" on public.hostels;

create policy "Owners can manage own hostels"
on public.hostels
for all
using (auth.uid() = owner_id)
with check (owner_id = auth.uid());


create unique index if not exists hostels_owner_id_name_idx on public.hostels(owner_id, name);

