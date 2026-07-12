-- Add rincian_agenda column to rapat table to store planned discussion topics
ALTER TABLE public.rapat ADD COLUMN IF NOT EXISTS rincian_agenda TEXT;
