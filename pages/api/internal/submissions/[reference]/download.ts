import type { NextApiRequest, NextApiResponse } from "next";
import { hasInternalUploadSession } from "../../../../../lib/internal-auth";
import { generatePresignedDownloadUrl, verifyObjectExists } from "../../../../../lib/r2";
import { getSubmissionByReference } from "../../../../../lib/submission-store";
import { isSubmissionReference } from "../../../../../lib/submissions";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(await hasInternalUploadSession(req))) return res.status(401).json({ error: "Authentication required." });
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed." });

  const reference = req.query.reference;
  if (!isSubmissionReference(reference)) return res.status(404).json({ error: "Submission not found." });
  const submission = await getSubmissionByReference(reference);
  if (!submission) return res.status(404).json({ error: "Submission not found." });
  if (!submission.bucket || !submission.objectKey) return res.status(404).json({ error: "Submission PDF is not available." });

  try {
    const object = await verifyObjectExists(submission.objectKey, submission.bucket);
    if (!object.exists) return res.status(404).json({ error: "Submission PDF is not available." });
    return res.redirect(307, await generatePresignedDownloadUrl(submission.bucket, submission.objectKey));
  } catch (error) {
    console.error("[submissions] PDF download signing failed", { reference, error });
    return res.status(502).json({ error: "Unable to prepare the submission PDF for download." });
  }
}
