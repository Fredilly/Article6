ALTER TABLE sales_organizations
  ADD COLUMN IF NOT EXISTS assigned_owner TEXT,
  ADD COLUMN IF NOT EXISTS next_action TEXT,
  ADD COLUMN IF NOT EXISTS next_action_date TIMESTAMPTZ;

ALTER TABLE sales_projects
  ADD COLUMN IF NOT EXISTS sales_status VARCHAR(32) NOT NULL DEFAULT 'NEW',
  ADD COLUMN IF NOT EXISTS assigned_owner TEXT,
  ADD COLUMN IF NOT EXISTS next_action TEXT,
  ADD COLUMN IF NOT EXISTS next_action_date TIMESTAMPTZ;

ALTER TABLE sales_tender_opportunities
  ADD COLUMN IF NOT EXISTS buyer_requirements TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS sales_status VARCHAR(32) NOT NULL DEFAULT 'NEW',
  ADD COLUMN IF NOT EXISTS assigned_owner TEXT,
  ADD COLUMN IF NOT EXISTS next_action TEXT,
  ADD COLUMN IF NOT EXISTS next_action_date TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS sales_project_documents (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES sales_projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  document_type VARCHAR(32) NOT NULL DEFAULT 'PDD',
  requested BOOLEAN NOT NULL DEFAULT TRUE,
  received BOOLEAN NOT NULL DEFAULT FALSE,
  received_at TIMESTAMPTZ,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS sales_project_documents_project_idx
  ON sales_project_documents (project_id, name ASC);

DO $$
DECLARE
  carbon_org_id UUID := '3a5b0d6a-1a6d-42b6-8a1d-0e3f4b6e9a11';
  carbon_contact_id UUID := '3f7c4d72-2c32-4e2a-a4c9-4e4c0d2d8b12';
  carbon_project_id UUID := '4e6f5a83-3d43-4f3b-b5da-5f5d1e3e9c13';
  tender_org_id UUID;
  tender_contact_id UUID;
  tender_id UUID := 'b6a4cf8e-7f93-4a72-97cf-0a5b7cf2f6d1';
  now_value TIMESTAMPTZ := NOW();
BEGIN
  INSERT INTO sales_organizations (id, name, normalized_name, experiment, status, notes, do_not_contact, assigned_owner, next_action, next_action_date, created_at, updated_at)
  VALUES (carbon_org_id, 'Green Horizon Carbon Ltd', 'green horizon carbon ltd', 'ARTICLE6_CARBON', 'ENGAGED', 'Seeded Carbon validation-readiness account.', FALSE, 'Demo owner', 'Confirm validation evidence pack', now_value + INTERVAL '7 days', now_value, now_value)
  ON CONFLICT (normalized_name) DO UPDATE SET experiment = EXCLUDED.experiment, status = EXCLUDED.status, assigned_owner = EXCLUDED.assigned_owner, next_action = EXCLUDED.next_action, next_action_date = EXCLUDED.next_action_date, updated_at = EXCLUDED.updated_at
  RETURNING id INTO carbon_org_id;

  INSERT INTO sales_contacts (id, organization_id, name, title, email, status, notes, created_at, updated_at)
  VALUES (carbon_contact_id, carbon_org_id, 'Alex Morgan', 'Validation Lead', 'alex.morgan@green-horizon.example', 'ACTIVE', 'Seeded Carbon contact.', now_value, now_value)
  ON CONFLICT (id) DO UPDATE SET organization_id = EXCLUDED.organization_id, name = EXCLUDED.name, title = EXCLUDED.title, email = EXCLUDED.email, updated_at = EXCLUDED.updated_at
  RETURNING id INTO carbon_contact_id;

  INSERT INTO sales_projects (id, vcs_id, name, methodology, methodology_version, stage, country, vvb, sales_status, assigned_owner, next_action, next_action_date, notes, created_at, updated_at)
  VALUES (carbon_project_id, 'demo-5075', 'VCS demo-5075 · Green Horizon Reforestation', 'VM0015', 'v2.0', 'Validation', 'Ireland', 'Demo VVB', 'ENGAGED', 'Demo owner', 'Confirm validation evidence pack', now_value + INTERVAL '7 days', 'Seeded Carbon project.', now_value, now_value)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, methodology = EXCLUDED.methodology, methodology_version = EXCLUDED.methodology_version, stage = EXCLUDED.stage, country = EXCLUDED.country, vvb = EXCLUDED.vvb, sales_status = EXCLUDED.sales_status, assigned_owner = EXCLUDED.assigned_owner, next_action = EXCLUDED.next_action, next_action_date = EXCLUDED.next_action_date, updated_at = EXCLUDED.updated_at;

  INSERT INTO sales_organization_projects (organization_id, project_id, role, created_at)
  VALUES (carbon_org_id, carbon_project_id, 'PROJECT_OWNER', now_value)
  ON CONFLICT (organization_id, project_id) DO UPDATE SET role = EXCLUDED.role;

  INSERT INTO sales_project_documents (id, project_id, name, document_type, requested, received, received_at, notes, created_at, updated_at)
  VALUES ('5f7a6b94-4e54-403c-c6eb-6a6e2f4fad14', carbon_project_id, 'Project Design Document', 'PDD', TRUE, TRUE, now_value, 'Seeded Carbon document relationship.', now_value, now_value)
  ON CONFLICT (id) DO UPDATE SET project_id = EXCLUDED.project_id, name = EXCLUDED.name, received = EXCLUDED.received, received_at = EXCLUDED.received_at, updated_at = EXCLUDED.updated_at;

  INSERT INTO sales_interactions (id, organization_id, contact_id, project_id, channel, direction, interaction_type, occurred_at, subject, summary, outcome_code, created_at)
  VALUES ('6a8b7ca5-5f65-414d-d7fc-7b7f3f5abe15', carbon_org_id, carbon_contact_id, carbon_project_id, 'EMAIL', 'INBOUND', 'MESSAGE', now_value - INTERVAL '2 days', 'Validation evidence pack', 'Alex confirmed the evidence pack is being assembled for validation review.', 'FOLLOW_UP', now_value - INTERVAL '2 days')
  ON CONFLICT (id) DO NOTHING;

  SELECT id INTO tender_org_id FROM sales_organizations WHERE normalized_name = 'creative driven goals (cdg)';
  SELECT id INTO tender_contact_id FROM sales_contacts WHERE organization_id = tender_org_id AND name = 'Dr Paul Mc Cann' LIMIT 1;

  UPDATE sales_tender_opportunities
  SET sales_status = 'OPPORTUNITY', assigned_owner = 'Demo owner', next_action = 'Collect requested tender documents', next_action_date = '2026-08-26 10:00:00 Europe/Dublin', buyer_requirements = 'Website design and development response with relevant delivery examples.'
  WHERE id = tender_id;

  INSERT INTO sales_tender_documents (id, tender_opportunity_id, name, requested, received, received_at, notes, created_at, updated_at)
  VALUES ('7b9c8db6-6076-425e-e8ad-8c80406bcf16', tender_id, 'Company capability statement', TRUE, FALSE, NULL, 'Seeded tender document request.', now_value, now_value),
         ('8cad9ec7-7187-436f-f9be-9d91517dc017', tender_id, 'Relevant website case studies', TRUE, TRUE, now_value, 'Seeded received tender document.', now_value, now_value)
  ON CONFLICT (id) DO UPDATE SET tender_opportunity_id = EXCLUDED.tender_opportunity_id, name = EXCLUDED.name, requested = EXCLUDED.requested, received = EXCLUDED.received, received_at = EXCLUDED.received_at, updated_at = EXCLUDED.updated_at;

  UPDATE sales_tender_opportunities
  SET documents_requested = (SELECT COUNT(*) FROM sales_tender_documents WHERE tender_opportunity_id = tender_id AND requested),
      documents_received = (SELECT COUNT(*) FROM sales_tender_documents WHERE tender_opportunity_id = tender_id AND received)
  WHERE id = tender_id;

  INSERT INTO sales_interactions (id, organization_id, contact_id, tender_opportunity_id, channel, direction, interaction_type, occurred_at, subject, summary, outcome_code, created_at)
  VALUES ('9dbeafd8-8298-4470-aacf-ae02628ed128', tender_org_id, tender_contact_id, tender_id, 'EMAIL', 'INBOUND', 'MESSAGE', now_value - INTERVAL '1 day', 'AHRRA RFT documents', 'Dr Paul shared the initial tender requirements and requested confirmation of the response documents.', 'DOCUMENTS_REQUESTED', now_value - INTERVAL '1 day')
  ON CONFLICT (id) DO NOTHING;
END $$;
