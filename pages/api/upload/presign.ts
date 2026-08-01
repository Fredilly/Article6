import type { NextApiRequest, NextApiResponse } from "next";
import { configureBucketCors, generatePresignedUploadUrl } from "../../../lib/r2";
import { hasInternalUploadSession } from "../../../lib/internal-auth";
import { PDF_CONTENT_TYPE, validateSubmissionMetadata, type SubmissionSource } from "../../../lib/submissions";

interface PresignRequestBody {
  fileName: string;
  contentType: string;
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

export function validatePresignRequest(body: Partial<PresignRequestBody>): string | null {
  if (body.contentType !== PDF_CONTENT_TYPE) return "Only PDF files are accepted.";
  const error = validateSubmissionMetadata(body);
  return error;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body as Partial<PresignRequestBody>;
  const validationError = validatePresignRequest(body);
  if (validationError) return res.status(400).json({ error: validationError });

  if (body.submissionSource !== "website" && !(await hasInternalUploadSession(req))) {
    return res.status(401).json({ error: "Internal upload authentication required." });
  }

  try {
    try {
      await configureBucketCors();
    } catch (corsErr) {
      console.warn("[presign] CORS configuration skipped:", corsErr instanceof Error ? corsErr.message : String(corsErr));
    }

    const { uploadUrl, uploadReference } = await generatePresignedUploadUrl();
    return res.status(200).json({ uploadUrl, uploadReference, expiresIn: 600 });
  } catch (err) {
    console.error("[presign] Error generating upload URL:", err instanceof Error ? err.message : String(err));
    return res.status(500).json({ error: "Failed to generate upload URL. Please try again later." });
  }
}
