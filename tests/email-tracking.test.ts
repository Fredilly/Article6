import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyTrackingEvent,
  createTrackingToken,
  normalizeApprovedDestination,
  trackingTokenHash,
} from "../lib/email-tracking.ts";

test("tracking tokens are unique, opaque, and stable when hashed", () => {
  const first = createTrackingToken();
  const second = createTrackingToken();
  assert.notEqual(first, second);
  assert.ok(first.length >= 40);
  assert.match(first, /^[A-Za-z0-9_-]+$/);
  assert.equal(trackingTokenHash(first), trackingTokenHash(first));
  assert.notEqual(trackingTokenHash(first), trackingTokenHash(second));
});

test("approved click destinations are restricted to Article6 HTTPS domains", () => {
  assert.equal(normalizeApprovedDestination("https://bids.article6.org/request"), "https://bids.article6.org/request");
  assert.equal(normalizeApprovedDestination("https://article6.org"), "https://article6.org/");
  assert.throws(() => normalizeApprovedDestination("https://example.com/redirect"), /Article6-owned domain/);
  assert.throws(() => normalizeApprovedDestination("http://bids.article6.org"), /HTTPS/);
  assert.throws(() => normalizeApprovedDestination("https://article6.org.evil.example"), /Article6-owned domain/);
});

test("known scanner user agents are classified as automated likely", () => {
  assert.equal(classifyTrackingEvent({
    userAgent: "Proofpoint URL Defense Scanner",
    createdAt: "2026-08-30T09:00:00.000Z",
    occurredAt: "2026-08-30T09:01:00.000Z",
    eventType: "CLICK",
  }), "AUTOMATED_LIKELY");
});

test("activity within five seconds of token creation is classified as automated likely", () => {
  assert.equal(classifyTrackingEvent({
    userAgent: "Mozilla/5.0",
    createdAt: "2026-08-30T09:00:00.000Z",
    occurredAt: "2026-08-30T09:00:03.000Z",
    eventType: "OPEN",
  }), "AUTOMATED_LIKELY");
});

test("normal browser clicks after the immediate window are human likely", () => {
  assert.equal(classifyTrackingEvent({
    userAgent: "Mozilla/5.0 Chrome/145.0",
    createdAt: "2026-08-30T09:00:00.000Z",
    occurredAt: "2026-08-30T09:02:00.000Z",
    eventType: "CLICK",
  }), "HUMAN_LIKELY");
});
