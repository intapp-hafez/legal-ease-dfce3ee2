-- 20260811000000_fix_documents_repository.sql
ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS attachment TEXT,
ADD COLUMN IF NOT EXISTS repository_folder_id TEXT;

DROP POLICY IF EXISTS "Repository insertable by everyone" ON public.repository;
CREATE POLICY "Repository insertable by everyone" ON public.repository FOR INSERT WITH CHECK (true);
