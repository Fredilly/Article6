import { randomUUID } from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import { getBucketName, verifyObjectExists } from "../../../lib/r2";
import { sendSubmissionNotification } from "../../../lib/email";

interface ConfirmRequestBody {
  key: string;
  fileName: string;
  fullName: string;
  workEmail: string;
  organization: string;
  projectName: string;
  methodology: string;
  note?: string;
}

function validate(body: ConfirmRequestBody): string | null {
  if (!body.key || typeof body.key !== "string" || body.key.length > 1000) {
    return "Invalid upload key.";
  }
  if (!body.key.startsWith("submissions/")) {
    return "Invalid upload key prefix.";
  }
  if (!body.fileName || typeof body.fileName !== "string" || body.fileName.length > 500) {
    return "File name is required.";
  }
  if (!body.fullName || typeof body.fullName !== "string" || body.fullName.length > 200) {
    return "Full name is required.";
  }
  if (!body.workEmail || typeof body.workEmail !== "string" || body.workEmail.length > 320) {
    return "Work email is required.";
  }
  if (!body.organization || typeof body.organization !== "string" || body.organization.length > 200) {
    return "Organization is required.";
  }
  if (!body.projectName || typeof body.projectName !== "string" || body.projectName.length > 300) {
    return "Project name is required.";
  }
  if (!body.methodology || typeof body.methodology !== "string" || body.methodology.length > 200) {
    return "Methodology is required.";
  }
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body as ConfirmRequestBody;

  const validationError = validate(body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    const bucketName = getBucketName();
    console.info("[confirm] Verifying uploaded object", { key: body.key.slice(0, 40) + "...", bucket: bucketName });

    const verification = await verifyObjectExists(body.key);

    console.info("[confirm] Object verification result", {
      exists: verification.exists,
      size: verification.size,
      contentType: verification.contentType,
      lastModified: verification.lastModified,
    });

    if (!verification.exists) {
      return res.status(400).json({
        error: "Uploaded file not found. The file may have expired or was not uploaded successfully.",
      });
    }

    if (verification.size === 0) {
      return res.status(400).json({
        error: "Uploaded file is empty. Please upload a valid PDF file.",
      });
    }

    if (verification.contentType && verification.contentType !== "application/pdf") {
      return res.status(400).json({
        error: "Uploaded file is not a valid PDF.",
      });
    }

    const submissionId = randomUUID();
    const timestamp = new Date().toISOString();

    const submission = {
      id: submissionId,
      timestamp,
      key: body.key,
      bucket: bucketName,
      fileName: body.fileName.trim(),
      fileSize: verification.size,
      fullName: body.fullName.trim(),
      workEmail: body.workEmail.trim().toLowerCase(),
      organization: body.organization.trim(),
      projectName: body.projectName.trim(),
      methodology: body.methodology.trim(),
      note: body.note ? body.note.trim() : "",
    };

    console.log("[Submission Confirmed]", JSON.stringify(submission, null, 2));

    console.info("[confirm] Sending Resend notification", {
      to: process.env.ADMIN_NOTIFICATION_EMAIL || "contact@article6.org",
      resendKey: process.env.RESEND_API_KEY ? "set" : "MISSING",
    });

    const emailSent = await sendSubmissionNotification({
      fullName: submission.fullName,
      workEmail: submission.workEmail,
      organization: submission.organization,
      projectName: submission.projectName,
      methodology: submission.methodology,
      note: submission.note,
      fileName: submission.fileName,
      submissionId: submission.id,
      timestamp: submission.timestamp,
    });

    console.info("[confirm] Email notification result", { emailSent, submissionId: submission.id });

    return res.status(200).json({
      success: true,
      submissionId: submission.id,
      message: "Your PDD has been submitted for scope review. We will respond within two business days.",
    });
  } catch (err) {
    console.error("[confirm] Error confirming submission:", {
      error: err instanceof Error ? err.message : String(err),
      key: body.key,
      r2AccountId: process.env.R2_ACCOUNT_ID ? "set" : "MISSING",
    });
    return res.status(500).json({
      error: "Failed to confirm submission. Please contact us at contact@article6.org.",
    });
  }
}
