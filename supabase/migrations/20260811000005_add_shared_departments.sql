-- 20260811000005_add_shared_departments.sql
ALTER TABLE public.repository ADD COLUMN IF NOT EXISTS shared_departments TEXT[] DEFAULT '{}';
