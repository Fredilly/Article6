import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  CARBON_MAX_FILE_SIZE,
  CARBON_MAX_FILES,
  CARBON_MAX_TOTAL_SIZE,
  carbonDocumentDescriptor,
  validateCarbonIntake,
  validateVerifiedCarbonObject,
} from "../lib/carbon-intake.ts";

const base = {
  contactName: "Synthetic Contact",
  workEmail: "synthetic@example.test",
  organization: "Synthetic Carbon Co",
  projectName: "Synthetic REDD Project",
  methodology: "VM0007 1.8",
};

test("carbon package requires exactly one PDF PDD", () => {
  assert.equal(validateCarbonIntake({ ...base, files: [{ fileName: "PDD.pdf", fileSize: 10, role: "PDD" }] }), null);
  assert.match(validateCarbonIntake({ ...base, files: [{ fileName: "PDD.docx", fileSize: 10, role: "PDD" }] }) || "", /PDD.*PDF/i);
  assert.match(validateCarbonIntake({ ...base, files: [{ fileName: "evidence.pdf", fileSize: 10, role: "SUPPORTING" }] }) || "", /PDD/i);
});

test("carbon package accepts common supporting document types", () => {
  for (const name of ["PDD.pdf", "evidence.docx", "workbook.xlsx", "slides.pptx"]) assert.ok(carbonDocumentDescriptor(name));
  assert.equal(carbonDocumentDescriptor("archive.zip"), null);
  assert.equal(validateCarbonIntake({
    ...base,
    files: [
      { fileName: "PDD.pdf", fileSize: 10, role: "PDD" },
      { fileName: "evidence.docx", fileSize: 10, role: "SUPPORTING" },
      { fileName: "workbook.xlsx", fileSize: 10, role: "SUPPORTING" },
    ],
  }), null);
});

test("carbon package uses 150 MB per file and bounded package limits", () => {
  assert.equal(CARBON_MAX_FILE_SIZE, 150 * 1024 * 1024);
  assert.equal(CARBON_MAX_FILES, 10);
  assert.equal(CARBON_MAX_TOTAL_SIZE, 750 * 1024 * 1024);
  assert.equal(validateCarbonIntake({ ...base, files: [{ fileName: "PDD.pdf", fileSize: 140 * 1024 * 1024, role: "PDD" }] }), null);
  assert.match(validateCarbonIntake({ ...base, files: [{ fileName: "PDD.pdf", fileSize: CARBON_MAX_FILE_SIZE + 1, role: "PDD" }] }) || "", /150 MB/i);
});

test("stored carbon objects must match declared size and type", () => {
  const declared = { fileName: "workbook.xlsx", fileSize: 100, role: "SUPPORTING" as const };
  assert.equal(validateVerifiedCarbonObject({ exists: true, size: 100, contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }, declared), null);
  assert.match(validateVerifiedCarbonObject({ exists: true, size: 99, contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }, declared) || "", /completely/i);
  assert.match(validateVerifiedCarbonObject({ exists: true, size: 100, contentType: "application/pdf" }, declared) || "", /content type/i);
});

test("carbon confirmation verifies every object before atomic persistence", () => {
  const confirm = fs.readFileSync(new URL("../pages/api/carbon-intake/confirm.ts", import.meta.url), "utf8");
  assert.ok(confirm.indexOf("verifyObjectExists") < confirm.indexOf("commitCarbonIntake"));
  assert.match(confirm, /seenSubmissionReferences/);
  assert.match(confirm, /if \(result\.created\)/);
});

test("legacy carbon single-PDF endpoints remain in place", () => {
  assert.ok(fs.existsSync(new URL("../pages/api/upload/presign.ts", import.meta.url)));
  assert.ok(fs.existsSync(new URL("../pages/api/upload/confirm.ts", import.meta.url)));
  const legacy = fs.readFileSync(new URL("../lib/submissions.ts", import.meta.url), "utf8");
  assert.match(legacy, /MAX_FILE_SIZE = 50 \* 1024 \* 1024/);
});
