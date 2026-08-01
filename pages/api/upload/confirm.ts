import type { NextApiRequest, NextApiResponse } from "next";
import { getBucketName, resolveUploadReference, verifyObjectExists } from "../../../lib/r2";
import { sendSubmissionNotification } from "../../../lib/email";
import { hasInternalUploadSession } from "../../../lib/internal-auth";
import { sanitizeOriginalFilename, validateStoredObject, validateSubmissionMetadata, type SubmissionSource } from "../../../lib/submissions";

interface ConfirmRequestBody {
  uploadReference: string;
  fileName: string;
  fileSize: number;
  contactName: string;
  workEmail?: string;
  organization: string;
  projectName: string;
  methodology: string;
  submissionSource: SubmissionSource;
  externalContact?: string;
  note?: string;
}

export function validateConfirmRequest(body: Partial<ConfirmRequestBody>): string | null {
  if (!body.uploadReference) return "Invalid upload reference.";
  return validateSubmissionMetadata(body);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body as Partial<ConfirmRequestBody>;
  const validationError = validateConfirmRequest(body);
  if (validationError) return res.status(400).json({ error: validationError });

  if (body.submissionSource !== "website" && !(await hasInternalUploadSession(req))) {
    return res.status(401).json({ error: "Internal upload authentication required." });
  }

  try {
    const resolved = resolveUploadReference(body.uploadReference);
    if (!resolved) return res.status(400).json({ error: "Invalid or expired upload reference." });
    const verification = await verifyObjectExists(resolved.key);
    const storedObjectError = validateStoredObject(verification, body.fileSize!);
    if (storedObjectError) return res.status(400).json({ error: storedObjectError });
    const submissionId = resolved.submissionReference;
    const timestamp = new Date().toISOString();
    const submission = {
      id: submissionId,
      timestamp,
      key: resolved.key,
      bucket: getBucketName(),
      fileName: sanitizeOriginalFilename(body.fileName!),
      fileSize: verification.size,
      contactName: body.contactName!.trim(),
      workEmail: body.workEmail?.trim().toLowerCase() || undefined,
      organization: body.organization!.trim(),
      projectName: body.projectName!.trim(),
      methodology: body.methodology!.trim(),
      submissionSource: body.submissionSource,
      externalContact: body.externalContact?.trim() || undefined,
      note: body.note?.trim() || "",
    };

    console.log("[Submission Confirmed]", JSON.stringify(submission, null, 2));
    await sendSubmissionNotification({
      contactName: submission.contactName,
      workEmail: submission.workEmail,
      organization: submission.organization,
      projectName: submission.projectName,
      methodology: submission.methodology,
      submissionSource: submission.submissionSource!,
      externalContact: submission.externalContact,
      note: submission.note,
      fileName: submission.fileName,
      submissionId: submission.id,
      submissionReference: resolved.submissionReference,
      fileSize: submission.fileSize,
      timestamp: submission.timestamp,
    });

    return res.status(200).json({
      success: true,
      submissionId: resolved.submissionReference,
      message: body.submissionSource === "website" ? "Your PDD has been submitted for scope review. We will respond within two business days." : "Internal PDD submission received.",
    });
  } catch (err) {
    console.error("[confirm] Error confirming submission:", err instanceof Error ? err.message : String(err));
    return res.status(500).json({ error: "Failed to confirm submission. Please contact us at contact@article6.org." });
  }
}
