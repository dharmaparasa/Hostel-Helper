-- Tenant payment records matched against rent terms.

create extension if not exists pgcrypto;

create table if not exists public.tenant_payments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  rent_term_id uuid references public.tenant_rent_terms(id) on delete set null,
  hostel_id uuid not null references public.hostels(id) on delete cascade,
  amount numeric(12, 2) not null,
  payment_date date not null default current_date,
  payment_method text not null default 'CASH',
  status text not null default 'PAID',
  notes text,
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now()),
  constraint tenant_payments_amount_check check (amount > 0),
  constraint tenant_payments_method_check check (
    payment_method in ('CASH', 'UPI', 'BANK_TRANSFER', 'CARD', 'OTHER')
  ),
  constraint tenant_payments_status_check check (
    status in ('PAID', 'VOID')
  )
);

create index if not exists tenant_payments_tenant_date_idx
  on public.tenant_payments(tenant_id, payment_date desc);

create index if not exists tenant_payments_rent_term_idx
  on public.tenant_payments(rent_term_id, payment_date desc);

create index if not exists tenant_payments_owner_hostel_idx
  on public.tenant_payments(owner_id, hostel_id);

drop trigger if exists set_tenant_payments_updated_at on public.tenant_payments;
create trigger set_tenant_payments_updated_at
before update on public.tenant_payments
for each row execute function public.set_updated_at();

alter table public.tenant_payments enable row level security;

drop policy if exists "Owners can manage own tenant payments" on public.tenant_payments;

create policy "Owners can manage own tenant payments"
on public.tenant_payments
for all
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create or replace function public.add_tenant_payment(
  input_tenant_id uuid,
  input_rent_term_id uuid,
  input_amount numeric,
  input_payment_date date default current_date,
  input_payment_method text default 'CASH',
  input_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  active_owner_id uuid := auth.uid();
  matched_hostel_id uuid;
  new_payment_id uuid;
begin
  if active_owner_id is null then
    raise exception 'User not authenticated.';
  end if;

  select tenants.hostel_id into matched_hostel_id
  from public.tenants
  where tenants.id = input_tenant_id
    and tenants.owner_id = active_owner_id
  limit 1;

  if matched_hostel_id is null then
    raise exception 'Tenant not found for current owner.';
  end if;

  if input_rent_term_id is not null and not exists (
    select 1
    from public.tenant_rent_terms
    where tenant_rent_terms.id = input_rent_term_id
      and tenant_rent_terms.tenant_id = input_tenant_id
  ) then
    raise exception 'Rent term not found for tenant.';
  end if;

  insert into public.tenant_payments (
    owner_id,
    tenant_id,
    rent_term_id,
    hostel_id,
    amount,
    payment_date,
    payment_method,
    notes
  )
  values (
    active_owner_id,
    input_tenant_id,
    input_rent_term_id,
    matched_hostel_id,
    input_amount,
    coalesce(input_payment_date, current_date),
    coalesce(input_payment_method, 'CASH'),
    nullif(trim(coalesce(input_notes, '')), '')
  )
  returning id into new_payment_id;

  return new_payment_id;
end;
$$;

revoke all on function public.add_tenant_payment(
  uuid,
  uuid,
  numeric,
  date,
  text,
  text
) from public;

grant execute on function public.add_tenant_payment(
  uuid,
  uuid,
  numeric,
  date,
  text,
  text
) to authenticated;
