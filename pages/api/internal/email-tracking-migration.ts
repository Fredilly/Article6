import type { NextApiRequest, NextApiResponse } from "next";
import { verifyGitHubActionsOidc } from "../../../lib/github-actions-oidc";
import { applyEmailTrackingMigration } from "../../../lib/email-tracking-migration";

function bearerToken(req: NextApiRequest): string | null {
  const authorization = req.headers.authorization || "";
  return authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).setHeader("Allow", "POST").json({ error: "Method not allowed." });

  try {
    const token = bearerToken(req);
    if (!token) return res.status(401).json({ error: "Bearer token required." });
    await verifyGitHubActionsOidc(token);

    const result = await applyEmailTrackingMigration();
    return res.status(200).json({ ok: true, migration: "015_email_tracking", result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email tracking migration failed.";
    const status = /OIDC|token|issuer|audience|repository|actor|workflow|signature|signing key|ref is not allowed/i.test(message) ? 403 : 500;
    return res.status(status).json({ ok: false, error: message });
  }
}
