-- ============================================
-- FIX: Grant Admin Access to Notices Table
-- ============================================

-- The previous notices setup only allowed users to read their own notices.
-- It did NOT allow Admins to INSERT new notices or VIEW other users' notices.

-- 1. Enable full access for Admins (Select, Insert, Update, Delete)
CREATE POLICY "Admins can manage all notices"
  ON public.notices
  FOR ALL
  TO authenticated
  USING (
    public.is_admin()
  )
  WITH CHECK (
    public.is_admin()
  );
