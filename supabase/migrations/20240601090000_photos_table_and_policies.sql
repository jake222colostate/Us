-- Align the photos table schema with the mobile upload flow requirements

-- Ensure pgcrypto extension exists for uuid generation
create extension if not exists "pgcrypto";

-- Photos table columns --------------------------------------------------
alter table if exists public.photos
drop constraint if exists photos_user_id_fkey;

alter table if exists public.photos
  add constraint photos_user_id_fkey foreign key (user_id)
  references auth.users (id) on delete cascade;

alter table if exists public.photos
  add column if not exists content_type text,
  add column if not exists width int,
  add column if not exists height int;

alter table if exists public.photos
  alter column url set not null,
  alter column status set not null,
  alter column status set default 'pending';

alter table if exists public.photos
drop constraint if exists photos_status_check;

alter table if exists public.photos
  add constraint photos_status_check
  check (status in ('pending', 'approved', 'rejected'));

alter table if exists public.photos
  drop column if exists rejection_reason,
  drop column if exists updated_at;

alter table if exists public.photos
  alter column created_at set default now();

-- Profiles table --------------------------------------------------------
alter table public.profiles
  add column if not exists display_name text,
  add column if not exists bio text;

-- Row Level Security ----------------------------------------------------
alter table public.photos enable row level security;

drop policy if exists "Owners manage their photos" on public.photos;
drop policy if exists "Approved photos visible" on public.photos;

do $$
begin
  if not exists (
    select 1 from pg_policies where polname = 'photos owners can insert' and tablename = 'photos'
  ) then
    create policy "photos owners can insert"
      on public.photos for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where polname = 'owners can view own photos' and tablename = 'photos'
  ) then
    create policy "owners can view own photos"
      on public.photos for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where polname = 'public can view approved photos' and tablename = 'photos'
  ) then
    create policy "public can view approved photos"
      on public.photos for select
      using (status = 'approved');
  end if;

  if not exists (
    select 1 from pg_policies where polname = 'owners can delete their own non-approved photos' and tablename = 'photos'
  ) then
    create policy "owners can delete their own non-approved photos"
      on public.photos for delete
      using (auth.uid() = user_id and status in ('pending','rejected'));
  end if;
end $$;

alter table public.profiles enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where polname = 'owner can update own profile' and tablename = 'profiles'
  ) then
    create policy "owner can update own profile"
      on public.profiles for update
      using (auth.uid() = id)
      with check (auth.uid() = id);
  end if;
end $$;
