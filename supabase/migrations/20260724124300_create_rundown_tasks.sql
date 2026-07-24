-- Create rundown_tasks table to store checklist items for each event
CREATE TABLE IF NOT EXISTS public.rundown_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rundown_id UUID NOT NULL REFERENCES public.rundown(id) ON DELETE CASCADE,
    deskripsi TEXT NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    pic VARCHAR(100) NOT NULL DEFAULT 'Semua Panitia',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.rundown_tasks ENABLE ROW LEVEL SECURITY;

-- Create policy for public access to match other tables in development
CREATE POLICY "Enable all actions for authenticated users"
ON public.rundown_tasks FOR ALL
USING (true) WITH CHECK (true);
