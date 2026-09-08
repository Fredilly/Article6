ALTER TABLE sales_web_service_profiles
  ADD COLUMN IF NOT EXISTS primary_service TEXT NOT NULL DEFAULT 'UNKNOWN',
  ADD COLUMN IF NOT EXISTS commercial_value NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS problem_confirmed TEXT NOT NULL DEFAULT 'UNKNOWN',
  ADD COLUMN IF NOT EXISTS price_discussed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS case_study_sent BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE sales_web_service_profiles
  DROP CONSTRAINT IF EXISTS sales_web_service_profiles_primary_service_check,
  ADD CONSTRAINT sales_web_service_profiles_primary_service_check CHECK (
    primary_service IN ('GEO_VISIBILITY','WEBSITE_REDESIGN','BOTH','UNKNOWN')
  ),
  DROP CONSTRAINT IF EXISTS sales_web_service_profiles_problem_confirmed_check,
  ADD CONSTRAINT sales_web_service_profiles_problem_confirmed_check CHECK (
    problem_confirmed IN ('UNKNOWN','YES','NO')
  );

ALTER TABLE sales_contacts
  ADD COLUMN IF NOT EXISTS whatsapp_status TEXT NOT NULL DEFAULT 'UNKNOWN';

ALTER TABLE sales_contacts
  DROP CONSTRAINT IF EXISTS sales_contacts_whatsapp_status_check,
  ADD CONSTRAINT sales_contacts_whatsapp_status_check CHECK (
    whatsapp_status IN ('VERIFIED','LIKELY','UNKNOWN','NO')
  );
