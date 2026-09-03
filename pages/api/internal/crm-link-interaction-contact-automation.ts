import type { NextApiRequest, NextApiResponse } from "next";
import { Pool } from "pg";
import { verifyGitHubActionsOidc } from "../../../lib/github-actions-oidc";

let pool: Pool | undefined;
function getPool(): Pool {
  if (pool) return pool;
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Missing POSTGRES_URL or DATABASE_URL environment variable.");
  pool = new Pool({
    connectionString,
    max: 2,
    ...(process.env.NODE_ENV === "production" ? { ssl: { rejectUnauthorized: true } } : connectionString.includes("localhost") ? { ssl: false } : {}),
  });
  return pool;
}

function bearerToken(req: NextApiRequest): string | null {
  const authorization = req.headers.authorization || "";
  return authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : null;
}

interface Command {
  version: 1;
  operation: "link_interaction_contact";
  interactionId: string;
  contactId: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).setHeader("Allow", "POST").json({ error: "Method not allowed." });
  try {
    const token = bearerToken(req);
    if (!token) return res.status(401).json({ error: "Bearer token required." });
    await verifyGitHubActionsOidc(token);

    const command = req.body as Command;
    if (!command || command.version !== 1 || command.operation !== "link_interaction_contact") {
      return res.status(400).json({ error: "Invalid link_interaction_contact command." });
    }
    const interactionId = command.interactionId?.trim();
    const contactId = command.contactId?.trim();
    if (!interactionId || !contactId) return res.status(400).json({ error: "interactionId and contactId are required." });

    const db = getPool();
    const pair = await db.query(
      `SELECT i.organization_id, i.contact_id AS existing_contact_id, c.organization_id AS contact_organization_id
       FROM sales_interactions i
       JOIN sales_contacts c ON c.id = $2
       WHERE i.id = $1`,
      [interactionId, contactId],
    );
    const row = pair.rows[0];
    if (!row) return res.status(404).json({ error: "Interaction or contact not found." });
    if (String(row.organization_id) !== String(row.contact_organization_id)) {
      return res.status(400).json({ error: "Interaction and contact belong to different organizations." });
    }
    if (row.existing_contact_id && String(row.existing_contact_id) !== contactId) {
      return res.status(409).json({ error: "Interaction is already linked to a different contact." });
    }

    await db.query("UPDATE sales_interactions SET contact_id = $2 WHERE id = $1", [interactionId, contactId]);
    const verified = await db.query(
      `SELECT i.id, i.organization_id, i.contact_id, i.external_reference, c.name AS contact_name
       FROM sales_interactions i
       JOIN sales_contacts c ON c.id = i.contact_id
       WHERE i.id = $1 AND i.contact_id = $2`,
      [interactionId, contactId],
    );
    if (!verified.rows[0]) throw new Error("CRM interaction-contact linkage verification failed.");

    return res.status(200).json({
      ok: true,
      operation: "link_interaction_contact",
      result: {
        interactionId: String(verified.rows[0].id),
        organizationId: String(verified.rows[0].organization_id),
        contactId: String(verified.rows[0].contact_id),
        contactName: String(verified.rows[0].contact_name),
        externalReference: verified.rows[0].external_reference || null,
      },
    });
  } catch (error) {
    console.error("CRM link interaction contact automation failed", error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error." });
  }
}
