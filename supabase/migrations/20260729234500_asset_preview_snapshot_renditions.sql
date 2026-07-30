-- A snapshot stored one thumbnail. Tiles now build a srcset, so it stores the
-- master's dimensions and the rendition ladder instead.
--
-- Existing rows keep their stored href as a single-rendition ladder so nothing
-- referencing a snapshot breaks. Smithsonian rows also carry a wrong aspect
-- ratio on the records that used to take a hardcoded 4:3, and the grid breaks
-- its rows on that ratio, so those need re-ensuring against the provider.
--
-- The image is nullable: a provider record can carry no file we can render,
-- and storing a placeholder would give the layout a dimension it believes.

ALTER TABLE public.asset_preview_snapshots
ADD COLUMN IF NOT EXISTS image_width INT,
ADD COLUMN IF NOT EXISTS image_height INT,
ADD COLUMN IF NOT EXISTS renditions JSONB;

UPDATE public.asset_preview_snapshots
SET
  image_width = thumb_width,
  image_height = thumb_height,
  renditions = jsonb_build_array(
    jsonb_build_object(
      'href',
      replace(thumb_href, ' ', '%20'),
      'width',
      thumb_width,
      'height',
      thumb_height
    )
  )
WHERE
  renditions IS NULL
  -- the old mapper stored provider hrefs raw (NASA ids carry spaces, encoded
  -- here) and fabricated a data: placeholder for records with nothing to
  -- show. Anything still not an http(s) url after encoding stays an
  -- imageless snapshot rather than a row the new CHECK would abort on; the
  -- backfill re-ensures it
  AND replace(
    thumb_href,
    ' ',
    '%20'
  ) ~ '^https?://[^[:space:]/]+[^[:space:]]*$';

ALTER TABLE public.asset_preview_snapshots
DROP CONSTRAINT IF EXISTS asset_preview_snapshots_thumb_href_nonempty_chk,
DROP CONSTRAINT IF EXISTS asset_preview_snapshots_thumb_width_nonzero_chk,
DROP CONSTRAINT IF EXISTS asset_preview_snapshots_thumb_height_nonzero_chk;

ALTER TABLE public.asset_preview_snapshots
DROP COLUMN IF EXISTS thumb_href,
DROP COLUMN IF EXISTS thumb_width,
DROP COLUMN IF EXISTS thumb_height;

ALTER TABLE public.asset_preview_snapshots
ADD CONSTRAINT asset_preview_snapshots_image_width_nonzero_chk
  CHECK (image_width > 0),
ADD CONSTRAINT asset_preview_snapshots_image_height_nonzero_chk
  CHECK (image_height > 0),
-- an empty ladder is the state the contract exists to rule out
ADD CONSTRAINT asset_preview_snapshots_renditions_nonempty_chk
  CHECK (
    jsonb_typeof(renditions) = 'array'
    AND jsonb_array_length(renditions) > 0
  ),
-- the app validates each entry before it writes, but the backfill script and
-- psql write here too, and a malformed entry costs silently wrong layout
-- rather than an error anyone would notice
-- lax mode on purpose: a missing member is an empty sequence there, so
-- !exists() fires; in strict mode the access errors and the filter goes
-- unknown, which lets the bad entry through.
-- The href rule bans whitespace outright, stricter than the app schema:
-- a raw space also makes the whole srcset unparseable
ADD CONSTRAINT asset_preview_snapshots_renditions_entries_chk
  CHECK (
    NOT jsonb_path_exists(
      renditions,
      '$[*] ? (
        @.type() != "object" ||
        !exists(@.href) || @.href.type() != "string"
          || !(@.href like_regex "^https?://[^[:space:]/]+[^[:space:]]*$") ||
        !exists(@.width) || @.width.type() != "number"
          || @.width <= 0 || @.width != @.width.floor() ||
        !exists(@.height) || @.height.type() != "number"
          || @.height <= 0 || @.height != @.height.floor()
      )'
    )
  ),
-- a half-populated image would be a size without a file to put in it
ADD CONSTRAINT asset_preview_snapshots_image_all_or_nothing_chk
  CHECK (num_nonnulls(image_width, image_height, renditions) IN (0, 3));

DROP FUNCTION IF EXISTS public.ensure_asset_preview_snapshot(
  public.provider_id,
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
  -- defaulted so a caller with no renderable image omits all three rather
  -- than inventing values for them
  p_image_width INT DEFAULT NULL,
  p_image_height INT DEFAULT NULL,
  p_renditions JSONB DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
	v_id uuid;
BEGIN
	-- the row CHECK cannot catch a partial update against a row that already
	-- holds a full image: the COALESCEs below would fold it into mixed data
	IF num_nonnulls(p_image_width, p_image_height, p_renditions) NOT IN (0, 3)
	THEN
		RAISE EXCEPTION
			'image width, height and renditions must be supplied together';
	END IF;

	INSERT INTO public.asset_preview_snapshots (
		provider_id,
		external_id,
		title,
		image_width,
		image_height,
		renditions
	)
	VALUES (
		p_provider_id,
		p_external_id,
		p_title,
		p_image_width,
		p_image_height,
		p_renditions
	)
	ON CONFLICT (provider_id, external_id) DO UPDATE
	SET
		-- keep each field when the caller passes null; the moddatetime trigger
		-- bumps updated_at on the update
		title = COALESCE(excluded.title, asset_preview_snapshots.title),
		image_width = COALESCE(
			excluded.image_width, asset_preview_snapshots.image_width
		),
		image_height = COALESCE(
			excluded.image_height, asset_preview_snapshots.image_height
		),
		renditions = COALESCE(
			excluded.renditions, asset_preview_snapshots.renditions
		)
	RETURNING id INTO v_id;

	RETURN v_id;
END;
$$;

-- Supabase's default privileges grant EXECUTE on new functions to anon and
-- authenticated directly, so revoking from PUBLIC alone leaves both roles
-- able to call this service-only function.
REVOKE ALL
ON FUNCTION public.ensure_asset_preview_snapshot(
  public.provider_id,
  text,
  text,
  INTEGER,
  INTEGER,
  JSONB
)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE
ON FUNCTION public.ensure_asset_preview_snapshot(
  public.provider_id,
  text,
  text,
  INTEGER,
  INTEGER,
  JSONB
)
TO service_role;
