import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { isApprovedSubmissionKey, isSubmissionReference } from "./submissions.ts";
import { generateSubmissionReference } from "./submission-reference.ts";

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

export interface ResolvedUploadReference {
  key: string;
  submissionReference: string;
}

function signUploadReference(key: string, submissionReference: string, expiresAt: number): string {
  const secret = getR2Credentials().secretAccessKey;
  const payload = Buffer.from(JSON.stringify({ key, submissionReference, expiresAt })).toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function resolveUploadReference(reference: unknown): ResolvedUploadReference | null {
  if (typeof reference !== "string") return null;
  const parts = reference.split(".");
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  if (!payload || !signature) return null;
  const expected = createHmac("sha256", getR2Credentials().secretAccessKey).update(payload).digest("base64url");
  if (!/^[A-Za-z0-9_-]+$/.test(signature) || signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { key?: unknown; submissionReference?: unknown; expiresAt?: unknown };
    if (!isApprovedSubmissionKey(parsed.key) || !isSubmissionReference(parsed.submissionReference) || typeof parsed.expiresAt !== "number" || parsed.expiresAt <= Date.now()) return null;
    return { key: parsed.key, submissionReference: parsed.submissionReference };
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

export async function generatePresignedUploadUrl(): Promise<{ uploadUrl: string; uploadReference: string; submissionReference: string }> {
  const s3 = getS3Client();
  const { bucketName } = getR2Credentials();
  const key = generateKey();
  const submissionReference = generateSubmissionReference();
  const expiresAt = Date.now() + 10 * 60 * 1000;

  console.info("[r2] Generating presigned PUT URL", { bucket: bucketName, key });

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: PDF_CONTENT_TYPE,
  });

  const uploadUrl = await getSignedUrl(s3, command, {
    expiresIn: 600,
  });

  console.info("[r2] Presigned URL generated", { key, expiresIn: 600 });

  return { uploadUrl, uploadReference: signUploadReference(key, submissionReference, expiresAt), submissionReference };
}

export async function generatePresignedDownloadUrl(bucket: string, key: string): Promise<string> {
  if (!bucket || !isApprovedSubmissionKey(key)) {
    throw new Error("Invalid stored submission object.");
  }

  const s3 = getS3Client();
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    ResponseContentType: PDF_CONTENT_TYPE,
    ResponseContentDisposition: "attachment",
  });

  return getSignedUrl(s3, command, { expiresIn: 300 });
}

export interface ObjectVerificationResult {
  exists: boolean;
  size: number;
  contentType: string | undefined;
  lastModified: Date | undefined;
}

export async function verifyObjectExists(key: string, bucket?: string): Promise<ObjectVerificationResult> {
  const s3 = getS3Client();
  const bucketName = bucket || getR2Credentials().bucketName;

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

export async function getPrivateObject(key: string, bucket?: string): Promise<Buffer> {
  if (!bucket || !isApprovedSubmissionKey(key)) throw new Error("Invalid stored submission object.");
  const response = await getS3Client().send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!response.Body) throw new Error("Stored submission object has no body.");
  return Buffer.from(await response.Body.transformToByteArray());
}

export function getBucketName(): string {
  return getR2Credentials().bucketName;
}
