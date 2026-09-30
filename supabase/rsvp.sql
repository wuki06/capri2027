-- RSVP-Tabelle für Supabase (SQL Editor → einfügen → Run)
create table if not exists public.rsvps (
  id              uuid primary key default gen_random_uuid(),
  first_name      text not null,
  last_name       text not null,
  attending       boolean not null,
  guests          int  not null default 0 check (guests between 0 and 10),
  guest_names     text[] not null default '{}',
  meal            text,
  dietary         text,
  welcome_event   boolean,
  farewell_brunch boolean,
  song_request    text,
  message         text,
  submitted_at    timestamptz not null default now()
);

alter table public.rsvps enable row level security;

-- Gäste dürfen nur EINTRAGEN, nicht lesen/ändern/löschen
drop policy if exists "guests can insert" on public.rsvps;
create policy "guests can insert" on public.rsvps
  for insert to anon with check (true);

-- Antworten ansehen: Supabase → Table Editor → rsvps
