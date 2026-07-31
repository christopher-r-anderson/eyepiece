-- Keyset pagination for favorites edges orders by (created_at DESC,
-- asset_preview_snapshot_id DESC); extend the covering index with the
-- tiebreaker so the walk stays an index scan.

DROP INDEX IF EXISTS public.favorites_owner_id_created_at_idx;

CREATE INDEX favorites_owner_id_created_at_snapshot_idx ON public.favorites (
  owner_id,
  created_at DESC,
  asset_preview_snapshot_id DESC
);
