-- Carbon project relationship integrity only. Tender tables and workflows are intentionally untouched.

-- Normalize legacy free-text relationship roles before enforcing the supported vocabulary.
UPDATE sales_organization_projects
SET role = CASE upper(regexp_replace(trim(role), '[[:space:]-]+', '_', 'g'))
  WHEN 'DEVELOPER' THEN 'DEVELOPER'
  WHEN 'PROJECT_DEVELOPER' THEN 'DEVELOPER'
  WHEN 'OWNER' THEN 'OWNER'
  WHEN 'PROJECT_OWNER' THEN 'OWNER'
  WHEN 'CONSULTANT' THEN 'CONSULTANT'
  WHEN 'TECHNICAL_CONSULTANT' THEN 'CONSULTANT'
  WHEN 'PDD_AUTHOR' THEN 'PDD_AUTHOR'
  WHEN 'PDD_WRITER' THEN 'PDD_AUTHOR'
  WHEN 'INVESTOR' THEN 'INVESTOR'
  WHEN 'VALIDATION_BODY' THEN 'VALIDATION_BODY'
  WHEN 'VALIDATOR' THEN 'VALIDATION_BODY'
  WHEN 'VVB' THEN 'VALIDATION_BODY'
  WHEN 'IMPLEMENTING_PARTNER' THEN 'IMPLEMENTING_PARTNER'
  WHEN 'IMPLEMENTATION_PARTNER' THEN 'IMPLEMENTING_PARTNER'
  WHEN 'OTHER' THEN 'OTHER'
  ELSE 'OTHER'
END
WHERE role IS DISTINCT FROM CASE upper(regexp_replace(trim(role), '[[:space:]-]+', '_', 'g'))
  WHEN 'DEVELOPER' THEN 'DEVELOPER'
  WHEN 'PROJECT_DEVELOPER' THEN 'DEVELOPER'
  WHEN 'OWNER' THEN 'OWNER'
  WHEN 'PROJECT_OWNER' THEN 'OWNER'
  WHEN 'CONSULTANT' THEN 'CONSULTANT'
  WHEN 'TECHNICAL_CONSULTANT' THEN 'CONSULTANT'
  WHEN 'PDD_AUTHOR' THEN 'PDD_AUTHOR'
  WHEN 'PDD_WRITER' THEN 'PDD_AUTHOR'
  WHEN 'INVESTOR' THEN 'INVESTOR'
  WHEN 'VALIDATION_BODY' THEN 'VALIDATION_BODY'
  WHEN 'VALIDATOR' THEN 'VALIDATION_BODY'
  WHEN 'VVB' THEN 'VALIDATION_BODY'
  WHEN 'IMPLEMENTING_PARTNER' THEN 'IMPLEMENTING_PARTNER'
  WHEN 'IMPLEMENTATION_PARTNER' THEN 'IMPLEMENTING_PARTNER'
  WHEN 'OTHER' THEN 'OTHER'
  ELSE 'OTHER'
END;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_organization_projects_role_check') THEN
    ALTER TABLE sales_organization_projects
      ADD CONSTRAINT sales_organization_projects_role_check
      CHECK (role IN ('DEVELOPER', 'OWNER', 'CONSULTANT', 'PDD_AUTHOR', 'INVESTOR', 'VALIDATION_BODY', 'IMPLEMENTING_PARTNER', 'OTHER'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS sales_project_contacts (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES sales_projects(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES sales_contacts(id) ON DELETE CASCADE,
  role VARCHAR(64) NOT NULL DEFAULT 'OTHER',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (project_id, contact_id)
);

CREATE INDEX IF NOT EXISTS sales_project_contacts_project_idx
  ON sales_project_contacts (project_id, role, contact_id);
CREATE INDEX IF NOT EXISTS sales_project_contacts_contact_idx
  ON sales_project_contacts (contact_id, project_id);

-- Preserve any pre-existing invalid rows while preventing new disconnected
-- carbon project interactions. A later data cleanup can validate this constraint.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_interactions_project_organization_fk') THEN
    ALTER TABLE sales_interactions
      ADD CONSTRAINT sales_interactions_project_organization_fk
      FOREIGN KEY (organization_id, project_id)
      REFERENCES sales_organization_projects (organization_id, project_id)
      NOT VALID;
  END IF;
END $$;
