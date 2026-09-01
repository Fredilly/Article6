import type { NextApiRequest, NextApiResponse } from "next";
import { verifyGitHubActionsOidc } from "../../../lib/github-actions-oidc";
import {
  listEmailActivity,
  type EmailActivityClassification,
  type EmailActivityEventType,
} from "../../../lib/email-tracking-admin";

interface ListEmailActivityCommand {
  version: 1;
  operation: "list_email_activity";
  since?: string;
  until?: string;
  eventType?: EmailActivityEventType;
  organizationId?: string;
  classification?: EmailActivityClassification;
}

const EVENT_TYPES = new Set<EmailActivityEventType>(["OPEN", "CLICK"]);
const CLASSIFICATIONS = new Set<EmailActivityClassification>([
  "HUMAN_LIKELY",
  "AUTOMATED_LIKELY",
  "UNKNOWN",
]);

function bearerToken(req: NextApiRequest): string | null {
  const authorization = req.headers.authorization || "";
  return authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : null;
}

function validateTimestamp(value: string | undefined, field: string): void {
  if (value && Number.isNaN(Date.parse(value))) throw new Error(`${field} must be a valid ISO date/time.`);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).setHeader("Allow", "POST").json({ error: "Method not allowed." });

  try {
    const token = bearerToken(req);
    if (!token) return res.status(401).json({ error: "Bearer token required." });
    await verifyGitHubActionsOidc(token);

    const command = req.body as ListEmailActivityCommand;
    if (!command || command.version !== 1 || command.operation !== "list_email_activity") {
      return res.status(400).json({ error: "Invalid list_email_activity command." });
    }

    validateTimestamp(command.since, "since");
    validateTimestamp(command.until, "until");
    if (command.since && command.until && Date.parse(command.since) > Date.parse(command.until)) {
      throw new Error("since must be before until.");
    }
    if (command.eventType && !EVENT_TYPES.has(command.eventType)) throw new Error("eventType must be OPEN or CLICK.");
    if (command.classification && !CLASSIFICATIONS.has(command.classification)) {
      throw new Error("classification must be HUMAN_LIKELY, AUTOMATED_LIKELY, or UNKNOWN.");
    }

    const result = await listEmailActivity({
      since: command.since,
      until: command.until,
      eventType: command.eventType,
      organizationId: command.organizationId,
      classification: command.classification,
    });

    return res.status(200).json({
      ok: true,
      operation: command.operation,
      filters: {
        since: command.since || null,
        until: command.until || null,
        eventType: command.eventType || null,
        organizationId: command.organizationId || null,
        classification: command.classification || null,
      },
      count: result.length,
      result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "CRM email activity automation failed.";
    const status = /OIDC|token|issuer|audience|repository|actor|workflow|signature|signing key|ref is not allowed/i.test(message) ? 403 : 400;
    return res.status(status).json({ ok: false, error: message });
  }
}
