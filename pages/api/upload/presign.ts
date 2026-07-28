import type { NextApiRequest, NextApiResponse } from "next";
import { configureBucketCors, generatePresignedUploadUrl } from "../../../lib/r2";

const ALLOWED_CONTENT_TYPE = "application/pdf";
const MAX_FILE_SIZE_MB = 50;

interface PresignRequestBody {
  fileName: string;
  contentType: string;
  fileSize: number;
  fullName: string;
  workEmail: string;
  organization: string;
  projectName: string;
  methodology: string;
  note?: string;
}

function validate(body: PresignRequestBody): string | null {
  if (!body.fileName || typeof body.fileName !== "string") {
    return "File name is required.";
  }
  if (body.fileName.length > 500) {
    return "File name is too long.";
  }
  if (body.contentType !== ALLOWED_CONTENT_TYPE) {
    return "Only PDF files are accepted.";
  }
  if (typeof body.fileSize !== "number" || body.fileSize <= 0) {
    return "Invalid file size.";
  }
  if (body.fileSize > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return `File size must be under ${MAX_FILE_SIZE_MB}MB.`;
  }
  if (!body.fullName || typeof body.fullName !== "string" || body.fullName.length > 200) {
    return "Full name is required (max 200 characters).";
  }
  if (!body.workEmail || typeof body.workEmail !== "string" || body.workEmail.length > 320) {
    return "A valid work email is required.";
  }
  if (!body.organization || typeof body.organization !== "string" || body.organization.length > 200) {
    return "Organization is required (max 200 characters).";
  }
  if (!body.projectName || typeof body.projectName !== "string" || body.projectName.length > 300) {
    return "Project name is required (max 300 characters).";
  }
  if (!body.methodology || typeof body.methodology !== "string" || body.methodology.length > 200) {
    return "Methodology is required (max 200 characters).";
  }
  if (body.note && body.note.length > 2000) {
    return "Note must be under 2000 characters.";
  }
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body as PresignRequestBody;

  const validationError = validate(body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    await configureBucketCors();

    console.info("[presign] Generating presigned URL", {
      fileName: body.fileName,
      fileSize: body.fileSize,
      contentType: body.contentType,
      bucket: process.env.R2_BUCKET_NAME || "not set",
    });

    const { uploadUrl, key } = await generatePresignedUploadUrl(body.fileName);

    console.info("[presign] Successfully generated presigned URL", {
      key: key.slice(0, 40) + "...",
      urlHost: new URL(uploadUrl).hostname,
      urlPath: new URL(uploadUrl).pathname.slice(0, 60) + "...",
      urlProtocol: new URL(uploadUrl).protocol,
      hasBucketInPath: new URL(uploadUrl).pathname.includes(process.env.R2_BUCKET_NAME || ""),
      signedHeadersParam: new URLSearchParams(new URL(uploadUrl).search).get("X-Amz-SignedHeaders") || "none",
    });

    return res.status(200).json({
      uploadUrl,
      key,
      expiresIn: 600,
    });
  } catch (err) {
    console.error("[presign] Error generating presigned URL:", {
      error: err instanceof Error ? err.message : String(err),
      fileName: body.fileName,
      r2AccountId: process.env.R2_ACCOUNT_ID ? "set" : "MISSING",
      r2AccessKey: process.env.R2_ACCESS_KEY_ID ? "set" : "MISSING",
      r2Secret: process.env.R2_SECRET_ACCESS_KEY ? "set" : "MISSING",
      r2Bucket: process.env.R2_BUCKET_NAME ? "set" : "MISSING",
    });
    return res.status(500).json({
      error: "Failed to generate upload URL. Please try again later.",
    });
  }
}
