-- Fix RBAC for NULL akses_menu values
UPDATE public.seksi
SET akses_menu = CASE 
    WHEN akses_menu IS NULL THEN 'baksos'
    WHEN akses_menu NOT LIKE '%baksos%' THEN akses_menu || ',baksos'
    ELSE akses_menu
END
WHERE kategori = 'Inti' 
   OR nama = 'Koordinator Humas & Dana' 
   OR nama = 'Anggota Humas & Dana';
