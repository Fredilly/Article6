import test from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { MACOS_CLIENT_DIRECTORIES, resolvePostgresBinaries } from '../scripts/postgres-client.mjs';

test('includes Apple Silicon and Intel Homebrew PostgreSQL locations', () => {
  assert.deepEqual(MACOS_CLIENT_DIRECTORIES.slice(0, 2), [
    '/opt/homebrew/opt/libpq/bin',
    '/usr/local/opt/libpq/bin',
  ]);
});

test('reports both missing PostgreSQL client binaries', () => {
  assert.throws(
    () => resolvePostgresBinaries({ env: { PATH: '/path-that-does-not-exist' }, platform: 'linux' }),
    /pg_dump and pg_restore.*are unavailable/,
  );
});

test('resolves usable clients to absolute paths from PATH', () => {
  const directory = mkdtempSync(join(tmpdir(), 'article6-postgres-client-'));
  try {
    for (const name of ['pg_dump', 'pg_restore']) {
      const path = join(directory, name);
      writeFileSync(path, '#!/bin/sh\necho PostgreSQL 18\n');
      chmodSync(path, 0o755);
    }
    const binaries = resolvePostgresBinaries({ env: { PATH: directory }, platform: 'linux' });
    assert.deepEqual(binaries, {
      pgDump: join(directory, 'pg_dump'),
      pgRestore: join(directory, 'pg_restore'),
    });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('fails with one actionable installation message when clients are unavailable', () => {
  assert.throws(
    () => resolvePostgresBinaries({ env: { PATH: '/path-that-does-not-exist' }, platform: 'darwin' }),
    /pg_dump and pg_restore.*are unavailable.*brew install libpq.*no shell profile changes are required/,
  );
});
