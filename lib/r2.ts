import { randomUUID } from "crypto";
import { S3Client, PutObjectCommand, HeadObjectCommand, PutBucketCorsCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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

function getS3Client(): S3Client {
  const { accountId, accessKeyId, secretAccessKey } = getR2Credentials();

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

function generateKey(fileName: string): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const uuid = randomUUID();
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `submissions/${yyyy}/${mm}/${dd}/${uuid}-${safeName}`;
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
          AllowedHeaders: ["Content-Type"],
          ExposeHeaders: ["ETag"],
          MaxAgeSeconds: 3600,
        },
      ],
    },
  });

  await s3.send(command);

  console.info("[r2] CORS configuration applied", { bucket: bucketName });
}

export async function generatePresignedUploadUrl(fileName: string): Promise<{ uploadUrl: string; key: string }> {
  const s3 = getS3Client();
  const { bucketName } = getR2Credentials();
  const key = generateKey(fileName);

  console.info("[r2] Generating presigned PUT URL", { bucket: bucketName, key });

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  const uploadUrl = await getSignedUrl(s3, command, {
    expiresIn: 600,
  });

  console.info("[r2] Presigned URL generated", { key, expiresIn: 600 });

  return { uploadUrl, key };
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
