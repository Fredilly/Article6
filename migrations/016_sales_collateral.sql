CREATE TABLE IF NOT EXISTS sales_collateral (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES sales_organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES sales_contacts(id) ON DELETE SET NULL,
  tender_opportunity_id UUID REFERENCES sales_tender_opportunities(id) ON DELETE SET NULL,
  interaction_id UUID REFERENCES sales_interactions(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT,
  document_type TEXT NOT NULL CHECK (document_type IN ('SAMPLE_REVIEW','PROPOSAL','CASE_STUDY','METHODOLOGY','PRICING','BROCHURE','OTHER')),
  description TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS sales_collateral_storage_path_uq
  ON sales_collateral(storage_path);

CREATE UNIQUE INDEX IF NOT EXISTS sales_collateral_interaction_file_uq
  ON sales_collateral(organization_id, interaction_id, LOWER(file_name))
  WHERE interaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS sales_collateral_organization_idx
  ON sales_collateral(organization_id, COALESCE(sent_at, created_at) DESC);

CREATE INDEX IF NOT EXISTS sales_collateral_contact_idx
  ON sales_collateral(contact_id)
  WHERE contact_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS sales_collateral_tender_idx
  ON sales_collateral(tender_opportunity_id)
  WHERE tender_opportunity_id IS NOT NULL;
