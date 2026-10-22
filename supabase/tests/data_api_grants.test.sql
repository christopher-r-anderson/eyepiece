BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET search_path = public, extensions;
SELECT no_plan();

-- Exact privileges, not just successful reads: legacy ALL grants must fail.
WITH
  access(table_name, anon_ops, authenticated_ops) AS (
    VALUES
      ('profiles', ARRAY['SELECT'], ARRAY['SELECT', 'INSERT', 'UPDATE']),
      ('favorites', ARRAY[]::text[], ARRAY['SELECT', 'INSERT', 'DELETE']),
      ('asset_preview_snapshots', ARRAY['SELECT'], ARRAY['SELECT']),
      (
        'collections',
        ARRAY['SELECT'],
        ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE']
      ),
      ('collection_items', ARRAY['SELECT'], ARRAY['SELECT', 'INSERT', 'DELETE'])
  )
SELECT
  extensions."is"(
    has_table_privilege(role_name, 'public.' || table_name, privilege),
    privilege = ANY (
      CASE role_name
        WHEN 'anon' THEN anon_ops
        WHEN 'authenticated' THEN authenticated_ops
        ELSE ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE']
      END
    ),
    role_name || ' ' || privilege || ' on ' || table_name
  )
FROM
  access
  CROSS JOIN unnest(ARRAY['anon', 'authenticated', 'service_role']) AS role_name
  CROSS JOIN unnest(
    ARRAY[
      'SELECT',
      'INSERT',
      'UPDATE',
      'DELETE',
      'TRUNCATE',
      'REFERENCES',
      'TRIGGER',
      'MAINTAIN'
    ]
  ) AS privilege;

SELECT ok(relrowsecurity, relname || ' still has RLS')
FROM pg_class
WHERE
  oid IN (
    'public.profiles'::regclass,
    'public.favorites'::regclass,
    'public.asset_preview_snapshots'::regclass,
    'public.collections'::regclass,
    'public.collection_items'::regclass
  );

-- A real new object catches both schema and global defaults/inheritance.
CREATE TABLE public.grant_probe (id BIGINT GENERATED ALWAYS AS IDENTITY);
ALTER TABLE public.grant_probe ENABLE ROW LEVEL SECURITY;
SELECT
  ok(
    NOT has_table_privilege(role_name, 'public.grant_probe', privilege),
    'new table does not expose ' || privilege || ' to ' || role_name
  )
FROM
  unnest(ARRAY['anon', 'authenticated', 'service_role']) AS role_name
  CROSS JOIN unnest(
    ARRAY[
      'SELECT',
      'INSERT',
      'UPDATE',
      'DELETE',
      'TRUNCATE',
      'REFERENCES',
      'TRIGGER',
      'MAINTAIN'
    ]
  ) AS privilege;
SELECT
  ok(
    NOT has_sequence_privilege(
      role_name,
      'public.grant_probe_id_seq',
      privilege
    ),
    'new sequence does not expose ' || privilege || ' to ' || role_name
  )
FROM
  unnest(ARRAY['anon', 'authenticated', 'service_role']) AS role_name
  CROSS JOIN unnest(ARRAY['USAGE', 'SELECT', 'UPDATE']) AS privilege;

SELECT
  extensions."is"(
    has_function_privilege(role_name, signature, 'EXECUTE'),
    role_name = 'service_role',
    role_name || ' execute ' || signature
  )
FROM
  unnest(ARRAY['anon', 'authenticated', 'service_role']) AS role_name
  CROSS JOIN unnest(
    ARRAY[
      'public.ensure_asset_preview_snapshot(public.provider_id,text,text,integer,integer,jsonb)',
      'public.select_stale_referenced_snapshots(timestamptz,timestamptz,uuid,integer)',
      'public.delete_orphaned_asset_preview_snapshots()'
    ]
  ) AS signature;

-- Transaction-scoped fixtures; no auth HTTP calls or persistent test rows.
INSERT INTO auth.users (id)
VALUES
  ('91000000-0000-0000-0000-000000000001'),
  ('91000000-0000-0000-0000-000000000002');
