'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Users, DollarSign, Flag, Award, Clock, FileText, CheckCircle2, AlertCircle, Heart, ArrowUpRight, MessageCircle, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PaymentGatewayModal } from './keuangan/PaymentGatewayModal';

// Static Fallback Data
const fallbackPanitia = [
  { nama: 'Gabriel Fermy Aswinta', seksi: 'Inti', jabatan: 'Ketua Panitia', no_wa: '081234567890' },
  { nama: 'Mas Ikhsan', seksi: 'Inti', jabatan: 'Sekretaris' },
  { nama: 'Pak Tri', seksi: 'Inti', jabatan: 'Bendahara' }
];

const fallbackRundown = [
  { tanggal: '2026-08-09', jam_mulai: '06:00', jam_selesai: '07:30', kegiatan: 'Senam Kemerdekaan', keterangan: 'Senam pagi gembira bersama instruktur profesional.', kategori: 'Utama' },
  { tanggal: '2026-08-09', jam_mulai: '07:30', jam_selesai: '08:15', kegiatan: 'Lomba Memasukkan Bola', keterangan: 'Lomba estafet memasukkan bola menggunakan gelas di pinggang.', kategori: 'Lomba Anak' },
  { tanggal: '2026-08-09', jam_mulai: '08:15', jam_selesai: '09:00', kegiatan: 'Lomba Memasukkan Pensil ke Botol', keterangan: 'Lomba ketangkasan memasukkan pensil yang diikat di corong kepala ke dalam botol.', kategori: 'Lomba Anak' },
  { tanggal: '2026-08-09', jam_mulai: '09:00', jam_selesai: '09:45', kegiatan: 'Lomba Makan Kerupuk', keterangan: 'Lomba makan kerupuk gantung klasik tanpa tangan.', kategori: 'Lomba Anak' },
  { tanggal: '2026-08-09', jam_mulai: '09:45', jam_selesai: '10:30', kegiatan: 'Lomba Balap Karung Helm', keterangan: 'Balap karung menggunakan helm pengaman untuk keselamatan.', kategori: 'Lomba Anak' },
  { tanggal: '2026-08-09', jam_mulai: '07:30', jam_selesai: '08:30', kegiatan: 'Lomba Memaku Paku Estafet', keterangan: 'Lomba kelompok memaku paku ke balok kayu secara estafet cepat.', kategori: 'Lomba Dewasa' },
  { tanggal: '2026-08-09', jam_mulai: '08:30', jam_selesai: '09:30', kegiatan: 'Lomba Menarik Kaleng', keterangan: 'Lomba kekuatan fisik & keseimbangan menarik kaleng yang terikat di pinggang.', kategori: 'Lomba Dewasa' },
  { tanggal: '2026-08-09', jam_mulai: '09:30', jam_selesai: '10:30', kegiatan: 'Lomba Tebak Gaya / Logika', keterangan: 'Lomba tebak ekspresi dan kekompakan kelompok.', kategori: 'Lomba Dewasa' },
  { tanggal: '2026-08-15', jam_mulai: '19:30', jam_selesai: '23:00', kegiatan: 'Gotong Royong & Persiapan Panggung', keterangan: 'Pemasangan tenda, panggung utama, sound system, dekorasi bendera & obor.', kategori: 'Utama' },
  { tanggal: '2026-08-16', jam_mulai: '19:00', jam_selesai: '19:45', kegiatan: 'Kirab Kemerdekaan', keterangan: 'Pawai lampion & obor mengelilingi wilayah RT 12.', kategori: 'Utama' },
  { tanggal: '2026-08-16', jam_mulai: '19:45', jam_selesai: '20:30', kegiatan: 'Makan Malam Bersama (Soto)', keterangan: 'Makan malam soto ayam prasmanan dari vendor lokal untuk seluruh warga.', kategori: 'Utama' },
  { tanggal: '2026-08-16', jam_mulai: '20:30', jam_selesai: '22:00', kegiatan: 'Tirakatan & Doa Syukuran', keterangan: 'Doa bersama keselamatan bangsa, pemotongan tumpeng, & sambutan ketua RT.', kategori: 'Utama' },
  { tanggal: '2026-08-16', jam_mulai: '22:00', jam_selesai: '23:30', kegiatan: 'Pentas Seni & Pembagian Hadiah', keterangan: 'Panggung gembira, penampilan warga, dan pembagian piala/hadiah.', kategori: 'Utama' }
];

