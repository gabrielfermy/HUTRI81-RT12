import React, { useState } from 'react';
import { Trash2, Edit } from 'lucide-react';

interface SponsorshipTabProps {
  sponsorList: any[];
  onAddSponsor: (nama: string, tipe: string, nominal: number, keterangan: string) => Promise<void>;
  onEditSponsor: (id: string, nama: string, tipe: string, nominal: number, keterangan: string) => Promise<void>;
  onDeleteSponsor: (id: string, nama: string) => Promise<void>;
}

export const SponsorshipTab: React.FC<SponsorshipTabProps> = ({
  sponsorList,
  onAddSponsor,
  onEditSponsor,
  onDeleteSponsor
}) => {
  const [spNama, setSpNama] = useState('');
  const [spTipe, setSpTipe] = useState('Platinum');
  const [spNominal, setSpNominal] = useState(0);
  const [spKeterangan, setSpKeterangan] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spNama || submitting) return;

    setSubmitting(true);
    try {
      if (editingId) {
        await onEditSponsor(editingId, spNama, spTipe, spNominal, spKeterangan);
        setEditingId(null);
      } else {
        await onAddSponsor(spNama, spTipe, spNominal, spKeterangan);
      }
      setSpNama('');
      setSpNominal(0);
      setSpKeterangan('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (sponsor: any) => {
    setEditingId(sponsor.id);
    setSpNama(sponsor.nama);
    setSpTipe(sponsor.tipe);
    setSpNominal(Number(sponsor.nominal || 0));
    setSpKeterangan(sponsor.keterangan || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setSpNama('');
    setSpNominal(0);
    setSpKeterangan('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
      {/* Add/Edit Sponsor Form */}
      <div className="bg-slate-100/30 border border-slate-200 rounded-2xl p-6 space-y-6 h-fit">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            {editingId ? 'Edit Pemasukan / Sponsor' : 'Input Pemasukan / Sponsor'}
          </h3>
          <p className="text-[10px] text-slate-500">Mendaftarkan atau mengubah donatur, sponsor, kas internal, atau dana lainnya.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Sumber Dana / Nama Sponsor</label>
            <input
              type="text"
              required
              value={spNama}
              onChange={(e) => setSpNama(e.target.value)}
              placeholder="e.g. Kas RT 12 / Toko Bu Sri"
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Kategori Dana</label>
              <select
                value={spTipe}
                onChange={(e) => setSpTipe(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-red-500"
              >
                <option value="Kas Internal RT">Kas Internal RT</option>
                <option value="Pemasukan Lainnya">Pemasukan Lainnya</option>
                <option value="Platinum">Sponsor Platinum (Besar)</option>
                <option value="Gold">Sponsor Gold (Sedang)</option>
                <option value="Silver">Sponsor Silver (Kecil)</option>
                <option value="Donatur Warga">Donatur Warga</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Nominal Uang (Rp)</label>
              <input
                type="number"
                value={spNominal}
                onChange={(e) => setSpNominal(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500 text-right"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Keterangan Tambahan</label>
            <textarea
              rows={3}
              value={spKeterangan}
              onChange={(e) => setSpKeterangan(e.target.value)}
              placeholder="e.g. Dana sisa kas RT tahun lalu..."
              className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="flex gap-2">
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-all"
              >
                Batal
              </button>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="flex-[2] py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition-all disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : editingId ? 'Perbarui Pemasukan' : 'Simpan Pemasukan'}
            </button>
          </div>
        </form>
      </div>

      {/* Sponsors List View */}
      <div className="bg-slate-100/30 border border-slate-200 rounded-2xl p-6 lg:col-span-2 space-y-6">
        <h3 className="text-base font-bold text-slate-900">Daftar Sponsor Terdaftar</h3>
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-white border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Nama Sponsor</th>
                <th className="py-3 px-4 text-center">Kasta</th>
                <th className="py-3 px-4 text-right">Nominal</th>
                <th className="py-3 px-4 text-center">Keterangan Barang</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {sponsorList.map((s, idx) => (
                <tr key={idx} className="border-b border-slate-200 hover:bg-slate-100">
                  <td className="py-3 px-4 text-slate-900 font-bold">{s.nama}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      s.tipe === 'Platinum' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                      s.tipe === 'Gold' ? 'bg-slate-400/10 text-slate-350 border border-slate-400/20' :
                      s.tipe === 'Silver' ? 'bg-orange-600/10 text-orange-500 border border-orange-600/20' :
                      'bg-emerald-600/10 text-emerald-400 border border-emerald-600/20'
                    }`}>
                      {s.tipe}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-900">
                    Rp {Number(s.nominal).toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-xs italic">{s.keterangan || '-'}</td>
                  <td className="py-3 px-4 text-center flex items-center justify-center gap-1">
                    <button
                      onClick={() => startEdit(s)}
                      className="p-1.5 text-slate-650 hover:text-red-400 rounded-lg transition-colors"
                      title="Edit Sponsor"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDeleteSponsor(s.id, s.nama)}
                      className="p-1.5 text-slate-650 hover:text-red-400 rounded-lg transition-colors"
                      title="Hapus Sponsor"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {sponsorList.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500 italic">Belum ada donatur terdaftar.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
