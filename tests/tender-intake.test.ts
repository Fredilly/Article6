import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  TENDER_MAX_FILE_SIZE,
  TENDER_MAX_FILES,
  TENDER_MAX_TOTAL_SIZE,
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
  for (const name of ["bid.pdf", "response.docx", "pricing.xlsx", "slides.pptx"]) {
    assert.ok(tenderDocumentDescriptor(name), name);
  }
});

test("tender intake rejects unsupported types and enforces package limits", () => {
  assert.equal(tenderDocumentDescriptor("payload.exe"), null);
  assert.match(validateTenderIntake({ ...baseMetadata, files: [] }) || "", /at least one tender document/i);
  assert.match(validateTenderIntake({ ...baseMetadata, files: [{ fileName: "bid.pdf", fileSize: TENDER_MAX_FILE_SIZE + 1 }] }) || "", /100 MB/i);
  assert.match(validateTenderIntake({
    ...baseMetadata,
    files: Array.from({ length: TENDER_MAX_FILES + 1 }, (_, index) => ({ fileName: `bid-${index}.pdf`, fileSize: 10 })),
  }) || "", /no more than/i);
  assert.match(validateTenderIntake({
    ...baseMetadata,
    files: Array.from({ length: 6 }, (_, index) => ({
      fileName: `package-${index}.pdf`,
      fileSize: TENDER_MAX_FILE_SIZE * 0.9,
    })),
  }) || "", /total upload package/i);
  assert.equal(TENDER_MAX_TOTAL_SIZE, 500 * 1024 * 1024);
});

test("stored tender documents must exist and match declared size and canonical type", () => {
  assert.match(validateVerifiedTenderObject({ exists: false, size: 10, contentType: "application/pdf" }, { fileName: "bid.pdf", fileSize: 10 }) || "", /not found/i);
  assert.match(validateVerifiedTenderObject({ exists: true, size: 12, contentType: "application/pdf" }, { fileName: "bid.pdf", fileSize: 10 }) || "", /upload completely/i);
  assert.match(validateVerifiedTenderObject({ exists: true, size: 10, contentType: "application/zip" }, { fileName: "bid.pdf", fileSize: 10 }) || "", /content type/i);
  assert.equal(validateVerifiedTenderObject({ exists: true, size: 10, contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }, { fileName: "bid.docx", fileSize: 10 }), null);
});

test("opaque submission keys support tender formats without weakening path validation", () => {
  const submissions = fs.readFileSync(new URL("../lib/submissions.ts", import.meta.url), "utf8");
  assert.match(submissions, /pdf\|docx\|xlsx\|pptx/);
  assert.match(submissions, /submissions\\\/\\d\{4\}-\\d\{2\}-\\d\{2\}\\\//);
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
