# Logika Pelacakan Anggaran & Pengeluaran Riil
## Proyek HUT RI 81 RT 12 Pelem Kidul

Sistem pencatatan keuangan dirancang untuk memberikan transparansi absolut kepada warga serta membantu bendahara membandingkan rencana anggaran belanja (RAB) vs pengeluaran riil di lapangan.

---

## 📈 Alur Pengumpulan Dana (Pendapatan Kas)

Dana dikumpulkan secara terpusat oleh Bendahara (Pak Tri) dan bersumber dari 3 pos pendapatan utama:

1. **Kas Awal RT 12**: Saldo awal disepakati sebesar **Rp 2.000.000**.
2. **Iuran Wajib Warga**: Ditargetkan dari **80 Kepala Keluarga (KK)** dengan tarif **Rp 50.000 per KK** (Total potensi pendapatan: **Rp 4.000.000**).
3. **Sponsorship & Donatur**: Untuk menutup kekurangan anggaran target Rp 12.000.000, panitia mencari sumbangan sukarela dan sponsorship usaha komersial sebesar **Rp 6.000.000**.

### 🧮 Rumus Akumulasi Dana Terkumpul
```
Total Terkumpul = Kas RT (Rp 2.000.000) 
                 + (Jumlah KK Lunas * Rp 50.000) 
                 + Total Nominal Sponsor Terbayar (is_paid = true)
```
Persentase progress bar keuangan pada halaman utama dihitung secara dinamis terhadap total target target ideal Rp 12.000.000:
```
Progress (%) = Min( (Total Terkumpul / Rp 12.000.000) * 100, 100 )
```

---

## 💸 Alur Pelacakan Pengeluaran (Planned vs Actual)

Setiap pengeluaran riil yang dilakukan oleh penanggung jawab seksi di lapangan wajib dicatat dengan menghubungkannya ke item anggaran (RAB) perencanaan.

```
+------------------+                   +------------------------+
|    Tabel RAB     |                   |    Tabel Pengeluaran   |
| (Perencanaan)    |                   |       (Aktual)         |
|                  |                   |                        |
| - id (PK)        |<------------------| - rab_id (FK)          |
| - kategori       |                   | - item_pembelian       |
| - item           |                   | - nominal_riil         |
| - total_idr      |                   | - seksi_pj, pic        |
+------------------+                   +------------------------+
```

### 📋 Skenario Kasus Belanja Lapangan
1. **Langkah 1 (Perencanaan)**: Rapat perdana menyetujui anggaran `Hadiah Lomba Anak-anak` senilai **Rp 1.500.000** (Ini tersimpan di tabel `rab`).
2. **Langkah 2 (Belanja Aktual)**: Koordinator Sesi Pagi (Bu Agus) berbelanja mainan di Toko ATK Senilai **Rp 950.000**.
3. **Langkah 3 (Input Data)**: Bu Agus masuk ke panel `/kepanitiaan/keuangan`, memilih item perencanaan `Hadiah Lomba Anak-anak` dari dropdown, lalu menginput nominal belanja riil Rp 950.000 dengan mencantumkan namanya sebagai PIC.
4. **Langkah 4 (Visualisasi)**:
   * Halaman Publik akan menampilkan perbandingan otomatis: Rencana Rp 1.500.000 vs Realisasi Rp 950.000.
   * Sisa dana anggaran tersebut (**Rp 550.000**) dapat dipantau oleh bendahara untuk sisa pembelian hadiah lomba lainnya.

---

## 🔒 Kebijakan Validasi Transaksi Belanja
* Nilai `nominal_riil` pengeluaran tidak boleh bernilai negatif.
* Kolom `rab_id` bersifat opsional (*ON DELETE SET NULL*). Jika suatu item anggaran di dalam RAB dihapus, data pembelian aktual tetap tersimpan di database sebagai pengeluaran mandiri dengan kategori "Tanpa Kategori RAB" agar kas keluar tetap tercatat akurat.
* Setiap kali panitia menambahkan pengeluaran baru, sebuah entri akan otomatis didaftarkan ke tabel `audit_log` untuk mencatat siapa pelaku yang memasukkan data belanja tersebut.
