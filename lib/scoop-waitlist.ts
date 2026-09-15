import { randomUUID } from 'crypto';
import { Pool } from 'pg';
import { normalizeOrganizationName } from './sales-memory';

export const SCOOP_WAITLIST_PERSONAS = ['CREATOR', 'SHOPPER', 'BRAND_RETAILER', 'OTHER'] as const;
export type ScoopWaitlistPersona = (typeof SCOOP_WAITLIST_PERSONAS)[number];

export interface ScoopWaitlistInput {
  name: string;
  email: string;
  persona: ScoopWaitlistPersona;
  handle?: string;
  organization?: string;
  source?: string;
  sourcePage?: string;
  campaign?: string;
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

function cleanHandle(value?: string): string {
  const handle = (value || '').trim();
  return handle ? (handle.startsWith('@') ? handle : `@${handle}`) : '';
}

function personaLabel(persona: ScoopWaitlistPersona): string {
  if (persona === 'CREATOR') return 'Creator / Influencer';
  if (persona === 'SHOPPER') return 'Shopper';
  if (persona === 'BRAND_RETAILER') return 'Brand / Retailer';
  return 'Other';
}

function organizationName(input: ScoopWaitlistInput): string {
  const organization = (input.organization || '').trim();
  if (organization) return organization;

  const handle = cleanHandle(input.handle);
  if (input.persona === 'CREATOR' && handle) return `Creator ${handle}`;
  return `${input.name.trim()} — Scoop waitlist`;
}

function notesFor(input: ScoopWaitlistInput): string {
  const lines = [
    'Inbound Scoop waitlist lead.',
    `Persona: ${personaLabel(input.persona)}`,
    `Source: ${input.source || 'scoop_site'}`,
    `Source page: ${input.sourcePage || 'homepage'}`,
    `Campaign: ${input.campaign || 'alpha_waitlist'}`,
  ];
  const handle = cleanHandle(input.handle);
  if (handle) lines.push(`Handle: ${handle}`);
  if (input.organization?.trim()) lines.push(`Organization: ${input.organization.trim()}`);
  return lines.join('\n');
}

function profileCustomerType(persona: ScoopWaitlistPersona): 'CREATOR' | 'ECOMMERCE_BRAND' | undefined {
  if (persona === 'CREATOR') return 'CREATOR';
  if (persona === 'BRAND_RETAILER') return 'ECOMMERCE_BRAND';
  return undefined;
}

export async function storeScoopWaitlist(input: ScoopWaitlistInput): Promise<{
  organizationId: string;
  contactId: string;
  interactionId: string;
  created: boolean;
}> {
  const client = await getPool().connect();
  const now = new Date().toISOString();
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  const sourceUrl = 'https://scoop.article6.org/';
  const notes = notesFor(input);

  try {
    await client.query('BEGIN');

    const existing = await client.query(
      `SELECT c.id AS contact_id, c.organization_id
       FROM sales_contacts c
       JOIN sales_organizations o ON o.id = c.organization_id
       WHERE LOWER(c.email) = $1
         AND o.experiment = 'VISUAL_COMMERCE'
       ORDER BY c.updated_at DESC
       LIMIT 1`,
      [email],
    );

    let organizationId: string;
    let contactId: string;
    let created = false;

    if (existing.rows[0]) {
      organizationId = String(existing.rows[0].organization_id);
      contactId = String(existing.rows[0].contact_id);

      await client.query(
        `UPDATE sales_contacts
         SET name = $2,
             title = $3,
             email_type = 'DIRECT',
             contact_source_url = $4,
             notes = $5,
             updated_at = $6
         WHERE id = $1`,
        [contactId, name, personaLabel(input.persona), sourceUrl, notes, now],
      );
    } else {
      const orgName = organizationName(input);
      const normalizedName = normalizeOrganizationName(orgName);
      const existingOrg = await client.query(
        `SELECT id
         FROM sales_organizations
         WHERE experiment = 'VISUAL_COMMERCE'
           AND normalized_name = $1
         LIMIT 1`,
        [normalizedName],
      );

      if (existingOrg.rows[0]) {
        organizationId = String(existingOrg.rows[0].id);
      } else {
        organizationId = randomUUID();
        await client.query(
          `INSERT INTO sales_organizations
            (id, name, normalized_name, experiment, status, notes, do_not_contact, created_at, updated_at)
           VALUES ($1, $2, $3, 'VISUAL_COMMERCE', 'ENGAGED', $4, FALSE, $5, $5)`,
          [organizationId, orgName, normalizedName, notes, now],
        );
      }

      contactId = randomUUID();
      await client.query(
        `INSERT INTO sales_contacts
          (id, organization_id, name, title, email, email_type, status, notes, contact_source_url, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'DIRECT', 'ACTIVE', $6, $7, $8, $8)`,
        [contactId, organizationId, name, personaLabel(input.persona), email, notes, sourceUrl, now],
      );
      created = true;
    }

    await client.query(
      `UPDATE sales_organizations
       SET status = CASE
         WHEN status IN ('NEW', 'CONTACTED', 'NURTURE') THEN 'ENGAGED'
         ELSE status
       END,
       updated_at = $2
       WHERE id = $1`,
      [organizationId, now],
    );

    const customerType = profileCustomerType(input.persona);
    if (customerType) {
      await client.query(
        `INSERT INTO sales_visual_commerce_profiles
          (organization_id, customer_type, visual_product_fit, priority, vcl_use_case, qualification_notes, source_url, created_at, updated_at)
         VALUES ($1, $2, 'MEDIUM', 'B', $3, $4, $5, $6, $6)
         ON CONFLICT (organization_id) DO UPDATE SET
           customer_type = EXCLUDED.customer_type,
           vcl_use_case = EXCLUDED.vcl_use_case,
           qualification_notes = EXCLUDED.qualification_notes,
           source_url = EXCLUDED.source_url,
           updated_at = EXCLUDED.updated_at`,
        [
          organizationId,
          customerType,
          input.persona === 'CREATOR' ? 'Creator / influencer alpha tester' : 'Brand / retailer visual commerce lead',
          'Inbound Scoop waitlist signup. Self-identified; not yet qualified.',
          sourceUrl,
          now,
        ],
      );
    }

    const interactionId = randomUUID();
    const summary = [
      `Scoop waitlist signup`,
      `Persona: ${personaLabel(input.persona)}`,
      `Name: ${name}`,
      `Email: ${email}`,
      input.handle?.trim() ? `Handle: ${cleanHandle(input.handle)}` : null,
      input.organization?.trim() ? `Organization: ${input.organization.trim()}` : null,
      `Source: ${input.source || 'scoop_site'}`,
      `Source page: ${input.sourcePage || 'homepage'}`,
      `Campaign: ${input.campaign || 'alpha_waitlist'}`,
    ].filter(Boolean).join('\n');

    await client.query(
      `INSERT INTO sales_interactions
        (id, organization_id, contact_id, channel, direction, interaction_type, occurred_at, subject, summary, created_at, is_imported)
       VALUES ($1, $2, $3, 'WEBSITE', 'INBOUND', 'CONTACT_FORM', $4, $5, $6, $4, FALSE)`,
      [interactionId, organizationId, contactId, now, `Scoop waitlist — ${personaLabel(input.persona)}`, summary],
    );

    await client.query('COMMIT');
    return { organizationId, contactId, interactionId, created };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
