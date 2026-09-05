import type { NextApiRequest, NextApiResponse } from "next";
import { verifyGitHubActionsOidc } from "../../../lib/github-actions-oidc";
import {
  applyEmailTrackingMigration,
  applySalesInteractionThreadMigration,
} from "../../../lib/email-tracking-migration";
import { applySalesCollateralMigration } from "../../../lib/sales-collateral-migration";
import { applySalesProcurementMigration } from "../../../lib/sales-procurement-migration";

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

    const migration = req.body?.migration;
    if (migration === "007_sales_interaction_thread") {
      const result = await applySalesInteractionThreadMigration();
      return res.status(200).json({ ok: true, migration, result });
    }
    if (migration === "016_sales_collateral") {
      const result = await applySalesCollateralMigration();
      return res.status(200).json({ ok: true, migration, result });
    }
    if (migration === "017_sales_procurement_profiles") {
      const result = await applySalesProcurementMigration();
      return res.status(200).json({ ok: true, migration, result });
    }
    if (migration === "015_email_tracking" || migration === undefined) {
      const result = await applyEmailTrackingMigration();
      return res.status(200).json({ ok: true, migration: "015_email_tracking", result });
    }
    return res.status(400).json({ ok: false, error: "Unsupported migration." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database migration failed.";
    const status = /OIDC|token|issuer|audience|repository|actor|workflow|signature|signing key|ref is not allowed/i.test(message) ? 403 : 500;
    return res.status(status).json({ ok: false, error: message });
  }
}
