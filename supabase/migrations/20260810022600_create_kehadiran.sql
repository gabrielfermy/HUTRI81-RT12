-- Create Kehadiran Table for Lucky Draw
CREATE TABLE IF NOT EXISTS public.kehadiran (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nama TEXT NOT NULL,
    no_telp TEXT,
    dawis TEXT,
    is_won BOOLEAN DEFAULT false,
    won_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Kehadiran
ALTER TABLE public.kehadiran ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access for kehadiran" ON public.kehadiran FOR SELECT USING (true);
CREATE POLICY "Allow all modifications for kehadiran" ON public.kehadiran FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime replication
alter publication supabase_realtime add table public.kehadiran;
