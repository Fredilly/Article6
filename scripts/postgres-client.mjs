import { accessSync, constants } from 'node:fs';
import { delimiter, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const MACOS_CLIENT_DIRECTORIES = [
  '/opt/homebrew/opt/libpq/bin',
  '/usr/local/opt/libpq/bin',
  '/opt/homebrew/opt/postgresql@18/bin',
  '/usr/local/opt/postgresql@18/bin',
  '/opt/homebrew/opt/postgresql/bin',
  '/usr/local/opt/postgresql/bin',
];

function executable(path) {
  try {
    accessSync(path, constants.X_OK);
    return spawnSync(path, ['--version'], { stdio: 'ignore' }).status === 0;
  } catch {
    return false;
  }
}

function candidates(name, { env = process.env, platform = process.platform } = {}) {
  const fromPath = (env.PATH || '')
    .split(delimiter)
    .filter(Boolean)
    .map((directory) => resolve(directory, name));
  const common = platform === 'darwin'
    ? MACOS_CLIENT_DIRECTORIES.map((directory) => `${directory}/${name}`)
    : [];
  return [...fromPath, ...common];
}

export function resolvePostgresBinaries(options = {}) {
  const pgDump = candidates('pg_dump', options).find(executable);
  const pgRestore = candidates('pg_restore', options).find(executable);
  if (!pgDump || !pgRestore) {
    const missing = [!pgDump && 'pg_dump', !pgRestore && 'pg_restore'].filter(Boolean).join(' and ');
    throw new Error(`Required PostgreSQL client binaries (${missing}) are unavailable. Install PostgreSQL client tools with brew install libpq, then run npm run crm:backup again (no shell profile changes are required).`);
  }
  return { pgDump, pgRestore };
}

export { MACOS_CLIENT_DIRECTORIES };
