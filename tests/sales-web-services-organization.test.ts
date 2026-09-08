import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const organizationPage = fs.readFileSync(new URL("../pages/internal/sales/organizations/[id].tsx", import.meta.url), "utf8");
const webOverview = fs.readFileSync(new URL("../components/WebServicesOrganizationOverview.tsx", import.meta.url), "utf8");
const genericOverview = fs.readFileSync(new URL("../components/SalesOrganizationOverview.tsx", import.meta.url), "utf8");
const webStore = fs.readFileSync(new URL("../lib/sales-web-services.ts", import.meta.url), "utf8");
const migration = fs.readFileSync(new URL("../migrations/019_sales_web_services_opportunity.sql", import.meta.url), "utf8");

test("organization page explicitly routes recognized sales experiments", () => {
  assert.match(organizationPage, /organization\.experiment === "ARTICLE6_CARBON"/);
  assert.match(organizationPage, /organization\.experiment === "TENDER_READINESS"/);
  assert.match(organizationPage, /organization\.experiment === "WEB_SERVICES"/);
  assert.match(organizationPage, /<CarbonOrganizationOverview/);
  assert.match(organizationPage, /<TenderOrganizationOverview/);
  assert.match(organizationPage, /<WebServicesOrganizationOverview/);
});

test("WEB_SERVICES uses the correct display label", () => {
  assert.match(organizationPage, /value === "WEB_SERVICES"\) return "Web Services"/);
});

test("Web Services overview exposes only sales-relevant summary and website fields", () => {
  for (const label of ["Company", "Website", "Country", "Service hypothesis", "Status", "Last interaction", "Website opportunity", "Potential services", "AI query tested", "Target appearing in AI results", "Competitors appearing", "Website observation", "Last checked"]) {
    assert.match(webOverview, new RegExp(label));
  }
  assert.doesNotMatch(webOverview, /Project ID|Methodology|Version|VCS/);
  assert.doesNotMatch(webOverview, /ProcurementProfilePanel/);
});

test("Web Services replaces project workflow with minimal sales opportunity fields", () => {
  for (const label of ["Sales opportunity", "Primary service", "Commercial value", "Problem confirmed", "Price discussed", "Case study sent", "Next action", "Next action date"]) {
    assert.match(webOverview, new RegExp(label));
  }
  assert.match(organizationPage, /isWebServices \? <WebServicesSalesOpportunity/);
  assert.match(organizationPage, /\{isCarbon \? <section[^>]*>[\s\S]*Carbon evidence/);
  assert.match(organizationPage, /\{isCarbon \? <section[^>]*>[\s\S]*Carbon project workflow/);
  assert.match(genericOverview, /ProcurementProfilePanel/);
});

test("Web Services contact and interaction vocabulary is constrained without changing canonical organization statuses", () => {
  assert.match(migration, /whatsapp_status TEXT NOT NULL DEFAULT 'UNKNOWN'/);
  for (const status of ["VERIFIED", "LIKELY", "UNKNOWN", "NO"]) assert.match(migration, new RegExp(status));
  for (const channel of ["WHATSAPP", "EMAIL", "CALL", "MEETING"]) assert.match(organizationPage, new RegExp(`<option>${channel}<\\/option>`));
  for (const interactionType of ["OUTREACH", "REPLY", "CALL", "FOLLOW_UP", "PROPOSAL", "PAYMENT"]) assert.match(organizationPage, new RegExp(`<option>${interactionType}<\\/option>`));
});

test("existing web-service profile is extended rather than replaced", () => {
  assert.match(webStore, /sales_web_service_profiles/);
  assert.match(migration, /ALTER TABLE sales_web_service_profiles/);
  assert.match(migration, /primary_service/);
  assert.match(migration, /problem_confirmed/);
  assert.match(migration, /case_study_sent/);
});
