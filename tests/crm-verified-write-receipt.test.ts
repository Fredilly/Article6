import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("CRM interaction write returns a database-verified receipt", () => {
  const source = fs.readFileSync(new URL("../pages/api/internal/crm-automation.ts", import.meta.url), "utf8");
  assert.match(source, /const verifiedInteraction = externalReference/);
  assert.match(source, /const verifiedContact = verifiedInteraction\.contactId/);
  assert.match(source, /CRM email interaction verification failed/);
  assert.match(source, /interactionId: verifiedInteraction\.id/);
  assert.match(source, /contactEmail: verifiedContact\?\.email \|\| null/);
  assert.match(source, /verifiedFromDatabase: true/);
});
