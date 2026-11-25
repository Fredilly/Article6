import { normalizeDomain, normalizeOrganizationName } from "./sales-memory.ts";

/**
 * Pure validation and identity helpers for the outbound web-development lead
 * intake route (pages/api/partner/web-lead-ingest.ts).
 *
 * Deliberately free of database, network and framework imports so the rules the
 * route enforces can be unit tested directly with `node --test`.
 */

export const WEB_LEAD_MAX_PER_BATCH = 10;

/**
 * Research hypotheses only. `UNKNOWN` is not a hypothesis: an unresearched lead
 * must omit the field so the CRM profile keeps its own default.
 */
export const WEB_LEAD_SERVICES = ["GEO_VISIBILITY", "WEBSITE_REDESIGN"] as const;

export type WebLeadService = (typeof WEB_LEAD_SERVICES)[number];

const FIELD_LIMITS = {
  company: 180,
  website: 400,
  sourceUrl: 1000,
  sourceTitle: 300,
  evidence: 2000,
  nextAction: 500,
  contactName: 120,
  contactEmail: 254,
  contactPhone: 40,
  country: 80,
  service: 32,
} as const;

type WebLeadField = keyof typeof FIELD_LIMITS;

export const WEB_LEAD_REQUIRED_FIELDS: readonly WebLeadField[] = [
  "company",
  "website",
  "sourceUrl",
  "sourceTitle",
  "evidence",
  "nextAction",
];

export const WEB_LEAD_OPTIONAL_FIELDS: readonly WebLeadField[] = [
  "contactName",
  "contactEmail",
  "contactPhone",
  "country",
  "service",
];

export interface WebLeadInput {
  company: string;
  website: string;
  sourceUrl: string;
  sourceTitle: string;
  evidence: string;
  nextAction: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  country?: string;
  service?: WebLeadService;
}

/** `index` is the lead position, or -1 for envelope-level problems. */
export interface WebLeadFieldError {
  index: number;
  field: string;
  message: string;
}

export type WebLeadValidationResult =
  | { ok: true; leads: WebLeadInput[] }
  | { ok: false; errors: WebLeadFieldError[] };

