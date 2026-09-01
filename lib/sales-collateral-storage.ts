import { randomUUID } from "crypto";
import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  csv: "text/csv",
  txt: "text/plain",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
};

function credentials() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error("Missing R2 environment variables.");
  }
  return { accountId, accessKeyId, secretAccessKey, bucketName };
}

function client() {
  const { accountId, accessKeyId, secretAccessKey } = credentials();
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
    credentials: { accessKeyId, secretAccessKey },
  });
}

function extension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() || "";
}

function safeName(fileName: string) {
  return fileName.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(-120) || "document";
}

export function validateCollateralFile(fileName: string, contentType: string, fileSize?: number) {
  const ext = extension(fileName);
  const expected = ALLOWED_TYPES[ext];
  if (!expected) throw new Error("Unsupported collateral file type.");
  if (contentType && contentType !== expected && !(ext === "jpg" && contentType === "image/jpeg")) {
    throw new Error("File content type does not match its extension.");
  }
  if (fileSize != null && (!Number.isFinite(fileSize) || fileSize <= 0 || fileSize > MAX_FILE_SIZE)) {
    throw new Error("Collateral files must be between 1 byte and 25 MB.");
  }
  return { extension: ext, contentType: expected };
}

export function isCollateralStoragePath(value: unknown): value is string {
  return typeof value === "string" && /^sales-collateral\/[0-9a-f-]{36}\/\d{4}-\d{2}-\d{2}\/[0-9a-f-]{36}-[A-Za-z0-9._-]+$/i.test(value);
}

export async function createCollateralUpload(input: { organizationId: string; fileName: string; contentType: string; fileSize?: number }) {
  const validated = validateCollateralFile(input.fileName, input.contentType, input.fileSize);
  const day = new Date().toISOString().slice(0, 10);
  const storagePath = `sales-collateral/${input.organizationId}/${day}/${randomUUID()}-${safeName(input.fileName)}`;
  const command = new PutObjectCommand({
    Bucket: credentials().bucketName,
    Key: storagePath,
    ContentType: validated.contentType,
    ContentLength: input.fileSize,
  });
  const uploadUrl = await getSignedUrl(client(), command, { expiresIn: 600 });
  return { uploadUrl, storagePath, contentType: validated.contentType };
}

export async function verifyCollateralObject(storagePath: string) {
  if (!isCollateralStoragePath(storagePath)) throw new Error("Invalid collateral storage path.");
  const result = await client().send(new HeadObjectCommand({ Bucket: credentials().bucketName, Key: storagePath }));
  return { fileSize: result.ContentLength ?? 0, fileType: result.ContentType || "application/octet-stream" };
}

export async function createCollateralDownloadUrl(storagePath: string, fileName: string, fileType?: string) {
  if (!isCollateralStoragePath(storagePath)) throw new Error("Invalid collateral storage path.");
  const command = new GetObjectCommand({
    Bucket: credentials().bucketName,
    Key: storagePath,
    ResponseContentType: fileType || undefined,
    ResponseContentDisposition: `attachment; filename="${safeName(fileName)}"`,
  });
  return getSignedUrl(client(), command, { expiresIn: 300 });
}

export async function deleteCollateralObject(storagePath: string) {
  if (!isCollateralStoragePath(storagePath)) throw new Error("Invalid collateral storage path.");
  await client().send(new DeleteObjectCommand({ Bucket: credentials().bucketName, Key: storagePath }));
}
