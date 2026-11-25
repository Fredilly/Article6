import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  buildWebLeadSummary,
  matchesDomain,
  matchesOrganization,
  validateWebLeadBatch,
  webLeadDomain,
  webLeadKey,
  WEB_LEAD_SERVICES,
} from "../lib/web-lead-ingest.ts";

const route = fs.readFileSync(new URL("../pages/api/partner/web-lead-ingest.ts", import.meta.url), "utf8");
const helpers = fs.readFileSync(new URL("../lib/web-lead-ingest.ts", import.meta.url), "utf8");

function lead(overrides: Record<string, unknown> = {}) {
  return {
    company: "Gulf Power Services LLC",
    website: "https://www.gulfpower.example/about",
    sourceUrl: "https://example.com/directory/gulf-power",
    sourceTitle: "Gulf industrial services directory",
    evidence: "Site lists 12 service pages but no AI-readable schema; competitors appear in AI answers.",
    nextAction: "Verify decision maker and send a short GEO audit.",
    ...overrides,
  };
}

function fields(errors: Array<{ index: number; field: string }>) {
  return errors.map((error) => `${error.index}:${error.field}`);
}

test("valid payload is accepted and normalised", () => {
  const result = validateWebLeadBatch({
    leads: [
      lead({
        company: "  Gulf Power Services LLC  ",
        contactName: " Dana Al Mansoori ",
        contactEmail: " Dana@GulfPower.example ",
        country: "United Arab Emirates",
        service: "GEO_VISIBILITY",
      }),
    ],
  });
  assert.equal(result.ok, true);
  assert.ok(result.ok);
  assert.equal(result.leads.length, 1);
  const accepted = result.leads[0];
  assert.equal(accepted.company, "Gulf Power Services LLC");
  assert.equal(accepted.contactEmail, "dana@gulfpower.example");
  assert.equal(accepted.service, "GEO_VISIBILITY");
  assert.equal(accepted.website, "https://www.gulfpower.example/about");
  assert.equal(accepted.nextAction, "Verify decision maker and send a short GEO audit.");
});

test("missing required field is reported with its lead index and field name", () => {
  const payload = lead();
  delete (payload as Record<string, unknown>).evidence;
  const result = validateWebLeadBatch({ leads: [lead(), payload] });
  assert.equal(result.ok, false);
  assert.ok(!result.ok);
  assert.deepEqual(fields(result.errors), ["1:evidence"]);
  assert.match(result.errors[0].message, /Required/);
});

test("bad email address is rejected", () => {
  const result = validateWebLeadBatch({ leads: [lead({ contactEmail: "dana(at)gulfpower.example" })] });
  assert.equal(result.ok, false);
  assert.ok(!result.ok);
  assert.deepEqual(fields(result.errors), ["0:contactEmail"]);
});

test("http:// urls are rejected for website and sourceUrl", () => {
  const insecureSite = validateWebLeadBatch({ leads: [lead({ website: "http://gulfpower.example" })] });
  assert.equal(insecureSite.ok, false);
  assert.ok(!insecureSite.ok);
  assert.deepEqual(fields(insecureSite.errors), ["0:website"]);

  const insecureSource = validateWebLeadBatch({
    leads: [lead({ sourceUrl: "http://example.com/directory/gulf-power" })],
  });
  assert.equal(insecureSource.ok, false);
  assert.ok(!insecureSource.ok);
  assert.deepEqual(fields(insecureSource.errors), ["0:sourceUrl"]);
});

test("more than ten leads is rejected before any per-lead work", () => {
  const eleven = Array.from({ length: 11 }, (_, index) => lead({ company: `Prospect ${index}` }));
  const result = validateWebLeadBatch({ leads: eleven });
  assert.equal(result.ok, false);
  assert.ok(!result.ok);
  assert.deepEqual(fields(result.errors), ["-1:leads"]);
  assert.match(result.errors[0].message, /At most 10 leads/);
});

