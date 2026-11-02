import type { NextApiRequest, NextApiResponse } from "next";
import { timingSafeEqual } from "node:crypto";
import { createSalesOrganization, addSalesContact, addSalesInteraction, updateSalesOrganizationState } from "../../../lib/sales-store";
import { upsertSalesWebServiceProfile } from "../../../lib/sales-web-services";
import { validateReferralSession } from "../../../lib/referral-agents";

const text = (value: unknown, max = 500) => typeof value === "string" ? value.trim().slice(0, max) : "";
function authorized(req: NextApiRequest) {
  const secret = process.env.WEB_REFERRAL_INGEST_TOKEN;
  const actual = req.headers.authorization?.replace(/^Bearer\s+/i, "") || "";
  if (!secret || !actual || Buffer.byteLength(secret) !== Buffer.byteLength(actual)) return false;
  return timingSafeEqual(Buffer.from(secret), Buffer.from(actual));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });
  if (!authorized(req)) return res.status(401).json({ error: "Unauthorized." });
  const body = req.body ?? {};
  const agent = await validateReferralSession(text(body.agentSession, 1024));
  if (!agent) return res.status(401).json({ error: "Referral account disabled or session expired." });
  const company = text(body.company, 120), name = text(body.name, 120);
  const email = text(body.email, 254), phone = text(body.whatsapp, 40);
  const website = text(body.website, 400), service = text(body.service, 80);
  const interest = text(body.interest, 80), budget = text(body.budget, 120);
  const notes = text(body.notes, 1500);
  if (!company || !name || (!email && !phone) || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    return res.status(400).json({ error: "Company, contact name, and valid email or phone are required." });
  }
  if (!["WEBSITE_DESIGN", "WEBSITE_DEVELOPMENT", "WEBSITE_REDESIGN", "SEO_GEO", "OTHER"].includes(service) ||
      !["UNCONFIRMED", "INTERESTED", "QUOTE_REQUESTED", "MEETING_AGREED"].includes(interest)) {
    return res.status(400).json({ error: "Invalid service or interest." });
  }
  if (website && !/^https?:\/\/[^\s/]+/i.test(website)) return res.status(400).json({ error: "Invalid website." });
  const domain = website ? new URL(website).hostname.toLowerCase().replace(/^www\./, "") : "";
  const summary = [
    "Referral agent: " + agent.displayName + " (" + agent.username + "; " + agent.id + ")", "Service: " + service, "Interest: " + interest,
    budget ? "Budget discussed: " + budget : "", notes ? "Notes: " + notes : ""
  ].filter(Boolean).join("\n");
  try {
    const { organization, created } = await createSalesOrganization({
      name: company, domain, experiment: "WEB_SERVICES", notes: summary
    });
    if (organization.experiment !== "WEB_SERVICES") {
      return res.status(409).json({ error: "Existing company belongs to another CRM category. Internal review required." });
    }
    // Existing organization contacts remain intact; fail explicitly instead of silently duplicating leads.
    let contact;
    try {
      contact = await addSalesContact({ organizationId: organization.id, name, email, phone, notes: summary });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (!message.includes("already exists")) throw error;
      return res.status(409).json({ error: "This contact is already in our CRM. Please inform the Article6 team." });
    }
    if (created && interest !== "UNCONFIRMED") {
      await updateSalesOrganizationState({
        organizationId: organization.id, status: "ENGAGED", experiment: "WEB_SERVICES", notes: summary
      });
    }
    await upsertSalesWebServiceProfile(organization.id, {
      ...(website ? { websiteUrl: website } : {}),
      primaryService: service === "SEO_GEO" ? "GEO_VISIBILITY" : service === "OTHER" ? "UNKNOWN" : "WEBSITE_REDESIGN",
      problemConfirmed: interest === "UNCONFIRMED" ? "UNKNOWN" : "YES",
      ...(budget && /^\d+(?:\.\d+)?$/.test(budget) ? { commercialValue: Number(budget) } : {})
    });
    await addSalesInteraction({
      organizationId: organization.id, contactId: contact.id,
      channel: "OTHER", direction: "INBOUND", interactionType: "NOTE",
      occurredAt: new Date().toISOString(), subject: "Partner website referral - " + agent.displayName, summary
    });
    return res.status(201).json({ ok: true });
  } catch (error) {
    console.error("Referral intake failed", error);
    return res.status(500).json({ error: "CRM could not save the referral. Please retry or contact Article6." });
  }
}