INSERT INTO public.asset_preview_snapshots (id, provider_id, external_id, title)
VALUES
  (
    '92000000-0000-0000-0000-000000000001',
    'nasa_ivl',
    'grant-test',
    'Snapshot'
  );

SET LOCAL ROLE authenticated;
SELECT
  set_config(
    'request.jwt.claim.sub',
    '91000000-0000-0000-0000-000000000001',
    TRUE
  );
SELECT
  lives_ok(
    $$INSERT INTO public.profiles (id, display_name) VALUES
  ('91000000-0000-0000-0000-000000000001', 'Owner')$$,
    'owner inserts profile'
  );
SELECT
  lives_ok(
    $$UPDATE public.profiles SET display_name = 'Updated owner'
  WHERE id = '91000000-0000-0000-0000-000000000001'$$,
    'owner updates profile'
  );
SELECT
  extensions."is"(
    (
      SELECT display_name
      FROM public.profiles
      WHERE id = '91000000-0000-0000-0000-000000000001'
    ),
    'Updated owner',
    'profile update persisted'
  );
SELECT
  lives_ok(
    $$INSERT INTO public.favorites (owner_id, asset_preview_snapshot_id) VALUES
  ('91000000-0000-0000-0000-000000000001', '92000000-0000-0000-0000-000000000001')$$,
    'owner favorites snapshot'
  );
SELECT
  lives_ok(
    $$INSERT INTO public.collections (id, owner_id, name, visibility, position) VALUES
  ('93000000-0000-0000-0000-000000000001', '91000000-0000-0000-0000-000000000001', 'Public', 'public', 0),
  ('93000000-0000-0000-0000-000000000002', '91000000-0000-0000-0000-000000000001', 'Private', 'private', 1)$$,
    'owner creates collections'
  );
SELECT
  lives_ok(
    $$INSERT INTO public.collection_items (collection_id, asset_preview_snapshot_id, position) VALUES
  ('93000000-0000-0000-0000-000000000001', '92000000-0000-0000-0000-000000000001', 0),
  ('93000000-0000-0000-0000-000000000002', '92000000-0000-0000-0000-000000000001', 0)$$,
    'owner adds items'
  );
SELECT
  lives_ok(
    $$UPDATE public.collections SET name = 'Renamed' WHERE id = '93000000-0000-0000-0000-000000000002'$$,
    'owner renames collection'
  );
SELECT
  extensions."is"(
    (
      SELECT name
      FROM public.collections
      WHERE id = '93000000-0000-0000-0000-000000000002'
    ),
    'Renamed',
    'collection update persisted'
  );
SELECT
  throws_ok(
    $$UPDATE public.collections SET owner_id = '91000000-0000-0000-0000-000000000002'
  WHERE id = '93000000-0000-0000-0000-000000000001'$$,
    '42501',
    NULL,
    'owner cannot transfer ownership'
  );
SELECT
  throws_ok(
    $$INSERT INTO public.asset_preview_snapshots (provider_id, external_id) VALUES ('nasa_ivl', 'forbidden')$$,
    '42501',
    NULL,
    'client cannot insert snapshots'
  );
SELECT
  throws_ok(
    $$SELECT public.ensure_asset_preview_snapshot('nasa_ivl', 'forbidden', 'No')$$,
    '42501',
    NULL,
    'client cannot call snapshot upsert'
  );
SELECT
  throws_ok(
    $$SELECT public.select_stale_referenced_snapshots(now())$$,
    '42501',
    NULL,
    'client cannot call stale selection'
  );
SELECT
  throws_ok(
    $$SELECT public.delete_orphaned_asset_preview_snapshots()$$,
    '42501',
    NULL,
    'client cannot call orphan sweep'
  );

-- A second user sees public content, but cannot write another user's rows.
SELECT
  set_config(
    'request.jwt.claim.sub',
    '91000000-0000-0000-0000-000000000002',
    TRUE
  );
SELECT
  extensions."is"(
    (
      SELECT count(*)
      FROM public.favorites
      WHERE owner_id = '91000000-0000-0000-0000-000000000001'
    ),
    0::BIGINT,
    'non-owner cannot read favorites'
  );
