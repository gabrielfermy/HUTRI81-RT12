'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Flag, Award, Heart, Sparkles, Maximize2, RefreshCw } from 'lucide-react';

export default function BackdropPage() {
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

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

    // Subscribe to realtime updates
    const channel = supabase
      .channel('backdrop-sponsor-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        loadSponsors();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setFullscreen(false)).catch(() => {});
    }
  };

  const platinum = sponsors.filter(s => s.tipe === 'Platinum');
  const gold = sponsors.filter(s => s.tipe === 'Gold');
  const silverAndDonors = sponsors.filter(s => s.tipe === 'Silver' || s.tipe === 'Donatur Warga');

  return (
    <div className="flex-grow flex flex-col justify-between min-h-screen bg-[#E5E7EB] text-slate-900 relative overflow-hidden select-none font-sans">
      {/* Light Concrete Texture overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.85)_0%,_rgba(229,231,235,0.9)_100%)] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      {/* 🔴 Top Drapery / Red-White Curtains */}
      <div className="absolute top-0 left-0 w-full z-20 flex flex-col pointer-events-none">
        <div className="h-6 bg-red-650 shadow-md w-full" />
        {/* Curved hanging flag shapes */}
        <div className="flex justify-between w-full -mt-0.5">
          {Array.from({ length: 16 }).map((_, idx) => (
            <div
              key={idx}
              className={`h-10 w-full rounded-b-[40px] shadow-sm ${
                idx % 2 === 0 ? 'bg-red-650' : 'bg-white'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Screen Control Button */}
      <div className="absolute top-18 right-6 z-50 print:hidden">
        <button
          onClick={handleFullscreen}
          className="p-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-lg hover:scale-105 transition-all flex items-center gap-2 text-xs font-bold"
        >
          <Maximize2 className="h-4 w-4" />
          <span>{fullscreen ? 'Normal' : 'Layar Penuh'}</span>
        </button>
      </div>

      {/* 🎏 Left Bamboo Pole with Ribbon */}
      <div className="absolute left-4 sm:left-8 bottom-0 top-12 w-6 sm:w-10 z-20 pointer-events-none flex flex-col justify-between items-center">
        {/* Bamboo segment styling */}
        <div className="w-full flex-grow bg-gradient-to-r from-green-800 via-green-600 to-green-900 rounded-lg relative overflow-hidden border-r border-green-950">
          {/* Bamboo ridges */}
          {Array.from({ length: 12 }).map((_, idx) => (
            <div
              key={idx}
              className="absolute w-full h-1.5 bg-green-950/40 border-b border-green-500/20"
              style={{ top: `${(idx + 1) * 8}%` }}
            />
          ))}
          {/* Red & White flag ribbon wrapped around */}
          <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,_rgba(185,28,28,0.85)_0px,_rgba(185,28,28,0.85)_40px,_rgba(255,255,255,0.95)_40px,_rgba(255,255,255,0.95)_80px)] mix-blend-overlay opacity-90 animate-pulse" />
        </div>
      </div>

      {/* 🎏 Right Bamboo Pole with Ribbon */}
      <div className="absolute right-4 sm:right-8 bottom-0 top-12 w-6 sm:w-10 z-20 pointer-events-none flex flex-col justify-between items-center">
        <div className="w-full flex-grow bg-gradient-to-r from-green-800 via-green-600 to-green-900 rounded-lg relative overflow-hidden border-l border-green-950">
          {Array.from({ length: 12 }).map((_, idx) => (
            <div
              key={idx}
              className="absolute w-full h-1.5 bg-green-950/40 border-b border-green-500/20"
              style={{ top: `${(idx + 1) * 8}%` }}
            />
          ))}
          <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,_rgba(185,28,28,0.85)_0px,_rgba(185,28,28,0.85)_40px,_rgba(255,255,255,0.95)_40px,_rgba(255,255,255,0.95)_80px)] mix-blend-overlay opacity-90 animate-pulse" />
        </div>
      </div>

      {/* Top Badges (Garuda, Seals, HUT 81) */}
      <div className="w-full max-w-6xl mx-auto px-12 sm:px-20 pt-16 sm:pt-20 flex justify-between items-center z-10">
        {/* Left: Golden Garuda Pancasila Vector */}
        <div className="w-16 sm:w-24 h-16 sm:h-24 flex items-center justify-center filter drop-shadow-md">
          <svg viewBox="0 0 100 100" className="w-full h-full text-amber-500 fill-current">
            {/* Elegant Golden eagle vector placeholder / SVG representation */}
            <path d="M50 5 L60 25 L85 25 L65 40 L75 65 L50 50 L25 65 L35 40 L15 25 L40 25 Z" />
            <circle cx="50" cy="38" r="10" className="text-red-650" />
            <path d="M47 38 L53 38" className="text-white stroke-2" />
          </svg>
        </div>

        {/* Center: Regency / Village Seals */}
        <div className="flex gap-4 items-center">
          {/* Mock Bantul Seal */}
          <div className="h-10 sm:h-12 w-10 sm:w-12 bg-white/80 border border-slate-300 rounded-full flex items-center justify-center p-1 shadow-sm">
            <span className="text-[7px] font-black text-blue-900 leading-none text-center">KAB BANTUL</span>
          </div>
          {/* Mock Baturetno Seal */}
          <div className="h-10 sm:h-12 w-10 sm:w-12 bg-white/80 border border-slate-300 rounded-full flex items-center justify-center p-1 shadow-sm">
            <span className="text-[7px] font-black text-red-700 leading-none text-center">BATURETNO</span>
          </div>
        </div>

        {/* Right: HUT RI 81 Emblem */}
        <div className="h-16 sm:h-20 w-16 sm:w-20 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center text-white border-4 border-white shadow-lg relative font-black tracking-tighter text-2xl sm:text-3xl">
          <span className="animate-bounce">81</span>
          <span className="absolute -bottom-2 bg-white text-red-600 px-2 py-0.5 text-[8px] font-black rounded-full uppercase border border-red-600 tracking-widest">
            HUT RI
          </span>
        </div>
      </div>

      {/* Main stage Backdrop Content */}
      <main className="text-center my-6 max-w-5xl mx-auto w-full px-12 sm:px-20 z-10 flex-grow flex flex-col justify-center space-y-6">
        
        {/* Ribbon decoration banner */}
        <div className="inline-flex items-center gap-3 bg-red-650 text-white px-8 py-2 rounded-full shadow-lg border border-red-500/20 max-w-fit mx-auto">
          <Sparkles className="h-4.5 w-4.5 text-yellow-400 fill-current animate-spin" />
          <span className="text-xs sm:text-sm font-extrabold uppercase tracking-widest">DIRGAHAYU</span>
          <Sparkles className="h-4.5 w-4.5 text-yellow-400 fill-current animate-spin" />
        </div>

        {/* 3D Bold Title: REPUBLIK INDONESIA */}
        <div className="space-y-1">
          <h1 
            className="text-5xl sm:text-8xl font-extrabold text-red-650 tracking-tight leading-none filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)] select-none uppercase"
            style={{ textShadow: '2px 2px 0px #fff, 5px 5px 0px rgba(0,0,0,0.1)' }}
          >
            Republik Indonesia
          </h1>
          <h2 className="text-lg sm:text-2xl font-black text-slate-700 tracking-wider">
            17 AGUSTUS 1945 - 17 AGUSTUS 2026
          </h2>
        </div>

        {/* Independence Subtitle */}
        <div className="bg-red-600/10 border-y border-red-500/20 py-2.5 max-w-2xl mx-auto w-full rounded-xl">
          <p className="text-sm sm:text-xl font-bold text-red-700 italic">
            "Indonesia Berdaulat, Adil dan Makmur"
          </p>
        </div>

        {/* Target Address */}
        <div className="space-y-1">
          <p className="text-xs sm:text-sm text-slate-500 font-bold uppercase tracking-widest">Diselenggarakan Oleh Warga:</p>
          <h3 className="text-xl sm:text-3xl font-black text-slate-900 bg-white/70 border border-slate-200/80 px-6 py-3 rounded-2xl shadow-sm inline-block tracking-wider">
            RT 12 Pelem Kidul, Baturetno, Banguntapan, Bantul
          </h3>
        </div>

      </main>

      {/* 🧱 Grass / Red Brick Wall Bottom Segment */}
      <div className="w-full relative z-10 flex flex-col pointer-events-none mt-4">
        {/* Horizontal Grass overlay */}
        <div className="h-4 bg-gradient-to-t from-emerald-600 to-transparent w-full" />
        
        {/* Red Brick Grid Pattern */}
        <div className="h-8 bg-red-600 relative overflow-hidden border-t-2 border-white flex flex-col justify-between">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,_transparent_49%,_rgba(255,255,255,0.4)_50%,_transparent_51%)] [background-size:40px_100%] pointer-events-none" />
          <div className="h-0.5 bg-white/40 w-full" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,_transparent_49%,_rgba(255,255,255,0.4)_50%,_transparent_51%)] [background-size:40px_100%] [background-position:20px_0] pointer-events-none" />
        </div>
      </div>

      {/* 🎪 Sponsor Scrolling Ticker (Realtime Showcase) */}
      <div className="w-full bg-[#1E293B]/90 backdrop-blur-md text-white py-3 px-6 z-30 relative shadow-2xl border-t border-slate-750 flex items-center space-x-4 print:hidden">
        <div className="shrink-0 flex items-center gap-1.5 bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider shadow-md">
          <Award className="h-4 w-4 animate-bounce" />
          <span>Sponsor Kami</span>
        </div>
        
        {/* Infinite Scrolling Ticker Text */}
        <div className="flex-grow overflow-hidden relative w-full text-xs font-semibold text-slate-200 whitespace-nowrap">
          <div className="inline-block animate-[marquee_20s_linear_infinite] space-x-12">
            <span>🏆 <strong>PLATINUM:</strong> {platinum.map(s => s.nama).join(', ') || 'RT 12 Kas'}</span>
            <span>⭐ <strong>GOLD:</strong> {gold.map(s => s.nama).join(', ') || 'Donatur Warga'}</span>
            <span>❤️ <strong>SILVER & DONATUR:</strong> {silverAndDonors.map(s => s.nama).join(', ') || 'Warga Gotong Royong'}</span>
          </div>
        </div>

        {/* CSS for infinite marquee */}
        <style jsx global>{`
          @keyframes marquee {
            0% { transform: translateX(50%); }
            100% { transform: translateX(-100%); }
          }
        `}</style>
      </div>

    </div>
  );
}
