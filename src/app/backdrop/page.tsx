'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Award, Heart, Sparkles, Printer } from 'lucide-react';

export default function BackdropPage() {
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    loadSponsors();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const platinum = sponsors.filter(s => s.tipe === 'Platinum');
  const gold = sponsors.filter(s => s.tipe === 'Gold');
  const silverAndDonors = sponsors.filter(s => s.tipe === 'Silver' || s.tipe === 'Donatur Warga');

  return (
    <div className="flex-grow flex flex-col justify-between min-h-screen bg-[#F3F4F6] text-slate-900 relative overflow-hidden select-none font-sans print:bg-white print:min-h-0 print:p-0">
      {/* Light Concrete Canvas Texture overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.9)_0%,_rgba(243,244,246,0.95)_100%)] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none" />

      {/* 🔴 Top Drapery / Red-White Curtains (Static) */}
      <div className="absolute top-0 left-0 w-full z-20 flex flex-col pointer-events-none">
        <div className="h-6 bg-primary-600 w-full" />
        <div className="flex justify-between w-full -mt-0.5">
          {Array.from({ length: 16 }).map((_, idx) => (
            <div
              key={idx}
              className={`h-8 w-full rounded-b-[30px] ${
                idx % 2 === 0 ? 'bg-primary-600' : 'bg-white'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Print Action Button */}
      <div className="absolute top-14 right-6 z-50 print:hidden">
        <button
          onClick={handlePrint}
          className="p-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl shadow-lg hover:scale-105 transition-all flex items-center gap-2 text-xs font-bold"
        >
          <Printer className="h-4 w-4" />
          <span>Cetak Banner / Simpan PDF</span>
        </button>
      </div>

      {/* 🎏 Left Bamboo Pole (Static) */}
      <div className="absolute left-4 sm:left-8 bottom-0 top-10 w-6 sm:w-10 z-20 pointer-events-none flex flex-col justify-between items-center print:left-2">
        <div className="w-full flex-grow bg-gradient-to-r from-green-800 via-green-600 to-green-900 rounded-lg relative overflow-hidden border-r border-green-950">
          {Array.from({ length: 12 }).map((_, idx) => (
            <div
              key={idx}
              className="absolute w-full h-1.5 bg-green-950/40 border-b border-green-500/20"
              style={{ top: `${(idx + 1) * 8}%` }}
            />
          ))}
          {/* Static Red & White ribbon effect */}
          <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,_rgba(185,28,28,0.7)_0px,_rgba(185,28,28,0.7)_30px,_rgba(255,255,255,0.9)_30px,_rgba(255,255,255,0.9)_60px)] mix-blend-overlay opacity-90" />
        </div>
      </div>

      {/* 🎏 Right Bamboo Pole (Static) */}
      <div className="absolute right-4 sm:right-8 bottom-0 top-10 w-6 sm:w-10 z-20 pointer-events-none flex flex-col justify-between items-center print:right-2">
        <div className="w-full flex-grow bg-gradient-to-r from-green-800 via-green-600 to-green-900 rounded-lg relative overflow-hidden border-l border-green-950">
          {Array.from({ length: 12 }).map((_, idx) => (
            <div
              key={idx}
              className="absolute w-full h-1.5 bg-green-950/40 border-b border-green-500/20"
              style={{ top: `${(idx + 1) * 8}%` }}
            />
          ))}
          <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,_rgba(185,28,28,0.7)_0px,_rgba(185,28,28,0.7)_30px,_rgba(255,255,255,0.9)_30px,_rgba(255,255,255,0.9)_60px)] mix-blend-overlay opacity-90" />
        </div>
      </div>

      {/* Top Badges (Garuda, Seals, HUT 81) */}
      <div className="w-full max-w-5xl mx-auto px-16 sm:px-24 pt-14 sm:pt-16 flex justify-between items-center z-10">
        {/* Left: Golden Garuda Pancasila SVG */}
        <div className="w-14 sm:w-20 h-14 sm:h-20 flex items-center justify-center filter drop-shadow-sm">
          <svg viewBox="0 0 100 100" className="w-full h-full text-amber-500 fill-current">
            <path d="M50 5 L60 25 L85 25 L65 40 L75 65 L50 50 L25 65 L35 40 L15 25 L40 25 Z" />
            <circle cx="50" cy="38" r="10" className="text-primary-700" />
            <path d="M47 38 L53 38" className="text-white stroke-2" />
          </svg>
        </div>

        {/* Center: Regency / Village Seals */}
        <div className="flex gap-3 items-center">
          <div className="h-8 sm:h-10 w-8 sm:w-10 bg-white border border-slate-350 rounded-full flex items-center justify-center p-1 shadow-sm">
            <span className="text-[6px] font-black text-blue-900 leading-none text-center">KAB BANTUL</span>
          </div>
          <div className="h-8 sm:h-10 w-8 sm:w-10 bg-white border border-slate-350 rounded-full flex items-center justify-center p-1 shadow-sm">
            <span className="text-[6px] font-black text-primary-700 leading-none text-center">BATURETNO</span>
          </div>
        </div>

        {/* Right: HUT RI 81 Emblem */}
        <div className="h-14 sm:h-16 w-14 sm:w-16 bg-primary-600 rounded-full flex items-center justify-center text-white border-2 border-white shadow-md relative font-black text-xl sm:text-2xl">
          <span>81</span>
          <span className="absolute -bottom-1.5 bg-white text-primary-600 px-1.5 py-0.5 text-[6px] font-black rounded-full uppercase border border-primary-600 tracking-wider">
            HUT RI
          </span>
        </div>
      </div>

      {/* Main stage Backdrop Content */}
      <main className="text-center my-4 max-w-4xl mx-auto w-full px-16 sm:px-24 z-10 flex-grow flex flex-col justify-center space-y-4">
        
        {/* Ribbon decoration banner */}
        <div className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-1.5 rounded-full shadow-md border border-primary-500/20 max-w-fit mx-auto">
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest">DIRGAHAYU</span>
        </div>

        {/* Bold Title: REPUBLIK INDONESIA */}
        <div className="space-y-1">
          <h1 
            className="text-4xl sm:text-6xl font-extrabold text-primary-700 tracking-tight leading-none filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)] uppercase"
            style={{ textShadow: '2px 2px 0px #fff' }}
          >
            Republik Indonesia
          </h1>
          <h2 className="text-sm sm:text-lg font-black text-slate-750 tracking-wider uppercase">
            17 AGUSTUS 1945 - 17 AGUSTUS 2026
          </h2>
        </div>

        {/* Independence Subtitle */}
        <div className="bg-primary-600/5 border-y border-primary-500/10 py-2 max-w-lg mx-auto w-full rounded-lg">
          <p className="text-xs sm:text-sm font-bold text-primary-700 italic">
            "Indonesia Berdaulat, Adil dan Makmur"
          </p>
        </div>

        {/* Address */}
        <div>
          <h3 className="text-base sm:text-xl font-black text-slate-900 bg-white/60 border border-slate-200 px-5 py-2 rounded-xl shadow-sm inline-block tracking-wider">
            RT 12 Pelem Kidul, Baturetno, Banguntapan, Bantul
          </h3>
        </div>

        {/* 📋 STATIC SPONSORS SECTION PRINTED DIRECTLY ON LAYOUT */}
        <div className="bg-white/80 border border-slate-200/80 rounded-2xl p-4 sm:p-5 mt-4 space-y-4 shadow-sm max-w-3xl mx-auto w-full">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-1.5">
            Daftar Sponsor Resmi (Tercetak di Backdrop)
          </div>

          <div className="space-y-3">
            {/* Platinum Row */}
            {platinum.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                <span className="text-[9px] font-black uppercase text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded shrink-0">Platinum</span>
                <div className="flex flex-wrap justify-center gap-2 font-black text-slate-900 text-sm sm:text-base">
                  {platinum.map((s, i) => (
                    <span key={i} className="bg-gradient-to-r from-amber-400 to-yellow-300 px-3 py-1 rounded-lg border border-yellow-250 shadow-sm leading-none">
                      {s.nama}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Gold Row */}
            {gold.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                <span className="text-[9px] font-black uppercase text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded shrink-0">Gold</span>
                <div className="flex flex-wrap justify-center gap-1.5 font-extrabold text-slate-800 text-xs sm:text-sm">
                  {gold.map((s, i) => (
                    <span key={i} className="bg-white px-2.5 py-1 rounded-md border border-slate-300 shadow-sm">
                      {s.nama}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Silver & Donors Row */}
            {silverAndDonors.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                <span className="text-[9px] font-black uppercase text-primary-600 bg-primary-50 border border-primary-200 px-2 py-0.5 rounded shrink-0">Donatur & Silver</span>
                <div className="flex flex-wrap justify-center gap-x-2 text-[10px] sm:text-xs text-slate-600 font-semibold">
                  {silverAndDonors.map((s, i) => (
                    <span key={i} className="bg-slate-100/60 px-2 py-0.5 rounded border border-slate-200">
                      {s.nama} {s.keterangan ? `(${s.keterangan})` : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </main>

      {/* 🧱 Brick Wall & Grass Bottom (Static) */}
      <div className="w-full relative z-10 flex flex-col pointer-events-none mt-2">
        <div className="h-2 bg-gradient-to-t from-emerald-600/50 to-transparent w-full" />
        <div className="h-6 bg-primary-600 relative overflow-hidden border-t border-white flex flex-col justify-between">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,_transparent_49%,_rgba(255,255,255,0.3)_50%,_transparent_51%)] [background-size:32px_100%]" />
          <div className="h-px bg-white/30 w-full" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,_transparent_49%,_rgba(255,255,255,0.3)_50%,_transparent_51%)] [background-size:32px_100%] [background-position:16px_0]" />
        </div>
      </div>

    </div>
  );
}
