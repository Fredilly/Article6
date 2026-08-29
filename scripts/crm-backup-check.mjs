#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { createReadStream, existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { resolvePostgresBinaries } from './postgres-client.mjs';

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

function run(command, args) {
  const result = spawnSync(command, args, { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || '').trim();
    throw new Error(`${command} failed${detail ? `: ${detail}` : ''}`);
  }
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

async function neonRequest(path) {
  const response = await fetch(`${NEON_API}${path}`, {
    headers: { Authorization: `Bearer ${required('NEON_API_KEY')}` },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Neon API ${response.status}: ${body?.message || JSON.stringify(body)}`);
  return body;
}

async function main() {
  if (!existsSync(BACKUP_ROOT)) throw new Error(`Backup directory does not exist: ${BACKUP_ROOT}`);

  const backups = readdirSync(BACKUP_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .reverse();
  if (!backups.length) throw new Error('No CRM backups found');

  const latest = backups[0];
  const backupDir = join(BACKUP_ROOT, latest);
  const manifestPath = join(backupDir, 'manifest.json');
  const dumpPath = join(backupDir, 'article6-crm.dump');
  const checksumPath = `${dumpPath}.sha256`;

  for (const path of [manifestPath, dumpPath, checksumPath]) {
    if (!existsSync(path)) throw new Error(`Missing backup artifact: ${path}`);
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (manifest.verified !== true) throw new Error('Latest backup manifest is not marked verified');

  const expectedChecksum = readFileSync(checksumPath, 'utf8').trim().split(/\s+/)[0];
  const actualChecksum = await sha256(dumpPath);
  if (!expectedChecksum || expectedChecksum !== actualChecksum || manifest.sha256 !== actualChecksum) {
    throw new Error('Backup checksum mismatch');
  }

  const { pgRestore } = resolvePostgresBinaries();
  run(pgRestore, ['--list', dumpPath]);

  const projectId = required('NEON_PROJECT_ID');
  const branches = await neonRequest(`/projects/${encodeURIComponent(projectId)}/branches`);
  const branchExists = branches?.branches?.some((branch) => branch.id === manifest.backupBranchId);
  if (!branchExists) throw new Error(`Neon backup branch is missing: ${manifest.backupBranchId}`);

  const ageMs = Date.now() - new Date(manifest.completedAt || manifest.createdAt).getTime();
  const ageHours = Math.max(0, ageMs / 3_600_000);

  console.log('CRM BACKUP HEALTH');
  console.log(`Latest backup: ${latest}`);
  console.log(`Age: ${ageHours.toFixed(1)} hours`);
  console.log('Dump: VERIFIED');
  console.log('Checksum: VERIFIED');
  console.log(`Neon branch: AVAILABLE (${manifest.backupBranchName})`);
  console.log('STATUS: HEALTHY');
}

main().catch((error) => {
  console.error('CRM BACKUP HEALTH');
  console.error('STATUS: UNHEALTHY');
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
