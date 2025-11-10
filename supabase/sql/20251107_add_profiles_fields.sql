-- Add commonly referenced profile fields if they don't exist
alter table public.profiles
  add column if not exists birthday date,
  add column if not exists gender text check (gender in ('male','female','nonbinary','other','prefer_not_to_say')),
  add column if not exists bio text,
  add column if not exists display_name text;

-- (Optional) keep a last-updated timestamp
alter table public.profiles
  add column if not exists updated_at timestamptz default now();

-- Lightweight RLS policy to allow users to update their own profile fields
-- (Skip if you already have RLS/policies set up)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_update_own_row'
  ) then
    create policy "profiles_update_own_row"
      on public.profiles for update
      using (auth.uid() = id)
      with check (auth.uid() = id);
  end if;
end $$;
