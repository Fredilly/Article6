ALTER TABLE sales_contacts
  ADD COLUMN IF NOT EXISTS email_type TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS contact_source_url TEXT;

ALTER TABLE sales_contacts
  DROP CONSTRAINT IF EXISTS sales_contacts_email_type_check,
  ADD CONSTRAINT sales_contacts_email_type_check CHECK (
    email_type IS NULL OR email_type IN ('DIRECT','DEPARTMENT','GENERAL','NOT_VERIFIED')
  );

CREATE TABLE IF NOT EXISTS sales_visual_commerce_profiles (
  organization_id UUID PRIMARY KEY REFERENCES sales_organizations(id) ON DELETE CASCADE,
  website_url TEXT,
  youtube_url TEXT,
  instagram_url TEXT,
  tiktok_url TEXT,
  primary_category TEXT,
  customer_type TEXT NOT NULL,
  target_customer_gender TEXT,
  video_presence TEXT NOT NULL DEFAULT 'UNKNOWN',
  existing_video_commerce TEXT NOT NULL DEFAULT 'UNKNOWN',
  existing_affiliate_activity TEXT NOT NULL DEFAULT 'UNKNOWN',
  visual_product_fit TEXT NOT NULL,
  vcl_use_case TEXT,
  value_hypothesis TEXT,
  monetization_hypothesis TEXT,
  priority TEXT NOT NULL,
  qualification_notes TEXT,
  source_url TEXT,
  last_researched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT sales_visual_commerce_customer_type_check CHECK (
    customer_type IN ('ECOMMERCE_BRAND','CREATOR','PUBLISHER','VIDEO_PLATFORM','RETAILER','CREATOR_NETWORK')
  ),
  CONSTRAINT sales_visual_commerce_video_presence_check CHECK (
    video_presence IN ('HIGH','MEDIUM','LOW','UNKNOWN')
  ),
  CONSTRAINT sales_visual_commerce_existing_video_commerce_check CHECK (
    existing_video_commerce IN ('YES','NO','UNKNOWN')
  ),
  CONSTRAINT sales_visual_commerce_affiliate_activity_check CHECK (
    existing_affiliate_activity IN ('YES','NO','UNKNOWN')
  ),
  CONSTRAINT sales_visual_commerce_fit_check CHECK (
    visual_product_fit IN ('HIGH','MEDIUM','LOW')
  ),
  CONSTRAINT sales_visual_commerce_priority_check CHECK (
    priority IN ('A','B','C')
  )
);

CREATE INDEX IF NOT EXISTS sales_visual_commerce_profiles_category_idx
  ON sales_visual_commerce_profiles (primary_category);
CREATE INDEX IF NOT EXISTS sales_visual_commerce_profiles_priority_idx
  ON sales_visual_commerce_profiles (priority);
