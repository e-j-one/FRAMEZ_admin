-- ============================================
-- Grant Admin Read Access for Moderation Context
-- ============================================

-- Function to check if user is admin (reusable)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'::public.app_role
  );
$$;

-- 1. MESSAGES: Admins can view ALL messages (for report review)
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
CREATE POLICY "Admins can view all messages"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin() OR
    (sender_id = auth.uid()) OR 
    (conversation_id IN (SELECT conversation_id FROM public.conversation_members WHERE user_id = auth.uid()))
  );

-- 2. COMMENTS: Admins can view ALL comments
DROP POLICY IF EXISTS "Admins can view all comments" ON public.comments;
CREATE POLICY "Admins can view all comments"
  ON public.comments
  FOR SELECT
  TO authenticated
  USING (true); -- Usually public, but being explicit doesn't hurt. If comments were private, we'd need is_admin()

-- 3. POSTS: Admins can view ALL posts (including friends-only/private)
DROP POLICY IF EXISTS "Admins can view all posts" ON public.posts;
CREATE POLICY "Admins can view all posts"
  ON public.posts
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin() OR
    (visibility = 'public') OR
    (auth.uid() = user_id) OR
    (visibility = 'friends' AND EXISTS (
        SELECT 1 FROM public.friendships 
        WHERE (user_id = auth.uid() AND friend_id = posts.user_id)
           OR (user_id = posts.user_id AND friend_id = auth.uid())
    ))
  );
