import React from 'react';
import Link from 'next/link';
import { Users, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';

interface WargaTabProps {
  wargaList: any[];
  onOpenPaymentModal: (warga: any) => void;
}

export const WargaTab: React.FC<WargaTabProps> = ({ wargaList, onOpenPaymentModal }) => {
  const lunasCount = wargaList.filter(w => w.is_paid).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Redirect / CTA Banner */}
      <div className="bg-gradient-to-r from-red-950/20 via-slate-900/40 to-slate-900/20 border border-red-500/20 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1.5">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-4.5 w-4.5 text-red-500" />
            <span>Manajemen Pembayaran Iuran Terpusat</span>
          </h4>
          <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
            Pencatatan pembayaran iuran warga kini mendukung nominal kustom (membayar kurang dari Rp 50.000 bagi yang tidak mampu atau menyumbang lebih sebagai donatur). Silakan kelola secara lengkap di halaman Manajemen Warga.
          </p>
        </div>
        <Link
          href="/kepanitiaan/warga"
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-red-600/10 shrink-0"
        >
          <span>Kelola Warga & Iuran</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="bg-slate-100/30 border border-slate-200 rounded-2xl p-6 space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Ikhtisar Status Pembayaran Warga</h3>
            <p className="text-xs text-slate-500 mt-0.5">Daftar warga beserta status dan nominal kontribusi terdata. Klik kartu untuk mencatat pembayaran.</p>
          </div>
          <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-bold">
            {lunasCount} / {wargaList.length} KK Lunas
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {wargaList.map((w) => (
            <div
              key={w.id}
              onClick={() => onOpenPaymentModal(w)}
              className={`p-4 rounded-2xl border flex flex-col justify-between cursor-pointer select-none transition-all hover:scale-[1.01] ${
                w.is_paid
                  ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-400'
                  : 'bg-white/60 border-slate-200 text-slate-500 hover:border-slate-200'
              }`}
            >
              <div>
                <div className="font-bold text-slate-900 truncate">{w.nama}</div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">{w.blok}</div>
              </div>
              <div className="flex justify-between items-center mt-4 pt-2 border-t border-slate-200">
                <span className="text-xs font-extrabold text-slate-500">Rp {Number(w.nominal_iuran).toLocaleString('id-ID')}</span>
                {w.is_paid ? (
                  <CheckCircle className="h-5 w-5 text-emerald-500 animate-pulse" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-slate-700" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

