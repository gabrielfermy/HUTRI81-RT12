'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, Users, DollarSign, Flag, Award, Clock, FileText, CheckCircle2, AlertCircle, Heart, ArrowUpRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Static Fallback Data
const fallbackPanitia = [
  { nama: 'Gabriel Fermy Aswinta', seksi: 'Inti', jabatan: 'Ketua Panitia' },
  { nama: 'Mas Ikhsan', seksi: 'Inti', jabatan: 'Sekretaris' },
  { nama: 'Pak Tri', seksi: 'Inti', jabatan: 'Bendahara' }
];

const fallbackRundown = [
  { tanggal: '2026-08-09', jam_mulai: '06:00', jam_selesai: '07:30', kegiatan: 'Senam Kemerdekaan', keterangan: 'Senam pagi gembira bersama instruktur profesional.' },
  { tanggal: '2026-08-09', jam_mulai: '07:30', jam_selesai: '10:30', kegiatan: 'Lomba Rakyat (Sesi 1)', keterangan: 'Lomba paralel kategori anak-anak & dewasa.' },
  { tanggal: '2026-08-16', jam_mulai: '19:30', jam_selesai: '20:00', kegiatan: 'Kirab Kemerdekaan', keterangan: 'Pawai lampion & obor mengelilingi wilayah RT 12.' },
  { tanggal: '2026-08-16', jam_mulai: '20:00', jam_selesai: '20:45', kegiatan: 'Tirakatan & Doa Syukuran', keterangan: 'Doa bersama keselamatan bangsa, pemotongan tumpeng, & soto prasmanan.' }
];

const fallbackRab = [
  { id: '1', kategori: 'Hadiah Lomba', item: 'Hadiah Lomba Anak-anak', kuantitas: 1, satuan: 'Paket', harga_satuan: 1500000 },
  { id: '2', kategori: 'Konsumsi Puncak', item: 'Soto Ayam', kuantitas: 200, satuan: 'Pax', harga_satuan: 12000 }
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
    notulen: '### Hasil Rapat Perdana HUT RI 81\n1. **Ketua Panitia terpilih**: Gabriel Fermy Aswinta.\n2. **Tema Acara**: "Guyub Rukun Membangun Negeri".\n3. **Anggaran**: Target Rp 12.000.000, kas awal RT Rp 2.000.000.'
  }
];

