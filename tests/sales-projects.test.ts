import assert from "node:assert/strict";
import test from "node:test";
import { canonicalSalesProjectName, normalizeSalesProjectOrganizationRole, normalizeSalesVcsId, rollUpSalesProjectStatus } from "../lib/sales-projects.ts";
import fs from "node:fs";

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

test("a closed stakeholder does not block an active outreach path", () => {
  assert.deepEqual(rollUpSalesProjectStatus([
    { status: "CLOSED_NO", doNotContact: false },
    { status: "ENGAGED", doNotContact: false },
  ]), { status: "ENGAGED", blocked: false });
});

test("outreach is blocked only when all live stakeholders are blocked", () => {
  assert.deepEqual(rollUpSalesProjectStatus([
    { status: "ENGAGED", doNotContact: false },
    { status: "CONTACTED", doNotContact: true },
  ]), { status: "ENGAGED", blocked: false });
  assert.deepEqual(rollUpSalesProjectStatus([
    { status: "ENGAGED", doNotContact: true },
    { status: "CONTACTED", doNotContact: true },
  ]), { status: "DO_NOT_CONTACT", blocked: true });
});

test("historical stakeholders do not affect project sales status", () => {
  assert.deepEqual(rollUpSalesProjectStatus([
    { status: "CLOSED_NO", doNotContact: false },
  ]), { status: "NEW", blocked: false });
  assert.deepEqual(rollUpSalesProjectStatus([
    { status: "CLOSED_NO", doNotContact: false },
    { status: "CONTACTED", doNotContact: false },
  ]), { status: "CONTACTED", blocked: false });
});

test("normalizes project organization roles into the controlled vocabulary", () => {
  assert.equal(normalizeSalesProjectOrganizationRole("Developer"), "DEVELOPER");
  assert.equal(normalizeSalesProjectOrganizationRole("Project Owner"), "OWNER");
  assert.equal(normalizeSalesProjectOrganizationRole("technical-consultant"), "CONSULTANT");
  assert.equal(normalizeSalesProjectOrganizationRole("PDD Writer"), "PDD_AUTHOR");
  assert.equal(normalizeSalesProjectOrganizationRole("VVB"), "VALIDATION_BODY");
  assert.equal(normalizeSalesProjectOrganizationRole("unrecognized role"), "OTHER");
});

test("carbon project creation deduplicates by VCS ID and organization/name", () => {
  const store = fs.readFileSync(new URL("../lib/sales-store.ts", import.meta.url), "utf8");
  const route = fs.readFileSync(new URL("../pages/api/internal/sales.ts", import.meta.url), "utf8");
  assert.match(store, /SELECT \* FROM sales_projects WHERE vcs_id = \$1 LIMIT 1/);
  assert.match(store, /LOWER\(TRIM\(p\.name\)\) = LOWER\(TRIM\(\$2\)\)/);
  assert.match(store, /UPDATE sales_projects/);
  assert.match(store, /ON CONFLICT \(organization_id, project_id\)/);
  assert.match(route, /projectDuplicate/);
});
