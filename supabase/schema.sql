-- Attendance Tracker — Supabase schema
-- Run this in the Supabase SQL editor for your project.
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE where possible.

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────
-- profiles: one row per user, holds onboarding state
-- ─────────────────────────────────────────────────────────
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  education_type text check (education_type in ('Diploma', 'Degree')),
  setup_complete boolean not null default false,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

drop policy if exists "profiles_select_own" on profiles;
create policy "profiles_select_own" on profiles for select using (auth.uid() = id);
drop policy if exists "profiles_insert_own" on profiles;
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() = id);
drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

-- Auto-create a profile row the moment someone signs up, via a
-- security-definer trigger. This matters because if your Supabase project
-- requires email confirmation, there's no active session (so no RLS-passing
-- client insert is possible) between signUp() and the user clicking the
-- confirmation link — the app would otherwise have nowhere to store
-- setup_complete until then.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, setup_complete)
  values (new.id, new.email, false)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─────────────────────────────────────────────────────────
-- terms: term structure (months, syllabus vs exam months)
-- one active term per user for this single-user app
-- ─────────────────────────────────────────────────────────
create table if not exists terms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  term_months int not null default 6 check (term_months between 4 and 6),
  syllabus_months int not null default 5,
  exam_months int not null default 1,
  start_date date not null default current_date,
  created_at timestamptz not null default now()
);

alter table terms enable row level security;
drop policy if exists "terms_all_own" on terms;
create policy "terms_all_own" on terms for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────
-- timetable_slots: the repeating weekly template
-- weekday: 0=Mon .. 4=Fri
-- ─────────────────────────────────────────────────────────
create table if not exists timetable_slots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  weekday int not null check (weekday between 0 and 4),
  position int not null default 0,
  subject text not null,
  type text not null check (type in ('Theory', 'Practical', 'Tutorial')),
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now()
);

alter table timetable_slots enable row level security;
drop policy if exists "slots_all_own" on timetable_slots;
create policy "slots_all_own" on timetable_slots for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists idx_slots_user_weekday on timetable_slots (user_id, weekday, position);

-- ─────────────────────────────────────────────────────────
-- holidays: dates excluded from all subjects
-- ─────────────────────────────────────────────────────────
create table if not exists holidays (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  reason text,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

alter table holidays enable row level security;
drop policy if exists "holidays_all_own" on holidays;
create policy "holidays_all_own" on holidays for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────
-- attendance_records: one row per lecture-instance per day
-- Generated from timetable_slots on setup, then edited in place.
-- Snapshots subject/type/time so later timetable edits don't
-- rewrite history.
-- ─────────────────────────────────────────────────────────
create table if not exists attendance_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  slot_position int not null default 0,
  subject text not null,
  type text not null check (type in ('Theory', 'Practical', 'Tutorial')),
  start_time time not null,
  end_time time not null,
  status text not null default 'unmarked' check (status in ('unmarked', 'present', 'absent', 'cancelled')),
  is_extra boolean not null default false,
  is_holiday boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date, slot_position, start_time)
);

alter table attendance_records enable row level security;
drop policy if exists "records_all_own" on attendance_records;
create policy "records_all_own" on attendance_records for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists idx_records_user_date on attendance_records (user_id, date);
create index if not exists idx_records_user_subject on attendance_records (user_id, subject);

-- keep updated_at fresh
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_records_updated_at on attendance_records;
create trigger trg_records_updated_at
  before update on attendance_records
  for each row execute function set_updated_at();

-- ─────────────────────────────────────────────────────────
-- activity_log: a plain factual audit trail of what changed and
-- when — timetable edits, attendance marks, holidays, makeup
-- lectures, setup completion. Not AI-generated; every row is
-- written by the app the moment the underlying action happens.
-- ─────────────────────────────────────────────────────────
create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  description text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table activity_log enable row level security;
drop policy if exists "activity_select_own" on activity_log;
create policy "activity_select_own" on activity_log for select using (auth.uid() = user_id);
drop policy if exists "activity_insert_own" on activity_log;
create policy "activity_insert_own" on activity_log for insert with check (auth.uid() = user_id);

create index if not exists idx_activity_user_created on activity_log (user_id, created_at desc);
