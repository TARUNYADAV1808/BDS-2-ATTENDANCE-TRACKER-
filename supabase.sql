create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  class_date date not null,
  slot_id text not null,
  subject_id text not null,
  present boolean not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id,class_date,slot_id)
);

alter table public.profiles enable row level security;
alter table public.attendance enable row level security;

drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists attendance_select_own on public.attendance;
drop policy if exists attendance_insert_own on public.attendance;
drop policy if exists attendance_update_own on public.attendance;
drop policy if exists attendance_delete_own on public.attendance;

create policy profiles_select_own on public.profiles for select using(auth.uid()=user_id);
create policy profiles_insert_own on public.profiles for insert with check(auth.uid()=user_id);
create policy profiles_update_own on public.profiles for update using(auth.uid()=user_id) with check(auth.uid()=user_id);

create policy attendance_select_own on public.attendance for select using(auth.uid()=user_id);
create policy attendance_insert_own on public.attendance for insert with check(auth.uid()=user_id);
create policy attendance_update_own on public.attendance for update using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy attendance_delete_own on public.attendance for delete using(auth.uid()=user_id);

create index if not exists attendance_user_date_idx on public.attendance(user_id,class_date);
create index if not exists attendance_user_subject_idx on public.attendance(user_id,subject_id);
