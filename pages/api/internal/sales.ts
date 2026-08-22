import type { NextApiRequest, NextApiResponse } from "next";
import { hasInternalUploadSession } from "../../../lib/internal-auth";
import {
  addSalesContact,
  addSalesInteraction,
  addSalesProject,
  createSalesTenderOpportunity,
  addSalesTenderDocument,
  createSalesOrganization,
  deleteSalesContact,
  deleteSalesOrganization,
  deleteSalesInteraction,
  updateSalesContact,
  updateSalesProject,
  updateSalesProjectWorkflow,
  updateSalesTenderOpportunity,
  updateSalesTenderDocument,
  updateSalesOrganizationState,
  mergeSalesOrganizations,
} from "../../../lib/sales-store";
import { isSalesExperiment, isSalesObjectionCode, isSalesOrganizationStatus, isSalesTenderStatus, normalizeOptional } from "../../../lib/sales-memory";
import { hasDeleteConfirmation } from "../../../lib/sales-destructive-actions";

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

    if (action === "delete_contact") {
      const contactId = value(req.body, "contactId");
      if (!contactId) return res.status(400).json({ error: "Contact id is required." });
      if (!hasDeleteConfirmation(value(req.body, "confirmation"))) return organizationRedirect(res, organizationId, { error: "Type delete to confirm contact deletion." });
      await deleteSalesContact(organizationId, contactId);
      return organizationRedirect(res, organizationId, { deleted: "1" });
    }

    if (action === "delete_organization") {
      if (!hasDeleteConfirmation(value(req.body, "confirmation"))) return organizationRedirect(res, organizationId, { error: "Type delete to confirm organization deletion." });
      await deleteSalesOrganization(organizationId);
      return res.redirect(303, "/internal/sales");
    }

    if (action === "merge_organization") {
      const targetOrganizationId = value(req.body, "targetOrganizationId");
      if (!targetOrganizationId) return organizationRedirect(res, organizationId, { error: "Target organization id is required." });
      if (!hasDeleteConfirmation(value(req.body, "confirmation"))) return organizationRedirect(res, organizationId, { error: "Type delete to confirm organization merge." });
      await mergeSalesOrganizations(organizationId, targetOrganizationId);
      return res.redirect(303, `/internal/sales/organizations/${encodeURIComponent(targetOrganizationId)}`);
    }

    if (action === "update_contact") {
      const contactId = value(req.body, "contactId");
      const name = value(req.body, "name");
      if (!contactId || !name) return res.status(400).json({ error: "Contact id and name are required." });
      await updateSalesContact({ organizationId, contactId, name, title: value(req.body, "title"), email: value(req.body, "email"), phone: value(req.body, "phone"), notes: value(req.body, "notes") });
      return organizationRedirect(res, organizationId, { updated: "1" });
    }

    if (action === "add_project") {
      const name = value(req.body, "name");
      if (!name) return res.status(400).json({ error: "Project name is required." });
      const salesStatus = value(req.body, "salesStatus") || "NEW";
      if (!isSalesOrganizationStatus(salesStatus)) return res.status(400).json({ error: "Invalid sales status." });
      await addSalesProject({ organizationId, name, vcsId: value(req.body, "vcsId"), methodology: value(req.body, "methodology"), methodologyVersion: value(req.body, "methodologyVersion"), stage: value(req.body, "stage"), country: value(req.body, "country"), vvb: value(req.body, "vvb"), role: value(req.body, "role"), notes: value(req.body, "notes"), salesStatus, assignedOwner: value(req.body, "assignedOwner"), nextAction: value(req.body, "nextAction"), nextActionDate: value(req.body, "nextActionDate") || undefined });
      return organizationRedirect(res, organizationId);
    }

    if (action === "update_project") {
      const projectId = value(req.body, "projectId");
      const name = value(req.body, "name");
      if (!projectId || !name) return res.status(400).json({ error: "Project id and name are required." });
      const salesStatus = value(req.body, "salesStatus") || "NEW";
      if (!isSalesOrganizationStatus(salesStatus)) return res.status(400).json({ error: "Invalid sales status." });
      await updateSalesProject({ organizationId, projectId, name, vcsId: value(req.body, "vcsId"), methodology: value(req.body, "methodology"), methodologyVersion: value(req.body, "methodologyVersion"), stage: value(req.body, "stage"), country: value(req.body, "country"), vvb: value(req.body, "vvb"), role: value(req.body, "role"), notes: value(req.body, "notes"), salesStatus, assignedOwner: value(req.body, "assignedOwner"), nextAction: value(req.body, "nextAction"), nextActionDate: value(req.body, "nextActionDate") || undefined });
      return organizationRedirect(res, organizationId, { updated: "1" });
    }

    if (action === "update_project_workflow") {
      const projectId = value(req.body, "projectId");
      const salesStatus = value(req.body, "salesStatus");
      if (!projectId || !isSalesOrganizationStatus(salesStatus)) return res.status(400).json({ error: "Project and valid sales status are required." });
      await updateSalesProjectWorkflow({ organizationId, projectId, salesStatus, assignedOwner: value(req.body, "assignedOwner"), nextAction: value(req.body, "nextAction"), nextActionDate: value(req.body, "nextActionDate") || undefined });
      return organizationRedirect(res, organizationId, { updated: "1" });
    }

    if (action === "add_tender") {
      const name = value(req.body, "name");
      if (!name) return res.status(400).json({ error: "Tender name is required." });
      const tenderStatus = value(req.body, "status") || "NEW";
      if (!isSalesTenderStatus(tenderStatus)) return res.status(400).json({ error: "Invalid tender status." });
      const salesStatus = value(req.body, "salesStatus") || "NEW";
      if (!isSalesOrganizationStatus(salesStatus)) return res.status(400).json({ error: "Invalid sales status." });
      const tenderId = await createSalesTenderOpportunity({ organizationId, contactId: normalizeOptional(req.body?.contactId) || undefined, name, buyer: value(req.body, "buyer"), referenceNumber: value(req.body, "referenceNumber"), submissionDeadline: value(req.body, "submissionDeadline") || undefined, contractValue: value(req.body, "contractValue"), sector: value(req.body, "sector"), status: tenderStatus, notes: value(req.body, "notes"), documentsRequested: Number(value(req.body, "documentsRequested") || 0), documentsReceived: Number(value(req.body, "documentsReceived") || 0), buyerRequirements: value(req.body, "buyerRequirements"), salesStatus, assignedOwner: value(req.body, "assignedOwner"), nextAction: value(req.body, "nextAction"), nextActionDate: value(req.body, "nextActionDate") || undefined, sourceKey: value(req.body, "sourceKey") });
      return res.redirect(303, `/internal/sales/tenders/${encodeURIComponent(tenderId)}`);
    }

    if (action === "update_tender") {
      const tenderId = value(req.body, "tenderId");
      const name = value(req.body, "name");
      if (!tenderId || !name) return res.status(400).json({ error: "Tender id and name are required." });
      const tenderStatusValue = value(req.body, "status");
      if (tenderStatusValue && !isSalesTenderStatus(tenderStatusValue)) return res.status(400).json({ error: "Invalid tender status." });
      const salesStatus = value(req.body, "salesStatus") || "NEW";
      if (!isSalesOrganizationStatus(salesStatus)) return res.status(400).json({ error: "Invalid sales status." });
      await updateSalesTenderOpportunity({ id: tenderId, organizationId, contactId: normalizeOptional(req.body?.contactId) || undefined, name, buyer: value(req.body, "buyer"), referenceNumber: value(req.body, "referenceNumber"), submissionDeadline: value(req.body, "submissionDeadline") || undefined, contractValue: value(req.body, "contractValue"), sector: value(req.body, "sector"), status: tenderStatusValue && isSalesTenderStatus(tenderStatusValue) ? tenderStatusValue : undefined, notes: value(req.body, "notes"), documentsRequested: Number(value(req.body, "documentsRequested") || 0), documentsReceived: Number(value(req.body, "documentsReceived") || 0), buyerRequirements: value(req.body, "buyerRequirements"), salesStatus, assignedOwner: value(req.body, "assignedOwner"), nextAction: value(req.body, "nextAction"), nextActionDate: value(req.body, "nextActionDate") || undefined });
      return res.redirect(303, `/internal/sales/tenders/${encodeURIComponent(tenderId)}`);
    }

    if (action === "add_tender_document") {
      const tenderId = value(req.body, "tenderId");
      const name = value(req.body, "name");
      if (!tenderId || !name) return res.status(400).json({ error: "Tender id and document name are required." });
      await addSalesTenderDocument({ organizationId, tenderOpportunityId: tenderId, name, requested: req.body?.requested === "on", received: req.body?.received === "on", notes: value(req.body, "notes"), sourceKey: value(req.body, "sourceKey") });
      return res.redirect(303, `/internal/sales/tenders/${encodeURIComponent(tenderId)}`);
    }

    if (action === "update_tender_document") {
      const documentId = value(req.body, "documentId");
      const tenderId = value(req.body, "tenderId");
      const name = value(req.body, "name");
      if (!documentId || !tenderId || !name) return res.status(400).json({ error: "Tender document details are required." });
      await updateSalesTenderDocument({ organizationId, id: documentId, name, requested: req.body?.requested === "on", received: req.body?.received === "on", notes: value(req.body, "notes") });
      return res.redirect(303, `/internal/sales/tenders/${encodeURIComponent(tenderId)}`);
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
        tenderOpportunityId: normalizeOptional(req.body?.tenderOpportunityId) || undefined,
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

    if (action === "delete_interaction") {
      const interactionId = value(req.body, "interactionId");
      if (!interactionId) return res.status(400).json({ error: "Interaction id is required." });
      if (!hasDeleteConfirmation(value(req.body, "confirmation"))) return organizationRedirect(res, organizationId, { error: "Type delete to confirm record deletion." });
      await deleteSalesInteraction(organizationId, interactionId);
      return organizationRedirect(res, organizationId, { deleted: "1" });
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
        assignedOwner: value(req.body, "assignedOwner"),
        nextAction: value(req.body, "nextAction"),
        nextActionDate: value(req.body, "nextActionDate") || undefined,
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
