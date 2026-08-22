import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { normalizeSalesDateTime, salesDateTimeLocalToIso } from "../lib/sales-dates.ts";

const store = fs.readFileSync(new URL("../lib/sales-store.ts", import.meta.url), "utf8");
const importStore = fs.readFileSync(new URL("../lib/sales-import-store.ts", import.meta.url), "utf8");
const salesApi = fs.readFileSync(new URL("../pages/api/internal/sales.ts", import.meta.url), "utf8");
const queue = fs.readFileSync(new URL("../pages/internal/sales/queue.tsx", import.meta.url), "utf8");
const migration = fs.readFileSync(new URL("../migrations/011_sales_idempotency_and_queue_fixtures.sql", import.meta.url), "utf8");

test("queue ranks commercial urgency before dates and canonicalizes Carbon projects", () => {
  assert.match(store, /WHEN 'OPPORTUNITY' THEN 1[\s\S]*WHEN 'ENGAGED' THEN 2[\s\S]*WHEN 'CONTACTED' THEN 3[\s\S]*WHEN 'NEW' THEN 4/);
  assert.match(store, /CASE WHEN next_action_date IS NOT NULL AND next_action_date < CURRENT_TIMESTAMP THEN 0 ELSE 1 END/);
  assert.match(store, /SELECT DISTINCT ON \(op\.project_id\)/);
  assert.match(queue, /item\.status === "ENGAGED" && !item\.nextAction/);
  assert.match(queue, /item\.status === "NEW" && !item\.hasOutreach/);
});

test("next-action dates require explicit timezone at the database boundary", () => {
  assert.equal(normalizeSalesDateTime("2026-08-22T10:00:00+08:00"), "2026-08-22T02:00:00.000Z");
  assert.throws(() => normalizeSalesDateTime("2026-08-22T10:00"), /explicit timezone/);
  assert.match(salesApi + store, /normalizeSalesDateTime/);
  assert.equal(typeof salesDateTimeLocalToIso("2026-08-22T10:00"), "string");
});

test("Tender workflow metadata can update without a lifecycle-status field", () => {
  assert.match(store, /status=COALESCE\(\$10, status\)/);
  assert.match(salesApi, /tenderStatusValue && !isSalesTenderStatus/);
  assert.match(salesApi, /status: tenderStatusValue && isSalesTenderStatus/);
});

test("imports, opportunities, and documents have idempotency protection", () => {
  assert.match(migration, /sales_interactions_imported_external_reference_uq/);
  assert.match(migration, /sales_tender_opportunities_source_key_uq/);
  assert.match(migration, /sales_tender_documents_source_key_uq/);
  assert.match(migration, /sales_project_documents_source_key_uq/);
  assert.match(importStore, /ON CONFLICT \(external_reference\)/);
  assert.match(importStore, /SELECT id FROM sales_interactions WHERE external_reference/);
  assert.match(store, /sales_contacts[\s\S]*LOWER\(TRIM\(name\)\)/);
});

test("queue fixtures cover overdue, tender action, engaged missing action, and new no-outreach cases", () => {
  assert.match(migration, /next_action_date = '2026-08-01 10:00:00 Europe\/Dublin'/);
  assert.match(migration, /sales_status = 'OPPORTUNITY'/);
  assert.match(migration, /Seeded ENGAGED-without-next-action Carbon example/);
  assert.match(migration, /Seeded NEW-without-outreach Tender example/);
});
