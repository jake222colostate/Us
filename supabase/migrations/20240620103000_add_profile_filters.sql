-- Add relationship preference columns used by the mobile app feed filters
alter table public.profiles
  add column if not exists gender text,
  add column if not exists looking_for text,
  add column if not exists birthday date,
  add column if not exists interests text[] default array[]::text[],
  add column if not exists location text;

-- Apply enum-like constraints when the columns exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.constraint_column_usage
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND constraint_name = 'profiles_gender_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_gender_check
      CHECK (gender IS NULL OR gender in ('woman','man','nonbinary','other'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.constraint_column_usage
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND constraint_name = 'profiles_looking_for_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_looking_for_check
      CHECK (looking_for IS NULL OR looking_for in ('women','men','nonbinary','everyone'));
  END IF;
END$$;
