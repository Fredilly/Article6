import test from "node:test";
import assert from "node:assert/strict";
import { normalizeRecord, scoreRecord } from "../scripts/knowledge-lib.mjs";

test("normalizes a knowledge record with stable provenance metadata", () => {
  const record = normalizeRecord({
    id: "example-1",
    kind: "interaction",
    title: "Reply from prospect",
    content: "We handle final review internally.",
    source: { type: "gmail", ref: "message-123" },
    certainty: "confirmed",
    links: { organizationId: "org-1" },
    tags: ["objection", "internal-team", "objection"],
    occurredAt: "2026-08-30T10:00:00Z",
    capturedAt: "2026-08-30T10:05:00Z"
  });

  assert.equal(record.id, "example-1");
  assert.equal(record.certainty, "CONFIRMED");
  assert.deepEqual(record.tags, ["objection", "internal-team"]);
  assert.equal(record.source.ref, "message-123");
});

test("rejects unsupported knowledge kinds", () => {
  assert.throws(() => normalizeRecord({ kind: "guess", title: "x", content: "y" }), /Invalid kind/);
});

test("search scoring favors title matches", () => {
  const record = normalizeRecord({
    id: "tender-1",
    kind: "tender",
    title: "HRI Network Security",
    content: "Irish public procurement opportunity",
    certainty: "PROBABLE"
  });

  assert.ok(scoreRecord(record, "HRI security") > scoreRecord(record, "Irish"));
});
