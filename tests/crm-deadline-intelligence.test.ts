import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const intelligence = fs.readFileSync(new URL("../lib/tender-intelligence.ts", import.meta.url), "utf8");
const organizations = fs.readFileSync(new URL("../components/SalesOrganizationsTable.tsx", import.meta.url), "utf8");
const tracking = fs.readFileSync(new URL("../pages/internal/sales/email-tracking.tsx", import.meta.url), "utf8");
const homepage = fs.readFileSync(new URL("../lib/sales-homepage-store.ts", import.meta.url), "utf8");

test("deadline urgency is centralized with the agreed thresholds", () => {
  assert.match(intelligence, /days <= 2/);
  assert.match(intelligence, /days <= 6/);
  assert.match(intelligence, /days <= 14/);
  assert.match(intelligence, /return "EXPIRED"/);
});

test("existing tender workflow status maps to derived lifecycle without schema mutation", () => {
  assert.match(intelligence, /status === "SUBMITTED"/);
  assert.match(intelligence, /status === "AWARDED"/);
  assert.match(intelligence, /status === "NOT_AWARDED"/);
  assert.doesNotMatch(intelligence, /UPDATE sales_tender_opportunities/);
});

test("organization list adds deadline beside experiment and factual relationship context", () => {
  assert.match(organizations, /getNearestRelevantTender/);
  assert.match(organizations, /getOrganizationStatusSummary/);
  assert.match(organizations, /· \{shortDeadline/);
  assert.match(homepage, /FROM sales_interactions i/);
});

test("tracked email deadline uses tender linkage but does not change engagement state", () => {
  assert.match(tracking, /record\.tenderOpportunityId/);
  assert.match(tracking, /trackingDeadlineLabel/);
  assert.match(tracking, /Expired/);
  assert.doesNotMatch(tracking, /CONTACTED.*ENGAGED|ENGAGED.*CLICKED/s);
});
