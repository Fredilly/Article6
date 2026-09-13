import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const memory = fs.readFileSync(new URL("../lib/sales-memory.ts", import.meta.url), "utf8");
const migration = fs.readFileSync(new URL("../migrations/020_sales_visual_commerce.sql", import.meta.url), "utf8");
const store = fs.readFileSync(new URL("../lib/sales-visual-commerce.ts", import.meta.url), "utf8");
const list = fs.readFileSync(new URL("../components/SalesOrganizationsTable.tsx", import.meta.url), "utf8");
const detail = fs.readFileSync(new URL("../pages/internal/sales/visual-commerce/[id].tsx", import.meta.url), "utf8");

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
