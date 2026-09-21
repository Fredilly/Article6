import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const route = fs.readFileSync("pages/api/geo-score-intake.ts", "utf8");
const store = fs.readFileSync("lib/geo-score-intake.ts", "utf8");

test("GEO Score intake is protected by a server-to-server secret", () => {
  assert.match(route, /GEO_SCORE_INTAKE_SECRET/);
  assert.match(route, /timingSafeEqual/);
  assert.match(route, /status\(401\)/);
});

test("GEO Score intake maps leads into WEB_SERVICES and GEO_VISIBILITY", () => {
  assert.match(store, /experiment = 'WEB_SERVICES'/);
  assert.match(store, /'WEB_SERVICES', 'ENGAGED'/);
  assert.match(store, /ARRAY\['GEO_VISIBILITY'\]/);
  assert.match(store, /primary_service = 'GEO_VISIBILITY'/);
});

test("GEO Score intake records inbound website interaction and idempotency key", () => {
  assert.match(store, /'WEBSITE', 'INBOUND', 'CONTACT_FORM'/);
  assert.match(store, /external_reference/);
  assert.match(store, /geo-score:/);
});

test("GEO Score intake preserves diagnostic metadata", () => {
  for (const token of ["Overall score", "Category scores", "Top findings", "Scoring version", "Analyzed at"]) {
    assert.match(store, new RegExp(token));
  }
});
