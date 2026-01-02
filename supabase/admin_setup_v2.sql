-- ============================================
-- 0. Drop Dependent Policies on OTHER tables
-- ============================================
-- We must drop policies that reference 'profiles.role' before we can change its type.
DROP POLICY IF EXISTS "Admins can delete any post" ON public.posts;
-- Add any other policies here if you have them, e.g. for comments, etc.


-- ============================================
-- 1. Migrate Role to ENUM (Safe Version)
-- ============================================

-- Create the ENUM type if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('user', 'admin', 'moderator');
    END IF;
END $$;

-- Drop existing constraints and defaults on profiles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT;

-- Reset Profiles Policies (Needed because they also reference role)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
  END LOOP;
END $$;

-- Convert the column from Text to Enum
ALTER TABLE public.profiles 
ALTER COLUMN role TYPE public.app_role 
USING role::public.app_role;

-- Re-apply the default value using the new Enum type
ALTER TABLE public.profiles 
ALTER COLUMN role SET DEFAULT 'user'::public.app_role;


-- ============================================
-- 2. access Policies (Re-apply)
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: Publicly visible
CREATE POLICY "profiles_select"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: Authenticated users can create their own profile
CREATE POLICY "profiles_insert"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- UPDATE: Users own profile OR Admins can update ANY profile
CREATE POLICY "profiles_update"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid() OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'::public.app_role
  )
  WITH CHECK (
    id = auth.uid() OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'::public.app_role
  );

-- DELETE: Only Admins can delete profiles
CREATE POLICY "profiles_delete"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'::public.app_role
  );

-- ============================================
-- 3. Restore Dependent Policies (e.g. Posts)
-- ============================================

CREATE POLICY "Admins can delete any post" 
ON public.posts FOR DELETE 
TO authenticated 
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'::public.app_role
);
