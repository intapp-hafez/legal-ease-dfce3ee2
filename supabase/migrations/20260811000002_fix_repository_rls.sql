-- 20260811000002_fix_repository_rls.sql
DROP POLICY IF EXISTS "Repository viewable by owner or Admins/Legal" ON public.repository;
DROP POLICY IF EXISTS "Repository viewable by everyone" ON public.repository;

CREATE POLICY "Repository viewable by everyone" ON public.repository FOR SELECT USING (true);
