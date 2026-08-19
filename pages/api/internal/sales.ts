import type { NextApiRequest, NextApiResponse } from "next";
import { hasInternalUploadSession } from "../../../lib/internal-auth";
import {
  addSalesContact,
  addSalesInteraction,
  addSalesProject,
  createSalesOrganization,
  updateSalesOrganizationState,
} from "../../../lib/sales-store";
import { isSalesExperiment, isSalesObjectionCode, isSalesOrganizationStatus, normalizeOptional } from "../../../lib/sales-memory";

function value(body: NextApiRequest["body"], key: string): string {
  const candidate = body?.[key];
  return typeof candidate === "string" ? candidate.trim() : "";
}

function organizationRedirect(res: NextApiResponse, id: string, params?: Record<string, string>) {
  const query = params ? `?${new URLSearchParams(params).toString()}` : "";
  res.redirect(303, `/internal/sales/organizations/${encodeURIComponent(id)}${query}`);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(await hasInternalUploadSession(req))) return res.status(401).json({ error: "Internal session required." });
  if (req.method !== "POST") return res.status(405).setHeader("Allow", "POST").json({ error: "Method not allowed." });

  const action = value(req.body, "action");
  const organizationId = value(req.body, "organizationId");

  try {
    if (action === "create_organization") {
      const name = value(req.body, "name");
      const experiment = value(req.body, "experiment") || "ARTICLE6_CARBON";
      if (!name) return res.status(400).json({ error: "Organization name is required." });
      if (!isSalesExperiment(experiment)) return res.status(400).json({ error: "Invalid sales experiment." });
      const result = await createSalesOrganization({ name, domain: value(req.body, "domain"), country: value(req.body, "country"), experiment, notes: value(req.body, "notes") });
      return organizationRedirect(res, result.organization.id, result.created ? undefined : { duplicate: "1" });
    }

    if (!organizationId) return res.status(400).json({ error: "Organization id is required." });

    if (action === "add_contact") {
      const name = value(req.body, "name");
      if (!name) return res.status(400).json({ error: "Contact name is required." });
      await addSalesContact({ organizationId, name, title: value(req.body, "title"), email: value(req.body, "email"), phone: value(req.body, "phone"), notes: value(req.body, "notes") });
      return organizationRedirect(res, organizationId);
    }

    if (action === "add_project") {
      const name = value(req.body, "name");
      if (!name) return res.status(400).json({ error: "Project name is required." });
      await addSalesProject({ organizationId, name, vcsId: value(req.body, "vcsId"), methodology: value(req.body, "methodology"), methodologyVersion: value(req.body, "methodologyVersion"), stage: value(req.body, "stage"), country: value(req.body, "country"), vvb: value(req.body, "vvb"), role: value(req.body, "role"), notes: value(req.body, "notes") });
      return organizationRedirect(res, organizationId);
    }

    if (action === "add_interaction") {
      const summary = value(req.body, "summary");
      const occurredAt = value(req.body, "occurredAt");
      if (!summary || !occurredAt) return res.status(400).json({ error: "Interaction date and summary are required." });
      const parsedDate = new Date(occurredAt);
      if (Number.isNaN(parsedDate.getTime())) return res.status(400).json({ error: "Interaction date is invalid." });
      await addSalesInteraction({
        organizationId,
        contactId: normalizeOptional(req.body?.contactId) || undefined,
        projectId: normalizeOptional(req.body?.projectId) || undefined,
        channel: value(req.body, "channel") || "OTHER",
        direction: value(req.body, "direction") || "INTERNAL",
        interactionType: value(req.body, "interactionType") || "NOTE",
        occurredAt: parsedDate.toISOString(),
        subject: value(req.body, "subject"),
        summary,
        outcomeCode: value(req.body, "outcomeCode"),
      });
      return organizationRedirect(res, organizationId);
    }

    if (action === "update_status") {
      const status = value(req.body, "status");
      const experiment = value(req.body, "experiment") || "ARTICLE6_CARBON";
      const objection = value(req.body, "objectionCode");
      if (!isSalesOrganizationStatus(status)) return res.status(400).json({ error: "Invalid organization status." });
      if (!isSalesExperiment(experiment)) return res.status(400).json({ error: "Invalid sales experiment." });
      const objectionCode = objection && isSalesObjectionCode(objection) ? objection : undefined;
      if (objection && !objectionCode) return res.status(400).json({ error: "Invalid objection code." });
      const internalTeamValue = value(req.body, "internalCertificationTeam");
      await updateSalesOrganizationState({
        organizationId,
        status,
        experiment,
        objectionCode,
        internalCertificationTeam: internalTeamValue === "" ? undefined : internalTeamValue === "true",
        doNotContact: req.body?.doNotContact === "on",
        notes: value(req.body, "notes"),
      });
      return organizationRedirect(res, organizationId);
    }

    return res.status(400).json({ error: "Unknown sales action." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sales memory update failed.";
    if (organizationId) return organizationRedirect(res, organizationId, { error: message.slice(0, 180) });
    return res.status(500).json({ error: message });
  }
}
