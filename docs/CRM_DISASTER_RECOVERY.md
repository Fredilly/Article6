# Article6 CRM Disaster Recovery

## Scope

This procedure protects the Article6 CRM stored in the production Neon PostgreSQL database. It does not change CRM schema or application behavior.

Production Neon project:

- Name: `article6-production`
- Project ID: `mute-pine-29238261`
- Database connection: `POSTGRES_URL`

## Recovery layers

Article6 uses two independent database recovery layers:

1. A dated Neon branch for fast recovery from bad writes or application mistakes.
2. A PostgreSQL custom-format dump stored outside Git and independently verifiable with SHA-256.

Neon history/PITR is useful but must not be the only recovery mechanism. The production project currently has limited history retention, so verified dumps are the durable recovery artifact.

## Prerequisites

Install PostgreSQL client tools so `pg_dump` and `pg_restore` are available on `PATH`.

Set these server/local environment variables:

```text
POSTGRES_URL=<production Neon connection string>
NEON_PROJECT_ID=mute-pine-29238261
NEON_API_KEY=<Neon API key with access to article6-production>
```

Do not commit any of these secrets.

## Create a backup

From the Article6 repository root:

```bash
npm run crm:backup
```

A successful run prints `BACKUP VERIFIED` and creates:

```text
backups/crm/<timestamp>/
├── article6-crm.dump
├── article6-crm.dump.sha256
├── manifest.json
└── RESTORE.md
```

The command fails closed. It reports `BACKUP FAILED` and exits non-zero if prerequisites are missing, the Neon branch cannot be created, `pg_dump` fails, the dump cannot be inspected by `pg_restore`, or verification cannot complete.

## Check the latest backup

```bash
npm run crm:backup:check
```

The check verifies:

- the newest backup directory exists
- required artifacts exist
- the manifest is marked verified
- SHA-256 matches both the dump and manifest
- `pg_restore --list` can read the archive
- the corresponding Neon backup branch still exists

A healthy result ends with `STATUS: HEALTHY`.

## Restore safely

Never test a restore against production.

1. Create a fresh Neon recovery branch or other fresh PostgreSQL database.
2. Set `RECOVERY_DATABASE_URL` to that database.
3. Re-check the dump checksum.
4. Restore:

```bash
pg_restore \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  --dbname="$RECOVERY_DATABASE_URL" \
  article6-crm.dump
```

5. Run Article6 against the recovered database.
6. Verify at minimum:
   - organizations
   - contacts
   - tender opportunities
   - carbon projects
   - communication history
   - CRM status values
   - project/contact relationships
   - document metadata
7. Only replace or repoint production after explicit approval.

## Storage and retention

`backups/` is ignored by Git and must remain private.

For proper disaster recovery, copy verified dumps to a private off-machine location after creation. A dedicated private Cloudflare R2 backup bucket is the preferred next step because it keeps backups separate from both GitHub and Neon.

Do not use the existing public repository as backup storage and do not place database dumps in customer document storage without a deliberate access/retention policy.

## Branch retention

The backup command does not automatically delete old Neon branches. Automatic deletion would be a destructive infrastructure action and is intentionally excluded from the initial implementation.

Periodically prune old `crm-backup-*` branches after confirming their corresponding independent dumps are safely retained.
