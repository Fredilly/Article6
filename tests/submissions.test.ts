import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { buildEmailText } from "../lib/email.ts";
import { generatePresignedUploadUrl } from "../lib/r2.ts";
import { getAppLayoutKind } from "../lib/layout.ts";
import {
  getExpiredInternalSessionCookie,
  INTERNAL_SESSION_COOKIE,
  INTERNAL_SIGNOUT_REDIRECT,
} from "../lib/internal-auth.ts";
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

test("presigned browser PUT URLs do not include automatic checksum parameters", async () => {
  process.env.R2_ACCOUNT_ID = "synthetic-account";
  process.env.R2_ACCESS_KEY_ID = "synthetic-access-key";
  process.env.R2_SECRET_ACCESS_KEY = "synthetic-secret-key";
  process.env.R2_BUCKET_NAME = "synthetic-private-bucket";

  const { uploadUrl } = await generatePresignedUploadUrl();
  const query = new URL(uploadUrl).searchParams;
  assert.equal(query.has("x-amz-checksum-crc32"), false);
  assert.equal(query.has("x-amz-sdk-checksum-algorithm"), false);
});

test("public pages use marketing chrome and internal pages do not", () => {
  assert.equal(getAppLayoutKind("/about-us"), "marketing");
  assert.equal(getAppLayoutKind("/internal/submissions/new"), "internal");
  assert.notEqual(getAppLayoutKind("/internal/submissions/new"), "marketing");
  assert.equal(getAppLayoutKind("/404"), "marketing");
});

test("internal layout renders only the compact internal header", () => {
  const header = fs.readFileSync(new URL("../components/InternalHeader.tsx", import.meta.url), "utf8");
  const internalLayout = fs.readFileSync(new URL("../components/InternalLayout.tsx", import.meta.url), "utf8");

  assert.match(internalLayout, /<InternalHeader \/>/);
  assert.match(header, /Article6 Internal/);
  assert.match(header, /href="\/internal\/submissions"/);
  assert.match(header, /href="\/internal\/submissions\/new"/);
  assert.match(header, /action="\/api\/internal\/signout"/);
  assert.doesNotMatch(header, /NavBar|Footer|Layout/);
});

test("sign out expires the internal session cookie and redirects to the protected form", async () => {
  const signout = fs.readFileSync(new URL("../pages/api/internal/signout.ts", import.meta.url), "utf8");

  assert.equal(INTERNAL_SESSION_COOKIE, "article6_internal_upload");
  assert.match(getExpiredInternalSessionCookie(false), /^article6_internal_upload=; Max-Age=0; Path=\/; HttpOnly; SameSite=Strict$/);
  assert.match(signout, /getExpiredInternalSessionCookie/);
  assert.match(signout, /res\.redirect\(303, INTERNAL_SIGNOUT_REDIRECT\)/);
  assert.equal(INTERNAL_SIGNOUT_REDIRECT, "/internal/submissions/new");
});

test("the protected internal route challenges again without Basic Auth after sign out", () => {
  const middleware = fs.readFileSync(new URL("../middleware.ts", import.meta.url), "utf8");

  assert.match(middleware, /matcher: \["\/internal\/:path\*"\]/);
  assert.match(middleware, /if \(!authorization\?\.startsWith\("Basic "\)\)/);
  assert.match(middleware, /status: 401/);
  assert.match(middleware, /WWW-Authenticate/);
});
