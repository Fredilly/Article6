CREATE TABLE IF NOT EXISTS sales_email_tracking (
  id UUID PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  organization_id UUID NOT NULL REFERENCES sales_organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES sales_contacts(id) ON DELETE SET NULL,
  tender_opportunity_id UUID REFERENCES sales_tender_opportunities(id) ON DELETE SET NULL,
  interaction_id UUID REFERENCES sales_interactions(id) ON DELETE SET NULL,
  gmail_message_id TEXT,
  gmail_thread_id TEXT,
  campaign_source TEXT,
  approved_destination TEXT,
  subject TEXT,
  open_count INTEGER NOT NULL DEFAULT 0,
  first_opened_at TIMESTAMPTZ,
  last_opened_at TIMESTAMPTZ,
  click_count INTEGER NOT NULL DEFAULT 0,
  first_clicked_at TIMESTAMPTZ,
  last_clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS sales_email_tracking_organization_idx
  ON sales_email_tracking (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS sales_email_tracking_contact_idx
  ON sales_email_tracking (contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS sales_email_tracking_tender_idx
  ON sales_email_tracking (tender_opportunity_id) WHERE tender_opportunity_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS sales_email_tracking_gmail_message_uq
  ON sales_email_tracking (gmail_message_id) WHERE gmail_message_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS sales_email_tracking_events (
  id UUID PRIMARY KEY,
  tracking_id UUID NOT NULL REFERENCES sales_email_tracking(id) ON DELETE CASCADE,
  event_type VARCHAR(16) NOT NULL CHECK (event_type IN ('OPEN', 'CLICK')),
  occurred_at TIMESTAMPTZ NOT NULL,
  classification VARCHAR(32) NOT NULL DEFAULT 'UNKNOWN'
    CHECK (classification IN ('HUMAN_LIKELY', 'AUTOMATED_LIKELY', 'UNKNOWN')),
  user_agent TEXT,
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS sales_email_tracking_events_tracking_occurred_idx
  ON sales_email_tracking_events (tracking_id, occurred_at DESC);
