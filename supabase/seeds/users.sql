/*
 Local dev seed users
 */
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

BEGIN;

-- CREATE TEMP TABLE seed_users (
--   email text PRIMARY KEY,
--   password text NOT NULL,
--   email_confirmed boolean NOT NULL DEFAULT false,
--   given_name text,
--   family_name text
-- ) ON COMMIT DROP;
-- -- Add seed users here
-- INSERT INTO
--   seed_users (
--     email,
--     password,
--     email_confirmed,
--     given_name,
--     family_name
--   )
-- VALUES
--   (
--     'user1@example.com',
--     'hunter2',
--     true,
--     'Demo',
--     'User'
--   ),
--   (
--     'user2@example.com',
--     'password123',
--     false,
--     'Unconfirmed',
--     'Person'
--   );
-- do not edit below just to change seed users
INSERT INTO
  auth.users (
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
  '00000000-0000-0000-0000-000000000000' :: uuid,
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  s.email,
  extensions.crypt(s.password, extensions.gen_salt('bf')),
  CASE
    WHEN s.email_confirmed THEN now()
    ELSE NULL
  END,
  '{"provider":"email","providers":["email"]}' :: jsonb,
  jsonb_build_object(
    'given_name',
    nullif(btrim(s.given_name), ''),
    'family_name',
    nullif(btrim(s.family_name), ''),
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
        'user1@example.com',
        'hunter2',
        true,
        'Demo',
        'User'
      ),
      (
        'user2@example.com',
        'password123',
        false,
        'Unconfirmed',
        'Person'
      )
  ) s (
    email,
    password,
    email_confirmed,
    given_name,
    family_name
  );

/* Note: setting email_verified: false even though it was true on user, because that's what the admin ui did */
INSERT INTO
  auth.identities (
    id,
    user_id,
    -- email,
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
  -- u.email,
  jsonb_build_object(
    'sub',
    u.id :: text,
    'email',
    u.email,
    'email_verified',
    false,
    'phone_verified',
    false
  ),
  'email',
  u.id :: text,
  now(),
  now(),
  now()
FROM
  auth.users u;

COMMIT;
