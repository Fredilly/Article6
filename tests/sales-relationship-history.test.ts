import assert from "node:assert/strict";
import test from "node:test";
import { relationshipHistoryActor } from "../lib/sales-interaction-display.ts";

test("outbound history uses Fred E. even when a contact is attached", () => {
  assert.equal(relationshipHistoryActor("OUTBOUND", "John Kealy"), "Fred E.");
});

test("inbound history uses the contact name", () => {
  assert.equal(relationshipHistoryActor("INBOUND", "Vijayakumar Rangaraju"), "Vijayakumar Rangaraju");
});

test("mixed conversations alternate actors by direction", () => {
  const history = [
    { direction: "OUTBOUND", contactName: "Vijayakumar Rangaraju" },
    { direction: "INBOUND", contactName: "Vijayakumar Rangaraju" },
    { direction: "OUTBOUND", contactName: "Vijayakumar Rangaraju" },
  ];
  assert.deepEqual(history.map((interaction) => relationshipHistoryActor(interaction.direction, interaction.contactName)), ["Fred E.", "Vijayakumar Rangaraju", "Fred E."]);
});
