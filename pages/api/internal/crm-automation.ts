import type { NextApiRequest, NextApiResponse } from "next";
import { verifyGitHubActionsOidc } from "../../../lib/github-actions-oidc";
import {
  addSalesContact,
  addSalesInteraction,
  createSalesOrganization,
  createSalesTenderOpportunity,
  deleteSalesInteraction,
  getSalesOrganizationDetail,
  listSalesOrganizations,
  updateSalesContact,
  updateSalesOrganizationState,
} from "../../../lib/sales-store";
import {
  isSalesExperiment,
  isSalesObjectionCode,
  isSalesOrganizationStatus,
  normalizeOrganizationName,
  type SalesExperiment,
  type SalesObjectionCode,
  type SalesOrganizationStatus,
} from "../../../lib/sales-memory";

interface OrganizationSelector {
  id?: string;
  name?: string;
  domain?: string;
}

interface RecordInteractionCommand {
  version: 1;
  operation: "record_interaction";
  organization: OrganizationSelector;
  interaction: {
    occurredAt: string;
    channel?: string;
    direction?: string;
    interactionType?: string;
    subject?: string;
    summary: string;
    outcomeCode?: string;
    externalReference?: string;
    gmailThreadId?: string;
    contactId?: string;
    contactEmail?: string;
    contactName?: string;
  };
  organizationUpdate?: {
    status?: SalesOrganizationStatus;
    experiment?: SalesExperiment;
    objectionCode?: SalesObjectionCode;
    doNotContact?: boolean;
    notesAppend?: string;
    nextAction?: string;
    nextActionDate?: string;
  };
}

interface CreateOrganizationCommand {
  version: 1;
  operation: "create_organization";
  organization: {
    name: string;
    domain?: string;
    country?: string;
    experiment?: SalesExperiment;
    notes?: string;
  };
}

interface UpsertContactCommand {
  version: 1;
  operation: "upsert_contact";
  organization: OrganizationSelector;
  contact: {
    name: string;
    title?: string;
    email?: string;
    phone?: string;
    notes?: string;
  };
}

interface CreateTenderCommand {
  version: 1;
  operation: "create_tender";
  organization: OrganizationSelector;
  tender: {
    name: string;
    buyer?: string;
    referenceNumber?: string;
    submissionDeadline?: string;
    contractValue?: string;
    sector?: string;
    bidderStatus?: string;
    notes?: string;
    buyerRequirements?: string;
    salesStatus?: SalesOrganizationStatus;
    assignedOwner?: string;
    nextAction?: string;
    nextActionDate?: string;
    sourceKey?: string;
  };
}

interface UpdateOrganizationCommand {
  version: 1;
  operation: "update_organization";
  organization: OrganizationSelector;
  update: {
    status?: SalesOrganizationStatus;
    experiment?: SalesExperiment;
    objectionCode?: SalesObjectionCode;
    doNotContact?: boolean;
    notes?: string;
    assignedOwner?: string;
    nextAction?: string;
    nextActionDate?: string;
  };
}

interface DeleteInteractionCommand {
  version: 1;
  operation: "delete_interaction";
  organization: OrganizationSelector;
  interactionId: string;
}

interface InspectOrganizationCommand {
  version: 1;
  operation: "inspect_organization";
  organization: OrganizationSelector;
}

type CrmAutomationCommand =
  | RecordInteractionCommand
  | CreateOrganizationCommand
  | UpsertContactCommand
  | CreateTenderCommand
  | UpdateOrganizationCommand
  | DeleteInteractionCommand
  | InspectOrganizationCommand;

function bearerToken(req: NextApiRequest): string | null {
  const authorization = req.headers.authorization || "";
  return authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : null;
}

async function resolveOrganization(selector: OrganizationSelector) {
  if (selector.id) {
    const detail = await getSalesOrganizationDetail(selector.id);
    if (detail) return detail.organization;
  }

  const query = selector.domain || selector.name || "";
  if (!query) throw new Error("Organization selector is required.");
  const candidates = await listSalesOrganizations(query);

  if (selector.domain) {
    const domain = selector.domain.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
    const byDomain = candidates.filter((candidate) => candidate.domain?.toLowerCase() === domain);
    if (byDomain.length === 1) return byDomain[0];
  }
  if (selector.name) {
    const normalized = normalizeOrganizationName(selector.name);
    const exact = candidates.filter((candidate) => normalizeOrganizationName(candidate.name) === normalized);
    if (exact.length === 1) return exact[0];
  }
  if (candidates.length === 1) return candidates[0];
  if (!candidates.length) throw new Error("Organization not found.");
  throw new Error("Organization selector is ambiguous.");
}

