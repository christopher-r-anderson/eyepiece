-- Keyset pagination for collection item edges walks (position, created_at,
-- asset_preview_snapshot_id) within a collection; extend the covering index
-- with the tiebreaker keys so the walk stays an index scan.

DROP INDEX IF EXISTS public.collection_items_collection_id_position_idx;

CREATE INDEX collection_items_collection_id_walk_idx ON public.collection_items (
  collection_id,
  position,
  created_at,
  asset_preview_snapshot_id
);
