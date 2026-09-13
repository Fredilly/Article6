import type { NextApiRequest, NextApiResponse } from "next";
import { verifyGitHubActionsOidc } from "../../../lib/github-actions-oidc";
import {
  addSalesContact,
  getSalesOrganizationDetail,
  listSalesOrganizations,
  updateSalesContact,
} from "../../../lib/sales-store";
import { normalizeOrganizationName } from "../../../lib/sales-memory";
import {
  VISUAL_COMMERCE_EMAIL_TYPES,
  getSalesVisualCommerceProfile,
  updateSalesVisualCommerceContact,
  upsertSalesVisualCommerceProfile,
  type SalesVisualCommerceProfilePatch,
  type VisualCommerceEmailType,
} from "../../../lib/sales-visual-commerce";

interface OrganizationSelector {
  id?: string;
  name?: string;
  domain?: string;
}

interface UpsertVisualCommerceProfileCommand {
  version: 1;
  operation: "upsert_visual_commerce_profile";
  organization: OrganizationSelector;
  profile: SalesVisualCommerceProfilePatch;
}

interface UpsertVisualCommerceContactCommand {
  version: 1;
  operation: "upsert_visual_commerce_contact";
  organization: OrganizationSelector;
  contact: {
    name: string;
    title?: string;
    email?: string;
    emailType?: VisualCommerceEmailType;
    phone?: string;
    whatsapp?: string;
    notes?: string;
    sourceUrl?: string;
  };
}

type VisualCommerceAutomationCommand = UpsertVisualCommerceProfileCommand | UpsertVisualCommerceContactCommand;

function bearerToken(req: NextApiRequest): string | null {
  const authorization = req.headers.authorization || "";
  return authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : null;
}

function normalizeDomain(value: string): string {
  return value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
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
    const domain = normalizeDomain(selector.domain);
    const matches = candidates.filter((candidate) => normalizeDomain(candidate.domain || "") === domain);
    if (matches.length === 1) return matches[0];
  }

  if (selector.name) {
    const normalized = normalizeOrganizationName(selector.name);
    const matches = candidates.filter((candidate) => normalizeOrganizationName(candidate.name) === normalized);
    if (matches.length === 1) return matches[0];
  }

  if (candidates.length === 1) return candidates[0];
  if (!candidates.length) throw new Error("Organization not found.");
  throw new Error("Organization selector is ambiguous.");
}

async function requireVisualCommerceOrganization(selector: OrganizationSelector) {
  const organization = await resolveOrganization(selector);
  if (organization.experiment !== "VISUAL_COMMERCE") {
    throw new Error("Visual Commerce automation requires a VISUAL_COMMERCE organization.");
  }
  return organization;
}

async function upsertProfile(command: UpsertVisualCommerceProfileCommand) {
  const organization = await requireVisualCommerceOrganization(command.organization);
  const before = await getSalesOrganizationDetail(organization.id);
  if (!before) throw new Error("Organization not found before profile update.");
  const statusBefore = before.organization.status;

  await upsertSalesVisualCommerceProfile(organization.id, command.profile || {});

  const [profile, after] = await Promise.all([
    getSalesVisualCommerceProfile(organization.id),
    getSalesOrganizationDetail(organization.id),
  ]);
  if (!profile || !after) throw new Error("Visual Commerce profile verification failed.");
  if (after.organization.status !== statusBefore) {
    throw new Error("Visual Commerce profile update unexpectedly changed organization status.");
  }

  return {
    organizationId: organization.id,
    organizationName: organization.name,
    status: after.organization.status,
    profile,
    verifiedFromDatabase: true,
  };
}

async function upsertContact(command: UpsertVisualCommerceContactCommand) {
  const organization = await requireVisualCommerceOrganization(command.organization);
  const input = command.contact;
  const name = input?.name?.trim();
  if (!name) throw new Error("Contact name is required.");

  const emailType = input.emailType;
  if (emailType && !VISUAL_COMMERCE_EMAIL_TYPES.includes(emailType)) {
    throw new Error("Invalid Visual Commerce email type.");
  }

  const email = input.email?.trim().toLowerCase() || undefined;
  if (emailType === "NOT_VERIFIED" && email) {
    throw new Error("NOT_VERIFIED contacts must not store an email address.");
  }

  const before = await getSalesOrganizationDetail(organization.id);
  if (!before) throw new Error("Organization not found before contact update.");
  const statusBefore = before.organization.status;
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

  await updateSalesVisualCommerceContact({
    organizationId: organization.id,
    contactId,
    emailType: emailType || null,
    whatsapp: input.whatsapp?.trim() || null,
    sourceUrl: input.sourceUrl?.trim() || null,
  });

  const after = await getSalesOrganizationDetail(organization.id);
  const verified = after?.contacts.find((contact) => contact.id === contactId);
  if (!after || !verified) throw new Error("Visual Commerce contact verification failed.");
  if (after.organization.status !== statusBefore) {
    throw new Error("Visual Commerce contact update unexpectedly changed organization status.");
  }
  if (email && verified.email?.trim().toLowerCase() !== email) {
    throw new Error("Visual Commerce contact email verification failed.");
  }

  return {
    organizationId: organization.id,
    organizationName: organization.name,
    contactId,
    contactName: verified.name,
    created,
    status: after.organization.status,
    verifiedFromDatabase: true,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).setHeader("Allow", "POST").json({ error: "Method not allowed." });
  }

  try {
    const token = bearerToken(req);
    if (!token) return res.status(401).json({ error: "Bearer token required." });
    await verifyGitHubActionsOidc(token);

    const command = req.body as VisualCommerceAutomationCommand;
    if (!command || command.version !== 1 || typeof command.operation !== "string") {
      return res.status(400).json({ error: "Invalid Visual Commerce automation command." });
    }

    const result = command.operation === "upsert_visual_commerce_profile"
      ? await upsertProfile(command)
      : command.operation === "upsert_visual_commerce_contact"
        ? await upsertContact(command)
        : null;

    if (!result) return res.status(400).json({ error: "Unsupported Visual Commerce automation operation." });
    return res.status(200).json({ ok: true, operation: command.operation, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Visual Commerce automation failed.";
    const status = /OIDC|token|issuer|audience|repository|actor|workflow|signature|signing key|ref is not allowed/i.test(message) ? 403 : 400;
    return res.status(status).json({ ok: false, error: message });
  }
}
