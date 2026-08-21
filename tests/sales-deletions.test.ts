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
