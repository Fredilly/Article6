import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { isPublicFunnelRoute, trackEvent } from '../lib/analytics.ts';

const formSource = fs.readFileSync(new URL('../components/preview/PddUploadForm.tsx', import.meta.url), 'utf8');

test('analytics failures do not interrupt event callers', () => {
  assert.doesNotThrow(() => trackEvent('upload_file_selected'));
});

test('funnel analytics is limited to production-facing public routes', () => {
  assert.equal(isPublicFunnelRoute('/'), true);
  assert.equal(isPublicFunnelRoute('/sample-assessment'), true);
  assert.equal(isPublicFunnelRoute('/how-it-works'), true);
  assert.equal(isPublicFunnelRoute('/preview/verification-readiness'), false);
  assert.equal(isPublicFunnelRoute('/preview/verification-readiness/sample-assessment'), false);
  assert.equal(isPublicFunnelRoute('/preview/verification-readiness/how-it-works'), false);
  assert.equal(isPublicFunnelRoute('/sample-assessment/'), false);
});

test('public form tracks submission start and success separately', () => {
  assert.match(formSource, /if \(!isInternal\) trackEvent\('scope_review_started'\)/);
  assert.match(formSource, /setPhase\('success'\);\s*if \(!isInternal\) trackEvent\('scope_review_submitted'\)/);
  assert.ok(formSource.indexOf("trackEvent('scope_review_submitted')") > formSource.indexOf("if (!confirmRes.ok)"));
});

test('file selection tracking sends no file or form data', () => {
  assert.match(formSource, /trackEvent\('upload_file_selected'\)/);
  assert.doesNotMatch(formSource, /trackEvent\('upload_file_selected',[\s\S]*?(fileName|name|email|organization|project|methodology)/);
});
