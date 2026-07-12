-- Create the baksos_records table
CREATE TABLE IF NOT EXISTS public.baksos_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tipe VARCHAR(50) NOT NULL CHECK (tipe IN ('masuk', 'keluar')),
    jenis_barang VARCHAR(100) NOT NULL,
    keterangan TEXT,
    jumlah NUMERIC NOT NULL DEFAULT 0,
    satuan VARCHAR(50) NOT NULL,
    pic VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Update RBAC in the seksi table to include 'baksos'
-- Give access to 'Inti' and 'Humas & Dana'
UPDATE public.seksi
SET akses_menu = akses_menu || ',baksos'
WHERE kategori = 'Inti' 
   OR nama = 'Koordinator Humas & Dana' 
   OR nama = 'Anggota Humas & Dana';

-- Enable RLS (Optional but good practice)
ALTER TABLE public.baksos_records ENABLE ROW LEVEL SECURITY;

-- Create policy for all authenticated users to read/write for simplicity in this project (as with other tables)
CREATE POLICY "Enable all actions for authenticated users" 
ON public.baksos_records FOR ALL 
USING (true) WITH CHECK (true);
