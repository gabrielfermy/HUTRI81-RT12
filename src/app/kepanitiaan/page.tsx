'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar, DollarSign, FileText, Plus, CheckCircle, Clock, Sparkles, ShieldAlert } from 'lucide-react';

const seedRundown = [
  { tanggal: '2026-08-09', jam_mulai: '06:00', jam_selesai: '07:30', kegiatan: 'Senam Kemerdekaan', keterangan: 'Senam pagi gembira bersama instruktur profesional.', seksi_pj: ['Acara', 'Konsumsi'], instruksi_internal: 'Instruktur senam harus standby jam 05:45. Sie Konsumsi menyiapkan air mineral gelas.', kategori: 'Utama' },
  { tanggal: '2026-08-09', jam_mulai: '07:30', jam_selesai: '08:15', kegiatan: 'Lomba Memasukkan Bola', keterangan: 'Lomba estafet memasukkan bola menggunakan gelas di pinggang.', seksi_pj: ['Acara'], instruksi_internal: 'Area Lomba Anak 1. Persiapkan gelas plastik, bola pingpong, dan tali rafia.', kategori: 'Lomba Anak' },
  { tanggal: '2026-08-09', jam_mulai: '08:15', jam_selesai: '09:00', kegiatan: 'Lomba Memasukkan Pensil ke Botol', keterangan: 'Lomba ketangkasan memasukkan pensil yang diikat di corong kepala ke dalam botol.', seksi_pj: ['Acara'], instruksi_internal: 'Area Lomba Anak 2. Persiapkan botol kaca, pensil, dan corong kepala.', kategori: 'Lomba Anak' },
  { tanggal: '2026-08-09', jam_mulai: '09:00', jam_selesai: '09:45', kegiatan: 'Lomba Makan Kerupuk', keterangan: 'Lomba makan kerupuk gantung klasik tanpa tangan.', seksi_pj: ['Acara'], instruksi_internal: 'Area Lomba Anak 3. Siapkan kerupuk putih, tiang jemuran/tali, dan kecap.', kategori: 'Lomba Anak' },
  { tanggal: '2026-08-09', jam_mulai: '09:45', jam_selesai: '10:30', kegiatan: 'Lomba Balap Karung Helm', keterangan: 'Balap karung menggunakan helm pengaman untuk keselamatan.', seksi_pj: ['Acara', 'Perlengkapan'], instruksi_internal: 'Area Lomba Anak 4. Karung goni besar 4 biji, helm anak-anak 4 biji.', kategori: 'Lomba Anak' },
  { tanggal: '2026-08-09', jam_mulai: '07:30', jam_selesai: '08:30', kegiatan: 'Lomba Memaku Paku Estafet', keterangan: 'Lomba kelompok memaku paku ke balok kayu secara estafet cepat.', seksi_pj: ['Acara'], instruksi_internal: 'Area Lomba Dewasa 1. Sediakan balok kayu tebal, palu besi 2, paku 3 inci.', kategori: 'Lomba Dewasa' },
  { tanggal: '2026-08-09', jam_mulai: '08:30', jam_selesai: '09:30', kegiatan: 'Lomba Menarik Kaleng', keterangan: 'Lomba kekuatan fisik & keseimbangan menarik kaleng yang terikat di pinggang.', seksi_pj: ['Acara', 'Perlengkapan'], instruksi_internal: 'Area Lomba Dewasa 2. Kaleng susu bekas diisi kerikil, tali pinggang.', kategori: 'Lomba Dewasa' },
  { tanggal: '2026-08-09', jam_mulai: '09:30', jam_selesai: '10:30', kegiatan: 'Lomba Tebak Gaya / Logika', keterangan: 'Lomba tebak ekspresi dan kekompakan kelompok.', seksi_pj: ['Acara'], instruksi_internal: 'Area Lomba Dewasa 3. Siapkan kartu petunjuk kata, mikrofon.', kategori: 'Lomba Dewasa' },
  { tanggal: '2026-08-15', jam_mulai: '19:30', jam_selesai: '23:00', kegiatan: 'Gotong Royong & Persiapan Panggung', keterangan: 'Pemasangan tenda, panggung utama, sound system, dekorasi bendera & obor.', seksi_pj: ['Perlengkapan', 'Keamanan', 'Konsumsi'], instruksi_internal: 'Genset & sound system disewa H-1. Konsumsi berupa gorengan hangat & kopi disiapkan Sie Konsumsi.', kategori: 'Utama' },
  { tanggal: '2026-08-16', jam_mulai: '19:00', jam_selesai: '19:45', kegiatan: 'Kirab Kemerdekaan', keterangan: 'Pawai lampion & obor mengelilingi wilayah RT 12.', seksi_pj: ['Perlengkapan', 'Keamanan'], instruksi_internal: 'Menyiapkan obor & lampion minyak. Sie Keamanan menutup akses jalan sementara & memandu rute.', kategori: 'Utama' },
  { tanggal: '2026-08-16', jam_mulai: '19:45', jam_selesai: '20:30', kegiatan: 'Makan Malam Bersama (Soto)', keterangan: 'Makan malam soto ayam prasmanan dari vendor lokal untuk seluruh warga.', seksi_pj: ['Konsumsi'], instruksi_internal: 'Vendor soto disiapkan meja prasmanan di samping panggung. Pastikan piring & sendok siap.', kategori: 'Utama' },
  { tanggal: '2026-08-16', jam_mulai: '20:30', jam_selesai: '22:00', kegiatan: 'Tirakatan & Doa Syukuran', keterangan: 'Doa bersama keselamatan bangsa, pemotongan tumpeng, & sambutan ketua RT.', seksi_pj: ['Acara'], instruksi_internal: 'Tumpeng utama diletakkan di panggung. Sambutan Ketua Panitia, Ketua RT, & tokoh masyarakat.', kategori: 'Utama' },
  { tanggal: '2026-08-16', jam_mulai: '22:00', jam_selesai: '23:30', kegiatan: 'Pentas Seni & Pembagian Hadiah', keterangan: 'Panggung gembira, penampilan warga, dan pembagian piala/hadiah.', seksi_pj: ['Acara', 'Dokumentasi'], instruksi_internal: 'MC memandu pembagian hadiah secara runtut. Sie Dokumentasi mengabadikan setiap foto pemenang di panggung.', kategori: 'Utama' }
];

