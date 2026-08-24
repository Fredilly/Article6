import { randomUUID } from "crypto";
import { Pool } from "pg";
import { sanitizeOriginalFilename } from "./submissions";

export interface VerifiedCarbonIntakeFile {
  key: string;
  submissionReference: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  role: "PDD" | "SUPPORTING";
}

export interface ConfirmedCarbonIntake {
  packageReference: string;
  contactName: string;
  workEmail: string;
  organization: string;
  projectName: string;
  methodology: string;
  note?: string;
  bucket: string;
  files: VerifiedCarbonIntakeFile[];
}

export interface CarbonIntakeResult {
  packageReference: string;
  pddSubmissionReference: string;
  created: boolean;
}

let pool: Pool | undefined;

function getPool(): Pool {
  if (pool) return pool;
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Missing POSTGRES_URL or DATABASE_URL environment variable.");
  pool = new Pool({
    connectionString,
    max: 3,
    ...(process.env.NODE_ENV === "production"
      ? { ssl: { rejectUnauthorized: true } }
      : connectionString.includes("localhost")
        ? { ssl: false }
        : {}),
  });
  return pool;
}

export async function commitCarbonIntake(input: ConfirmedCarbonIntake): Promise<CarbonIntakeResult> {
  const client = await getPool().connect();
  const now = new Date().toISOString();
  const email = input.workEmail.trim().toLowerCase();
  const pdd = input.files.find((file) => file.role === "PDD");
  if (!pdd) throw new Error("Carbon package is missing its PDD.");

  try {
    await client.query("BEGIN");

    const existing = await client.query(
      `SELECT reference FROM submissions
       WHERE submission_type = 'CARBON'
         AND source_site = 'carbon.article6.org'
         AND product_metadata->>'packageReference' = $1
         AND product_metadata->>'documentRole' = 'PDD'
       LIMIT 1`,
      [input.packageReference]
    );
    if (existing.rows[0]) {
      await client.query("COMMIT");
      return { packageReference: input.packageReference, pddSubmissionReference: String(existing.rows[0].reference), created: false };
    }

    for (const file of input.files) {
      const productMetadata = {
        packageReference: input.packageReference,
        documentRole: file.role,
        packageFileCount: input.files.length,
      };
      await client.query(
        `INSERT INTO submissions
          (id, reference, object_key, bucket, original_filename, file_size, content_type, project, organization,
           contact_name, work_email, submission_source, methodology, notes, status, submission_type, source_site,
           product_metadata, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'website',$12,$13,'received','CARBON','carbon.article6.org',$14::jsonb,$15,$15)`,
        [
          randomUUID(),
          file.submissionReference,
          file.key,
          input.bucket,
          sanitizeOriginalFilename(file.fileName),
          file.fileSize,
          file.contentType,
          input.projectName.trim(),
          input.organization.trim(),
          input.contactName.trim(),
          email,
          input.methodology.trim(),
          input.note?.trim() || "",
          JSON.stringify(productMetadata),
          now,
        ]
      );
    }

    await client.query("COMMIT");
    return { packageReference: input.packageReference, pddSubmissionReference: pdd.submissionReference, created: true };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