async function recordInteraction(command: RecordInteractionCommand) {
  const organization = await resolveOrganization(command.organization);
  const occurredAt = new Date(command.interaction.occurredAt);
  if (Number.isNaN(occurredAt.getTime())) throw new Error("Interaction date is invalid.");
  if (!command.interaction.summary?.trim()) throw new Error("Interaction summary is required.");

  const patch = command.organizationUpdate;
  const finalStatus = patch?.status || organization.status;
  const experiment = patch?.experiment || organization.experiment;
  const objectionCode = patch?.objectionCode || organization.objectionCode;
  if (!isSalesOrganizationStatus(finalStatus)) throw new Error("Invalid organization status.");
  if (!isSalesExperiment(experiment)) throw new Error("Invalid sales experiment.");
  if (objectionCode && !isSalesObjectionCode(objectionCode)) throw new Error("Invalid objection code.");

  const before = await getSalesOrganizationDetail(organization.id);
  if (!before) throw new Error("Organization disappeared before CRM update.");
  const externalReference = command.interaction.externalReference?.trim();

  const requestedContactId = command.interaction.contactId?.trim();
  const requestedContactEmail = command.interaction.contactEmail?.trim().toLowerCase();
  const requestedContactName = command.interaction.contactName?.trim().toLowerCase();
  const summaryLower = command.interaction.summary.trim().toLowerCase();

  let resolvedContactId: string | undefined;
  if (requestedContactId) {
    const match = before.contacts.find((contact) => contact.id === requestedContactId);
    if (!match) throw new Error("Interaction contact does not belong to the selected organization.");
    resolvedContactId = match.id;
  } else if (requestedContactEmail) {
    const matches = before.contacts.filter((contact) => contact.email?.trim().toLowerCase() === requestedContactEmail);
    if (matches.length > 1) throw new Error("Interaction contact email is ambiguous within the selected organization.");
    resolvedContactId = matches[0]?.id;
  } else if (requestedContactName) {
    const matches = before.contacts.filter((contact) => contact.name.trim().toLowerCase() === requestedContactName);
    if (matches.length > 1) throw new Error("Interaction contact name is ambiguous within the selected organization.");
    resolvedContactId = matches[0]?.id;
  } else {
    const summaryMatches = before.contacts.filter((contact) => {
      const name = contact.name.trim().toLowerCase();
      const email = contact.email?.trim().toLowerCase();
      return (name && summaryLower.includes(name)) || Boolean(email && summaryLower.includes(email));
    });
    if (summaryMatches.length === 1) resolvedContactId = summaryMatches[0].id;
    else if (before.contacts.length === 1) resolvedContactId = before.contacts[0].id;
  }

  const channel = (command.interaction.channel || "EMAIL").toUpperCase();
  if (channel === "EMAIL" && !resolvedContactId) {
    throw new Error("Email interaction requires a resolvable CRM contact. Pass contactId or the exact Gmail recipient as contactEmail; refusing to create an unlinked email interaction.");
  }

  const duplicateInteraction = Boolean(
    externalReference && before.interactions.some((interaction) => interaction.externalReference === externalReference),
  );

  if (!duplicateInteraction) {
    await addSalesInteraction({
      organizationId: organization.id,
      contactId: resolvedContactId,
      channel: command.interaction.channel || "EMAIL",
      direction: command.interaction.direction || "INBOUND",
      interactionType: command.interaction.interactionType || "REPLY",
      occurredAt: occurredAt.toISOString(),
      subject: command.interaction.subject?.trim() || undefined,
      summary: command.interaction.summary.trim(),
      outcomeCode: command.interaction.outcomeCode?.trim() || undefined,
      externalReference,
      gmailThreadId: command.interaction.gmailThreadId?.trim() || undefined,
    });
  }

  if (patch) {
    const notesAppend = patch.notesAppend?.trim();
    const notesAlreadyContainAppend = Boolean(notesAppend && organization.notes.includes(notesAppend));
    const notes = notesAppend && !notesAlreadyContainAppend
      ? [organization.notes.trim(), notesAppend].filter(Boolean).join("\n\n")
      : organization.notes;

    await updateSalesOrganizationState({
      organizationId: organization.id,
      status: finalStatus,
      experiment,
      objectionCode,
      internalCertificationTeam: organization.internalCertificationTeam,
      doNotContact: patch.doNotContact ?? organization.doNotContact,
      notes,
      assignedOwner: organization.assignedOwner,
      nextAction: patch.nextAction ?? organization.nextAction,
      nextActionDate: patch.nextActionDate ?? organization.nextActionDate,
    });
  }

  const verified = await getSalesOrganizationDetail(organization.id);
  if (!verified || verified.organization.status !== finalStatus) throw new Error("CRM verification failed after update.");
  const interactionVerified = externalReference
    ? verified.interactions.some((interaction) => interaction.externalReference === externalReference)
    : verified.interactions.some((interaction) => interaction.summary === command.interaction.summary.trim() && interaction.occurredAt === occurredAt.toISOString());
  if (!interactionVerified) throw new Error("CRM interaction verification failed after update.");

  return {
    organizationId: organization.id,
    organizationName: organization.name,
    status: verified.organization.status,
    interactionRecorded: true,
    interactionWasDuplicate: duplicateInteraction,
  };
}

