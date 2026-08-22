-- Reconcile project presentation without deleting any project, organization, or link.
-- The existing unique VCS index already provides one canonical project row per VCS ID.
ALTER TABLE sales_projects
  ADD COLUMN IF NOT EXISTS legacy_name TEXT;

DO $$
DECLARE
  conflict_count INTEGER;
BEGIN
  -- Normalize harmless VCS-ID formatting differences before enforcing the existing
  -- unique index. Abort rather than silently choosing a winner if real collisions
  -- are found.
  SELECT COUNT(*) INTO conflict_count
  FROM (
    SELECT regexp_replace(lower(trim(vcs_id)), '^vcs[[:space:]]*', '') AS normalized_vcs_id
    FROM sales_projects
    WHERE NULLIF(trim(vcs_id), '') IS NOT NULL
    GROUP BY 1
    HAVING COUNT(*) > 1
  ) collisions;

  IF conflict_count > 0 THEN
    RAISE EXCEPTION 'Sales project reconciliation found % normalized VCS ID collisions; no data was changed.', conflict_count;
  END IF;
END $$;

UPDATE sales_projects
SET vcs_id = regexp_replace(lower(trim(vcs_id)), '^vcs[[:space:]]*', '')
WHERE NULLIF(trim(vcs_id), '') IS NOT NULL
  AND vcs_id IS DISTINCT FROM regexp_replace(lower(trim(vcs_id)), '^vcs[[:space:]]*', '');

UPDATE sales_projects
SET legacy_name = name,
    name = 'VCS ' || trim(vcs_id) || ' · ' || COALESCE(
      NULLIF(trim(regexp_replace(name, '^[[:space:]]*VCS[[:space:]]*' || trim(vcs_id) || '[[:space:]]*[·:|-]?[[:space:]]*', '', 'i')), ''),
      'Project ' || trim(vcs_id)
    ),
    updated_at = NOW()
WHERE NULLIF(trim(vcs_id), '') IS NOT NULL
  AND name IS DISTINCT FROM 'VCS ' || trim(vcs_id) || ' · ' || COALESCE(
    NULLIF(trim(regexp_replace(name, '^[[:space:]]*VCS[[:space:]]*' || trim(vcs_id) || '[[:space:]]*[·:|-]?[[:space:]]*', '', 'i')), ''),
    'Project ' || trim(vcs_id)
  );

CREATE UNIQUE INDEX IF NOT EXISTS sales_projects_normalized_vcs_id_uq
  ON sales_projects (lower(trim(vcs_id)))
  WHERE NULLIF(trim(vcs_id), '') IS NOT NULL;