export interface WebLeadOrganizationRef {
  name: string;
  domain?: string | null;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isHttpsUrl(value: string): boolean {
  if (!/^https:\/\/[^\s/]+/i.test(value)) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && parsed.hostname.includes(".");
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateLead(raw: unknown, index: number): { lead?: WebLeadInput; errors: WebLeadFieldError[] } {
  const errors: WebLeadFieldError[] = [];
  if (!isRecord(raw)) {
    return { errors: [{ index, field: "", message: "Each lead must be an object." }] };
  }

  const known = new Set<string>([...WEB_LEAD_REQUIRED_FIELDS, ...WEB_LEAD_OPTIONAL_FIELDS]);
  for (const key of Object.keys(raw)) {
    if (!known.has(key)) errors.push({ index, field: key, message: "Unknown field." });
  }

  const values: Partial<Record<WebLeadField, string>> = {};
  for (const field of [...WEB_LEAD_REQUIRED_FIELDS, ...WEB_LEAD_OPTIONAL_FIELDS]) {
    const required = WEB_LEAD_REQUIRED_FIELDS.includes(field);
    const value = raw[field];
    if (value === undefined || value === null) {
      if (required) errors.push({ index, field, message: "Required." });
      continue;
    }
    if (typeof value !== "string") {
      errors.push({ index, field, message: "Must be a string." });
      continue;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      if (required) errors.push({ index, field, message: "Required." });
      continue;
    }
    if (trimmed.length > FIELD_LIMITS[field]) {
      errors.push({ index, field, message: `Must be at most ${FIELD_LIMITS[field]} characters.` });
      continue;
    }
    values[field] = trimmed;
  }

  if (values.website !== undefined && !isHttpsUrl(values.website)) {
    errors.push({ index, field: "website", message: "Must be an https URL." });
  }
  if (values.sourceUrl !== undefined && !isHttpsUrl(values.sourceUrl)) {
    errors.push({ index, field: "sourceUrl", message: "Must be an https URL." });
  }
  if (values.contactEmail !== undefined) {
    if (!EMAIL_PATTERN.test(values.contactEmail)) {
      errors.push({ index, field: "contactEmail", message: "Must be a valid email address." });
    } else {
      values.contactEmail = values.contactEmail.toLowerCase();
    }
  }
  if (values.service !== undefined && !(WEB_LEAD_SERVICES as readonly string[]).includes(values.service)) {
    errors.push({
      index,
      field: "service",
      message: `Must be one of ${WEB_LEAD_SERVICES.join(", ")}.`,
    });
  }

  if (errors.length) return { errors };
  return {
    lead: {
      company: values.company as string,
      website: values.website as string,
      sourceUrl: values.sourceUrl as string,
      sourceTitle: values.sourceTitle as string,
      evidence: values.evidence as string,
      nextAction: values.nextAction as string,
      ...(values.contactName ? { contactName: values.contactName } : {}),
      ...(values.contactEmail ? { contactEmail: values.contactEmail } : {}),
      ...(values.contactPhone ? { contactPhone: values.contactPhone } : {}),
      ...(values.country ? { country: values.country } : {}),
      ...(values.service ? { service: values.service as WebLeadService } : {}),
    },
    errors: [],
  };
}

export function validateWebLeadBatch(payload: unknown): WebLeadValidationResult {
  if (!isRecord(payload)) {
    return { ok: false, errors: [{ index: -1, field: "", message: "Request body must be a JSON object." }] };
  }

  const errors: WebLeadFieldError[] = [];
  for (const key of Object.keys(payload)) {
    if (key !== "leads") errors.push({ index: -1, field: key, message: "Unknown field." });
  }

  const leads = payload.leads;
  if (!Array.isArray(leads)) {
    errors.push({ index: -1, field: "leads", message: "Required array of leads." });
    return { ok: false, errors };
  }
  if (leads.length === 0) errors.push({ index: -1, field: "leads", message: "At least one lead is required." });
  if (leads.length > WEB_LEAD_MAX_PER_BATCH) {
    errors.push({ index: -1, field: "leads", message: `At most ${WEB_LEAD_MAX_PER_BATCH} leads per request.` });
  }
  if (errors.length) return { ok: false, errors };

  const accepted: WebLeadInput[] = [];
  leads.forEach((raw, index) => {
    const result = validateLead(raw, index);
    if (result.lead) accepted.push(result.lead);
    errors.push(...result.errors);
  });

  return errors.length ? { ok: false, errors } : { ok: true, leads: accepted };
}

/** Domain identity for a researched lead, without the scheme or www prefix. */
export function webLeadDomain(website: string): string {
  return normalizeDomain(website) || "";
}

/**
 * Dedupe key: the registrable host wins, company name is the fallback. Two
 * researched leads for the same site collapse even when the company strings differ.
 */
export function webLeadKey(lead: { company: string; website: string }): string {
  const domain = webLeadDomain(lead.website);
  return domain ? `domain:${domain}` : `name:${normalizeOrganizationName(lead.company)}`;
}

export function matchesDomain(domain: string, organization: WebLeadOrganizationRef): boolean {
  const target = normalizeDomain(domain);
  const existing = normalizeDomain(organization.domain || "");
  return Boolean(target && existing && target === existing);
}

export function matchesOrganization(
  lead: { company: string; website: string },
  organization: WebLeadOrganizationRef,
): boolean {
  if (matchesDomain(webLeadDomain(lead.website), organization)) return true;
  const leadName = normalizeOrganizationName(lead.company);
  return Boolean(leadName) && leadName === normalizeOrganizationName(organization.name);
}

/**
 * Interaction summary. Every researched statement keeps its source so the CRM
 * record can be audited without trusting the caller.
 */
export function buildWebLeadSummary(lead: WebLeadInput): string {
  return [
    `Outbound research lead (${lead.company})`,
    `Website: ${lead.website}`,
    `Source: ${lead.sourceTitle} - ${lead.sourceUrl}`,
    `Evidence: ${lead.evidence}`,
    `Next action: ${lead.nextAction}`,
  ].join("\n");
}
