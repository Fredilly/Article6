import { randomUUID } from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import { hasInternalUploadSession } from "../../../../../lib/internal-auth";
import { generatePresignedDownloadUrl, verifyObjectExists } from "../../../../../lib/r2";
import { runQuickCheck } from "../../../../../lib/quick-check";
import { completeQuickCheck, failQuickCheck, getSubmissionByReference, startQuickCheck } from "../../../../../lib/submission-store";
import { isSubmissionReference } from "../../../../../lib/submissions";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(await hasInternalUploadSession(req))) return res.status(401).json({ error: "Authentication required." });
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });
  const reference = req.query.reference;
  if (!isSubmissionReference(reference)) return res.status(404).json({ error: "Submission not found." });
  const submission = await getSubmissionByReference(reference);
  if (!submission) return res.status(404).json({ error: "Submission not found." });
  if (!submission.bucket || !submission.objectKey) return res.status(404).json({ error: "Submission PDF is not available." });
  try {
    const object = await verifyObjectExists(submission.objectKey, submission.bucket);
    if (!object.exists) return res.status(404).json({ error: "Submission PDF is not available." });
    const quickCheckId = randomUUID();
    const started = await startQuickCheck(reference, quickCheckId, new Date().toISOString());
    if (!started) return res.status(409).json({ error: "A Quick Check is already processing." });
    try {
      const documentUrl = await generatePresignedDownloadUrl(submission.bucket, submission.objectKey);
      const result = await runQuickCheck({
        submissionReference: reference,
        documentUrl,
        filename: submission.originalFilename,
        fileSize: submission.fileSize,
      });
      const completed = await completeQuickCheck(reference, quickCheckId, result, new Date().toISOString());
      return res.status(200).json({ status: completed?.quickCheckStatus || "completed", quickCheckId, result });
    } catch (error) {
      await failQuickCheck(reference, quickCheckId, error instanceof Error ? error.message : String(error), new Date().toISOString());
      throw error;
    }
  } catch (error) {
    console.error("[submissions] Quick Check failed", { reference });
    return res.status(502).json({ error: "Unable to run Quick Check." });
  }
}
