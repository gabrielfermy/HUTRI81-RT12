'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, Users, DollarSign, ArrowRight, Flag, Award, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Mock stats matching our proposal/brainstorming docs
const fallbackStats = {
  totalTarget: 12000000,
  collected: 6000000, // 2jt Kas RT + 4jt Iuran Warga (approx or seed)
  committeeCount: 10,
  residentsCount: 80,
};

export default function Home() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [stats, setStats] = useState(fallbackStats);
  const [loading, setLoading] = useState(true);

  // Countdown timer logic to August 9, 2026 at 06:00 WIB (Sesi 1: Senam & Lomba)
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

  // Fetch quick stats from Supabase
  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch warga stats
        const { data: warga, error: wargaError } = await supabase
          .from('warga')
          .select('nominal_iuran, is_paid');
        
        // Fetch panitia count
        const { count: panitiaCount, error: panitiaError } = await supabase
          .from('panitia')
          .select('*', { count: 'exact', head: true });

        if (warga && !wargaError) {
          const paidWarga = warga.filter((w: any) => w.is_paid);
          const iuranCollected = paidWarga.reduce((sum: number, w: any) => sum + Number(w.nominal_iuran), 0);
          
          setStats({
            totalTarget: 12000000,
            collected: 2000000 + iuranCollected, // 2jt Kas RT + collected from warga
            committeeCount: panitiaCount || fallbackStats.committeeCount,
            residentsCount: warga.length || fallbackStats.residentsCount,
          });
        }
      } catch (err) {
        console.warn('Using offline mock stats:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const progressPercentage = Math.min(Math.round((stats.collected / stats.totalTarget) * 100), 100);

  return (
    <div className="flex-grow flex flex-col justify-start">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4 text-center bg-gradient-to-b from-[#1D3557] via-[#0F172A] to-[#0F172A] border-b border-red-500/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-600/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <div className="inline-flex items-center space-x-2 bg-red-600/10 border border-red-500/30 px-3 py-1.5 rounded-full text-red-400 text-xs sm:text-sm font-semibold tracking-wider uppercase animate-pulse">
            <Flag className="h-4 w-4" />
            <span>Pesta Rakyat RT 12 Pelem Kidul</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Peringatan HUT RI Ke-81
          </h1>
          
          <p className="text-xl sm:text-2xl font-bold italic text-red-400 bg-gradient-to-r from-red-500 to-red-300 bg-clip-text text-transparent">
            "Guyub Rukun Membangun Negeri"
          </p>

          <p className="max-w-2xl mx-auto text-slate-400 text-sm sm:text-base leading-relaxed">
            Selamat datang di portal informasi resmi warga RT 12 Pelem Kidul. Kami menyajikan jadwal acara, struktur kepanitiaan, dan transparansi anggaran real-time sebagai wujud gotong royong bersama.
          </p>
        </div>
      </section>

      {/* Countdown Section */}
      <section className="-mt-8 px-4 relative z-20">
        <div className="max-w-3xl mx-auto bg-gradient-to-r from-slate-900 to-slate-950 border border-red-500/30 rounded-2xl shadow-xl shadow-red-600/5 p-6 sm:p-8">
          <div className="flex items-center justify-center space-x-2 text-red-400 font-semibold mb-6">
            <Clock className="h-5 w-5 animate-spin-slow" />
            <span className="tracking-wide uppercase text-sm">Menuju Sesi 1: Senam & Lomba (9 Agustus 2026)</span>
          </div>

          <div className="grid grid-cols-4 gap-4 text-center">
            {[
              { label: 'Hari', value: timeLeft.days },
              { label: 'Jam', value: timeLeft.hours },
              { label: 'Menit', value: timeLeft.minutes },
              { label: 'Detik', value: timeLeft.seconds },
            ].map((t) => (
              <div key={t.label} className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col justify-center">
                <span className="text-2xl sm:text-4xl font-extrabold text-white bg-gradient-to-b from-white to-slate-300 bg-clip-text">
                  {String(t.value).padStart(2, '0')}
                </span>
                <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">
                  {t.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Overview Cards & Interactive Menu */}
      <section className="max-w-6xl mx-auto px-4 py-16 w-full space-y-12">
        {/* Real-time Budget Progress Bar */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col justify-center">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-2 sm:space-y-0">
            <div>
              <h3 className="text-lg font-bold text-white">Transparansi Anggaran</h3>
              <p className="text-xs text-slate-400">Total target Rp 12.000.000 (Iuran Warga + Kas RT + Donatur)</p>
            </div>
            <span className="text-xl sm:text-2xl font-extrabold text-red-400">
              Rp {stats.collected.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-400">terkumpul ({progressPercentage}%)</span>
            </span>
          </div>

          <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden p-0.5 border border-slate-700">
            <div
              className="bg-gradient-to-r from-red-600 to-red-500 h-full rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Dashboard Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Rundown */}
          <Link href="/rundown" className="group bg-slate-900/30 hover:bg-slate-900/60 border border-slate-800 hover:border-red-500/30 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between shadow-md hover:shadow-lg hover:-translate-y-1">
            <div className="space-y-4">
              <div className="p-3 bg-red-600/10 rounded-xl w-fit group-hover:bg-red-600/20 transition-colors">
                <Calendar className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-red-400 transition-colors">
                Jadwal & Rundown
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Lihat jadwal 2 sesi: Sesi 1 (9 Agst pagi - Senam & Lomba) dan Sesi 2 (16 Agst malam - Kirab, Tirakatan & Pentas Seni).
              </p>
            </div>
            <div className="flex items-center text-red-400 font-semibold text-sm mt-6">
              <span>Buka Jadwal</span>
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 2: Committee */}
          <Link href="/panitia" className="group bg-slate-900/30 hover:bg-slate-900/60 border border-slate-800 hover:border-red-500/30 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between shadow-md hover:shadow-lg hover:-translate-y-1">
            <div className="space-y-4">
              <div className="p-3 bg-red-600/10 rounded-xl w-fit group-hover:bg-red-600/20 transition-colors">
                <Users className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-red-400 transition-colors">
                Susunan Panitia
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Kenali struktur organisasi panitia yang ramping dan fungsional, lengkap dengan daftar penanggung jawab per seksi kegiatan.
              </p>
            </div>
            <div className="flex items-center text-red-400 font-semibold text-sm mt-6">
              <span>Lihat Panitia</span>
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 3: Finance */}
          <Link href="/keuangan" className="group bg-slate-900/30 hover:bg-slate-900/60 border border-slate-800 hover:border-red-500/30 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between shadow-md hover:shadow-lg hover:-translate-y-1">
            <div className="space-y-4">
              <div className="p-3 bg-red-600/10 rounded-xl w-fit group-hover:bg-red-600/20 transition-colors">
                <DollarSign className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-red-400 transition-colors">
                Transparansi Keuangan
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Pantau rincian anggaran belanja (RAB), kas masuk, serta status pembayaran iuran warga secara transparan dan detail.
              </p>
            </div>
            <div className="flex items-center text-red-400 font-semibold text-sm mt-6">
              <span>Buka Laporan</span>
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>

        {/* Message from Chairman */}
        <div className="bg-slate-900/20 border border-slate-800/80 rounded-2xl p-8 max-w-4xl mx-auto flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8">
          <div className="relative">
            <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-red-600 to-red-400 flex items-center justify-center font-bold text-2xl text-white shadow-lg shadow-red-600/20">
              GA
            </div>
            <span className="absolute bottom-0 right-0 h-5 w-5 rounded-full bg-green-500 border-2 border-slate-900" />
          </div>
          <div className="space-y-2 text-center md:text-left">
            <h4 className="text-lg font-bold text-white">Sambutan Ketua Panitia</h4>
            <p className="text-slate-400 text-sm italic leading-relaxed">
              "Melalui portal ini, kami ingin memastikan semua warga mendapatkan informasi terbaru dan merasa yakin bahwa iuran serta donasi dikelola secara bertanggung jawab. Mari bersama-sama menyukseskan Pesta Rakyat RT 12 Pelem Kidul tahun 2026!"
            </p>
            <p className="text-xs font-semibold text-red-400 mt-2">
              — Gabriel Fermy Aswinta, Ketua Panitia HUT RI Ke-81 RT 12
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
