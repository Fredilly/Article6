import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const page = fs.readFileSync(new URL("../pages/internal/sales/organizations/[id].tsx", import.meta.url), "utf8");
const overview = fs.readFileSync(new URL("../components/WebServicesOrganizationOverview.tsx", import.meta.url), "utf8");
const migration = fs.readFileSync(new URL("../migrations/019_sales_web_services_opportunity.sql", import.meta.url), "utf8");
const route = fs.readFileSync(new URL("../pages/api/internal/web-services.ts", import.meta.url), "utf8");

test("organization overview routing is explicit for Carbon, Tender, and Web Services", () => {
  assert.match(page, /organization\.experiment === "ARTICLE6_CARBON"/);
  assert.match(page, /organization\.experiment === "TENDER_READINESS"/);
  assert.match(page, /organization\.experiment === "WEB_SERVICES"/);
  assert.match(page, /isCarbon \? <CarbonOrganizationOverview/);
  assert.match(page, /isTender \? <TenderOrganizationOverview/);
  assert.match(page, /isWebServices \? <WebServicesOrganizationOverview/);
  assert.doesNotMatch(page, /isTender \? <TenderOrganizationOverview[\s\S]*?: <CarbonOrganizationOverview/);
});

test("WEB_SERVICES is labeled Web Services", () => {
  assert.match(page, /value === "WEB_SERVICES"\) return "Web Services"/);
});

test("Web Services overview exposes website opportunity and sales opportunity fields", () => {
  for (const label of [
    "Company", "Website", "Country", "Service hypothesis", "Status", "Last interaction",
    "Website opportunity", "Potential services", "AI query tested", "Target appearing in AI results",
    "Competitors appearing", "Website observation", "Last checked", "Sales opportunity", "Primary service",
    "Commercial value", "Problem confirmed", "Price discussed", "Case study sent", "Next action", "Next action date",
  ]) assert.match(overview, new RegExp(label));
  assert.match(overview, /GEO Visibility/);
  assert.match(overview, /Website Redesign/);
  assert.match(overview, /Not tested/);
});

test("Web Services overview contains no Carbon or procurement fields", () => {
  assert.doesNotMatch(overview, /ProcurementProfilePanel/);
  assert.doesNotMatch(overview, /Project ID/);
  assert.doesNotMatch(overview, /Methodology/);
  assert.doesNotMatch(overview, /\bVCS\b/);
  assert.match(page, /\{isCarbon \? <section[^>]*>[\s\S]*?Carbon evidence/);
  assert.match(page, /\{isCarbon \? <section[^>]*>[\s\S]*?Carbon project workflow/);
});

test("Web Services contacts default WhatsApp status to UNKNOWN and expose supported states", () => {
  assert.match(migration, /whatsapp_status TEXT NOT NULL DEFAULT 'UNKNOWN'/);
  for (const status of ["VERIFIED", "LIKELY", "UNKNOWN", "NO"]) assert.match(migration, new RegExp(`'${status}'`));
  assert.match(page, /WhatsApp:/);
  assert.match(route, /update_whatsapp_status/);
});

test("Web Services interaction choices match the sales workflow", () => {
  for (const channel of ["WHATSAPP", "EMAIL", "CALL", "MEETING"]) assert.match(page, new RegExp(`<option>${channel}<\\/option>`));
  for (const kind of ["OUTREACH", "REPLY", "CALL", "FOLLOW_UP", "PROPOSAL", "PAYMENT"]) assert.match(page, new RegExp(`<option>${kind}<\\/option>`));
});
