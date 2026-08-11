-- 20260811000004_repository_crud_rls.sql

-- Allow everyone to update (for the Share functionality)
DROP POLICY IF EXISTS "Repository updatable by everyone" ON public.repository;
CREATE POLICY "Repository updatable by everyone" ON public.repository FOR UPDATE USING (true);

-- Allow everyone to delete (for the Delete functionality)
DROP POLICY IF EXISTS "Repository deletable by everyone" ON public.repository;
CREATE POLICY "Repository deletable by everyone" ON public.repository FOR DELETE USING (true);