SELECT
  extensions."is"(
    (
      SELECT count(*)
      FROM public.collections
      WHERE
        id IN (
          '93000000-0000-0000-0000-000000000001',
          '93000000-0000-0000-0000-000000000002'
        )
    ),
    1::BIGINT,
    'non-owner sees only public collection'
  );
SELECT
  extensions."is"(
    (
      SELECT count(*)
      FROM public.collection_items
      WHERE asset_preview_snapshot_id = '92000000-0000-0000-0000-000000000001'
    ),
    1::BIGINT,
    'non-owner sees only public items'
  );
SELECT
  throws_ok(
    $$INSERT INTO public.profiles (id, display_name) VALUES ('91000000-0000-0000-0000-000000000001', 'Intruder')$$,
    '42501',
    NULL,
    'non-owner cannot insert profile'
  );
SELECT
  throws_ok(
    $$INSERT INTO public.favorites (owner_id, asset_preview_snapshot_id) VALUES ('91000000-0000-0000-0000-000000000001', '92000000-0000-0000-0000-000000000001')$$,
    '42501',
    NULL,
    'non-owner cannot insert favorite'
  );
SELECT
  throws_ok(
    $$INSERT INTO public.collections (owner_id, name, position) VALUES ('91000000-0000-0000-0000-000000000001', 'Intruder', 2)$$,
    '42501',
    NULL,
    'non-owner cannot insert collection'
  );
SELECT
  throws_ok(
    $$INSERT INTO public.collection_items (collection_id, asset_preview_snapshot_id, position) VALUES ('93000000-0000-0000-0000-000000000001', '92000000-0000-0000-0000-000000000001', 2)$$,
    '42501',
    NULL,
    'non-owner cannot insert item'
  );
WITH
  changed AS (
    UPDATE public.profiles
    SET display_name = 'Intruder'
    WHERE id = '91000000-0000-0000-0000-000000000001'
    RETURNING *
  )
SELECT extensions."is"(count(*), 0::BIGINT, 'non-owner cannot update profile')
FROM changed;
WITH
  changed AS (
    UPDATE public.collections
    SET name = 'Intruder'
    WHERE id = '93000000-0000-0000-0000-000000000001'
    RETURNING *
  )
SELECT
  extensions."is"(
    count(*),
    0::BIGINT,
    'non-owner cannot update public collection'
  )
FROM changed;
WITH
  removed AS (
    DELETE FROM public.favorites
    WHERE owner_id = '91000000-0000-0000-0000-000000000001'
    RETURNING *
  )
SELECT extensions."is"(count(*), 0::BIGINT, 'non-owner cannot delete favorite')
FROM removed;
WITH
  removed AS (
    DELETE FROM public.collection_items
    WHERE collection_id = '93000000-0000-0000-0000-000000000001'
    RETURNING *
  )
SELECT
  extensions."is"(count(*), 0::BIGINT, 'non-owner cannot delete public item')
FROM removed;
WITH
  removed AS (
    DELETE FROM public.collections
    WHERE id = '93000000-0000-0000-0000-000000000001'
    RETURNING *
  )
SELECT
  extensions."is"(
    count(*),
    0::BIGINT,
    'non-owner cannot delete public collection'
  )
FROM removed;

SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claim.sub', '', TRUE);
SELECT
  extensions."is"(
    (
      SELECT count(*)
      FROM public.profiles
      WHERE id = '91000000-0000-0000-0000-000000000001'
    ),
    1::BIGINT,
    'anon reads profiles'
  );
SELECT
  extensions."is"(
    (
      SELECT count(*)
      FROM public.asset_preview_snapshots
      WHERE id = '92000000-0000-0000-0000-000000000001'
    ),
    1::BIGINT,
    'anon reads snapshots'
  );
SELECT
  extensions."is"(
    (
      SELECT count(*)
      FROM public.collections
      WHERE
        id IN (
          '93000000-0000-0000-0000-000000000001',
          '93000000-0000-0000-0000-000000000002'
        )
    ),
    1::BIGINT,
    'anon sees only public collection'
  );
SELECT
  extensions."is"(
    (
      SELECT count(*)
      FROM public.collection_items
      WHERE asset_preview_snapshot_id = '92000000-0000-0000-0000-000000000001'
    ),
    1::BIGINT,
    'anon sees only public items'
  );
