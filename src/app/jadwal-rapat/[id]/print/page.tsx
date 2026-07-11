'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Flag, ArrowLeft, Printer } from 'lucide-react';
import Link from 'next/link';

export default function CetakAbsensiPage() {
  const params = useParams();
  const rapatId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [rapat, setRapat] = useState<any>(null);
  const [panitiaList, setPanitiaList] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: rapatData } = await supabase
          .from('rapat')
          .select('*')
          .eq('id', rapatId)
          .maybeSingle();
        
        if (rapatData) {
          setRapat(rapatData);
        }

        const { data: pData } = await supabase.from('panitia').select('*');
        if (pData) {
          // Sorting logic
          const getRolePriority = (p: any) => {
            if (p.seksi === 'Inti') {
              if (p.jabatan === 'Ketua Panitia') return 1;
              if (p.jabatan === 'Sekretaris') return 2;
              if (p.jabatan === 'Bendahara') return 3;
              return 4;
            }
            if (p.seksi === 'Pelindung') return 99;
            if (p.seksi === 'Penasihat') return 98;
            return 10;
          };

          const getLevelPriority = (level: string) => {
            if (level === 'Koordinator') return 1;
            if (level === 'Sub-Koordinator') return 2;
            return 3; // Anggota
          };

          pData.sort((a, b) => {
            // 1. Kelompok Jabatan (Inti goes first, then Harian)
            const pA = getRolePriority(a);
            const pB = getRolePriority(b);
            if (pA !== pB) return pA - pB;
            
            // 2. Seksi
            if (a.seksi !== b.seksi) return (a.seksi || '').localeCompare(b.seksi || '');

            // 3. Level (Koordinator -> Anggota)
            const lA = getLevelPriority(a.level);
            const lB = getLevelPriority(b.level);
            if (lA !== lB) return lA - lB;

            // 4. Abjad
            return (a.nama || '').localeCompare(b.nama || '');
          });
          
          // Exclude Pelindung & Penasihat if they usually don't need manual signs, but let's just keep them at the bottom.
          setPanitiaList(pData.filter(p => !['Pelindung', 'Penasihat'].includes(p.seksi)));
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData().then(() => {
      // Auto trigger print after database is loaded
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.print();
        }
      }, 1000);
    });
  }, [rapatId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-slate-900">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-slate-950 border-r-2 mx-auto"></div>
          <p className="text-xs font-semibold">Menyiapkan Dokumen Cetak...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white text-black min-h-screen font-serif p-4 sm:p-12 max-w-4xl mx-auto leading-relaxed relative">
      
      {/* SCREEN-ONLY TOOLBAR CONTROLS (Hidden on Print) */}
      <div className="print:hidden bg-slate-950/80 border border-slate-800 p-4 rounded-2xl mb-8 flex justify-between items-center text-white z-50 sticky top-4 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <Link href={`/jadwal-rapat/${rapatId}/absensi`} className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-850 rounded-xl text-slate-350 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-red-400">Print Daftar Hadir</h4>
            <p className="text-[10px] text-slate-400">Tekan Ctrl+P atau Klik tombol Print.</p>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center space-x-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-all"
        >
          <Printer className="h-4 w-4" />
          <span>Cetak</span>
        </button>
      </div>

      {/* PRINT MARGIN CSS (Active during print) */}
      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
            font-family: 'Times New Roman', Times, serif !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 15mm;
          }
          .page-break {
            page-break-before: always;
          }
        }
      `}</style>

      {/* DOCUMENT HEADER */}
      <div className="text-center space-y-2 border-b-2 border-black pb-4 mb-6">
        <h1 className="text-xl font-black uppercase tracking-wider">DAFTAR HADIR RAPAT PANITIA</h1>
        <h2 className="text-sm font-bold uppercase">HUT RI Ke-81 RT 12 Pelem Kidul</h2>
        
        {rapat && (
          <div className="mt-4 text-xs">
            <table className="mx-auto text-left">
              <tbody>
                <tr>
                  <td className="pr-4 font-bold">Hari, Tanggal</td>
                  <td>: {new Date(rapat.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</td>
                </tr>
                <tr>
                  <td className="pr-4 font-bold">Waktu</td>
                  <td>: {rapat.waktu}</td>
                </tr>
                <tr>
                  <td className="pr-4 font-bold">Tempat</td>
                  <td>: {rapat.tempat}</td>
                </tr>
                <tr>
                  <td className="pr-4 font-bold">Agenda Utama</td>
                  <td>: {rapat.agenda}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ATTENDANCE TABLE */}
      <table className="w-full text-left border-collapse text-xs border border-black">
        <thead>
          <tr className="bg-slate-100 border-b-2 border-black font-bold uppercase">
            <th className="py-2.5 px-3 border border-black w-10 text-center">No</th>
            <th className="py-2.5 px-3 border border-black w-64">Nama Panitia</th>
            <th className="py-2.5 px-3 border border-black w-48">Jabatan / Seksi</th>
            <th className="py-2.5 px-3 border border-black" colSpan={2}>Tanda Tangan</th>
          </tr>
        </thead>
        <tbody>
          {panitiaList.map((p, idx) => (
            <tr key={p.id} className="border-b border-black align-middle h-10">
              <td className="py-2 px-3 border border-black text-center">{idx + 1}</td>
              <td className="py-2 px-3 border border-black font-bold">{p.nama}</td>
              <td className="py-2 px-3 border border-black">
                {p.seksi === 'Inti' ? (
                  <span className="uppercase text-[10px] font-bold">{p.jabatan}</span>
                ) : (
                  <span>
                    {p.level} <span className="font-bold">Seksi {p.seksi}</span>
                  </span>
                )}
              </td>
              <td className="py-2 px-3 border border-black w-24">
                {idx % 2 === 0 ? <span className="text-[10px] text-slate-400">{idx + 1}.</span> : ''}
              </td>
              <td className="py-2 px-3 border border-black w-24">
                {idx % 2 !== 0 ? <span className="text-[10px] text-slate-400">{idx + 1}.</span> : ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* FOOTER */}
      <div className="mt-12 text-xs grid grid-cols-2 text-center">
        <div></div>
        <div className="space-y-16">
          <div>
            Pelem Kidul, {rapat ? new Date(rapat.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '......................'}
            <br />
            Mengetahui,
            <br />
            Sekretaris Panitia
          </div>
          <div className="font-bold underline">
            Mas Ikhsan
          </div>
        </div>
      </div>

    </div>
  );
}
