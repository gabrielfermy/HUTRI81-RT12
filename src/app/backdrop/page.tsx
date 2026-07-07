'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Flag, Award, Heart, Sparkles, Maximize2 } from 'lucide-react';

export default function BackdropPage() {
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    async function loadSponsors() {
      try {
        const { data, error } = await supabase
          .from('sponsorship')
          .select('*')
          .order('nominal', { ascending: false });

        if (data && !error) {
          setSponsors(data);
        } else {
          // Fallback mock sponsors
          setSponsors([
            { nama: 'Toko Kelontong Bu Sri', tipe: 'Platinum' },
            { nama: 'Apotek Sehat Abadi', tipe: 'Gold' },
            { nama: 'Susu Segar Pelem', tipe: 'Silver' },
            { nama: 'Warteg Pelem Kidul', tipe: 'Silver' },
          ]);
        }
      } catch (err) {
        console.error('Error loading sponsors for backdrop:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSponsors();
  }, []);

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setFullscreen(false));
    }
  };

  const platinum = sponsors.filter(s => s.tipe === 'Platinum');
  const gold = sponsors.filter(s => s.tipe === 'Gold');
  const silverAndDonors = sponsors.filter(s => s.tipe === 'Silver' || s.tipe === 'Donatur Warga');

  return (
    <div className="flex-grow flex flex-col justify-between min-h-screen bg-[#450A0A] text-white p-6 sm:p-12 relative overflow-hidden">
      {/* Background Graphic Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#991B1B]/40 via-[#450A0A] to-[#450A0A] pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-white to-red-500" />
      
      {/* Floating Sparkles decoration */}
      <div className="absolute top-10 left-10 opacity-20 animate-pulse">
        <Sparkles className="h-8 w-8 text-yellow-400" />
      </div>
      <div className="absolute bottom-10 right-10 opacity-20 animate-pulse delay-1000">
        <Sparkles className="h-10 w-10 text-yellow-400" />
      </div>

      {/* Screen Control Button */}
      <div className="absolute top-4 right-4 z-50 print:hidden">
        <button
          onClick={handleFullscreen}
          className="p-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-all"
          title="Toggle Fullscreen"
        >
          <Maximize2 className="h-4.5 w-4.5 text-white" />
        </button>
      </div>

      {/* Header section */}
      <header className="text-center space-y-4 max-w-4xl mx-auto z-10">
        <div className="inline-flex items-center space-x-2 bg-white/10 border border-white/20 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase text-red-200">
          <Flag className="h-4 w-4 text-red-500" />
          <span>Malam Tirakatan & Pentas Seni</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-red-200 leading-tight">
          HUT RI Ke-81 RT 12
        </h1>
        <p className="text-xl sm:text-3xl font-black italic text-[#FACC15] tracking-wide">
          "Guyub Rukun Membangun Negeri"
        </p>
        <div className="text-xs sm:text-sm text-slate-350 font-bold uppercase tracking-widest">
          Pelem Kidul - 16 Agustus 2026
        </div>
      </header>

      {/* Sponsors Grid Container */}
      <main className="my-12 max-w-5xl mx-auto w-full space-y-12 z-10 flex-grow flex flex-col justify-center">
        
        {/* PLATINUM SPONSORS */}
        <section className="space-y-4 text-center">
          <h3 className="text-[10px] font-black tracking-widest uppercase text-[#FACC15] opacity-80 flex items-center justify-center gap-1.5">
            <Award className="h-4 w-4 text-[#FACC15]" />
            <span>Sponsor Utama Platinum</span>
          </h3>
          <div className="flex flex-wrap justify-center gap-6">
            {platinum.map((s, i) => (
              <div
                key={i}
                className="px-8 py-5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-[#450A0A] font-black text-2xl sm:text-4xl shadow-xl shadow-yellow-500/10 border border-yellow-200 transform hover:scale-[1.03] transition-all"
              >
                {s.nama}
              </div>
            ))}
            {platinum.length === 0 && (
              <p className="text-xs text-white/40 italic">Menunggu Sponsor Platinum</p>
            )}
          </div>
        </section>

        {/* GOLD SPONSORS */}
        <section className="space-y-4 text-center">
          <h3 className="text-[10px] font-black tracking-widest uppercase text-slate-300 opacity-80 flex items-center justify-center gap-1.5">
            <Award className="h-4 w-4 text-slate-300" />
            <span>Sponsor Pendukung Gold</span>
          </h3>
          <div className="flex flex-wrap justify-center gap-4">
            {gold.map((s, i) => (
              <div
                key={i}
                className="px-6 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white font-extrabold text-lg sm:text-2xl shadow-md hover:border-white/30 transition-all"
              >
                {s.nama}
              </div>
            ))}
            {gold.length === 0 && (
              <p className="text-xs text-white/40 italic">Menunggu Sponsor Gold</p>
            )}
          </div>
        </section>

        {/* SILVER & DONOR SPONSORS */}
        {silverAndDonors.length > 0 && (
          <section className="space-y-3 text-center pt-4 border-t border-white/5">
            <h3 className="text-[10px] font-black tracking-widest uppercase text-red-200 opacity-80 flex items-center justify-center gap-1.5">
              <Heart className="h-4 w-4 text-red-400" />
              <span>Apresiasi Donatur & Sponsor Silver</span>
            </h3>
            <div className="flex flex-wrap justify-center items-center gap-y-2 gap-x-4 max-w-3xl mx-auto">
              {silverAndDonors.map((s, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span className="text-white/20 text-xs font-bold">•</span>}
                  <span className="text-xs sm:text-sm font-semibold text-slate-300">
                    {s.nama} {s.keterangan ? `(${s.keterangan})` : ''}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </section>
        )}

      </main>

      {/* Footer Branding */}
      <footer className="text-center text-[10px] text-white/40 uppercase tracking-widest z-10 pt-6 border-t border-white/5">
        Panitia Peringatan HUT RI Ke-81 RT 12 Pelem Kidul © 2026
      </footer>

    </div>
  );
}