const fallbackRab = [
  { id: '1', kategori: 'Hadiah Lomba', item: 'Hadiah Lomba Anak-anak', kuantitas: 1, satuan: 'Paket', harga_satuan: 1500000, total_idr: 1500000 },
  { id: '2', kategori: 'Hadiah Lomba', item: 'Hadiah Lomba Bapak-bapak', kuantitas: 1, satuan: 'Paket', harga_satuan: 700000, total_idr: 700000 },
  { id: '3', kategori: 'Hadiah Lomba', item: 'Hadiah Lomba Ibu-ibu', kuantitas: 1, satuan: 'Paket', harga_satuan: 700000, total_idr: 700000 },
  { id: '4', kategori: 'Hadiah Lomba', item: 'Hadiah Lomba Pemuda', kuantitas: 1, satuan: 'Paket', harga_satuan: 600000, total_idr: 600000 },
  { id: '5', kategori: 'Konsumsi Puncak', item: 'Soto Ayam', kuantitas: 200, satuan: 'Pax', harga_satuan: 12000, total_idr: 2400000 },
  { id: '6', kategori: 'Perlengkapan', item: 'Sewa Panggung & Sound', kuantitas: 1, satuan: 'Paket', harga_satuan: 1500000, total_idr: 1500000 },
  { id: '7', kategori: 'Perlengkapan', item: 'Umbul-umbul & Bendera', kuantitas: 10, satuan: 'Set', harga_satuan: 60000, total_idr: 600000 },
  { id: '8', kategori: 'Perlengkapan', item: 'Spanduk Utama', kuantitas: 1, satuan: 'Pcs', harga_satuan: 200000, total_idr: 200000 },
  { id: '9', kategori: 'Perlengkapan', item: 'Sewa Tenda & Kursi', kuantitas: 1, satuan: 'Paket', harga_satuan: 500000, total_idr: 500000 },
  { id: '10', kategori: 'Perlengkapan', item: 'Cat Panggung', kuantitas: 2, satuan: 'Kaleng', harga_satuan: 100000, total_idr: 200000 },
  { id: '11', kategori: 'Gotong Royong', item: 'Konsumsi Gotong Royong 9 Agst', kuantitas: 20, satuan: 'Pax', harga_satuan: 20000, total_idr: 400000 },
  { id: '12', kategori: 'Gotong Royong', item: 'Konsumsi Gotong Royong 15 Agst', kuantitas: 20, satuan: 'Pax', harga_satuan: 20000, total_idr: 400000 },
  { id: '13', kategori: 'Gotong Royong', item: 'Paku & Kabel Tambahan', kuantitas: 1, satuan: 'Set', harga_satuan: 200000, total_idr: 200000 },
  { id: '14', kategori: 'Dana Cadangan', item: 'Biaya Tak Terduga', kuantitas: 1, satuan: 'Lumpsum', harga_satuan: 1900000, total_idr: 1900000 }
];

const fallbackSponsors = [
  { nama: 'Toko Kelontong Bu Sri', tipe: 'Platinum', nominal: 750000, keterangan: 'Dana Segar & Voucher Belanja Lomba' },
  { nama: 'Apotek Sehat Abadi', tipe: 'Gold', nominal: 400000, keterangan: 'Penyediaan Paket P3K Lomba & Spanduk' },
  { nama: 'Susu Segar Pelem', tipe: 'Silver', nominal: 250000, keterangan: 'Donasi Produk Susu untuk Lomba Anak' }
];

const fallbackRapat = [
  {
    id: 'rapat-initial',
    tanggal: '2026-07-05',
    waktu: '19:30 - 21:30',
    tempat: 'Rumah Ketua RT 12',
    agenda: 'Rapat Koordinasi Perdana & Pembentukan Panitia',
    notulen: '### Hasil Rapat Perdana HUT RI 81\n1. **Ketua Panitia terpilih**: Gabriel Fermy Aswinta.\n2. **Tema Acara**: "Satu Hati Untuk Indonesia".\n3. **Anggaran**: Target Rp 12.000.000, kas awal RT Rp 2.000.000.'
  }
];