async function createOrganization(command: CreateOrganizationCommand) {
  const input = command.organization;
  if (!input.name?.trim()) throw new Error("Organization name is required.");
  if (input.experiment && !isSalesExperiment(input.experiment)) throw new Error("Invalid sales experiment.");
  const result = await createSalesOrganization({
    name: input.name.trim(),
    domain: input.domain?.trim(),
    country: input.country?.trim(),
    experiment: input.experiment,
    notes: input.notes?.trim(),
  });
  const verified = await getSalesOrganizationDetail(result.organization.id);
  if (!verified) throw new Error("CRM verification failed after organization creation.");
  return { organizationId: verified.organization.id, organizationName: verified.organization.name, created: result.created };
}

async function upsertContact(command: UpsertContactCommand) {
  const organization = await resolveOrganization(command.organization);
  const input = command.contact;
  const name = input.name?.trim();
  if (!name) throw new Error("Contact name is required.");

  const before = await getSalesOrganizationDetail(organization.id);
  if (!before) throw new Error("Organization disappeared before contact update.");

  const email = input.email?.trim().toLowerCase();
  const normalizedName = name.toLowerCase();
  const existingByEmail = email
    ? before.contacts.find((contact) => contact.email?.trim().toLowerCase() === email)
    : undefined;
  const existingByName = before.contacts.find((contact) => contact.name.trim().toLowerCase() === normalizedName);
  const existing = existingByEmail || existingByName;

  let contactId: string;
  let created = false;

  if (existing) {
    await updateSalesContact({
      organizationId: organization.id,
      contactId: existing.id,
      name,
      title: input.title?.trim() ?? existing.title,
      email: email ?? existing.email,
      phone: input.phone?.trim() ?? existing.phone,
      notes: input.notes?.trim() ?? existing.notes,
    });
    contactId = existing.id;
  } else {
    const contact = await addSalesContact({
      organizationId: organization.id,
      name,
      title: input.title?.trim(),
      email,
      phone: input.phone?.trim(),
      notes: input.notes?.trim(),
    });
    contactId = contact.id;
    created = true;
  }

  const verified = await getSalesOrganizationDetail(organization.id);
  const verifiedContact = verified?.contacts.find((contact) => contact.id === contactId);
  if (!verifiedContact) throw new Error("CRM contact verification failed after update.");
  if (email && verifiedContact.email?.trim().toLowerCase() !== email) throw new Error("CRM contact email verification failed after update.");
  if (verifiedContact.name.trim().toLowerCase() !== normalizedName) throw new Error("CRM contact name verification failed after update.");

  return {
    organizationId: organization.id,
    organizationName: organization.name,
    contactId: verifiedContact.id,
    contactName: verifiedContact.name,
    email: verifiedContact.email,
    created,
  };
}

async function createTender(command: CreateTenderCommand) {
  const organization = await resolveOrganization(command.organization);
  const input = command.tender;
  const name = input.name?.trim();
  if (!name) throw new Error("Tender name is required.");
  if (input.salesStatus && !isSalesOrganizationStatus(input.salesStatus)) throw new Error("Invalid tender sales status.");
  if (input.submissionDeadline && Number.isNaN(Date.parse(input.submissionDeadline))) throw new Error("Tender deadline is invalid.");

  const tenderId = await createSalesTenderOpportunity({
    organizationId: organization.id,
    name,
    buyer: input.buyer?.trim(),
    referenceNumber: input.referenceNumber?.trim(),
    submissionDeadline: input.submissionDeadline,
    contractValue: input.contractValue?.trim(),
    sector: input.sector?.trim(),
    status: "NEW",
    bidderStatus: input.bidderStatus?.trim(),
    notes: input.notes?.trim(),
    buyerRequirements: input.buyerRequirements?.trim(),
    salesStatus: input.salesStatus || "NEW",
    assignedOwner: input.assignedOwner?.trim(),
    nextAction: input.nextAction?.trim(),
    nextActionDate: input.nextActionDate,
    sourceKey: input.sourceKey?.trim(),
  });

  const verified = await getSalesOrganizationDetail(organization.id);
  const tender = verified?.tenderOpportunities.find((candidate) => candidate.id === tenderId);
  if (!tender) throw new Error("CRM tender verification failed after creation.");
  if (input.bidderStatus?.trim() && tender.bidderStatus !== input.bidderStatus.trim()) throw new Error("CRM tender bidder-status verification failed after creation.");

  return {
    organizationId: organization.id,
    organizationName: organization.name,
    tenderId: tender.id,
    tenderName: tender.name,
    bidderStatus: tender.bidderStatus,
    submissionDeadline: tender.submissionDeadline,
  };
}

