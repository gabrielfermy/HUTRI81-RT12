import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  warga: { id: string; nama: string; blok: string; nominal_iuran: number } | null;
  onClose: () => void;
  onSave: (id: string, nominal: number) => Promise<void>;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, warga, onClose, onSave }) => {
  const [nominal, setNominal] = useState(50000);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (warga) {
      setNominal(warga.nominal_iuran || 0);
    }
  }, [warga]);

  if (!isOpen || !warga) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      await onSave(warga.id, nominal);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white">Pencatatan Pembayaran Iuran</h3>
          <p className="text-[10px] text-slate-500">Sesuaikan nominal kontribusi iuran atau sumbangan sukarela warga.</p>
        </div>
        
        <div className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl space-y-1">
          <span className="block text-[9px] text-slate-500 font-bold uppercase tracking-wide">Nama Warga / Blok</span>
          <span className="block text-xs text-white font-bold">{warga.nama}</span>
          <span className="block text-[10px] text-slate-400 font-semibold">{warga.blok}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              Nominal Pembayaran Diterima (Rp)
            </label>
            <input
              type="number"
              required
              value={nominal}
              onChange={(e) => setNominal(Number(e.target.value))}
              placeholder="0"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-sm text-white font-extrabold text-right focus:outline-none focus:border-red-500 tracking-wide"
            />
            <span className="block text-[10px] text-slate-500 font-medium italic mt-1 leading-relaxed">
              *Masukkan nominal pembayaran (standar Rp 50.000). Ketik 0 atau kosongkan untuk menyetel kembali status warga menjadi Belum Membayar.
            </span>
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-800 hover:bg-slate-950 rounded-xl text-xs text-slate-400 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-600/10 disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Pembayaran'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
