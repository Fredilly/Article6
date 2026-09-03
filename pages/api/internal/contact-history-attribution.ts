import type { NextApiRequest, NextApiResponse } from "next";
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).setHeader("Allow", "GET").json({ error: "Method not allowed." });

  const organizationId = typeof req.query.organizationId === "string" ? req.query.organizationId.trim() : "";
  const contactId = typeof req.query.contactId === "string" ? req.query.contactId.trim() : "";
  if (!organizationId || !contactId) return res.status(400).json({ error: "organizationId and contactId are required." });

  try {
    const result = await getPool().query(
      `SELECT DISTINCT ON (i.id)
         i.id,
         i.occurred_at,
         i.subject,
         i.summary,
         i.external_reference,
         actual.name AS actual_contact_name,
         actual.email AS actual_contact_email,
         intended.name AS intended_contact_name,
         intended.email AS intended_contact_email
       FROM sales_email_tracking t
       JOIN LATERAL (
         SELECT i.*
         FROM sales_interactions i
         WHERE i.organization_id = t.organization_id
           AND (
             (t.interaction_id IS NOT NULL AND i.id = t.interaction_id)
             OR (t.gmail_message_id IS NOT NULL AND i.external_reference = 'gmail:' || t.gmail_message_id)
             OR (t.gmail_thread_id IS NOT NULL AND i.gmail_thread_id = t.gmail_thread_id)
             OR (
               t.subject IS NOT NULL
               AND i.subject = t.subject
               AND ABS(EXTRACT(EPOCH FROM (i.occurred_at - t.created_at))) <= 3600
             )
           )
         ORDER BY
           CASE
             WHEN t.interaction_id IS NOT NULL AND i.id = t.interaction_id THEN 0
             WHEN t.gmail_message_id IS NOT NULL AND i.external_reference = 'gmail:' || t.gmail_message_id THEN 1
             WHEN t.gmail_thread_id IS NOT NULL AND i.gmail_thread_id = t.gmail_thread_id THEN 2
             ELSE 3
           END,
           ABS(EXTRACT(EPOCH FROM (i.occurred_at - t.created_at))) ASC
         LIMIT 1
       ) i ON TRUE
       LEFT JOIN sales_contacts actual ON actual.id = i.contact_id
       LEFT JOIN sales_contacts intended ON intended.id = t.contact_id
       WHERE t.organization_id = $1
         AND t.contact_id = $2
         AND i.contact_id IS DISTINCT FROM t.contact_id
       ORDER BY i.id, i.occurred_at ASC`,
      [organizationId, contactId],
    );

    return res.status(200).json({
      ok: true,
      items: result.rows.map((row) => ({
        id: String(row.id),
        occurredAt: new Date(row.occurred_at).toISOString(),
        subject: row.subject || null,
        summary: String(row.summary || ""),
        externalReference: row.external_reference || null,
        actualContactName: row.actual_contact_name || null,
        actualContactEmail: row.actual_contact_email || null,
        intendedContactName: row.intended_contact_name || null,
        intendedContactEmail: row.intended_contact_email || null,
      })),
    });
  } catch (error) {
    console.error("Contact history attribution failed", error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error." });
  }
}
