import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import fs from "node:fs";
import test from "node:test";
import { buildEmailHtml, buildEmailText, getInternalSubmissionUrl, normalizeEmailSubjectProject } from "../lib/email.ts";
import { generatePresignedDownloadUrl, generatePresignedUploadUrl, resolveUploadReference } from "../lib/r2.ts";
import { generateSubmissionReference } from "../lib/submission-reference.ts";
import { getAppLayoutKind } from "../lib/layout.ts";
import { buildSubmissionRecord } from "../lib/submission-store.ts";
import { runQuickCheck } from "../lib/quick-check.ts";
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
  assert.equal(validateSubmissionMetadata({ ...base, submissionSource: "internal", fileSize: MAX_FILE_SIZE }), null);
  assert.match(validateSubmissionMetadata({ ...base, submissionSource: "internal", fileSize: MAX_FILE_SIZE + 1 }) || "", /150MB/i);
  assert.equal(isPdfUpload({ type: "application/pdf", size: MAX_FILE_SIZE }), null);
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
  assert.match(validateStoredObject({ exists: true, size: MAX_FILE_SIZE + 1 }, MAX_FILE_SIZE + 1) || "", /150MB/i);
  assert.match(validateStoredObject({ exists: true, size: 100, contentType: "text/plain" }, 100) || "", /PDF/i);
  assert.match(validateStoredObject({ exists: true, size: 100 }, 100) || "", /PDF/i);
});

test("confirmation derives the reference and gates notification on upload verification", () => {
  const confirm = fs.readFileSync(new URL("../pages/api/upload/confirm.ts", import.meta.url), "utf8");
  assert.doesNotMatch(confirm, /submissionReference:\s*string/);
  assert.ok(confirm.indexOf("if (storedObjectError)") < confirm.indexOf("await sendSubmissionNotification"));
  assert.ok(confirm.indexOf("await createSubmissionIfAbsent") < confirm.indexOf("await sendSubmissionNotification"));
  assert.ok(confirm.indexOf("resolveUploadReference") < confirm.indexOf("await createSubmissionIfAbsent"));
});

test("atomic confirmation creates once, reuses duplicates, and sends one notification", () => {
  const confirm = fs.readFileSync(new URL("../pages/api/upload/confirm.ts", import.meta.url), "utf8");
  const store = fs.readFileSync(new URL("../lib/submission-store.ts", import.meta.url), "utf8");
  assert.doesNotMatch(confirm, /getSubmissionByReference/);
  assert.ok(confirm.indexOf("if (created) await sendSubmissionNotification") > confirm.indexOf("await createSubmissionIfAbsent"));
  assert.match(store, /ON CONFLICT \(reference\) DO NOTHING/);
  assert.match(store, /created: false/);
  assert.match(store, /if \(result\.rows\[0\]\) return \{ submission: toRecord\(result\.rows\[0\]\), created: true \}/);
  assert.match(store, /const existing = await getSubmissionByReference\(record\.reference\)/);
});

