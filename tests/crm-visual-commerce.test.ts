import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const memory = fs.readFileSync(new URL("../lib/sales-memory.ts", import.meta.url), "utf8");
const migration = fs.readFileSync(new URL("../migrations/020_sales_visual_commerce.sql", import.meta.url), "utf8");
const store = fs.readFileSync(new URL("../lib/sales-visual-commerce.ts", import.meta.url), "utf8");
const list = fs.readFileSync(new URL("../components/SalesOrganizationsTable.tsx", import.meta.url), "utf8");
const detail = fs.readFileSync(new URL("../pages/internal/sales/visual-commerce/[id].tsx", import.meta.url), "utf8");
const automation = fs.readFileSync(new URL("../pages/api/internal/crm-visual-commerce-automation.ts", import.meta.url), "utf8");
const workflow = fs.readFileSync(new URL("../.github/workflows/crm-automation.yml", import.meta.url), "utf8");

test("Visual Commerce is a first-class CRM experiment", () => {
  assert.match(memory, /"VISUAL_COMMERCE"/);
  assert.match(list, /VISUAL_COMMERCE/);
  assert.match(list, /Visual Commerce/);
  assert.match(list, /internal\/sales\/visual-commerce/);
});

test("Visual Commerce has its own profile schema", () => {
  assert.match(migration, /CREATE TABLE IF NOT EXISTS sales_visual_commerce_profiles/);
  assert.match(migration, /customer_type IN \('ECOMMERCE_BRAND','CREATOR','PUBLISHER','VIDEO_PLATFORM','RETAILER','CREATOR_NETWORK'\)/);
  assert.match(migration, /email_type IN \('DIRECT','DEPARTMENT','GENERAL','NOT_VERIFIED'\)/);
  assert.match(migration, /contact_source_url/);
  assert.match(store, /sales_visual_commerce_profiles/);
  assert.match(store, /organization\.rows\[0\]\.experiment !== "VISUAL_COMMERCE"/);
});

test("Visual Commerce detail does not render Carbon, tender, procurement or Web Services panels", () => {
  assert.match(detail, /Visual Commerce Opportunity/);
  assert.match(detail, /Existing affiliate activity/);
  assert.match(detail, /Email type/);
  assert.doesNotMatch(detail, /Carbon Projects/);
  assert.doesNotMatch(detail, /Methodology Version/);
  assert.doesNotMatch(detail, /VCS ID/);
  assert.doesNotMatch(detail, /VVB/);
  assert.doesNotMatch(detail, /Procurement Profile/);
  assert.doesNotMatch(detail, /Website opportunity/);
});

test("Visual Commerce CRM automation is routed through the existing OIDC workflow", () => {
  assert.match(workflow, /migrate-sales-visual-commerce-020/);
  assert.match(workflow, /crm-visual-commerce-migration/);
  assert.match(workflow, /upsert_visual_commerce_profile/);
  assert.match(workflow, /upsert_visual_commerce_contact/);
  assert.match(workflow, /crm-visual-commerce-automation/);
  assert.match(automation, /verifyGitHubActionsOidc/);
});

test("Visual Commerce CRM automation preserves experiment and status isolation", () => {
  assert.match(automation, /organization\.experiment !== "VISUAL_COMMERCE"/);
  assert.match(automation, /statusBefore/);
  assert.match(automation, /unexpectedly changed organization status/);
  assert.doesNotMatch(automation, /addSalesInteraction/);
});

test("Visual Commerce contact automation enforces verified email semantics", () => {
  assert.match(automation, /VISUAL_COMMERCE_EMAIL_TYPES/);
  assert.match(automation, /NOT_VERIFIED contacts must not store an email address/);
  assert.match(automation, /NOT_VERIFIED contacts cannot replace a contact that already has a verified email address/);
  assert.match(automation, /updateSalesVisualCommerceContact/);
});
