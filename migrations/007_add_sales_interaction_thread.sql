ALTER TABLE sales_interactions
  ADD COLUMN IF NOT EXISTS gmail_thread_id TEXT;

CREATE INDEX IF NOT EXISTS sales_interactions_organization_thread_idx
  ON sales_interactions (organization_id, gmail_thread_id)
  WHERE gmail_thread_id IS NOT NULL;

-- Do not reinterpret external_reference here: existing imports may contain a
-- Gmail message id rather than a thread id. The application groups legacy rows
-- conservatively by contact, subject, and timestamp proximity instead.