SELECT
  throws_ok(
    $$SELECT * FROM public.favorites$$,
    '42501',
    NULL,
    'anon has no favorites access'
  );
SELECT
  throws_ok(
    $$INSERT INTO public.profiles (id, display_name) VALUES ('91000000-0000-0000-0000-000000000002', 'Anon')$$,
    '42501',
    NULL,
    'anon cannot write profiles'
  );
SELECT
  throws_ok(
    $$SELECT public.ensure_asset_preview_snapshot('nasa_ivl', 'forbidden', 'No')$$,
    '42501',
    NULL,
    'anon cannot call snapshot upsert'
  );
SELECT
  throws_ok(
    $$SELECT public.select_stale_referenced_snapshots(now())$$,
    '42501',
    NULL,
    'anon cannot call stale selection'
  );
SELECT
  throws_ok(
    $$SELECT public.delete_orphaned_asset_preview_snapshots()$$,
    '42501',
    NULL,
    'anon cannot call orphan sweep'
  );

SET LOCAL ROLE service_role;
SELECT
  lives_ok(
    $$SELECT public.ensure_asset_preview_snapshot('nasa_ivl', 'grant-test', 'Refreshed')$$,
    'service calls ensure'
  );
SELECT
  extensions."is"(
    (
      SELECT title
      FROM public.asset_preview_snapshots
      WHERE id = '92000000-0000-0000-0000-000000000001'
    ),
    'Refreshed',
    'ensure updates existing snapshot'
  );
SELECT
  extensions."is"(
    (
      SELECT count(*)
      FROM public.select_stale_referenced_snapshots(now() + INTERVAL '1 day')
      WHERE id = '92000000-0000-0000-0000-000000000001'
    ),
    1::BIGINT,
    'service selects referenced snapshot'
  );
SELECT
  extensions."is"(
    (
      SELECT count(*)
      FROM public.collections
      WHERE
        id IN (
          '93000000-0000-0000-0000-000000000001',
          '93000000-0000-0000-0000-000000000002'
        )
    ),
    2::BIGINT,
    'service reads private rows'
  );
INSERT INTO public.asset_preview_snapshots
  (id, provider_id, external_id, updated_at)
VALUES
  (
    '92000000-0000-0000-0000-000000000002',
    'nasa_ivl',
    'grant-test-orphan',
    now() - INTERVAL '31 days'
  );
SELECT
  lives_ok(
    $$SELECT public.delete_orphaned_asset_preview_snapshots()$$,
    'service calls sweep'
  );
SELECT
  extensions."is"(
    (
      SELECT count(*)
      FROM public.asset_preview_snapshots
      WHERE id = '92000000-0000-0000-0000-000000000002'
    ),
    0::BIGINT,
    'sweep removes aged orphan'
  );
SELECT
  extensions."is"(
    (
      SELECT count(*)
      FROM public.asset_preview_snapshots
      WHERE id = '92000000-0000-0000-0000-000000000001'
    ),
    1::BIGINT,
    'sweep preserves referenced snapshot'
  );

SET LOCAL ROLE authenticated;
SELECT
  set_config(
    'request.jwt.claim.sub',
    '91000000-0000-0000-0000-000000000001',
    TRUE
  );
WITH
  removed AS (
    DELETE FROM public.favorites
    WHERE owner_id = '91000000-0000-0000-0000-000000000001'
    RETURNING *
  )
SELECT extensions."is"(count(*), 1::BIGINT, 'owner removes favorite')
FROM removed;
WITH
  removed AS (
    DELETE FROM public.collection_items
    WHERE collection_id = '93000000-0000-0000-0000-000000000001'
    RETURNING *
  )
SELECT extensions."is"(count(*), 1::BIGINT, 'owner removes item')
FROM removed;
WITH
  removed AS (
    DELETE FROM public.collections
    WHERE
      id IN (
        '93000000-0000-0000-0000-000000000001',
        '93000000-0000-0000-0000-000000000002'
      )
    RETURNING *
  )
SELECT extensions."is"(count(*), 2::BIGINT, 'owner deletes collections')
FROM removed;
RESET ROLE;
SELECT * FROM finish();
ROLLBACK;
