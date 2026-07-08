import React, { useState } from 'react';
import { Trash2, DollarSign } from 'lucide-react';

interface ExpensesTabProps {
  rabList: any[];
  expensesList: any[];
  currentUser: any;
  onAddExpense: (item: string, nominal: number, tanggal: string, seksi: string, rabId: string) => Promise<void>;
  onDeleteExpense: (id: string, item: string, nominal: number) => Promise<void>;
}

export const ExpensesTab: React.FC<ExpensesTabProps> = ({
  rabList,
  expensesList,
  currentUser,
  onAddExpense,
  onDeleteExpense
}) => {
  const [expRabId, setExpRabId] = useState('');
  const [expItem, setExpItem] = useState('');
  const [expNominal, setExpNominal] = useState(0);
  const [expTanggal, setExpTanggal] = useState('');
  const [expSeksi, setExpSeksi] = useState(currentUser?.seksi !== 'Inti' ? currentUser?.seksi || 'Acara' : 'Acara');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expItem || !expNominal || !expTanggal || submitting) return;

    setSubmitting(true);
    try {
      await onAddExpense(expItem, expNominal, expTanggal, expSeksi, expRabId);
      setExpItem('');
      setExpNominal(0);
      setExpTanggal('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
      {/* Add Expense Form */}
      <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 space-y-6 h-fit">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Input Belanja Baru</h3>
          <p className="text-[10px] text-slate-500">Mencatat pengeluaran riil panitia dan hubungkan ke pos RAB.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Pilih Item Anggaran (RAB)</label>
            <select
              value={expRabId}
              onChange={(e) => setExpRabId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
            >
              <option value="">Pos Belanja Umum (Tanpa RAB)</option>
              {rabList.map(r => (
                <option key={r.id} value={r.id}>
                  [{r.kategori}] {r.item} (Maks: Rp {Number(r.total_idr).toLocaleString('id-ID')})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Detail Belanja Barang</label>
            <input
              type="text"
              required
              value={expItem}
              onChange={(e) => setExpItem(e.target.value)}
              placeholder="e.g. Pembelian 15 piala & pita merah putih"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Nominal Belanja (Rp)</label>
              <input
                type="number"
                required
                value={expNominal}
                onChange={(e) => setExpNominal(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 text-right font-semibold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tanggal Pembelian</label>
              <input
                type="date"
                required
                value={expTanggal}
                onChange={(e) => setExpTanggal(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Seksi Penanggung Jawab</label>
            <select
              value={expSeksi}
              onChange={(e) => setExpSeksi(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
            >
              <option value="Acara">Acara</option>
              <option value="Perlengkapan & Dekorasi">Perlengkapan & Dekorasi</option>
              <option value="Konsumsi">Konsumsi</option>
              <option value="Keamanan & Kebersihan">Keamanan & Kebersihan</option>
              <option value="Dokumentasi">Dokumentasi</option>
              <option value="Humas & Dana">Humas & Dana</option>
            </select>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition-all disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Transaksi Belanja'}
            </button>
          </div>
        </form>
      </div>

      {/* Expenses List View */}
      <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 lg:col-span-2 space-y-6">
        <h3 className="text-base font-bold text-white">Riwayat Pengeluaran Belanja</h3>
        <div className="overflow-x-auto border border-slate-850 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-850 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Nama Barang</th>
                <th className="py-3 px-4 text-center">Seksi / PIC</th>
                <th className="py-3 px-4 text-center">Tanggal</th>
                <th className="py-3 px-4 text-right">Nominal</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {expensesList.map((e, idx) => (
                <tr key={idx} className="border-b border-slate-900 hover:bg-slate-900/10">
                  <td className="py-3 px-4 text-white font-semibold">
                    {e.item_pembelian}
                    {e.rab_id && (
                      <span className="block text-[10px] text-slate-500 mt-0.5">
                        RAB: {rabList.find(r => r.id === e.rab_id)?.item || 'Terhubung'}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-350">
                    <span className="block text-xs font-semibold">{e.seksi_pj}</span>
                    <span className="block text-[9px] text-slate-500">{e.pic}</span>
                  </td>
                  <td className="py-3 px-4 text-center text-slate-400">
                    {new Date(e.tanggal_pembelian).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-white">
                    Rp {Number(e.nominal_riil).toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => onDeleteExpense(e.id, e.item_pembelian, e.nominal_riil)}
                      className="p-1.5 text-slate-650 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {expensesList.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500 italic">Belum ada transaksi pengeluaran tercatat.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
