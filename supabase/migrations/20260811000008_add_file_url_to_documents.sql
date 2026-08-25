-- 20260811000008_add_file_url_to_documents.sql
ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS file_url TEXT;
