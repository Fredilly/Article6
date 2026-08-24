import { randomUUID } from "crypto";
import { Pool, type QueryResultRow } from "pg";
import type { SubmissionSource, SubmissionSourceSite, SubmissionType } from "./submissions";

export type SubmissionStatus = "received" | "in_review" | "completed" | "rejected";
export type QuickCheckStatus = "received" | "processing" | "completed" | "failed";

export interface SubmissionRecord {
  id: string; reference: string; objectKey: string; bucket: string; originalFilename: string;
  fileSize: number; contentType: string; project: string; organization: string; contactName: string;
  workEmail?: string; externalContact?: string; submissionSource: SubmissionSource; methodology: string;
  submissionType: SubmissionType; sourceSite: SubmissionSourceSite; productMetadata: Record<string, unknown>;
  notes: string; status: SubmissionStatus; createdAt: string; updatedAt: string;
  quickCheckStatus: QuickCheckStatus; quickCheckId?: string; quickCheckResult?: unknown;
  quickCheckStartedAt?: string; quickCheckCompletedAt?: string; quickCheckFailedAt?: string; quickCheckError?: string;
}

export interface NewSubmissionRecord {
  reference: string; objectKey: string; bucket: string; originalFilename: string; fileSize: number;
  contentType: string; project: string; organization: string; contactName: string; workEmail?: string;
  externalContact?: string; submissionSource: SubmissionSource; methodology: string; notes: string;
  submissionType?: SubmissionType; sourceSite?: SubmissionSourceSite; productMetadata?: Record<string, unknown>;
  status?: SubmissionStatus; createdAt: string;
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

function toRecord(row: QueryResultRow): SubmissionRecord {
  return {
    id: String(row.id), reference: String(row.reference), objectKey: String(row.object_key), bucket: String(row.bucket),
    originalFilename: String(row.original_filename), fileSize: Number(row.file_size), contentType: String(row.content_type),
    project: String(row.project), organization: String(row.organization), contactName: String(row.contact_name),
    workEmail: row.work_email || undefined, externalContact: row.external_contact || undefined,
    submissionSource: row.submission_source as SubmissionSource, methodology: String(row.methodology),
    submissionType: (row.submission_type || "CARBON") as SubmissionType,
    sourceSite: (row.source_site || "article6.org") as SubmissionSourceSite,
    productMetadata: (row.product_metadata && typeof row.product_metadata === "object" ? row.product_metadata : {}) as Record<string, unknown>,
    notes: String(row.notes || ""), status: row.status as SubmissionStatus,
    createdAt: new Date(row.created_at).toISOString(), updatedAt: new Date(row.updated_at).toISOString(),
    quickCheckStatus: (row.quick_check_status || "received") as QuickCheckStatus,
    quickCheckId: row.quick_check_id ? String(row.quick_check_id) : undefined,
    quickCheckResult: row.quick_check_result || undefined,
    quickCheckStartedAt: row.quick_check_started_at ? new Date(row.quick_check_started_at).toISOString() : undefined,
    quickCheckCompletedAt: row.quick_check_completed_at ? new Date(row.quick_check_completed_at).toISOString() : undefined,
    quickCheckFailedAt: row.quick_check_failed_at ? new Date(row.quick_check_failed_at).toISOString() : undefined,
    quickCheckError: row.quick_check_error || undefined,
  };
}

export function buildSubmissionRecord(input: NewSubmissionRecord): SubmissionRecord {
  return { id: randomUUID(), reference: input.reference, objectKey: input.objectKey, bucket: input.bucket,
    originalFilename: input.originalFilename, fileSize: input.fileSize, contentType: input.contentType, project: input.project,
    organization: input.organization, contactName: input.contactName, workEmail: input.workEmail, externalContact: input.externalContact,
    submissionSource: input.submissionSource, methodology: input.methodology,
    submissionType: input.submissionType || "CARBON", sourceSite: input.sourceSite || "article6.org",
    productMetadata: input.productMetadata || {}, notes: input.notes, status: input.status || "received",
    createdAt: input.createdAt, updatedAt: input.createdAt, quickCheckStatus: "received" };
}

export async function createSubmission(input: NewSubmissionRecord): Promise<SubmissionRecord> {
  const record = buildSubmissionRecord(input);
  const result = await getPool().query(
    `INSERT INTO submissions
      (id, reference, object_key, bucket, original_filename, file_size, content_type, project, organization,
       contact_name, work_email, external_contact, submission_source, methodology, submission_type, source_site,
       product_metadata, notes, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17::jsonb, $18, $19, $20, $20) RETURNING *`,
    [record.id, record.reference, record.objectKey, record.bucket, record.originalFilename, record.fileSize, record.contentType,
      record.project, record.organization, record.contactName, record.workEmail || null, record.externalContact || null,
      record.submissionSource, record.methodology, record.submissionType, record.sourceSite, JSON.stringify(record.productMetadata),
      record.notes, record.status, record.createdAt]
  );
  return toRecord(result.rows[0]);
}

export async function createSubmissionIfAbsent(input: NewSubmissionRecord): Promise<{ submission: SubmissionRecord; created: boolean }> {
  const record = buildSubmissionRecord(input);
  const result = await getPool().query(
    `INSERT INTO submissions
      (id, reference, object_key, bucket, original_filename, file_size, content_type, project, organization,
       contact_name, work_email, external_contact, submission_source, methodology, submission_type, source_site,
       product_metadata, notes, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17::jsonb, $18, $19, $20, $20)
     ON CONFLICT (reference) DO NOTHING RETURNING *`,
    [record.id, record.reference, record.objectKey, record.bucket, record.originalFilename, record.fileSize, record.contentType,
      record.project, record.organization, record.contactName, record.workEmail || null, record.externalContact || null,
      record.submissionSource, record.methodology, record.submissionType, record.sourceSite, JSON.stringify(record.productMetadata),
      record.notes, record.status, record.createdAt]
  );
  if (result.rows[0]) return { submission: toRecord(result.rows[0]), created: true };
  const existing = await getSubmissionByReference(record.reference);
  if (!existing) throw new Error(`Submission ${record.reference} could not be created or read after a conflict.`);
  return { submission: existing, created: false };
}

export async function getSubmissionByReference(reference: string): Promise<SubmissionRecord | null> {
  const result = await getPool().query("SELECT * FROM submissions WHERE reference = $1 LIMIT 1", [reference]);
  return result.rows[0] ? toRecord(result.rows[0]) : null;
}

export async function getSubmissions(): Promise<SubmissionRecord[]> {
  const result = await getPool().query("SELECT * FROM submissions ORDER BY created_at DESC");
  return result.rows.map(toRecord);
}

export async function startQuickCheck(reference: string, quickCheckId: string, startedAt: string): Promise<SubmissionRecord | null> {
  const result = await getPool().query(
    `UPDATE submissions SET quick_check_status = 'processing', quick_check_id = $2, quick_check_result = NULL,
       quick_check_started_at = $3, quick_check_completed_at = NULL, quick_check_failed_at = NULL,
       quick_check_error = NULL, updated_at = $3
     WHERE reference = $1 AND quick_check_status <> 'processing' RETURNING *`,
    [reference, quickCheckId, startedAt]
  );
  return result.rows[0] ? toRecord(result.rows[0]) : null;
}

export async function completeQuickCheck(reference: string, quickCheckId: string, resultData: unknown, completedAt: string): Promise<SubmissionRecord | null> {
  const result = await getPool().query(
    `UPDATE submissions SET quick_check_status = 'completed', quick_check_result = $3,
       quick_check_completed_at = $4, quick_check_error = NULL, updated_at = $4
     WHERE reference = $1 AND quick_check_id = $2 RETURNING *`,
    [reference, quickCheckId, JSON.stringify(resultData), completedAt]
  );
  return result.rows[0] ? toRecord(result.rows[0]) : null;
}

export async function failQuickCheck(reference: string, quickCheckId: string, errorMessage: string, failedAt: string): Promise<SubmissionRecord | null> {
  const result = await getPool().query(
    `UPDATE submissions SET quick_check_status = 'failed', quick_check_error = $3,
       quick_check_failed_at = $4, updated_at = $4
     WHERE reference = $1 AND quick_check_id = $2 RETURNING *`,
    [reference, quickCheckId, errorMessage.slice(0, 1000), failedAt]
  );
  return result.rows[0] ? toRecord(result.rows[0]) : null;
}
