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
    max: 1,
    ...(process.env.NODE_ENV === "production"
      ? { ssl: { rejectUnauthorized: true } }
      : connectionString.includes("localhost")
        ? { ssl: false }
        : {}),
  });
  return pool;
}

function bearerToken(req: NextApiRequest): string | null {
  const authorization = req.headers.authorization || "";
  return authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : null;
}

function normalizeDomain(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).setHeader("Allow", "POST").json({ error: "Method not allowed." });

  try {
    const token = bearerToken(req);
    if (!token) return res.status(401).json({ error: "Bearer token required." });
    await verifyGitHubActionsOidc(token);

    const organizationId = typeof req.body?.organizationId === "string" ? req.body.organizationId.trim() : "";
    const domain = normalizeDomain(req.body?.domain);
    if (!organizationId || !domain) return res.status(400).json({ ok: false, error: "organizationId and domain are required." });

    const duplicate = await getPool().query(
      "SELECT id, name FROM sales_organizations WHERE domain = $1 AND id <> $2 LIMIT 1",
      [domain, organizationId],
    );
    if (duplicate.rows[0]) {
      return res.status(409).json({ ok: false, error: `Domain already belongs to ${duplicate.rows[0].name}.` });
    }

    const result = await getPool().query(
      "UPDATE sales_organizations SET domain = $2, updated_at = $3 WHERE id = $1 RETURNING id, name, domain",
      [organizationId, domain, new Date().toISOString()],
    );
    const row = result.rows[0];
    if (!row) return res.status(404).json({ ok: false, error: "Organization not found." });

    return res.status(200).json({
      ok: true,
      operation: "update_domain",
      result: { organizationId: String(row.id), organizationName: String(row.name), domain: String(row.domain) },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "CRM domain update failed.";
    const status = /OIDC|token|issuer|audience|repository|actor|workflow|signature|signing key|ref is not allowed/i.test(message) ? 403 : 500;
    return res.status(status).json({ ok: false, error: message });
  }
}
