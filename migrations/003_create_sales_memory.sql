CREATE TABLE IF NOT EXISTS sales_organizations (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  domain TEXT,
  country TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'NEW',
  objection_code VARCHAR(64),
  internal_certification_team BOOLEAN,
  notes TEXT NOT NULL DEFAULT '',
  do_not_contact BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS sales_organizations_normalized_name_uq
  ON sales_organizations (normalized_name);
CREATE UNIQUE INDEX IF NOT EXISTS sales_organizations_domain_uq
  ON sales_organizations (domain) WHERE domain IS NOT NULL;

CREATE TABLE IF NOT EXISTS sales_contacts (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES sales_organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  phone TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS sales_contacts_email_uq
  ON sales_contacts (LOWER(email)) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS sales_contacts_organization_idx
  ON sales_contacts (organization_id);

CREATE TABLE IF NOT EXISTS sales_projects (
  id UUID PRIMARY KEY,
  vcs_id TEXT,
  name TEXT NOT NULL,
  methodology TEXT,
  methodology_version TEXT,
  stage TEXT,
  country TEXT,
  vvb TEXT,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS sales_projects_vcs_id_uq
  ON sales_projects (vcs_id) WHERE vcs_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS sales_organization_projects (
  organization_id UUID NOT NULL REFERENCES sales_organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES sales_projects(id) ON DELETE CASCADE,
  role VARCHAR(64) NOT NULL DEFAULT 'OTHER',
  created_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (organization_id, project_id)
);

CREATE TABLE IF NOT EXISTS sales_interactions (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES sales_organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES sales_contacts(id) ON DELETE SET NULL,
  project_id UUID REFERENCES sales_projects(id) ON DELETE SET NULL,
  channel VARCHAR(32) NOT NULL,
  direction VARCHAR(16) NOT NULL,
  interaction_type VARCHAR(32) NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  subject TEXT,
  summary TEXT NOT NULL,
  outcome_code VARCHAR(64),
  external_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS sales_interactions_organization_occurred_idx
  ON sales_interactions (organization_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS sales_interactions_contact_idx
  ON sales_interactions (contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS sales_interactions_project_idx
  ON sales_interactions (project_id) WHERE project_id IS NOT NULL;
