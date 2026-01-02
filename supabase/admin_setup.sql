-- 1. Add 'role' column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator'));

-- 2. Create the first Admin user (REPLACE with your specific email/user_id)
-- You can run this after signing up in the app
-- UPDATE public.profiles SET role = 'admin' WHERE id = 'YOUR_USER_ID_HERE';

-- 3. RLS Policies for Admin Access

-- Allow Admins to read ALL profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- Allow Admins to update ANY profile
CREATE POLICY "Admins can update any profile" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- Allow Admins to delete positions/posts (if applied to other tables)
-- Example for posts table:
CREATE POLICY "Admins can delete any post" 
ON public.posts FOR DELETE 
TO authenticated 
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- 4. Secure the Role Column
-- Prevent regular users from updating their own role to 'admin'
-- This requires checking the NEW row in the update policy
CREATE POLICY "Users can update own profile except role" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  AND (role = (SELECT role FROM public.profiles WHERE id = auth.uid())) -- Role cannot be changed by self
);
