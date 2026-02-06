-- Table

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL REFERENCES auth.users (id)
    ON DELETE CASCADE,
  display_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profile_display_name_nonempty_check
    CHECK (length(btrim(display_name)) > 0),
  CONSTRAINT profile_display_name_length_check
    CHECK (length(display_name) <= 60),
  PRIMARY KEY (id)
);

-- RLS

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles are publicly readable" ON public.profiles;

CREATE POLICY "profiles are publicly readable" ON public.profiles
FOR SELECT
USING (TRUE);

DROP POLICY IF EXISTS "users can insert their own profile" ON public.profiles;

CREATE POLICY "users can insert their own profile" ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "users can update their own profile" ON public.profiles;

CREATE POLICY "users can update their own profile" ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Updates

CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

DROP TRIGGER IF EXISTS handle_updated_at ON public.profiles;

CREATE TRIGGER handle_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION extensions.moddatetime(updated_at);
