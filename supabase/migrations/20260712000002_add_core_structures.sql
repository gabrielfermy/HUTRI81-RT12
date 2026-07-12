INSERT INTO public.seksi (nama, deskripsi, mempunyai_sub_koordinator, kategori, is_unique, akses_menu)
VALUES
  ('Pelindung', 'Melindungi dan mengayomi seluruh kepanitiaan', false, 'BOD', false, 'dashboard,logs,proposal,backdrop'),
  ('Penasihat', 'Memberikan nasihat dan masukan kepada kepanitiaan', false, 'BOD', false, 'dashboard,logs,proposal,backdrop'),
  ('Inti', 'Panitia Inti (Ketua, Sekretaris, Bendahara)', false, 'Inti', false, 'dashboard,rundown,warga,keuangan,panitia,catatan,logs,proposal,backdrop,rapat,baksos')
ON CONFLICT (nama) DO NOTHING;
