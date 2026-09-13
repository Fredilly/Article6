import type { NextApiRequest, NextApiResponse } from "next";
import { hasInternalUploadSession } from "../../../lib/internal-auth";
import {
  VISUAL_COMMERCE_CUSTOMER_TYPES,
  VISUAL_COMMERCE_EMAIL_TYPES,
  VISUAL_COMMERCE_PRIORITIES,
  VISUAL_COMMERCE_PRODUCT_FIT,
  VISUAL_COMMERCE_VIDEO_PRESENCE,
  VISUAL_COMMERCE_YES_NO_UNKNOWN,
  updateSalesVisualCommerceContact,
  upsertSalesVisualCommerceProfile,
  type SalesVisualCommerceProfilePatch,
  type VisualCommerceCustomerType,
  type VisualCommerceEmailType,
  type VisualCommercePriority,
  type VisualCommerceProductFit,
  type VisualCommerceTriState,
  type VisualCommerceVideoPresence,
} from "../../../lib/sales-visual-commerce";

function value(body: NextApiRequest["body"], key: string): string {
  const candidate = body?.[key];
  return typeof candidate === "string" ? candidate.trim() : "";
}

function optionalIso(input: string): string | null {
  if (!input) return null;
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) throw new Error("Invalid date.");
  return date.toISOString();
}

function redirect(res: NextApiResponse, organizationId: string) {
  return res.redirect(303, `/internal/sales/visual-commerce/${encodeURIComponent(organizationId)}?updated=1`);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(await hasInternalUploadSession(req))) return res.status(401).json({ error: "Internal session required." });
  if (req.method !== "POST") return res.status(405).setHeader("Allow", "POST").json({ error: "Method not allowed." });

  const action = value(req.body, "action");
  const organizationId = value(req.body, "organizationId");
  if (!organizationId) return res.status(400).json({ error: "Organization id is required." });

  try {
    if (action === "update_profile") {
      const customerType = value(req.body, "customerType") as VisualCommerceCustomerType;
      const videoPresence = value(req.body, "videoPresence") as VisualCommerceVideoPresence;
      const existingVideoCommerce = value(req.body, "existingVideoCommerce") as VisualCommerceTriState;
      const existingAffiliateActivity = value(req.body, "existingAffiliateActivity") as VisualCommerceTriState;
      const visualProductFit = value(req.body, "visualProductFit") as VisualCommerceProductFit;
      const priority = value(req.body, "priority") as VisualCommercePriority;
      if (!VISUAL_COMMERCE_CUSTOMER_TYPES.includes(customerType)
        || !VISUAL_COMMERCE_VIDEO_PRESENCE.includes(videoPresence)
        || !VISUAL_COMMERCE_YES_NO_UNKNOWN.includes(existingVideoCommerce)
        || !VISUAL_COMMERCE_YES_NO_UNKNOWN.includes(existingAffiliateActivity)
        || !VISUAL_COMMERCE_PRODUCT_FIT.includes(visualProductFit)
        || !VISUAL_COMMERCE_PRIORITIES.includes(priority)) {
        return res.status(400).json({ error: "Invalid Visual Commerce profile value." });
      }
      const patch: SalesVisualCommerceProfilePatch = {
        websiteUrl: value(req.body, "websiteUrl") || undefined,
        youtubeUrl: value(req.body, "youtubeUrl") || undefined,
        instagramUrl: value(req.body, "instagramUrl") || undefined,
        tiktokUrl: value(req.body, "tiktokUrl") || undefined,
        primaryCategory: value(req.body, "primaryCategory") || undefined,
        customerType,
        targetCustomerGender: value(req.body, "targetCustomerGender") || undefined,
        videoPresence,
        existingVideoCommerce,
        existingAffiliateActivity,
        visualProductFit,
        vclUseCase: value(req.body, "vclUseCase") || undefined,
        valueHypothesis: value(req.body, "valueHypothesis") || undefined,
        monetizationHypothesis: value(req.body, "monetizationHypothesis") || undefined,
        priority,
        qualificationNotes: value(req.body, "qualificationNotes") || undefined,
        sourceUrl: value(req.body, "sourceUrl") || undefined,
        lastResearchedAt: optionalIso(value(req.body, "lastResearchedAt")) || undefined,
      };
      await upsertSalesVisualCommerceProfile(organizationId, patch);
      return redirect(res, organizationId);
    }

    if (action === "update_contact_metadata") {
      const contactId = value(req.body, "contactId");
      const rawEmailType = value(req.body, "emailType");
      const emailType = rawEmailType ? rawEmailType as VisualCommerceEmailType : null;
      if (!contactId || (emailType && !VISUAL_COMMERCE_EMAIL_TYPES.includes(emailType))) {
        return res.status(400).json({ error: "Valid contact metadata is required." });
      }
      await updateSalesVisualCommerceContact({
        organizationId,
        contactId,
        emailType,
        whatsapp: value(req.body, "whatsapp") || null,
        sourceUrl: value(req.body, "sourceUrl") || null,
      });
      return redirect(res, organizationId);
    }

    return res.status(400).json({ error: "Unsupported Visual Commerce action." });
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : "Visual Commerce update failed." });
  }
}
