interface SubmissionEmailParams {
  fullName: string;
  workEmail: string;
  organization: string;
  projectName: string;
  methodology: string;
  note: string;
  fileName: string;
  submissionId: string;
  timestamp: string;
}

function buildEmailText(params: SubmissionEmailParams): string {
  const lines = [
    "New evidence readiness assessment request.",
    "",
    "Contact:",
    "",
    `Name:          ${params.fullName}`,
    `Email:         ${params.workEmail}`,
    `Organization:  ${params.organization}`,
    `Project:       ${params.projectName}`,
    `Methodology:   ${params.methodology}`,
    `Reference ID:  ${params.submissionId}`,
    `File:          ${params.fileName}`,
    `Submitted:     ${params.timestamp}`,
  ];

  if (params.note) {
    lines.push("", `Additional note: ${params.note}`);
  }

  return lines.join("\n");
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
    subject: "New Article6 PDD submission received",
    text: buildEmailText(params),
  };

  try {
    console.info("[email] Sending Resend notification", {
      from: `Article6 <${fromAddress}>`,
      to: adminEmail,
      subject: "New Article6 PDD submission received",
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
