import assert from "node:assert/strict";
import test from "node:test";
import { isSalesCollateralDocumentType, SALES_COLLATERAL_DOCUMENT_TYPES } from "../lib/sales-collateral-types.ts";
import { isCollateralStoragePath, validateCollateralFile } from "../lib/sales-collateral-storage.ts";

test("sales collateral document types are constrained", () => {
  assert.equal(SALES_COLLATERAL_DOCUMENT_TYPES.length, 7);
  assert.equal(isSalesCollateralDocumentType("SAMPLE_REVIEW"), true);
  assert.equal(isSalesCollateralDocumentType("EXECUTABLE"), false);
});

test("collateral storage accepts only the private namespaced key shape", () => {
  const org = "e30d0e32-9d19-4509-bde8-6d5e6a8a77bd";
  const object = "7f2d86b2-9ed2-46bc-b502-b580ad254940-preview.pdf";
  assert.equal(isCollateralStoragePath(`sales-collateral/${org}/2026-08-31/${object}`), true);
  assert.equal(isCollateralStoragePath(`submissions/2026-08-31/${object}`), false);
  assert.equal(isCollateralStoragePath("../../secret.pdf"), false);
});

test("collateral uploads reject unsupported or oversized files", () => {
  assert.deepEqual(validateCollateralFile("review.pdf", "application/pdf", 1024), { extension: "pdf", contentType: "application/pdf" });
  assert.throws(() => validateCollateralFile("payload.exe", "application/octet-stream", 1024), /Unsupported/);
  assert.throws(() => validateCollateralFile("review.pdf", "application/pdf", 26 * 1024 * 1024), /25 MB/);
});
