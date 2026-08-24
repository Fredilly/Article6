-- Add product routing metadata without changing the existing submission/file model.
-- Existing rows remain Carbon submissions from article6.org.
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS submission_type VARCHAR(16) NOT NULL DEFAULT 'CARBON',
  ADD COLUMN IF NOT EXISTS source_site TEXT NOT NULL DEFAULT 'article6.org',
  ADD COLUMN IF NOT EXISTS product_metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'submissions_submission_type_check'
  ) THEN
    ALTER TABLE submissions
      ADD CONSTRAINT submissions_submission_type_check
      CHECK (submission_type IN ('CARBON', 'TENDER'));
  END IF;
END $$;
