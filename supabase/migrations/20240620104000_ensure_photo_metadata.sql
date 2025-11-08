-- Guarantee metadata columns used by the mobile clients exist on photos
alter table public.photos
  add column if not exists content_type text,
  add column if not exists width int,
  add column if not exists height int,
  add column if not exists rejection_reason text;

-- Reinstate the status constraint expected by the app
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.constraint_column_usage
    WHERE table_schema = 'public'
      AND table_name = 'photos'
      AND constraint_name = 'photos_status_check'
  ) THEN
    -- nothing to do, constraint already present
    RETURN;
  END IF;

  ALTER TABLE public.photos
    ADD CONSTRAINT photos_status_check
    CHECK (status in ('pending','approved','rejected'));
END$$;
