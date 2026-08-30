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

const EMAIL_TRACKING_MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS sales_email_tracking (
  id UUID PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  organization_id UUID NOT NULL REFERENCES sales_organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES sales_contacts(id) ON DELETE SET NULL,
  tender_opportunity_id UUID REFERENCES sales_tender_opportunities(id) ON DELETE SET NULL,
  interaction_id UUID REFERENCES sales_interactions(id) ON DELETE SET NULL,
  gmail_message_id TEXT,
  gmail_thread_id TEXT,
  campaign_source TEXT,
  approved_destination TEXT,
  subject TEXT,
  open_count INTEGER NOT NULL DEFAULT 0,
  first_opened_at TIMESTAMPTZ,
  last_opened_at TIMESTAMPTZ,
  click_count INTEGER NOT NULL DEFAULT 0,
  first_clicked_at TIMESTAMPTZ,
  last_clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS sales_email_tracking_organization_idx
  ON sales_email_tracking (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS sales_email_tracking_contact_idx
  ON sales_email_tracking (contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS sales_email_tracking_tender_idx
  ON sales_email_tracking (tender_opportunity_id) WHERE tender_opportunity_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS sales_email_tracking_gmail_message_uq
  ON sales_email_tracking (gmail_message_id) WHERE gmail_message_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS sales_email_tracking_events (
  id UUID PRIMARY KEY,
  tracking_id UUID NOT NULL REFERENCES sales_email_tracking(id) ON DELETE CASCADE,
  event_type VARCHAR(16) NOT NULL CHECK (event_type IN ('OPEN', 'CLICK')),
  occurred_at TIMESTAMPTZ NOT NULL,
  classification VARCHAR(32) NOT NULL DEFAULT 'UNKNOWN'
    CHECK (classification IN ('HUMAN_LIKELY', 'AUTOMATED_LIKELY', 'UNKNOWN')),
  user_agent TEXT,
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS sales_email_tracking_events_tracking_occurred_idx
  ON sales_email_tracking_events (tracking_id, occurred_at DESC);
`;

const SALES_INTERACTION_THREAD_MIGRATION_SQL = `
ALTER TABLE sales_interactions
  ADD COLUMN IF NOT EXISTS gmail_thread_id TEXT;

CREATE INDEX IF NOT EXISTS sales_interactions_organization_thread_idx
  ON sales_interactions (organization_id, gmail_thread_id)
  WHERE gmail_thread_id IS NOT NULL;
`;

export async function applyEmailTrackingMigration(): Promise<{ applied: true; tables: string[] }> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query(EMAIL_TRACKING_MIGRATION_SQL);
    const verification = await client.query<{ table_name: string }>(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = current_schema()
         AND table_name IN ('sales_email_tracking', 'sales_email_tracking_events')
       ORDER BY table_name`,
    );
    if (verification.rows.length !== 2) throw new Error("Email tracking migration verification failed.");
    await client.query("COMMIT");
    return { applied: true, tables: verification.rows.map((row) => row.table_name) };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function applySalesInteractionThreadMigration(): Promise<{ applied: true; column: string; index: string }> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query(SALES_INTERACTION_THREAD_MIGRATION_SQL);
    const columnVerification = await client.query<{ column_name: string }>(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = current_schema()
         AND table_name = 'sales_interactions'
         AND column_name = 'gmail_thread_id'`,
    );
    const indexVerification = await client.query<{ indexname: string }>(
      `SELECT indexname
       FROM pg_indexes
       WHERE schemaname = current_schema()
         AND tablename = 'sales_interactions'
         AND indexname = 'sales_interactions_organization_thread_idx'`,
    );
    if (columnVerification.rows.length !== 1 || indexVerification.rows.length !== 1) {
      throw new Error("Sales interaction thread migration verification failed.");
    }
    await client.query("COMMIT");
    return {
      applied: true,
      column: columnVerification.rows[0].column_name,
      index: indexVerification.rows[0].indexname,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
