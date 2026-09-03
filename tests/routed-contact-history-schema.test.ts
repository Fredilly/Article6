import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("routed contact history uses canonical relationship presentation", () => {
  const component = fs.readFileSync(new URL("../components/SalesAutoRefresh.tsx", import.meta.url), "utf8");
  assert.match(component, /relationshipHistoryPresentation\(item\.direction, item\.intendedContactName/);
  assert.match(component, /presentation\.actorName/);
  assert.match(component, /presentation\.alignment/);
  assert.match(component, /presentation\.direction/);
});

test("contact relationship views do not run periodic router refreshes", () => {
  const component = fs.readFileSync(new URL("../components/SalesAutoRefresh.tsx", import.meta.url), "utf8");
  assert.match(component, /isRelationshipView/);
  assert.match(component, /isRelationshipView \? undefined : window\.setInterval/);
  assert.match(component, /if \(!isRelationshipView\)/);
});

test("routed history keeps routing metadata as message metadata, not a second schema", () => {
  const component = fs.readFileSync(new URL("../components/SalesAutoRefresh.tsx", import.meta.url), "utf8");
  assert.match(component, /Via: \$\{route\}/);
  assert.doesNotMatch(component, /Routed outreach/);
  assert.doesNotMatch(component, /bg-amber-50/);
});
