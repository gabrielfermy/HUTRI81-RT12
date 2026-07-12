'use client';

import React from 'react';
import Link from 'next/link';
import { FileText, DollarSign, Users, Award, ShieldAlert, ArrowRight } from 'lucide-react';

export default function LaporanDashboard() {
  const reports = [
    {
      id: 'keuangan',
      title: 'Laporan Keuangan Berkala',
      description: 'Cetak rekapitulasi Pemasukan (Iuran & Sponsor) beserta Pengeluaran Riil saat ini. Cocok untuk update saat rapat rutin.',
      icon: DollarSign,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      href: '/kepanitiaan/laporan/print-keuangan'
    },
    {
      id: 'partisipasi',
      title: 'Laporan Partisipasi Warga',
      description: 'Cetak daftar seluruh warga RT 12 beserta status pelunasan Iuran Wajib dan partisipasi Bakti Sosial untuk keperluan door-to-door.',
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      href: '/kepanitiaan/laporan/print-partisipasi'
    },
    {
      id: 'lpj',
      title: 'LPJ (Laporan Pertanggungjawaban) Akhir',
      description: 'Cetak dokumen LPJ lengkap, formal, dan menyeluruh yang mencakup Laporan Keuangan Final, Pelaksanaan Kegiatan, dan Absensi Panitia.',
      icon: ShieldAlert,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      href: '/kepanitiaan/laporan/print-lpj'
    }
  ];

  return (
    <div className="flex-grow p-4 sm:p-8 space-y-6 sm:space-y-8 animate-fadeIn max-w-7xl mx-auto w-full">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Sistem Cetak Laporan & LPJ</h1>
        <p className="text-sm text-slate-500 font-medium max-w-2xl">
          Pusat pencetakan dokumen resmi kepanitiaan secara otomatis. Data yang ditarik adalah data realtime dari server database.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <div key={report.id} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-start space-x-4 mb-4">
                <div className={`p-3 rounded-xl ${report.bgColor} ${report.color} shrink-0`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">{report.title}</h3>
              </div>
              <p className="text-xs text-slate-500 flex-grow mb-6 leading-relaxed">
                {report.description}
              </p>
              <Link 
                href={report.href}
                target="_blank"
                className="inline-flex items-center justify-center w-full px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold transition-all mt-auto"
              >
                <FileText className="h-4 w-4 mr-2" />
                Preview & Cetak PDF
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
