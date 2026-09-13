import { Pool, type QueryResultRow } from "pg";

export const VISUAL_COMMERCE_CUSTOMER_TYPES = ["ECOMMERCE_BRAND","CREATOR","PUBLISHER","VIDEO_PLATFORM","RETAILER","CREATOR_NETWORK"] as const;
export const VISUAL_COMMERCE_VIDEO_PRESENCE = ["HIGH","MEDIUM","LOW","UNKNOWN"] as const;
export const VISUAL_COMMERCE_YES_NO_UNKNOWN = ["YES","NO","UNKNOWN"] as const;
export const VISUAL_COMMERCE_PRODUCT_FIT = ["HIGH","MEDIUM","LOW"] as const;
export const VISUAL_COMMERCE_PRIORITIES = ["A","B","C"] as const;
export const VISUAL_COMMERCE_EMAIL_TYPES = ["DIRECT","DEPARTMENT","GENERAL","NOT_VERIFIED"] as const;

export type VisualCommerceCustomerType = (typeof VISUAL_COMMERCE_CUSTOMER_TYPES)[number];
export type VisualCommerceVideoPresence = (typeof VISUAL_COMMERCE_VIDEO_PRESENCE)[number];
export type VisualCommerceTriState = (typeof VISUAL_COMMERCE_YES_NO_UNKNOWN)[number];
export type VisualCommerceProductFit = (typeof VISUAL_COMMERCE_PRODUCT_FIT)[number];
export type VisualCommercePriority = (typeof VISUAL_COMMERCE_PRIORITIES)[number];
export type VisualCommerceEmailType = (typeof VISUAL_COMMERCE_EMAIL_TYPES)[number];

export interface SalesVisualCommerceProfile {
  organizationId: string;
  websiteUrl?: string;
  youtubeUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  primaryCategory?: string;
  customerType: VisualCommerceCustomerType;
  targetCustomerGender?: string;
  videoPresence: VisualCommerceVideoPresence;
  existingVideoCommerce: VisualCommerceTriState;
  existingAffiliateActivity: VisualCommerceTriState;
  visualProductFit: VisualCommerceProductFit;
  vclUseCase?: string;
  valueHypothesis?: string;
  monetizationHypothesis?: string;
  priority: VisualCommercePriority;
  qualificationNotes?: string;
  sourceUrl?: string;
  lastResearchedAt?: string;
}

export interface SalesVisualCommerceContact {
  id: string;
  organizationId: string;
  name: string;
  title?: string;
  email?: string;
  emailType?: VisualCommerceEmailType;
  phone?: string;
  whatsapp?: string;
  status: string;
  notes: string;
  sourceUrl?: string;
}

export type SalesVisualCommerceProfilePatch = Partial<Omit<SalesVisualCommerceProfile, "organizationId">>;

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
      : connectionString.includes("localhost") ? { ssl: false } : {}),
  });
  return pool;
}

function optionalText(value: unknown): string | undefined {
  return value == null || value === "" ? undefined : String(value);
}
function iso(value: unknown): string | undefined {
  return value ? new Date(String(value)).toISOString() : undefined;
}

function toProfile(row: QueryResultRow): SalesVisualCommerceProfile {
  return {
    organizationId: String(row.organization_id),
    websiteUrl: optionalText(row.website_url),
    youtubeUrl: optionalText(row.youtube_url),
    instagramUrl: optionalText(row.instagram_url),
    tiktokUrl: optionalText(row.tiktok_url),
    primaryCategory: optionalText(row.primary_category),
    customerType: row.customer_type as VisualCommerceCustomerType,
    targetCustomerGender: optionalText(row.target_customer_gender),
    videoPresence: row.video_presence as VisualCommerceVideoPresence,
    existingVideoCommerce: row.existing_video_commerce as VisualCommerceTriState,
    existingAffiliateActivity: row.existing_affiliate_activity as VisualCommerceTriState,
    visualProductFit: row.visual_product_fit as VisualCommerceProductFit,
    vclUseCase: optionalText(row.vcl_use_case),
    valueHypothesis: optionalText(row.value_hypothesis),
    monetizationHypothesis: optionalText(row.monetization_hypothesis),
    priority: row.priority as VisualCommercePriority,
    qualificationNotes: optionalText(row.qualification_notes),
    sourceUrl: optionalText(row.source_url),
    lastResearchedAt: iso(row.last_researched_at),
  };
}

function toContact(row: QueryResultRow): SalesVisualCommerceContact {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    name: String(row.name),
    title: optionalText(row.title),
    email: optionalText(row.email),
    emailType: optionalText(row.email_type) as VisualCommerceEmailType | undefined,
    phone: optionalText(row.phone),
    whatsapp: optionalText(row.whatsapp),
    status: String(row.status || "ACTIVE"),
    notes: String(row.notes || ""),
    sourceUrl: optionalText(row.contact_source_url),
  };
}

export async function getSalesVisualCommerceProfile(organizationId: string): Promise<SalesVisualCommerceProfile | null> {
  const result = await getPool().query("SELECT * FROM sales_visual_commerce_profiles WHERE organization_id = $1", [organizationId]);
  return result.rows[0] ? toProfile(result.rows[0]) : null;
}

