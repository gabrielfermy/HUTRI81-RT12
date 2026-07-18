-- Create table for online transactions
CREATE TABLE IF NOT EXISTS public.transaksi_online (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_pengirim TEXT NOT NULL,
  jenis_transaksi TEXT NOT NULL CHECK (jenis_transaksi IN ('iuran', 'donasi')),
  nominal NUMERIC NOT NULL,
  bukti_url TEXT,
  keterangan TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  warga_id UUID REFERENCES public.warga(id) ON DELETE SET NULL, -- optional, if linked to a warga
  diubah_oleh TEXT
);

-- Enable RLS
ALTER TABLE public.transaksi_online ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (anyone can submit a payment)
CREATE POLICY "Allow public insert to transaksi_online" 
  ON public.transaksi_online FOR INSERT 
  WITH CHECK (true);

-- Allow public read (or just authenticated, but since we don't have strict auth in MVP, we allow select)
CREATE POLICY "Allow select on transaksi_online" 
  ON public.transaksi_online FOR SELECT 
  USING (true);

-- Allow update (panitia can approve)
CREATE POLICY "Allow update on transaksi_online" 
  ON public.transaksi_online FOR UPDATE 
  USING (true);

-- Create Storage Bucket for bukti_transfer
INSERT INTO storage.buckets (id, name, public) 
VALUES ('bukti_transfer', 'bukti_transfer', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Allow public upload to bukti_transfer" 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'bukti_transfer');

CREATE POLICY "Allow public read from bukti_transfer" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'bukti_transfer');

CREATE POLICY "Allow public delete from bukti_transfer" 
  ON storage.objects FOR DELETE 
  USING (bucket_id = 'bukti_transfer');