export default function PublicPortal() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [loading, setLoading] = useState(true);

  // Database Data States
  const [panitiaList, setPanitiaList] = useState<any[]>([]);
  const [rundownList, setRundownList] = useState<any[]>([]);
  const [rabList, setRabList] = useState<any[]>([]);
  const [wargaList, setWargaList] = useState<any[]>([]);
  const [sponsorList, setSponsorList] = useState<any[]>([]);
  const [rapatList, setRapatList] = useState<any[]>([]);
  const [pengeluaranList, setPengeluaranList] = useState<any[]>([]);

  // Expanded Notulen
  const [expandedRapatId, setExpandedRapatId] = useState<string | null>(null);

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
        if (spData && spData.length > 0) setSponsorList(spData); else setSponsorList(fallbackSponsors);

        const { data: rpData } = await supabase.from('rapat').select('*').order('tanggal', { ascending: false });
        if (rpData && rpData.length > 0) setRapatList(rpData); else setRapatList(fallbackRapat);

        const { data: exData } = await supabase.from('pengeluaran').select('*').order('tanggal_pembelian', { ascending: false });
        if (exData) setPengeluaranList(exData);
      } catch (err) {
        console.error('Offline mode loaded:', err);
        setPanitiaList(fallbackPanitia);
        setRundownList(fallbackRundown);
        setRabList(fallbackRab);
        setSponsorList(fallbackSponsors);
        setRapatList(fallbackRapat);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Financial calculations
  const totalTarget = 12000000;
  const kasRt = 2000000;
  const iuranPerKK = 50000;

  // Iuran collected from database
  const lunasWarga = wargaList.filter((w: any) => w.is_paid);
  const totalIuranPaid = wargaList.length > 0 
    ? lunasWarga.reduce((sum: number, w: any) => sum + Number(w.nominal_iuran), 0)
    : 24 * iuranPerKK; // Fallback mock value

  // Sponsor collected
  const totalSponsorCollected = sponsorList.reduce((sum: number, s: any) => sum + Number(s.nominal || 0), 0);

  const totalCollected = kasRt + totalIuranPaid + totalSponsorCollected;
  const progressPercentage = Math.min(Math.round((totalCollected / totalTarget) * 100), 100);

  // Expenses calculations
  const totalSpent = pengeluaranList.reduce((sum: number, e: any) => sum + Number(e.nominal_riil || 0), 0);

  // Group RAB planned vs actual spent
  const getCategoryStats = () => {
    const categories = Array.from(new Set(rabList.map((r: any) => r.kategori)));
    return categories.map(cat => {
      const planned = rabList.filter((r: any) => r.kategori === cat).reduce((sum: number, r: any) => sum + Number(r.total_idr || r.kuantitas * r.harga_satuan), 0);
      const matchedRabIds = rabList.filter((r: any) => r.kategori === cat).map((r: any) => r.id);
      const actual = pengeluaranList.filter((e: any) => matchedRabIds.includes(e.rab_id)).reduce((sum: number, e: any) => sum + Number(e.nominal_riil), 0);
      return { category: cat, planned, actual };
    });
  };

  const categoryStats = getCategoryStats();

  return (
    <div className="flex-grow flex flex-col justify-start">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 px-4 text-center bg-gradient-to-b from-[#1D3557] via-[#0F172A] to-[#0F172A] border-b border-red-500/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-600/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <div className="inline-flex items-center space-x-2 bg-red-600/10 border border-red-500/30 px-4 py-2 rounded-full text-red-400 text-xs sm:text-sm font-semibold tracking-wider uppercase animate-pulse">
            <Flag className="h-4 w-4" />
            <span>Portal Informasi Warga RT 12 Pelem Kidul</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Pesta Rakyat HUT RI Ke-81
          </h1>
          <p className="text-xl sm:text-3xl font-bold italic text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-400 to-white">
            "Guyub Rukun Membangun Negeri"
          </p>
          <p className="max-w-2xl mx-auto text-slate-400 text-sm sm:text-base leading-relaxed">
            Portal transparansi publik resmi. Memuat jadwal acara teraktual, susunan kepanitiaan, hingga pelaporan kas masuk dan realisasi belanja aktual secara real-time.
          </p>
        </div>
      </section>

      {/* Countdown Timer Section */}
      <section className="-mt-10 px-4 relative z-20">
        <div className="max-w-3xl mx-auto bg-slate-900/90 backdrop-blur-md border border-red-500/30 rounded-2xl shadow-xl shadow-red-600/5 p-6 sm:p-8">
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
              <div key={t.label} className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 sm:p-5">
                <span className="text-2xl sm:text-5xl font-extrabold text-white bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
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

      {/* Main Grid Content */}
      <div className="max-w-7xl mx-auto px-4 py-16 w-full space-y-16">
        
        {/* Section 1: Dashboard Keuangan & Realisasi Belanja */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center justify-center gap-2">
              <DollarSign className="text-red-500" />
              <span>Transparansi Kas & Belanja Warga</span>
            </h2>
            <p className="text-sm text-slate-400">Semua nominal tercatat real-time dari pembukuan Bendahara.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Box 1: Pendanaan Progress */}
            <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-6">
              <div>
                <h3 className="text-base font-bold text-white mb-1">Status Penggalangan Dana</h3>
                <p className="text-xs text-slate-500">Target anggaran ideal Rp {totalTarget.toLocaleString('id-ID')}</p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                    Rp {totalCollected.toLocaleString('id-ID')}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">{progressPercentage}% Terkumpul</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-3 p-0.5 border border-slate-700">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-1000"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 space-y-2">
                <div className="flex justify-between">
                  <span>Kas RT 12:</span>
                  <span className="font-semibold text-white">Rp {kasRt.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Iuran Warga (KK):</span>
                  <span className="font-semibold text-white">Rp {totalIuranPaid.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sponsorship & Donatur:</span>
                  <span className="font-semibold text-white">Rp {totalSponsorCollected.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            {/* Box 2: Realisasi Anggaran (RAB vs Aktual) */}
            <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 lg:col-span-2 space-y-6">
              <div>
                <h3 className="text-base font-bold text-white mb-1">Realisasi Anggaran Per Kategori</h3>
                <p className="text-xs text-slate-500">Perbandingan antara Rencana Belanja (RAB) dengan realisasi pengeluaran riil.</p>
              </div>

              {categoryStats.length > 0 ? (
                <div className="space-y-4">
                  {categoryStats.map((item, index) => {
                    const ratio = item.planned > 0 ? Math.min(Math.round((item.actual / item.planned) * 100), 150) : 0;
                    return (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-300">{item.category}</span>
                          <span className="text-slate-400">
                            <span className="text-white font-bold">Rp {item.actual.toLocaleString('id-ID')}</span>
                            <span> / Rp {item.planned.toLocaleString('id-ID')}</span>
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
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

              <div className="pt-4 border-t border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400">Total Belanja Riil Saat Ini:</span>
                <span className="text-base font-black text-red-400">
                  Rp {totalSpent.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Jadwal Acara & Rundown */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center justify-center gap-2">
              <Calendar className="text-red-500" />
              <span>Jadwal & Rundown Acara</span>
            </h2>
            <p className="text-sm text-slate-400">Rangkaian kegiatan Pesta Rakyat warga RT 12 Pelem Kidul.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rundownList.map((item, index) => (
              <div key={index} className="bg-slate-900/20 border border-slate-800/80 rounded-2xl p-6 space-y-4 hover:border-red-500/20 transition-all duration-300">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-red-400 bg-red-600/10 border border-red-500/20 px-3 py-1 rounded-full uppercase tracking-wider">
                    {new Date(item.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                  </span>
                  <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-semibold bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
                    <Clock className="h-3.5 w-3.5 text-red-500" />
                    <span>{item.jam_mulai} - {item.jam_selesai} WIB</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white transition-colors">{item.kegiatan}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{item.keterangan}</p>
                </div>

                {item.seksi_pj && item.seksi_pj.length > 0 && (
                  <div className="pt-3 border-t border-slate-800/50 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mr-1">Penanggung Jawab:</span>
                    {item.seksi_pj.map((pj: string, i: number) => (
                      <span key={i} className="text-[10px] font-semibold text-slate-300 bg-slate-800/60 border border-slate-700 px-2 py-0.5 rounded-md">
                        {pj}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Notulensi Rapat Panitia */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center justify-center gap-2">
              <FileText className="text-red-500" />
              <span>Notulen Rapat Panitia</span>
            </h2>
            <p className="text-sm text-slate-400">Transparansi jalannya rapat, koordinasi, dan keputusan yang diambil.</p>
          </div>

          <div className="max-w-4xl mx-auto space-y-4">
            {rapatList.map((r, index) => {
              const isExpanded = expandedRapatId === r.id;
              return (
                <div key={index} className="bg-slate-900/30 border border-slate-800 rounded-xl overflow-hidden transition-all duration-300">
                  <div
                    onClick={() => setExpandedRapatId(isExpanded ? null : r.id)}
                    className="p-5 flex justify-between items-center cursor-pointer hover:bg-slate-900/60 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2.5">
                        <span className="text-xs text-slate-400 font-semibold">
                          {new Date(r.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                        <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full font-bold">
                          {r.waktu}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white">{r.agenda}</h3>
                      <p className="text-xs text-slate-500">Tempat: <strong className="text-slate-400">{r.tempat}</strong></p>
                    </div>
                    <span className="text-xs font-bold text-red-400 hover:text-red-300 flex items-center">
                      {isExpanded ? 'Tutup Notulen' : 'Baca Hasil Rapat'}
                      <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="px-5 pb-5 pt-3 border-t border-slate-800/80 bg-slate-950/20 text-slate-300 text-sm leading-relaxed whitespace-pre-line prose prose-invert max-w-none">
                      {r.notulen || 'Notulen rapat belum dimasukkan.'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 4: Sponsor & Donatur */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center justify-center gap-2">
              <Heart className="text-red-500" />
              <span>Sponsor & Donatur Terdaftar</span>
            </h2>
            <p className="text-sm text-slate-400">Apresiasi setinggi-tingginya kepada para pihak yang menyokong kesuksesan acara.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Platinum Card */}
            <div className="bg-[#FFB703]/5 border border-[#FFB703]/30 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-[10px] font-black tracking-widest text-[#FFB703] uppercase bg-[#FFB703]/10 border border-[#FFB703]/30 px-2.5 py-1 rounded-full w-fit block">
                  Platinum Sponsor
                </span>
                <div className="space-y-1">
                  {sponsorList.filter(s => s.tipe === 'Platinum').map((s, i) => (
                    <div key={i} className="text-sm font-bold text-white flex justify-between items-center py-1 border-b border-[#FFB703]/10">
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
                <span className="text-[10px] font-black tracking-widest text-slate-300 uppercase bg-slate-300/10 border border-slate-300/20 px-2.5 py-1 rounded-full w-fit block">
                  Gold Sponsor
                </span>
                <div className="space-y-1">
                  {sponsorList.filter(s => s.tipe === 'Gold').map((s, i) => (
                    <div key={i} className="text-sm font-bold text-white flex justify-between items-center py-1 border-b border-slate-700/50">
                      <span>{s.nama}</span>
                      <span className="text-xs text-slate-300">Rp {Number(s.nominal).toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                  {sponsorList.filter(s => s.tipe === 'Gold').length === 0 && (
                    <p className="text-xs text-slate-500 italic py-2">Belum terisi</p>
                  )}
                </div>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 italic">*Branding Sedang & Ad-Lips MC</span>
            </div>

            {/* Silver Card */}
            <div className="bg-amber-600/5 border border-amber-600/20 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-[10px] font-black tracking-widest text-amber-500 uppercase bg-amber-600/10 border border-amber-600/20 px-2.5 py-1 rounded-full w-fit block">
                  Silver Sponsor
                </span>
                <div className="space-y-1">
                  {sponsorList.filter(s => s.tipe === 'Silver').map((s, i) => (
                    <div key={i} className="text-sm font-bold text-white flex flex-col py-1.5 border-b border-slate-800">
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
                    <div key={i} className="text-sm font-bold text-white flex justify-between items-center py-1 border-b border-emerald-900/30">
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
          </div>
        </section>

        {/* Section 5: Panitia & Warga Payment checklist */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Panitia List */}
          <div className="bg-slate-900/20 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center space-x-2">
              <Users className="text-red-500" />
              <span>Susunan Kepanitiaan RT 12</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {panitiaList.map((p, index) => (
                <div key={index} className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-center">
                  <span className="text-xs font-bold text-red-400">{p.seksi}</span>
                  <span className="text-sm font-bold text-white">{p.nama}</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">{p.jabatan}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Status (Public Read Only Checklist) */}
          <div className="bg-slate-900/20 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 flex flex-col">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                <CheckCircle2 className="text-red-500" />
                <span>Status Iuran Warga (80 KK)</span>
              </h3>
              <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-bold">
                {wargaList.filter((w) => w.is_paid).length} / {wargaList.length > 0 ? wargaList.length : 80} KK Lunas
              </span>
            </div>

            <div className="overflow-y-auto max-h-72 border border-slate-800/60 rounded-xl p-2 bg-slate-950/20 space-y-2">
              {wargaList.map((w) => (
                <div
                  key={w.id}
                  className={`flex items-center justify-between p-3 rounded-lg border text-sm transition-all ${
                    w.is_paid ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-slate-900/20 border-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="font-semibold text-white">{w.nama}</span>
                    <span className="text-xs text-slate-500">({w.blok})</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-slate-400">Rp {Number(w.nominal_iuran).toLocaleString('id-ID')}</span>
                    {w.is_paid ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-slate-700" />
                    )}
                  </div>
                </div>
              ))}
              {wargaList.length === 0 && (
                <p className="text-xs text-slate-500 italic p-4 text-center">Menghubungkan data warga...</p>
              )}
            </div>
            <p className="text-[10px] text-slate-500 italic mt-auto">
              *Pembaruan status pembayaran dilakukan oleh Bendahara melalui panel Akses Panitia secara resmi.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}
