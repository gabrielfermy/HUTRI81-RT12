# Logika Klasifikasi Sponsor & Visualizer Backdrop
## Proyek HUT RI 81 RT 12 Pelem Kidul

Sistem menyediakan fitur apresiasi bagi para pendukung dana kegiatan dalam bentuk penayangan logo/nama di halaman utama serta visualisasi dinamis di panggung utama via halaman `/backdrop`.

---

## 🎖️ Klasifikasi Kasta Sponsorship & Hak Eksklusivitas

Sponsor dibagi menjadi 4 tingkatan utama berdasarkan kontribusi mereka:

| Kasta | Syarat Nominal Donasi | Hak Exposure Panggung & Media | Keterangan |
| :--- | :--- | :--- | :--- |
| **Platinum** | `> Rp 500.000` | Branding Logo Utama Paling Besar & Ad-Lips MC | Logo/Nama berada di puncak backdrop |
| **Gold** | `Rp 200.000 - Rp 500.000` | Branding Sedang & Ad-Lips MC | Logo/Nama berada di baris tengah backdrop |
| **Silver** | `Barang / < Rp 200.000` | Nama Tercatat di Laporan Pertanggungjawaban | Berupa hadiah fisik lomba atau uang tunai kecil |
| **Donatur Warga** | `Sukarela` | Nama Tercatat di Portal Transparansi Publik | Donasi sukarela warga RT 12 |

---

## 🎨 Logika Tampilan Visualizer Backdrop (`/backdrop`)

Halaman `/backdrop` dirancang khusus untuk ditampilkan menggunakan proyektor panggung saat malam tirakatan (16 Agustus) atau dicetak sebagai banner panggung. 

Sponsor yang diinput oleh panitia melalui panel keuangan admin akan secara otomatis ditarik dan diposisikan menggunakan grid dinamis dengan aturan ukuran huruf/logo proporsional:

```
+--------------------------------------------------------------+
|                    [ BACKGROUND MERAH PUTIH ]                |
|                                                              |
|                PLATINUM SPONSOR (Teks/Logo Terbesar)         |
|                     [ SPONSOR A ]     [ SPONSOR B ]          |
|                                                              |
|                 GOLD SPONSOR (Teks/Logo Sedang)              |
|             [ SPONSOR C ]   [ SPONSOR D ]   [ SPONSOR E ]    |
|                                                              |
|                 SILVER SPONSOR (Daftar Teks Kecil)           |
|                Sponsor F  -  Sponsor G  -  Sponsor H         |
|                                                              |
+--------------------------------------------------------------+
```

### 📏 Spesifikasi Skala Ukuran CSS (Tailwind)
* **Kategori Platinum**:
  * Ukuran teks: `text-2xl sm:text-4xl`
  * Ketebalan: `font-black`
  * Warna latar kartu: `bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500` (Emas Platinum)
* **Kategori Gold**:
  * Ukuran teks: `text-lg sm:text-2xl`
  * Ketebalan: `font-extrabold`
  * Warna latar kartu: `bg-slate-300/10 border border-slate-300/30`
* **Kategori Silver & Donatur Warga**:
  * Ukuran teks: `text-xs sm:text-sm`
  * Ketebalan: `font-semibold`
  * Ditampilkan berupa deretan horizontal teks dipisahkan simbol pemisah (*bullet point* or *divider*).
