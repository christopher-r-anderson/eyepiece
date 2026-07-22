-- types

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'collection_visibility' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.collection_visibility AS ENUM ('public', 'private');
  END IF;
END;
$$;

-- tables

CREATE TABLE IF NOT EXISTS public.collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users (id)
    ON DELETE CASCADE,
  name text NOT NULL,
  visibility public.collection_visibility NOT NULL DEFAULT 'private',
  position NUMERIC NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT collections_name_nonempty_chk CHECK (length(btrim(name)) > 0),
  CONSTRAINT collections_name_length_chk CHECK (char_length(name) <= 120)
);

-- RESTRICT, not CASCADE: a referenced snapshot must never be deletable, so
-- the orphan sweep below is guarded by construction
CREATE TABLE IF NOT EXISTS public.collection_items (
  collection_id uuid NOT NULL REFERENCES public.collections (id)
    ON DELETE CASCADE,
  asset_preview_snapshot_id uuid NOT NULL REFERENCES public.asset_preview_snapshots (
    id
  )
    ON DELETE RESTRICT,
  position NUMERIC NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (collection_id, asset_preview_snapshot_id)
);

-- deleting a referenced snapshot should fail loudly, not silently remove
-- rows from users' favorites
ALTER TABLE public.favorites
DROP CONSTRAINT IF EXISTS favorites_asset_preview_snapshot_id_fkey;

ALTER TABLE public.favorites
ADD CONSTRAINT favorites_asset_preview_snapshot_id_fkey
  FOREIGN KEY (
    asset_preview_snapshot_id
  ) REFERENCES public.asset_preview_snapshots (id)
    ON DELETE RESTRICT;

-- indexes

CREATE INDEX collections_owner_id_position_idx ON public.collections (
  owner_id,
  position
);
CREATE INDEX collection_items_collection_id_position_idx ON public.collection_items (
  collection_id,
  position
);
CREATE INDEX collection_items_asset_preview_snapshot_id_idx ON public.collection_items (
  asset_preview_snapshot_id
);

-- triggers

DROP TRIGGER IF EXISTS trg_collections_updated_at ON public.collections;

CREATE TRIGGER trg_collections_updated_at
BEFORE UPDATE ON public.collections
FOR EACH ROW
EXECUTE FUNCTION extensions.moddatetime('updated_at');

-- rls

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- private collections return zero rows to non-owners; the app maps empty
-- to not-found
DROP POLICY IF EXISTS collections_select_own_or_public ON public.collections;
CREATE POLICY collections_select_own_or_public ON public.collections
FOR SELECT
USING (auth.uid() = owner_id OR visibility = 'public');

DROP POLICY IF EXISTS collections_insert_own ON public.collections;
CREATE POLICY collections_insert_own ON public.collections
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS collections_update_own ON public.collections;
CREATE POLICY collections_update_own ON public.collections
FOR UPDATE
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS collections_delete_own ON public.collections;
CREATE POLICY collections_delete_own ON public.collections
FOR DELETE
USING (auth.uid() = owner_id);

ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS collection_items_select_own_or_public ON public.collection_items;
CREATE POLICY collection_items_select_own_or_public ON public.collection_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.collections AS c
    WHERE
      c.id = collection_id
      AND (c.owner_id = auth.uid() OR c.visibility = 'public')
  )
);

DROP POLICY IF EXISTS collection_items_insert_own ON public.collection_items;
CREATE POLICY collection_items_insert_own ON public.collection_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.collections AS c
    WHERE c.id = collection_id AND c.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS collection_items_delete_own ON public.collection_items;
CREATE POLICY collection_items_delete_own ON public.collection_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.collections AS c
    WHERE c.id = collection_id AND c.owner_id = auth.uid()
  )
);

-- function: orphan snapshot sweep

-- The grace window stays comfortably above the 7-day snapshot stale window
-- so the non-atomic ensure-then-reference two-step can never race the sweep.
CREATE OR REPLACE FUNCTION public.delete_orphaned_asset_preview_snapshots()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_deleted integer;
BEGIN
  DELETE FROM public.asset_preview_snapshots s
  WHERE s.updated_at < now() - INTERVAL '30 days'
    AND NOT EXISTS (
      SELECT 1
      FROM public.favorites f
      WHERE f.asset_preview_snapshot_id = s.id
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.collection_items ci
      WHERE ci.asset_preview_snapshot_id = s.id
    );
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- Supabase's default privileges grant EXECUTE on new functions to anon and
-- authenticated directly, so revoking from PUBLIC alone leaves both roles
-- able to call service-only functions.
REVOKE ALL
ON FUNCTION public.delete_orphaned_asset_preview_snapshots()
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE
ON FUNCTION public.delete_orphaned_asset_preview_snapshots()
TO service_role;

-- close the same hole on the existing snapshot upsert RPC: its migration
-- revoked PUBLIC only, leaving it callable by anon
REVOKE ALL
ON FUNCTION public.ensure_asset_preview_snapshot(
  public.provider_id,
  text,
  text,
  text,
  INTEGER,
  INTEGER
)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE
ON FUNCTION public.ensure_asset_preview_snapshot(
  public.provider_id,
  text,
  text,
  text,
  INTEGER,
  INTEGER
)
TO service_role;
