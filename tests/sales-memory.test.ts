import assert from "node:assert/strict";
import test from "node:test";
import {
  isSalesObjectionCode,
  isSalesOrganizationStatus,
  normalizeDomain,
  normalizeOrganizationName,
} from "../lib/sales-memory.ts";

test("normalizes organization names for duplicate detection", () => {
  assert.equal(normalizeOrganizationName("  Terraformation   Inc  "), "terraformation inc");
});

test("normalizes domains consistently", () => {
  assert.equal(normalizeDomain("https://www.Terraformation.com/projects"), "terraformation.com");
  assert.equal(normalizeDomain("  terraformation.com  "), "terraformation.com");
  assert.equal(normalizeDomain(""), null);
});

test("accepts only known organization statuses", () => {
  assert.equal(isSalesOrganizationStatus("NURTURE"), true);
  assert.equal(isSalesOrganizationStatus("REJECTED_FOREVER"), false);
});

test("accepts only known objection codes", () => {
  assert.equal(isSalesObjectionCode("INTERNAL_TEAM"), true);
  assert.equal(isSalesObjectionCode("SOMETHING_ELSE"), false);
});
