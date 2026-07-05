'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Plus, Lock, CheckCircle2, AlertCircle, HelpCircle, Eye, EyeOff, BarChart2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface RabItem {
  id?: string;
  kategori: string;
  item: string;
  kuantitas: number;
  satuan: string;
  harga_satuan: number;
  total_idr?: number;
}

interface Warga {
  id: string;
  nama: string;
  blok: string;
  nominal_iuran: number;
  is_paid: boolean;
}

const mockRab: RabItem[] = [
  { kategori: 'Hadiah Lomba', item: 'Hadiah Lomba Anak-anak', kuantitas: 1, satuan: 'Paket', harga_satuan: 1500000, total_idr: 1500000 },
  { kategori: 'Hadiah Lomba', item: 'Hadiah Lomba Bapak-bapak', kuantitas: 1, satuan: 'Paket', harga_satuan: 700000, total_idr: 700000 },
  { kategori: 'Hadiah Lomba', item: 'Hadiah Lomba Ibu-ibu', kuantitas: 1, satuan: 'Paket', harga_satuan: 700000, total_idr: 700000 },
  { kategori: 'Hadiah Lomba', item: 'Hadiah Lomba Pemuda', kuantitas: 1, satuan: 'Paket', harga_satuan: 600000, total_idr: 600000 },
  { kategori: 'Konsumsi Puncak', item: 'Soto Ayam', kuantitas: 200, satuan: 'Pax', harga_satuan: 12000, total_idr: 2400000 },
  { kategori: 'Perlengkapan', item: 'Sewa Panggung & Sound', kuantitas: 1, satuan: 'Paket', harga_satuan: 1500000, total_idr: 1500000 },
  { kategori: 'Perlengkapan', item: 'Umbul-umbul & Bendera', kuantitas: 10, satuan: 'Set', harga_satuan: 60000, total_idr: 600000 },
  { kategori: 'Perlengkapan', item: 'Spanduk Utama', kuantitas: 1, satuan: 'Pcs', harga_satuan: 200000, total_idr: 200000 },
  { kategori: 'Perlengkapan', item: 'Sewa Tenda & Kursi', kuantitas: 1, satuan: 'Paket', harga_satuan: 500000, total_idr: 500000 },
  { kategori: 'Perlengkapan', item: 'Cat Panggung', kuantitas: 2, satuan: 'Kaleng', harga_satuan: 100000, total_idr: 200000 },
  { kategori: 'Gotong Royong', item: 'Konsumsi Gotong Royong 9 Agst', kuantitas: 20, satuan: 'Pax', harga_satuan: 20000, total_idr: 400000 },
  { kategori: 'Gotong Royong', item: 'Konsumsi Gotong Royong 15 Agst', kuantitas: 20, satuan: 'Pax', harga_satuan: 20000, total_idr: 400000 },
  { kategori: 'Gotong Royong', item: 'Paku & Kabel Tambahan', kuantitas: 1, satuan: 'Set', harga_satuan: 200000, total_idr: 200000 },
  { kategori: 'Dana Cadangan', item: 'Biaya Tak Terduga', kuantitas: 1, satuan: 'Lumpsum', harga_satuan: 1900000, total_idr: 1900000 },
];

