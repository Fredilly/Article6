import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const migration = fs.readFileSync(new URL("../migrations/014_add_tender_bidder_status.sql", import.meta.url), "utf8");
const store = fs.readFileSync(new URL("../lib/sales-store.ts", import.meta.url), "utf8");
const route = fs.readFileSync(new URL("../pages/api/internal/sales.ts", import.meta.url), "utf8");
const organizationPage = fs.readFileSync(new URL("../pages/internal/sales/organizations/[id].tsx", import.meta.url), "utf8");
const overview = fs.readFileSync(new URL("../components/SalesOrganizationOverview.tsx", import.meta.url), "utf8");
const tenderPage = fs.readFileSync(new URL("../pages/internal/sales/tenders/[id].tsx", import.meta.url), "utf8");
const badge = fs.readFileSync(new URL("../components/TenderBidderStatusBadge.tsx", import.meta.url), "utf8");

test("bidder status is a structured tender field separate from sales status", () => {
  assert.match(migration, /ADD COLUMN IF NOT EXISTS bidder_status text/);
  assert.match(store, /bidderStatus\?: string/);
  assert.match(store, /bidder_status/);
  assert.match(store, /sales_status/);
  assert.match(route, /bidderStatus/);
});

test("existing probable bidder notes are backfilled without inferring from sales status", () => {
  assert.match(migration, /PROBABLE BIDDER — NOT CONFIRMED/);
  assert.match(migration, /LOWER\(COALESCE\(notes, ''\)\)/);
  assert.doesNotMatch(migration, /sales_status.*PROBABLE|CONTACTED.*PROBABLE/);
});

test("bidder status is visible in both requested tender readiness surfaces", () => {
  assert.match(overview, /Bidder status/);
  assert.match(overview, /TenderBidderStatusBadge/);
  assert.match(organizationPage, /Tender documents\/readiness/);
  assert.match(organizationPage, /TenderBidderStatusBadge/);
});

test("tender edit UI supports known statuses and preserves future values", () => {
  assert.match(tenderPage, /name="bidderStatus"/);
  assert.match(tenderPage, /bidderStatusIsKnown/);
  assert.match(badge, /NOT CLASSIFIED/);
  assert.match(badge, /PROBABLE BIDDER — NOT CONFIRMED/);
  assert.match(badge, /CONFIRMED BIDDER/);
  assert.match(badge, /bg-green-50/);
  assert.match(badge, /bg-amber-50/);
});
