import { Pool } from "pg";
import { trackingTokenHash, type EmailTrackingRecord } from "./email-tracking";

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

export async function attachEmailTrackingByToken(input: {
  token: string;
  gmailMessageId?: string;
  gmailThreadId?: string;
}): Promise<EmailTrackingRecord | undefined> {
  if (!input.token || input.token.length < 32 || input.token.length > 128) return undefined;
  const gmailMessageId = input.gmailMessageId?.trim() || null;
  const gmailThreadId = input.gmailThreadId?.trim() || null;
  const now = new Date().toISOString();
  const result = await getPool().query(
    `UPDATE sales_email_tracking t
     SET gmail_message_id=COALESCE(t.gmail_message_id,$2),
         gmail_thread_id=COALESCE(t.gmail_thread_id,$3),
         interaction_id=COALESCE(t.interaction_id, (
           SELECT i.id FROM sales_interactions i
           WHERE i.organization_id=t.organization_id
             AND i.direction='OUTBOUND'
             AND i.channel='EMAIL'
             AND (($2::text IS NOT NULL AND i.external_reference=$2)
               OR ($3::text IS NOT NULL AND i.gmail_thread_id=$3))
           ORDER BY i.occurred_at DESC
           LIMIT 1
         )),
         updated_at=$4
     WHERE t.token_hash=$1
     RETURNING t.*`,
    [trackingTokenHash(input.token), gmailMessageId, gmailThreadId, now],
  );
  const row = result.rows[0];
  if (!row) return undefined;
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    contactId: row.contact_id || undefined,
    tenderOpportunityId: row.tender_opportunity_id || undefined,
    interactionId: row.interaction_id || undefined,
    gmailMessageId: row.gmail_message_id || undefined,
    gmailThreadId: row.gmail_thread_id || undefined,
    campaignSource: row.campaign_source || undefined,
    approvedDestination: row.approved_destination || undefined,
    subject: row.subject || undefined,
    openCount: Number(row.open_count || 0),
    firstOpenedAt: row.first_opened_at ? new Date(row.first_opened_at).toISOString() : undefined,
    lastOpenedAt: row.last_opened_at ? new Date(row.last_opened_at).toISOString() : undefined,
    clickCount: Number(row.click_count || 0),
    firstClickedAt: row.first_clicked_at ? new Date(row.first_clicked_at).toISOString() : undefined,
    lastClickedAt: row.last_clicked_at ? new Date(row.last_clicked_at).toISOString() : undefined,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    replied: false,
    events: [],
  };
}
