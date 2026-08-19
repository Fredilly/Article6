ALTER TABLE sales_organizations
  ADD COLUMN IF NOT EXISTS experiment VARCHAR(64) NOT NULL DEFAULT 'ARTICLE6_CARBON';

CREATE INDEX IF NOT EXISTS sales_organizations_experiment_idx
  ON sales_organizations (experiment);
