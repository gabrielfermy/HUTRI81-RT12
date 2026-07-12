'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function PrintLPJ() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: wData } = await supabase.from('warga').select('*').order('nama', { ascending: true });
        const { data: sData } = await supabase.from('sponsorship').select('*').order('nominal', { ascending: false });
        const { data: eData } = await supabase.from('pengeluaran').select('*').order('tanggal_pembelian', { ascending: true });
        const { data: pData } = await supabase.from('panitia').select('*').order('nama', { ascending: true });
        const { data: rData } = await supabase.from('rundown').select('*').order('tanggal', { ascending: true }).order('jam_mulai', { ascending: true });

        setData({
          warga: wData || [],
          sponsor: sData || [],
          pengeluaran: eData || [],
          panitia: pData || [],
          rundown: rData || []
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center">Menyiapkan Dokumen LPJ Akhir...</div>;
  }

  const { warga, sponsor, pengeluaran, panitia, rundown } = data;

  const totalIuran = warga.filter((w: any) => w.is_paid).reduce((sum: number, w: any) => sum + Number(w.nominal_iuran), 0);
  const totalSponsor = sponsor.reduce((sum: number, s: any) => sum + Number(s.nominal), 0);
  const totalPemasukan = totalIuran + totalSponsor;

  const totalPengeluaran = pengeluaran.reduce((sum: number, e: any) => sum + Number(e.nominal_riil), 0);
  const saldoAkhir = totalPemasukan - totalPengeluaran;

  const ketua = panitia.find((p: any) => p.jabatan === 'Ketua Panitia') || { nama: '..........................' };
  const sekretaris = panitia.find((p: any) => p.jabatan === 'Sekretaris') || { nama: '..........................' };
  
  // Create a unique page break component for print
  const PageBreak = () => <div className="break-before-page mt-12 mb-12 border-t-2 border-dashed border-gray-300 print:border-none print:mt-0 print:mb-0"></div>;

  return (
    <div className="bg-white min-h-screen p-8 text-black" style={{ fontFamily: 'Times New Roman, serif', lineHeight: '1.5' }}>
      <div className="max-w-4xl mx-auto">
        
        {/* Cover Page */}
        <div className="text-center min-h-[80vh] flex flex-col justify-center items-center">
          <h1 className="text-3xl font-black uppercase tracking-widest mb-4">Laporan Pertanggungjawaban (LPJ)</h1>
          <h2 className="text-2xl font-bold uppercase mb-12">Panitia Peringatan HUT RI ke-81<br/>Rukun Tetangga 12 Pelem Kidul</h2>
          
          <div className="w-48 h-48 border-4 border-black rounded-full flex items-center justify-center mb-12">
            <span className="text-4xl font-black">HUT RI 81</span>
          </div>

          <h3 className="text-xl font-bold mb-2">Tahun 2026</h3>
          <p className="text-md italic">Disusun Secara Otomatis oleh Sistem Kepanitiaan RT 12</p>
          <p className="text-sm mt-4">Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <PageBreak />

        {/* Lembar Pengesahan */}
        <div className="min-h-[80vh]">
          <h3 className="text-center text-xl font-bold uppercase mb-8 underline">Lembar Pengesahan</h3>
          <p className="mb-4 text-justify indent-8">
            Puji syukur kami panjatkan ke hadirat Tuhan Yang Maha Esa, atas terselenggaranya seluruh rangkaian acara Peringatan Hari Ulang Tahun Kemerdekaan Republik Indonesia ke-81 di lingkungan RT 12 Pelem Kidul.
          </p>
          <p className="mb-8 text-justify indent-8">
            Laporan Pertanggungjawaban (LPJ) ini disusun sebagai bentuk transparansi dan tanggung jawab panitia kepada seluruh warga dan donatur atas pelaksanaan kegiatan dan pengelolaan dana yang telah diamanatkan. Dokumen ini memuat laporan pelaksanaan acara, rekapitulasi keuangan, dan susunan kepanitiaan.
          </p>
          
          <p className="mb-12 text-right">Bantul, {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          
          <div className="flex justify-between mt-12 mb-20 text-center">
            <div className="w-1/3">
              <p>Ketua Panitia,</p>
              <br/><br/><br/><br/>
              <p className="font-bold underline">{ketua.nama}</p>
            </div>
            <div className="w-1/3">
              <p>Sekretaris,</p>
              <br/><br/><br/><br/>
              <p className="font-bold underline">{sekretaris.nama}</p>
            </div>
          </div>
          <div className="text-center mt-12">
            <p>Mengetahui,</p>
            <p>Ketua RT 12 Pelem Kidul</p>
            <br/><br/><br/><br/>
            <p className="font-bold underline">Bapak Suparjo</p>
          </div>
        </div>

        <PageBreak />

        {/* Laporan Kegiatan */}
        <div>
          <h3 className="text-lg font-bold uppercase mb-4">A. Laporan Pelaksanaan Kegiatan (Rundown)</h3>
          <p className="mb-4 text-sm">Berikut adalah seluruh daftar kegiatan yang telah direncanakan dan dilaksanakan oleh panitia:</p>
          
          <table className="w-full border-collapse border border-black text-sm mb-12">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-black p-2 text-center w-8">No</th>
                <th className="border border-black p-2 text-left w-32">Tanggal</th>
                <th className="border border-black p-2 text-center w-24">Waktu</th>
                <th className="border border-black p-2 text-left">Nama Kegiatan</th>
                <th className="border border-black p-2 text-left">Kategori</th>
              </tr>
            </thead>
            <tbody>
              {rundown.map((r: any, idx: number) => (
                <tr key={idx}>
                  <td className="border border-black p-2 text-center">{idx + 1}</td>
                  <td className="border border-black p-2">{r.tanggal}</td>
                  <td className="border border-black p-2 text-center">{r.jam_mulai} - {r.jam_selesai}</td>
                  <td className="border border-black p-2">{r.kegiatan}</td>
                  <td className="border border-black p-2">{r.kategori}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 className="text-lg font-bold uppercase mb-4 mt-8">B. Laporan Partisipasi Panitia</h3>
          <p className="mb-4 text-sm">Berikut adalah daftar panitia yang telah bekerja keras menyukseskan acara:</p>
          
          <table className="w-full border-collapse border border-black text-sm mb-12">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-black p-2 text-center w-8">No</th>
                <th className="border border-black p-2 text-left">Nama Lengkap</th>
                <th className="border border-black p-2 text-left w-48">Seksi</th>
                <th className="border border-black p-2 text-left w-48">Jabatan / Level</th>
              </tr>
            </thead>
            <tbody>
              {panitia.map((p: any, idx: number) => (
                <tr key={idx}>
                  <td className="border border-black p-2 text-center">{idx + 1}</td>
                  <td className="border border-black p-2">{p.nama}</td>
                  <td className="border border-black p-2">{p.seksi}</td>
                  <td className="border border-black p-2">{p.jabatan || p.level}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <PageBreak />

        {/* Laporan Keuangan Final */}
        <div>
          <h3 className="text-lg font-bold uppercase mb-4">C. Laporan Keuangan Final</h3>
          <p className="mb-4 text-sm">Rekapitulasi seluruh arus kas masuk dan keluar selama kepanitiaan HUT RI ke-81.</p>
          
          <div className="mb-8">
            <h4 className="font-bold text-md mb-2">C.1 Ringkasan Saldo Akhir</h4>
            <table className="w-full border-collapse border border-black text-sm">
              <tbody>
                <tr>
                  <td className="border border-black p-2 w-1/2">Total Pemasukan Seluruhnya</td>
                  <td className="border border-black p-2 text-right font-bold text-green-700">Rp {totalPemasukan.toLocaleString('id-ID')}</td>
                </tr>
                <tr>
                  <td className="border border-black p-2">Total Pengeluaran Seluruhnya</td>
                  <td className="border border-black p-2 text-right font-bold text-red-700">Rp {totalPengeluaran.toLocaleString('id-ID')}</td>
                </tr>
                <tr className="bg-gray-200">
                  <td className="border border-black p-2 font-bold uppercase">Sisa Saldo Kas (Diserahkan ke Kas RT)</td>
                  <td className="border border-black p-2 text-right font-black text-lg">Rp {saldoAkhir.toLocaleString('id-ID')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mb-8">
            <h4 className="font-bold text-md mb-2">C.2 Rekap Pengeluaran Riil (Detail Belanja)</h4>
            <table className="w-full border-collapse border border-black text-xs">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-black p-2 text-center w-8">No</th>
                  <th className="border border-black p-2 text-left w-24">Tanggal</th>
                  <th className="border border-black p-2 text-left">Item Belanja / Keterangan</th>
                  <th className="border border-black p-2 text-left w-32">PIC (Seksi)</th>
                  <th className="border border-black p-2 text-right w-32">Nominal</th>
                </tr>
              </thead>
              <tbody>
                {pengeluaran.map((e: any, idx: number) => (
                  <tr key={idx}>
                    <td className="border border-black p-2 text-center">{idx + 1}</td>
                    <td className="border border-black p-2">{e.tanggal_pembelian}</td>
                    <td className="border border-black p-2">{e.item_belanja}</td>
                    <td className="border border-black p-2">{e.pic_nama}</td>
                    <td className="border border-black p-2 text-right">Rp {Number(e.nominal_riil).toLocaleString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs italic text-center mt-12">*** Akhir Laporan Pertanggungjawaban ***</p>

        </div>

        {/* Print Button */}
        <div className="mt-12 text-center print:hidden mb-20">
          <button 
            onClick={() => window.print()}
            className="px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors shadow-lg"
          >
            Cetak LPJ Sekarang (PDF)
          </button>
        </div>

      </div>
    </div>
  );
}