const seedRab = [
  { kategori: 'Hadiah Lomba', item: 'Hadiah Lomba Anak-anak', kuantitas: 1, satuan: 'Paket', harga_satuan: 1500000, total_idr: 1500000 },
  { kategori: 'Hadiah Lomba', item: 'Hadiah Lomba Bapak-bapak', kuantitas: 1, satuan: 'Paket', harga_satuan: 700000, total_idr: 700000 },
  { kategori: 'Hadiah Lomba', item: 'Hadiah Lomba Ibu-ibu', kuantitas: 1, satuan: 'Paket', harga_satuan: 700000, total_idr: 700000 },
  { kategori: 'Hadiah Lomba', item: 'Hadiah Lomba Pemuda', kuantitas: 1, satuan: 'Paket', harga_satuan: 600000, total_idr: 600000 },
  { kategori: 'Konsumsi Puncak', item: 'Soto Ayam', kuantitas: 200, satuan: 'Pax', harga_satuan: 12000, total_idr: 2400000 },
  { kategori: 'Perlengkapan', item: 'Sewa Panggung & Sound', kuantitas: 1, satuan: 'Paket', harga_satuan: 1500000, total_idr: 1500000 },
  { kategori: 'Perlengkapan', item: 'Umbul-umbul & Bendera', kuantitas: 10, satuan: 'Set', harga_satuan: 60000, total_idr: 600000 },
  { kategori: 'Perlengkapan', item: 'Spanduk Utama', kuantitas: 1, satuan: 'Pcs', harga_satuan: 200000, total_idr: 200000 },
  { kategori: 'Perlengkapan', item: 'Sewa Tenda & Kursi', kuantitas: 1, satuan: 'Paket', harga_satuan: 500000, total_idr: 500000 },
  { kategori: 'Perlengkapan', item: 'Cat Panggung', kuantitas: 2, satuan: 'Kaleng', harga_satuan: 100000, total_idr: 200000 },
  { kategori: 'Gotong Royong', item: 'Konsumsi Gotong Royong 9 Agst', kuantitas: 20, satuan: 'Pax', harga_satuan: 20000, total_idr: 400000 },
  { kategori: 'Gotong Royong', item: 'Konsumsi Gotong Royong 15 Agst', kuantitas: 20, satuan: 'Pax', harga_satuan: 20000, total_idr: 400000 },
  { kategori: 'Gotong Royong', item: 'Paku & Kabel Tambahan', kuantitas: 1, satuan: 'Set', harga_satuan: 200000, total_idr: 200000 },
  { kategori: 'Dana Cadangan', item: 'Biaya Tak Terduga', kuantitas: 1, satuan: 'Lumpsum', harga_satuan: 1900000, total_idr: 1900000 }
];

