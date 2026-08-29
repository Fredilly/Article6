import { createHash, randomBytes, randomUUID } from "crypto";
import { Pool, type QueryResultRow } from "pg";

export type EmailTrackingClassification = "HUMAN_LIKELY" | "AUTOMATED_LIKELY" | "UNKNOWN";
export type EmailTrackingEventType = "OPEN" | "CLICK";

export interface EmailTrackingRecord {
  id: string;
  organizationId: string;
  contactId?: string;
  tenderOpportunityId?: string;
  interactionId?: string;
  gmailMessageId?: string;
  gmailThreadId?: string;
  campaignSource?: string;
  approvedDestination?: string;
  subject?: string;
  openCount: number;
  firstOpenedAt?: string;
  lastOpenedAt?: string;
  clickCount: number;
  firstClickedAt?: string;
  lastClickedAt?: string;
  createdAt: string;
  updatedAt: string;
  replied: boolean;
  events: EmailTrackingEvent[];
}

export interface EmailTrackingEvent {
  id: string;
  eventType: EmailTrackingEventType;
  occurredAt: string;
  classification: EmailTrackingClassification;
  userAgent?: string;
}

let pool: Pool | undefined;
function getPool(): Pool {
  if (pool) return pool;
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Missing POSTGRES_URL or DATABASE_URL environment variable.");
  pool = new Pool({
    connectionString,
    max: 3,
    ...(process.env.NODE_ENV === "production"
      ? { ssl: { rejectUnauthorized: true } }
      : connectionString.includes("localhost")
        ? { ssl: false }
        : {}),
  });
  return pool;
}

export function createTrackingToken(): string {
  return randomBytes(32).toString("base64url");
}

export function trackingTokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function normalizeApprovedDestination(value?: string): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  const url = new URL(trimmed);
  if (url.protocol !== "https:") throw new Error("Tracked destination must use HTTPS.");
  const hostname = url.hostname.toLowerCase();
  if (hostname !== "article6.org" && !hostname.endsWith(".article6.org")) {
    throw new Error("Tracked destination must be on an Article6-owned domain.");
  }
  url.hash = "";
  return url.toString();
}

const AUTOMATED_UA_PATTERNS = [
  /googleimageproxy/i,
  /google-inspectiontool/i,
  /microsoft office/i,
  /microsoft outlook/i,
  /proofpoint/i,
  /mimecast/i,
  /barracuda/i,
  /safelinks/i,
  /urlscan/i,
  /security/i,
  /scanner/i,
  /bot\b/i,
  /crawler/i,
];

export function classifyTrackingEvent(input: {
  userAgent?: string;
  createdAt: string;
  occurredAt: string;
  eventType: EmailTrackingEventType;
}): EmailTrackingClassification {
  const ua = input.userAgent || "";
  if (AUTOMATED_UA_PATTERNS.some((pattern) => pattern.test(ua))) return "AUTOMATED_LIKELY";
  const elapsed = Date.parse(input.occurredAt) - Date.parse(input.createdAt);
  if (Number.isFinite(elapsed) && elapsed >= 0 && elapsed < 5_000) return "AUTOMATED_LIKELY";
  if (input.eventType === "CLICK" && /mozilla|chrome|safari|firefox|edge/i.test(ua)) return "HUMAN_LIKELY";
  return "UNKNOWN";
}

function iso(value: unknown): string | undefined {
  return value ? new Date(String(value)).toISOString() : undefined;
}

function toRecord(row: QueryResultRow, events: EmailTrackingEvent[] = []): EmailTrackingRecord {
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
    firstOpenedAt: iso(row.first_opened_at),
    lastOpenedAt: iso(row.last_opened_at),
    clickCount: Number(row.click_count || 0),
    firstClickedAt: iso(row.first_clicked_at),
    lastClickedAt: iso(row.last_clicked_at),
    createdAt: iso(row.created_at) || new Date(0).toISOString(),
    updatedAt: iso(row.updated_at) || new Date(0).toISOString(),
    replied: Boolean(row.replied),
    events,
  };
}

export async function createEmailTracking(input: {
  organizationId: string;
  contactId?: string;
  tenderOpportunityId?: string;
  campaignSource?: string;
  approvedDestination?: string;
  subject?: string;
}): Promise<{ token: string; record: EmailTrackingRecord }> {
  const token = createTrackingToken();
  const now = new Date().toISOString();
  const destination = normalizeApprovedDestination(input.approvedDestination);
  const result = await getPool().query(
    `INSERT INTO sales_email_tracking
      (id, token_hash, organization_id, contact_id, tender_opportunity_id, campaign_source, approved_destination, subject, created_at, updated_at)
     SELECT $1,$2,o.id,c.id,t.id,$6,$7,$8,$9,$9
     FROM sales_organizations o
     LEFT JOIN sales_contacts c ON c.id=$4 AND c.organization_id=o.id
     LEFT JOIN sales_tender_opportunities t ON t.id=$5 AND t.organization_id=o.id
     WHERE o.id=$3
       AND ($4::uuid IS NULL OR c.id IS NOT NULL)
       AND ($5::uuid IS NULL OR t.id IS NOT NULL)
     RETURNING *`,
    [randomUUID(), trackingTokenHash(token), input.organizationId, input.contactId || null, input.tenderOpportunityId || null, input.campaignSource?.trim() || null, destination || null, input.subject?.trim() || null, now],
  );
  if (!result.rows[0]) throw new Error("Organization, contact, or tender relationship is invalid.");
  return { token, record: toRecord(result.rows[0]) };
}

