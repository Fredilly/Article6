import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import fs from "node:fs";
import test from "node:test";
import { buildEmailHtml, buildEmailText, normalizeEmailSubjectProject } from "../lib/email.ts";
import { generatePresignedUploadUrl, resolveUploadReference } from "../lib/r2.ts";
import { generateSubmissionReference } from "../lib/submission-reference.ts";
import { getAppLayoutKind } from "../lib/layout.ts";
import {
  isApprovedSubmissionKey,
  isPdfUpload,
  MAX_FILE_SIZE,
  validateStoredObject,
  validateSubmissionMetadata,
  buildContentDisposition,
  sanitizeOriginalFilename,
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

test("submission references are readable and independent of the R2 key", () => {
  const reference = generateSubmissionReference(new Date("2026-08-02T12:00:00Z"));
  assert.match(reference, /^A6-20260802-[0-9A-HJKMNP-TV-Z]{6}$/);
  assert.doesNotMatch(reference, /Synthetic|client|email/i);
});

test("original filenames are sanitized for safe download headers", () => {
  const safe = sanitizeOriginalFilename('../client name\"\r\n.pdf');
  assert.equal(safe, "client name.pdf");
  assert.equal(buildContentDisposition('../client name\"\r\n.pdf'), 'attachment; filename="client name.pdf"');
});

test("confirmation rejects missing, mismatched, oversized, and non-PDF objects", () => {
  assert.match(validateStoredObject({ exists: false, size: 0 }, 1) || "", /not found/i);
  assert.match(validateStoredObject({ exists: true, size: 100 }, 99) || "", /match/i);
  assert.match(validateStoredObject({ exists: true, size: MAX_FILE_SIZE + 1 }, MAX_FILE_SIZE + 1) || "", /50MB/i);
  assert.match(validateStoredObject({ exists: true, size: 100, contentType: "text/plain" }, 100) || "", /PDF/i);
  assert.match(validateStoredObject({ exists: true, size: 100 }, 100) || "", /PDF/i);
});

test("confirmation derives the reference and gates notification on upload verification", () => {
  const confirm = fs.readFileSync(new URL("../pages/api/upload/confirm.ts", import.meta.url), "utf8");
  assert.doesNotMatch(confirm, /submissionReference:\s*string/);
  assert.ok(confirm.indexOf("if (storedObjectError)") < confirm.indexOf("await sendSubmissionNotification"));
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
    submissionReference: "A6-20260801-ABC123",
    fileSize: 51329000,
    timestamp: "2026-08-01T00:00:00.000Z",
    submissionSource: "whatsapp",
  });
  assert.match(text, /Source:\s+whatsapp/);
  assert.match(text, /Email:\s+Not provided/);
});

test("internal notification HTML has escaped fields, optional values, and no R2 URL", () => {
  const html = buildEmailHtml({
    contactName: '<img src=x onerror="bad">', organization: "Synthetic Organization", projectName: "Synthetic Project",
    methodology: "Synthetic Methodology", note: "<script>alert(1)</script>", fileName: "client.pdf", submissionId: "id",
    submissionReference: "A6-20260801-ABC123", fileSize: 51329000, timestamp: "2026-08-01T00:00:00.000Z", submissionSource: "internal",
  });
  assert.match(html, /New Article6 document submission/);
  assert.match(html, /Reference/);
  assert.match(html, /External contact/);
  assert.match(html, /Not provided/);
  assert.match(html, /&lt;img/);
  assert.doesNotMatch(html, /<img|<script|r2\.cloudflarestorage\.com/);
});

