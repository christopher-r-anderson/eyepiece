/*
Local dev seed users
 */
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

BEGIN;

INSERT INTO auth.users
  (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    -- these have to be an empty string, not null or else `Database error querying schema` on login
    confirmation_token,
    recovery_token,
    email_change,
    email_change_token_new
  )
SELECT
  '00000000-0000-0000-0000-000000000000'::uuid,
  s.id,
  'authenticated',
  'authenticated',
  s.email,
  extensions.crypt(s.password, extensions.gen_salt('bf')),
  CASE
    WHEN s.email_confirmed THEN now()
    ELSE NULL
  END,
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object(
    'display_name',
    nullif(btrim(s.display_name), ''),
    'email_verified',
    s.email_confirmed
  ),
  now(),
  now(),
  '',
  '',
  '',
  ''
FROM
  (
    VALUES
      -- add seed users here. can't use a temp table locally (it does not exist when referencing) so just using values
      (
        '7e5dfb34-a0ad-41bb-ac2a-bb159c270ee3',
        'user1@example.com',
        'hunter2',
        TRUE,
        'Demo User'
      ),
      (
        gen_random_uuid(),
        'user2@example.com',
        'password123',
        FALSE,
        'Unconfirmed Person'
      )
  ) AS s (id, email, password, email_confirmed, display_name);

INSERT INTO public.profiles (id, display_name)
SELECT
  u.id,
  u.raw_user_meta_data ->> 'display_name'
FROM auth.users AS u;

/* Note: setting email_verified: false even though it was true on user, because that's what the admin ui did */
INSERT INTO auth.identities
  (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
SELECT
  gen_random_uuid(),
  u.id,
  jsonb_build_object(
    'sub',
    u.id::text,
    'email',
    u.email,
    'email_verified',
    FALSE,
    'phone_verified',
    FALSE
  ),
  'email',
  u.id::text,
  now(),
  now(),
  now()
FROM auth.users AS u;

WITH
  new_asset_preview_snapshots AS (
    INSERT INTO public.asset_preview_snapshots
      (provider_id, external_id, title, thumb_href, thumb_width, thumb_height)
    VALUES
      (
        'nasa_ivl',
        'iss034e010322',
        'Open Food Packet',
        'https://images-assets.nasa.gov/image/iss034e010322/iss034e010322~thumb.jpg',
        640,
        425
      ),
      (
        'nasa_ivl',
        'KSC-06pd1454',
        NULL,
        'https://images-assets.nasa.gov/image/KSC-06pd1454/KSC-06pd1454~thumb.jpg',
        425,
        640
      ),
      (
        'nasa_ivl',
        '7026024',
        'Skylab',
        'https://images-assets.nasa.gov/image/7026024/7026024~thumb.jpg',
        640,
        463
      ),
      (
        'nasa_ivl',
        'iss033e018991',
        'Hair Cut',
        'https://images-assets.nasa.gov/image/iss033e018991/iss033e018991~thumb.jpg',
        640,
        425
      ),
      (
        'nasa_ivl',
        'PIA16416',
        'A Game of Shadows',
        'https://images-assets.nasa.gov/image/PIA16416/PIA16416~thumb.jpg',
        640,
        624
      )
    RETURNING id
  )
INSERT INTO favorites (owner_id, asset_preview_snapshot_id)
SELECT '7e5dfb34-a0ad-41bb-ac2a-bb159c270ee3', id
FROM new_asset_preview_snapshots;
COMMIT;
