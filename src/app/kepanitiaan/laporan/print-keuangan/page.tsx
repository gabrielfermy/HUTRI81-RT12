'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function PrintKeuangan() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: wData } = await supabase.from('warga').select('*').order('nama', { ascending: true });
        const { data: sData } = await supabase.from('sponsorship').select('*').order('nominal', { ascending: false });
        const { data: eData } = await supabase.from('pengeluaran').select('*').order('tanggal_pembelian', { ascending: true });
        const { data: rabData } = await supabase.from('rab').select('*');

        setData({
          warga: wData || [],
          sponsor: sData || [],
          pengeluaran: eData || [],
          rab: rabData || []
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
    return <div className="p-8 text-center">Menyiapkan Laporan Keuangan...</div>;
  }

  const { warga, sponsor, pengeluaran, rab } = data;

  const totalIuran = warga.filter((w: any) => w.is_paid).reduce((sum: number, w: any) => sum + Number(w.nominal_iuran), 0);
  const totalSponsor = sponsor.reduce((sum: number, s: any) => sum + Number(s.nominal), 0);
  const totalPemasukan = totalIuran + totalSponsor;

  const totalPengeluaran = pengeluaran.reduce((sum: number, e: any) => sum + Number(e.nominal_riil), 0);
  const saldoAkhir = totalPemasukan - totalPengeluaran;
  
  const totalTargetRab = rab.reduce((sum: number, r: any) => sum + Number(r.total_idr || r.kuantitas * r.harga_satuan), 0);

  return (
    <div className="bg-white min-h-screen p-8 text-black" style={{ fontFamily: 'Times New Roman, serif' }}>
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center border-b-2 border-black pb-4 mb-6">
          <h1 className="text-xl font-bold uppercase tracking-wide">Panitia Peringatan HUT RI ke-81</h1>
          <h2 className="text-lg font-bold">Rukun Tetangga 12 Pelem Kidul</h2>
          <p className="text-sm">Baturetno, Banguntapan, Bantul, DIY 55197</p>
        </div>

        <h3 className="text-center text-lg font-bold uppercase underline mb-6">Laporan Keuangan Berkala</h3>
        
        <div className="mb-4 text-sm flex justify-between">
          <p><strong>Tanggal Cetak:</strong> {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p><strong>Status RAB:</strong> Pengeluaran {(totalPengeluaran / totalTargetRab * 100).toFixed(1)}% dari Anggaran</p>
        </div>

        {/* Ringkasan */}
        <div className="mb-8">
          <h4 className="font-bold text-md mb-2">A. Ringkasan Kas</h4>
          <table className="w-full border-collapse border border-black text-sm">
            <tbody>
              <tr>
                <td className="border border-black p-2 w-1/2">Total Pemasukan (Iuran + Lainnya)</td>
                <td className="border border-black p-2 text-right font-bold text-green-700">Rp {totalPemasukan.toLocaleString('id-ID')}</td>
              </tr>
              <tr>
                <td className="border border-black p-2">Total Pengeluaran Riil</td>
                <td className="border border-black p-2 text-right font-bold text-red-700">Rp {totalPengeluaran.toLocaleString('id-ID')}</td>
              </tr>
              <tr className="bg-gray-100">
                <td className="border border-black p-2 font-bold">SALDO KAS SAAT INI</td>
                <td className="border border-black p-2 text-right font-bold text-lg">Rp {saldoAkhir.toLocaleString('id-ID')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Pemasukan Detail */}
        <div className="mb-8 flex space-x-6">
          <div className="w-1/2">
            <h4 className="font-bold text-md mb-2">B. Rincian Pemasukan Ekstra</h4>
            <table className="w-full border-collapse border border-black text-xs">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-black p-1 text-left">Sumber Dana</th>
                  <th className="border border-black p-1 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody>
                {sponsor.map((s: any, idx: number) => (
                  <tr key={idx}>
                    <td className="border border-black p-1">{s.nama} ({s.tipe})</td>
                    <td className="border border-black p-1 text-right">Rp {Number(s.nominal).toLocaleString('id-ID')}</td>
                  </tr>
                ))}
                {sponsor.length === 0 && <tr><td colSpan={2} className="border border-black p-1 text-center italic">Nihil</td></tr>}
              </tbody>
            </table>
          </div>
          
          <div className="w-1/2">
            <h4 className="font-bold text-md mb-2">C. Rekapitulasi Iuran Warga</h4>
            <table className="w-full border-collapse border border-black text-xs">
              <tbody>
                <tr>
                  <td className="border border-black p-1 w-3/4">Warga Sudah Lunas</td>
                  <td className="border border-black p-1 text-center font-bold">{warga.filter((w:any) => w.is_paid).length} KK</td>
                </tr>
                <tr>
                  <td className="border border-black p-1">Warga Belum Lunas</td>
                  <td className="border border-black p-1 text-center font-bold text-red-600">{warga.filter((w:any) => !w.is_paid).length} KK</td>
                </tr>
                <tr className="bg-gray-100">
                  <td className="border border-black p-1 font-bold">Total Pemasukan Iuran</td>
                  <td className="border border-black p-1 text-right font-bold text-green-700">Rp {totalIuran.toLocaleString('id-ID')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Pengeluaran Detail */}
        <div className="mb-8">
          <h4 className="font-bold text-md mb-2">D. Rincian Pengeluaran</h4>
          <table className="w-full border-collapse border border-black text-xs">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-black p-1 text-center w-8">No</th>
                <th className="border border-black p-1 text-left">Tanggal</th>
                <th className="border border-black p-1 text-left">Item Belanja / Keterangan</th>
                <th className="border border-black p-1 text-left">Seksi (PIC)</th>
                <th className="border border-black p-1 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody>
              {pengeluaran.map((e: any, idx: number) => (
                <tr key={idx}>
                  <td className="border border-black p-1 text-center">{idx + 1}</td>
                  <td className="border border-black p-1">{e.tanggal_pembelian}</td>
                  <td className="border border-black p-1">{e.item_belanja}</td>
                  <td className="border border-black p-1">{e.pic_nama}</td>
                  <td className="border border-black p-1 text-right">Rp {Number(e.nominal_riil).toLocaleString('id-ID')}</td>
                </tr>
              ))}
              {pengeluaran.length === 0 && (
                <tr>
                  <td colSpan={5} className="border border-black p-2 text-center italic">Belum ada pengeluaran yang tercatat.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Print Button */}
        <div className="mt-12 text-center print:hidden">
          <button 
            onClick={() => window.print()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg"
          >
            Cetak Dokumen Sekarang (PDF)
          </button>
        </div>

      </div>
    </div>
  );
}
