-- Automatic dress codes, tags and rental price.
-- Run this in the Supabase SQL editor after 20261004000000_init.sql.

-- ─── Tags and rental price ────────────────────────────────────────────────────
alter table public.dresses
  add column tags  text[] not null default '{}',
  add column price numeric(10, 2) check (price >= 0);

-- Colours become tags (red, green…), so the separate colour column goes.
update public.dresses
set tags = array[lower(trim(colour))]
where colour is not null and length(trim(colour)) > 0;

alter table public.dresses drop column colour;

create index dresses_tags_idx on public.dresses using gin (tags);

-- ─── Automatic codes ──────────────────────────────────────────────────────────
-- Every new dress gets the next code in its section: WW-001, WW-002… for Wedding
-- Wear and WG-001, WG-002… for Wedding Guests. Codes never change once given.
create function public.assign_dress_code()
returns trigger
language plpgsql
as $$
declare
  prefix  text := case new.section when 'wear' then 'WW' else 'WG' end;
  next_no int;
begin
  if tg_op = 'UPDATE' then
    new.code := old.code;
    new.section := old.section;
    return new;
  end if;

  -- One code at a time per section, so two phones can't get the same number.
  perform pg_advisory_xact_lock(hashtext('dress_code_' || new.section));

  select coalesce(max(substring(code from '^' || prefix || '-(\d+)$')::int), 0) + 1
  into next_no
  from public.dresses
  where section = new.section;

  new.code := prefix || '-' || lpad(next_no::text, greatest(3, length(next_no::text)), '0');
  return new;
end;
$$;

create trigger dresses_assign_code
before insert or update on public.dresses
for each row execute function public.assign_dress_code();
