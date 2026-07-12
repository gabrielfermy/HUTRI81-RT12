'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function PrintPartisipasi() {
  const [warga, setWarga] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const { data } = await supabase.from('warga').select('*').order('nama', { ascending: true });
        if (data) setWarga(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center">Menyiapkan Laporan Partisipasi...</div>;
  }

  const totalWarga = warga.length;
  const lunasWarga = warga.filter(w => w.is_paid).length;
  const belumLunasWarga = totalWarga - lunasWarga;
  const partisipasiBaksos = warga.filter(w => w.is_baksos).length;

  return (
    <div className="bg-white min-h-screen p-8 text-black" style={{ fontFamily: 'Times New Roman, serif' }}>
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center border-b-2 border-black pb-4 mb-6">
          <h1 className="text-xl font-bold uppercase tracking-wide">Panitia Peringatan HUT RI ke-81</h1>
          <h2 className="text-lg font-bold">Rukun Tetangga 12 Pelem Kidul</h2>
          <p className="text-sm">Baturetno, Banguntapan, Bantul, DIY 55197</p>
        </div>

        <h3 className="text-center text-lg font-bold uppercase underline mb-6">Laporan Status Partisipasi Warga</h3>
        
        <div className="mb-4 text-sm flex justify-between">
          <p><strong>Tanggal Cetak:</strong> {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <div className="text-right">
            <p><strong>Total KK:</strong> {totalWarga}</p>
            <p><strong>Lunas Iuran:</strong> {lunasWarga} KK</p>
            <p><strong>Bakti Sosial:</strong> {partisipasiBaksos} KK</p>
          </div>
        </div>

        {/* Tabel Data Warga */}
        <table className="w-full border-collapse border border-black text-xs">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-black p-2 text-center w-8">No</th>
              <th className="border border-black p-2 text-left">Nama Kepala Keluarga (KK)</th>
              <th className="border border-black p-2 text-left w-32">Nomor Telepon</th>
              <th className="border border-black p-2 text-center w-24">Iuran Wajib (Rp)</th>
              <th className="border border-black p-2 text-center w-24">Status Iuran</th>
              <th className="border border-black p-2 text-center w-24">Ikut Baksos?</th>
            </tr>
          </thead>
          <tbody>
            {warga.map((w, idx) => (
              <tr key={w.id} className={!w.is_paid ? 'bg-red-50/50' : ''}>
                <td className="border border-black p-1 text-center">{idx + 1}</td>
                <td className="border border-black p-1 font-bold">{w.nama}</td>
                <td className="border border-black p-1">{w.no_telepon || '-'}</td>
                <td className="border border-black p-1 text-right">{w.nominal_iuran ? Number(w.nominal_iuran).toLocaleString('id-ID') : '-'}</td>
                <td className="border border-black p-1 text-center font-bold">
                  {w.is_paid ? <span className="text-green-700">LUNAS</span> : <span className="text-red-600">BELUM LUNAS</span>}
                </td>
                <td className="border border-black p-1 text-center font-bold">
                  {w.is_baksos ? 'YA' : 'TIDAK'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
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
