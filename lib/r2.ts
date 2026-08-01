import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { S3Client, PutObjectCommand, HeadObjectCommand, PutBucketCorsCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { buildContentDisposition, generateSubmissionReference, sanitizeOriginalFilename, type SubmissionMetadata } from "./submissions.ts";

const PDF_CONTENT_TYPE = "application/pdf";

function getR2Credentials() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error(
      "Missing R2 environment variables: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME"
    );
  }

  return { accountId, accessKeyId, secretAccessKey, bucketName };
}

function signUploadReference(key: string, expiresAt: number): string {
  const secret = getR2Credentials().secretAccessKey;
  const payload = Buffer.from(JSON.stringify({ key, expiresAt })).toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function resolveUploadReference(reference: unknown): string | null {
  if (typeof reference !== "string") return null;
  const [payload, signature] = reference.split(".");
  if (!payload || !signature) return null;
  const expected = createHmac("sha256", getR2Credentials().secretAccessKey).update(payload).digest("base64url");
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { key?: unknown; expiresAt?: unknown };
    return typeof parsed.key === "string" && typeof parsed.expiresAt === "number" && parsed.expiresAt > Date.now() && /^submissions\/\d{4}-\d{2}-\d{2}\/[0-9a-f-]{36}\.pdf$/.test(parsed.key) ? parsed.key : null;
  } catch {
    return null;
  }
}

function getS3Client(): S3Client {
  const { accountId, accessKeyId, secretAccessKey } = getR2Credentials();

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

function generateKey(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const uuid = randomUUID();
  return `submissions/${yyyy}-${mm}-${dd}/${uuid}.pdf`;
}

export async function configureBucketCors(): Promise<void> {
  const s3 = getS3Client();
  const { bucketName } = getR2Credentials();

  console.info("[r2] Configuring CORS for bucket", { bucket: bucketName });

  const command = new PutBucketCorsCommand({
    Bucket: bucketName,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedOrigins: ["*"],
          AllowedMethods: ["PUT"],
          AllowedHeaders: ["Content-Type", "Content-Disposition", "x-amz-meta-*"],
          ExposeHeaders: ["ETag"],
          MaxAgeSeconds: 3600,
        },
      ],
    },
  });

  await s3.send(command);

  console.info("[r2] CORS configuration applied", { bucket: bucketName });
}

export async function generatePresignedUploadUrl(metadata: SubmissionMetadata = {
  contactName: "",
  organization: "",
  projectName: "",
  methodology: "",
  submissionSource: "internal",
  fileName: "document.pdf",
  fileSize: 1,
}): Promise<{ uploadUrl: string; uploadReference: string; submissionReference: string; uploadHeaders: Record<string, string> }> {
  const s3 = getS3Client();
  const { bucketName } = getR2Credentials();
  const key = generateKey();
  const submissionReference = generateSubmissionReference();
  const expiresAt = Date.now() + 10 * 60 * 1000;
  const submissionTimestamp = new Date().toISOString();
  const metadataValue = (value: string): string => value.replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, 512);
  const originalFilename = sanitizeOriginalFilename(metadata.fileName);
  const uploadHeaders = {
    "Content-Type": PDF_CONTENT_TYPE,
    "Content-Disposition": buildContentDisposition(metadata.fileName),
    "x-amz-meta-original-filename": originalFilename,
    "x-amz-meta-project-name": metadataValue(metadata.projectName),
    "x-amz-meta-organization": metadataValue(metadata.organization),
    "x-amz-meta-contact-name": metadataValue(metadata.contactName),
    ...(metadata.workEmail ? { "x-amz-meta-work-email": metadataValue(metadata.workEmail) } : {}),
    ...(metadata.externalContact ? { "x-amz-meta-external-contact": metadataValue(metadata.externalContact) } : {}),
    "x-amz-meta-submission-source": metadata.submissionSource,
    "x-amz-meta-methodology": metadataValue(metadata.methodology),
    "x-amz-meta-file-size": String(metadata.fileSize),
    "x-amz-meta-submission-timestamp": submissionTimestamp,
    "x-amz-meta-submission-reference": submissionReference,
  };

  console.info("[r2] Generating presigned PUT URL", { bucket: bucketName, key });

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: PDF_CONTENT_TYPE,
    ContentDisposition: uploadHeaders["Content-Disposition"],
    Metadata: {
      "original-filename": originalFilename,
      "project-name": metadataValue(metadata.projectName),
      organization: metadataValue(metadata.organization),
      "contact-name": metadataValue(metadata.contactName),
      ...(metadata.workEmail ? { "work-email": metadataValue(metadata.workEmail) } : {}),
      ...(metadata.externalContact ? { "external-contact": metadataValue(metadata.externalContact) } : {}),
      "submission-source": metadata.submissionSource,
      methodology: metadataValue(metadata.methodology),
      "file-size": String(metadata.fileSize),
      "submission-timestamp": submissionTimestamp,
      "submission-reference": submissionReference,
    },
  });

  const uploadUrl = await getSignedUrl(s3, command, {
    expiresIn: 600,
  });

  console.info("[r2] Presigned URL generated", { key, expiresIn: 600 });

  return { uploadUrl, uploadReference: signUploadReference(key, expiresAt), submissionReference, uploadHeaders };
}

export interface ObjectVerificationResult {
  exists: boolean;
  size: number;
  contentType: string | undefined;
  lastModified: Date | undefined;
}

export async function verifyObjectExists(key: string): Promise<ObjectVerificationResult> {
  const s3 = getS3Client();
  const { bucketName } = getR2Credentials();

  console.info("[r2] Verifying object existence", { bucket: bucketName, key });

  try {
    const command = new HeadObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const response = await s3.send(command);

    console.info("[r2] Object verified", {
      exists: true,
      size: response.ContentLength,
      contentType: response.ContentType,
      lastModified: response.LastModified,
    });

    return {
      exists: true,
      size: response.ContentLength ?? 0,
      contentType: response.ContentType,
      lastModified: response.LastModified,
    };
  } catch (err: unknown) {
    const code = (err as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode;

    console.error("[r2] Object verification failed", {
      key,
      httpStatusCode: code,
      errorMessage: err instanceof Error ? err.message : String(err),
    });

    if (code === 404 || code === 403) {
      return { exists: false, size: 0, contentType: undefined, lastModified: undefined };
    }
    throw err;
  }
}

export function getBucketName(): string {
  return getR2Credentials().bucketName;
}
