import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { groupSalesInteractions } from "../lib/sales-conversations.ts";
import { relationshipHistoryPresentation } from "../lib/sales-interaction-display.ts";
import { normalizeSalesInteractionTimestamp } from "../lib/sales-timestamps.ts";
import type { SalesInteraction } from "../lib/sales-store.ts";

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
  assert.match(store, /ORDER BY COALESCE\(i\.occurred_at, i\.created_at\) ASC, i\.created_at ASC/);
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

test("interaction timestamps normalize to UTC without changing chronology", () => {
  assert.equal(normalizeSalesInteractionTimestamp("2026-08-21T10:00:00+08:00"), "2026-08-21T02:00:00.000Z");
  assert.equal(normalizeSalesInteractionTimestamp("1787278800000"), "2026-08-21T02:20:00.000Z");
});

test("Gmail thread timestamps preserve multiple sends before a timezone-offset reply", () => {
  const thread = [
    { subject: "Reply", gmailTimestamp: "2026-08-21T10:05:00+08:00" },
    { subject: "First send", gmailTimestamp: "2026-08-21T01:00:00Z" },
    { subject: "Second send", gmailTimestamp: "2026-08-21T01:30:00Z" },
  ];
  const ordered = [...thread].sort((a, b) => normalizeSalesInteractionTimestamp(a.gmailTimestamp).localeCompare(normalizeSalesInteractionTimestamp(b.gmailTimestamp)));
  assert.deepEqual(ordered.map((message) => message.subject), ["First send", "Second send", "Reply"]);
});

test("imported Gmail timestamps take precedence over fallback occurredAt", () => {
  const importer = fs.readFileSync(new URL("../lib/sales-import-store.ts", import.meta.url), "utf8");
  assert.match(importer, /normalizeSalesInteractionTimestamp\(interaction\.gmailTimestamp \?\? interaction\.occurredAt\)/);
});

test("history orders by interaction time and only falls back to created_at", () => {
  const store = fs.readFileSync(new URL("../lib/sales-store.ts", import.meta.url), "utf8");
  assert.match(store, /ORDER BY COALESCE\(i\.occurred_at, i\.created_at\) ASC, i\.created_at ASC/);
  assert.doesNotMatch(store, /ORDER BY i\.created_at ASC/);
});

function interaction(id: string, contactId: string, contactName: string, occurredAt: string, summary: string, gmailThreadId?: string, subject = "Fred outreach"): SalesInteraction {
  return { id, organizationId: "org", contactId, contactName, channel: "EMAIL", direction: summary.startsWith("Fred") ? "OUTBOUND" : "INBOUND", interactionType: "MESSAGE", occurredAt, subject, summary, gmailThreadId };
}

test("separate Gmail threads at one organization never mix contacts", () => {
  const conversations = groupSalesInteractions([
    interaction("v1", "vijay", "Vijay", "2026-08-21T09:00:00.000Z", "Fred outreach", "thread-vijay"),
    interaction("s1", "samrat", "Samrat", "2026-08-21T09:05:00.000Z", "Fred outreach", "thread-samrat"),
    interaction("v2", "vijay", "Vijay", "2026-08-21T09:10:00.000Z", "Vijay reply", "thread-vijay"),
  ]);
  assert.deepEqual(conversations.map((conversation) => conversation.contactName), ["Vijay", "Samrat"]);
  assert.deepEqual(conversations[0]?.interactions.map((message) => message.id), ["v1", "v2"]);
  assert.deepEqual(conversations[1]?.interactions.map((message) => message.id), ["s1"]);
});

test("legacy rows infer a thread only for the same contact and nearby subject", () => {
  const conversations = groupSalesInteractions([
    interaction("v1", "vijay", "Vijay", "2026-08-21T09:00:00.000Z", "Fred outreach"),
    interaction("s1", "samrat", "Samrat", "2026-08-21T09:05:00.000Z", "Fred outreach"),
    interaction("v2", "vijay", "Vijay", "2026-08-21T09:10:00.000Z", "Vijay reply", undefined, "Re: Fred outreach"),
  ]);
  assert.equal(conversations.length, 2);
  assert.deepEqual(conversations.find((conversation) => conversation.contactName === "Vijay")?.interactions.map((message) => message.id), ["v1", "v2"]);
  assert.deepEqual(conversations.find((conversation) => conversation.contactName === "Samrat")?.interactions.map((message) => message.id), ["s1"]);
});

test("legacy reply subjects with separators and prefixes stay in one conversation", () => {
  const conversations = groupSalesInteractions([
    interaction("v1", "vijay", "Vijay", "2026-08-21T09:00:00.000Z", "Fred outreach", undefined, "HIM Evergreen / VCS 5973 — validation readiness"),
    interaction("v2", "vijay", "Vijay", "2026-08-21T09:10:00.000Z", "Vijay reply", undefined, "Re: HIM Evergreen / VCS 5973 validation readiness"),
  ]);
  assert.equal(conversations.length, 1);
  assert.deepEqual(conversations[0]?.interactions.map((message) => message.id), ["v1", "v2"]);
});

test("a legacy Gmail conversation can span more than 72 hours", () => {
  const conversations = groupSalesInteractions([
    interaction("v1", "vijay", "Vijay", "2026-08-16T06:59:12.000Z", "Fred outreach", undefined, "HIM Evergreen / VCS 5973 — validation readiness"),
    interaction("v2", "vijay", "Vijay", "2026-08-20T10:30:23.000Z", "Fred sample", undefined, "Re: HIM Evergreen / VCS 5973 — validation readiness"),
    interaction("v3", "vijay", "Vijay", "2026-08-20T11:09:17.000Z", "Vijay reply", undefined, "HIM Evergreen / VCS 5973 validation readiness"),
  ]);
  assert.equal(conversations.length, 1);
  assert.deepEqual(conversations[0]?.interactions.map((message) => message.id), ["v1", "v2", "v3"]);
});

test("an unlinked inbound message joins the only nearby matching contact thread", () => {
  const unlinked = interaction("v2", "", "", "2026-08-21T09:10:00.000Z", "Vijay reply", undefined, "Re: HIM Evergreen / VCS 5973 validation readiness");
  unlinked.contactId = undefined;
  unlinked.contactName = undefined;
  const conversations = groupSalesInteractions([
    interaction("v1", "vijay", "Vijay", "2026-08-21T09:00:00.000Z", "Fred outreach", undefined, "HIM Evergreen / VCS 5973 — validation readiness"),
    unlinked,
  ]);
  assert.equal(conversations.length, 1);
  assert.equal(conversations[0]?.contactName, "Vijay");
  assert.deepEqual(conversations[0]?.interactions.map((message) => message.id), ["v1", "v2"]);
});

test("unlinked messages remain separate when nearby threads are ambiguous", () => {
  const unlinked = interaction("reply", "", "", "2026-08-21T09:10:00.000Z", "Reply", undefined, "Re: Shared subject");
  unlinked.contactId = undefined;
  unlinked.contactName = undefined;
  const conversations = groupSalesInteractions([
    interaction("vijay", "vijay", "Vijay", "2026-08-21T09:00:00.000Z", "Outreach", undefined, "Shared subject"),
    interaction("samrat", "samrat", "Samrat", "2026-08-21T09:01:00.000Z", "Outreach", undefined, "Shared subject"),
    unlinked,
  ]);
  assert.equal(conversations.length, 3);
  assert.equal(conversations[2]?.contactName, undefined);
});
