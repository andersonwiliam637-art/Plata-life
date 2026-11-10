-- PLATA AI / Phase 3-4 foundation
-- Apply in Supabase SQL Editor or via Supabase CLI after reviewing for your project.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  preferred_currency char(3) not null default 'GTQ' check (preferred_currency ~ '^[A-Z]{3}$'),
  locale text not null default 'es-GT' check (locale in ('es-GT', 'es', 'en')),
  timezone text not null default 'America/Guatemala',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- The trigger runs only for new auth users. Metadata is user-controlled, so bound and sanitize it.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  safe_name text;
begin
  safe_name := left(regexp_replace(coalesce(new.raw_user_meta_data ->> 'full_name', ''), '[[:cntrl:]]', '', 'g'), 80);
  insert into public.profiles (id, full_name)
  values (new.id, safe_name)
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
revoke all on public.profiles from anon;
grant select, insert, update on public.profiles to authenticated;

create policy "profiles_select_own" on public.profiles
for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_insert_own" on public.profiles
for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles
for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Deliberately do not grant delete from client. Account deletion must use a verified server-side workflow.
