-- Data API access is explicit after Supabase's October 30, 2026 change.
-- The historical remote_schema migration restores these postgres defaults;
-- undo them for future objects without rewriting already-applied history.
-- Scope this to our migration owner, not Supabase-managed roles/schemas.
ALTER DEFAULT PRIVILEGES
FOR ROLE postgres
IN SCHEMA public
REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES
FOR ROLE postgres
IN SCHEMA public
REVOKE ALL ON SEQUENCES FROM PUBLIC, anon, authenticated, service_role;

-- Normalize existing ACLs too: old projects/reset replays inherited ALL,
-- including TRUNCATE (which does not enforce RLS), REFERENCES and TRIGGER.
REVOKE ALL
ON TABLE public.profiles,
public.favorites,
public.asset_preview_snapshots,
public.collections,
public.collection_items
FROM PUBLIC, anon, authenticated, service_role;

GRANT SELECT
ON TABLE public.profiles,
public.asset_preview_snapshots,
public.collections,
public.collection_items
TO anon;

GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO authenticated;
GRANT SELECT, INSERT, DELETE
ON TABLE public.favorites, public.collection_items
TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.collections
TO authenticated;
GRANT SELECT ON TABLE public.asset_preview_snapshots TO authenticated;

-- Server maintenance/provisioning and admin cleanup need DML, not DDL-like
-- privileges. BYPASSRLS alone does not confer table access.
GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.profiles,
public.favorites,
public.asset_preview_snapshots,
public.collections,
public.collection_items
TO service_role;
-- Keep all existing RLS policies and function ACLs. In particular, ensure,
-- stale-selection and orphan-sweep snapshot RPCs remain service-role only.
