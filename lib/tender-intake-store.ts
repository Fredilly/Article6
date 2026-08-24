import { randomUUID } from "crypto";
import { Pool } from "pg";
import { normalizeOrganizationName } from "./sales-memory";
import { sanitizeOriginalFilename } from "./submissions";

export interface VerifiedTenderIntakeFile {
  key: string;
  submissionReference: string;
  fileName: string;
  fileSize: number;
  contentType: string;
}

export interface ConfirmedTenderIntake {
  intakeReference: string;
  contactName: string;
  workEmail: string;
  organization: string;
  tenderTitle: string;
  buyer?: string;
  referenceNumber?: string;
  submissionDeadline?: string;
  deadlineTimezone?: string;
  note?: string;
  bucket: string;
  files: VerifiedTenderIntakeFile[];
}

export interface TenderIntakeResult {
  organizationId: string;
  contactId: string;
  tenderOpportunityId: string;
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

export async function commitTenderIntake(input: ConfirmedTenderIntake): Promise<TenderIntakeResult> {
  const client = await getPool().connect();
  const now = new Date().toISOString();
  const email = input.workEmail.trim().toLowerCase();
  const normalizedOrganization = normalizeOrganizationName(input.organization);

  try {
    await client.query("BEGIN");

    const existingTender = await client.query(
      "SELECT id, organization_id, contact_id FROM sales_tender_opportunities WHERE source_key = $1 LIMIT 1",
      [input.intakeReference]
    );
    if (existingTender.rows[0]) {
      await client.query("COMMIT");
      return {
        organizationId: String(existingTender.rows[0].organization_id),
        contactId: String(existingTender.rows[0].contact_id),
        tenderOpportunityId: String(existingTender.rows[0].id),
        created: false,
      };
    }

    const existingContact = await client.query(
      "SELECT id, organization_id FROM sales_contacts WHERE LOWER(email) = $1 LIMIT 1",
      [email]
    );

    let organizationId: string;
    let contactId: string;

    if (existingContact.rows[0]) {
      contactId = String(existingContact.rows[0].id);
      organizationId = String(existingContact.rows[0].organization_id);
    } else {
      const existingOrganization = await client.query(
        "SELECT id FROM sales_organizations WHERE normalized_name = $1 LIMIT 1",
        [normalizedOrganization]
      );

      if (existingOrganization.rows[0]) {
        organizationId = String(existingOrganization.rows[0].id);
      } else {
        organizationId = randomUUID();
        await client.query(
          `INSERT INTO sales_organizations
            (id, name, normalized_name, status, notes, do_not_contact, experiment, created_at, updated_at)
           VALUES ($1,$2,$3,'OPPORTUNITY','',false,'TENDER_READINESS',$4,$4)`,
          [organizationId, input.organization.trim(), normalizedOrganization, now]
        );
      }

      contactId = randomUUID();
      await client.query(
        `INSERT INTO sales_contacts
          (id, organization_id, name, email, status, notes, created_at, updated_at)
         VALUES ($1,$2,$3,$4,'ACTIVE','',$5,$5)`,
        [contactId, organizationId, input.contactName.trim(), email, now]
      );
    }

    await client.query(
      `UPDATE sales_organizations
       SET status = CASE WHEN status IN ('NEW','CONTACTED','ENGAGED','NURTURE','PARKED') THEN 'OPPORTUNITY' ELSE status END,
           experiment = CASE WHEN experiment = 'ARTICLE6_CARBON' THEN experiment ELSE 'TENDER_READINESS' END,
           updated_at = $2
       WHERE id = $1`,
      [organizationId, now]
    );

    const tenderOpportunityId = randomUUID();
    await client.query(
      `INSERT INTO sales_tender_opportunities
        (id, organization_id, contact_id, name, buyer, reference_number, submission_deadline, status, notes,
         documents_requested, documents_received, buyer_requirements, sales_status, source_key, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'DOCUMENTS_RECEIVED',$8,0,$9,'','OPPORTUNITY',$10,$11,$11)`,
      [
        tenderOpportunityId,
        organizationId,
        contactId,
        input.tenderTitle.trim(),
        input.buyer?.trim() || null,
        input.referenceNumber?.trim() || null,
        input.submissionDeadline || null,
        input.note?.trim() || "",
        input.files.length,
        input.intakeReference,
        now,
      ]
    );

    for (const file of input.files) {
      const submissionId = randomUUID();
      const productMetadata = {
        intakeReference: input.intakeReference,
        tenderOpportunityId,
        buyer: input.buyer?.trim() || null,
        referenceNumber: input.referenceNumber?.trim() || null,
        submissionDeadline: input.submissionDeadline || null,
        deadlineTimezone: input.deadlineTimezone?.trim() || null,
      };

      await client.query(
        `INSERT INTO submissions
          (id, reference, object_key, bucket, original_filename, file_size, content_type, project, organization,
           contact_name, work_email, submission_source, methodology, notes, status, submission_type, source_site,
           product_metadata, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'website','TENDER',$12,'received','TENDER','bids.article6.org',$13::jsonb,$14,$14)`,
        [
          submissionId,
          file.submissionReference,
          file.key,
          input.bucket,
          sanitizeOriginalFilename(file.fileName),
          file.fileSize,
          file.contentType,
          input.tenderTitle.trim(),
          input.organization.trim(),
          input.contactName.trim(),
          email,
          input.note?.trim() || "",
          JSON.stringify(productMetadata),
          now,
        ]
      );

      await client.query(
        `INSERT INTO sales_tender_documents
          (id, tender_opportunity_id, name, requested, received, received_at, notes, source_key, created_at, updated_at)
         VALUES ($1,$2,$3,false,true,$4,'',$5,$4,$4)`,
        [randomUUID(), tenderOpportunityId, sanitizeOriginalFilename(file.fileName), now, file.submissionReference]
      );
    }

    await client.query(
      `INSERT INTO sales_interactions
        (id, organization_id, contact_id, tender_opportunity_id, channel, direction, interaction_type, occurred_at,
         subject, summary, external_reference, created_at)
       VALUES ($1,$2,$3,$4,'WEBSITE','INBOUND','DOCUMENT_SUBMISSION',$5,$6,$7,$8,$5)`,
      [
        randomUUID(),
        organizationId,
        contactId,
        tenderOpportunityId,
        now,
        `Tender review request: ${input.tenderTitle.trim()}`,
        `Submitted ${input.files.length} document${input.files.length === 1 ? "" : "s"} through bids.article6.org for independent pre-submission review.`,
        `tender-intake:${input.intakeReference}`,
      ]
    );

    await client.query("COMMIT");
    return { organizationId, contactId, tenderOpportunityId, created: true };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
