import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const memory = fs.readFileSync(new URL("../lib/sales-memory.ts", import.meta.url), "utf8");
const salesIndex = fs.readFileSync(new URL("../pages/internal/sales/index.tsx", import.meta.url), "utf8");
const organizationsTable = fs.readFileSync(new URL("../components/SalesOrganizationsTable.tsx", import.meta.url), "utf8");
const migration = fs.readFileSync(new URL("../migrations/018_sales_web_services.sql", import.meta.url), "utf8");
const route = fs.readFileSync(new URL("../pages/api/internal/crm-web-services-migration.ts", import.meta.url), "utf8");

 test("Web Services is a first-class CRM experiment", () => {
  assert.match(memory, /"WEB_SERVICES"/);
  assert.match(salesIndex, /WEB_SERVICES.*Web Services/);
  assert.match(organizationsTable, /value="WEB_SERVICES">Web Services/);
});

test("web-service profile keeps the sprint data small and structured", () => {
  assert.match(migration, /CREATE TABLE IF NOT EXISTS sales_web_service_profiles/);
  assert.match(migration, /service_hypotheses TEXT\[\]/);
  assert.match(migration, /GEO_VISIBILITY/);
  assert.match(migration, /WEBSITE_REDESIGN/);
  assert.match(migration, /ai_query_tested/);
  assert.match(migration, /competitors_appearing/);
  assert.match(migration, /website_observation/);
});

test("initial UAE cohort seeds 20 NEW Web Services organizations and contacts", () => {
  const orgSeeds = migration.match(/'WEB_SERVICES',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP\)/g) || [];
  assert.equal(orgSeeds.length, 20);
  const contactSeeds = migration.match(/'ACTIVE'/g) || [];
  assert.equal(contactSeeds.length, 20);
  assert.match(route, /018_sales_web_services\.sql/);
});
