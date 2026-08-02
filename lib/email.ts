interface SubmissionEmailParams {
  contactName: string;
  workEmail?: string;
  organization: string;
  projectName: string;
  methodology: string;
  note: string;
  fileName: string;
  submissionId: string;
  timestamp: string;
  submissionSource: string;
  externalContact?: string;
  submissionReference: string;
  fileSize: number;
}

const escapeHtml = (value: string): string => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const optional = (value?: string): string => value?.trim() || "Not provided";
const formatFileSize = (bytes: number): string => `${(bytes / (1024 * 1024)).toFixed(2)} MiB`;
const formatTimestamp = (timestamp: string): string => new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(timestamp)) + " UTC";
export function getInternalSubmissionUrl(reference: string): string {
  const path = `/internal/submissions/${encodeURIComponent(reference)}`;
  return `${process.env.INTERNAL_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || ""}${path}`;
}
export function normalizeEmailSubjectProject(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 120) || "Unnamed project";
}

export function buildEmailText(params: SubmissionEmailParams): string {
  const lines = [
    "New Article6 document submission",
    "",
    "Contact:",
    "",
    `Name:          ${params.contactName}`,
    `Email:         ${params.workEmail || "Not provided"}`,
    `Organization:  ${params.organization}`,
    `Project:       ${params.projectName}`,
    `Methodology:   ${params.methodology}`,
    `Source:        ${params.submissionSource}`,
    `Reference:     ${params.submissionReference}`,
    `Document:      ${params.fileName}`,
    `File size:     ${formatFileSize(params.fileSize)}`,
    `Submitted:     ${formatTimestamp(params.timestamp)}`,
    `View submission: ${getInternalSubmissionUrl(params.submissionReference)}`,
  ];

  lines.splice(8, 0, `External contact: ${params.externalContact || "Not provided"}`);

  if (params.note) {
    lines.push("", `Additional note: ${params.note}`);
  }

  return lines.join("\n");
}

export function buildEmailHtml(params: SubmissionEmailParams): string {
  const rows: Array<[string, string]> = [
    ["Reference", params.submissionReference], ["Project", params.projectName], ["Organization", params.organization],
    ["Contact", params.contactName], ["Work email", optional(params.workEmail)], ["External contact", optional(params.externalContact)],
    ["Source", params.submissionSource], ["Methodology", params.methodology], ["Document", params.fileName],
    ["File size", formatFileSize(params.fileSize)], ["Submitted", formatTimestamp(params.timestamp)],
  ];
  const table = rows.map(([label, value]) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-weight:600;vertical-align:top;white-space:nowrap;">${escapeHtml(label)}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#111827;word-break:break-word;">${escapeHtml(value)}</td></tr>`).join("");
  const notes = params.note?.trim() ? `<h2 style="font-size:16px;color:#111827;margin:24px 0 8px;">Notes</h2><div style="padding:12px;background:#f3f4f6;color:#374151;white-space:pre-wrap;">${escapeHtml(params.note)}</div>` : "";
  const viewLink = getInternalSubmissionUrl(params.submissionReference);
  return `<!doctype html><html><body style="margin:0;background:#f9fafb;font-family:Arial,Helvetica,sans-serif;color:#111827;"><div style="max-width:640px;margin:0 auto;padding:24px 16px;"><div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:24px;"><h1 style="font-size:20px;margin:0 0 20px;color:#14532d;">New Article6 document submission</h1><table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;font-size:14px;">${table}</table>${notes}<p style="margin:24px 0 0;"><a href="${escapeHtml(viewLink)}" style="color:#166534;font-weight:600;">View submission</a></p></div></div></body></html>`;
}

export async function sendSubmissionNotification(params: SubmissionEmailParams): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || "contact@article6.org";
  const fromAddress = process.env.SUBMISSION_FROM_EMAIL || "submissions@article6.org";

  if (!apiKey) {
    console.warn("[Email] RESEND_API_KEY not set. Skipping email notification.");
    console.log("[Email] Would have sent:", buildEmailText(params));
    return false;
  }

  const body = {
    from: `Article6 <${fromAddress}>`,
    to: [adminEmail],
    subject: `New Article6 submission — ${normalizeEmailSubjectProject(params.projectName)} — ${params.submissionReference}`,
    text: buildEmailText(params),
    html: buildEmailHtml(params),
  };

  try {
    console.info("[email] Sending Resend notification", {
      from: `Article6 <${fromAddress}>`,
      to: adminEmail,
      subject: `New Article6 submission — ${normalizeEmailSubjectProject(params.projectName)} — ${params.submissionReference}`,
    });

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error("[email] Resend API error:", {
        status: response.status,
        body: responseText,
      });
      return false;
    }

    console.info(`[email] Notification sent to ${adminEmail} for submission ${params.submissionId}`, {
      resendResponse: responseText,
    });
    return true;
  } catch (err) {
    console.error("[email] Failed to send notification:", {
      error: err instanceof Error ? err.message : String(err),
      adminEmail,
      submissionId: params.submissionId,
    });
    return false;
  }
}
