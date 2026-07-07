# Panduan Pengembang (Developer & AI Agent Guide)
## Proyek HUT RI 81 RT 12 Pelem Kidul

Dokumen ini ditulis secara khusus untuk memberikan petunjuk orientasi cepat bagi **developer manusia** dan **agen AI (AI coding assistant)** di masa mendatang agar dapat memahami struktur kode, state management, autentikasi, serta logging dengan cepat.

---

## 🚀 Persiapan Lingkungan & Jalankan Lokal
1. **Instal Dependensi**:
   ```bash
   npm install
   ```
2. **Setup File `.env.local`**:
   Salin berkas `.env.local.example` menjadi `.env.local` dan masukkan kunci Supabase:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-REF-ID].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-PUBLIC-KEY]
   ```
3. **Jalankan Development Server**:
   ```bash
   npm run dev
   ```

---

## 🔒 Sistem Autentikasi PIN Panitia

Untuk mengakses panel kontrol `/kepanitiaan/*`, sistem menggunakan pelindung login berbasis PIN yang disimpan dalam session browser (`localStorage` atau `sessionStorage`).

### 🔑 Validasi Alur Login (Next.js Client-side)
1. Aplikasi membaca data panitia dari tabel `panitia` (Nama dan Seksi).
2. Di halaman `/kepanitiaan` (jika belum masuk), tampil pilihan nama panitia berupa dropdown dan input teks sandi (PIN).
3. Ketika tombol login ditekan, sistem mencocokkan input PIN dengan kolom `pin_akses` dari nama panitia yang dipilih di database:
   * **Bila Cocok**: Data panitia yang login (Nama, Jabatan, Seksi, ID) disimpan di dalam session local browser. Halaman dirender ulang untuk memuat layout admin.
   * **Bila Gagal**: Menampilkan pesan eror.
4. **Proteksi Halaman Sub-Jalur**:
   Halaman `kepanitiaan/layout.tsx` membungkus seluruh sub-halaman di bawahnya. Layout ini mendeteksi keberadaan session login di level client. Jika kosong, layout akan otomatis me-render form login dan memblokir akses ke menu admin.

---

## 📝 Sistem Audit Logging (Audit Log Flow)

Setiap perubahan data (CUD: *Create, Update, Delete*) yang dilakukan oleh panitia yang terautentikasi wajib dicatat ke dalam tabel `audit_log`.

### 🛠️ Contoh Kode Pengiriman Log Audit
```typescript
import { supabase } from '@/lib/supabase';

async function logActivity(panitiaId: string, namaPanitia: string, aksi: string, detail: string) {
  await supabase
    .from('audit_log')
    .insert([
      {
        panitia_id: panitiaId,
        nama_panitia: namaPanitia,
        aksi: aksi,
        detail: detail
      }
    ]);
}
```

Setiap kali melakukan operasi database berikut, pastikan fungsi `logActivity` dipanggil setelah operasi utama sukses dijalankan:
* Menambahkan rapat baru.
* Memasukkan rincian belanja pengeluaran baru.
* Mengubah status lunas/belum lunas warga.
* Menambah panitia baru atau mereset PIN panitia.

---

## 🛠️ Pola Fallback Data Offline (State Resilience)
Aplikasi dikonfigurasi untuk dapat berjalan dalam kondisi **Offline / Tanpa Koneksi Database** (misalnya saat presentasi rapat dengan koneksi internet terbatas).
* Jika Supabase mengembalikan eror koneksi atau file `.env.local` kosong, variabel klien Supabase di [src/lib/supabase.ts](file:///k:/Personal/RT12/HutRi81/app/src/lib/supabase.ts) akan secara otomatis mengembalikan objek Proxy mock.
* Komponen Next.js diinstruksikan untuk menggunakan array data fallback statis (`fallbackRundown`, `fallbackRab`, dll.) jika kueri database mengembalikan kegagalan/nilai kosong. Jangan biarkan aplikasi crash hanya karena kegagalan koneksi database.
