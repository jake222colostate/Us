-- Ensure profiles table supports gender and feed preferences
alter table public.profiles
  add column if not exists gender text,
  add column if not exists looking_for text;

alter table public.profiles
  drop constraint if exists profiles_gender_check;

alter table public.profiles
  add constraint profiles_gender_check
    check (gender is null or gender in ('woman', 'man', 'nonbinary', 'other'));

alter table public.profiles
  drop constraint if exists profiles_looking_for_check;

alter table public.profiles
  add constraint profiles_looking_for_check
    check (looking_for is null or looking_for in ('women', 'men', 'nonbinary', 'everyone'));

alter table public.profiles
  alter column looking_for set default 'everyone';
