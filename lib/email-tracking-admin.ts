import { Pool } from "pg";

let pool: Pool | undefined;

function getPool(): Pool {
  if (pool) return pool;
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Missing POSTGRES_URL or DATABASE_URL environment variable.");
  pool = new Pool({
    connectionString,
    max: 2,
    ...(process.env.NODE_ENV === "production"
      ? { ssl: { rejectUnauthorized: true } }
      : connectionString.includes("localhost")
        ? { ssl: false }
        : {}),
  });
  return pool;
}

export type EmailActivityEventType = "OPEN" | "CLICK";
export type EmailActivityClassification = "HUMAN_LIKELY" | "AUTOMATED_LIKELY" | "UNKNOWN";

export interface ListEmailActivityFilters {
  since?: string;
  until?: string;
  eventType?: EmailActivityEventType;
  organizationId?: string;
  classification?: EmailActivityClassification;
}

export interface EmailActivityRow {
  organizationId: string;
  organizationName: string;
  contactId: string | null;
  contactName: string | null;
  tenderId: string | null;
  tenderName: string | null;
  subject: string | null;
  eventType: EmailActivityEventType;
  timestamp: string;
  classification: EmailActivityClassification;
  openCount: number;
  clickCount: number;
}

export async function listEmailActivity(filters: ListEmailActivityFilters): Promise<EmailActivityRow[]> {
  const clauses: string[] = [];
  const values: unknown[] = [];

  const addFilter = (sql: string, value: unknown) => {
    values.push(value);
    clauses.push(sql.replace("?", `$${values.length}`));
  };

  if (filters.since) addFilter("e.occurred_at >= ?::timestamptz", filters.since);
  if (filters.until) addFilter("e.occurred_at <= ?::timestamptz", filters.until);
  if (filters.eventType) addFilter("e.event_type = ?", filters.eventType);
  if (filters.organizationId) addFilter("t.organization_id = ?::uuid", filters.organizationId);
  if (filters.classification) addFilter("e.classification = ?", filters.classification);

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const result = await getPool().query(
    `SELECT
       t.organization_id AS "organizationId",
       o.name AS "organizationName",
       t.contact_id AS "contactId",
       c.name AS "contactName",
       t.tender_opportunity_id AS "tenderId",
       tender.name AS "tenderName",
       t.subject,
       e.event_type AS "eventType",
       e.occurred_at AS "timestamp",
       e.classification,
       t.open_count AS "openCount",
       t.click_count AS "clickCount"
     FROM sales_email_tracking_events e
     JOIN sales_email_tracking t ON t.id = e.tracking_id
     JOIN sales_organizations o ON o.id = t.organization_id
     LEFT JOIN sales_contacts c ON c.id = t.contact_id
     LEFT JOIN sales_tender_opportunities tender ON tender.id = t.tender_opportunity_id
     ${where}
     ORDER BY e.occurred_at DESC
     LIMIT 500`,
    values,
  );

  return result.rows.map((row) => ({
    ...row,
    timestamp: row.timestamp instanceof Date ? row.timestamp.toISOString() : new Date(row.timestamp).toISOString(),
    openCount: Number(row.openCount || 0),
    clickCount: Number(row.clickCount || 0),
  })) as EmailActivityRow[];
}

export async function clearEmailTrackingHistory(): Promise<{ trackingDeleted: number; eventsDeleted: number }> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const events = await client.query("DELETE FROM sales_email_tracking_events");
    const tracking = await client.query("DELETE FROM sales_email_tracking");
    await client.query("COMMIT");
    return { trackingDeleted: tracking.rowCount || 0, eventsDeleted: events.rowCount || 0 };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
