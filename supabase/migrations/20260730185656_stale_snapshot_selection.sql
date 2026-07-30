-- Selection for the weekly snapshot revalidation job (#205).
--
-- Referenced rows only: the nightly orphan sweep deletes unreferenced
-- snapshots whose updated_at is 30 days old, and revalidating an orphan
-- would bump that timestamp every week and keep the row ahead of the sweep
-- forever. A row nothing displays needs no fresh data.
--
-- Keyset-paginated: PostgREST caps a response at 1000 rows, and rows the
-- job deliberately leaves stale (gone upstream, failed) sort first, so a
-- plain limited query would eventually starve everything behind them.

CREATE OR REPLACE FUNCTION public.select_stale_referenced_snapshots(
  p_stale_before timestamptz,
  p_after_updated_at timestamptz DEFAULT NULL,
  p_after_id uuid DEFAULT NULL,
  p_limit INTEGER DEFAULT 200
)
RETURNS TABLE (
  id uuid,
  provider_id public.provider_id,
  external_id text,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT s.id, s.provider_id, s.external_id, s.updated_at
  FROM public.asset_preview_snapshots AS s
  WHERE
    s.updated_at < p_stale_before
    AND (
      p_after_updated_at IS NULL
      OR (s.updated_at, s.id) > (p_after_updated_at, p_after_id)
    )
    AND (
      EXISTS (
        SELECT 1
        FROM public.favorites AS f
        WHERE f.asset_preview_snapshot_id = s.id
      )
      OR EXISTS (
        SELECT 1
        FROM public.collection_items AS ci
        WHERE ci.asset_preview_snapshot_id = s.id
      )
    )
  ORDER BY s.updated_at, s.id
  LIMIT p_limit;
$$;

-- Supabase's default privileges grant EXECUTE on new functions to anon and
-- authenticated directly, so revoking from PUBLIC alone leaves both roles
-- able to call this service-only function.
REVOKE ALL
ON FUNCTION public.select_stale_referenced_snapshots(
  timestamptz,
  timestamptz,
  uuid,
  INTEGER
)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE
ON FUNCTION public.select_stale_referenced_snapshots(
  timestamptz,
  timestamptz,
  uuid,
  INTEGER
)
TO service_role;
