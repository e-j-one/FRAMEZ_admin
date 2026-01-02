-- ============================================
-- Grant Admins Delete Access for Comments
-- ============================================

-- Allow Admins to delete any comment
CREATE POLICY "Admins can delete any comment" 
ON public.comments FOR DELETE 
TO authenticated 
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'::public.app_role
);