async function findByToken(token: string): Promise<QueryResultRow | undefined> {
  if (!token || token.length < 32 || token.length > 128) return undefined;
  const result = await getPool().query("SELECT * FROM sales_email_tracking WHERE token_hash=$1 LIMIT 1", [trackingTokenHash(token)]);
  return result.rows[0];
}

export async function recordEmailTrackingEvent(token: string, eventType: EmailTrackingEventType, userAgent?: string): Promise<EmailTrackingRecord | undefined> {
  const row = await findByToken(token);
  if (!row) return undefined;
  const occurredAt = new Date().toISOString();
  const classification = classifyTrackingEvent({ userAgent, createdAt: new Date(row.created_at).toISOString(), occurredAt, eventType });
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO sales_email_tracking_events (id, tracking_id, event_type, occurred_at, classification, user_agent, ip_hash, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,NULL,$4)`,
      [randomUUID(), row.id, eventType, occurredAt, classification, userAgent?.slice(0, 512) || null],
    );
    const updated = await client.query(
      eventType === "OPEN"
        ? `UPDATE sales_email_tracking SET open_count=open_count+1, first_opened_at=COALESCE(first_opened_at,$2), last_opened_at=$2, updated_at=$2 WHERE id=$1 RETURNING *`
        : `UPDATE sales_email_tracking SET click_count=click_count+1, first_clicked_at=COALESCE(first_clicked_at,$2), last_clicked_at=$2, updated_at=$2 WHERE id=$1 RETURNING *`,
      [row.id, occurredAt],
    );
    await client.query("COMMIT");
    return toRecord(updated.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getEmailTrackingDestination(token: string): Promise<string | undefined> {
  const row = await findByToken(token);
  return row?.approved_destination || undefined;
}

export async function attachEmailTracking(input: {
  token: string;
  gmailMessageId?: string;
  gmailThreadId?: string;
}): Promise<EmailTrackingRecord | undefined> {
  const row = await findByToken(input.token);
  if (!row) return undefined;
  const gmailMessageId = input.gmailMessageId?.trim() || null;
  const gmailThreadId = input.gmailThreadId?.trim() || null;
  const now = new Date().toISOString();
  const result = await getPool().query(
    `UPDATE sales_email_tracking t
     SET gmail_message_id=COALESCE(t.gmail_message_id,$2),
         gmail_thread_id=COALESCE(t.gmail_thread_id,$3),
         interaction_id=COALESCE(t.interaction_id, matching.id),
         updated_at=$4
     FROM LATERAL (
       SELECT i.id
       FROM sales_interactions i
       WHERE i.organization_id=t.organization_id
         AND i.direction='OUTBOUND'
         AND i.channel='EMAIL'
         AND (($2::text IS NOT NULL AND i.external_reference=$2)
           OR ($3::text IS NOT NULL AND i.gmail_thread_id=$3))
       ORDER BY i.occurred_at DESC
       LIMIT 1
     ) matching
     WHERE t.id=$1
     RETURNING t.*`,
    [row.id, gmailMessageId, gmailThreadId, now],
  );
  if (result.rows[0]) return toRecord(result.rows[0]);

  const fallback = await getPool().query(
    `UPDATE sales_email_tracking
     SET gmail_message_id=COALESCE(gmail_message_id,$2), gmail_thread_id=COALESCE(gmail_thread_id,$3), updated_at=$4
     WHERE id=$1 RETURNING *`,
    [row.id, gmailMessageId, gmailThreadId, now],
  );
  return fallback.rows[0] ? toRecord(fallback.rows[0]) : undefined;
}

export async function listEmailTracking(organizationId?: string): Promise<EmailTrackingRecord[]> {
  const result = await getPool().query(
    `SELECT t.*, EXISTS (
       SELECT 1 FROM sales_interactions i
       WHERE i.organization_id=t.organization_id
         AND i.direction='INBOUND'
         AND i.channel='EMAIL'
         AND t.gmail_thread_id IS NOT NULL
         AND i.gmail_thread_id=t.gmail_thread_id
         AND i.occurred_at >= t.created_at
     ) AS replied
     FROM sales_email_tracking t
     WHERE $1::uuid IS NULL OR t.organization_id=$1
     ORDER BY t.created_at DESC
     LIMIT 250`,
    [organizationId || null],
  );
  if (!result.rows.length) return [];
  const ids = result.rows.map((row) => row.id);
  const events = await getPool().query(
    `SELECT id, tracking_id, event_type, occurred_at, classification, user_agent
     FROM sales_email_tracking_events
     WHERE tracking_id = ANY($1::uuid[])
     ORDER BY occurred_at ASC`,
    [ids],
  );
  const byTracking = new Map<string, EmailTrackingEvent[]>();
  for (const row of events.rows) {
    const event: EmailTrackingEvent = {
      id: String(row.id),
      eventType: row.event_type as EmailTrackingEventType,
      occurredAt: new Date(row.occurred_at).toISOString(),
      classification: row.classification as EmailTrackingClassification,
      userAgent: row.user_agent || undefined,
    };
    byTracking.set(String(row.tracking_id), [...(byTracking.get(String(row.tracking_id)) || []), event]);
  }
  return result.rows.map((row) => toRecord(row, byTracking.get(String(row.id)) || []));
}
