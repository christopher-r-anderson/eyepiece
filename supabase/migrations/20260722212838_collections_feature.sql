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

-- function: ensure snapshot

-- ensure must refresh updated_at on every call: the sweep treats an old
-- updated_at as collectable and the staleness cache uses it to decide when to
-- refetch, so a snapshot just verified against the provider has to look fresh.
-- Keep the ON CONFLICT update unconditional (COALESCE guards content,
-- moddatetime bumps the timestamp) - gating it on content changing would leave
-- a re-verified row looking stale, letting the sweep delete a snapshot a
-- consumer is about to reference and refetching unchanged assets forever.
CREATE OR REPLACE FUNCTION public.ensure_asset_preview_snapshot(
  p_provider_id public.provider_id,
  p_external_id text,
  p_title text,
  p_thumb_href text,
  p_thumb_width INT,
  p_thumb_height INT
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.asset_preview_snapshots (
    provider_id,
    external_id,
    title,
    thumb_href,
    thumb_width,
    thumb_height
  )
  VALUES (
    p_provider_id,
    p_external_id,
    p_title,
    p_thumb_href,
    p_thumb_width,
    p_thumb_height
  )
  ON CONFLICT (provider_id, external_id) DO UPDATE
  SET
    -- keep each field when the caller passes null; the moddatetime trigger
    -- bumps updated_at on the update
    title = COALESCE(excluded.title, asset_preview_snapshots.title),
    thumb_href = COALESCE(
      excluded.thumb_href, asset_preview_snapshots.thumb_href
    ),
    thumb_width = COALESCE(
      excluded.thumb_width, asset_preview_snapshots.thumb_width
    ),
    thumb_height = COALESCE(
      excluded.thumb_height, asset_preview_snapshots.thumb_height
    )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- function: orphan snapshot sweep

-- The grace window stays comfortably above the 7-day snapshot stale window,
-- and ensure refreshes updated_at, so a just-ensured snapshot is never inside
-- the deletion window and the ensure-then-reference two-step is safe.
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

-- the snapshot upsert RPC needs the same revoke (it is service-role only)
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

-- schedule: run the orphan sweep nightly via pg_cron

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- cron.schedule upserts by job name (pg_cron >= 1.4), so replaying this
-- migration re-points the one job rather than stacking duplicates. The job
-- runs as the scheduling role (postgres), which owns the function and can
-- execute it regardless of the service-role-only grant above.
SELECT
  cron.schedule(
    'snapshot-orphan-sweep',
    '30 3 * * *',
    'SELECT public.delete_orphaned_asset_preview_snapshots()'
  );