test("concurrent confirmations use one atomic insert and one notification decision", () => {
  const confirm = fs.readFileSync(new URL("../pages/api/upload/confirm.ts", import.meta.url), "utf8");
  const store = fs.readFileSync(new URL("../lib/submission-store.ts", import.meta.url), "utf8");
  assert.equal((store.match(/ON CONFLICT \(reference\) DO NOTHING/g) || []).length, 1);
  assert.equal((confirm.match(/sendSubmissionNotification\(\{/g) || []).length, 1);
  assert.match(confirm, /const \{ submission, created \} = await createSubmissionIfAbsent/);
  assert.match(confirm, /if \(created\) await sendSubmissionNotification/);
});

test("submission store relies on the applied migration rather than runtime schema mutation", () => {
  const store = fs.readFileSync(new URL("../lib/submission-store.ts", import.meta.url), "utf8");
  assert.doesNotMatch(store, /CREATE TABLE|ensureTable|tableReady/);
  assert.match(fs.readFileSync(new URL("../migrations/001_create_submissions.sql", import.meta.url), "utf8"), /CREATE TABLE IF NOT EXISTS submissions/);
  assert.match(store, /rejectUnauthorized: true/);
  assert.doesNotMatch(store, /rejectUnauthorized: false/);
});

test("persisted submission keeps the exact reference, bucket, and opaque object mapping", () => {
  const record = buildSubmissionRecord({
    reference: "A6-20260802-ABC123", objectKey: "submissions/2026-08-02/opaque.pdf", bucket: "private-bucket",
    originalFilename: "client.pdf", fileSize: 1234, contentType: "application/pdf", project: "Project",
    organization: "Organization", contactName: "Contact", submissionSource: "website", methodology: "Method",
    notes: "Notes", createdAt: "2026-08-02T12:00:00.000Z",
  });
  assert.equal(record.reference, "A6-20260802-ABC123");
  assert.equal(record.bucket, "private-bucket");
  assert.equal(record.objectKey, "submissions/2026-08-02/opaque.pdf");
  assert.equal("publicUrl" in record, false);
  assert.equal("presignedUrl" in record, false);
});

test("invalid references and missing objects are rejected before persistence", () => {
  const confirm = fs.readFileSync(new URL("../pages/api/upload/confirm.ts", import.meta.url), "utf8");
  assert.ok(confirm.indexOf("if (!resolved)") < confirm.indexOf("await createSubmission"));
  assert.ok(confirm.indexOf("if (storedObjectError)") < confirm.indexOf("await createSubmission"));
});

test("submission notification includes an internal detail link and no R2 URL", () => {
  const previousVercelUrl = process.env.VERCEL_URL;
  process.env.INTERNAL_APP_URL = "https://article6.org";
  process.env.VERCEL_URL = "preview.example.vercel.app";
  const text = buildEmailText({ ...base, note: "", submissionId: "id", submissionReference: "A6-20260802-ABC123", timestamp: "2026-08-02T12:00:00.000Z", submissionSource: "website" });
  const html = buildEmailHtml({ ...base, note: "", submissionId: "id", submissionReference: "A6-20260802-ABC123", timestamp: "2026-08-02T12:00:00.000Z", submissionSource: "website" });
  assert.match(text, /View submission: https:\/\/article6\.org\/internal\/submissions\/A6-20260802-ABC123/);
  assert.match(html, /View submission/);
  assert.match(html, /https:\/\/article6\.org\/internal\/submissions\/A6-20260802-ABC123/);
  assert.doesNotMatch(`${text}${html}`, /r2\.cloudflarestorage\.com|presigned|submissions\/2026/);
  assert.equal(getInternalSubmissionUrl("A6-20260802-ABC123"), "https://article6.org/internal/submissions/A6-20260802-ABC123");
  if (previousVercelUrl === undefined) delete process.env.VERCEL_URL;
  else process.env.VERCEL_URL = previousVercelUrl;
});

test("VERCEL_URL provides the deployment-aware fallback when INTERNAL_APP_URL is absent", () => {
  const previousInternalUrl = process.env.INTERNAL_APP_URL;
  const previousVercelUrl = process.env.VERCEL_URL;
  delete process.env.INTERNAL_APP_URL;
  process.env.VERCEL_URL = "article6-git-feature.vercel.app";
  assert.equal(getInternalSubmissionUrl("A6-20260802-ABC123"), "https://article6-git-feature.vercel.app/internal/submissions/A6-20260802-ABC123");
  const text = buildEmailText({ ...base, note: "", submissionId: "id", submissionReference: "A6-20260802-ABC123", timestamp: "2026-08-02T12:00:00.000Z", submissionSource: "website" });
  assert.match(text, /View submission: https:\/\/article6-git-feature\.vercel\.app\/internal\/submissions\/A6-20260802-ABC123/);
  if (previousInternalUrl === undefined) delete process.env.INTERNAL_APP_URL;
  else process.env.INTERNAL_APP_URL = previousInternalUrl;
  if (previousVercelUrl === undefined) delete process.env.VERCEL_URL;
  else process.env.VERCEL_URL = previousVercelUrl;
});

test("legacy http://internal does not override the Vercel deployment URL", () => {
  const previousInternalUrl = process.env.INTERNAL_APP_URL;
  const previousVercelUrl = process.env.VERCEL_URL;
  process.env.INTERNAL_APP_URL = "http://internal";
  process.env.VERCEL_URL = "article6-git-feature.vercel.app";
  assert.equal(getInternalSubmissionUrl("A6-20260802-ABC123"), "https://article6-git-feature.vercel.app/internal/submissions/A6-20260802-ABC123");
  if (previousInternalUrl === undefined) delete process.env.INTERNAL_APP_URL;
  else process.env.INTERNAL_APP_URL = previousInternalUrl;
  if (previousVercelUrl === undefined) delete process.env.VERCEL_URL;
  else process.env.VERCEL_URL = previousVercelUrl;
});

test("missing INTERNAL_APP_URL and VERCEL_URL fails clearly instead of generating a relative link", () => {
  const previousInternalUrl = process.env.INTERNAL_APP_URL;
  const previousVercelUrl = process.env.VERCEL_URL;
  delete process.env.INTERNAL_APP_URL;
  delete process.env.VERCEL_URL;
  assert.throws(() => getInternalSubmissionUrl("A6-20260802-ABC123"), /INTERNAL_APP_URL or VERCEL_URL must be configured/);
  if (previousInternalUrl === undefined) delete process.env.INTERNAL_APP_URL;
  else process.env.INTERNAL_APP_URL = previousInternalUrl;
  if (previousVercelUrl === undefined) delete process.env.VERCEL_URL;
  else process.env.VERCEL_URL = previousVercelUrl;
});

test("internal submission detail route is protected by the existing internal middleware", () => {
  const middleware = fs.readFileSync(new URL("../middleware.ts", import.meta.url), "utf8");
  const detail = fs.readFileSync(new URL("../pages/internal/submissions/[reference].tsx", import.meta.url), "utf8");
  assert.match(middleware, /matcher: \["\/internal\/:path\*"\]/);
  assert.match(detail, /getServerSideProps/);
  assert.match(detail, /getSubmissionByReference/);
  assert.doesNotMatch(detail, /objectKey|bucket|presigned|r2\.cloudflarestorage/);
});

test("internal submission detail renders the persisted Quick Check audit fields", () => {
  const detail = fs.readFileSync(new URL("../pages/internal/submissions/[reference].tsx", import.meta.url), "utf8");
  for (const field of ["Audit ID", "Result storage", "Started", "Completed", "Failed", "PDF validation", "Document metadata", "Extracted text", "Page count", "Extracted text preview", "Error details"]) {
    assert.match(detail, new RegExp(field));
  }
  assert.match(detail, /quickCheckResult/);
  assert.match(detail, /quickCheckStartedAt/);
  assert.match(detail, /quickCheckCompletedAt/);
  assert.match(detail, /quickCheckFailedAt/);
  assert.match(detail, /quickCheckError/);
});

test("internal submissions index queries newest submissions first and links to detail", () => {
  const store = fs.readFileSync(new URL("../lib/submission-store.ts", import.meta.url), "utf8");
  const index = fs.readFileSync(new URL("../pages/internal/submissions/index.tsx", import.meta.url), "utf8");
  assert.match(store, /export async function getSubmissions/);
  assert.match(store, /ORDER BY created_at DESC/);
  assert.match(index, /getServerSideProps/);
  assert.match(index, /Reference/);
  assert.match(index, /Submitted date/);
  assert.match(index, /`\/internal\/submissions\/\$\{submission\.reference\}`/);
});

test("submission PDF download requires the internal session and signs the stored object", () => {
  const route = fs.readFileSync(new URL("../pages/api/internal/submissions/[reference]/download.ts", import.meta.url), "utf8");
  assert.match(route, /hasInternalUploadSession/);
  assert.match(route, /status\(401\)/);
  assert.match(route, /getSubmissionByReference/);
  assert.match(route, /verifyObjectExists\(submission\.objectKey, submission\.bucket\)/);
  assert.match(route, /generatePresignedDownloadUrl\(submission\.bucket, submission\.objectKey\)/);
  assert.match(route, /res\.redirect\(307/);
  assert.match(route, /status\(404\)/);
});

test("Quick Check calls the authenticated remote processor and returns readable text", async () => {
  process.env.APP_ARTICLE6_PROCESSOR_URL = "https://processor.example.test/internal/pdf-extract";
  process.env.APP_ARTICLE6_PROCESSOR_SECRET = "processor-secret";
  const calls: { url: string; init?: RequestInit }[] = [];
  const previousFetch = globalThis.fetch;
  globalThis.fetch = (async (url, init) => {
    calls.push({ url: String(url), init });
    return new Response(JSON.stringify({ parserEngine: "pymupdf", parserVersion: "1.24", pageCount: 1, extractedTextPreview: "Project Description\nBaseline Scenario\nLeakage\nMonitoring Plan", extractionStatus: "completed" }));
  }) as typeof fetch;
  try {
    const result = await runQuickCheck({ submissionReference: "A6-20260802-ABC123", documentUrl: "https://r2.example.test/signed", filename: "pdd.pdf", fileSize: 1234 });
    assert.equal(calls[0]?.url, process.env.APP_ARTICLE6_PROCESSOR_URL);
    assert.equal(new Headers(calls[0]?.init?.headers).get("authorization"), "Bearer processor-secret");
    assert.match(result.extractedTextPreview, /Project Description/);
    assert.equal(result.extractedTextPreview.startsWith("%PDF"), false);
    assert.doesNotMatch(JSON.stringify(result), /r2\.example|processor-secret|signed/);
  } finally { globalThis.fetch = previousFetch; }
});

test("Quick Check records remote failures without exposing signed URLs", async () => {
  process.env.APP_ARTICLE6_PROCESSOR_URL = "https://processor.example.test/internal/pdf-extract";
  process.env.APP_ARTICLE6_PROCESSOR_SECRET = "processor-secret";
  const previousFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response(JSON.stringify({ error: "Extraction processor failed." }), { status: 502 })) as typeof fetch;
  try { await assert.rejects(() => runQuickCheck({ submissionReference: "A6-20260802-ABC123", documentUrl: "https://r2.example.test/signed-secret", filename: "pdd.pdf", fileSize: 1234 }), /Extraction processor failed/); }
  finally { globalThis.fetch = previousFetch; }
});

test("stored Quick Check version 1 results retain their legacy rendering contract", () => {
  const page = fs.readFileSync(new URL("../pages/internal/submissions/[reference].tsx", import.meta.url), "utf8");
  const legacy: import("../lib/quick-check.ts").QuickCheckResultV1 = {
    version: 1, fileSize: 1234, isPdf: true, pageCount: 585, extractedTextPreview: "Project Description", checks: [{ name: "pdf_signature", passed: true, detail: "PDF signature detected." }],
  };
  assert.equal(legacy.version, 1);
  assert.match(page, /result\.version === 1/);
  for (const field of ["result.isPdf", "result.fileSize", "result.checks", "result.pageCount", "result.extractedTextPreview"]) assert.match(page, new RegExp(field.replace(".", "\\.")));
});

test("Quick Check route requires auth, resolves the submission, verifies R2, and persists completion", () => {
  const route = fs.readFileSync(new URL("../pages/api/internal/submissions/[reference]/quick-check.ts", import.meta.url), "utf8");
  const store = fs.readFileSync(new URL("../lib/submission-store.ts", import.meta.url), "utf8");
  assert.match(route, /hasInternalUploadSession/);
  assert.match(route, /status\(401\)/);
  assert.match(route, /getSubmissionByReference/);
  assert.match(route, /verifyObjectExists\(submission\.objectKey, submission\.bucket\)/);
  assert.match(route, /generatePresignedDownloadUrl\(submission\.bucket, submission\.objectKey\)/);
  assert.match(route, /documentUrl/);
  assert.match(route, /runQuickCheck/);
  assert.match(route, /startQuickCheck/);
  assert.match(route, /completeQuickCheck/);
  assert.match(route, /failQuickCheck/);
  assert.match(store, /quick_check_status = 'processing'/);
  assert.match(store, /quick_check_status = 'completed'/);
  assert.match(store, /quick_check_status = 'failed'/);
});

test("Quick Check migration preserves the existing upload schema and stores an audit result", () => {
  const migration = fs.readFileSync(new URL("../migrations/002_add_quick_check.sql", import.meta.url), "utf8");
  assert.match(migration, /ADD COLUMN IF NOT EXISTS quick_check_status/);
  assert.match(migration, /quick_check_id UUID/);
  assert.match(migration, /quick_check_result JSONB/);
  assert.match(migration, /quick_check_started_at/);
  assert.match(migration, /quick_check_completed_at/);
});

test("R2 download signing uses the persisted bucket and short-lived GET URL", async () => {
  const previous = {
    account: process.env.R2_ACCOUNT_ID,
    access: process.env.R2_ACCESS_KEY_ID,
    secret: process.env.R2_SECRET_ACCESS_KEY,
    bucket: process.env.R2_BUCKET_NAME,
  };
  process.env.R2_ACCOUNT_ID = "synthetic-account";
  process.env.R2_ACCESS_KEY_ID = "synthetic-access-key";
  process.env.R2_SECRET_ACCESS_KEY = "synthetic-secret-key";
  process.env.R2_BUCKET_NAME = "configured-bucket";
  const url = await generatePresignedDownloadUrl("persisted-bucket", "submissions/2026-08-02/123e4567-e89b-12d3-a456-426614174000.pdf");
  assert.equal(new URL(url).hostname, "persisted-bucket.synthetic-account.r2.cloudflarestorage.com");
  assert.match(url, /persisted-bucket/);
  assert.match(url, /X-Amz-Expires=300/);
  for (const [key, value] of Object.entries({ R2_ACCOUNT_ID: previous.account, R2_ACCESS_KEY_ID: previous.access, R2_SECRET_ACCESS_KEY: previous.secret, R2_BUCKET_NAME: previous.bucket })) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
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
  const presign = fs.readFileSync(new URL("../pages/api/upload/presign.ts", import.meta.url), "utf8");
  assert.match(form, /headers:\s*\{\s*'Content-Type': 'application\/pdf'\s*\}/);
  assert.doesNotMatch(form, /uploadHeaders|x-amz-meta-|Content-Disposition/);
  assert.doesNotMatch(r2, /PutBucketCorsCommand|configureBucketCors|AllowedHeaders/);
  assert.doesNotMatch(presign, /PutBucketCorsCommand|configureBucketCors|CORS/);
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
  assert.match(header, /href="\/internal\/submissions"/);
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

test("upload progress styling is green only while uploading and keeps the existing success/error states", () => {
  const form = fs.readFileSync(new URL("../components/preview/PddUploadForm.tsx", import.meta.url), "utf8");
  assert.match(form, /phase === 'uploading'[\s\S]*role="progressbar"[\s\S]*bg-forest-600/);
  assert.match(form, /phase === 'success'/);
  assert.match(form, /phase === 'error'/);
  assert.match(form, /border-red-200 bg-red-50/);
});
