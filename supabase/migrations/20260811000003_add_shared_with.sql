-- 20260811000003_add_shared_with.sql
ALTER TABLE public.repository ADD COLUMN IF NOT EXISTS shared_with TEXT[] DEFAULT '{}';
