CREATE TABLE IF NOT EXISTS sales_import_candidates (
  id UUID PRIMARY KEY,
  source_type VARCHAR(32) NOT NULL,
  source_key TEXT NOT NULL,
  organization_name TEXT NOT NULL,
  domain TEXT,
  proposed_status VARCHAR(32),
  proposed_objection VARCHAR(64),
  confidence SMALLINT,
  contacts_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  projects_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  interactions_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  evidence_summary TEXT NOT NULL DEFAULT '',
  matched_organization_id UUID REFERENCES sales_organizations(id) ON DELETE SET NULL,
  state VARCHAR(16) NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL,
  reviewed_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS sales_import_candidates_source_key_uq
  ON sales_import_candidates (source_type, source_key);
CREATE INDEX IF NOT EXISTS sales_import_candidates_state_idx
  ON sales_import_candidates (state, created_at DESC);