test("presigned browser PUT URLs do not include automatic checksum parameters", async () => {
  process.env.R2_ACCOUNT_ID = "synthetic-account";
  process.env.R2_ACCESS_KEY_ID = "synthetic-access-key";
  process.env.R2_SECRET_ACCESS_KEY = "synthetic-secret-key";
  process.env.R2_BUCKET_NAME = "synthetic-private-bucket";

  const result = await generatePresignedUploadUrl();
  const { uploadUrl } = result;
  const query = new URL(uploadUrl).searchParams;
  assert.equal(query.has("x-amz-checksum-crc32"), false);
  assert.equal(query.has("x-amz-sdk-checksum-algorithm"), false);
  assert.equal("key" in result, false);
  const resolved = resolveUploadReference(result.uploadReference);
  assert.ok(resolved);
  assert.equal(resolved.submissionReference, result.submissionReference);
  assert.match(resolved.key, /^submissions\/\d{4}-\d{2}-\d{2}\/[0-9a-f-]{36}\.pdf$/);
  const [payload, signature] = result.uploadReference.split(".");
  const tamperedPayload = Buffer.from(JSON.stringify({ key: resolved.key, submissionReference: "A6-20260802-XYZ789", expiresAt: Date.now() + 600000 })).toString("base64url");
  assert.equal(resolveUploadReference(`${tamperedPayload}.${signature}`), null);
  const expiredPayload = Buffer.from(JSON.stringify({ key: resolved.key, submissionReference: resolved.submissionReference, expiresAt: Date.now() - 1 })).toString("base64url");
  const expiredSignature = createHmac("sha256", process.env.R2_SECRET_ACCESS_KEY!).update(expiredPayload).digest("base64url");
  assert.equal(resolveUploadReference(`${expiredPayload}.${expiredSignature}`), null);
});

test("browser upload keeps the existing Content-Type-only CORS contract", () => {
  const form = fs.readFileSync(new URL("../components/preview/PddUploadForm.tsx", import.meta.url), "utf8");
  const r2 = fs.readFileSync(new URL("../lib/r2.ts", import.meta.url), "utf8");
  assert.match(form, /headers:\s*\{\s*'Content-Type': 'application\/pdf'\s*\}/);
  assert.doesNotMatch(form, /uploadHeaders|x-amz-meta-|Content-Disposition/);
  assert.match(r2, /AllowedHeaders: \["Content-Type"\]/);
  assert.doesNotMatch(r2, /AllowedHeaders: \[[^\]]*(x-amz-meta|Content-Disposition)/);
});

test("email subject project normalization removes controls and limits length", () => {
  const normalized = normalizeEmailSubjectProject("  Project\n\tName\r\0 " + "x".repeat(200));
  assert.equal(normalized.length, 120);
  assert.match(normalized, /^Project Name x+/);
  assert.doesNotMatch(normalized, /[\u0000-\u001f\u007f]/);
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
  assert.doesNotMatch(internalLayout, /NavBar|Footer|from ["']\.\/Layout/);
  assert.match(header, /Article6 Internal/);
  assert.match(header, /<Link href="\/internal\/submissions\/new"[\s\S]*>\s*Article6 Internal\s*<\/Link>/);
  assert.match(header, /href="\/internal\/submissions\/new"[\s\S]*onClick=\{resetInternalPage\}/);
  assert.doesNotMatch(header, /href="\/internal\/submissions"/);
  assert.doesNotMatch(header, /NavBar|Footer|Layout|Sign out|signout/);
});

test("internal reset is shared by the header and success state and remounts a blank form", () => {
  const page = fs.readFileSync(new URL("../pages/internal/submissions/new.tsx", import.meta.url), "utf8");
  const form = fs.readFileSync(new URL("../components/preview/PddUploadForm.tsx", import.meta.url), "utf8");

  assert.match(page, /<PddUploadForm key=\{resetVersion\} mode="internal" \/>/);
  assert.match(form, /onClick=\{isInternal \? resetInternalPage : resetForm\}/);
  assert.match(form, /const \[phase, setPhase\] = useState/);
  assert.match(form, /const \[submissionId, setSubmissionId\] = useState/);
  assert.match(form, /const \[file, setFile\] = useState/);
  assert.match(form, /const \[formData, setFormData\] = useState/);
});
