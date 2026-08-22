import assert from "node:assert/strict";
import test from "node:test";
import { canonicalSalesProjectName, normalizeSalesVcsId, rollUpSalesProjectStatus } from "../lib/sales-projects.ts";

test("normalizes VCS IDs and preserves a canonical project title", () => {
  assert.equal(normalizeSalesVcsId(" VCS 5075 "), "5075");
  assert.equal(canonicalSalesProjectName("5075", "Liza Protect Forest"), "VCS 5075 · Liza Protect Forest");
  assert.equal(canonicalSalesProjectName("5663", "VCS 5663 · Lam Son"), "VCS 5663 · Lam Son");
  assert.equal(canonicalSalesProjectName(undefined, " Project "), "Project");
});

test("project roll-up uses the strongest live status", () => {
  assert.deepEqual(rollUpSalesProjectStatus([
    { status: "CONTACTED", doNotContact: false },
    { status: "ENGAGED", doNotContact: false },
  ]), { status: "ENGAGED", blocked: false });
});

test("closed or do-not-contact stakeholders block the whole project", () => {
  assert.deepEqual(rollUpSalesProjectStatus([
    { status: "ENGAGED", doNotContact: false },
    { status: "CONTACTED", doNotContact: true },
  ]), { status: "DO_NOT_CONTACT", blocked: true });
  assert.deepEqual(rollUpSalesProjectStatus([
    { status: "ENGAGED", doNotContact: false },
    { status: "CLOSED_NO", doNotContact: false },
  ]), { status: "CLOSED_NO", blocked: true });
});