export async function getSalesVisualCommerceContacts(organizationId: string): Promise<SalesVisualCommerceContact[]> {
  const result = await getPool().query(
    `SELECT id, organization_id, name, title, email, email_type, phone, whatsapp, status, notes, contact_source_url
     FROM sales_contacts WHERE organization_id = $1 ORDER BY name ASC`,
    [organizationId],
  );
  return result.rows.map(toContact);
}

function validatePatch(patch: SalesVisualCommerceProfilePatch) {
  if (patch.customerType && !VISUAL_COMMERCE_CUSTOMER_TYPES.includes(patch.customerType)) throw new Error("Invalid Visual Commerce customer type.");
  if (patch.videoPresence && !VISUAL_COMMERCE_VIDEO_PRESENCE.includes(patch.videoPresence)) throw new Error("Invalid video presence.");
  if (patch.existingVideoCommerce && !VISUAL_COMMERCE_YES_NO_UNKNOWN.includes(patch.existingVideoCommerce)) throw new Error("Invalid video commerce value.");
  if (patch.existingAffiliateActivity && !VISUAL_COMMERCE_YES_NO_UNKNOWN.includes(patch.existingAffiliateActivity)) throw new Error("Invalid affiliate activity value.");
  if (patch.visualProductFit && !VISUAL_COMMERCE_PRODUCT_FIT.includes(patch.visualProductFit)) throw new Error("Invalid visual product fit.");
  if (patch.priority && !VISUAL_COMMERCE_PRIORITIES.includes(patch.priority)) throw new Error("Invalid Visual Commerce priority.");
  if (patch.lastResearchedAt && Number.isNaN(Date.parse(patch.lastResearchedAt))) throw new Error("Invalid last researched date.");
}

export async function upsertSalesVisualCommerceProfile(organizationId: string, patch: SalesVisualCommerceProfilePatch): Promise<SalesVisualCommerceProfile> {
  validatePatch(patch);
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const organization = await client.query("SELECT experiment FROM sales_organizations WHERE id = $1", [organizationId]);
    if (!organization.rows[0]) throw new Error("Organization not found.");
    if (organization.rows[0].experiment !== "VISUAL_COMMERCE") throw new Error("Visual Commerce profile is only available for VISUAL_COMMERCE organizations.");

    const required = {
      customerType: patch.customerType || "ECOMMERCE_BRAND",
      visualProductFit: patch.visualProductFit || "MEDIUM",
      priority: patch.priority || "B",
    };
    await client.query(
      `INSERT INTO sales_visual_commerce_profiles (organization_id, customer_type, visual_product_fit, priority)
       VALUES ($1,$2,$3,$4) ON CONFLICT (organization_id) DO NOTHING`,
      [organizationId, required.customerType, required.visualProductFit, required.priority],
    );

    const columnMap: Record<keyof SalesVisualCommerceProfilePatch, string> = {
      websiteUrl: "website_url", youtubeUrl: "youtube_url", instagramUrl: "instagram_url", tiktokUrl: "tiktok_url",
      primaryCategory: "primary_category", customerType: "customer_type", targetCustomerGender: "target_customer_gender",
      videoPresence: "video_presence", existingVideoCommerce: "existing_video_commerce", existingAffiliateActivity: "existing_affiliate_activity",
      visualProductFit: "visual_product_fit", vclUseCase: "vcl_use_case", valueHypothesis: "value_hypothesis",
      monetizationHypothesis: "monetization_hypothesis", priority: "priority", qualificationNotes: "qualification_notes",
      sourceUrl: "source_url", lastResearchedAt: "last_researched_at",
    };
    const keys = (Object.keys(patch) as Array<keyof SalesVisualCommerceProfilePatch>).filter((key) => patch[key] !== undefined);
    if (keys.length) {
      const values: unknown[] = [organizationId];
      const assignments = keys.map((key, index) => {
        values.push(patch[key] ?? null);
        return `${columnMap[key]} = $${index + 2}`;
      });
      assignments.push("updated_at = CURRENT_TIMESTAMP");
      await client.query(`UPDATE sales_visual_commerce_profiles SET ${assignments.join(", ")} WHERE organization_id = $1`, values);
    }
    const result = await client.query("SELECT * FROM sales_visual_commerce_profiles WHERE organization_id = $1", [organizationId]);
    await client.query("COMMIT");
    return toProfile(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateSalesVisualCommerceContact(input: {
  organizationId: string; contactId: string; emailType?: VisualCommerceEmailType | null; whatsapp?: string | null; sourceUrl?: string | null;
}): Promise<void> {
  if (input.emailType && !VISUAL_COMMERCE_EMAIL_TYPES.includes(input.emailType)) throw new Error("Invalid email type.");
  const result = await getPool().query(
    `UPDATE sales_contacts c SET email_type=$3, whatsapp=$4, contact_source_url=$5, updated_at=CURRENT_TIMESTAMP
     FROM sales_organizations o
     WHERE c.id=$1 AND c.organization_id=$2 AND o.id=c.organization_id AND o.experiment='VISUAL_COMMERCE'
     RETURNING c.id`,
    [input.contactId, input.organizationId, input.emailType || null, input.whatsapp || null, input.sourceUrl || null],
  );
  if (!result.rows[0]) throw new Error("Visual Commerce contact not found.");
}
