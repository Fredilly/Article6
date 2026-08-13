import type { NextApiRequest, NextApiResponse } from "next";
import { hasInternalUploadSession } from "../../../lib/internal-auth";
import { approveSalesImportCandidate, createSalesImportCandidate, ignoreSalesImportCandidate } from "../../../lib/sales-import-store";
import { isSalesObjectionCode, isSalesOrganizationStatus } from "../../../lib/sales-memory";

function value(body: NextApiRequest["body"], key: string): string {
  const candidate = body?.[key];
  return typeof candidate === "string" ? candidate.trim() : "";
}

function parseArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return [];
  const parsed = JSON.parse(value);
  if (!Array.isArray(parsed)) throw new Error("Import bundle fields must be arrays.");
  return parsed;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(await hasInternalUploadSession(req))) return res.status(401).json({ error: "Internal session required." });
  if (req.method !== "POST") return res.status(405).setHeader("Allow", "POST").json({ error: "Method not allowed." });

  const action = value(req.body, "action");
  try {
    if (action === "approve") {
      const id = value(req.body, "candidateId");
      if (!id) return res.status(400).json({ error: "Candidate id is required." });
      const organizationId = await approveSalesImportCandidate(id, value(req.body, "organizationId") || undefined);
      return res.redirect(303, `/internal/sales/organizations/${encodeURIComponent(organizationId)}`);
    }
    if (action === "ignore") {
      const id = value(req.body, "candidateId");
      if (!id) return res.status(400).json({ error: "Candidate id is required." });
      await ignoreSalesImportCandidate(id);
      return res.redirect(303, "/internal/sales/import-review");
    }
    if (action === "create_candidate") {
      const organizationName = value(req.body, "organizationName");
      const sourceType = value(req.body, "sourceType") || "GMAIL";
      const sourceKey = value(req.body, "sourceKey");
      if (!organizationName || !sourceKey) return res.status(400).json({ error: "Organization name and source key are required." });
      const proposedStatus = value(req.body, "proposedStatus");
      const proposedObjection = value(req.body, "proposedObjection");
      if (proposedStatus && !isSalesOrganizationStatus(proposedStatus)) return res.status(400).json({ error: "Invalid proposed status." });
      if (proposedObjection && !isSalesObjectionCode(proposedObjection)) return res.status(400).json({ error: "Invalid proposed objection." });
      const confidenceRaw = value(req.body, "confidence");
      const confidence = confidenceRaw ? Number(confidenceRaw) : undefined;
      if (confidence != null && (!Number.isInteger(confidence) || confidence < 0 || confidence > 100)) return res.status(400).json({ error: "Confidence must be an integer from 0 to 100." });
      const candidate = await createSalesImportCandidate({
        sourceType, sourceKey, organizationName, domain: value(req.body, "domain") || undefined,
        proposedStatus: proposedStatus || undefined, proposedObjection: proposedObjection || undefined, confidence,
        contacts: parseArray(req.body?.contacts) as never[], projects: parseArray(req.body?.projects) as never[], interactions: parseArray(req.body?.interactions) as never[],
        evidenceSummary: value(req.body, "evidenceSummary"), matchedOrganizationId: value(req.body, "matchedOrganizationId") || undefined,
      });
      return res.status(201).json({ candidate });
    }
    return res.status(400).json({ error: "Unknown sales import action." });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : "Sales import update failed." });
  }
}
