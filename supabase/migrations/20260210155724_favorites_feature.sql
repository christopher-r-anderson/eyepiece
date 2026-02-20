-- tables

-- we can fall back to a default on the title (though it is unlikely), but without href, width, and height, we don't have a usable image
CREATE TABLE IF NOT EXISTS public.asset_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  external_id text NOT NULL,
  title text,
  thumb_href text NOT NULL,
  thumb_width INTEGER NOT NULL,
  thumb_height INTEGER NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT asset_summaries_provider_val_chk CHECK (provider = 'nasa_ivl'),
  CONSTRAINT asset_summaries_external_id_nonempty_chk
    CHECK (length(btrim(external_id)) > 0),
  CONSTRAINT asset_summaries_thumb_href_nonempty_chk
    CHECK (length(btrim(thumb_href)) > 0),
  CONSTRAINT asset_summaries_thumb_width_nonzero_chk CHECK (thumb_width > 0),
  CONSTRAINT asset_summaries_thumb_height_nonzero_chk CHECK (thumb_height > 0),
  UNIQUE (provider, external_id)
);

CREATE TABLE IF NOT EXISTS public.favorites (
  owner_id uuid NOT NULL REFERENCES auth.users (id)
    ON DELETE CASCADE,
  asset_summary_id uuid NOT NULL REFERENCES public.asset_summaries (id)
    ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, asset_summary_id)
);

-- indexes

CREATE INDEX favorites_asset_summary_id_idx ON public.favorites (
  asset_summary_id
);
CREATE INDEX favorites_owner_id_created_at_idx ON public.favorites (
  owner_id,
  created_at DESC
);

-- triggers

DROP TRIGGER IF EXISTS trg_asset_summaries_updated_at ON public.asset_summaries;

CREATE TRIGGER trg_asset_summaries_updated_at
BEFORE UPDATE ON public.asset_summaries
FOR EACH ROW
EXECUTE FUNCTION extensions.moddatetime('updated_at');

-- rls

ALTER TABLE public.asset_summaries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS asset_summaries_select_public ON public.asset_summaries;
CREATE POLICY asset_summaries_select_public ON public.asset_summaries
FOR SELECT
USING (TRUE);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS favorites_select_own ON public.favorites;
CREATE POLICY favorites_select_own ON public.favorites
FOR SELECT
USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS favorites_insert_own ON public.favorites;
CREATE POLICY favorites_insert_own ON public.favorites
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS favorites_delete_own ON public.favorites;
CREATE POLICY favorites_delete_own ON public.favorites
FOR DELETE
USING (auth.uid() = owner_id);

-- function: ensure image ref

CREATE OR REPLACE FUNCTION public.ensure_asset_summary(
  p_provider text,
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
  IF p_provider IS DISTINCT FROM 'nasa_ivl' THEN
    RAISE EXCEPTION 'unsupported provider: %', p_provider;
  END IF;

  INSERT INTO public.asset_summaries (
    provider,
    external_id,
    title,
    thumb_href,
    thumb_width,
    thumb_height
  )
  VALUES (
    p_provider,
    p_external_id,
    p_title,
    p_thumb_href,
    p_thumb_width,
    p_thumb_height
  )
  ON CONFLICT (provider, external_id) DO UPDATE
  SET
    -- Update fields over time when caller provides non-null values.
    title = COALESCE(excluded.title, asset_summaries.title),
    thumb_href = COALESCE(excluded.thumb_href, asset_summaries.thumb_href),
    thumb_width = COALESCE(excluded.thumb_width, asset_summaries.thumb_width),
    thumb_height = COALESCE(excluded.thumb_height, asset_summaries.thumb_height)
  WHERE
    (excluded.title is not null and excluded.title is distinct from asset_summaries.title)
    OR (excluded.thumb_href is not null and excluded.thumb_href is distinct from asset_summaries.thumb_href)
    OR (excluded.thumb_width is not null and excluded.thumb_width is distinct from asset_summaries.thumb_width)
    OR (excluded.thumb_height is not null and excluded.thumb_height is distinct from asset_summaries.thumb_height)

  RETURNING id INTO v_id;

  IF v_id IS NULL THEN
    SELECT id INTO v_id
    FROM public.asset_summaries
    WHERE provider = p_provider AND external_id = p_external_id;
  END IF;

  RETURN v_id;
END;
$$;

REVOKE ALL
ON FUNCTION public.ensure_asset_summary(text, text, text, text, INT, INT)
FROM PUBLIC;
GRANT EXECUTE
ON FUNCTION public.ensure_asset_summary(text, text, text, text, INT, INT)
TO service_role;
