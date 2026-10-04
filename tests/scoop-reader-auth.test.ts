import assert from "node:assert/strict";
import test from "node:test";
import { isLearningReaderAuthorization, isLearningReaderActive, isLearningReaderRequestAllowed, SCOOP_LEARNING_PATH } from "../lib/scoop-reader-auth.ts";
import { createInternalSessionToken, hasInternalUploadSession } from "../lib/internal-auth.ts";
import type { NextApiRequest } from "next";

const env = {
  INTERNAL_SCOOP_READER_USERNAME: "scoop-reviewer",
  INTERNAL_SCOOP_READER_PASSWORD: "synthetic-reader-secret",
  INTERNAL_SCOOP_READER_EXPIRES_AT: "2026-11-01T00:00:00Z",
  INTERNAL_UPLOAD_USERNAME: "admin",
  INTERNAL_SALES_AGENT_USERNAME: "sales-agent",
};
const authorization = "Basic " + btoa("scoop-reviewer:synthetic-reader-secret");

test("reader accepts only its separate credential and rejects malformed auth", () => {
  assert.equal(isLearningReaderAuthorization(authorization, env), true);
  for (const header of [undefined, "", "Bearer anything", "Basic !", "Basic " + btoa("scoop-reviewer:wrong"), "Basic " + btoa("scoop-reviewer")])
    assert.equal(isLearningReaderAuthorization(header, env), false);
  assert.equal(isLearningReaderAuthorization(authorization, {}), false);
  assert.equal(isLearningReaderAuthorization(authorization, { ...env, INTERNAL_UPLOAD_USERNAME: "scoop-reviewer" }), false);
  assert.equal(isLearningReaderAuthorization(authorization, { ...env, INTERNAL_SALES_AGENT_USERNAME: "scoop-reviewer" }), false);
});

test("expiry fails closed when absent, invalid, reached or past", () => {
  const expiry = Date.parse(env.INTERNAL_SCOOP_READER_EXPIRES_AT);
  assert.equal(isLearningReaderActive(env, expiry - 1), true);
  assert.equal(isLearningReaderActive(env, expiry), false);
  assert.equal(isLearningReaderActive(env, expiry + 1), false);
  assert.equal(isLearningReaderActive({}, expiry), false);
  assert.equal(isLearningReaderActive({ ...env, INTERNAL_SCOOP_READER_EXPIRES_AT: "invalid" }, expiry), false);
});

test("reader can only GET or HEAD the exact dashboard, never mutate or export", () => {
  assert.equal(isLearningReaderRequestAllowed(SCOOP_LEARNING_PATH, "GET"), true);
  assert.equal(isLearningReaderRequestAllowed(SCOOP_LEARNING_PATH, "HEAD"), true);
  for (const method of ["POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
    assert.equal(isLearningReaderRequestAllowed(SCOOP_LEARNING_PATH, method), false);
  for (const path of ["/internal/sales", "/internal/submissions/new", SCOOP_LEARNING_PATH + "/export", SCOOP_LEARNING_PATH + "-other", "/api/internal/scoop-learning"])
    assert.equal(isLearningReaderRequestAllowed(path, "GET"), false);
});

test("reader cannot reuse a valid admin session cookie on protected APIs", async () => {
  const original = { ...process.env };
  try {
    Object.assign(process.env, env, { INTERNAL_UPLOAD_PASSWORD: "synthetic-admin-secret" });
    const token = await createInternalSessionToken("admin", "synthetic-admin-secret");
    const request = { headers: { cookie: "article6_internal_upload=" + token } } as NextApiRequest;
    assert.equal(await hasInternalUploadSession(request), true);
    request.headers.authorization = authorization;
    assert.equal(await hasInternalUploadSession(request), false);
    process.env.INTERNAL_SCOOP_READER_EXPIRES_AT = "2020-01-01T00:00:00Z";
    assert.equal(await hasInternalUploadSession(request), false);
  } finally {
    for (const key of Object.keys(process.env)) if (!(key in original)) delete process.env[key];
    Object.assign(process.env, original);
  }
});
