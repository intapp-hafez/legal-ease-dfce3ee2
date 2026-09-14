-- 20260811000012_store_files_in_all_tables.sql

-- Add file_data and file_url columns to contracts
ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS file_data TEXT,
ADD COLUMN IF NOT EXISTS file_url TEXT;

-- Add file_data and file_url columns to cases
ALTER TABLE public.cases
ADD COLUMN IF NOT EXISTS file_data TEXT,
ADD COLUMN IF NOT EXISTS file_url TEXT;

-- Add file_data and file_url columns to violations
ALTER TABLE public.violations
ADD COLUMN IF NOT EXISTS file_data TEXT,
ADD COLUMN IF NOT EXISTS file_url TEXT;

-- Add file_data and file_url columns to tasks
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS file_data TEXT,
ADD COLUMN IF NOT EXISTS file_url TEXT;

-- Add file_data and file_url columns to assets
ALTER TABLE public.assets
ADD COLUMN IF NOT EXISTS file_data TEXT,
ADD COLUMN IF NOT EXISTS file_url TEXT;

-- Add file_data and file_url columns to requests
ALTER TABLE public.requests
ADD COLUMN IF NOT EXISTS file_data TEXT,
ADD COLUMN IF NOT EXISTS file_url TEXT;
