ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS quick_check_status VARCHAR(32) NOT NULL DEFAULT 'received',
  ADD COLUMN IF NOT EXISTS quick_check_id UUID,
  ADD COLUMN IF NOT EXISTS quick_check_result JSONB,
  ADD COLUMN IF NOT EXISTS quick_check_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS quick_check_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS quick_check_failed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS quick_check_error TEXT;
