import type { NextApiRequest, NextApiResponse } from "next";
import { hasInternalUploadSession } from "../../../lib/internal-auth";
import { createEmailTracking, listEmailTracking } from "../../../lib/email-tracking";
import { attachEmailTrackingByToken } from "../../../lib/email-tracking-attach";
import { clearEmailTrackingHistory } from "../../../lib/email-tracking-admin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(await hasInternalUploadSession(req))) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }

  if (req.method === "GET") {
    const organizationId = typeof req.query.organizationId === "string" ? req.query.organizationId : undefined;
    try {
      res.status(200).json({ records: await listEmailTracking(organizationId) });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Unable to load email tracking." });
    }
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  try {
    if (body.action === "create") {
      if (!body.organizationId) throw new Error("organizationId is required.");
      const created = await createEmailTracking({
        organizationId: String(body.organizationId),
        contactId: body.contactId ? String(body.contactId) : undefined,
        tenderOpportunityId: body.tenderOpportunityId ? String(body.tenderOpportunityId) : undefined,
        campaignSource: body.campaignSource ? String(body.campaignSource) : "TENDER_READINESS_MANUAL_GMAIL",
        approvedDestination: body.approvedDestination ? String(body.approvedDestination) : undefined,
        subject: body.subject ? String(body.subject) : undefined,
      });
      const baseUrl = (process.env.EMAIL_TRACKING_BASE_URL || "https://article6.org").replace(/\/$/, "");
      res.status(201).json({
        token: created.token,
        record: created.record,
        openUrl: `${baseUrl}/api/t/o/${created.token}.gif`,
        clickUrl: created.record.approvedDestination ? `${baseUrl}/api/t/c/${created.token}` : undefined,
      });
      return;
    }

    if (body.action === "attach") {
      if (!body.token) throw new Error("token is required.");
      if (!body.gmailMessageId && !body.gmailThreadId) throw new Error("A Gmail message or thread id is required.");
      const record = await attachEmailTrackingByToken({
        token: String(body.token),
        gmailMessageId: body.gmailMessageId ? String(body.gmailMessageId) : undefined,
        gmailThreadId: body.gmailThreadId ? String(body.gmailThreadId) : undefined,
      });
      if (!record) {
        res.status(404).json({ error: "Tracking token not found." });
        return;
      }
      res.status(200).json({ record });
      return;
    }

    if (body.action === "clear") {
      const month = body.month ? String(body.month) : undefined;
      const expectedConfirmation = month ? `CLEAR TRACKING ${month}` : "CLEAR TRACKING HISTORY";
      if (body.confirm !== expectedConfirmation) throw new Error("Explicit tracking-history confirmation is required.");
      res.status(200).json({ result: await clearEmailTrackingHistory(month) });
      return;
    }

    res.status(400).json({ error: "Unknown action." });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Email tracking request failed." });
  }
}
