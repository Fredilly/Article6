import type { NextApiRequest, NextApiResponse } from "next";
import { hasInternalUploadSession } from "../../../lib/internal-auth";
import {
  WEB_SERVICE_PRIMARY_SERVICES,
  WEB_SERVICE_PROBLEM_STATUSES,
  WHATSAPP_STATUSES,
  updateSalesContactWhatsAppStatus,
  upsertSalesWebServiceProfile,
  type SalesWebServiceProfilePatch,
  type WebServicePrimaryService,
  type WebServiceProblemStatus,
  type WhatsAppStatus,
} from "../../../lib/sales-web-services";

function value(body: NextApiRequest["body"], key: string): string {
  const candidate = body?.[key];
  return typeof candidate === "string" ? candidate.trim() : "";
}

function hasKey(body: NextApiRequest["body"], key: string): boolean {
  return Boolean(body && Object.prototype.hasOwnProperty.call(body, key));
}

function values(body: NextApiRequest["body"], key: string): string[] {
  const candidate = body?.[key];
  if (Array.isArray(candidate)) return candidate.map(String).map((item) => item.trim()).filter(Boolean);
  return typeof candidate === "string" && candidate.trim() ? [candidate.trim()] : [];
}

function csv(body: NextApiRequest["body"], key: string): string[] {
  return value(body, key).split(",").map((item) => item.trim()).filter(Boolean);
}

function optionalIso(input: string): string | null {
  if (!input) return null;
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) throw new Error("Invalid date.");
  return date.toISOString();
}

function redirect(res: NextApiResponse, organizationId: string) {
  return res.redirect(303, `/internal/sales/organizations/${encodeURIComponent(organizationId)}?updated=1`);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(await hasInternalUploadSession(req))) return res.status(401).json({ error: "Internal session required." });
  if (req.method !== "POST") return res.status(405).setHeader("Allow", "POST").json({ error: "Method not allowed." });

  const action = value(req.body, "action");
  const organizationId = value(req.body, "organizationId");
  if (!organizationId) return res.status(400).json({ error: "Organization id is required." });

  try {
    if (action === "update_whatsapp_status") {
      const contactId = value(req.body, "contactId");
      const whatsappStatus = value(req.body, "whatsappStatus") as WhatsAppStatus;
      if (!contactId || !WHATSAPP_STATUSES.includes(whatsappStatus)) return res.status(400).json({ error: "Valid contact and WhatsApp status are required." });
      await updateSalesContactWhatsAppStatus({ organizationId, contactId, whatsappStatus });
      return redirect(res, organizationId);
    }

    if (action === "update_profile") {
      const patch: SalesWebServiceProfilePatch = {};

      if (hasKey(req.body, "websiteUrl")) {
        patch.websiteUrl = value(req.body, "websiteUrl") || null;
        patch.serviceHypotheses = values(req.body, "serviceHypotheses");
        patch.aiQueryTested = value(req.body, "aiQueryTested") || null;
        const target = value(req.body, "targetAppearing");
        patch.targetAppearing = target === "YES" ? true : target === "NO" ? false : null;
        patch.competitorsAppearing = csv(req.body, "competitorsAppearing");
        patch.websiteObservation = value(req.body, "websiteObservation") || null;
        patch.lastVerifiedAt = optionalIso(value(req.body, "lastVerifiedAt"));
      }

      if (hasKey(req.body, "primaryService")) {
        const primaryService = value(req.body, "primaryService") as WebServicePrimaryService;
        const problemConfirmed = value(req.body, "problemConfirmed") as WebServiceProblemStatus;
        if (!WEB_SERVICE_PRIMARY_SERVICES.includes(primaryService) || !WEB_SERVICE_PROBLEM_STATUSES.includes(problemConfirmed)) {
          return res.status(400).json({ error: "Invalid Web Services sales opportunity value." });
        }
        const commercialValue = value(req.body, "commercialValue");
        patch.primaryService = primaryService;
        patch.commercialValue = commercialValue ? Number(commercialValue) : null;
        patch.problemConfirmed = problemConfirmed;
        patch.priceDiscussed = value(req.body, "priceDiscussed") === "YES";
        patch.caseStudySent = value(req.body, "caseStudySent") === "YES";
        patch.nextAction = value(req.body, "nextAction") || null;
        patch.nextActionDate = optionalIso(value(req.body, "nextActionDate"));
      }

      if (!Object.keys(patch).length) return res.status(400).json({ error: "No Web Services fields supplied." });
      await upsertSalesWebServiceProfile(organizationId, patch);
      return redirect(res, organizationId);
    }

    return res.status(400).json({ error: "Unsupported Web Services action." });
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : "Web Services update failed." });
  }
}
