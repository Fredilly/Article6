import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { buildSubmissionRecord } from "../lib/submission-store.ts";
import { validateSubmissionMetadata } from "../lib/submissions.ts";

const base = {
  contactName: "Synthetic Contact",
  workEmail: "operator@example.test",
  organization: "Synthetic Organization",
  projectName: "Synthetic Project",
  methodology: "VM0007",
  submissionSource: "website" as const,
  fileName: "synthetic.pdf",
  fileSize: 1234,
};

test("legacy submissions remain valid without product routing fields", () => {
  assert.equal(validateSubmissionMetadata(base), null);
});

test("known product routing values are accepted and unknown values are rejected", () => {
  assert.equal(validateSubmissionMetadata({ ...base, submissionType: "CARBON", sourceSite: "carbon.article6.org" }), null);
  assert.equal(validateSubmissionMetadata({ ...base, submissionType: "TENDER", sourceSite: "bids.article6.org" }), null);
  assert.match(validateSubmissionMetadata({ ...base, submissionType: "OTHER" as never }) || "", /submission type/i);
  assert.match(validateSubmissionMetadata({ ...base, sourceSite: "evil.example" as never }) || "", /source site/i);
});

test("submission records default old traffic to Carbon on article6.org", () => {
  const record = buildSubmissionRecord({
    reference: "A6-20260824-ABC123",
    objectKey: "submissions/2026-08-24/123e4567-e89b-12d3-a456-426614174000.pdf",
    bucket: "private-bucket",
    originalFilename: "client.pdf",
    fileSize: 1234,
    contentType: "application/pdf",
    project: "Project",
    organization: "Organization",
    contactName: "Contact",
    submissionSource: "website",
    methodology: "VM0007",
    notes: "",
    createdAt: "2026-08-24T00:00:00.000Z",
  });
  assert.equal(record.submissionType, "CARBON");
  assert.equal(record.sourceSite, "article6.org");
  assert.deepEqual(record.productMetadata, {});
});

test("migration adds constrained product routing columns without replacing submissions", () => {
  const migration = fs.readFileSync(new URL("../migrations/013_submission_product_metadata.sql", import.meta.url), "utf8");
  assert.match(migration, /ALTER TABLE submissions/);
  assert.match(migration, /submission_type/);
  assert.match(migration, /source_site/);
  assert.match(migration, /product_metadata JSONB/);
  assert.match(migration, /'CARBON', 'TENDER'/);
  assert.doesNotMatch(migration, /CREATE TABLE submissions/);
});
