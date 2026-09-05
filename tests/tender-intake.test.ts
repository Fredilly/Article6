import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  MAX_TENDER_FILE_BYTES,
  MAX_TENDER_FILE_COUNT,
  MAX_TENDER_PACKAGE_BYTES,
  tenderDocumentDescriptor,
  validateTenderIntake,
  validateVerifiedTenderObject,
} from "../lib/tender-intake.ts";

const baseMetadata = {
  contactName: "Jane Buyer",
  workEmail: "jane@example.com",
  organization: "Example Bidder",
  tenderTitle: "Example Tender",
};

test("tender intake accepts the supported bid document formats", () => {
  for (const name of ["bid.pdf", "response.docx", "pricing.xlsx", "schedule.xls", "notes.doc", "appendix.txt", "pricing.csv", "slides.pptx", "slides.ppt"]) {
    assert.ok(tenderDocumentDescriptor(name), name);
  }
});

test("tender intake rejects unsupported types and enforces package limits", () => {
  assert.equal(tenderDocumentDescriptor("payload.exe"), null);
  assert.match(validateTenderIntake({ ...baseMetadata, files: [] }) || "", /at least one tender document/i);
  assert.match(validateTenderIntake({ ...baseMetadata, files: [{ fileName: "bid.pdf", fileSize: MAX_TENDER_FILE_BYTES + 1 }] }) || "", /150 MB/i);
  assert.match(validateTenderIntake({
    ...baseMetadata,
    files: Array.from({ length: MAX_TENDER_FILE_COUNT + 1 }, (_, index) => ({ fileName: `bid-${index}.pdf`, fileSize: 10 })),
  }) || "", /up to/i);
  assert.match(validateTenderIntake({
    ...baseMetadata,
    files: [
      { fileName: "one.pdf", fileSize: MAX_TENDER_PACKAGE_BYTES / 2 + 1 },
      { fileName: "two.pdf", fileSize: MAX_TENDER_PACKAGE_BYTES / 2 + 1 },
    ],
  }) || "", /total package/i);
});

test("stored tender documents must match declared size and canonical type", () => {
  assert.match(validateVerifiedTenderObject({ size: 12, contentType: "application/pdf" }, { fileName: "bid.pdf", fileSize: 10 }) || "", /size/i);
  assert.match(validateVerifiedTenderObject({ size: 10, contentType: "application/zip" }, { fileName: "bid.pdf", fileSize: 10 }) || "", /content type/i);
  assert.equal(validateVerifiedTenderObject({ size: 10, contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }, { fileName: "bid.docx", fileSize: 10 }), null);
});

test("opaque submission keys support tender formats without weakening path validation", () => {
  const submissions = fs.readFileSync(new URL("../lib/submissions.ts", import.meta.url), "utf8");
  assert.match(submissions, /pdf\|docx\|doc\|xlsx\|xls\|txt\|csv\|pptx\|ppt/);
  assert.match(submissions, /submissions\\\/\\d\{4\}\\\/\\d\{2\}\\\/\\d\{2\}\\\//);
});

test("Carbon upload endpoints retain their existing PDF-only contract", () => {
  const presign = fs.readFileSync(new URL("../pages/api/upload/presign.ts", import.meta.url), "utf8");
  const confirm = fs.readFileSync(new URL("../pages/api/upload/confirm.ts", import.meta.url), "utf8");
  assert.match(presign, /body\.contentType !== PDF_CONTENT_TYPE/);
  assert.match(presign, /generatePresignedUploadUrl\(\)/);
  assert.match(confirm, /validateStoredObject/);
  assert.match(confirm, /body\.submissionType \|\| "CARBON"/);
});

test("tender confirmation verifies every object before the atomic CRM commit", () => {
  const confirm = fs.readFileSync(new URL("../pages/api/tender-intake/confirm.ts", import.meta.url), "utf8");
  const verifyCall = confirm.indexOf("await verifyObjectExists(");
  const validateCall = confirm.indexOf("const storedError = validateVerifiedTenderObject(");
  const commitCall = confirm.indexOf("const result = await commitTenderIntake(");
  assert.ok(verifyCall >= 0 && verifyCall < commitCall);
  assert.ok(validateCall >= 0 && validateCall < commitCall);
});

test("tender CRM intake writes the package in one database transaction", () => {
  const store = fs.readFileSync(new URL("../lib/tender-intake-store.ts", import.meta.url), "utf8");
  assert.match(store, /client\.query\("BEGIN"\)/);
  assert.match(store, /INSERT INTO sales_tender_opportunities/);
  assert.match(store, /INSERT INTO submissions/);
  assert.match(store, /INSERT INTO sales_tender_documents/);
  assert.match(store, /INSERT INTO sales_interactions/);
  assert.match(store, /client\.query\("COMMIT"\)/);
  assert.match(store, /client\.query\("ROLLBACK"\)/);
});
