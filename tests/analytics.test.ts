import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { trackEvent } from '../lib/analytics.ts';

const formSource = fs.readFileSync(new URL('../components/preview/PddUploadForm.tsx', import.meta.url), 'utf8');

test('analytics failures do not interrupt event callers', () => {
  assert.doesNotThrow(() => trackEvent('upload_file_selected'));
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
