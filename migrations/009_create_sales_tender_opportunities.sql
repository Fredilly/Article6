CREATE TABLE IF NOT EXISTS sales_tender_opportunities (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES sales_organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES sales_contacts(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  buyer TEXT,
  reference_number TEXT,
  submission_deadline TIMESTAMPTZ,
  contract_value NUMERIC(14, 2),
  sector TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'NEW',
  notes TEXT NOT NULL DEFAULT '',
  documents_requested INTEGER NOT NULL DEFAULT 0,
  documents_received INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS sales_tender_opportunities_organization_idx
  ON sales_tender_opportunities (organization_id, submission_deadline ASC);
CREATE INDEX IF NOT EXISTS sales_tender_opportunities_contact_idx
  ON sales_tender_opportunities (contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS sales_tender_opportunities_status_idx
  ON sales_tender_opportunities (status, submission_deadline ASC);

CREATE TABLE IF NOT EXISTS sales_tender_documents (
  id UUID PRIMARY KEY,
  tender_opportunity_id UUID NOT NULL REFERENCES sales_tender_opportunities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  requested BOOLEAN NOT NULL DEFAULT TRUE,
  received BOOLEAN NOT NULL DEFAULT FALSE,
  received_at TIMESTAMPTZ,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS sales_tender_documents_opportunity_idx
  ON sales_tender_documents (tender_opportunity_id, name ASC);

ALTER TABLE sales_interactions
  ADD COLUMN IF NOT EXISTS tender_opportunity_id UUID REFERENCES sales_tender_opportunities(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS sales_interactions_tender_opportunity_idx
  ON sales_interactions (tender_opportunity_id, occurred_at DESC)
  WHERE tender_opportunity_id IS NOT NULL;

DO $$
DECLARE
  org_id UUID;
  contact_id UUID;
  tender_id UUID := 'b6a4cf8e-7f93-4a72-97cf-0a5b7cf2f6d1';
  now_value TIMESTAMPTZ := NOW();
BEGIN
  INSERT INTO sales_organizations (id, name, normalized_name, experiment, status, notes, do_not_contact, created_at, updated_at)
  VALUES ('0df9d4cb-07b1-47a1-9a3d-5d4dd0bd4b22', 'Creative Driven Goals (CDG)', 'creative driven goals (cdg)', 'TENDER_READINESS', 'OPPORTUNITY', '', FALSE, now_value, now_value)
  ON CONFLICT (normalized_name) DO UPDATE SET experiment = 'TENDER_READINESS', updated_at = EXCLUDED.updated_at
  RETURNING id INTO org_id;

  IF org_id IS NULL THEN
    SELECT id INTO org_id FROM sales_organizations WHERE normalized_name = 'creative driven goals (cdg)';
  END IF;

  INSERT INTO sales_contacts (id, organization_id, name, status, notes, created_at, updated_at)
  VALUES ('d3a5540e-4be0-48df-b3ca-ecf9e6c8f2b4', org_id, 'Dr Paul Mc Cann', 'ACTIVE', '', now_value, now_value)
  ON CONFLICT (id) DO UPDATE SET organization_id = EXCLUDED.organization_id, name = EXCLUDED.name, updated_at = EXCLUDED.updated_at
  RETURNING id INTO contact_id;

  IF contact_id IS NULL THEN
    SELECT c.id INTO contact_id FROM sales_contacts c WHERE c.organization_id = org_id AND c.name = 'Dr Paul Mc Cann' LIMIT 1;
  END IF;

  INSERT INTO sales_tender_opportunities (id, organization_id, contact_id, name, status, submission_deadline, notes, documents_requested, documents_received, created_at, updated_at)
  VALUES (tender_id, org_id, contact_id, 'AHRRA Website Design and Development Services RFT', 'DOCUMENTS_REQUESTED', '2026-09-02 15:00:00 Europe/Dublin', '', 0, 0, now_value, now_value)
  ON CONFLICT (id) DO UPDATE SET organization_id = EXCLUDED.organization_id, contact_id = EXCLUDED.contact_id, name = EXCLUDED.name, status = EXCLUDED.status, submission_deadline = EXCLUDED.submission_deadline, updated_at = EXCLUDED.updated_at;
END $$;
