import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface EditWargaModalProps {
  isOpen: boolean;
  warga: { id: string; nama: string; blok: string } | null;
  onClose: () => void;
  onSave: (id: string, nama: string, blok: string) => Promise<void>;
}

export const EditWargaModal: React.FC<EditWargaModalProps> = ({ isOpen, warga, onClose, onSave }) => {
  const [nama, setNama] = useState('');
  const [blok, setBlok] = useState('Blok A');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (warga) {
      setNama(warga.nama);
      setBlok(warga.blok);
    }
  }, [warga]);

  if (!isOpen || !warga) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim() || submitting) return;

    setSubmitting(true);
    try {
      await onSave(warga.id, nama, blok);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-100 border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-900"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900">Sunting Data Kepala Keluarga</h3>
          <p className="text-[10px] text-slate-500">Sesuaikan profil kepala keluarga yang terdaftar.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Nama Kepala Keluarga</label>
            <input
              type="text"
              required
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Blok Rumah</label>
            <select
              value={blok}
              onChange={(e) => setBlok(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-350 focus:outline-none focus:border-red-500"
            >
              <option value="Blok A">Blok A</option>
              <option value="Blok B">Blok B</option>
              <option value="Blok C">Blok C</option>
              <option value="Blok D">Blok D</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 hover:bg-white rounded-xl text-xs text-slate-500 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition-all disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

