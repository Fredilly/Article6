#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { createReadStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = resolve(process.cwd());
const BACKUP_ROOT = join(ROOT, 'backups', 'crm');
const NEON_API = 'https://console.neon.tech/api/v2';

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const rawLine of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const index = line.indexOf('=');
    if (index < 1) continue;
    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(join(ROOT, '.env.local'));
loadEnvFile(join(ROOT, '.env'));

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function commandExists(command) {
  const result = spawnSync(command, ['--version'], { encoding: 'utf8' });
  return result.status === 0;
}

function run(command, args) {
  const result = spawnSync(command, args, { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || '').trim();
    throw new Error(`${command} failed${detail ? `: ${detail}` : ''}`);
  }
  return (result.stdout || '').trim();
}

async function neonRequest(path, options = {}) {
  const apiKey = required('NEON_API_KEY');
  const response = await fetch(`${NEON_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Neon API ${response.status}: ${body?.message || JSON.stringify(body)}`);
  }
  return body;
}

async function sha256(path) {
  return await new Promise((resolveHash, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(path);
    stream.on('error', reject);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolveHash(hash.digest('hex')));
  });
}

function timestamp() {
  return new Date().toISOString().replace(/:/g, '-').replace(/\.\d{3}Z$/, 'Z');
}

async function main() {
  const startedAt = new Date().toISOString();
  const stamp = timestamp();
  const backupDir = join(BACKUP_ROOT, stamp);
  const dumpPath = join(backupDir, 'article6-crm.dump');
  const checksumPath = `${dumpPath}.sha256`;
  const manifestPath = join(backupDir, 'manifest.json');
  const restorePath = join(backupDir, 'RESTORE.md');

  mkdirSync(backupDir, { recursive: true });

  if (!commandExists('pg_dump')) throw new Error('pg_dump is not installed or not on PATH');
  if (!commandExists('pg_restore')) throw new Error('pg_restore is not installed or not on PATH');

  const postgresUrl = required('POSTGRES_URL');
  const projectId = required('NEON_PROJECT_ID');
  required('NEON_API_KEY');

  const branches = await neonRequest(`/projects/${encodeURIComponent(projectId)}/branches`);
  const primary = branches?.branches?.find((branch) => branch.primary) || branches?.branches?.find((branch) => !branch.parent_id);
  if (!primary?.id) throw new Error('Could not determine the Neon primary branch');

  const branchName = `crm-backup-${stamp.toLowerCase()}`;
  const created = await neonRequest(`/projects/${encodeURIComponent(projectId)}/branches`, {
    method: 'POST',
    body: JSON.stringify({ branch: { name: branchName, parent_id: primary.id } }),
  });
  const backupBranch = created?.branch;
  if (!backupBranch?.id) throw new Error('Neon branch creation returned no branch id');

  run('pg_dump', [
    '--format=custom',
    '--no-owner',
    '--no-acl',
    `--dbname=${postgresUrl}`,
    `--file=${dumpPath}`,
  ]);

  if (!existsSync(dumpPath)) throw new Error('pg_dump completed but the dump file was not created');
  run('pg_restore', ['--list', dumpPath]);

  const checksum = await sha256(dumpPath);
  writeFileSync(checksumPath, `${checksum}  article6-crm.dump\n`, { mode: 0o600 });

  const manifest = {
    system: 'Article6 CRM',
    createdAt: startedAt,
    completedAt: new Date().toISOString(),
    neonProjectId: projectId,
    sourceBranchId: primary.id,
    sourceBranchName: primary.name,
    backupBranchId: backupBranch.id,
    backupBranchName: backupBranch.name,
    dumpFile: 'article6-crm.dump',
    format: 'postgres-custom',
    sha256: checksum,
    verified: true,
  };
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 });

  const restore = `# Article6 CRM backup restore\n\nBackup created: ${manifest.completedAt}\n\n## Safe recovery procedure\n\n1. Create a fresh Neon recovery branch or a fresh PostgreSQL database.\n2. Obtain its connection string. Do not point this command at production.\n3. Verify the dump checksum before restoring.\n4. Restore with:\n\n\`\`\`bash\npg_restore --no-owner --no-acl --clean --if-exists --dbname=\"$RECOVERY_DATABASE_URL\" article6-crm.dump\n\`\`\`\n\n5. Start Article6 against the recovery database and verify CRM organizations, contacts, tender opportunities, communication history, and document metadata.\n6. Only promote a recovered database to production after explicit approval.\n\nNeon recovery branch: ${backupBranch.name} (${backupBranch.id})\n`;
  writeFileSync(restorePath, restore, { mode: 0o600 });

  console.log('BACKUP VERIFIED');
  console.log(`Directory: ${backupDir}`);
  console.log(`Neon branch: ${backupBranch.name}`);
  console.log(`SHA-256: ${checksum}`);
}

main().catch((error) => {
  console.error('BACKUP FAILED');
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
