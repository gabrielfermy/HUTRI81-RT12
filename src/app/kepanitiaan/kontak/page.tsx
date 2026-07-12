'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Phone, MessageCircle, Crown, Star, Shield, Users } from 'lucide-react';
import Link from 'next/link';

export default function KepanitiaanKontak() {
  const [loading, setLoading] = useState(true);
  const [panitiaList, setPanitiaList] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data } = await supabase
          .from('panitia')
          .select('*')
          .order('nama', { ascending: true });
        if (data) setPanitiaList(data);
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Memuat data kontak...</div>;
  }

  // Filter and group lists
  const pelindungList = panitiaList.filter(p => p.jabatan === 'Pelindung');
  const penasihatList = panitiaList.filter(p => p.jabatan === 'Penasihat');
  const intiList = panitiaList.filter(p => p.seksi === 'Inti' && p.jabatan !== 'Pelindung' && p.jabatan !== 'Penasihat');
  const harianList = panitiaList.filter(p => p.seksi !== 'Inti' && p.jabatan !== 'Pelindung' && p.jabatan !== 'Penasihat');

  // Group harian by seksi
  const groupedHarian = harianList.reduce((acc, curr) => {
    if (!acc[curr.seksi]) acc[curr.seksi] = [];
    acc[curr.seksi].push(curr);
    return acc;
  }, {} as Record<string, any[]>);

  // Helper to render a contact row
  const renderRow = (p: any) => (
    <div key={p.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 rounded-lg px-2 transition-colors">
      <div className="flex flex-col">
        <span className="text-sm font-bold text-slate-800">{p.nama}</span>
        <span className="text-xs text-slate-500 flex items-center gap-1">
          {p.jabatan && p.jabatan !== p.level ? `${p.jabatan} (${p.level})` : p.level || p.jabatan}
          {p.no_wa && (
            <span className="text-[10px] ml-2 px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-mono tracking-wider">
              {p.no_wa}
            </span>
          )}
        </span>
      </div>
      {p.no_wa ? (
        <a 
          href={`https://wa.me/${p.no_wa.replace(/\D/g, '')}`} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-lg text-xs font-bold transition-colors shrink-0"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          <span>Chat WA</span>
        </a>
      ) : (
        <span className="text-[10px] italic text-slate-400 bg-slate-50 px-2 py-1 rounded">No WA belum ada</span>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Susunan & Kontak Panitia</h1>
        <p className="text-slate-500 mt-1">Daftar lengkap kontak anggota kepanitiaan untuk komunikasi internal.</p>
      </div>

      <div className="space-y-6">
        
        {/* Pelindung */}
        {pelindungList.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-purple-700 flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
              <Crown className="h-4 w-4" /> Pelindung / Pembina
            </h3>
            <div className="space-y-1">
              {pelindungList.map(renderRow)}
            </div>
          </div>
        )}

        {/* Penasihat */}
        {penasihatList.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-blue-600 flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
              <Star className="h-4 w-4" /> Penasihat
            </h3>
            <div className="space-y-1">
              {penasihatList.map(renderRow)}
            </div>
          </div>
        )}

        {/* Inti */}
        {intiList.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-red-600 flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
              <Shield className="h-4 w-4" /> Pengurus Inti
            </h3>
            <div className="space-y-1">
              {/* Sort Inti: Ketua, Sekretaris, Bendahara */}
              {intiList
                .sort((a, b) => {
                  const ranks: any = { 'Ketua Panitia': 1, 'Sekretaris': 2, 'Bendahara': 3 };
                  return (ranks[a.jabatan] || 99) - (ranks[b.jabatan] || 99);
                })
                .map(renderRow)}
            </div>
          </div>
        )}

        {/* Harian */}
        {Object.entries(groupedHarian).sort(([a], [b]) => a.localeCompare(b)).map(([seksi, anggota]) => (
          <div key={seksi} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
              <Users className="h-4 w-4 text-emerald-600" /> Seksi {seksi}
            </h3>
            <div className="space-y-1">
              {anggota
                .sort((a, b) => {
                  const levelRank: any = { 'Koordinator': 1, 'Sub-Koordinator': 2, 'Anggota': 3 };
                  const diff = (levelRank[a.level] || 99) - (levelRank[b.level] || 99);
                  if (diff !== 0) return diff;
                  return a.nama.localeCompare(b.nama);
                })
                .map(renderRow)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
