import { randomUUID } from "crypto";
import { Pool, type QueryResultRow } from "pg";
import type { SubmissionSource } from "./submissions";

export type SubmissionStatus = "received" | "in_review" | "completed" | "rejected";

export interface SubmissionRecord {
  id: string; reference: string; objectKey: string; bucket: string; originalFilename: string;
  fileSize: number; contentType: string; project: string; organization: string; contactName: string;
  workEmail?: string; externalContact?: string; submissionSource: SubmissionSource; methodology: string;
  notes: string; status: SubmissionStatus; createdAt: string; updatedAt: string;
}

export interface NewSubmissionRecord {
  reference: string; objectKey: string; bucket: string; originalFilename: string; fileSize: number;
  contentType: string; project: string; organization: string; contactName: string; workEmail?: string;
  externalContact?: string; submissionSource: SubmissionSource; methodology: string; notes: string;
  status?: SubmissionStatus; createdAt: string;
}

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY, reference VARCHAR(32) NOT NULL UNIQUE, object_key TEXT NOT NULL, bucket TEXT NOT NULL,
    original_filename TEXT NOT NULL, file_size BIGINT NOT NULL, content_type VARCHAR(255) NOT NULL,
    project TEXT NOT NULL, organization TEXT NOT NULL, contact_name TEXT NOT NULL, work_email TEXT,
    external_contact TEXT, submission_source VARCHAR(32) NOT NULL, methodology TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '', status VARCHAR(32) NOT NULL DEFAULT 'received',
    created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL
  )
`;

let pool: Pool | undefined;
let tableReady: Promise<void> | undefined;

function getPool(): Pool {
  if (pool) return pool;
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Missing POSTGRES_URL or DATABASE_URL environment variable.");
  pool = new Pool({ connectionString, max: 3, ssl: connectionString.includes("localhost") ? undefined : { rejectUnauthorized: false } });
  return pool;
}

async function ensureTable(): Promise<void> {
  if (!tableReady) {
    tableReady = getPool().query(CREATE_TABLE_SQL).then(() => undefined).catch((error) => { tableReady = undefined; throw error; });
  }
  return tableReady;
}

function toRecord(row: QueryResultRow): SubmissionRecord {
  return {
    id: String(row.id), reference: String(row.reference), objectKey: String(row.object_key), bucket: String(row.bucket),
    originalFilename: String(row.original_filename), fileSize: Number(row.file_size), contentType: String(row.content_type),
    project: String(row.project), organization: String(row.organization), contactName: String(row.contact_name),
    workEmail: row.work_email || undefined, externalContact: row.external_contact || undefined,
    submissionSource: row.submission_source as SubmissionSource, methodology: String(row.methodology), notes: String(row.notes || ""),
    status: row.status as SubmissionStatus, createdAt: new Date(row.created_at).toISOString(), updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export function buildSubmissionRecord(input: NewSubmissionRecord): SubmissionRecord {
  return { id: randomUUID(), reference: input.reference, objectKey: input.objectKey, bucket: input.bucket,
    originalFilename: input.originalFilename, fileSize: input.fileSize, contentType: input.contentType, project: input.project,
    organization: input.organization, contactName: input.contactName, workEmail: input.workEmail, externalContact: input.externalContact,
    submissionSource: input.submissionSource, methodology: input.methodology, notes: input.notes, status: input.status || "received",
    createdAt: input.createdAt, updatedAt: input.createdAt };
}

export async function createSubmission(input: NewSubmissionRecord): Promise<SubmissionRecord> {
  await ensureTable();
  const record = buildSubmissionRecord(input);
  const result = await getPool().query(
    `INSERT INTO submissions
      (id, reference, object_key, bucket, original_filename, file_size, content_type, project, organization,
       contact_name, work_email, external_contact, submission_source, methodology, notes, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $17) RETURNING *`,
    [record.id, record.reference, record.objectKey, record.bucket, record.originalFilename, record.fileSize, record.contentType,
      record.project, record.organization, record.contactName, record.workEmail || null, record.externalContact || null,
      record.submissionSource, record.methodology, record.notes, record.status, record.createdAt]
  );
  return toRecord(result.rows[0]);
}

export async function getSubmissionByReference(reference: string): Promise<SubmissionRecord | null> {
  await ensureTable();
  const result = await getPool().query("SELECT * FROM submissions WHERE reference = $1 LIMIT 1", [reference]);
  return result.rows[0] ? toRecord(result.rows[0]) : null;
}
