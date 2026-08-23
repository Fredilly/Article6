import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { hasDeleteConfirmation } from "../lib/sales-destructive-actions.ts";

test("delete confirmation requires only the word delete", () => {
  assert.equal(hasDeleteConfirmation("delete"), true);
  assert.equal(hasDeleteConfirmation(" DELETE "), true);
  assert.equal(hasDeleteConfirmation("deleted"), false);
  assert.equal(hasDeleteConfirmation(""), false);
});

test("sales delete actions are authenticated and confirmation-gated", () => {
  const route = fs.readFileSync(new URL("../pages/api/internal/sales.ts", import.meta.url), "utf8");
  assert.match(route, /hasInternalUploadSession/);
  assert.match(route, /action === "delete_contact"/);
  assert.match(route, /action === "delete_interaction"/);
  assert.match(route, /hasDeleteConfirmation/);
});

test("contact deletion warns and requires typing delete", () => {
  const page = fs.readFileSync(new URL("../pages/internal/sales/organizations/[id].tsx", import.meta.url), "utf8");
  assert.match(page, /Warning: this removes the contact\./);
  assert.match(page, /pattern="\[Dd\]\[Ee\]\[Ll\]\[Ee\]\[Tt\]\[Ee\]"/);
});

test("sales deletions are scoped to the organization", () => {
  const store = fs.readFileSync(new URL("../lib/sales-store.ts", import.meta.url), "utf8");
  assert.match(store, /DELETE FROM sales_contacts WHERE id = \$1 AND organization_id = \$2/);
  assert.match(store, /DELETE FROM sales_interactions WHERE id = \$1 AND organization_id = \$2/);
});

test("project deletion is confirmation-gated, transactional, and preserves non-project records", () => {
  const route = fs.readFileSync(new URL("../pages/api/internal/sales.ts", import.meta.url), "utf8");
  const store = fs.readFileSync(new URL("../lib/sales-store.ts", import.meta.url), "utf8");
  const page = fs.readFileSync(new URL("../pages/internal/sales/organizations/[id].tsx", import.meta.url), "utf8");
  assert.match(route, /action === "delete_project"/);
  assert.match(store, /SELECT 1 FROM sales_organization_projects WHERE organization_id = \$1 AND project_id = \$2 FOR UPDATE/);
  assert.match(store, /UPDATE sales_interactions SET project_id = NULL/);
  assert.match(store, /DELETE FROM sales_project_documents WHERE project_id = \$1/);
  assert.match(store, /DELETE FROM sales_project_contacts WHERE project_id = \$1/);
  assert.match(store, /DELETE FROM sales_organization_projects WHERE project_id = \$1/);
  assert.match(store, /DELETE FROM sales_projects WHERE id = \$1 RETURNING id/);
  assert.match(page, /role="dialog"/);
  assert.match(page, /Linked organization relationships, project contacts, documents/);
  assert.match(page, /The organization and contacts will be preserved/);
});
