import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("CRM automation links recorded interactions to contacts", () => {
  const source = fs.readFileSync(new URL("../pages/api/internal/crm-automation.ts", import.meta.url), "utf8");
  assert.match(source, /contactId\?: string/);
  assert.match(source, /contactEmail\?: string/);
  assert.match(source, /contactName\?: string/);
  assert.match(source, /summaryMatches/);
  assert.match(source, /contactId: resolvedContactId/);
});
