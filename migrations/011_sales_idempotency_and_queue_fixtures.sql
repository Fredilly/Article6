ALTER TABLE sales_interactions
  ADD COLUMN IF NOT EXISTS is_imported BOOLEAN NOT NULL DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS sales_interactions_imported_external_reference_uq
  ON sales_interactions (external_reference)
  WHERE is_imported AND external_reference IS NOT NULL;

ALTER TABLE sales_tender_opportunities
  ADD COLUMN IF NOT EXISTS source_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS sales_tender_opportunities_source_key_uq
  ON sales_tender_opportunities (organization_id, source_key)
  WHERE source_key IS NOT NULL;

ALTER TABLE sales_tender_documents
  ADD COLUMN IF NOT EXISTS source_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS sales_tender_documents_source_key_uq
  ON sales_tender_documents (tender_opportunity_id, source_key)
  WHERE source_key IS NOT NULL;

ALTER TABLE sales_project_documents
  ADD COLUMN IF NOT EXISTS source_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS sales_project_documents_source_key_uq
  ON sales_project_documents (project_id, source_key)
  WHERE source_key IS NOT NULL;

DO $$
DECLARE
  now_value TIMESTAMPTZ := NOW();
  new_org_id UUID := 'a1c2d3e4-f506-4789-8abc-123456789001';
  new_tender_id UUID := 'a1c2d3e4-f506-4789-8abc-123456789002';
  engaged_project_id UUID := 'a1c2d3e4-f506-4789-8abc-123456789003';
  carbon_project_id UUID := '4e6f5a83-3d43-4f3b-b5da-5f5d1e3e9c13';
  tender_id UUID := 'b6a4cf8e-7f93-4a72-97cf-0a5b7cf2f6d1';
BEGIN
  -- Fixed dates keep the execution queue useful in preview and regression tests.
  UPDATE sales_projects
  SET sales_status = 'ENGAGED', next_action = 'Confirm validation evidence pack', next_action_date = '2026-08-01 10:00:00 Europe/Dublin'
  WHERE id = carbon_project_id;

  UPDATE sales_tender_opportunities
  SET source_key = 'demo-ahrra-rft', sales_status = 'OPPORTUNITY', next_action = 'Collect requested tender documents', next_action_date = '2026-08-26 10:00:00 Europe/Dublin'
  WHERE id = tender_id;

  INSERT INTO sales_projects (id, vcs_id, name, methodology, methodology_version, stage, country, vvb, sales_status, assigned_owner, next_action, next_action_date, notes, created_at, updated_at)
  VALUES (engaged_project_id, 'demo-5066', 'VCS demo-5066 · Green Horizon Wetland Restoration', 'VM0007', 'v1.1', 'Validation', 'Ireland', 'Demo VVB', 'ENGAGED', 'Demo owner', NULL, NULL, 'Seeded ENGAGED-without-next-action Carbon example.', now_value, now_value)
  ON CONFLICT (id) DO UPDATE SET sales_status = EXCLUDED.sales_status, assigned_owner = EXCLUDED.assigned_owner, next_action = NULL, next_action_date = NULL, updated_at = EXCLUDED.updated_at;

  INSERT INTO sales_organization_projects (organization_id, project_id, role, created_at)
  SELECT o.id, engaged_project_id, 'PROJECT_OWNER', now_value
  FROM sales_organizations o
  WHERE o.normalized_name = 'green horizon carbon ltd'
  ON CONFLICT (organization_id, project_id) DO NOTHING;

  INSERT INTO sales_organizations (id, name, normalized_name, experiment, status, notes, do_not_contact, created_at, updated_at)
  VALUES (new_org_id, 'Demo New Prospect Ltd', 'demo new prospect ltd', 'TENDER_READINESS', 'NEW', 'Seeded NEW-without-outreach Tender example.', FALSE, now_value, now_value)
  ON CONFLICT (normalized_name) DO UPDATE SET experiment = EXCLUDED.experiment, status = EXCLUDED.status, notes = EXCLUDED.notes, do_not_contact = FALSE, updated_at = EXCLUDED.updated_at;

  INSERT INTO sales_tender_opportunities (id, organization_id, name, buyer, reference_number, submission_deadline, sector, status, notes, sales_status, source_key, created_at, updated_at)
  SELECT new_tender_id, o.id, 'Demo Website Accessibility RFT', 'Demo Public Buyer', 'DEMO-RFT-001', '2026-10-15 15:00:00 Europe/Dublin', 'Public sector', 'NEW', 'Seeded NEW-without-outreach Tender example.', 'NEW', 'demo-new-website-rft', now_value, now_value
  FROM sales_organizations o
  WHERE o.normalized_name = 'demo new prospect ltd'
  ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, sales_status = EXCLUDED.sales_status, next_action = NULL, next_action_date = NULL, updated_at = EXCLUDED.updated_at;

  UPDATE sales_tender_documents SET source_key = 'demo-ahrra-capability' WHERE id = '7b9c8db6-6076-425e-e8ad-8c80406bcf16';
  UPDATE sales_tender_documents SET source_key = 'demo-ahrra-case-studies' WHERE id = '8cad9ec7-7187-436f-f9be-9d91517dc017';
  UPDATE sales_project_documents SET source_key = 'demo-green-horizon-pdd' WHERE id = '5f7a6b94-4e54-403c-c6eb-6a6e2f4fad14';
END $$;
