CREATE TABLE IF NOT EXISTS sales_procurement_profiles (
  organization_id UUID PRIMARY KEY REFERENCES sales_organizations(id) ON DELETE CASCADE,
  opportunities_considered_band TEXT,
  bids_submitted_band TEXT,
  wins_band TEXT,
  bid_decision_process TEXT,
  bid_decision_owner_contact_id UUID REFERENCES sales_contacts(id) ON DELETE SET NULL,
  discovery_methods TEXT[],
  discovery_problems TEXT[],
  bid_preparation_model TEXT,
  ai_usage TEXT[],
  independent_review_frequency TEXT,
  evidence_library_maturity TEXT,
  primary_procurement_pain TEXT,
  profile_source TEXT,
  profile_confidence TEXT,
  last_verified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT sales_procurement_profiles_opportunities_band_check CHECK (
    opportunities_considered_band IS NULL OR opportunities_considered_band IN ('UNKNOWN','ONE_TO_THREE','FOUR_TO_TEN','ELEVEN_TO_TWENTY_FIVE','TWENTY_FIVE_PLUS')
  ),
  CONSTRAINT sales_procurement_profiles_bids_band_check CHECK (
    bids_submitted_band IS NULL OR bids_submitted_band IN ('UNKNOWN','ONE_TO_THREE','FOUR_TO_TEN','ELEVEN_TO_TWENTY_FIVE','TWENTY_FIVE_PLUS')
  ),
  CONSTRAINT sales_procurement_profiles_wins_band_check CHECK (
    wins_band IS NULL OR wins_band IN ('UNKNOWN','ZERO','ONE_TO_TWO','THREE_TO_FIVE','SIX_PLUS')
  ),
  CONSTRAINT sales_procurement_profiles_bid_decision_check CHECK (
    bid_decision_process IS NULL OR bid_decision_process IN ('UNKNOWN','NONE','INFORMAL','FORMAL')
  ),
  CONSTRAINT sales_procurement_profiles_bid_preparation_check CHECK (
    bid_preparation_model IS NULL OR bid_preparation_model IN ('UNKNOWN','FOUNDER_LED','SALES_LED','OPERATIONS_LED','BID_TEAM','EXTERNAL_CONSULTANT','MIXED')
  ),
  CONSTRAINT sales_procurement_profiles_review_frequency_check CHECK (
    independent_review_frequency IS NULL OR independent_review_frequency IN ('UNKNOWN','NEVER','SOMETIMES','USUALLY','DEDICATED_INTERNAL_FUNCTION')
  ),
  CONSTRAINT sales_procurement_profiles_evidence_maturity_check CHECK (
    evidence_library_maturity IS NULL OR evidence_library_maturity IN ('UNKNOWN','NONE','INFORMAL','PARTIALLY_STRUCTURED','STRUCTURED')
  ),
  CONSTRAINT sales_procurement_profiles_primary_pain_check CHECK (
    primary_procurement_pain IS NULL OR primary_procurement_pain IN ('UNKNOWN','DISCOVERY','BID_NO_BID','ELIGIBILITY','REFERENCE_FIT','EVIDENCE','WRITING','SCORING','CONSISTENCY','COMMERCIAL','FINAL_REVIEW','SUBMISSION')
  ),
  CONSTRAINT sales_procurement_profiles_source_check CHECK (
    profile_source IS NULL OR profile_source IN ('UNKNOWN','CLIENT_REPORTED','PUBLIC_DATA','ARTICLE6_OBSERVED','ARTICLE6_INFERENCE')
  ),
  CONSTRAINT sales_procurement_profiles_confidence_check CHECK (
    profile_confidence IS NULL OR profile_confidence IN ('UNKNOWN','LOW','MEDIUM','HIGH')
  )
);

ALTER TABLE sales_interactions
  ADD COLUMN IF NOT EXISTS signal_tags TEXT[],
  ADD COLUMN IF NOT EXISTS hypothesis_key TEXT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_interactions_signal_tags_check') THEN
    ALTER TABLE sales_interactions ADD CONSTRAINT sales_interactions_signal_tags_check CHECK (
      signal_tags IS NULL OR signal_tags <@ ARRAY[
        'DISCOVERY_GAP','BID_NO_BID','REFERENCE_FIT','EVIDENCE_REUSE','FINAL_REVIEW',
        'AI_ALREADY_USED','PRICE_PER_BID_RESISTANCE','RECURRING_SUPPORT_INTEREST',
        'PAID_PILOT_SIGNAL','REPEAT_USAGE_SIGNAL'
      ]::TEXT[]
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_interactions_hypothesis_key_check') THEN
    ALTER TABLE sales_interactions ADD CONSTRAINT sales_interactions_hypothesis_key_check CHECK (
      hypothesis_key IS NULL OR hypothesis_key IN (
        'tender_discovery_assist','bid_no_bid_assist','reusable_evidence_profile',
        'premium_final_review','recurring_bid_desk'
      )
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sales_procurement_profiles_primary_pain ON sales_procurement_profiles(primary_procurement_pain);
CREATE INDEX IF NOT EXISTS idx_sales_procurement_profiles_review_frequency ON sales_procurement_profiles(independent_review_frequency);
CREATE INDEX IF NOT EXISTS idx_sales_procurement_profiles_bids_band ON sales_procurement_profiles(bids_submitted_band);

INSERT INTO sales_procurement_profiles (
  organization_id, bid_decision_process, bid_decision_owner_contact_id, discovery_problems, ai_usage,
  primary_procurement_pain, profile_source, profile_confidence, last_verified_at, notes, created_at, updated_at
)
SELECT
  o.id,
  'FORMAL',
  c.id,
  ARRAY['Tenderers sometimes use incorrect categories','Current category configuration may not capture everything']::TEXT[],
  ARRAY['ChatGPT','Claude']::TEXT[],
  'UNKNOWN',
  'CLIENT_REPORTED',
  'UNKNOWN',
  TIMESTAMPTZ '2026-09-04T14:33:55Z',
  'Paul spends approximately 20 minutes per day assessing tenders. AHRRA was not pursued because reference/case-study fit was not strong enough. Paul reported recent tender wins; annual win count remains unknown.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM sales_organizations o
LEFT JOIN sales_contacts c ON c.organization_id = o.id AND LOWER(TRIM(c.name)) = LOWER('Dr Paul Mc Cann')
WHERE LOWER(TRIM(o.name)) = LOWER('Creative Driven Goals (CDG)')
ON CONFLICT (organization_id) DO NOTHING;

UPDATE sales_interactions i
SET signal_tags = ARRAY['DISCOVERY_GAP','BID_NO_BID','REFERENCE_FIT','AI_ALREADY_USED']::TEXT[],
    hypothesis_key = 'bid_no_bid_assist'
FROM sales_organizations o
WHERE i.organization_id = o.id
  AND LOWER(TRIM(o.name)) = LOWER('Creative Driven Goals (CDG)')
  AND i.external_reference = 'voice-memo:6051ACE1-AA6A-4C0D-86AB-192CDD62A38A';
