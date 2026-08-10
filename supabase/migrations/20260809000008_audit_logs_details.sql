-- Add missing details column to audit_logs
ALTER TABLE public.audit_logs
ADD COLUMN IF NOT EXISTS details TEXT;
