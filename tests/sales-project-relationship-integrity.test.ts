import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const migration = fs.readFileSync(new URL("../migrations/012_carbon_project_relationship_integrity.sql", import.meta.url), "utf8");
const baseSchema = fs.readFileSync(new URL("../migrations/003_create_sales_memory.sql", import.meta.url), "utf8");
const store = fs.readFileSync(new URL("../lib/sales-store.ts", import.meta.url), "utf8");
const route = fs.readFileSync(new URL("../pages/api/internal/sales.ts", import.meta.url), "utf8");
const page = fs.readFileSync(new URL("../pages/internal/sales/organizations/[id].tsx", import.meta.url), "utf8");

test("keeps the existing many-to-many project organization relationship", () => {
  assert.match(migration, /sales_organization_projects_role_check/);
  assert.match(baseSchema, /PRIMARY KEY \(organization_id, project_id\)/);
  assert.match(store, /JOIN sales_organization_projects op ON op\.project_id = p\.id/);
  assert.match(store, /INSERT INTO sales_organization_projects/);
  assert.match(store, /ON CONFLICT \(organization_id, project_id\)/);
});

test("adds project-specific contacts without moving organization ownership", () => {
  assert.match(migration, /CREATE TABLE IF NOT EXISTS sales_project_contacts/);
  assert.match(migration, /project_id UUID NOT NULL REFERENCES sales_projects/);
  assert.match(migration, /contact_id UUID NOT NULL REFERENCES sales_contacts/);
  assert.match(store, /export async function addSalesProjectContact/);
  assert.match(store, /JOIN sales_organization_projects op ON op\.organization_id = c\.organization_id/);
  assert.match(route, /action === "add_project_contact"/);
  assert.match(page, /Project contacts/);
});

test("prevents disconnected carbon project interactions", () => {
  assert.match(migration, /sales_interactions_project_organization_fk/);
  assert.match(migration, /REFERENCES sales_organization_projects \(organization_id, project_id\)/);
  assert.match(store, /Project is not linked to this organization/);
  assert.match(store, /SELECT 1 FROM sales_organization_projects WHERE organization_id = \$1 AND project_id = \$2/);
});

test("carbon relationship migration does not modify tender models", () => {
  assert.doesNotMatch(migration, /sales_tender/);
});
