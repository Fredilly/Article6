import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  deriveBidderSegment,
  isBidDecisionProcess,
  isProcurementFrequencyBand,
  isProcurementHypothesisKey,
  isProcurementSignalTag,
  isProcurementWinsBand,
} from "../lib/sales-procurement-domain.ts";

const migration = fs.readFileSync(new URL("../migrations/017_sales_procurement_profiles.sql", import.meta.url), "utf8");
const store = fs.readFileSync(new URL("../lib/sales-procurement.ts", import.meta.url), "utf8");
const automation = fs.readFileSync(new URL("../pages/api/internal/crm-automation.ts", import.meta.url), "utf8");

test("bidder segment is derived centrally from bids submitted band", () => {
  assert.equal(deriveBidderSegment(undefined), "UNKNOWN");
  assert.equal(deriveBidderSegment(null), "UNKNOWN");
  assert.equal(deriveBidderSegment("UNKNOWN"), "UNKNOWN");
  assert.equal(deriveBidderSegment("ONE_TO_THREE"), "OCCASIONAL");
  assert.equal(deriveBidderSegment("FOUR_TO_TEN"), "REGULAR");
  assert.equal(deriveBidderSegment("ELEVEN_TO_TWENTY_FIVE"), "MULTI_BIDDER");
  assert.equal(deriveBidderSegment("TWENTY_FIVE_PLUS"), "MULTI_BIDDER");
});

test("procurement enums accept UNKNOWN and reject invalid values", () => {
  assert.equal(isProcurementFrequencyBand("UNKNOWN"), true);
  assert.equal(isProcurementWinsBand("UNKNOWN"), true);
  assert.equal(isBidDecisionProcess("UNKNOWN"), true);
  assert.equal(isProcurementFrequencyBand("MANY"), false);
  assert.equal(isProcurementWinsBand("TEN"), false);
  assert.equal(isBidDecisionProcess("YES"), false);
});

test("signal tags and hypothesis keys are validated against the initial allowlists", () => {
  assert.equal(isProcurementSignalTag("DISCOVERY_GAP"), true);
  assert.equal(isProcurementSignalTag("AI_ALREADY_USED"), true);
  assert.equal(isProcurementSignalTag("MADE_UP_SIGNAL"), false);
  assert.equal(isProcurementHypothesisKey("bid_no_bid_assist"), true);
  assert.equal(isProcurementHypothesisKey("auto_promote_product"), false);
});

test("profile migration is optional, nullable and enforces organization/contact relationships", () => {
  assert.match(migration, /CREATE TABLE IF NOT EXISTS sales_procurement_profiles/);
  assert.match(migration, /organization_id UUID PRIMARY KEY REFERENCES sales_organizations\(id\) ON DELETE CASCADE/);
  assert.match(migration, /bid_decision_owner_contact_id UUID REFERENCES sales_contacts\(id\) ON DELETE SET NULL/);
  assert.match(migration, /opportunities_considered_band TEXT,/);
  assert.doesNotMatch(migration, /opportunities_considered_band TEXT NOT NULL/);
  assert.doesNotMatch(migration, /bids_submitted_band TEXT NOT NULL/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS signal_tags TEXT\[\]/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS hypothesis_key TEXT/);
});

test("profile store creates an optional row and applies only supplied patch fields", () => {
  assert.match(store, /INSERT INTO sales_procurement_profiles \(organization_id, created_at, updated_at\)/);
  assert.match(store, /ON CONFLICT \(organization_id\) DO NOTHING/);
  assert.match(store, /filter\(\(key\) => patch\[key\] !== undefined\)/);
  assert.match(store, /UPDATE sales_procurement_profiles SET \$\{assignments\.join\(", "\)\}/);
  assert.match(store, /SELECT id FROM sales_contacts WHERE id = \$1 AND organization_id = \$2/);
  assert.match(store, /Bid decision owner contact does not belong to this organization/);
  assert.match(store, /Procurement profile verification failed after update/);
});

test("interaction signal writes persist on the selected organization interaction", () => {
  assert.match(store, /UPDATE sales_interactions/);
  assert.match(store, /SET signal_tags = \$3::text\[\], hypothesis_key = \$4/);
  assert.match(store, /WHERE id = \$1 AND organization_id = \$2/);
  assert.match(store, /RETURNING signal_tags, hypothesis_key/);
});

test("automation supports procurement inspect/upsert and database-verifies writes", () => {
  assert.match(automation, /operation: "inspect_procurement_profile"/);
  assert.match(automation, /operation: "upsert_procurement_profile"/);
  assert.match(automation, /await upsertSalesProcurementProfile\(organization\.id, patch\)/);
  assert.match(automation, /getSalesProcurementProfile\(organization\.id\)/);
  assert.match(automation, /verifiedFromDatabase: true/);
  assert.match(automation, /unexpectedly changed organization status/);
});

test("record_interaction validates, stores and verifies optional market signals", () => {
  assert.match(automation, /signalTags\?: ProcurementSignalTag\[\]/);
  assert.match(automation, /hypothesisKey\?: ProcurementHypothesisKey/);
  assert.match(automation, /isProcurementSignalTag/);
  assert.match(automation, /isProcurementHypothesisKey/);
  assert.match(automation, /await setSalesInteractionSignals/);
  assert.match(automation, /await getSalesInteractionSignals/);
  assert.match(automation, /CRM interaction signal-tag verification failed after update/);
});

test("CDG backfill keeps unknown annual volumes unknown and does not touch organization state", () => {
  assert.match(migration, /Creative Driven Goals \(CDG\)/);
  assert.match(migration, /'FORMAL'/);
  assert.match(migration, /ARRAY\['ChatGPT','Claude'\]/);
  assert.match(migration, /'UNKNOWN',\n  'CLIENT_REPORTED'/);
  assert.match(migration, /annual win count remains unknown/);
  assert.doesNotMatch(migration, /UPDATE sales_organizations/);
  assert.match(migration, /ON CONFLICT \(organization_id\) DO NOTHING/);
  assert.match(migration, /ARRAY\['DISCOVERY_GAP','BID_NO_BID','REFERENCE_FIT','AI_ALREADY_USED'\]/);
});
