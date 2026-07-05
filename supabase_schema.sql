-- Setup Tables for HUT RI 81 RT12 Web App

-- 1. Table: Panitia
CREATE TABLE IF NOT EXISTS public.panitia (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nama TEXT NOT NULL,
    seksi TEXT NOT NULL,
    jabatan TEXT NOT NULL DEFAULT 'Anggota',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Panitia
ALTER TABLE public.panitia ENABLE ROW LEVEL SECURITY;

-- Allow Public Read Access
CREATE POLICY "Allow public read access for panitia" ON public.panitia
    FOR SELECT USING (true);

-- Allow Admin Insert/Update/Delete (Enable for all for ease of use in demo, or lock to authenticated)
CREATE POLICY "Allow all modifications for panitia" ON public.panitia
    FOR ALL USING (true) WITH CHECK (true);


-- 2. Table: Rundown
CREATE TABLE IF NOT EXISTS public.rundown (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    waktu TEXT NOT NULL,
    durasi INTEGER NOT NULL, -- in minutes
    kegiatan TEXT NOT NULL,
    keterangan TEXT,
    kategori TEXT NOT NULL DEFAULT 'Utama', -- e.g. Utama, Anak-anak, Dewasa
    sort_order SERIAL
);

-- Enable RLS for Rundown
ALTER TABLE public.rundown ENABLE ROW LEVEL SECURITY;

-- Allow Public Read Access
CREATE POLICY "Allow public read access for rundown" ON public.rundown
    FOR SELECT USING (true);

-- Allow Admin Insert/Update/Delete
CREATE POLICY "Allow all modifications for rundown" ON public.rundown
    FOR ALL USING (true) WITH CHECK (true);


-- 3. Table: RAB (Rencana Anggaran Biaya)
CREATE TABLE IF NOT EXISTS public.rab (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    kategori TEXT NOT NULL,
    item TEXT NOT NULL,
    kuantitas NUMERIC NOT NULL DEFAULT 1,
    satuan TEXT NOT NULL,
    harga_satuan NUMERIC NOT NULL,
    total_idr NUMERIC GENERATED ALWAYS AS (kuantitas * harga_satuan) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for RAB
ALTER TABLE public.rab ENABLE ROW LEVEL SECURITY;

-- Allow Public Read Access
CREATE POLICY "Allow public read access for rab" ON public.rab
    FOR SELECT USING (true);

-- Allow Admin Insert/Update/Delete
CREATE POLICY "Allow all modifications for rab" ON public.rab
    FOR ALL USING (true) WITH CHECK (true);


-- 4. Table: Warga & Status Iuran
CREATE TABLE IF NOT EXISTS public.warga (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nama TEXT NOT NULL,
    blok TEXT NOT NULL,
    nominal_iuran NUMERIC NOT NULL DEFAULT 50000,
    is_paid BOOLEAN NOT NULL DEFAULT false,
    paid_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Warga
ALTER TABLE public.warga ENABLE ROW LEVEL SECURITY;

-- Allow Public Read Access
CREATE POLICY "Allow public read access for warga" ON public.warga
    FOR SELECT USING (true);

-- Allow Admin Insert/Update/Delete
CREATE POLICY "Allow all modifications for warga" ON public.warga
    FOR ALL USING (true) WITH CHECK (true);


-- Insert Seed Data (Panitia)
INSERT INTO public.panitia (nama, seksi, jabatan) VALUES
('Gabriel Fermy Aswinta', 'Inti', 'Ketua Panitia'),
('Mas Ikhsan', 'Inti', 'Sekretaris'),
('Pak Tri', 'Inti', 'Bendahara'),
('Pak Yudhi', 'Perlengkapan & Dekorasi', 'Koordinator'),
('Pak Asbani', 'Perlengkapan & Dekorasi', 'Anggota'),
('Pak Heribertus', 'Acara', 'Koordinator Umum'),
('Bu Agus', 'Acara', 'Koordinator Sesi Pagi'),
('Ibu Ketua Dasawisma', 'Konsumsi', 'Koordinator'),
('Pak Randy', 'Keamanan & Kebersihan', 'Koordinator'),
('Pak Mardi', 'Dokumentasi', 'Koordinator');

-- Insert Seed Data (Rundown)
INSERT INTO public.rundown (waktu, durasi, kegiatan, keterangan, kategori) VALUES
('06.00 - 07.30', 90, 'Senam Kemerdekaan', 'Minggu, 9 Agst - Diikuti seluruh warga RT 12', 'Utama'),
('07.30 - 10.30', 180, 'Lomba Anak & Dewasa', 'Minggu, 9 Agst - Sesi paralel di Area 1 & Area 2', 'Utama'),
('19.30 - 20.00', 30, 'Kirab Kemerdekaan', 'Minggu, 16 Agst - Rute keliling RT 12 (Lampion & Obor)', 'Utama'),
('20.00 - 20.45', 45, 'Tirakatan, Doa & Makan Soto', 'Minggu, 16 Agst - Makan bersama & doa bersama syukuran', 'Utama'),
('20.45 - 22.30', 105, 'Pentas Seni & Pembagian Hadiah', 'Minggu, 16 Agst - Panggung gembira & pembagian hadiah lomba', 'Utama');

-- Insert Seed Data (RAB)
INSERT INTO public.rab (kategori, item, kuantitas, satuan, harga_satuan) VALUES
('Hadiah Lomba', 'Hadiah Lomba Anak-anak', 1, 'Paket', 1500000),
('Hadiah Lomba', 'Hadiah Lomba Bapak-bapak', 1, 'Paket', 700000),
('Hadiah Lomba', 'Hadiah Lomba Ibu-ibu', 1, 'Paket', 700000),
('Hadiah Lomba', 'Hadiah Lomba Pemuda', 1, 'Paket', 600000),
('Konsumsi Puncak', 'Soto Ayam', 200, 'Pax', 12000),
('Perlengkapan', 'Sewa Panggung & Sound', 1, 'Paket', 1500000),
('Perlengkapan', 'Umbul-umbul & Bendera', 10, 'Set', 60000),
('Perlengkapan', 'Spanduk Utama', 1, 'Pcs', 200000),
('Perlengkapan', 'Sewa Tenda & Kursi', 1, 'Paket', 500000),
('Perlengkapan', 'Cat Panggung', 2, 'Kaleng', 100000),
('Gotong Royong', 'Konsumsi Gotong Royong 9 Agst', 20, 'Pax', 20000),
('Gotong Royong', 'Konsumsi Gotong Royong 15 Agst', 20, 'Pax', 20000),
('Gotong Royong', 'Paku & Kabel Tambahan', 1, 'Set', 200000),
('Dana Cadangan', 'Biaya Tak Terduga', 1, 'Lumpsum', 1900000);

-- Insert Seed Data (Warga - 80 KK Mock data for testing)
DO $$
DECLARE
    i INTEGER;
BEGIN
    FOR i IN 1..80 LOOP
        INSERT INTO public.warga (nama, blok, nominal_iuran, is_paid)
        VALUES (
            'Warga ' || i,
            'Blok ' || CHR(65 + (i % 4)), -- A, B, C, D
            50000,
            (i % 3 = 0) -- Set some as paid
        );
    END LOOP;
END $$;
