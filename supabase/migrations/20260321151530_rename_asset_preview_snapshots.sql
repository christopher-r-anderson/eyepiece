-- updating in a single migration since we aren't production yet

BEGIN;

ALTER TABLE IF EXISTS public.asset_summaries
RENAME TO asset_preview_snapshots;

DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'favorites'
			AND column_name = 'asset_summary_id'
	) THEN
		ALTER TABLE public.favorites
		RENAME COLUMN asset_summary_id TO asset_preview_snapshot_id;
	END IF;
END;
$$;

DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'asset_preview_snapshots'
			AND column_name = 'provider'
	) THEN
		ALTER TABLE public.asset_preview_snapshots
		RENAME COLUMN provider TO provider_id;
	END IF;
END;
$$;

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_type t
		JOIN pg_namespace n ON n.oid = t.typnamespace
		WHERE t.typname = 'provider_id' AND n.nspname = 'public'
	) THEN
		CREATE TYPE public.provider_id AS ENUM ('nasa_ivl', 'si_oa');
	END IF;
END;
$$;

ALTER TABLE public.asset_preview_snapshots
DROP CONSTRAINT IF EXISTS asset_preview_snapshots_provider_val_chk;

ALTER TABLE public.asset_preview_snapshots
DROP CONSTRAINT IF EXISTS asset_summaries_provider_val_chk;

DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'asset_preview_snapshots'
			AND column_name = 'provider_id'
			AND udt_schema = 'pg_catalog'
			AND udt_name = 'text'
	) THEN
		ALTER TABLE public.asset_preview_snapshots
		ALTER COLUMN provider_id TYPE public.provider_id
		USING provider_id::public.provider_id;
	END IF;
END;
$$;

DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'asset_summaries_external_id_nonempty_chk'
			AND conrelid = 'public.asset_preview_snapshots'::regclass
	) THEN
		ALTER TABLE public.asset_preview_snapshots
		RENAME CONSTRAINT asset_summaries_external_id_nonempty_chk
			TO asset_preview_snapshots_external_id_nonempty_chk;
	END IF;

	IF EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'asset_summaries_thumb_href_nonempty_chk'
			AND conrelid = 'public.asset_preview_snapshots'::regclass
	) THEN
		ALTER TABLE public.asset_preview_snapshots
		RENAME CONSTRAINT asset_summaries_thumb_href_nonempty_chk
			TO asset_preview_snapshots_thumb_href_nonempty_chk;
	END IF;

	IF EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'asset_summaries_thumb_width_nonzero_chk'
			AND conrelid = 'public.asset_preview_snapshots'::regclass
	) THEN
		ALTER TABLE public.asset_preview_snapshots
		RENAME CONSTRAINT asset_summaries_thumb_width_nonzero_chk
			TO asset_preview_snapshots_thumb_width_nonzero_chk;
	END IF;

	IF EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'asset_summaries_thumb_height_nonzero_chk'
			AND conrelid = 'public.asset_preview_snapshots'::regclass
	) THEN
		ALTER TABLE public.asset_preview_snapshots
		RENAME CONSTRAINT asset_summaries_thumb_height_nonzero_chk
			TO asset_preview_snapshots_thumb_height_nonzero_chk;
	END IF;

	IF EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'favorites_asset_summary_id_fkey'
			AND conrelid = 'public.favorites'::regclass
	) THEN
		ALTER TABLE public.favorites
		RENAME CONSTRAINT favorites_asset_summary_id_fkey
			TO favorites_asset_preview_snapshot_id_fkey;
	END IF;
END;
$$;

ALTER INDEX IF EXISTS public.favorites_asset_summary_id_idx
RENAME TO favorites_asset_preview_snapshot_id_idx;

DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM pg_trigger
		WHERE tgname = 'trg_asset_summaries_updated_at'
			AND tgrelid = 'public.asset_preview_snapshots'::regclass
	) THEN
		ALTER TRIGGER trg_asset_summaries_updated_at
			ON public.asset_preview_snapshots
			RENAME TO trg_asset_preview_snapshots_updated_at;
	END IF;

	IF EXISTS (
		SELECT 1
		FROM pg_policies
		WHERE schemaname = 'public'
			AND tablename = 'asset_preview_snapshots'
			AND policyname = 'asset_summaries_select_public'
	) THEN
		ALTER POLICY asset_summaries_select_public
			ON public.asset_preview_snapshots
			RENAME TO asset_preview_snapshots_select_public;
	END IF;
END;
$$;

DO $$
BEGIN
	IF to_regprocedure(
		'public.ensure_asset_summary(text, text, text, text, integer, integer)'
	) IS NOT NULL THEN
		EXECUTE $sql$
			ALTER FUNCTION public.ensure_asset_summary(
				text,
				text,
				text,
				text,
				integer,
				integer
			)
			RENAME TO ensure_asset_preview_snapshot
		$sql$;
	END IF;
END;
$$;

DROP FUNCTION IF EXISTS public.ensure_asset_preview_snapshot(
  text,
  text,
  text,
  text,
  INTEGER,
  INTEGER
);

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
		-- Update fields over time when caller provides non-null values.
		title = COALESCE(excluded.title, asset_preview_snapshots.title),
		thumb_href = COALESCE(excluded.thumb_href, asset_preview_snapshots.thumb_href),
		thumb_width = COALESCE(excluded.thumb_width, asset_preview_snapshots.thumb_width),
		thumb_height = COALESCE(excluded.thumb_height, asset_preview_snapshots.thumb_height)
	WHERE
		(excluded.title is not null and excluded.title is distinct from asset_preview_snapshots.title)
		OR (excluded.thumb_href is not null and excluded.thumb_href is distinct from asset_preview_snapshots.thumb_href)
		OR (excluded.thumb_width is not null and excluded.thumb_width is distinct from asset_preview_snapshots.thumb_width)
		OR (excluded.thumb_height is not null and excluded.thumb_height is distinct from asset_preview_snapshots.thumb_height)

	RETURNING id INTO v_id;

	IF v_id IS NULL THEN
		SELECT id INTO v_id
		FROM public.asset_preview_snapshots
		WHERE provider_id = p_provider_id AND external_id = p_external_id;
	END IF;

	RETURN v_id;
END;
$$;

REVOKE ALL
ON FUNCTION public.ensure_asset_preview_snapshot(
  public.provider_id,
  text,
  text,
  text,
  INTEGER,
  INTEGER
)
FROM PUBLIC;

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

COMMIT;
