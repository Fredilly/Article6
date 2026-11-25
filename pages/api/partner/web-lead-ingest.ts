import type { NextApiRequest, NextApiResponse } from "next";
import { timingSafeEqual } from "node:crypto";
import {
  addSalesContact,
  addSalesInteraction,
  createSalesOrganization,
  listSalesOrganizations,
} from "../../../lib/sales-store";
import { upsertSalesWebServiceProfile } from "../../../lib/sales-web-services";
import {
  buildWebLeadSummary,
  matchesDomain,
  matchesOrganization,
  validateWebLeadBatch,
  webLeadDomain,
  webLeadKey,
  type WebLeadInput,
} from "../../../lib/web-lead-ingest";

/**
 * Authenticated intake for OUTBOUND researched web-development leads.
 *
 * Deliberately separate from the other partner routes: web-referral.ts forces
 * INBOUND attribution and notifies per lead, geo-score-intake.ts forces
 * status=ENGAGED. A researched prospect is neither: it stays NEW, is recorded
 * as OUTBOUND, and carries the evidence that justified the research.
 */

const CROSS_EXPERIMENT_ERROR = "Existing company belongs to another CRM category. Internal review required.";

function authorized(req: NextApiRequest) {
  const expected = process.env.WEB_LEAD_INGEST_TOKEN;
  const actual = (req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
  if (!expected || !actual) return false;
  if (Buffer.byteLength(expected) !== Buffer.byteLength(actual)) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(actual));
}

async function resolveOrganization(lead: { company: string; website: string }) {
  const organizations = await listSalesOrganizations(webLeadDomain(lead.website));
  return organizations.find((organization) => matchesOrganization(lead, organization));
}

async function recordLead(lead: WebLeadInput) {
  const summary = buildWebLeadSummary(lead);
  const { organization, created } = await createSalesOrganization({
    name: lead.company,
    domain: webLeadDomain(lead.website),
    ...(lead.country ? { country: lead.country } : {}),
    experiment: "WEB_SERVICES",
    notes: summary,
  });
  if (organization.experiment !== "WEB_SERVICES") {
    return { conflict: true as const, organization };
  }
  if (!created) return { duplicate: true as const, organization };

  let contactId: string | null = null;
  if (lead.contactName || lead.contactEmail || lead.contactPhone) {
    try {
      const contact = await addSalesContact({
        organizationId: organization.id,
        name: lead.contactName || lead.company,
        ...(lead.contactEmail ? { email: lead.contactEmail } : {}),
        ...(lead.contactPhone ? { phone: lead.contactPhone } : {}),
        notes: "Researched outbound lead. Contact details taken from the cited source.",
      });
      contactId = contact.id;
    } catch (error) {
      // A known email may already sit on another account: keep the researched
      // organization, record the evidence, and let a human reconcile ownership.
      const message = error instanceof Error ? error.message : "";
      if (!message.includes("already exists")) throw error;
      console.warn("[web-lead-ingest] contact not created; existing contact kept", {
        organizationId: organization.id,
      });
    }
  }

  await upsertSalesWebServiceProfile(organization.id, {
    websiteUrl: lead.website,
    ...(lead.service ? { serviceHypotheses: [lead.service] } : {}),
    lastVerifiedAt: new Date().toISOString(),
    nextAction: lead.nextAction,
  });
  await addSalesInteraction({
    organizationId: organization.id,
    ...(contactId ? { contactId } : {}),
    channel: "OTHER",
    direction: "OUTBOUND",
    interactionType: "NOTE",
    occurredAt: new Date().toISOString(),
    subject: "Outbound research - " + lead.sourceTitle,
    summary,
  });
  return { organization, contactId };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }
  if (!authorized(req)) {
    if (!process.env.WEB_LEAD_INGEST_TOKEN) {
      console.error("[web-lead-ingest] WEB_LEAD_INGEST_TOKEN is not configured; every request is rejected.");
    }
    return res.status(401).json({ error: "Unauthorized." });
  }

  if (req.method === "GET") {
    const raw = req.query.domain;
    const requested = typeof raw === "string" ? raw.trim() : "";
    const domain = webLeadDomain(requested);
    if (!domain) return res.status(400).json({ error: "A domain query parameter is required." });
    try {
      const organizations = await listSalesOrganizations(domain);
      const organization = organizations.find((candidate) => matchesDomain(domain, candidate));
      return res.status(200).json({
        domain,
        exists: Boolean(organization),
        organization: organization
          ? {
              id: organization.id,
              name: organization.name,
              domain: organization.domain ?? null,
              experiment: organization.experiment,
              status: organization.status,
            }
          : null,
      });
    } catch (error) {
      console.error("[web-lead-ingest] domain lookup failed", {
        message: error instanceof Error ? error.message : "unknown",
      });
      return res.status(500).json({ error: "CRM lookup failed." });
    }
  }

  const validation = validateWebLeadBatch(req.body);
  if (!validation.ok) {
    return res.status(400).json({ error: "Validation failed.", errors: validation.errors });
  }
  const leads = validation.leads;

  // Pre-flight before any write: a different CRM category always wins, and a
  // batch must not half-save before returning 409.
  try {
    for (const lead of leads) {
      const existing = await resolveOrganization(lead);
      if (existing && existing.experiment !== "WEB_SERVICES") {
        return res.status(409).json({ error: CROSS_EXPERIMENT_ERROR });
      }
    }
  } catch (error) {
    console.error("[web-lead-ingest] pre-flight lookup failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return res.status(500).json({ error: "CRM could not check for existing companies. Retry or contact Article6." });
  }

  const created: Array<Record<string, unknown>> = [];
  const duplicates: Array<Record<string, unknown>> = [];
  const rejected: Array<Record<string, unknown>> = [];
  const processed = new Map<string, string>();

  for (const [index, lead] of Array.from(leads.entries())) {
    const key = webLeadKey(lead);
    const earlierId = processed.get(key);
    if (earlierId) {
      duplicates.push({
        index,
        id: earlierId,
        company: lead.company,
        domain: webLeadDomain(lead.website) || null,
        duplicate: true,
        reason: "Repeated within this request.",
      });
      continue;
    }
    try {
      const result = await recordLead(lead);
      if ("conflict" in result && result.conflict) {
        return res.status(409).json({ error: CROSS_EXPERIMENT_ERROR });
      }
      if ("duplicate" in result && result.duplicate) {
        duplicates.push({
          index,
          id: result.organization.id,
          company: result.organization.name,
          domain: result.organization.domain ?? null,
          experiment: result.organization.experiment,
          status: result.organization.status,
          duplicate: true,
          reason: "Organization already exists in the CRM.",
        });
        processed.set(key, result.organization.id);
        continue;
      }
      processed.set(key, result.organization.id);
      created.push({
        index,
        id: result.organization.id,
        company: result.organization.name,
        domain: result.organization.domain ?? null,
        status: result.organization.status,
        contactId: result.contactId,
        service: lead.service ?? null,
        sourceUrl: lead.sourceUrl,
      });
    } catch (error) {
      console.error("[web-lead-ingest] lead write failed", {
        index,
        message: error instanceof Error ? error.message : "unknown",
      });
      rejected.push({ index, company: lead.company, reason: "CRM write failed." });
    }
  }

  const status = created.length ? 201 : 200;
  return res.status(status).json({ created, duplicates, rejected });
}
