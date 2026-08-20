import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { relationshipHistoryPresentation } from "../lib/sales-interaction-display.ts";

test("outbound history uses Fred E. even when a contact is attached", () => {
  assert.deepEqual(relationshipHistoryPresentation("OUTBOUND", "John Kealy"), { direction: "OUTBOUND", actorName: "Fred E.", alignment: "right", recipient: "John Kealy" });
});

test("inbound history uses the contact name", () => {
  assert.deepEqual(relationshipHistoryPresentation("INBOUND", "Vijayakumar Rangaraju"), { direction: "INBOUND", actorName: "Vijayakumar Rangaraju", alignment: "left", recipient: undefined });
});

test("mixed conversations alternate sides and actors by direction", () => {
  const history = [
    { direction: "inbound", contactName: "Vijayakumar Rangaraju" },
    { direction: "outbound", contactName: "Vijayakumar Rangaraju" },
    { direction: "INBOUND", contactName: "Vijayakumar Rangaraju" },
  ];
  assert.deepEqual(history.map((interaction) => relationshipHistoryPresentation(interaction.direction, interaction.contactName)), [
    { direction: "INBOUND", actorName: "Vijayakumar Rangaraju", alignment: "left", recipient: undefined },
    { direction: "OUTBOUND", actorName: "Fred E.", alignment: "right", recipient: "Vijayakumar Rangaraju" },
    { direction: "INBOUND", actorName: "Vijayakumar Rangaraju", alignment: "left", recipient: undefined },
  ]);
});

test("relationship history query returns chronological order without a render-time reverse", () => {
  const store = fs.readFileSync(new URL("../lib/sales-store.ts", import.meta.url), "utf8");
  assert.match(store, /ORDER BY i\.occurred_at ASC, i\.created_at ASC/);
  assert.doesNotMatch(store, /ORDER BY i\.occurred_at DESC, i\.created_at DESC/);
});

test("inbound history does not expose a second recipient identity", () => {
  const inbound = relationshipHistoryPresentation("INBOUND", "Vijayakumar Rangaraju");
  assert.equal(inbound.recipient, undefined);
});

test("conversation cards do not render sender labels or recipient metadata", () => {
  const page = fs.readFileSync(new URL("../pages/internal/sales/organizations/[id].tsx", import.meta.url), "utf8");
  assert.doesNotMatch(page, /Author:/);
  assert.doesNotMatch(page, /To: \$\{/);
  assert.doesNotMatch(page, /relationshipDetails/);
});
