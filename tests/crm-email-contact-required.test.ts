import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("CRM automation refuses unlinked email interactions", () => {
  const source = fs.readFileSync(new URL("../pages/api/internal/crm-automation.ts", import.meta.url), "utf8");
  assert.match(source, /channel === "EMAIL" && !resolvedContactId/);
  assert.match(source, /Email interaction requires a resolvable CRM contact/);
  assert.match(source, /exact Gmail recipient as contactEmail/);
});
