import fs from "node:fs";
import type { NextApiRequest, NextApiResponse } from "next";
import { Pool } from "pg";
import { verifyGitHubActionsOidc } from "../../../lib/github-actions-oidc";

let pool: Pool | undefined;
function getPool() {
  if (pool) return pool;
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Missing POSTGRES_URL or DATABASE_URL environment variable.");
  pool = new Pool({
    connectionString,
    max: 1,
    ...(process.env.NODE_ENV === "production"
      ? { ssl: { rejectUnauthorized: true } }
      : connectionString.includes("localhost") ? { ssl: false } : {}),
  });
  return pool;
}

function bearerToken(req: NextApiRequest) {
  const authorization = req.headers.authorization || "";
  return authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).setHeader("Allow", "POST").json({ error: "Method not allowed." });
  try {
    const token = bearerToken(req);
    if (!token) return res.status(401).json({ error: "Bearer token required." });
    await verifyGitHubActionsOidc(token);
    const sql = fs.readFileSync(new URL("../../../migrations/020_sales_visual_commerce.sql", import.meta.url), "utf8");
    const client = await getPool().connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      const tableExists = await client.query<{ available: boolean }>(
        `SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = current_schema() AND table_name = 'sales_visual_commerce_profiles'
        ) AS available`,
      );
      await client.query("COMMIT");
      return res.status(200).json({ ok: true, migration: "020_sales_visual_commerce", tableAvailable: Boolean(tableExists.rows[0]?.available) });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Visual Commerce migration failed.";
    const status = /OIDC|token|issuer|audience|repository|actor|workflow|signature|signing key|ref is not allowed/i.test(message) ? 403 : 500;
    return res.status(status).json({ ok: false, error: message });
  }
}
