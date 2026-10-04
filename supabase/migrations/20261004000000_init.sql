-- Bridal Rentals: initial schema
-- Run this once in the Supabase SQL editor (or with `supabase db push`).

-- ─── Dresses (the catalogue) ──────────────────────────────────────────────────
create table public.dresses (
  id          uuid primary key default gen_random_uuid(),
  section     text not null check (section in ('wear', 'guest')),
  code        text not null check (length(trim(code)) > 0),
  name        text not null check (length(trim(name)) > 0),
  size        text,
  colour      text,
  notes       text,
  image_path  text,
  thumb_path  text,
  created_at  timestamptz not null default now()
);

create unique index dresses_section_code_key on public.dresses (section, lower(code));

-- ─── Bookings ─────────────────────────────────────────────────────────────────
create table public.bookings (
  id                uuid primary key default gen_random_uuid(),
  dress_id          uuid not null references public.dresses (id) on delete restrict,
  customer_name     text not null check (length(trim(customer_name)) > 0),
  customer_phone    text not null check (length(trim(customer_phone)) > 0),
  start_date        date not null,
  end_date          date not null,
  return_date       date not null,
  total_price       numeric(10, 2) not null check (total_price >= 0),
  amount_collected  numeric(10, 2) not null default 0
                    check (amount_collected >= 0 and amount_collected <= total_price),
  balance_due       numeric(10, 2) generated always as (total_price - amount_collected) stored,
  measurements      text,
  custom_changes    text,
  notes             text,
  signature_name    text not null check (length(trim(signature_name)) > 0),
  returned_on       date,
  created_at        timestamptz not null default now(),
  check (start_date <= end_date and end_date <= return_date),
  check (returned_on is null or returned_on >= start_date)
);

create index bookings_dress_start_idx on public.bookings (dress_id, start_date);
create index bookings_open_idx on public.bookings (return_date) where returned_on is null;

-- ─── Blocking rule ────────────────────────────────────────────────────────────
-- A dress is blocked from start_date until 1 day after it is actually returned.
-- Not returned yet: blocked until return_date + 1. Overdue: blocked with no end date.
-- Keep in sync with mobile/src/lib/blocking.ts.
create function public.booking_blocked_until(b public.bookings)
returns date
language sql
stable
as $$
  select case
    when b.returned_on is not null then b.returned_on + 1
    when current_date <= b.return_date then b.return_date + 1
    else 'infinity'::date
  end;
$$;

create function public.prevent_double_booking()
returns trigger
language plpgsql
as $$
declare
  clash public.bookings;
begin
  -- Serialise bookings for the same dress so two phones can't both win.
  perform pg_advisory_xact_lock(hashtext(new.dress_id::text));

  select * into clash
  from public.bookings other
  where other.dress_id = new.dress_id
    and other.id <> new.id
    and new.start_date <= public.booking_blocked_until(other)
    and other.start_date <= public.booking_blocked_until(new)
  order by other.start_date
  limit 1;

  if found then
    raise exception 'DRESS_UNAVAILABLE: booked by % from % (return by %)',
      clash.customer_name, clash.start_date, clash.return_date
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger bookings_prevent_double_booking
before insert or update of dress_id, start_date, end_date, return_date
on public.bookings
for each row execute function public.prevent_double_booking();

-- ─── Access: signed-in staff only ─────────────────────────────────────────────
-- Turn OFF "Allow new users to sign up" in Authentication settings so only
-- accounts the owner creates can sign in.
alter table public.dresses  enable row level security;
alter table public.bookings enable row level security;

create policy "Staff can manage dresses" on public.dresses
  for all to authenticated using (true) with check (true);

create policy "Staff can manage bookings" on public.bookings
  for all to authenticated using (true) with check (true);

-- ─── Photo storage ────────────────────────────────────────────────────────────
-- Public bucket so catalogue photos load by URL. Only staff can upload or delete.
insert into storage.buckets (id, name, public)
values ('dresses', 'dresses', true)
on conflict (id) do nothing;

create policy "Staff can read dress photos" on storage.objects
  for select to authenticated using (bucket_id = 'dresses');

create policy "Staff can upload dress photos" on storage.objects
  for insert to authenticated with check (bucket_id = 'dresses');

create policy "Staff can replace dress photos" on storage.objects
  for update to authenticated using (bucket_id = 'dresses');

create policy "Staff can delete dress photos" on storage.objects
  for delete to authenticated using (bucket_id = 'dresses');

-- ─── Live sync ────────────────────────────────────────────────────────────────
alter publication supabase_realtime add table public.dresses, public.bookings;
