-- 20260811000009_fix_documents_rls_all.sql
DROP POLICY IF EXISTS "Documents insertable by authenticated users" ON public.documents;
CREATE POLICY "Documents insertable by authenticated users" ON public.documents FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Documents insertable by everyone" ON public.documents;
CREATE POLICY "Documents insertable by everyone" ON public.documents FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Documents readable by everyone" ON public.documents;
CREATE POLICY "Documents readable by everyone" ON public.documents FOR SELECT USING (true);

DROP POLICY IF EXISTS "Documents updatable by everyone" ON public.documents;
CREATE POLICY "Documents updatable by everyone" ON public.documents FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Documents deletable by everyone" ON public.documents;
CREATE POLICY "Documents deletable by everyone" ON public.documents FOR DELETE USING (true);
