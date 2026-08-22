# Carbon project relationship model audit

Status: proposal only. This audit does not add or apply a migration.

## Scope and evidence

The repository migrations and sales store were audited on `main` as of 2026-08-23. No live database connection was configured in the workspace, so the findings below describe the committed schema and application queries. Before implementation, run the proposed inventory queries against the target database and compare the result with the migration history.

## 1. Current schema findings

### Organizations

`sales_organizations` is the account-level entity. It has one row per normalized organization name and a partial unique index on domain. It owns:

- `sales_contacts` through `sales_contacts.organization_id` (one organization to many contacts).
- `sales_tender_opportunities` through `sales_tender_opportunities.organization_id` (one organization to many tender opportunities).
- `sales_interactions` through the required `sales_interactions.organization_id`.

Organization identity is protected by unique normalized name and domain indexes. The current merge flow moves contacts, interactions, tenders, and project links without creating a duplicate organization.

### Carbon projects

`sales_projects` is the project-level entity. It stores VCS identity, name, methodology, version, stage, country, VVB, documents, and current sales workflow fields. `vcs_id` is unique when present.

The relationship table is:

```text
sales_organization_projects
  organization_id -> sales_organizations(id) ON DELETE CASCADE
  project_id      -> sales_projects(id)      ON DELETE CASCADE
  role            VARCHAR(64) NOT NULL DEFAULT 'OTHER'
  PRIMARY KEY (organization_id, project_id)
```

This is a real many-to-many model. A project can link to many organizations, and an organization can link to many projects. The role is stored on the relationship, not on either entity, which is the correct location for Developer, Owner, Consultant, PDD Author, Investor, Validation Body, or Implementing Partner.

### Contacts and project relationships

Contacts belong to exactly one organization. There is no direct contact↔project table. A contact can be associated with a project only indirectly through `sales_interactions.project_id` (and similarly a tender contact through a tender opportunity). This is adequate for communication history but cannot represent a contact's standing project role or project membership without an interaction.

### Sales opportunities

`sales_tender_opportunities` is organization-owned and supports one organization to many tender opportunities. It is not related to `sales_projects`; this is appropriate for Tender Readiness records but means it is not a generic opportunity model for carbon project sales.

`sales_interactions` can reference an organization, contact, carbon project, or tender opportunity. Carbon interactions use `project_id`; tender interactions use `tender_opportunity_id`.

## 2. Relationship classification

| Relationship | Current model | Assessment |
| --- | --- | --- |
| Organization → contacts | `sales_contacts.organization_id` | One-to-many |
| Organization ↔ carbon project | `sales_organization_projects` | Full many-to-many |
| Organization → tender opportunity | `sales_tender_opportunities.organization_id` | One-to-many |
| Contact → carbon project | No direct table; inferred from interactions | Partial / history-only |
| Carbon project → interactions | Nullable `sales_interactions.project_id` | Partial, with weak cross-entity integrity |

Therefore the answer to the core question is **(c) full many-to-many support for organizations and carbon projects**, with partial support for contact/project membership and relationship-specific sales state.

## 3. Problems with the existing model

1. **Sales workflow is project-global, not relationship-specific.** `sales_status`, `assigned_owner`, and next-action fields live on `sales_projects`. Updating the workflow through one organization updates the shared project row for every linked organization. If two organizations have different commercial relationships with the same project, the last update wins.

2. **Project interactions do not enforce the organization/project pair.** `sales_interactions` has independent foreign keys to `organization_id` and `project_id`, but no composite foreign key to `sales_organization_projects`. The application can therefore persist an interaction whose project is not linked to its organization.

3. **Contact ownership is not enforced against the interaction organization.** `contact_id` and `organization_id` are also independent. A contact from another organization can be attached unless application code prevents it. There is no direct project-contact relationship for contacts who should be associated with a project but have no interaction yet.

4. **Roles are free text.** The join table stores a role, but there is no controlled vocabulary, role lookup table, or check constraint. Typos and aliases such as `CONSULTANT`, `TECHNICAL CONSULTANT`, and `PDD AUTHOR` can fragment reporting.

