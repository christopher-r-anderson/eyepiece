-- profiles: normalize constraint/policy/trigger naming; fix moddatetime arg

-- -------------------------
-- Constraints: rename *_check -> *_chk
-- -------------------------
ALTER TABLE public.profiles
RENAME CONSTRAINT profile_display_name_nonempty_check TO profile_display_name_nonempty_chk;

ALTER TABLE public.profiles
RENAME CONSTRAINT profile_display_name_length_check TO profile_display_name_length_chk;

-- -------------------------
-- RLS Policies: replace human-readable names with structured names
-- -------------------------

-- select
DROP POLICY IF EXISTS "profiles are publicly readable" ON public.profiles;
DROP POLICY IF EXISTS profiles_select_public ON public.profiles;

CREATE POLICY profiles_select_public ON public.profiles
FOR SELECT
USING (TRUE);

-- insert own
DROP POLICY IF EXISTS "users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;

CREATE POLICY profiles_insert_own ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- update own
DROP POLICY IF EXISTS "users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;

CREATE POLICY profiles_update_own ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- -------------------------
-- Trigger: rename + fix moddatetime usage
-- -------------------------
DROP TRIGGER IF EXISTS handle_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;

CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION extensions.moddatetime('updated_at');
