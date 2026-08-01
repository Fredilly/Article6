import assert from "node:assert/strict";
import test from "node:test";
import { buildEmailText } from "../lib/email.ts";
import {
  isApprovedSubmissionKey,
  isPdfUpload,
  MAX_FILE_SIZE,
  validateStoredObject,
  validateSubmissionMetadata,
} from "../lib/submissions.ts";

const base = {
  contactName: "Synthetic Contact",
  organization: "Synthetic Organization",
  projectName: "Synthetic Project",
  methodology: "Synthetic Methodology",
  fileName: "synthetic.pdf",
  fileSize: 1234,
};

test("internal WhatsApp submission may omit workEmail", () => {
  assert.equal(validateSubmissionMetadata({ ...base, submissionSource: "whatsapp" }), null);
});

test("website submission requires a work email", () => {
  assert.match(validateSubmissionMetadata({ ...base, submissionSource: "website" }) || "", /email/i);
});

test("optional email is validated when supplied", () => {
  assert.match(validateSubmissionMetadata({ ...base, submissionSource: "internal", workEmail: "not-an-email" }) || "", /email/i);
  assert.equal(validateSubmissionMetadata({ ...base, submissionSource: "internal", workEmail: "operator@example.test" }), null);
});

test("file size boundaries, empty files, and content type are enforced", () => {
  assert.equal(validateSubmissionMetadata({ ...base, submissionSource: "internal", fileSize: MAX_FILE_SIZE - 1 }), null);
  assert.match(validateSubmissionMetadata({ ...base, submissionSource: "internal", fileSize: MAX_FILE_SIZE + 1 }) || "", /50MB/i);
  assert.match(isPdfUpload({ type: "application/pdf", size: 0 }) || "", /empty/i);
  assert.match(isPdfUpload({ type: "text/plain", size: 10 }) || "", /PDF/i);
});

test("invalid submission source is rejected", () => {
  assert.match(validateSubmissionMetadata({ ...base, submissionSource: "fax" as never }) || "", /source/i);
});

test("only opaque submission keys are approved", () => {
  assert.equal(isApprovedSubmissionKey("submissions/2026-08-01/123e4567-e89b-12d3-a456-426614174000.pdf"), true);
  assert.equal(isApprovedSubmissionKey("other/2026-08-01/123e4567-e89b-12d3-a456-426614174000.pdf"), false);
  assert.equal(isApprovedSubmissionKey("submissions/2026-08-01/123e4567-e89b-12d3-a456-426614174000-client.pdf"), false);
});

test("confirmation rejects missing, mismatched, oversized, and non-PDF objects", () => {
  assert.match(validateStoredObject({ exists: false, size: 0 }, 1) || "", /not found/i);
  assert.match(validateStoredObject({ exists: true, size: 100 }, 99) || "", /match/i);
  assert.match(validateStoredObject({ exists: true, size: MAX_FILE_SIZE + 1 }, MAX_FILE_SIZE + 1) || "", /50MB/i);
  assert.match(validateStoredObject({ exists: true, size: 100, contentType: "text/plain" }, 100) || "", /PDF/i);
});

test("internal notification text works without workEmail and identifies source", () => {
  const text = buildEmailText({
    contactName: "Synthetic Contact",
    organization: "Synthetic Organization",
    projectName: "Synthetic Project",
    methodology: "Synthetic Methodology",
    note: "",
    fileName: "synthetic.pdf",
    submissionId: "synthetic-reference",
    timestamp: "2026-08-01T00:00:00.000Z",
    submissionSource: "whatsapp",
  });
  assert.match(text, /Source:\s+whatsapp/);
  assert.match(text, /Email:\s+Not provided/);
});