5. **Some views intentionally collapse many-to-many data.** The action queue chooses one canonical organization per project with `DISTINCT ON`, so a multi-organization project appears under only one account in that queue. This is acceptable for a single-account queue item only if documented; it is not a complete relationship view.

6. **Merge conflict handling can lose relationship metadata.** Organization merge inserts source links into the target with `ON CONFLICT (organization_id, project_id) DO NOTHING`. If both organizations are linked to the same project with different roles, the target's existing role wins and the source role is discarded.

## 4. Recommended migration plan

Implement this in separate, reviewable migrations after a production data inventory.

### Phase 0: inventory and validation

Before changing constraints, report:

- project links grouped by project and organization;
- blank, unknown, or inconsistent role values;
- interactions whose `(organization_id, project_id)` pair has no row in `sales_organization_projects`;
- interactions whose contact belongs to a different organization;
- duplicate project links or orphaned records;
- projects linked to multiple organizations with conflicting project-level workflow expectations;
- merge candidates where the same project is linked from both organizations with different roles.

Do not silently repair these records. Produce an exception list and obtain a data-owner decision for each category.

### Phase 1: make the relationship a stronger first-class entity

Retain `sales_projects` and `sales_organization_projects` to preserve IDs and history. Extend the join row with relationship-specific commercial fields, at minimum:

- normalized role (or a role reference);
- relationship sales status;
- assigned owner;
- next action and next action date;
- relationship notes and timestamps.

Keep project-level fields for project lifecycle facts that are genuinely shared across all organizations. Move or deprecate relationship-specific workflow writes only after backfilling and updating the store/UI.

### Phase 2: enforce relationship integrity

After resolving existing exceptions, add a composite foreign key from `(sales_interactions.organization_id, sales_interactions.project_id)` to the project relationship primary key for carbon interactions. Add equivalent organization/contact integrity if the product continues to allow contact IDs on organization-scoped interactions. Preserve nullable fields for organization-only interactions.

If project contacts need to exist before an interaction, add a separate `sales_project_contacts` table rather than overloading interaction history. Give it a composite relationship to the organization/project link so a contact cannot be assigned across unrelated accounts.

### Phase 3: normalize roles and backfill

Choose a canonical role vocabulary and map existing role strings before adding a check constraint or role reference table. The migration must be idempotent, preserve the original link and project IDs, and record unmappable values for manual review.

## 5. Required UI changes when implementing the migration

No UI changes are required for this audit PR. When the schema work is implemented, the following UI changes will be required:

- show the organization/project role from the relationship row everywhere a project is listed under an organization;
- edit relationship-level owner, status, and next action without overwriting the shared project row;
- provide a project-first view listing every linked organization and role;
- make the action queue's handling of multi-organization projects explicit, or show one queue item per organization/project relationship;
- show project contacts separately from email/interactions if a direct project-contact table is introduced;
- preserve existing contact management, relationship history, search, and navigation URLs.

## 6. Data migration risks and safeguards

- **Do not duplicate organizations.** Use existing organization IDs and the normalized-name/domain indexes; only add or update relationship rows.
- **Do not recreate projects by name.** Preserve project IDs and use the unique VCS ID as the identity where available.
- **Do not rewrite email history.** Preserve interaction IDs, timestamps, external references, and Gmail thread IDs. Repair only invalid foreign-key relationships after explicit review.
- **Shared workflow data may be ambiguous.** A project-level owner/status cannot be safely copied to every organization/project relationship without deciding whether it represents project lifecycle or account sales state.
- **Role conflicts during merges need a policy.** If both source and target organizations have different roles on the same project, retain both only if the model allows multiple role rows; otherwise choose and record the winning role rather than silently dropping one.
- **Constraint addition can fail on old data.** Run the Phase 0 exception queries first and apply constraints only after all violations are resolved.
- **Tender records are separate.** Do not attach tender opportunities to carbon projects as part of this change; preserve their existing organization/contact relationships.

## Recommendation

The core organization/project relationship does not need to be replaced: it already supports full many-to-many cardinality and stores role on the link. Schema changes are nevertheless required to make project relationships safe as first-class sales entities: relationship-level workflow fields, composite integrity for project interactions, and controlled roles should be added in a follow-up implementation PR after data inventory.