export default function Keuangan() {
  const [rabList, setRabList] = useState<RabItem[]>(mockRab);
  const [wargaList, setWargaList] = useState<Warga[]>([]);
  const [loading, setLoading] = useState(true);

  // Admin and form states
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);

  // Form inputs for new expense
  const [kategori, setKategori] = useState('Hadiah Lomba');
  const [item, setItem] = useState('');
  const [kuantitas, setKuantitas] = useState(1);
  const [satuan, setSatuan] = useState('Unit');
  const [hargaSatuan, setHargaSatuan] = useState(0);

  // Stats calculation
  const totalTarget = 12000000;
  const kasRt = 2000000;

  // Load from database or fall back to mock data
  useEffect(() => {
    async function loadData() {
      try {
        // Load RAB
        const { data: rabData, error: rabError } = await supabase
          .from('rab')
          .select('*')
          .order('kategori', { ascending: true });

        if (rabData && !rabError && rabData.length > 0) {
          setRabList(rabData);
        }

        // Load Warga
        const { data: wargaData, error: wargaError } = await supabase
          .from('warga')
          .select('*')
          .order('nama', { ascending: true });

        if (wargaData && !wargaError) {
          setWargaList(wargaData);
        } else {
          // Generate mock list if query fails
          const mockWarga: Warga[] = [];
          for (let i = 1; i <= 80; i++) {
            mockWarga.push({
              id: String(i),
              nama: `Keluarga KK ${String(i).padStart(2, '0')}`,
              blok: `Blok ${String.fromCharCode(65 + (i % 4))}`,
              nominal_iuran: 50000,
              is_paid: i % 3 === 0,
            });
          }
          setWargaList(mockWarga);
        }
      } catch (err) {
        console.warn('Supabase not fully configured, running with mock data.', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const totalIuranPaid = wargaList
    .filter((w) => w.is_paid)
    .reduce((sum, w) => sum + Number(w.nominal_iuran), 0);

  const totalCollected = kasRt + totalIuranPaid;
  const sisaKekurangan = Math.max(totalTarget - totalCollected, 0);
  const totalExpenses = rabList.reduce((sum, item) => sum + (item.total_idr || (item.kuantitas * item.harga_satuan)), 0);

  // Admin PIN verification (Standard test PIN is 1212)
  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '1212') {
      setIsAdmin(true);
      setPinError(false);
      setPin('');
    } else {
      setPinError(true);
    }
  };

  // Add new budget item
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    const newItem: RabItem = {
      kategori,
      item,
      kuantitas,
      satuan,
      harga_satuan: hargaSatuan,
      total_idr: kuantitas * hargaSatuan
    };

    try {
      const { data, error } = await supabase
        .from('rab')
        .insert([newItem])
        .select();

      if (data && !error) {
        setRabList([...rabList, data[0]]);
      } else {
        // Fallback locally
        setRabList([...rabList, newItem]);
      }
    } catch (err) {
      // Local addition for presentation test
      setRabList([...rabList, newItem]);
    }

    // Reset Form
    setItem('');
    setKuantitas(1);
    setSatuan('Unit');
    setHargaSatuan(0);
  };

  // Toggle paid status
  const handleTogglePaid = async (id: string, currentStatus: boolean) => {
    if (!isAdmin) return;

    try {
      const { error } = await supabase
        .from('warga')
        .update({ is_paid: !currentStatus })
        .eq('id', id);

      if (!error) {
        setWargaList(
          wargaList.map((w) => (w.id === id ? { ...w, is_paid: !currentStatus } : w))
        );
      }
    } catch (err) {
      setWargaList(
        wargaList.map((w) => (w.id === id ? { ...w, is_paid: !currentStatus } : w))
      );
    }
  };

  const progressPercentage = Math.min(Math.round((totalCollected / totalTarget) * 100), 100);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 w-full space-y-12 flex-grow">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center space-x-2 bg-red-600/10 border border-red-500/30 px-3 py-1 rounded-full text-red-400 text-xs sm:text-sm font-semibold uppercase tracking-wider">
          <DollarSign className="h-4 w-4" />
          <span>Transparansi Kas & RAB</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Laporan Transparansi Keuangan</h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
          Pantau status penerimaan iuran warga secara real-time dan detail rincian pos belanja (RAB) panitia di bawah ini.
        </p>
      </div>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Target Pendanaan</span>
          <span className="text-2xl font-extrabold text-white">Rp {totalTarget.toLocaleString('id-ID')}</span>
          <span className="text-[10px] text-slate-500 font-semibold">Batas atas anggaran RAB panitia</span>
        </div>

        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Terkumpul</span>
          <span className="text-2xl font-extrabold text-emerald-400">Rp {totalCollected.toLocaleString('id-ID')}</span>
          <span className="text-[10px] text-emerald-500 font-semibold">{progressPercentage}% dari total target tercapai</span>
        </div>

        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sisa Kekurangan</span>
          <span className="text-2xl font-extrabold text-red-400">Rp {sisaKekurangan.toLocaleString('id-ID')}</span>
          <span className="text-[10px] text-red-500 font-semibold">Kekurangan dana ditutup dari sponsorship</span>
        </div>

        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Realisasi Belanja</span>
          <span className="text-2xl font-extrabold text-indigo-400">Rp {totalExpenses.toLocaleString('id-ID')}</span>
          <span className="text-[10px] text-indigo-500 font-semibold">Total nilai perencanaan pengeluaran</span>
        </div>
      </div>

      {/* Visual Chart and Targets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Source of Funds Dashboard */}
        <div className="bg-slate-900/20 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <BarChart2 className="h-5 w-5 text-red-500" />
            <span>Sumber Pendanaan (%)</span>
          </h3>

          <div className="space-y-4">
            {[
              { label: 'Kas RT (Sudah Ada)', value: kasRt, pct: '16.7%', color: 'bg-emerald-500' },
              { label: 'Iuran Warga (80 KK x 50k)', value: 4000000, current: totalIuranPaid, pct: '33.3%', color: 'bg-indigo-500' },
              { label: 'Sponsorship / Donatur Warga', value: 6000000, pct: '50.0%', color: 'bg-red-500' },
            ].map((source, index) => {
              const currentVal = source.current !== undefined ? source.current : source.value;
              const sourcePct = Math.round((currentVal / totalTarget) * 100);
              return (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-xs sm:text-sm font-semibold">
                    <span className="text-slate-300">{source.label}</span>
                    <span className="text-white">
                      Rp {currentVal.toLocaleString('id-ID')} ({sourcePct}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${source.color}`}
                      style={{ width: `${sourcePct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Resident Payments Checklist Dashboard */}
        <div className="bg-slate-900/20 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 flex flex-col">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Checklist Pembayaran Warga (80 KK)</h3>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
              {wargaList.filter((w) => w.is_paid).length} / {wargaList.length} KK Lunas
            </span>
          </div>

          <div className="overflow-y-auto max-h-60 border border-slate-800/80 rounded-xl p-2 bg-slate-950/20 space-y-2">
            {wargaList.map((w) => (
              <div
                key={w.id}
                onClick={() => handleTogglePaid(w.id, w.is_paid)}
                className={`flex items-center justify-between p-3 rounded-lg border text-sm transition-all ${
                  isAdmin ? 'cursor-pointer hover:border-red-500/30' : ''
                } ${w.is_paid ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-slate-900/20 border-slate-800'}`}
              >
                <div className="flex items-center space-x-2.5">
                  <span className="font-semibold text-white">{w.nama}</span>
                  <span className="text-xs text-slate-500">({w.blok})</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-slate-400">Rp {w.nominal_iuran.toLocaleString('id-ID')}</span>
                  {w.is_paid ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-slate-600" />
                  )}
                </div>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-slate-500 leading-relaxed mt-4 italic">
            *Catatan: Pembayaran dilakukan secara kolektif kepada Bendahara (Pak Tri) atau melalui perwakilan koordinator blok. Daftar di atas diperbarui oleh Bendahara.
          </p>
        </div>
      </div>

      {/* Detailed RAB Table */}
      <div className="bg-slate-900/20 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
          <h3 className="text-xl font-bold text-white">Rincian Perencanaan Belanja (RAB)</h3>
          {/* Admin toggle */}
          <button
            onClick={() => setShowAdminPanel(!showAdminPanel)}
            className="flex items-center space-x-2 text-xs font-bold text-red-400 bg-red-600/10 border border-red-500/20 hover:bg-red-600 hover:text-white px-3.5 py-2 rounded-xl transition-all"
          >
            <Lock className="h-3.5 w-3.5" />
            <span>{isAdmin ? 'Mode Bendahara Aktif' : 'Akses Edit Bendahara'}</span>
          </button>
        </div>

        {/* Verification PIN Box for presentation */}
        {showAdminPanel && !isAdmin && (
          <form onSubmit={handleVerifyPin} className="max-w-sm bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 block">Masukkan PIN Akses Bendahara</label>
              <p className="text-[10px] text-slate-500">Gunakan PIN default presentasi: <strong className="text-red-400 font-bold">1212</strong></p>
            </div>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="PIN 4 Digit"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
            />
            {pinError && <p className="text-xs text-red-500">PIN salah! Coba lagi.</p>}
            <button type="submit" className="w-full py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-500 transition-colors">
              Verifikasi PIN
            </button>
          </form>
        )}

        {/* Admin Input Form */}
        {isAdmin && (
          <form onSubmit={handleAddItem} className="bg-slate-900 border border-slate-800 rounded-xl p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Kategori</label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
              >
                <option value="Hadiah Lomba">Hadiah Lomba</option>
                <option value="Konsumsi Puncak">Konsumsi Puncak</option>
                <option value="Perlengkapan">Perlengkapan</option>
                <option value="Gotong Royong">Gotong Royong</option>
                <option value="Dana Cadangan">Dana Cadangan</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Nama Item</label>
              <input
                type="text"
                value={item}
                onChange={(e) => setItem(e.target.value)}
                placeholder="Contoh: Sewa Kursi"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Kuantitas</label>
              <input
                type="number"
                value={kuantitas}
                onChange={(e) => setKuantitas(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Satuan</label>
              <input
                type="text"
                value={satuan}
                onChange={(e) => setSatuan(e.target.value)}
                placeholder="Set / Pcs / Paket"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Harga Satuan (Rp)</label>
              <div className="flex space-x-2 items-center">
                <input
                  type="number"
                  value={hargaSatuan}
                  onChange={(e) => setHargaSatuan(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                />
                <button type="submit" className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors">
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Scrollable Expense Table */}
        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-4 px-5">Kategori</th>
                <th className="py-4 px-5">Item Pekerjaan / Kebutuhan</th>
                <th className="py-4 px-5 text-center">Kuantitas</th>
                <th className="py-4 px-5 text-center">Satuan</th>
                <th className="py-4 px-5 text-right">Harga Satuan</th>
                <th className="py-4 px-5 text-right">Total (IDR)</th>
              </tr>
            </thead>
            <tbody>
              {rabList.map((item, index) => (
                <tr key={index} className="border-b border-slate-800/60 hover:bg-slate-900/10 transition-colors">
                  <td className="py-3.5 px-5 font-bold text-red-400">{item.kategori}</td>
                  <td className="py-3.5 px-5 text-white">{item.item}</td>
                  <td className="py-3.5 px-5 text-center font-semibold text-slate-300">{item.kuantitas}</td>
                  <td className="py-3.5 px-5 text-center text-slate-400">{item.satuan}</td>
                  <td className="py-3.5 px-5 text-right font-semibold text-slate-300">
                    Rp {item.harga_satuan.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3.5 px-5 text-right font-extrabold text-white">
                    Rp {(item.total_idr || item.kuantitas * item.harga_satuan).toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-950 font-bold border-t-2 border-red-500/20 text-white">
                <td colSpan={5} className="py-5 px-5 text-right uppercase tracking-wider">Grand Total Pengeluaran:</td>
                <td className="py-5 px-5 text-right text-red-400 text-base font-extrabold">
                  Rp {totalExpenses.toLocaleString('id-ID')}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