const seedSeksi = [
  { nama: 'Penanggung Jawab', deskripsi: 'Pengawas & Penanggung Jawab tingkat atas', mempunyai_sub_koordinator: false, kategori: 'BOD', is_unique: false, akses_menu: 'dashboard,logs,proposal,backdrop' },
  { nama: 'Pengawas', deskripsi: 'Pengawas pelaksanaan kegiatan panitia', mempunyai_sub_koordinator: false, kategori: 'BOD', is_unique: false, akses_menu: 'dashboard,logs,proposal,backdrop' },
  { nama: 'Ketua Panitia', deskripsi: 'Penanggung jawab utama seluruh operasional', mempunyai_sub_koordinator: false, kategori: 'Inti', is_unique: true, akses_menu: 'dashboard,rundown,warga,keuangan_pengeluaran,keuangan_iuran,keuangan_sponsor,keuangan_rab,panitia,catatan,logs,proposal,backdrop' },
  { nama: 'Sekretaris', deskripsi: 'Mengelola administrasi dan notulen rapat', mempunyai_sub_koordinator: false, kategori: 'Inti', is_unique: true, akses_menu: 'dashboard,rundown,warga,keuangan_pengeluaran,keuangan_iuran,keuangan_sponsor,keuangan_rab,panitia,catatan,logs,proposal,backdrop' },
  { nama: 'Bendahara', deskripsi: 'Mengelola keluar-masuk keuangan dan iuran', mempunyai_sub_koordinator: false, kategori: 'Inti', is_unique: true, akses_menu: 'dashboard,rundown,warga,keuangan_pengeluaran,keuangan_iuran,keuangan_sponsor,keuangan_rab,panitia,catatan,logs,proposal,backdrop' },
  { nama: 'Koordinator Acara', deskripsi: 'Mengatur jalannya acara utama dan berbagai lomba', mempunyai_sub_koordinator: false, kategori: 'Seksi', is_unique: true, akses_menu: 'dashboard,rundown,warga,keuangan_pengeluaran,keuangan_iuran,keuangan_sponsor,keuangan_rab,panitia,catatan,proposal,backdrop' },
  { nama: 'Sub Koordinator Acara', deskripsi: 'Membantu koordinasi per sesi lomba', mempunyai_sub_koordinator: false, kategori: 'Seksi', is_unique: false, akses_menu: 'dashboard,rundown,warga,keuangan_pengeluaran,keuangan_iuran,keuangan_sponsor,keuangan_rab,panitia,catatan,proposal,backdrop' },
  { nama: 'Anggota Acara', deskripsi: 'Pelaksana lapangan seksi acara', mempunyai_sub_koordinator: false, kategori: 'Seksi', is_unique: false, akses_menu: 'dashboard,rundown,warga,keuangan_pengeluaran,keuangan_iuran,keuangan_sponsor,keuangan_rab,panitia,catatan,proposal,backdrop' },
  { nama: 'Koordinator Perlengkapan & Dekorasi', deskripsi: 'Menyediakan dan menata kebutuhan alat/dekorasi fisik', mempunyai_sub_koordinator: false, kategori: 'Seksi', is_unique: true, akses_menu: 'dashboard,rundown,warga,keuangan_pengeluaran,keuangan_iuran,keuangan_sponsor,keuangan_rab,panitia,catatan,proposal,backdrop' },
  { nama: 'Anggota Perlengkapan & Dekorasi', deskripsi: 'Membantu penyediaan dekorasi fisik panggung', mempunyai_sub_koordinator: false, kategori: 'Seksi', is_unique: false, akses_menu: 'dashboard,rundown,warga,keuangan_pengeluaran,keuangan_iuran,keuangan_sponsor,keuangan_rab,panitia,catatan,proposal,backdrop' },
  { nama: 'Koordinator Konsumsi', deskripsi: 'Mengelola ketersediaan makanan & prasmanan warga', mempunyai_sub_koordinator: false, kategori: 'Seksi', is_unique: true, akses_menu: 'dashboard,rundown,warga,keuangan_pengeluaran,keuangan_iuran,keuangan_sponsor,keuangan_rab,panitia,catatan,proposal,backdrop' },
  { nama: 'Anggota Konsumsi', deskripsi: 'Pelaksana konsumsi konsumsi di lapangan', mempunyai_sub_koordinator: false, kategori: 'Seksi', is_unique: false, akses_menu: 'dashboard,rundown,warga,keuangan_pengeluaran,keuangan_iuran,keuangan_sponsor,keuangan_rab,panitia,catatan,proposal,backdrop' },
  { nama: 'Koordinator Keamanan & Kebersihan', deskripsi: 'Menjaga ketertiban lingkungan dan kebersihan lokasi', mempunyai_sub_koordinator: false, kategori: 'Seksi', is_unique: true, akses_menu: 'dashboard,rundown,warga,keuangan_pengeluaran,keuangan_iuran,keuangan_sponsor,keuangan_rab,panitia,catatan,proposal,backdrop' },
  { nama: 'Anggota Keamanan & Kebersihan', deskripsi: 'Pelaksana ketertiban dan kebersihan', mempunyai_sub_koordinator: false, kategori: 'Seksi', is_unique: false, akses_menu: 'dashboard,rundown,warga,keuangan_pengeluaran,keuangan_iuran,keuangan_sponsor,keuangan_rab,panitia,catatan,proposal,backdrop' },
  { nama: 'Koordinator Dokumentasi', deskripsi: 'Mengambil dokumentasi video & foto acara', mempunyai_sub_koordinator: false, kategori: 'Seksi', is_unique: true, akses_menu: 'dashboard,rundown,warga,keuangan_pengeluaran,keuangan_iuran,keuangan_sponsor,keuangan_rab,panitia,catatan,proposal,backdrop' },
  { nama: 'Anggota Dokumentasi', deskripsi: 'Membantu perekaman dokumentasi di lapangan', mempunyai_sub_koordinator: false, kategori: 'Seksi', is_unique: false, akses_menu: 'dashboard,rundown,warga,keuangan_pengeluaran,keuangan_iuran,keuangan_sponsor,keuangan_rab,panitia,catatan,proposal,backdrop' },
  { nama: 'Koordinator Humas & Dana', deskripsi: 'Menghubungi sponsor luar dan menyebarkan info warga', mempunyai_sub_koordinator: false, kategori: 'Seksi', is_unique: true, akses_menu: 'dashboard,rundown,warga,keuangan_pengeluaran,keuangan_iuran,keuangan_sponsor,keuangan_rab,panitia,catatan,proposal,backdrop' },
  { nama: 'Anggota Humas & Dana', deskripsi: 'Membantu penyebaran undangan dan cari dana', mempunyai_sub_koordinator: false, kategori: 'Seksi', is_unique: false, akses_menu: 'dashboard,rundown,warga,keuangan_pengeluaran,keuangan_iuran,keuangan_sponsor,keuangan_rab,panitia,catatan,proposal,backdrop' }
];