async function updateOrganization(command: UpdateOrganizationCommand) {
  const organization = await resolveOrganization(command.organization);
  const patch = command.update;
  const status = patch.status || organization.status;
  const experiment = patch.experiment || organization.experiment;
  const objectionCode = patch.objectionCode || organization.objectionCode;
  if (!isSalesOrganizationStatus(status)) throw new Error("Invalid organization status.");
  if (!isSalesExperiment(experiment)) throw new Error("Invalid sales experiment.");
  if (objectionCode && !isSalesObjectionCode(objectionCode)) throw new Error("Invalid objection code.");

  await updateSalesOrganizationState({
    organizationId: organization.id,
    status,
    experiment,
    objectionCode,
    internalCertificationTeam: organization.internalCertificationTeam,
    doNotContact: patch.doNotContact ?? organization.doNotContact,
    notes: patch.notes ?? organization.notes,
    assignedOwner: patch.assignedOwner ?? organization.assignedOwner,
    nextAction: patch.nextAction ?? organization.nextAction,
    nextActionDate: patch.nextActionDate ?? organization.nextActionDate,
  });

  const verified = await getSalesOrganizationDetail(organization.id);
  if (!verified || verified.organization.status !== status || verified.organization.experiment !== experiment) {
    throw new Error("CRM organization verification failed after update.");
  }
  return {
    organizationId: verified.organization.id,
    organizationName: verified.organization.name,
    status: verified.organization.status,
    experiment: verified.organization.experiment,
  };
}

async function deleteInteraction(command: DeleteInteractionCommand) {
  const organization = await resolveOrganization(command.organization);
  const interactionId = command.interactionId?.trim();
  if (!interactionId) throw new Error("Interaction id is required.");
  await deleteSalesInteraction(organization.id, interactionId);
  const verified = await getSalesOrganizationDetail(organization.id);
  if (!verified || verified.interactions.some((interaction) => interaction.id === interactionId)) {
    throw new Error("CRM interaction deletion verification failed.");
  }
  return { organizationId: organization.id, organizationName: organization.name, interactionId, deleted: true };
}

async function inspectOrganization(command: InspectOrganizationCommand) {
  const organization = await resolveOrganization(command.organization);
  const detail = await getSalesOrganizationDetail(organization.id);
  if (!detail) throw new Error("Organization not found.");
  return {
    organization: {
      id: detail.organization.id,
      name: detail.organization.name,
      experiment: detail.organization.experiment,
      status: detail.organization.status,
    },
    contacts: detail.contacts.map((contact) => ({ id: contact.id, name: contact.name, email: contact.email })),
    tenders: detail.tenderOpportunities.map((tender) => ({
      id: tender.id,
      name: tender.name,
      buyer: tender.buyer,
      referenceNumber: tender.referenceNumber,
      submissionDeadline: tender.submissionDeadline,
      contractValue: tender.contractValue,
      bidderStatus: tender.bidderStatus,
      buyerRequirements: tender.buyerRequirements,
      notes: tender.notes,
    })),
    interactions: detail.interactions.map((interaction) => ({
      id: interaction.id,
      channel: interaction.channel,
      direction: interaction.direction,
      interactionType: interaction.interactionType,
      occurredAt: interaction.occurredAt,
      summary: interaction.summary,
      externalReference: interaction.externalReference,
    })),
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).setHeader("Allow", "POST").json({ error: "Method not allowed." });

  try {
    const token = bearerToken(req);
    if (!token) return res.status(401).json({ error: "Bearer token required." });
    await verifyGitHubActionsOidc(token);

    const command = req.body as CrmAutomationCommand;
    if (!command || command.version !== 1 || typeof command.operation !== "string") {
      return res.status(400).json({ error: "Invalid CRM automation command." });
    }

    const result = command.operation === "record_interaction"
      ? await recordInteraction(command)
      : command.operation === "create_organization"
        ? await createOrganization(command)
        : command.operation === "upsert_contact"
          ? await upsertContact(command)
          : command.operation === "create_tender"
            ? await createTender(command)
            : command.operation === "update_organization"
              ? await updateOrganization(command)
              : command.operation === "delete_interaction"
                ? await deleteInteraction(command)
                : command.operation === "inspect_organization"
                  ? await inspectOrganization(command)
                  : null;

    if (!result) return res.status(400).json({ error: "Unsupported CRM automation operation." });
    return res.status(200).json({ ok: true, operation: command.operation, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "CRM automation failed.";
    const status = /OIDC|token|issuer|audience|repository|actor|workflow|signature|signing key|ref is not allowed/i.test(message) ? 403 : 400;
    return res.status(status).json({ ok: false, error: message });
  }
}
