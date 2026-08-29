import type { NextApiRequest, NextApiResponse } from "next";
import { verifyGitHubActionsOidc } from "../../../lib/github-actions-oidc";
import {
  addSalesInteraction,
  createSalesOrganization,
  listSalesOrganizations,
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

type CrmAutomationCommand = RecordInteractionCommand | CreateOrganizationCommand;

function bearerToken(req: NextApiRequest): string | null {
  const authorization = req.headers.authorization || "";
  return authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : null;
}

async function resolveOrganization(selector: OrganizationSelector) {
  const query = selector.id || selector.domain || selector.name || "";
  if (!query) throw new Error("Organization selector is required.");
  const candidates = await listSalesOrganizations(query);

  if (selector.id) {
    const byId = candidates.find((candidate) => candidate.id === selector.id);
    if (byId) return byId;
  }
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

  await addSalesInteraction({
    organizationId: organization.id,
    channel: command.interaction.channel || "EMAIL",
    direction: command.interaction.direction || "INBOUND",
    interactionType: command.interaction.interactionType || "REPLY",
    occurredAt: occurredAt.toISOString(),
    subject: command.interaction.subject?.trim() || undefined,
    summary: command.interaction.summary.trim(),
    outcomeCode: command.interaction.outcomeCode?.trim() || undefined,
  });

  const patch = command.organizationUpdate;
  let finalStatus = organization.status;
  if (patch) {
    const status = patch.status || organization.status;
    const experiment = patch.experiment || organization.experiment;
    const objectionCode = patch.objectionCode || organization.objectionCode;
    if (!isSalesOrganizationStatus(status)) throw new Error("Invalid organization status.");
    if (!isSalesExperiment(experiment)) throw new Error("Invalid sales experiment.");
    if (objectionCode && !isSalesObjectionCode(objectionCode)) throw new Error("Invalid objection code.");

    const notesAppend = patch.notesAppend?.trim();
    const notes = notesAppend
      ? [organization.notes.trim(), notesAppend].filter(Boolean).join("\n\n")
      : organization.notes;

    await updateSalesOrganizationState({
      organizationId: organization.id,
      status,
      experiment,
      objectionCode,
      internalCertificationTeam: organization.internalCertificationTeam,
      doNotContact: patch.doNotContact ?? organization.doNotContact,
      notes,
      assignedOwner: organization.assignedOwner,
      nextAction: patch.nextAction ?? organization.nextAction,
      nextActionDate: patch.nextActionDate ?? organization.nextActionDate,
    });
    finalStatus = status;
  }

  const verified = await resolveOrganization({ id: organization.id, name: organization.name });
  if (verified.status !== finalStatus) throw new Error("CRM verification failed after update.");
  return { organizationId: organization.id, organizationName: organization.name, status: verified.status, interactionRecorded: true };
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
  return { organizationId: result.organization.id, organizationName: result.organization.name, created: result.created };
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
        : null;

    if (!result) return res.status(400).json({ error: "Unsupported CRM automation operation." });
    return res.status(200).json({ ok: true, operation: command.operation, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "CRM automation failed.";
    const status = /OIDC|token|issuer|audience|repository|actor|workflow|signature|signing key|ref is not allowed/i.test(message) ? 403 : 400;
    return res.status(status).json({ ok: false, error: message });
  }
}
