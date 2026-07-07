# Skema Basis Data (Database Schema)
## Proyek HUT RI 81 RT 12 Pelem Kidul

Sistem basis data menggunakan **Supabase PostgreSQL** dengan kebijakan Row Level Security (RLS) untuk membedakan hak akses baca umum dan manipulasi data oleh panitia.

---

## 📊 Kamus Data & Struktur Tabel

### 1. Tabel `panitia`
Menyimpan susunan kepanitiaan dan kredensial akses PIN login panitia.
* **Kolom**:
  * `id` (UUID, Primary Key, Default: `gen_random_uuid()`)
  * `nama` (TEXT, Not Null): Nama lengkap panitia.
  * `seksi` (TEXT, Not Null): Seksi kerja panitia (misal: *Inti*, *Acara*, *Perlengkapan*).
  * `jabatan` (TEXT, Default: `'Anggota'`): Peran spesifik (misal: *Ketua Panitia*, *Bendahara*).
  * `pin_akses` (TEXT, Default: `'1212'`): PIN 4-digit untuk autentikasi masuk ke panel koordinasi `/kepanitiaan`.
  * `created_at` (TIMESTAMP WITH TIME ZONE)

---

### 2. Tabel `rundown`
Menyimpan rangkaian detail jadwal acara dan instruksi teknis panitia.
* **Kolom**:
  * `id` (UUID, Primary Key)
  * `tanggal` (DATE, Not Null): Tanggal kegiatan (misal: `2026-08-09`).
  * `jam_mulai` (TEXT, Not Null): Jam mulai (format: `HH:MM`).
  * `jam_selesai` (TEXT, Not Null): Jam berakhir.
  * `kegiatan` (TEXT, Not Null): Nama kegiatan/acara.
  * `keterangan` (TEXT): Deskripsi acara untuk publik (warga).
  * `seksi_pj` (TEXT[]): Array nama seksi penanggung jawab (misal: `['Acara', 'Konsumsi']`).
  * `instruksi_internal` (TEXT): Panduan/catatan persiapan kerja rahasia khusus panitia.
  * `kategori` (TEXT, Default: `'Utama'`): Pengelompokan jenis (e.g. *Utama*, *Lomba Anak*, *Lomba Dewasa*).
  * `sort_order` (SERIAL)

---

### 3. Tabel `rab`
Menyimpan anggaran belanja terencana (budgeting) yang disepakati panitia.
* **Kolom**:
  * `id` (UUID, Primary Key)
  * `kategori` (TEXT, Not Null): Kategori pos anggaran (misal: *Hadiah Lomba*, *Perlengkapan*).
  * `item` (TEXT, Not Null): Deskripsi kebutuhan barang/pekerjaan.
  * `kuantitas` (NUMERIC, Default: `1`): Jumlah kuantitas.
  * `satuan` (TEXT, Not Null): Satuan barang (misal: *Paket*, *Pax*, *Kaleng*).
  * `harga_satuan` (NUMERIC, Not Null): Harga per unit.
  * `total_idr` (NUMERIC): Dihasilkan otomatis secara database dari perkalian `kuantitas * harga_satuan` (*GENERATED ALWAYS AS*).
  * `created_at` (TIMESTAMP WITH TIME ZONE)

---

### 4. Tabel `warga`
Menyimpan data kartu keluarga (KK) warga RT 12 dan status lunas iuran kemerdekaan sebesar Rp 50.000.
* **Kolom**:
  * `id` (UUID, Primary Key)
  * `nama` (TEXT, Not Null): Nama Kepala Keluarga.
  * `blok` (TEXT, Not Null): Blok rumah (misal: *Blok A*, *Blok B*).
  * `nominal_iuran` (NUMERIC, Default: `50000`): Jumlah nominal iuran wajib.
  * `is_paid` (BOOLEAN, Default: `false`): Status pelunasan iuran.
  * `paid_at` (TIMESTAMP WITH TIME ZONE): Waktu pelunasan.
  * `updated_at` (TIMESTAMP WITH TIME ZONE)

---

