-- Add lampiran column to rapat table to store attachments properly
ALTER TABLE public.rapat ADD COLUMN IF NOT EXISTS lampiran JSONB DEFAULT '[]'::jsonb;