test("duplicate domain is detected independently of company spelling", () => {
  const first = lead({ company: "Gulf Power Services LLC", website: "https://www.gulfpower.example" });
  const second = lead({ company: "GULF POWER SERVICES", website: "https://gulfpower.example/contact" });
  assert.equal(webLeadKey(first), "domain:gulfpower.example");
  assert.equal(webLeadKey(first), webLeadKey(second));
  assert.equal(webLeadDomain("https://www.GulfPower.example/about"), "gulfpower.example");

  const organization = { name: "Gulf Power Services", domain: "gulfpower.example" };
  assert.equal(matchesOrganization(first, organization), true);
  assert.equal(matchesOrganization(second, organization), true);
  assert.equal(matchesDomain("gulfpower.example", organization), true);
  assert.equal(matchesDomain("gulfpower.example", { name: "Other", domain: "other.example" }), false);
  assert.equal(
    matchesOrganization(lead({ company: "Unrelated Ltd", website: "https://unrelated.example" }), organization),
    false,
  );
});

test("service hypotheses reject UNKNOWN and unknown keys are not silently accepted", () => {
  const unknownService = validateWebLeadBatch({ leads: [lead({ service: "UNKNOWN" })] });
  assert.equal(unknownService.ok, false);
  assert.ok(!unknownService.ok);
  assert.deepEqual(fields(unknownService.errors), ["0:service"]);
  assert.deepEqual([...WEB_LEAD_SERVICES], ["GEO_VISIBILITY", "WEBSITE_REDESIGN"]);

  const extraField = validateWebLeadBatch({ leads: [lead({ profileSource: "CLIENT_REPORTED" })] });
  assert.equal(extraField.ok, false);
  assert.ok(!extraField.ok);
  assert.deepEqual(fields(extraField.errors), ["0:profileSource"]);
});

test("envelope problems are reported, not guessed at", () => {
  assert.equal(validateWebLeadBatch({ leads: [] }).ok, false);
  assert.equal(validateWebLeadBatch({ leads: "nope" }).ok, false);
  assert.equal(validateWebLeadBatch({ lead: [lead()] }).ok, false);
  assert.equal(validateWebLeadBatch(null).ok, false);
});

test("interaction summary keeps the source evidence and next action", () => {
  const summary = buildWebLeadSummary(lead() as never);
  assert.match(summary, /Gulf Power Services LLC/);
  assert.match(summary, /https:\/\/example\.com\/directory\/gulf-power/);
  assert.match(summary, /Site lists 12 service pages/);
  assert.match(summary, /Next action: Verify decision maker/);
});

test("route is guarded by its own bearer token and does not reuse sibling secrets", () => {
  assert.match(route, /WEB_LEAD_INGEST_TOKEN/);
  assert.match(route, /timingSafeEqual/);
  assert.match(route, /status\(401\)/);
  assert.match(route, /status\(405\)/);
  assert.match(route, /status\(409\)/);
  assert.match(route, /Existing company belongs to another CRM category\. Internal review required\./);
  assert.doesNotMatch(route, /WEB_REFERRAL_INGEST_TOKEN/);
  assert.doesNotMatch(route, /GEO_SCORE_INTAKE_SECRET/);
  assert.doesNotMatch(route, /console\.log\([^)]*token/i);
});

test("route records outbound researched leads as NEW WEB_SERVICES notes", () => {
  assert.match(route, /experiment: "WEB_SERVICES"/);
  assert.match(route, /channel: "OTHER"/);
  assert.match(route, /direction: "OUTBOUND"/);
  assert.match(route, /interactionType: "NOTE"/);
  assert.match(route, /serviceHypotheses: \[lead\.service\]/);
  assert.doesNotMatch(route, /profile_source|profileSource/);
  assert.doesNotMatch(route, /status: "ENGAGED"|updateSalesOrganizationState/);
  assert.doesNotMatch(route, /direction: "INBOUND"/);
});

test("route writes only through existing sales-store and sales-web-services functions", () => {
  assert.match(route, /from "\.\.\/\.\.\/\.\.\/lib\/sales-store"/);
  assert.match(route, /from "\.\.\/\.\.\/\.\.\/lib\/sales-web-services"/);
  assert.doesNotMatch(route, /from "pg"/);
  assert.doesNotMatch(helpers, /from "pg"/);
  assert.doesNotMatch(helpers, /from "next"/);
});
