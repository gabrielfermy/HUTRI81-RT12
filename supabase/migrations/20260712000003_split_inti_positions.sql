DELETE FROM public.seksi WHERE nama = 'Inti';

INSERT INTO public.seksi (nama, deskripsi, mempunyai_sub_koordinator, kategori, is_unique, akses_menu)
VALUES
  ('Ketua Panitia', 'Penanggung jawab utama seluruh kegiatan dan kepanitiaan', false, 'Inti', true, 'dashboard,rundown,warga,keuangan,panitia,catatan,logs,proposal,backdrop,rapat,baksos'),
  ('Sekretaris', 'Bertanggung jawab atas administrasi, persuratan, dan notulensi', false, 'Inti', true, 'dashboard,rundown,warga,keuangan,panitia,catatan,logs,proposal,backdrop,rapat,baksos'),
  ('Bendahara', 'Bertanggung jawab atas pengelolaan kas, RAB, dan pelaporan keuangan', false, 'Inti', true, 'dashboard,rundown,warga,keuangan,panitia,catatan,logs,proposal,backdrop,rapat,baksos')
ON CONFLICT (nama) DO UPDATE 
SET deskripsi = EXCLUDED.deskripsi, is_unique = EXCLUDED.is_unique, kategori = EXCLUDED.kategori;
