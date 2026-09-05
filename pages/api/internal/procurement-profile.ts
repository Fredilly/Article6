import type { NextApiRequest, NextApiResponse } from "next";
import { hasInternalUploadSession } from "../../../lib/internal-auth";
import { getSalesOrganizationDetail } from "../../../lib/sales-store";
import {
  getSalesProcurementProfile,
  upsertSalesProcurementProfile,
  isBidDecisionProcess,
  isBidPreparationModel,
  isEvidenceLibraryMaturity,
  isIndependentReviewFrequency,
  isPrimaryProcurementPain,
  isProcurementFrequencyBand,
  isProcurementProfileConfidence,
  isProcurementProfileSource,
  isProcurementWinsBand,
  type SalesProcurementProfilePatch,
} from "../../../lib/sales-procurement";

function stringValue(value: unknown): string | undefined {
  if (Array.isArray(value)) value = value[0];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function arrayValue(value: unknown): string[] | null | undefined {
  if (value === undefined) return undefined;
  const values = Array.isArray(value) ? value : [value];
  const cleaned = values.map(String).map((item) => item.trim()).filter(Boolean);
  return cleaned.length ? cleaned : null;
}

function nullableEnum<T extends string>(value: unknown, guard: (candidate: unknown) => candidate is T, label: string): T | null | undefined {
  if (value === undefined) return undefined;
  const candidate = stringValue(value);
  if (!candidate) return null;
  if (!guard(candidate)) throw new Error(`Invalid ${label}.`);
  return candidate;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(await hasInternalUploadSession(req))) return res.status(401).json({ error: "Internal session required." });

  try {
    if (req.method === "GET") {
      const organizationId = stringValue(req.query.organizationId);
      if (!organizationId) return res.status(400).json({ error: "Organization id is required." });
      const [profile, detail] = await Promise.all([
        getSalesProcurementProfile(organizationId),
        getSalesOrganizationDetail(organizationId),
      ]);
      if (!detail) return res.status(404).json({ error: "Organization not found." });
      return res.status(200).json({
        ok: true,
        profile,
        contacts: detail.contacts.map((contact) => ({ id: contact.id, name: contact.name, title: contact.title })),
      });
    }

    if (req.method !== "POST") return res.status(405).setHeader("Allow", "GET, POST").json({ error: "Method not allowed." });

    const organizationId = stringValue(req.body?.organizationId);
    if (!organizationId) return res.status(400).json({ error: "Organization id is required." });

    const patch: SalesProcurementProfilePatch = {
      opportunitiesConsideredBand: nullableEnum(req.body?.opportunitiesConsideredBand, isProcurementFrequencyBand, "opportunities considered band"),
      bidsSubmittedBand: nullableEnum(req.body?.bidsSubmittedBand, isProcurementFrequencyBand, "bids submitted band"),
      winsBand: nullableEnum(req.body?.winsBand, isProcurementWinsBand, "wins band"),
      bidDecisionProcess: nullableEnum(req.body?.bidDecisionProcess, isBidDecisionProcess, "bid decision process"),
      bidDecisionOwnerContactId: req.body && Object.prototype.hasOwnProperty.call(req.body, "bidDecisionOwnerContactId")
        ? stringValue(req.body.bidDecisionOwnerContactId) || null
        : undefined,
      discoveryMethods: arrayValue(req.body?.discoveryMethods),
      discoveryProblems: arrayValue(req.body?.discoveryProblems),
      bidPreparationModel: nullableEnum(req.body?.bidPreparationModel, isBidPreparationModel, "bid preparation model"),
      aiUsage: arrayValue(req.body?.aiUsage),
      independentReviewFrequency: nullableEnum(req.body?.independentReviewFrequency, isIndependentReviewFrequency, "independent review frequency"),
      evidenceLibraryMaturity: nullableEnum(req.body?.evidenceLibraryMaturity, isEvidenceLibraryMaturity, "evidence library maturity"),
      primaryProcurementPain: nullableEnum(req.body?.primaryProcurementPain, isPrimaryProcurementPain, "primary procurement pain"),
      profileSource: nullableEnum(req.body?.profileSource, isProcurementProfileSource, "profile source"),
      profileConfidence: nullableEnum(req.body?.profileConfidence, isProcurementProfileConfidence, "profile confidence"),
      notes: req.body && Object.prototype.hasOwnProperty.call(req.body, "notes") ? stringValue(req.body.notes) || null : undefined,
      lastVerifiedAt: req.body?.verified === "on" ? new Date().toISOString() : undefined,
    };

    const profile = await upsertSalesProcurementProfile(organizationId, patch);
    if (req.headers.accept?.includes("application/json")) return res.status(200).json({ ok: true, profile });
    return res.redirect(303, `/internal/sales/organizations/${encodeURIComponent(organizationId)}?procurementUpdated=1`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Procurement profile update failed.";
    return res.status(400).json({ ok: false, error: message });
  }
}