export default function KepanitiaanDashboard() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // States for stats
  const [panitiaCount, setPanitiaCount] = useState(0);
  const [totalCollected, setTotalCollected] = useState(2000000); // default is initial RT Kas
  const [totalSpent, setTotalSpent] = useState(0);
  const [lunasCount, setLunasCount] = useState(0);
  const [totalWarga, setTotalWarga] = useState(0);
  
  // Database Empty States
  const [rabCount, setRabCount] = useState(-1);
  const [rundownCount, setRundownCount] = useState(-1);
  const [seeding, setSeeding] = useState(false);
  const [resetting, setResetting] = useState(false);
  
  // Rapat states
  const [rapatList, setRapatList] = useState<any[]>([]);
  const [agenda, setAgenda] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [waktu, setWaktu] = useState('');
  const [tempat, setTempat] = useState('');

  // Active meeting notulen edit state
  const [activeRapatId, setActiveRapatId] = useState<string | null>(null);
  const [notulenContent, setNotulenContent] = useState('');

  // Load user from local storage and fetch stats/rapat
  useEffect(() => {
    const userSession = localStorage.getItem('session_panitia');
    if (userSession) {
      setCurrentUser(JSON.parse(userSession));
    }

    async function loadDashboardData() {
      try {
        // Fetch panitia count
        const { count: pCount } = await supabase.from('panitia').select('*', { count: 'exact', head: true });
        if (pCount) setPanitiaCount(pCount);

        // Fetch warga stats
        const { data: warga } = await supabase.from('warga').select('nominal_iuran, is_paid');
        if (warga) {
          setTotalWarga(warga.length);
          const lunas = warga.filter((w: any) => w.is_paid);
          setLunasCount(lunas.length);
          const iuranSum = lunas.reduce((sum: number, w: any) => sum + Number(w.nominal_iuran), 0);
          
          // Fetch sponsor stats
          const { data: sponsors } = await supabase.from('sponsorship').select('nominal');
          const sponsorSum = sponsors ? sponsors.reduce((sum: number, s: any) => sum + Number(s.nominal || 0), 0) : 0;
          
          setTotalCollected(2000000 + iuranSum + sponsorSum); // 2M initial kas RT
        }

        // Fetch actual spent stats
        const { data: expenses } = await supabase.from('pengeluaran').select('nominal_riil');
        if (expenses) {
          setTotalSpent(expenses.reduce((sum: number, e: any) => sum + Number(e.nominal_riil), 0));
        }

        // Fetch rapat list
        const { data: rapat } = await supabase.from('rapat').select('*').order('tanggal', { ascending: false });
        if (rapat) setRapatList(rapat);

        // Fetch RAB & Rundown count to see if we need to show the seeder button
        const { count: rabC } = await supabase.from('rab').select('*', { count: 'exact', head: true });
        if (rabC !== null) setRabCount(rabC);

        const { count: rundownC } = await supabase.from('rundown').select('*', { count: 'exact', head: true });
        if (rundownC !== null) setRundownCount(rundownC);

      } catch (err) {
        console.error('Error loading dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();

    const channel = supabase
      .channel('kepanitiaan-dashboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        loadDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      // 1. Seed Rundown
      const { error: rdErr } = await supabase.from('rundown').insert(seedRundown);
      if (rdErr) throw rdErr;

      // 2. Seed RAB
      const { error: rabErr } = await supabase.from('rab').insert(seedRab);
      if (rabErr) throw rabErr;

      setRabCount(seedRab.length);
      setRundownCount(seedRundown.length);
      await logAudit('Menginisialisasi Data Awal', 'Mengisi basis data default dengan 5 Rundown & 14 Pos RAB');
      alert('Inisialisasi Data Awal Berhasil! Halaman akan dimuat ulang.');
      window.location.reload();
    } catch (err) {
      console.error('Seeding database failed:', err);
      alert('Gagal menginisialisasi database: ' + JSON.stringify(err));
    } finally {
      setSeeding(false);
    }
  };

  const handleResetDatabase = async () => {
    if (!confirm('PERINGATAN KERAS! Anda akan menghapus SELURUH data transaksi, iuran, rapat, rundown, rab, audit log, dan panitia lainnya. Hanya akun dengan jabatan Ketua Panitia yang akan dipertahankan. Apakah Anda yakin?')) {
      return;
    }

    setResetting(true);
    try {
      // 1. Delete dependent tables
      await supabase.from('pengeluaran').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('sponsorship').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('rapat').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('rundown').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('rab').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('warga').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('audit_log').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('rundown_tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('seksi').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('panitia_notes').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      // 2. Clear panitia other than Ketua Panitia
      await supabase.from('panitia').delete().neq('jabatan', 'Ketua Panitia');

      // 3. Re-seed default sections
      await supabase.from('seksi').insert(seedSeksi);

      // Log the audit
      await logAudit('Mereset Seluruh Database', 'Melakukan reset database penuh dan menyisakan hanya akun Ketua Panitia.');

      alert('Database berhasil direset penuh! Halaman akan dimuat ulang.');
      window.location.reload();
    } catch (err) {
      console.error('Reset database failed:', err);
      alert('Gagal mereset database: ' + JSON.stringify(err));
    } finally {
      setResetting(false);
    }
  };

  const logAudit = async (aksi: string, detail: string) => {
    if (!currentUser) return;
    try {
      await supabase.from('audit_log').insert([
        {
          panitia_id: currentUser.id,
          nama_panitia: currentUser.nama,
          aksi,
          detail,
        },
      ]);
    } catch (err) {
      console.error('Audit logging failed:', err);
    }
  };

  const handleAddRapat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agenda || !tanggal || !waktu || !tempat) return;

    const newRapat = {
      agenda,
      tanggal,
      waktu,
      tempat,
      notulen: '',
    };

    try {
      const { data, error } = await supabase.from('rapat').insert([newRapat]).select();
      if (data && !error) {
        setRapatList([data[0], ...rapatList]);
        await logAudit('Menambah Rapat Baru', `Menjadwalkan rapat: "${agenda}" pada tanggal ${tanggal}`);
      } else {
        // Fallback local addition
        setRapatList([{ ...newRapat, id: String(Date.now()) }, ...rapatList]);
      }
    } catch (err) {
      setRapatList([{ ...newRapat, id: String(Date.now()) }, ...rapatList]);
    }

    // Reset Form
    setAgenda('');
    setTanggal('');
    setWaktu('');
    setTempat('');
  };

  const handleOpenNotulenEditor = (rapat: any) => {
    setActiveRapatId(rapat.id);
    setNotulenContent(rapat.notulen || '');
  };

  const handleSaveNotulen = async () => {
    if (!activeRapatId) return;

    try {
      const { error } = await supabase
        .from('rapat')
        .update({ notulen: notulenContent })
        .eq('id', activeRapatId);

      if (!error) {
        setRapatList(
          rapatList.map((r) => (r.id === activeRapatId ? { ...r, notulen: notulenContent } : r))
        );
        const rapatObj = rapatList.find(r => r.id === activeRapatId);
        await logAudit('Memperbarui Notulen', `Mengedit hasil notulen untuk rapat agenda: "${rapatObj?.agenda}"`);
      }
    } catch (err) {
      setRapatList(
        rapatList.map((r) => (r.id === activeRapatId ? { ...r, notulen: notulenContent } : r))
      );
    }

    setActiveRapatId(null);
    setNotulenContent('');
  };

  return (
    <div className="space-y-10">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/40 border border-slate-200 rounded-2xl p-6 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">Selamat Datang, {currentUser?.nama || 'Panitia'}!</h1>
          <p className="text-xs text-slate-600 mt-1">Dasbor koordinasi terpusat HUT RI Ke-81 RT 12 Pelem Kidul.</p>
        </div>
        <div className="text-xs font-bold text-red-400 bg-red-600/10 border border-red-500/20 px-3 py-1.5 rounded-xl uppercase tracking-wider">
          Akses: {currentUser?.jabatan || 'Anggota'}
        </div>
      </div>

      {/* Database Empty Seeder Banner */}
      {rabCount === 0 && rundownCount === 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-amber-450 animate-pulse" />
              <span>Database Operasional Kosong</span>
            </h4>
            <p className="text-xs text-slate-600">
              Apakah Anda ingin menginisialisasi database dengan data awal default (5 Acara & 14 Pos RAB)?
            </p>
          </div>
          <button
            onClick={handleSeedData}
            disabled={seeding}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-900 text-xs font-bold rounded-xl transition-all shadow-md shrink-0 disabled:opacity-50"
          >
            {seeding ? 'Sedang Memproses...' : 'Inisialisasi Data Awal'}
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/20 border border-slate-200/80 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-600 font-bold uppercase tracking-wider">Kas Terkumpul</span>
            <DollarSign className="h-4.5 w-4.5 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">Rp {totalCollected.toLocaleString('id-ID')}</div>
          <div className="text-[10px] text-slate-500 font-semibold">Target: Rp 12.000.000 | RT Kas + Iuran + Sponsor</div>
        </div>

        <div className="bg-white/20 border border-slate-200/80 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-600 font-bold uppercase tracking-wider">Realisasi Belanja</span>
            <DollarSign className="h-4.5 w-4.5 text-indigo-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">Rp {totalSpent.toLocaleString('id-ID')}</div>
          <div className="text-[10px] text-slate-500 font-semibold">Belanja riil terpakai panitia</div>
        </div>

        <div className="bg-white/20 border border-slate-200/80 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-600 font-bold uppercase tracking-wider">Iuran Warga</span>
            <CheckCircle className="h-4.5 w-4.5 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">{lunasCount} / {totalWarga} KK</div>
          <div className="text-[10px] text-slate-500 font-semibold">Tingkat pelunasan iuran wajib warga</div>
        </div>

        <div className="bg-white/20 border border-slate-200/80 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-600 font-bold uppercase tracking-wider">Agenda Rapat</span>
            <Calendar className="h-4.5 w-4.5 text-red-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">{rapatList.length} Kali</div>
          <div className="text-[10px] text-slate-500 font-semibold">Total rapat evaluasi kepanitiaan</div>
        </div>
      </div>

      {/* Main Grid: Add Meeting & Meeting List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Add Meeting Form */}
        <div className="bg-white/30 border border-slate-200 rounded-2xl p-6 space-y-6 h-fit">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Plus className="h-5 w-5 text-red-500" />
              <span>Jadwalkan Rapat</span>
            </h3>
            <p className="text-xs text-slate-500">Mendaftarkan agenda rapat koordinasi selanjutnya.</p>
          </div>

          <form onSubmit={handleAddRapat} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Agenda Rapat</label>
              <input
                type="text"
                required
                value={agenda}
                onChange={(e) => setAgenda(e.target.value)}
                placeholder="Contoh: Rapat Pleno 2 Hadiah Lomba"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Tanggal</label>
                <input
                  type="date"
                  required
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Waktu</label>
                <input
                  type="text"
                  required
                  value={waktu}
                  onChange={(e) => setWaktu(e.target.value)}
                  placeholder="Contoh: 19:30 - selesai"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Tempat Pertemuan</label>
              <input
                type="text"
                required
                value={tempat}
                onChange={(e) => setTempat(e.target.value)}
                placeholder="Contoh: Rumah Pak RT 12"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-red-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-slate-900 font-bold text-xs rounded-xl transition-all"
            >
              Simpan Jadwal Rapat
            </button>
          </form>
        </div>

        {/* Meeting Minutes Editor & List */}
        <div className="bg-white/30 border border-slate-200 rounded-2xl p-6 lg:col-span-2 space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-red-500" />
              <span>Notulen Rapat Resmi</span>
            </h3>
            <p className="text-xs text-slate-500">Tulis dan edit hasil keputusan koordinasi kepanitiaan di bawah.</p>
          </div>

          {activeRapatId ? (
            /* Markdown Editor view */
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-red-400">Menyunting Notulen</span>
                <span className="text-[10px] text-slate-500">Format teks bebas (mendukung Markdown)</span>
              </div>
              <textarea
                rows={10}
                value={notulenContent}
                onChange={(e) => setNotulenContent(e.target.value)}
                placeholder="Tulis keputusan di sini (e.g. ## Kesepakatan:\n1. Beli soto ayam 200 porsi...)"
                className="w-full bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-900 focus:outline-none focus:border-red-500 font-mono"
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setActiveRapatId(null);
                    setNotulenContent('');
                  }}
                  className="px-4 py-2 border border-slate-200 hover:bg-white text-slate-600 hover:text-slate-900 rounded-lg text-xs font-bold transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveNotulen}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-900 rounded-lg text-xs font-bold transition-all"
                >
                  Simpan Notulen
                </button>
              </div>
            </div>
          ) : (
            /* Meeting List View */
            <div className="space-y-4">
              {rapatList.map((r, index) => (
                <div key={index} className="bg-slate-50/40 border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-red-500/10 transition-colors">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-3.5 w-3.5 text-slate-500" />
                      <span className="text-xs text-slate-600 font-semibold">
                        {new Date(r.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      <span className="text-[9px] bg-slate-200 text-slate-600 border border-slate-300 px-2 py-0.5 rounded-full font-bold">
                        {r.waktu}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{r.agenda}</h4>
                    <p className="text-xs text-slate-500">Tempat: <span className="text-slate-600 font-medium">{r.tempat}</span></p>
                  </div>

                  <button
                    onClick={() => handleOpenNotulenEditor(r)}
                    className="px-3.5 py-2 bg-red-600/10 hover:bg-red-600 border border-red-500/20 text-red-400 hover:text-slate-900 text-xs font-bold rounded-xl transition-all"
                  >
                    {r.notulen ? 'Edit Notulen' : 'Tulis Notulen'}
                  </button>
                </div>
              ))}
              {rapatList.length === 0 && (
                <p className="text-xs text-slate-500 italic text-center py-6">Belum ada rapat terdaftar.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Danger Zone for Ketua Panitia */}
      {currentUser?.jabatan === 'Ketua Panitia' && (
        <div className="bg-red-950/15 border border-red-900/30 rounded-2xl p-6 space-y-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-red-400 flex items-center gap-2">
              <ShieldAlert className="h-4.5 w-4.5 text-red-500" />
              <span>Zona Bahaya (Ketua Panitia)</span>
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Menu ini bersifat destruktif. Menghapus seluruh data dinamis di database (Warga, Pengeluaran, Sponsor, Rapat, Rundown, RAB, Audit Log, dan Akun Panitia lainnya) dan mereset panitia menjadi hanya menyisakan Anda (Ketua Panitia) sebagai super admin.
            </p>
          </div>
          <button
            onClick={handleResetDatabase}
            disabled={resetting}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-600 text-slate-900 text-xs font-bold rounded-xl transition-all shadow-md disabled:opacity-50"
          >
            {resetting ? 'Sedang Mereset...' : 'Reset Seluruh Database'}
          </button>
        </div>
      )}
    </div>
  );
}

