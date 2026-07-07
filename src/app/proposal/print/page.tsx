'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Flag, FileText, ArrowLeft, Printer } from 'lucide-react';
import Link from 'next/link';

export default function ProposalPrintPage() {
  const [printMode, setPrintMode] = useState<'proposal' | 'internal_rundown'>('proposal');
  const [loading, setLoading] = useState(true);

  // Database Data States
  const [panitiaList, setPanitiaList] = useState<any[]>([]);

  // Memoized custom sorting for committee members (Inti first, then Sections with Coordinator first)
  const sortedPanitiaList = React.useMemo(() => {
    const sectionOrder = [
      'Inti',
      'Acara',
      'Perlengkapan & Dekorasi',
      'Konsumsi',
      'Humas & Dana',
      'Keamanan & Kebersihan',
      'Dokumentasi'
    ];
    return [...panitiaList].sort((a, b) => {
      const idxA = sectionOrder.indexOf(a.seksi);
      const idxB = sectionOrder.indexOf(b.seksi);
      const rankA = idxA === -1 ? 99 : idxA;
      const rankB = idxB === -1 ? 99 : idxB;
      if (rankA !== rankB) return rankA - rankB;

      if (a.seksi === 'Inti') {
        const intiOrder = ['Ketua Panitia', 'Sekretaris', 'Bendahara'];
        const rA = intiOrder.indexOf(a.jabatan);
        const rB = intiOrder.indexOf(b.jabatan);
        return (rA === -1 ? 99 : rA) - (rB === -1 ? 99 : rB);
      }

      const isKoordA = a.jabatan.toLowerCase().includes('koordinator');
      const isKoordB = b.jabatan.toLowerCase().includes('koordinator');
      if (isKoordA && !isKoordB) return -1;
      if (!isKoordA && isKoordB) return 1;

      return a.nama.localeCompare(b.nama);
    });
  }, [panitiaList]);

  const [rundownList, setRundownList] = useState<any[]>([]);
  const [rabList, setRabList] = useState<any[]>([]);
  const [sponsorList, setSponsorList] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: pData } = await supabase.from('panitia').select('*').order('created_at', { ascending: true });
        if (pData) setPanitiaList(pData);

        const { data: rData } = await supabase.from('rundown').select('*').order('tanggal', { ascending: true }).order('jam_mulai', { ascending: true });
        if (rData) setRundownList(rData);

        const { data: rabData } = await supabase.from('rab').select('*').order('kategori', { ascending: true });
        if (rabData) setRabList(rabData);

        const { data: spData } = await supabase.from('sponsorship').select('*').order('nominal', { ascending: false });
        if (spData) setSponsorList(spData);
      } catch (err) {
        console.error('Failed to load print data:', err);
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
  }, []);

  const totalTarget = 12000000;
  const kasRt = 2000000;
  const iuranPerKK = 50000;
  const totalIuranPaid = 80 * iuranPerKK; // Target proposal is 80 KK
  const totalSponsorTarget = totalTarget - kasRt - totalIuranPaid; // 6.000.000

  const totalExpenses = rabList.reduce((sum, item) => sum + (item.total_idr || item.kuantitas * item.harga_satuan), 0);

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
      <div className="print:hidden bg-slate-950/80 border border-slate-800 p-4 rounded-2xl mb-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-white z-50 sticky top-4 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <Link href="/kepanitiaan" className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-850 rounded-xl text-slate-350 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-red-400">Print Center Panitia</h4>
            <p className="text-[10px] text-slate-400">Pilih mode cetak di bawah dan tekan Ctrl+P / Klik tombol Print.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={printMode}
            onChange={(e) => setPrintMode(e.target.value as any)}
            className="bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
          >
            <option value="proposal">1. Cetak Proposal Resmi (Public)</option>
            <option value="internal_rundown">2. Cetak Rundown Pegangan Panitia</option>
          </select>
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-all"
          >
            <Printer className="h-4 w-4" />
            <span>Cetak</span>
          </button>
        </div>
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
            margin: 20mm;
          }
          .page-break {
            page-break-before: always;
          }
        }
      `}</style>

      {/* =================================================== */}
      {/* MODE 1: PROPOSAL RESMI */}
      {/* =================================================== */}
      {printMode === 'proposal' && (
        <div className="space-y-12">
          {/* COVER PAGE */}
          <div className="text-center min-h-[85vh] flex flex-col justify-between py-12">
            <div className="space-y-4">
              <h3 className="text-lg font-bold tracking-widest uppercase">PROPOSAL KEGIATAN</h3>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight border-b-2 border-double border-black pb-4 max-w-2xl mx-auto uppercase">
                Peringatan Hari Ulang Tahun Ke-81<br />Republik Indonesia
              </h1>
              <h2 className="text-xl font-bold tracking-wide italic">"Guyub Rukun Membangun Negeri"</h2>
            </div>

            <div className="my-16 max-w-sm mx-auto p-6 border-2 border-black rounded-lg space-y-2">
              <Flag className="h-10 w-10 mx-auto text-black" />
              <div className="font-bold text-sm uppercase tracking-wider">Diselenggarakan Oleh:</div>
              <div className="font-extrabold text-base uppercase tracking-widest">PANITIA PESTA RAKYAT RT 12</div>
              <div className="text-xs font-bold uppercase tracking-widest">PELEM KIDUL, BANTUL, YOGYAKARTA</div>
              <div className="text-xs font-bold tracking-wide mt-2">TAHUN 2026</div>
            </div>

            <div className="text-xs text-slate-500 font-serif">
              *Dokumen proposal digital ini diterbitkan secara otomatis oleh Sistem Portal Warga RT 12 Pelem Kidul.
            </div>
          </div>

          {/* PAGE BREAK: CONTENT */}
          <div className="page-break pt-8 space-y-6">
            <h3 className="text-lg font-bold border-b border-black pb-1 uppercase tracking-wider">I. PENDAHULUAN</h3>
            <p className="text-sm text-justify indent-8">
              Dalam rangka menyambut Hari Ulang Tahun (HUT) Kemerdekaan Republik Indonesia yang ke-81, warga RT 12 Pelem Kidul berkomitmen untuk mempererat tali silaturahmi, sportivitas, dan semangat gotong royong antarwarga melalui serangkaian kegiatan Pesta Rakyat yang bermakna, transparan, dan berkesan.
            </p>
            <p className="text-sm text-justify indent-8">
              Melalui pembentukan kepengurusan panitia yang fungsional dan pemanfaatan sistem pelaporan digital, kami menargetkan kegiatan yang efektif secara operasional tanpa membebani warga secara personal. Besar harapan kami agar semua pihak dapat ikut berkontribusi menyukseskan acara ini.
            </p>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-bold border-b border-black pb-1 uppercase tracking-wider">II. TEMA KEGIATAN</h3>
            <p className="text-sm font-bold italic text-center text-lg">
              "Guyub Rukun Membangun Negeri"
            </p>
            <p className="text-sm text-justify">
              Tema ini bermakna bahwa persatuan dan kerukunan warga di tingkat terkecil (RT) adalah pondasi utama yang kokoh dalam mewujudkan kemajuan pembangunan negeri secara nasional.
            </p>
          </div>

          <div className="space-y-6 page-break pt-8">
            <h3 className="text-lg font-bold border-b border-black pb-1 uppercase tracking-wider">III. JADWAL & RUNDOWN KEGIATAN</h3>
            <table className="w-full text-left border-collapse text-xs border border-black">
              <thead>
                <tr className="bg-slate-100 border-b border-black font-bold uppercase">
                  <th className="py-2 px-3 border border-black">Tanggal</th>
                  <th className="py-2 px-3 border border-black text-center">Waktu</th>
                  <th className="py-2 px-3 border border-black">Nama Kegiatan</th>
                  <th className="py-2 px-3 border border-black">Keterangan Sasaran</th>
                </tr>
              </thead>
              <tbody>
                {rundownList.map((r, idx) => (
                  <tr key={idx} className="border-b border-black">
                    <td className="py-2 px-3 border border-black font-bold">
                      {new Date(r.tanggal).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </td>
                    <td className="py-2 px-3 border border-black text-center font-bold">
                      {r.jam_mulai} - {r.jam_selesai} WIB
                    </td>
                    <td className="py-2 px-3 border border-black font-bold">{r.kegiatan}</td>
                    <td className="py-2 px-3 border border-black">{r.keterangan || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-6 page-break pt-8">
            <h3 className="text-lg font-bold border-b border-black pb-1 uppercase tracking-wider">IV. SUSUNAN PANITIA</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              {sortedPanitiaList.map((p, idx) => (
                <div key={idx} className="flex justify-between border-b border-slate-300 py-1">
                  <span className="font-bold">{p.nama}</span>
                  <span className="italic text-slate-650">{p.seksi} — {p.jabatan}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6 page-break pt-8">
            <h3 className="text-lg font-bold border-b border-black pb-1 uppercase tracking-wider">V. RENCANA ANGGARAN BIAYA (RAB)</h3>
            <table className="w-full text-left border-collapse text-xs border border-black">
              <thead>
                <tr className="bg-slate-100 border-b border-black font-bold uppercase">
                  <th className="py-2 px-3 border border-black">Kategori</th>
                  <th className="py-2 px-3 border border-black">Rincian Kebutuhan</th>
                  <th className="py-2 px-3 border border-black text-center">Volume</th>
                  <th className="py-2 px-3 border border-black text-right">Harga Satuan</th>
                  <th className="py-2 px-3 border border-black text-right">Total Anggaran</th>
                </tr>
              </thead>
              <tbody>
                {rabList.map((r, idx) => (
                  <tr key={idx} className="border-b border-black">
                    <td className="py-2 px-3 border border-black font-bold">{r.kategori}</td>
                    <td className="py-2 px-3 border border-black">{r.item}</td>
                    <td className="py-2 px-3 border border-black text-center">
                      {r.kuantitas} {r.satuan}
                    </td>
                    <td className="py-2 px-3 border border-black text-right">
                      Rp {Number(r.harga_satuan).toLocaleString('id-ID')}
                    </td>
                    <td className="py-2 px-3 border border-black text-right font-bold">
                      Rp {Number(r.total_idr || r.kuantitas * r.harga_satuan).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-100 font-bold border-t border-black">
                  <td colSpan={4} className="py-2.5 px-3 border border-black text-right uppercase">Total Anggaran Pengeluaran:</td>
                  <td className="py-2.5 px-3 border border-black text-right">Rp {totalExpenses.toLocaleString('id-ID')}</td>
                </tr>
              </tbody>
            </table>

            <div className="space-y-2 mt-4 text-xs">
              <div className="font-bold">Estimasi Rencana Pendapatan:</div>
              <ul className="list-disc pl-5 space-y-1">
                <li>Kas Awal RT 12: **Rp {kasRt.toLocaleString('id-ID')}**</li>
                <li>Iuran Wajib Warga (80 KK x Rp 50.000): **Rp {totalIuranPaid.toLocaleString('id-ID')}**</li>
                <li>Target Donatur & Sponsorship: **Rp {totalSponsorTarget.toLocaleString('id-ID')}** (Kekurangan Dana)</li>
                <li className="font-bold">Total Target Pendapatan: **Rp {totalTarget.toLocaleString('id-ID')}**</li>
              </ul>
            </div>
          </div>

          <div className="space-y-6 page-break pt-8 text-xs">
            <h3 className="text-lg font-bold border-b border-black pb-1 uppercase tracking-wider">VI. PENUTUP & PENGESAHAN</h3>
            <p className="text-justify">
              Demikian proposal kegiatan Peringatan HUT RI Ke-81 RT 12 Pelem Kidul ini kami sampaikan. Besar harapan kami agar semua warga dan donatur dapat bergotong royong memberikan dukungan baik moral maupun finansial demi terlaksananya kegiatan ini dengan sukses.
            </p>

            <div className="grid grid-cols-2 gap-12 text-center pt-8">
              <div className="space-y-16">
                <div>Yogyakarta, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                <div className="space-y-1">
                  <div className="font-bold underline">GABRIEL FERMY ASWINTA</div>
                  <div>Ketua Panitia</div>
                </div>
              </div>
              <div className="space-y-16">
                <div>Mengetahui,</div>
                <div className="space-y-1">
                  <div className="font-bold underline">[Nama Ketua RT]</div>
                  <div>Ketua RT 12 Pelem Kidul</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================== */}
      {/* MODE 2: RUNDOWN PEGANGAN PANITIA */}
      {/* =================================================== */}
      {printMode === 'internal_rundown' && (
        <div className="space-y-8">
          <div className="text-center space-y-2 border-b-2 border-black pb-4">
            <h1 className="text-2xl font-black uppercase tracking-wider">RUNDOWN PANDUAN KERJA PANITIA</h1>
            <h2 className="text-base font-bold italic">HUT RI Ke-81 RT 12 Pelem Kidul — Edisi Taktis Lapangan</h2>
            <p className="text-[10px] text-slate-500 font-serif">Dicetak pada tanggal: {new Date().toLocaleString('id-ID')} WIB</p>
          </div>

          <table className="w-full text-left border-collapse text-xs border border-black">
            <thead>
              <tr className="bg-slate-100 border-b border-black font-bold uppercase">
                <th className="py-2.5 px-3 border border-black w-24">Tanggal / Waktu</th>
                <th className="py-2.5 px-3 border border-black w-40">Nama Acara</th>
                <th className="py-2.5 px-3 border border-black w-24">Penanggung Jawab</th>
                <th className="py-2.5 px-3 border border-black">⚠️ Instruksi Kerja & Persiapan Teknis</th>
              </tr>
            </thead>
            <tbody>
              {rundownList.map((r, idx) => (
                <tr key={idx} className="border-b border-black align-top hover:bg-slate-55/10">
                  <td className="py-2.5 px-3 border border-black font-bold">
                    <span className="block text-[10px] text-slate-600">
                      {new Date(r.tanggal).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </span>
                    <span className="block text-xs font-black">{r.jam_mulai} - {r.jam_selesai}</span>
                  </td>
                  <td className="py-2.5 px-3 border border-black">
                    <span className="font-extrabold text-sm block">{r.kegiatan}</span>
                    <span className="text-[10px] text-slate-550 block italic mt-0.5">{r.keterangan || '-'}</span>
                  </td>
                  <td className="py-2.5 px-3 border border-black font-bold uppercase text-[9px]">
                    {r.seksi_pj && r.seksi_pj.length > 0 ? r.seksi_pj.join(', ') : 'Belum Ditunjuk'}
                  </td>
                  <td className="py-2.5 px-3 border border-black text-slate-900 bg-slate-50 font-medium">
                    {r.instruksi_internal || (
                      <span className="text-slate-400 italic">Tidak ada instruksi khusus. Siap siaga di lapangan.</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="p-4 border border-black rounded-lg text-xs space-y-2 mt-8">
            <h4 className="font-black uppercase tracking-wider text-center">Catatan Koordinasi Lapangan:</h4>
            <ol className="list-decimal pl-5 space-y-1 text-slate-800">
              <li>Semua seksi wajib standby dengan HT/alat komunikasi di area minimal **30 menit** sebelum poin acara dimulai.</li>
              <li>Perubahan mendadak akibat kondisi cuaca atau kendala teknis akan langsung diumumkan oleh Ketua Panitia/Seksi Acara.</li>
              <li>Pastikan kebersihan lapangan setelah sesi acara selesai adalah tanggung jawab bersama seluruh panitia.</li>
            </ol>
          </div>
        </div>
      )}

    </div>
  );
}
