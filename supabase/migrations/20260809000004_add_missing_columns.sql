-- 20260809000004_add_missing_columns.sql
-- Adds missing columns to existing tables for full frontend compatibility

-- Add missing columns to Profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS position TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add missing columns to Documents
ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS remind_days INTEGER,
ADD COLUMN IF NOT EXISTS file_url TEXT;

-- Add missing columns to Contracts
ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS file_url TEXT;

-- Add missing columns to Assets (Custody)
ALTER TABLE public.assets
ADD COLUMN IF NOT EXISTS serial_number TEXT,
ADD COLUMN IF NOT EXISTS assigned_date DATE,
ADD COLUMN IF NOT EXISTS expected_return_date DATE,
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add missing columns to Cases
ALTER TABLE public.cases
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS file_url TEXT;

-- Add missing columns to Violations
ALTER TABLE public.violations
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS file_url TEXT;

-- Add missing columns to Requests
ALTER TABLE public.requests
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS file_url TEXT;

-- Add missing columns to Tasks
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add missing columns to Repository
ALTER TABLE public.repository
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS tags JSONB,
ADD COLUMN IF NOT EXISTS features JSONB;
