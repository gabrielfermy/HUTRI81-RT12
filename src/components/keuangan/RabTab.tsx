import React, { useState } from 'react';

interface RabTabProps {
  rabList: any[];
  onAddRab: (kategori: string, item: string, kuantitas: number, satuan: string, hargaSatuan: number) => Promise<void>;
}

export const RabTab: React.FC<RabTabProps> = ({ rabList, onAddRab }) => {
  const [rabKategori, setRabKategori] = useState('Hadiah Lomba');
  const [rabItem, setRabItem] = useState('');
  const [rabKuantitas, setRabKuantitas] = useState(1);
  const [rabSatuan, setRabSatuan] = useState('Pcs');
  const [rabHargaSatuan, setRabHargaSatuan] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rabItem || !rabHargaSatuan || submitting) return;

    setSubmitting(true);
    try {
      await onAddRab(rabKategori, rabItem, rabKuantitas, rabSatuan, rabHargaSatuan);
      setRabItem('');
      setRabKuantitas(1);
      setRabSatuan('Pcs');
      setRabHargaSatuan(0);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
      {/* Add RAB Form */}
      <div className="bg-slate-100/30 border border-slate-200 rounded-2xl p-6 space-y-6 h-fit">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Tambah Target Belanja (RAB)</h3>
          <p className="text-[10px] text-slate-500">Mendaftarkan kebutuhan pengeluaran terencana rapat.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Kategori Pos Belanja</label>
            <select
              value={rabKategori}
              onChange={(e) => setRabKategori(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-primary-500"
            >
              <option value="Hadiah Lomba">Hadiah Lomba</option>
              <option value="Konsumsi Puncak">Konsumsi Puncak</option>
              <option value="Perlengkapan">Perlengkapan</option>
              <option value="Gotong Royong">Gotong Royong</option>
              <option value="Dana Cadangan">Dana Cadangan</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Nama Item Pekerjaan</label>
            <input
              type="text"
              required
              value={rabItem}
              onChange={(e) => setRabItem(e.target.value)}
              placeholder="e.g. Sewa Panggung Utama & Sound System"
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-primary-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Kuantitas</label>
              <input
                type="number"
                required
                value={rabKuantitas}
                onChange={(e) => setRabKuantitas(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-primary-500 text-center"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Satuan</label>
              <input
                type="text"
                required
                value={rabSatuan}
                onChange={(e) => setRabSatuan(e.target.value)}
                placeholder="Set / Pcs / Pax"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-primary-500 text-center"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Harga Satuan (Rp)</label>
            <input
              type="number"
              required
              value={rabHargaSatuan}
              onChange={(e) => setRabHargaSatuan(Number(e.target.value))}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-primary-500 text-right"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs rounded-xl transition-all disabled:opacity-50"
          >
            {submitting ? 'Menyimpan...' : 'Simpan Target RAB'}
          </button>
        </form>
      </div>

      {/* RAB List View */}
      <div className="bg-slate-100/30 border border-slate-200 rounded-2xl p-6 lg:col-span-2 space-y-6">
        <h3 className="text-base font-bold text-slate-900">Tabel Perencanaan RAB</h3>
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-white border-b border-slate-855 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Nama Item</th>
                <th className="py-3 px-4 text-center">Kuantitas</th>
                <th className="py-3 px-4 text-right">Harga Satuan</th>
                <th className="py-3 px-4 text-right">Total Anggaran</th>
              </tr>
            </thead>
            <tbody>
              {rabList.map((r, idx) => (
                <tr key={idx} className="border-b border-slate-200 hover:bg-slate-100">
                  <td className="py-3 px-4 font-bold text-primary-400">{r.kategori}</td>
                  <td className="py-3 px-4 text-slate-900">{r.item}</td>
                  <td className="py-3 px-4 text-center font-semibold text-slate-700">
                    {r.kuantitas} {r.satuan}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-500">
                    Rp {Number(r.harga_satuan).toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    Rp {Number(r.total_idr || r.kuantitas * r.harga_satuan).toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
              {rabList.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500 italic">Belum ada item anggaran terencana.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

