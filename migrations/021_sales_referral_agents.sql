-- Independent, submission-only website referral partner identities.
CREATE TABLE IF NOT EXISTS sales_referral_agents (
  id UUID PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  session_version INTEGER NOT NULL DEFAULT 1,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (username ~ '^[a-z0-9][a-z0-9_-]{2,39}$')
);
CREATE INDEX IF NOT EXISTS sales_referral_agents_active_idx ON sales_referral_agents (active);
