import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, Layers } from 'lucide-react';

interface Seksi {
  id: string;
  nama: string;
  deskripsi: string;
  mempunyai_sub_koordinator: boolean;
  kategori: string;
}

interface SeksiTabProps {
  seksiList: Seksi[];
  onAddSeksi: (nama: string, deskripsi: string, mempunyaiSub: boolean, kategori: string) => Promise<void>;
  onEditSeksi: (id: string, nama: string, deskripsi: string, mempunyaiSub: boolean, kategori: string) => Promise<void>;
  onDeleteSeksi: (id: string, nama: string) => Promise<void>;
}

export const SeksiTab: React.FC<SeksiTabProps> = ({
  seksiList,
  onAddSeksi,
  onEditSeksi,
  onDeleteSeksi
}) => {
  const [nama, setNama] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [mempunyaiSub, setMempunyaiSub] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Edit inline states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNama, setEditNama] = useState('');
  const [editDeskripsi, setEditDeskripsi] = useState('');
  const [editMempunyaiSub, setEditMempunyaiSub] = useState(false);
  const [editKategori, setEditKategori] = useState('Seksi');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim() || submitting) return;

    setSubmitting(true);
    try {
      // Custom added structures are always 'Seksi' (Pengurus Harian)
      await onAddSeksi(nama.trim(), deskripsi.trim(), mempunyaiSub, 'Seksi');
      setNama('');
      setDeskripsi('');
      setMempunyaiSub(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (s: Seksi) => {
    setEditingId(s.id);
    setEditNama(s.nama);
    setEditDeskripsi(s.deskripsi || '');
    setEditMempunyaiSub(s.mempunyai_sub_koordinator);
    setEditKategori(s.kategori || 'Seksi');
  };

  const handleSaveEdit = async (id: string) => {
    if (!editNama.trim()) return;
    try {
      await onEditSeksi(id, editNama.trim(), editDeskripsi.trim(), editMempunyaiSub, editKategori);
      setEditingId(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
      {/* Form Add Struktur */}
      <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 space-y-6 h-fit">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Plus className="h-4.5 w-4.5 text-red-500" />
            <span>Tambah Seksi Baru</span>
          </h3>
          <p className="text-[10px] text-slate-500">Mendaftarkan bidang / divisi baru ke dalam kepanitiaan.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Nama Bidang / Divisi</label>
            <input
              type="text"
              required
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="e.g. Publikasi & Dekorasi"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Deskripsi</label>
            <textarea
              rows={2}
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="e.g. Mengurus obor, bendera, panggung, baliho..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Option: has sub-coordinators */}
          <div className="flex items-center space-x-2.5 p-3.5 bg-slate-950 rounded-xl border border-slate-850 cursor-pointer select-none">
            <input
              type="checkbox"
              id="mempunyaiSub"
              checked={mempunyaiSub}
              onChange={(e) => setMempunyaiSub(e.target.checked)}
              className="rounded border-slate-800 bg-slate-900 text-red-500 focus:ring-0"
            />
            <label htmlFor="mempunyaiSub" className="text-[11px] text-slate-350 font-bold cursor-pointer leading-tight">
              Mempunyai Sub Koordinator
              <span className="block text-[9px] text-slate-550 font-medium mt-0.5 font-sans leading-relaxed">
                Centang jika seksi memiliki sub-divisi/koordinator sesi (contoh: Sie Acara Pagi & Sore).
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition-all disabled:opacity-50"
          >
            {submitting ? 'Menyimpan...' : 'Simpan Struktur Baru'}
          </button>
        </form>
      </div>

      {/* List View */}
      <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 lg:col-span-2 space-y-6">
        <h3 className="text-base font-bold text-white">Daftar Struktur Organisasi</h3>
        <div className="grid grid-cols-1 gap-4">
          {seksiList.map((s) => {
            const isEditing = editingId === s.id;
            const isSystemReserved = s.nama === 'Inti' || s.nama === 'BOD' || s.kategori === 'Inti' || s.kategori === 'BOD';
            return (
              <div
                key={s.id}
                className="bg-slate-950 border border-slate-850 rounded-2xl p-4 flex flex-col gap-4 hover:border-slate-800 transition-all"
              >
                {isEditing ? (
                  /* Edit Mode */
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-1">
                        <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wide block mb-1">Nama Bidang</label>
                        <input
                          type="text"
                          required
                          value={editNama}
                          disabled={isSystemReserved}
                          onChange={(e) => setEditNama(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wide block mb-1">Deskripsi</label>
                        <input
                          type="text"
                          value={editDeskripsi}
                          onChange={(e) => setEditDeskripsi(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>

                    {!isSystemReserved && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div>
                          <label className="text-[9px] text-slate-550 font-bold uppercase block mb-1">Kategori</label>
                          <select
                            value={editKategori}
                            onChange={(e) => setEditKategori(e.target.value)}
                            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1 text-xs text-white"
                          >
                            <option value="Seksi">Pengurus Harian</option>
                            <option value="BOD">Board of Directors</option>
                            <option value="Inti">Panitia Inti</option>
                          </select>
                        </div>
                        {editKategori === 'Seksi' && (
                          <div className="flex items-center space-x-2 pt-4">
                            <input
                              type="checkbox"
                              id={`editSub-${s.id}`}
                              checked={editMempunyaiSub}
                              onChange={(e) => setEditMempunyaiSub(e.target.checked)}
                              className="rounded border-slate-800 bg-slate-900 text-red-500 focus:ring-0 text-xs"
                            />
                            <label htmlFor={`editSub-${s.id}`} className="text-[10px] text-slate-400 font-bold">
                              Mempunyai Sub Koordinator
                            </label>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex justify-end space-x-2 pt-2 border-t border-slate-900">
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 px-3 bg-slate-900 text-slate-450 hover:text-white border border-slate-800 rounded-lg text-[10px] flex items-center gap-1 font-bold"
                      >
                        <X className="h-3.5 w-3.5" /> Batal
                      </button>
                      <button
                        onClick={() => handleSaveEdit(s.id)}
                        className="p-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] flex items-center gap-1 font-bold"
                      >
                        <Check className="h-3.5 w-3.5" /> Simpan
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Display Mode */
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <h4 className="text-sm font-bold text-white">{s.nama}</h4>
                        {s.kategori === 'BOD' && (
                          <span className="text-[8px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-black uppercase">
                            BOD / Pengawas
                          </span>
                        )}
                        {s.kategori === 'Inti' && (
                          <span className="text-[8px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-black uppercase">
                            Panitia Inti
                          </span>
                        )}
                        {s.kategori === 'Seksi' && (
                          <span className="text-[8px] bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase">
                            Pengurus Harian
                          </span>
                        )}
                        {s.mempunyai_sub_koordinator && (
                          <span className="text-[8px] bg-red-500/5 text-red-400 border border-red-500/10 px-2 py-0.5 rounded-full font-bold uppercase">
                            Ada Sub-Koord
                          </span>
                        )}
                        {isSystemReserved && (
                          <span className="text-[8px] bg-slate-900 text-slate-500 border border-slate-800 px-2 py-0.5 rounded-full font-bold uppercase">
                            Sistem Utama
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{s.deskripsi || 'Tidak ada deskripsi.'}</p>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      <button
                        onClick={() => handleStartEdit(s)}
                        title="Edit Struktur"
                        className="p-2 border border-slate-850 hover:border-slate-800 text-slate-500 hover:text-blue-400 rounded-lg transition-colors"
                      >
                        <Layers className="h-4 w-4" />
                      </button>
                      {!isSystemReserved && (
                        <button
                          onClick={() => onDeleteSeksi(s.id, s.nama)}
                          title="Hapus Bidang"
                          className="p-2 border border-slate-850 hover:border-slate-800 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
