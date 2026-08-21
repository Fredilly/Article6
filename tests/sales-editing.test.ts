import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("internal sales API supports contact and project edits", () => {
  const route = fs.readFileSync(new URL("../pages/api/internal/sales.ts", import.meta.url), "utf8");
  assert.match(route, /action === "update_contact"/);
  assert.match(route, /action === "update_project"/);
  assert.match(route, /updateSalesContact/);
  assert.match(route, /updateSalesProject/);
});

test("contact and project edits are scoped to the selected organization", () => {
  const store = fs.readFileSync(new URL("../lib/sales-store.ts", import.meta.url), "utf8");
  assert.match(store, /UPDATE sales_contacts[\s\S]*WHERE id=\$1 AND organization_id=\$2/);
  assert.match(store, /SELECT 1 FROM sales_organization_projects WHERE organization_id=\$1 AND project_id=\$2/);
});

test("conversation threads do not render an interaction delete control", () => {
  const page = fs.readFileSync(new URL("../pages/internal/sales/organizations/[id].tsx", import.meta.url), "utf8");
  assert.doesNotMatch(page, /name="action" value="delete_interaction"/);
  assert.match(page, /name="action" value="update_contact"/);
  assert.match(page, /name="action" value="update_project"/);
});