### 5. Tabel `rapat`
Menyimpan jadwal rapat panitia beserta hasil keputusan (notulen).
* **Kolom**:
  * `id` (UUID, Primary Key)
  * `tanggal` (DATE, Not Null): Tanggal rapat.
  * `waktu` (TEXT, Not Null): Jam rapat (misal: `19:30 - 21:00 WIB`).
  * `tempat` (TEXT, Not Null): Lokasi rapat diadakan.
  * `agenda` (TEXT, Not Null): Agenda utama rapat.
  * `notulen` (TEXT): Catatan hasil rapat resmi dengan format Markdown.
  * `created_at` (TIMESTAMP WITH TIME ZONE)

---

### 6. Tabel `sponsorship`
Menyimpan data donatur sukarela dan sponsor eksternal.
* **Kolom**:
  * `id` (UUID, Primary Key)
  * `nama` (TEXT, Not Null): Nama sponsor/brand/warga donatur.
  * `tipe` (TEXT, Not Null): Kasta sponsor (`Platinum`, `Gold`, `Silver`, atau `Donatur Warga`).
  * `nominal` (NUMERIC, Default: `0`): Jumlah donasi uang tunai.
  * `keterangan` (TEXT): Catatan bantuan jika donasi berupa barang (misal: *"Hadiah 5 set buku tulis"*).
  * `is_paid` (BOOLEAN, Default: `false`): Status barang/dana sudah diterima atau belum.
  * `created_at` (TIMESTAMP WITH TIME ZONE)

---

### 7. Tabel `pengeluaran`
Menyimpan transaksi belanja riil lapangan yang dilakukan panitia.
* **Kolom**:
  * `id` (UUID, Primary Key)
  * `rab_id` (UUID, References `rab(id)` ON DELETE SET NULL): Referensi ke anggaran terencana di tabel RAB.
  * `item_pembelian` (TEXT, Not Null): Nama barang yang dibeli aktual.
  * `nominal_riil` (NUMERIC, Default: `0`): Jumlah pengeluaran aktual yang terbayarkan.
  * `tanggal_pembelian` (DATE, Not Null): Tanggal transaksi.
  * `seksi_pj` (TEXT, Not Null): Seksi panitia penanggung jawab transaksi (e.g. *Konsumsi*).
  * `pic` (TEXT, Not Null): Nama anggota panitia pelaku transaksi belanja.
  * `bukti_nota_url` (TEXT): URL file foto kuitansi/nota belanja di storage.
  * `created_at` (TIMESTAMP WITH TIME ZONE)

---

### 8. Tabel `audit_log`
Menyimpan catatan audit untuk memantau aktivitas perubahan data di panel kontrol panitia.
* **Kolom**:
  * `id` (UUID, Primary Key)
  * `panitia_id` (UUID, References `panitia(id)` ON DELETE SET NULL): Hubungan ke user panitia pelaku aksi.
  * `nama_panitia` (TEXT, Not Null): Nama pelaku aksi (untuk cache).
  * `aksi` (TEXT, Not Null): Jenis aksi yang dilakukan (e.g., *"Menambah Rapat Baru"*, *"Mengubah Status Iuran"*).
  * `detail` (TEXT): Rincian teknis dari perubahan (misal: nilai lama vs nilai baru).
  * `created_at` (TIMESTAMP WITH TIME ZONE)

---

## 🔒 Kebijakan Row Level Security (RLS)

Untuk memfasilitasi integrasi Next.js yang sederhana tanpa konfigurasi token JWT admin yang kompleks, RLS diatur sebagai berikut:
1. **SELECT (Baca Data)**: Diizinkan secara publik (`USING (true)`) untuk semua tabel, sehingga warga umum dapat mengakses data secara langsung untuk portal publik.
2. **ALL (Modifikasi Data)**: Diizinkan secara global (`USING (true) WITH CHECK (true)`) untuk operasi INSERT/UPDATE/DELETE. Proteksi perubahan data dilindungi di tingkat aplikasi Next.js (Client & Server Actions) dengan pencocokan nama panitia dan `pin_akses` yang dimasukkan pada browser sebelum kueri dijalankan.
