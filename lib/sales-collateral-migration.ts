import { Pool } from "pg";

let pool: Pool | undefined;

function getPool(): Pool {
  if (pool) return pool;
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Missing POSTGRES_URL or DATABASE_URL environment variable.");
  pool = new Pool({
    connectionString,
    max: 1,
    ...(process.env.NODE_ENV === "production"
      ? { ssl: { rejectUnauthorized: true } }
      : connectionString.includes("localhost")
        ? { ssl: false }
        : {}),
  });
  return pool;
}

const SALES_COLLATERAL_MIGRATION_SQL = `
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
`;

export async function applySalesCollateralMigration(): Promise<{ applied: true; table: string; indexes: string[] }> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query(SALES_COLLATERAL_MIGRATION_SQL);
    const tableVerification = await client.query<{ table_name: string }>(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = current_schema()
         AND table_name = 'sales_collateral'`,
    );
    const indexVerification = await client.query<{ indexname: string }>(
      `SELECT indexname
       FROM pg_indexes
       WHERE schemaname = current_schema()
         AND tablename = 'sales_collateral'
         AND indexname IN (
           'sales_collateral_storage_path_uq',
           'sales_collateral_interaction_file_uq',
           'sales_collateral_organization_idx',
           'sales_collateral_contact_idx',
           'sales_collateral_tender_idx'
         )
       ORDER BY indexname`,
    );
    if (tableVerification.rows.length !== 1 || indexVerification.rows.length !== 5) {
      throw new Error("Sales collateral migration verification failed.");
    }
    await client.query("COMMIT");
    return {
      applied: true,
      table: tableVerification.rows[0].table_name,
      indexes: indexVerification.rows.map((row) => row.indexname),
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
