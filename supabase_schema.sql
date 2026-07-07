-- Setup Tables for HUT RI 81 RT12 Web App (Overhauled)

-- 1. Table: Panitia
CREATE TABLE IF NOT EXISTS public.panitia (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nama TEXT NOT NULL,
    seksi TEXT NOT NULL,
    jabatan TEXT NOT NULL DEFAULT 'Anggota',
    pin_akses TEXT NOT NULL DEFAULT '1212', -- PIN login default
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Panitia
ALTER TABLE public.panitia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access for panitia" ON public.panitia FOR SELECT USING (true);
CREATE POLICY "Allow all modifications for panitia" ON public.panitia FOR ALL USING (true) WITH CHECK (true);


-- 2. Table: Rundown
CREATE TABLE IF NOT EXISTS public.rundown (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tanggal DATE NOT NULL,
    jam_mulai TEXT NOT NULL,
    jam_selesai TEXT NOT NULL,
    kegiatan TEXT NOT NULL,
    keterangan TEXT, -- Deskripsi untuk warga umum
    seksi_pj TEXT[] NOT NULL DEFAULT '{}', -- Array nama seksi penanggung jawab
    instruksi_internal TEXT, -- Deskripsi detail persiapan internal panitia
    kategori TEXT NOT NULL DEFAULT 'Utama', -- e.g. Utama, Lomba Anak, Lomba Dewasa
    sort_order SERIAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Rundown
ALTER TABLE public.rundown ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access for rundown" ON public.rundown FOR SELECT USING (true);
CREATE POLICY "Allow all modifications for rundown" ON public.rundown FOR ALL USING (true) WITH CHECK (true);


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
CREATE POLICY "Allow public read access for rab" ON public.rab FOR SELECT USING (true);
CREATE POLICY "Allow all modifications for rab" ON public.rab FOR ALL USING (true) WITH CHECK (true);


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
CREATE POLICY "Allow public read access for warga" ON public.warga FOR SELECT USING (true);
CREATE POLICY "Allow all modifications for warga" ON public.warga FOR ALL USING (true) WITH CHECK (true);


-- 5. Table: Rapat & Notulen
CREATE TABLE IF NOT EXISTS public.rapat (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tanggal DATE NOT NULL,
    waktu TEXT NOT NULL,
    tempat TEXT NOT NULL,
    agenda TEXT NOT NULL,
    notulen TEXT, -- Markdown format
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Rapat
ALTER TABLE public.rapat ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access for rapat" ON public.rapat FOR SELECT USING (true);
CREATE POLICY "Allow all modifications for rapat" ON public.rapat FOR ALL USING (true) WITH CHECK (true);


-- 6. Table: Donatur & Sponsorship
CREATE TABLE IF NOT EXISTS public.sponsorship (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nama TEXT NOT NULL,
    tipe TEXT NOT NULL, -- 'Platinum', 'Gold', 'Silver', 'Donatur Warga'
    nominal NUMERIC DEFAULT 0,
    keterangan TEXT, -- e.g. "Dana Segar" atau "Hadiah 5 unit kipas angin"
    is_paid BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Sponsorship
ALTER TABLE public.sponsorship ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access for sponsorship" ON public.sponsorship FOR SELECT USING (true);
CREATE POLICY "Allow all modifications for sponsorship" ON public.sponsorship FOR ALL USING (true) WITH CHECK (true);


-- 7. Table: Pengeluaran Riil (Expense Tracking)
CREATE TABLE IF NOT EXISTS public.pengeluaran (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rab_id UUID REFERENCES public.rab(id) ON DELETE SET NULL,
    item_pembelian TEXT NOT NULL,
    nominal_riil NUMERIC NOT NULL DEFAULT 0,
    tanggal_pembelian DATE NOT NULL,
    seksi_pj TEXT NOT NULL,
    pic TEXT NOT NULL,
    bukti_nota_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Pengeluaran
ALTER TABLE public.pengeluaran ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access for pengeluaran" ON public.pengeluaran FOR SELECT USING (true);
CREATE POLICY "Allow all modifications for pengeluaran" ON public.pengeluaran FOR ALL USING (true) WITH CHECK (true);


-- 8. Table: Audit Log
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    panitia_id UUID REFERENCES public.panitia(id) ON DELETE SET NULL,
    nama_panitia TEXT NOT NULL,
    aksi TEXT NOT NULL,
    detail TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Audit Log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access for audit_log" ON public.audit_log FOR SELECT USING (true);
CREATE POLICY "Allow all modifications for audit_log" ON public.audit_log FOR ALL USING (true) WITH CHECK (true);


-- ==========================================================
-- Insert Seed Data (Panitia)
-- ==========================================================
INSERT INTO public.panitia (nama, seksi, jabatan, pin_akses) VALUES
('Gabriel Fermy Aswinta', 'Inti', 'Ketua Panitia', '1212'),
('Mas Ikhsan', 'Inti', 'Sekretaris', '1212'),
('Pak Tri', 'Inti', 'Bendahara', '1212'),
('Pak Yudhi', 'Perlengkapan & Dekorasi', 'Koordinator', '1212'),
('Pak Asbani', 'Perlengkapan & Dekorasi', 'Anggota', '1212'),
('Pak Heribertus', 'Acara', 'Koordinator Umum', '1212'),
('Bu Agus', 'Acara', 'Koordinator Sesi Pagi', '1212'),
('Ibu Ketua Dasawisma', 'Konsumsi', 'Koordinator', '1212'),
('Pak Randy', 'Keamanan & Kebersihan', 'Koordinator', '1212'),
('Pak Mardi', 'Dokumentasi', 'Koordinator', '1212');


-- ==========================================================
-- Insert Seed Data (Rundown)
-- ==========================================================
INSERT INTO public.rundown (tanggal, jam_mulai, jam_selesai, kegiatan, keterangan, seksi_pj, instruksi_internal, kategori) VALUES
('2026-08-09', '06:00', '07:30', 'Senam Kemerdekaan', 'Senam pagi gembira bersama instruktur profesional.', ARRAY['Acara', 'Konsumsi'], 'Instruktur senam harus standby jam 05:45. Sie Konsumsi menyiapkan air mineral gelas.', 'Utama'),
('2026-08-09', '07:30', '08:15', 'Lomba Memasukkan Bola', 'Lomba estafet memasukkan bola menggunakan gelas di pinggang.', ARRAY['Acara'], 'Area Lomba Anak 1. Persiapkan gelas plastik, bola pingpong, dan tali rafia.', 'Lomba Anak'),
('2026-08-09', '08:15', '09:00', 'Lomba Memasukkan Pensil ke Botol', 'Lomba ketangkasan memasukkan pensil yang diikat di corong kepala ke dalam botol.', ARRAY['Acara'], 'Area Lomba Anak 2. Persiapkan botol kaca, pensil, dan corong kepala.', 'Lomba Anak'),
('2026-08-09', '09:00', '09:45', 'Lomba Makan Kerupuk', 'Lomba makan kerupuk gantung klasik tanpa tangan.', ARRAY['Acara'], 'Area Lomba Anak 3. Siapkan kerupuk putih, tiang jemuran/tali, dan kecap.', 'Lomba Anak'),
('2026-08-09', '09:45', '10:30', 'Lomba Balap Karung Helm', 'Balap karung menggunakan helm pengaman untuk keselamatan.', ARRAY['Acara', 'Perlengkapan'], 'Area Lomba Anak 4. Karung goni besar 4 biji, helm anak-anak 4 biji.', 'Lomba Anak'),
('2026-08-09', '07:30', '08:30', 'Lomba Memaku Paku Estafet', 'Lomba kelompok memaku paku ke balok kayu secara estafet cepat.', ARRAY['Acara'], 'Area Lomba Dewasa 1. Sediakan balok kayu tebal, palu besi 2, paku 3 inci.', 'Lomba Dewasa'),
('2026-08-09', '08:30', '09:30', 'Lomba Menarik Kaleng', 'Lomba kekuatan fisik & keseimbangan menarik kaleng yang terikat di pinggang.', ARRAY['Acara', 'Perlengkapan'], 'Area Lomba Dewasa 2. Kaleng susu bekas diisi kerikil, tali pinggang.', 'Lomba Dewasa'),
('2026-08-09', '09:30', '10:30', 'Lomba Tebak Gaya / Logika', 'Lomba tebak ekspresi dan kekompakan kelompok.', ARRAY['Acara'], 'Area Lomba Dewasa 3. Siapkan kartu petunjuk kata, mikrofon.', 'Lomba Dewasa'),
('2026-08-15', '19:30', '23:00', 'Gotong Royong & Persiapan Panggung', 'Pemasangan tenda, panggung utama, sound system, dekorasi bendera & obor.', ARRAY['Perlengkapan', 'Keamanan', 'Konsumsi'], 'Genset & sound system disewa H-1. Konsumsi berupa gorengan hangat & kopi disiapkan Sie Konsumsi.', 'Utama'),
('2026-08-16', '19:00', '19:45', 'Kirab Kemerdekaan', 'Pawai lampion & obor mengelilingi wilayah RT 12.', ARRAY['Perlengkapan', 'Keamanan'], 'Menyiapkan obor & lampion minyak. Sie Keamanan menutup akses jalan sementara & memandu rute.', 'Utama'),
('2026-08-16', '19:45', '20:30', 'Makan Malam Bersama (Soto)', 'Makan malam soto ayam prasmanan dari vendor lokal untuk seluruh warga.', ARRAY['Konsumsi'], 'Vendor soto disiapkan meja prasmanan di samping panggung. Pastikan piring & sendok siap.', 'Utama'),
('2026-08-16', '20:30', '22:00', 'Tirakatan & Doa Syukuran', 'Doa bersama keselamatan bangsa, pemotongan tumpeng, & sambutan ketua RT.', ARRAY['Acara'], 'Tumpeng utama diletakkan di panggung. Sambutan Ketua Panitia, Ketua RT, & tokoh masyarakat.', 'Utama'),
('2026-08-16', '22:00', '23:30', 'Pentas Seni & Pembagian Hadiah', 'Panggung gembira, penampilan warga, dan pembagian piala/hadiah.', ARRAY['Acara', 'Dokumentasi'], 'MC memandu pembagian hadiah secara runtut. Sie Dokumentasi mengabadikan setiap foto pemenang di panggung.', 'Utama');


-- ==========================================================
-- Insert Seed Data (RAB)
-- ==========================================================
INSERT INTO public.rab (id, kategori, item, kuantitas, satuan, harga_satuan) VALUES
('59550e50-2521-4f96-be99-52e46b9a89d1', 'Hadiah Lomba', 'Hadiah Lomba Anak-anak', 1, 'Paket', 1500000),
('59550e50-2521-4f96-be99-52e46b9a89d2', 'Hadiah Lomba', 'Hadiah Lomba Bapak-bapak', 1, 'Paket', 700000),
('59550e50-2521-4f96-be99-52e46b9a89d3', 'Hadiah Lomba', 'Hadiah Lomba Ibu-ibu', 1, 'Paket', 700000),
('59550e50-2521-4f96-be99-52e46b9a89d4', 'Hadiah Lomba', 'Hadiah Lomba Pemuda', 1, 'Paket', 600000),
('59550e50-2521-4f96-be99-52e46b9a89d5', 'Konsumsi Puncak', 'Soto Ayam', 200, 'Pax', 12000),
('59550e50-2521-4f96-be99-52e46b9a89d6', 'Perlengkapan', 'Sewa Panggung & Sound', 1, 'Paket', 1500000),
('59550e50-2521-4f96-be99-52e46b9a89d7', 'Perlengkapan', 'Umbul-umbul & Bendera', 10, 'Set', 60000),
('59550e50-2521-4f96-be99-52e46b9a89d8', 'Perlengkapan', 'Spanduk Utama', 1, 'Pcs', 200000),
('59550e50-2521-4f96-be99-52e46b9a89d9', 'Perlengkapan', 'Sewa Tenda & Kursi', 1, 'Paket', 500000),
('59550e50-2521-4f96-be99-52e46b9a89da', 'Perlengkapan', 'Cat Panggung', 2, 'Kaleng', 100000),
('59550e50-2521-4f96-be99-52e46b9a89db', 'Gotong Royong', 'Konsumsi Gotong Royong 9 Agst', 20, 'Pax', 20000),
('59550e50-2521-4f96-be99-52e46b9a89dc', 'Gotong Royong', 'Konsumsi Gotong Royong 15 Agst', 20, 'Pax', 20000),
('59550e50-2521-4f96-be99-52e46b9a89dd', 'Gotong Royong', 'Paku & Kabel Tambahan', 1, 'Set', 200000),
('59550e50-2521-4f96-be99-52e46b9a89de', 'Dana Cadangan', 'Biaya Tak Terduga', 1, 'Lumpsum', 1900000);


-- ==========================================================
-- Insert Seed Data (Rapat Awal)
-- ==========================================================
INSERT INTO public.rapat (tanggal, waktu, tempat, agenda, notulen) VALUES
('2026-07-05', '19:30 - 21:30', 'Rumah Ketua RT 12', 'Rapat Koordinasi Perdana & Pembentukan Panitia', '### Hasil Rapat Perdana HUT RI 81
1. **Ketua Panitia terpilih**: Gabriel Fermy Aswinta.
2. **Tema Acara disepakati**: "Guyub Rukun Membangun Negeri".
3. **Anggaran Belanja**: Target sebesar **Rp 12.000.000**, dengan kas awal RT sebesar **Rp 2.000.000**.
4. **Sistem Iuran**: Iuran wajib warga disepakati sebesar **Rp 50.000 per KK** (target 80 KK).
5. **Rencana Kegiatan**: Dibagi menjadi Sesi 1 (Jalan Sehat/Senam & Lomba tanggal 9 Agustus) dan Sesi 2 (Malam Tirakatan & Pentas Seni tanggal 16 Agustus).');


-- ==========================================================
-- Insert Seed Data (Sponsorship)
-- ==========================================================
INSERT INTO public.sponsorship (nama, tipe, nominal, keterangan, is_paid) VALUES
('Toko Kelontong Bu Sri', 'Platinum', 750000, 'Dana Segar & Voucher Belanja Lomba', true),
('Apotek Sehat Abadi', 'Gold', 400000, 'Penyediaan Paket P3K Lomba & Spanduk', true),
('Susu Segar Pelem', 'Silver', 250000, 'Donasi Produk Susu untuk Lomba Anak', true),
('Donatur Hamba Allah', 'Donatur Warga', 1000000, 'Dana Segar untuk Tambahan Soto', true);


-- ==========================================================
-- Insert Seed Data (Pengeluaran Awal)
-- ==========================================================
INSERT INTO public.pengeluaran (rab_id, item_pembelian, nominal_riil, tanggal_pembelian, seksi_pj, pic) VALUES
('59550e50-2521-4f96-be99-52e46b9a89d7', 'Pembelian Umbul-Umbul Merah Putih (10 Pcs)', 550000, '2026-07-06', 'Perlengkapan & Dekorasi', 'Pak Yudhi'),
('59550e50-2521-4f96-be99-52e46b9a89d8', 'Cetak Spanduk Utama Panggung (4x2m)', 180000, '2026-07-06', 'Perlengkapan & Dekorasi', 'Pak Yudhi');


-- ==========================================================
-- Insert Seed Data (Warga - 80 KK Mock data for testing)
-- ==========================================================
DO $$
DECLARE
    i INTEGER;
BEGIN
    FOR i IN 1..80 LOOP
        INSERT INTO public.warga (nama, blok, nominal_iuran, is_paid)
        VALUES (
            'Keluarga KK ' || LPAD(i::text, 2, '0'),
            'Blok ' || CHR(65 + (i % 4)), -- A, B, C, D
            50000,
            (i % 3 = 0) -- Set some as paid
        );
    END LOOP;
END $$;


-- ==========================================================
-- Enable Realtime for all tables
-- ==========================================================
alter publication supabase_realtime add table public.panitia;
alter publication supabase_realtime add table public.rundown;
alter publication supabase_realtime add table public.rab;
alter publication supabase_realtime add table public.warga;
alter publication supabase_realtime add table public.rapat;
alter publication supabase_realtime add table public.sponsorship;
alter publication supabase_realtime add table public.pengeluaran;
alter publication supabase_realtime add table public.audit_log;