export default function HomeClient({ initialTab = 'keuangan' }: { initialTab?: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Database Data States
  const [panitiaList, setPanitiaList] = useState<any[]>([]);

  // Build hierarchical groups for committee display
  const panitiaGroups = useMemo(() => {
    const pelindung = panitiaList.filter(p => p.seksi === 'Pelindung' || p.level === 'Pelindung');
    const penasihat = panitiaList.filter(p => p.seksi === 'Penasihat' || p.level === 'Penasihat');
    const inti = panitiaList.filter(p => p.seksi === 'Inti');
    const intiOrder = ['Ketua Panitia', 'Sekretaris', 'Bendahara'];
    inti.sort((a, b) => (intiOrder.indexOf(a.jabatan) === -1 ? 99 : intiOrder.indexOf(a.jabatan)) - (intiOrder.indexOf(b.jabatan) === -1 ? 99 : intiOrder.indexOf(b.jabatan)));

    const harianAll = panitiaList.filter(p => !['Pelindung', 'Penasihat', 'Inti'].includes(p.seksi) && !['Pelindung', 'Penasihat'].includes(p.level));
    const harianSeksiNames = [...new Set(harianAll.map(p => p.seksi))].filter(Boolean);

    const harian = harianSeksiNames.map(seksiNama => {
      const members = harianAll.filter(p => p.seksi === seksiNama);
      const koordinators = members.filter(p => p.level === 'Koordinator');
      return {
        seksiNama,
        koordinators: koordinators.map(koord => ({
          ...koord,
          subKoords: members.filter(p => p.level === 'Sub-Koordinator' && p.parent_id === koord.id).map(sk => ({
            ...sk,
            anggota: members.filter(p => p.level === 'Anggota' && p.parent_id === sk.id)
          })),
          anggota: members.filter(p => p.level === 'Anggota' && p.parent_id === koord.id)
        }))
      };
    });

    return { pelindung, penasihat, inti, harian };
  }, [panitiaList]);

  // Legacy flat sorted list for fallback/other uses
  const sortedPanitiaList = useMemo(() => {
    return [...panitiaList].sort((a, b) => a.nama?.localeCompare(b.nama || '') || 0);
  }, [panitiaList]);

  const [rabList, setRabList] = useState<any[]>([]);
  const [rundownList, setRundownList] = useState<any[]>([]);
  const [wargaList, setWargaList] = useState<any[]>([]);
  const [sponsorList, setSponsorList] = useState<any[]>([]);
  const [rapatList, setRapatList] = useState<any[]>([]);
  const [pengeluaranList, setPengeluaranList] = useState<any[]>([]);
  const [kehadiranList, setKehadiranList] = useState<any[]>([]);

  // Public warga checklist states
  const [wargaSearchQuery, setWargaSearchQuery] = useState('');
  const [wargaFilterBlok, setWargaFilterBlok] = useState('ALL');
  const [wargaFilterStatus, setWargaFilterStatus] = useState('ALL');

  const filteredWargaPublic = useMemo(() => {
    return wargaList.filter((w) => {
      const matchesSearch = w.nama.toLowerCase().includes(wargaSearchQuery.toLowerCase()) || 
                            w.blok.toLowerCase().includes(wargaSearchQuery.toLowerCase());
      
      const matchesBlok = wargaFilterBlok === 'ALL' || w.blok === wargaFilterBlok;
      
      const matchesStatus = wargaFilterStatus === 'ALL' || 
                            (wargaFilterStatus === 'LUNAS' && w.is_paid) || 
                            (wargaFilterStatus === 'BELUM' && !w.is_paid);

      return matchesSearch && matchesBlok && matchesStatus;
    });
  }, [wargaList, wargaSearchQuery, wargaFilterBlok, wargaFilterStatus]);

  // Expanded Notulen
  const [expandedRapatId, setExpandedRapatId] = useState<string | null>(null);

  // Selected Rundown Date Tab
  const [selectedRundownDate, setSelectedRundownDate] = useState<string>('');

  // Tab Navigation State
  const [activeTab, setActiveTab] = useState<'keuangan' | 'jadwal' | 'panitia' | 'notulen'>(initialTab as any);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Countdown timer logic to August 9, 2026
  useEffect(() => {
    const targetDate = new Date('2026-08-09T06:00:00+07:00').getTime();
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch all database records
  useEffect(() => {
    async function loadData() {
      try {
        const { data: pData } = await supabase.from('panitia').select('*').order('created_at', { ascending: true });
        if (pData && pData.length > 0) setPanitiaList(pData); else setPanitiaList(fallbackPanitia);

        const { data: rData } = await supabase.from('rundown').select('*').order('tanggal', { ascending: true }).order('jam_mulai', { ascending: true });
        if (rData && rData.length > 0) setRundownList(rData); else setRundownList(fallbackRundown);

        const { data: rabData } = await supabase.from('rab').select('*').order('kategori', { ascending: true });
        if (rabData && rabData.length > 0) setRabList(rabData); else setRabList(fallbackRab);

        const { data: wargaData } = await supabase.from('warga').select('*').order('nama', { ascending: true });
        if (wargaData && wargaData.length > 0) setWargaList(wargaData);

        const { data: spData } = await supabase.from('sponsorship').select('*').order('nominal', { ascending: false });
        if (spData) setSponsorList(spData);

        const { data: rpData } = await supabase.from('rapat').select('*').order('tanggal', { ascending: true });
        if (rpData && rpData.length > 0) setRapatList(rpData); else setRapatList(fallbackRapat);

        const { data: exData } = await supabase.from('pengeluaran').select('*').order('tanggal_pembelian', { ascending: false });
        if (exData) setPengeluaranList(exData);

        const { data: kehadiranData } = await supabase.from('kehadiran_rapat').select('*');
        if (kehadiranData) setKehadiranList(kehadiranData);
      } catch (err) {
        console.error('Offline mode loaded:', err);
        setPanitiaList(fallbackPanitia);
        setRundownList(fallbackRundown);
        setRabList(fallbackRab);
        setSponsorList([]);
        setRapatList(fallbackRapat);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    // Subscribe to realtime database changes
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Financial calculations
  const totalTarget = rabList.reduce((sum: number, r: any) => sum + Number(r.total_idr || r.kuantitas * r.harga_satuan), 0) || 12000000;
  
  // Hardcoded or settings-based Kas RT (Setting to 0 per user request)
  const kasRt = 0;
  
  // Iuran collected from database
  const lunasWarga = wargaList.filter((w: any) => w.is_paid);
  const totalIuranPaid = lunasWarga.reduce((sum: number, w: any) => sum + Number(w.nominal_iuran), 0);

  // Sponsor collected
  const totalSponsorCollected = sponsorList.reduce((sum: number, s: any) => sum + Number(s.nominal || 0), 0);

  const totalCollected = kasRt + totalIuranPaid + totalSponsorCollected;
  const progressPercentage = totalTarget > 0 ? Math.min(Math.round((totalCollected / totalTarget) * 100), 100) : 0;

  // Expenses calculations
  const totalSpent = pengeluaranList.reduce((sum: number, e: any) => sum + Number(e.nominal_riil || 0), 0);

  // Group RAB planned vs actual spent
  const getCategoryStats = () => {
    const categories = Array.from(new Set(rabList.map((r: any) => r.kategori)));
    return categories.map(cat => {
      const planned = rabList.filter((r: any) => r.kategori === cat).reduce((sum: number, r: any) => sum + Number(r.total_idr || r.kuantitas * r.harga_satuan), 0);
      const matchedRabIds = rabList.filter((r: any) => r.kategori === cat).map((r: any) => r.id);
      const actual = pengeluaranList
        .filter((e: any) => {
          if (e.rab_id) {
            return matchedRabIds.includes(e.rab_id);
          }
          if (e.seksi_pj) {
            if (cat.toLowerCase().includes(e.seksi_pj.toLowerCase())) {
              return true;
            }
            if (e.seksi_pj === 'Inti' && cat === 'Operasional Umum (Kestari)') {
              return true;
            }
            if (e.seksi_pj === 'Humas & Dana' && cat === 'Dana Cadangan & Lainnya') {
              return true;
            }
          }
          return false;
        })
        .reduce((sum: number, e: any) => sum + Number(e.nominal_riil || 0), 0);
      return { category: cat, planned, actual };
    });
  };

  const categoryStats = getCategoryStats();

  // Unique dates from rundown
  const uniqueRundownDates = Array.from(new Set(rundownList.map((r: any) => r.tanggal))).sort();
  const activeRundownDate = selectedRundownDate || (uniqueRundownDates.length > 0 ? uniqueRundownDates[0] : '');
  const filteredRundownList = rundownList.filter((r: any) => r.tanggal === activeRundownDate);

  return (
    <div className="flex-grow flex flex-col justify-start">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 px-4 text-center bg-gradient-to-b from-[#450A0A] via-[#070A13] to-[#070A13] border-b border-red-500/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-600/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <div className="inline-flex items-center space-x-2 bg-red-600/10 border border-red-500/30 px-4 py-2 rounded-full text-red-400 text-xs sm:text-sm font-semibold tracking-wider uppercase animate-pulse">
            <Flag className="h-4 w-4" />
            <span>Portal Informasi Warga RT 12 Pelem Kidul</span>
          </div>

          <img src="/logo.png" alt="Logo HUT RI 81" className="h-32 sm:h-40 w-auto mx-auto drop-shadow-2xl object-contain animate-fade-in" />
          
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-white tracking-tight drop-shadow-lg">
            Pesta Rakyat <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600">HUT RI 81</span>
          </h1>
          <p className="text-xl sm:text-3xl font-bold italic text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-400 to-white">
            "Satu Hati Untuk Indonesia"
          </p>
          <p className="max-w-2xl mx-auto text-slate-300 text-sm sm:text-base leading-relaxed">
            Portal transparansi publik resmi. Memuat jadwal acara teraktual, susunan kepanitiaan, hingga pelaporan kas masuk dan realisasi belanja aktual secara real-time.
          </p>
        </div>
      </section>

      {/* Countdown Timer Section */}
      <section className="-mt-10 px-4 relative z-20">
        <div className="max-w-3xl mx-auto bg-slate-100/90 backdrop-blur-md border border-red-500/30 rounded-2xl shadow-xl shadow-red-600/5 p-6 sm:p-8">
          <div className="flex items-center justify-center space-x-2 text-red-400 font-semibold mb-6">
            <Clock className="h-5 w-5 animate-spin-slow" />
            <span className="tracking-widest uppercase text-xs sm:text-sm">Menuju Kegiatan Sesi 1 (9 Agustus 2026)</span>
          </div>
          <div className="grid grid-cols-4 gap-4 text-center">
            {[
              { label: 'Hari', value: timeLeft.days },
              { label: 'Jam', value: timeLeft.hours },
              { label: 'Menit', value: timeLeft.minutes },
              { label: 'Detik', value: timeLeft.seconds },
            ].map((t) => (
              <div key={t.label} className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-5">
                <span className="text-2xl sm:text-5xl font-extrabold text-slate-900 bg-gradient-to-b from-slate-800 to-slate-500 bg-clip-text text-transparent">
                  {String(t.value).padStart(2, '0')}
                </span>
                <span className="text-[9px] sm:text-xs font-semibold text-slate-500 uppercase tracking-widest block mt-2">
                  {t.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <div className="max-w-5xl mx-auto px-4 mt-8 w-full z-20 relative">
        <div className="flex justify-start sm:justify-center overflow-x-auto pb-4 space-x-2 sm:space-x-4 scrollbar-hide">
          <button onClick={() => { setActiveTab('keuangan'); router.push('/keuangan-donasi', { scroll: false }); }} className={`flex items-center space-x-2 px-5 py-3 rounded-full font-bold whitespace-nowrap transition-all ${activeTab === 'keuangan' ? 'bg-red-600 text-slate-900 shadow-lg shadow-red-600/20' : 'bg-white text-slate-600 border border-slate-200 shadow-sm hover:bg-slate-50 hover:text-slate-900'}`}>
            <DollarSign className="h-4.5 w-4.5" />
            <span>Keuangan & Donasi</span>
          </button>
          <button onClick={() => { setActiveTab('jadwal'); router.push('/jadwal-acara', { scroll: false }); }} className={`flex items-center space-x-2 px-5 py-3 rounded-full font-bold whitespace-nowrap transition-all ${activeTab === 'jadwal' ? 'bg-red-600 text-slate-900 shadow-lg shadow-red-600/20' : 'bg-white text-slate-600 border border-slate-200 shadow-sm hover:bg-slate-50 hover:text-slate-900'}`}>
            <Calendar className="h-4.5 w-4.5" />
            <span>Jadwal Acara</span>
          </button>
          <button onClick={() => { setActiveTab('panitia'); router.push('/susunan-panitia', { scroll: false }); }} className={`flex items-center space-x-2 px-5 py-3 rounded-full font-bold whitespace-nowrap transition-all ${activeTab === 'panitia' ? 'bg-red-600 text-slate-900 shadow-lg shadow-red-600/20' : 'bg-white text-slate-600 border border-slate-200 shadow-sm hover:bg-slate-50 hover:text-slate-900'}`}>
            <Users className="h-4.5 w-4.5" />
            <span>Susunan Panitia</span>
          </button>
          <button onClick={() => { setActiveTab('notulen'); router.push('/jadwal-rapat', { scroll: false }); }} className={`flex items-center space-x-2 px-5 py-3 rounded-full font-bold whitespace-nowrap transition-all ${activeTab === 'notulen' ? 'bg-red-600 text-slate-900 shadow-lg shadow-red-600/20' : 'bg-white text-slate-600 border border-slate-200 shadow-sm hover:bg-slate-50 hover:text-slate-900'}`}>
            <FileText className="h-4.5 w-4.5" />
            <span>Jadwal Rapat</span>
          </button>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 w-full space-y-12">
        
        {/* TAB: KEUANGAN & DONASI */}
        {activeTab === 'keuangan' && (
          <div className="space-y-12 animate-fadeIn">
            {/* Section 1: Dashboard Keuangan & Realisasi Belanja */}
            <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center justify-center gap-2">
              <DollarSign className="text-red-500" />
              <span>Transparansi Kas & Belanja Warga</span>
            </h2>
            <p className="text-sm text-slate-500">Semua nominal tercatat real-time dari pembukuan Bendahara.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Box 1: Pendanaan Progress */}
            <div className="bg-slate-100/30 border border-slate-200 rounded-2xl p-6 flex flex-col justify-between space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1">Status Penggalangan Dana</h3>
                <p className="text-xs text-slate-500">Target anggaran ideal Rp {totalTarget.toLocaleString('id-ID')}</p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                    Rp {totalCollected.toLocaleString('id-ID')}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">{progressPercentage}% Terkumpul</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 p-0.5 border border-slate-300">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-1000"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 text-xs text-slate-500 space-y-2">
                <div className="flex justify-between">
                  <span>Kas RT 12:</span>
                  <span className="font-semibold text-slate-900">Rp {kasRt.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Iuran Warga (KK):</span>
                  <span className="font-semibold text-slate-900">Rp {totalIuranPaid.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sponsorship & Donatur:</span>
                  <span className="font-semibold text-slate-900">Rp {totalSponsorCollected.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between border-t border-dashed border-slate-200 pt-2 font-medium">
                  <span>Sisa Kebutuhan Dana:</span>
                  <span className={`font-bold ${totalTarget - totalCollected > 0 ? 'text-[#D97706]' : 'text-emerald-600'}`}>
                    {totalTarget - totalCollected > 0 ? `Rp ${(totalTarget - totalCollected).toLocaleString('id-ID')}` : 'Terpenuhi'}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button 
                  onClick={() => setShowPaymentModal(true)}
                  className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <DollarSign className="h-4 w-4" />
                  <span>Bayar Iuran / Donasi Online</span>
                </button>
              </div>
            </div>

            {/* Box 2: Realisasi Anggaran (RAB vs Aktual) */}
            <div className="bg-slate-100/30 border border-slate-200 rounded-2xl p-6 lg:col-span-2 space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1">Realisasi Anggaran Per Kategori</h3>
                <p className="text-xs text-slate-500">Perbandingan antara Rencana Belanja (RAB) dengan realisasi pengeluaran riil.</p>
              </div>

              {categoryStats.length > 0 ? (
                <div className="space-y-4">
                  {categoryStats.map((item, index) => {
                    const ratio = item.planned > 0 ? Math.min(Math.round((item.actual / item.planned) * 100), 150) : 0;
                    return (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-600">{item.category}</span>
                          <span className="text-slate-500">
                            <span className="text-slate-900 font-bold">Rp {item.actual.toLocaleString('id-ID')}</span>
                            <span> / Rp {item.planned.toLocaleString('id-ID')}</span>
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${ratio > 100 ? 'bg-red-500' : 'bg-red-600'}`}
                            style={{ width: `${Math.min(ratio, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">Belum ada item anggaran tercatat.</p>
              )}

              <div className="pt-4 border-t border-slate-200 flex justify-between items-center text-xs">
                <span className="text-slate-500">Total Belanja Riil Saat Ini:</span>
                <span className="text-base font-black">
                  <span className="text-red-600">Rp {totalSpent.toLocaleString('id-ID')}</span>
                  <span className="text-slate-400 font-semibold text-xs ml-1">/ Rp {totalTarget.toLocaleString('id-ID')} (RAB)</span>
                </span>
              </div>
            </div>
          </div>
        </section>
          </div>
        )}

        {/* TAB: JADWAL */}
        {activeTab === 'jadwal' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Section 2: Jadwal Acara & Rundown */}
            <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center justify-center gap-2">
              <Calendar className="text-red-500" />
              <span>Jadwal & Rundown Acara</span>
            </h2>
            <p className="text-sm text-slate-500">Rangkaian kegiatan Pesta Rakyat warga RT 12 Pelem Kidul.</p>
          </div>

          {/* Date Tabs selector */}
          {uniqueRundownDates.length > 1 && (
            <div className="flex justify-center border-b border-slate-200 space-x-2 overflow-x-auto pb-px">
              {uniqueRundownDates.map((dateStr) => {
                const isActive = dateStr === activeRundownDate;
                const formattedDate = new Date(dateStr).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'short',
                });
                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedRundownDate(dateStr)}
                    className={`px-5 py-3 text-xs sm:text-sm font-bold whitespace-nowrap rounded-t-xl transition-all border-b-2 ${
                      isActive
                        ? 'border-red-500 text-red-400 bg-slate-100/40'
                        : 'border-transparent text-slate-450 hover:text-slate-700'
                    }`}
                  >
                    {formattedDate}
                  </button>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
            {filteredRundownList.map((item, index) => (
              <div key={index} className="bg-white border border-slate-200 shadow-sm/80 rounded-2xl p-6 space-y-4 hover:border-red-500/20 transition-all duration-300">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-red-400 bg-red-600/10 border border-red-500/20 px-3 py-1 rounded-full uppercase tracking-wider">
                    {new Date(item.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                  </span>
                  <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-semibold bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
                    <Clock className="h-3.5 w-3.5 text-red-500" />
                    <span>{item.jam_mulai} - {item.jam_selesai} WIB</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-900 transition-colors">{item.kegiatan}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{item.keterangan}</p>
                </div>

                {item.seksi_pj && item.seksi_pj.length > 0 && (
                  <div className="pt-3 border-t border-slate-200/50 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mr-1">Penanggung Jawab:</span>
                    {item.seksi_pj.map((pj: string, i: number) => (
                      <span key={i} className="text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded-md">
                        {pj}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {filteredRundownList.length === 0 && (
              <p className="text-xs text-slate-500 italic text-center py-6 col-span-2">Tidak ada kegiatan di tanggal ini.</p>
            )}
          </div>
        </section>
          </div>
        )}

        {/* TAB: NOTULEN */}
        {activeTab === 'notulen' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Section 3: Notulensi Rapat Panitia */}
            <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center justify-center gap-2">
              <FileText className="text-red-500" />
              <span>Jadwal Rapat Panitia</span>
            </h2>
            <p className="text-sm text-slate-500">Jadwal rapat/kegiatan panitia. Hasil/notulen rapat dapat dilihat jika kegiatan telah terlaksana.</p>
          </div>

          <div className="max-w-4xl mx-auto space-y-4">
            {rapatList.map((r, index) => {
              const isExpanded = expandedRapatId === r.id;
              return (
                <div key={index} className="bg-slate-100/30 border border-slate-200 rounded-xl overflow-hidden transition-all duration-300">
                  <div
                    onClick={() => setExpandedRapatId(isExpanded ? null : r.id)}
                    className="p-5 flex justify-between items-center cursor-pointer hover:bg-slate-100/60 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2.5">
                        <span className="text-xs text-slate-500 font-semibold">
                          {new Date(r.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                        <span className="text-[10px] bg-slate-200 text-slate-600 border border-slate-300 px-2 py-0.5 rounded-full font-bold">
                          {r.waktu}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900">{r.agenda}</h3>
                      <p className="text-xs text-slate-500">Tempat: <strong className="text-slate-500">{r.tempat}</strong></p>
                    </div>
                    <span className="text-xs font-bold text-red-400 hover:text-red-300 flex items-center">
                      {isExpanded ? 'Tutup Detail' : 'Lihat Detail / Notulen'}
                      <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="px-5 pb-5 pt-3 border-t border-slate-200/80 bg-white shadow-sm/20">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center">
                            <FileText className="h-4 w-4 mr-1.5 text-slate-400" />
                            Rencana Agenda
                          </h4>
                          <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-line prose max-w-none">
                            {r.rincian_agenda || 'Rincian agenda belum dimasukkan.'}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center">
                            <FileText className="h-4 w-4 mr-1.5 text-slate-400" />
                            Notulen Rapat
                          </h4>
                          <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-line prose max-w-none">
                            {r.notulen || 'Notulen rapat belum dimasukkan.'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t border-slate-100 pt-4">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-sm font-bold text-slate-900 flex items-center">
                            <Users className="h-4 w-4 mr-1.5 text-slate-400" />
                            Daftar Hadir
                          </h4>
                          <Link 
                            href={`/jadwal-rapat/${r.id}/absensi`}
                            className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center"
                          >
                            Isi Daftar Hadir
                            <ArrowUpRight className="h-3 w-3 ml-1" />
                          </Link>
                        </div>
                        
                        {(() => {
                          const hadirIds = kehadiranList.filter(k => k.rapat_id === r.id).map(k => k.panitia_id);
                          const hadirPanitia = panitiaList.filter(p => hadirIds.includes(p.id));
                          
                          if (hadirPanitia.length === 0) {
                            return <p className="text-xs text-slate-500 italic">Belum ada panitia yang mengisi daftar hadir.</p>;
                          }
                          
                          return (
                            <div className="flex flex-wrap gap-2">
                              {hadirPanitia.map((p, idx) => (
                                <span key={idx} className="inline-flex items-center text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-md">
                                  <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-500" />
                                  {p.nama}
                                </span>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
          </div>
        )}

        {/* TAB: KEUANGAN (Lanjutan Sponsor) */}
        {activeTab === 'keuangan' && (
          <div className="space-y-12 animate-fadeIn">
            {/* Section 4: Sponsor & Donatur */}
            <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center justify-center gap-2">
              <Heart className="text-red-500" />
              <span>Sponsor & Donatur Terdaftar</span>
            </h2>
            <p className="text-sm text-slate-500">Apresiasi setinggi-tingginya kepada para pihak yang menyokong kesuksesan acara.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {sponsorList.length === 0 ? (
              <div className="col-span-1 sm:col-span-2 lg:col-span-4 py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                <Heart className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Belum ada sponsor / donatur</p>
                <p className="text-xs text-slate-400 mt-1">Jadilah yang pertama untuk berkontribusi!</p>
              </div>
            ) : (
              <>
                {/* Platinum Card */}
                <div className="bg-[#FFB703]/5 border border-[#FFB703]/30 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black tracking-widest text-[#FFB703] uppercase bg-[#FFB703]/10 border border-[#FFB703]/30 px-2.5 py-1 rounded-full w-fit block">
                      Platinum Sponsor
                    </span>
                    <div className="space-y-1">
                      {sponsorList.filter(s => s.tipe === 'Platinum').map((s, i) => (
                        <div key={i} className="text-sm font-bold text-slate-900 flex justify-between items-center py-1 border-b border-[#FFB703]/10">
                          <span>{s.nama}</span>
                          <span className="text-xs text-[#FFB703]">Rp {Number(s.nominal).toLocaleString('id-ID')}</span>
                        </div>
                      ))}
                      {sponsorList.filter(s => s.tipe === 'Platinum').length === 0 && (
                        <p className="text-xs text-slate-500 italic py-2">Belum terisi</p>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-[#FFB703]/80 italic">*Branding Logo Utama & Ad-Lips MC</span>
                </div>

                {/* Gold Card */}
                <div className="bg-slate-300/5 border border-slate-400/20 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black tracking-widest text-slate-600 uppercase bg-slate-300/10 border border-slate-300/20 px-2.5 py-1 rounded-full w-fit block">
                      Gold Sponsor
                    </span>
                    <div className="space-y-1">
                      {sponsorList.filter(s => s.tipe === 'Gold').map((s, i) => (
                        <div key={i} className="text-sm font-bold text-slate-900 flex justify-between items-center py-1 border-b border-slate-300/50">
                          <span>{s.nama}</span>
                          <span className="text-xs text-slate-600">Rp {Number(s.nominal).toLocaleString('id-ID')}</span>
                        </div>
                      ))}
                      {sponsorList.filter(s => s.tipe === 'Gold').length === 0 && (
                        <p className="text-xs text-slate-500 italic py-2">Belum terisi</p>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 italic">*Branding Sedang & Ad-Lips MC</span>
                </div>

                {/* Silver Card */}
                <div className="bg-amber-600/5 border border-amber-600/20 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black tracking-widest text-amber-500 uppercase bg-amber-600/10 border border-amber-600/20 px-2.5 py-1 rounded-full w-fit block">
                      Silver Sponsor
                    </span>
                    <div className="space-y-1">
                      {sponsorList.filter(s => s.tipe === 'Silver').map((s, i) => (
                        <div key={i} className="text-sm font-bold text-slate-900 flex flex-col py-1.5 border-b border-slate-200">
                          <div className="flex justify-between items-center">
                            <span>{s.nama}</span>
                            {Number(s.nominal) > 0 && <span className="text-xs text-amber-500">Rp {Number(s.nominal).toLocaleString('id-ID')}</span>}
                          </div>
                          {s.keterangan && <span className="text-[10px] text-slate-500 mt-0.5">{s.keterangan}</span>}
                        </div>
                      ))}
                      {sponsorList.filter(s => s.tipe === 'Silver').length === 0 && (
                        <p className="text-xs text-slate-500 italic py-2">Belum terisi</p>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-amber-600/80 italic">*Apresiasi Laporan Pertanggungjawaban</span>
                </div>

                {/* Donatur Warga Card */}
                <div className="bg-emerald-600/5 border border-emerald-600/20 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase bg-emerald-600/10 border border-emerald-600/20 px-2.5 py-1 rounded-full w-fit block">
                      Donatur Sukarela Warga
                    </span>
                    <div className="space-y-1">
                      {sponsorList.filter(s => s.tipe === 'Donatur Warga').map((s, i) => (
                        <div key={i} className="text-sm font-bold text-slate-900 flex justify-between items-center py-1 border-b border-emerald-900/30">
                          <span>{s.nama}</span>
                          <span className="text-xs text-emerald-400">Rp {Number(s.nominal).toLocaleString('id-ID')}</span>
                        </div>
                      ))}
                      {sponsorList.filter(s => s.tipe === 'Donatur Warga').length === 0 && (
                        <p className="text-xs text-slate-500 italic py-2">Belum terisi</p>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-400/80 italic">*Donasi Sukarela Warga Gotong Royong</span>
                </div>
              </>
            )}
          </div>
        </section>
          </div>
        )}

        {/* TAB: PANITIA */}
        {activeTab === 'panitia' && (
          <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto w-full">
            {/* Panitia List - Hierarchical */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 sm:p-8 space-y-6">
            <h3 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
              <Users className="text-red-500" />
              <span>Susunan Kepanitiaan RT 12</span>
            </h3>

            <div className="space-y-4 text-sm">

              {/* Pelindung */}
              {panitiaGroups.pelindung.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-purple-400">Pelindung / Pembina</p>
                  {panitiaGroups.pelindung.map((p, i) => (
                    <div key={i} className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
                      <span className="font-bold text-slate-900 flex items-center">
                        {p.nama}
                      </span>
                      <span className="text-xs text-purple-400">{p.jabatan !== 'Pelindung' ? p.jabatan : ''}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Penasihat */}
              {panitiaGroups.penasihat.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Penasihat</p>
                  {panitiaGroups.penasihat.map((p, i) => (
                    <div key={i} className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
                      <span className="font-bold text-slate-900 flex items-center">
                        {p.nama}
                      </span>
                      <span className="text-xs text-blue-400">{p.jabatan !== 'Penasihat' ? p.jabatan : ''}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Panitia Inti */}
              {panitiaGroups.inti.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-400">Panitia Inti</p>
                  {panitiaGroups.inti.map((p, i) => (
                    <div key={i} className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
                      <div>
                        <span className="font-bold text-slate-900 flex items-center">
                          {p.nama}
                        </span>
                      </div>
                      <span className="text-xs text-red-400 font-semibold">{p.jabatan}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Panitia Harian */}
              {panitiaGroups.harian.length > 0 && (
                <div className="space-y-4 pt-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Panitia Harian</p>
                  {panitiaGroups.harian.map((seksi, si) => (
                    <div key={si} className="space-y-2">
                      <p className="text-xs font-black text-amber-400 uppercase tracking-wide">Seksi {seksi.seksiNama}</p>
                      {seksi.koordinators.map((koord, ki) => (
                        <div key={ki} className="space-y-1.5 pl-2">
                          {/* Koordinator */}
                          <div className="flex justify-between items-center py-1.5 border-b border-amber-900/30">
                            <span className="font-bold text-slate-900 flex items-center">
                              {koord.nama}
                            </span>
                            <span className="text-xs text-amber-400 font-semibold">{koord.jabatan || 'Koordinator'}</span>
                          </div>
                          {/* Sub-Koordinators */}
                          {koord.subKoords?.map((sk: any, ski: number) => (
                            <div key={ski} className="pl-4 space-y-1">
                              <div className="flex justify-between items-center py-1 border-b border-emerald-900/30">
                                <span className="font-semibold text-slate-900 opacity-90 text-xs flex items-center">
                                  └ {sk.nama}
                                </span>
                                <span className="text-[10px] text-emerald-400 font-semibold">{sk.jabatan || 'Sub-Koordinator'}</span>
                              </div>
                              {sk.anggota?.map((a: any, ai: number) => (
                                <div key={ai} className="pl-4 flex justify-between items-center py-0.5">
                                  <span className="text-xs text-slate-900 opacity-80 flex items-center">
                                    └ {a.nama}
                                  </span>
                                  <span className="text-[10px] text-slate-500">Anggota</span>
                                </div>
                              ))}
                            </div>
                          ))}
                          {/* Direct Anggota (no sub-koord) */}
                          {koord.anggota?.map((a: any, ai: number) => (
                            <div key={ai} className="pl-4 flex justify-between items-center py-0.5">
                              <span className="text-xs text-slate-900 opacity-80 flex items-center">
                                └ {a.nama}
                              </span>
                              <span className="text-[10px] text-slate-500">Anggota</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {panitiaList.length === 0 && (
                <p className="text-xs text-slate-500 italic py-4 text-center">Memuat data kepanitiaan...</p>
              )}
            </div>
          </div>
        </div>
        )}

        {/* TAB: KEUANGAN (Lanjutan Status Iuran) */}
        {activeTab === 'keuangan' && (
          <div className="space-y-12 animate-fadeIn max-w-3xl mx-auto w-full">
            {/* Payment Status (Public Read Only Checklist) */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 sm:p-8 space-y-6 flex flex-col h-[500px]">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                <CheckCircle2 className="text-red-500" />
                <span>Status Iuran Warga (80 KK)</span>
              </h3>
              <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-bold">
                {wargaList.filter((w) => w.is_paid).length} / {wargaList.length > 0 ? wargaList.length : 80} KK Lunas
              </span>
            </div>

            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-grow">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="h-3.5 w-3.5" />
                </span>
                <input
                  type="text"
                  placeholder="Cari nama atau kelompok dawis..."
                  value={wargaSearchQuery}
                  onChange={(e) => setWargaSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={wargaFilterBlok}
                  onChange={(e) => setWargaFilterBlok(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-red-500"
                >
                  <option value="ALL">Semua Dawis</option>
                  <option value="Rosella">Rosella</option>
                  <option value="Tulip">Tulip</option>
                  <option value="Melati">Melati</option>
                </select>

                <select
                  value={wargaFilterStatus}
                  onChange={(e) => setWargaFilterStatus(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-red-500"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="LUNAS">Lunas</option>
                  <option value="BELUM">Belum Lunas</option>
                </select>
              </div>
            </div>

            <div className="overflow-y-auto flex-grow border border-slate-200/60 rounded-xl p-2 bg-white shadow-sm/20 space-y-2">
              {filteredWargaPublic.map((w) => (
                <div
                  key={w.id}
                  className={`flex items-center justify-between p-3 rounded-lg border text-sm transition-all ${
                    w.is_paid ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="font-semibold text-slate-900">{w.nama}</span>
                    <span className="text-xs text-slate-500">({w.blok})</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs font-bold ${w.is_paid ? 'text-emerald-500' : 'text-slate-500'}`}>
                      {w.is_paid ? 'LUNAS' : 'BELUM LUNAS'}
                    </span>
                    {w.is_paid ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-slate-700" />
                    )}
                  </div>
                </div>
              ))}
              {filteredWargaPublic.length === 0 && wargaList.length > 0 && (
                <p className="text-xs text-slate-500 italic p-4 text-center">Tidak ada warga terdaftar yang sesuai filter.</p>
              )}
              {wargaList.length === 0 && (
                <p className="text-xs text-slate-500 italic p-4 text-center">Menghubungkan data warga...</p>
              )}
            </div>
            <p className="text-[10px] text-slate-500 italic mt-auto">
              *Pembaruan status pembayaran dilakukan oleh Bendahara melalui panel Akses Panitia secara resmi.
            </p>
            </div>
          </div>
        )}
      </div>
      {showPaymentModal && <PaymentGatewayModal onClose={() => setShowPaymentModal(false)} wargaList={wargaList} />}
    </div>
  );
}



