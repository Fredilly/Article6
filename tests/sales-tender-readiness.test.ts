import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const migration = fs.readFileSync(new URL("../migrations/010_sales_workflow_and_carbon_documents.sql", import.meta.url), "utf8");
const store = fs.readFileSync(new URL("../lib/sales-store.ts", import.meta.url), "utf8");
const memory = fs.readFileSync(new URL("../lib/sales-memory.ts", import.meta.url), "utf8");
const route = fs.readFileSync(new URL("../pages/api/internal/sales.ts", import.meta.url), "utf8");
const organizationPage = fs.readFileSync(new URL("../pages/internal/sales/organizations/[id].tsx", import.meta.url), "utf8");
const overview = fs.readFileSync(new URL("../components/SalesOrganizationOverview.tsx", import.meta.url), "utf8");

test("Carbon and Tender use separate opportunity/document tables with shared interactions", () => {
  assert.match(migration, /CREATE TABLE IF NOT EXISTS sales_project_documents/);
  assert.match(migration, /ALTER TABLE sales_tender_opportunities/);
  assert.match(migration, /sales_interactions \(id, organization_id, contact_id, tender_opportunity_id/);
  assert.doesNotMatch(migration, /carbon_emails|tender_emails/);
});

test("sales workflow supports required statuses, ownership, and next actions", () => {
  for (const status of ["NEW", "CONTACTED", "ENGAGED", "NURTURE", "OPPORTUNITY", "CLOSED_WON", "CLOSED_NO", "PARKED", "DO_NOT_CONTACT"]) {
    assert.match(store + memory + route, new RegExp(status));
  }
  for (const field of ["assigned_owner", "next_action", "next_action_date"]) assert.match(migration, new RegExp(field));
});

test("organization hygiene actions are authenticated and confirmation-gated", () => {
  assert.match(route, /hasInternalUploadSession/);
  assert.match(route, /merge_organization/);
  assert.match(route, /delete_organization/);
  assert.match(route, /hasDeleteConfirmation/);
});

test("organization detail separates tender and carbon presentation", () => {
  assert.match(organizationPage, /organization\.experiment === "TENDER_READINESS"/);
  assert.match(organizationPage, /CarbonOrganizationOverview/);
  assert.match(organizationPage, /TenderOrganizationOverview/);
  assert.match(organizationPage, /Tender documents\/readiness/);
  assert.doesNotMatch(organizationPage, /<section className="mt-6 rounded-lg border border-amber-200 bg-amber-50\/30 p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><div><h2 className="font-semibold">Tender Readiness/);
  assert.match(overview, /Project ID/);
  assert.match(overview, /Methodology/);
  assert.match(overview, /Submission deadline/);
  assert.match(overview, /Active tender opportunities/);
});
