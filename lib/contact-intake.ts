import { randomUUID } from 'crypto';
import { Pool } from 'pg';
import { normalizeOrganizationName } from './sales-memory';

export interface ContactEnquiryInput {
  name: string;
  email: string;
  organisation: string;
  work: string;
  message: string;
}

let pool: Pool | undefined;

function getPool(): Pool {
  if (pool) return pool;
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connectionString) throw new Error('Missing POSTGRES_URL or DATABASE_URL environment variable.');

  pool = new Pool({
    connectionString,
    max: 3,
    ...(process.env.NODE_ENV === 'production'
      ? { ssl: { rejectUnauthorized: true } }
      : connectionString.includes('localhost')
        ? { ssl: false }
        : {}),
  });
  return pool;
}

function domainFromEmail(email: string): string | null {
  const domain = email.split('@')[1]?.trim().toLowerCase();
  if (!domain) return null;
  const personalDomains = new Set(['gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'live.com', 'icloud.com', 'yahoo.com', 'proton.me', 'protonmail.com']);
  return personalDomains.has(domain) ? null : domain;
}

export async function storeContactEnquiry(input: ContactEnquiryInput): Promise<{ organizationId: string; contactId: string; interactionId: string }> {
  const client = await getPool().connect();
  const now = new Date().toISOString();
  const email = input.email.trim().toLowerCase();
  const organisation = input.organisation.trim();
  const normalizedOrganisation = normalizeOrganizationName(organisation);

  try {
    await client.query('BEGIN');

    const existingContact = await client.query(
      `SELECT c.id AS contact_id, c.organization_id
       FROM sales_contacts c
       WHERE LOWER(c.email) = $1
       LIMIT 1`,
      [email],
    );

    let organizationId: string;
    let contactId: string;

    if (existingContact.rows[0]) {
      organizationId = String(existingContact.rows[0].organization_id);
      contactId = String(existingContact.rows[0].contact_id);

      await client.query(
        `UPDATE sales_contacts
         SET name = $2, updated_at = $3
         WHERE id = $1`,
        [contactId, input.name.trim(), now],
      );
    } else {
      const emailDomain = domainFromEmail(email);
      const existingOrganisation = await client.query(
        `SELECT id
         FROM sales_organizations
         WHERE normalized_name = $1
            OR ($2::text IS NOT NULL AND domain = $2)
         LIMIT 1`,
        [normalizedOrganisation, emailDomain],
      );

      if (existingOrganisation.rows[0]) {
        organizationId = String(existingOrganisation.rows[0].id);
      } else {
        organizationId = randomUUID();
        await client.query(
          `INSERT INTO sales_organizations
            (id, name, normalized_name, domain, experiment, status, notes, do_not_contact, created_at, updated_at)
           VALUES ($1, $2, $3, $4, 'OTHER', 'ENGAGED', $5, FALSE, $6, $6)`,
          [
            organizationId,
            organisation,
            normalizedOrganisation,
            emailDomain,
            'Inbound lead from article6.org contact form.',
            now,
          ],
        );
      }

      contactId = randomUUID();
      await client.query(
        `INSERT INTO sales_contacts
          (id, organization_id, name, email, status, notes, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'ACTIVE', $5, $6, $6)`,
        [contactId, organizationId, input.name.trim(), email, 'Inbound lead from article6.org contact form.', now],
      );
    }

    await client.query(
      `UPDATE sales_organizations
       SET status = CASE
         WHEN status IN ('NEW', 'CONTACTED', 'NURTURE') THEN 'ENGAGED'
         ELSE status
       END,
       experiment = CASE WHEN experiment = 'ARTICLE6_CARBON' AND $2 = FALSE THEN 'OTHER' ELSE experiment END,
       updated_at = $3
       WHERE id = $1`,
      [organizationId, Boolean(existingContact.rows[0]), now],
    );

    const interactionId = randomUUID();
    const summary = [
      `Website enquiry: ${input.work.trim()}`,
      '',
      input.message.trim(),
      '',
      `Submitted by ${input.name.trim()} <${email}>`,
      `Organisation: ${organisation}`,
      'Source: article6.org contact form',
    ].join('\n');

    await client.query(
      `INSERT INTO sales_interactions
        (id, organization_id, contact_id, channel, direction, interaction_type, occurred_at, subject, summary, created_at, is_imported)
       VALUES ($1, $2, $3, 'WEBSITE', 'INBOUND', 'CONTACT_FORM', $4, $5, $6, $4, FALSE)`,
      [interactionId, organizationId, contactId, now, `Article6 website enquiry — ${input.work.trim().slice(0, 120)}`, summary],
    );

    await client.query('COMMIT');
    return { organizationId, contactId, interactionId };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
