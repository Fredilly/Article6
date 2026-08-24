import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { isApprovedSubmissionKey } from "../lib/submissions.ts";
import {
  TENDER_MAX_FILE_SIZE,
  TENDER_MAX_FILES,
  TENDER_MAX_TOTAL_SIZE,
  tenderDocumentDescriptor,
  validateTenderIntake,
  validateVerifiedTenderObject,
} from "../lib/tender-intake.ts";

const base = {
  contactName: "Bid Lead",
  workEmail: "bid.lead@example.test",
  organization: "Example Ltd",
  tenderTitle: "Facilities Management Framework",
};

test("tender intake accepts the supported bid document formats", () => {
  const names = ["itt.pdf", "response.docx", "pricing.xlsx", "presentation.pptx"];
  const files = names.map((fileName) => ({ fileName, fileSize: 1024 }));
  assert.equal(validateTenderIntake({ ...base, files }), null);
  for (const name of names) assert.ok(tenderDocumentDescriptor(name));
});

test("tender intake rejects unsupported types and enforces package limits", () => {
  assert.match(validateTenderIntake({ ...base, files: [{ fileName: "archive.zip", fileSize: 1024 }] }) || "", /PDF, DOCX, XLSX and PPTX/i);
  assert.match(validateTenderIntake({ ...base, files: [{ fileName: "large.pdf", fileSize: TENDER_MAX_FILE_SIZE + 1 }] }) || "", /100 MB/i);
  assert.match(validateTenderIntake({ ...base, files: Array.from({ length: TENDER_MAX_FILES + 1 }, (_, index) => ({ fileName: `${index}.pdf`, fileSize: 1 })) }) || "", /no more than/i);
  const oversizedPackage = Array.from({ length: 6 }, (_, index) => ({ fileName: `${index}.pdf`, fileSize: Math.floor(TENDER_MAX_TOTAL_SIZE / 5) }));
  assert.match(validateTenderIntake({ ...base, files: oversizedPackage }) || "", /500 MB/i);
});

test("stored tender documents must match declared size and canonical type", () => {
  const file = { fileName: "response.docx", fileSize: 2048 };
  const type = tenderDocumentDescriptor(file.fileName)!.contentType;
  assert.equal(validateVerifiedTenderObject({ exists: true, size: 2048, contentType: type }, file), null);
  assert.match(validateVerifiedTenderObject({ exists: true, size: 2047, contentType: type }, file) || "", /completely/i);
  assert.match(validateVerifiedTenderObject({ exists: true, size: 2048, contentType: "application/pdf" }, file) || "", /content type/i);
});

test("opaque submission keys support tender formats without weakening path validation", () => {
  for (const extension of ["pdf", "docx", "xlsx", "pptx"]) {
    assert.equal(isApprovedSubmissionKey(`submissions/2026-08-24/123e4567-e89b-12d3-a456-426614174000.${extension}`), true);
  }
  assert.equal(isApprovedSubmissionKey("submissions/2026-08-24/123e4567-e89b-12d3-a456-426614174000.zip"), false);
  assert.equal(isApprovedSubmissionKey("../submissions/2026-08-24/123e4567-e89b-12d3-a456-426614174000.docx"), false);
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
  assert.ok(confirm.indexOf("verifyObjectExists") < confirm.indexOf("commitTenderIntake"));
  assert.ok(confirm.indexOf("validateVerifiedTenderObject") < confirm.indexOf("commitTenderIntake"));
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
  assert.match(store, /WHERE source_key = \$1 LIMIT 1/);
});
