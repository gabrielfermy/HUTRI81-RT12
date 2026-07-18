-- Add logo_url column to sponsorship table to support uploading custom sponsor logo images
ALTER TABLE public.sponsorship ADD COLUMN IF NOT EXISTS logo_url TEXT;
