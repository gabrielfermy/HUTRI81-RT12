'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, CheckCircle2, AlertCircle, DollarSign, Users, Award, ShieldAlert } from 'lucide-react';

export default function KepanitiaanKeuangan() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'expenses' | 'warga' | 'sponsorship' | 'rab'>('expenses');

  // Database lists
  const [rabList, setRabList] = useState<any[]>([]);
  const [wargaList, setWargaList] = useState<any[]>([]);
  const [sponsorList, setSponsorList] = useState<any[]>([]);
  const [expensesList, setExpensesList] = useState<any[]>([]);

  // 1. Expense Form States
  const [expRabId, setExpRabId] = useState('');
  const [expItem, setExpItem] = useState('');
  const [expNominal, setExpNominal] = useState(0);
  const [expTanggal, setExpTanggal] = useState('');
  const [expSeksi, setExpSeksi] = useState('Acara');

  // 2. Sponsor Form States
  const [spNama, setSpNama] = useState('');
  const [spTipe, setSpTipe] = useState('Platinum');
  const [spNominal, setSpNominal] = useState(0);
  const [spKeterangan, setSpKeterangan] = useState('');

  // 3. RAB Form States
  const [rabKategori, setRabKategori] = useState('Hadiah Lomba');
  const [rabItem, setRabItem] = useState('');
  const [rabKuantitas, setRabKuantitas] = useState(1);
  const [rabSatuan, setRabSatuan] = useState('Pcs');
  const [rabHargaSatuan, setRabHargaSatuan] = useState(0);

  // Load user & pull databases
  useEffect(() => {
    const userSession = localStorage.getItem('session_panitia');
    if (userSession) {
      const userObj = JSON.parse(userSession);
      setCurrentUser(userObj);
      setExpSeksi(userObj.seksi !== 'Inti' ? userObj.seksi : 'Acara');
    }

    async function loadData() {
      try {
        const { data: rData } = await supabase.from('rab').select('*').order('kategori', { ascending: true });
        if (rData) setRabList(rData);

        const { data: wData } = await supabase.from('warga').select('*').order('nama', { ascending: true });
        if (wData) setWargaList(wData);

        const { data: sData } = await supabase.from('sponsorship').select('*').order('nominal', { ascending: false });
        if (sData) setSponsorList(sData);

        const { data: eData } = await supabase.from('pengeluaran').select('*').order('tanggal_pembelian', { ascending: false });
        if (eData) setExpensesList(eData);

      } catch (err) {
        console.error('Error loading finance data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const logAudit = async (aksi: string, detail: string) => {
    if (!currentUser) return;
    try {
      await supabase.from('audit_log').insert([
        {
          panitia_id: currentUser.id,
          nama_panitia: currentUser.nama,
          aksi,
          detail,
        },
      ]);
    } catch (err) {
      console.error('Audit logging failed:', err);
    }
  };

  // ==========================================
  // ACTION HANDLERS
  // ==========================================

  // Tab 1: Handle Add Expense
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expItem || !expNominal || !expTanggal) return;

    const newExpense = {
      rab_id: expRabId || null,
      item_pembelian: expItem,
      nominal_riil: expNominal,
      tanggal_pembelian: expTanggal,
      seksi_pj: expSeksi,
      pic: currentUser?.nama || 'Anonim',
    };

    try {
      const { data, error } = await supabase.from('pengeluaran').insert([newExpense]).select();
      if (data && !error) {
        setExpensesList([data[0], ...expensesList]);
        const rabMatch = rabList.find(r => r.id === expRabId);
        await logAudit('Mencatat Pengeluaran', `Membeli: "${expItem}" senilai Rp ${expNominal.toLocaleString('id-ID')} (RAB: ${rabMatch?.item || 'Umum'})`);
      } else {
        setExpensesList([{ ...newExpense, id: String(Date.now()) }, ...expensesList]);
      }
    } catch (err) {
      setExpensesList([{ ...newExpense, id: String(Date.now()) }, ...expensesList]);
    }

    setExpItem('');
    setExpNominal(0);
    setExpTanggal('');
  };

  const handleDeleteExpense = async (id: string, name: string, nominal: number) => {
    if (!confirm(`Hapus pengeluaran "${name}"?`)) return;

    try {
      const { error } = await supabase.from('pengeluaran').delete().eq('id', id);
      if (!error) {
        setExpensesList(expensesList.filter(e => e.id !== id));
        await logAudit('Menghapus Pengeluaran', `Menghapus catatan belanja "${name}" senilai Rp ${nominal.toLocaleString('id-ID')}`);
      }
    } catch (err) {
      setExpensesList(expensesList.filter(e => e.id !== id));
    }
  };

  // Tab 2: Handle Warga Payment Toggle
  const handleToggleWargaPaid = async (id: string, currentStatus: boolean, name: string) => {
    const updatedStatus = !currentStatus;
    const paidAtValue = updatedStatus ? new Date().toISOString() : null;

    try {
      const { error } = await supabase
        .from('warga')
        .update({ is_paid: updatedStatus, paid_at: paidAtValue })
        .eq('id', id);

      if (!error) {
        setWargaList(wargaList.map(w => w.id === id ? { ...w, is_paid: updatedStatus, paid_at: paidAtValue } : w));
        await logAudit(
          'Mengubah Iuran Warga',
          `Mengubah status pembayaran "${name}" menjadi: ${updatedStatus ? 'LUNAS' : 'BELUM LUNAS'}`
        );
      }
    } catch (err) {
      setWargaList(wargaList.map(w => w.id === id ? { ...w, is_paid: updatedStatus, paid_at: paidAtValue } : w));
    }
  };

  // Tab 3: Handle Add Sponsor
  const handleAddSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spNama) return;

    const newSponsor = {
      nama: spNama,
      tipe: spTipe,
      nominal: spNominal,
      keterangan: spKeterangan,
      is_paid: true,
    };

    try {
      const { data, error } = await supabase.from('sponsorship').insert([newSponsor]).select();
      if (data && !error) {
        setSponsorList([data[0], ...sponsorList].sort((a,b) => b.nominal - a.nominal));
        await logAudit('Menambah Sponsor', `Mendaftarkan sponsor "${spNama}" (${spTipe}) senilai Rp ${spNominal.toLocaleString('id-ID')}`);
      }
    } catch (err) {
      setSponsorList([{ ...newSponsor, id: String(Date.now()) }, ...sponsorList]);
    }

    setSpNama('');
    setSpNominal(0);
    setSpKeterangan('');
  };

  const handleDeleteSponsor = async (id: string, name: string) => {
    if (!confirm(`Hapus sponsor "${name}"?`)) return;

    try {
      const { error } = await supabase.from('sponsorship').delete().eq('id', id);
      if (!error) {
        setSponsorList(sponsorList.filter(s => s.id !== id));
        await logAudit('Menghapus Sponsor', `Menghapus data sponsor "${name}"`);
      }
    } catch (err) {
      setSponsorList(sponsorList.filter(s => s.id !== id));
    }
  };

  // Tab 4: Handle Add RAB Plan
  const handleAddRab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rabItem || !rabHargaSatuan) return;

    const newRab = {
      kategori: rabKategori,
      item: rabItem,
      kuantitas: rabKuantitas,
      satuan: rabSatuan,
      harga_satuan: rabHargaSatuan,
    };

    try {
      const { data, error } = await supabase.from('rab').insert([newRab]).select();
      if (data && !error) {
        setRabList([...rabList, data[0]].sort((a,b) => a.kategori.localeCompare(b.kategori)));
        await logAudit('Menambah Rencana RAB', `Merencanakan pos belanja "${rabItem}" (kategori: ${rabKategori}) senilai Rp ${(rabKuantitas * rabHargaSatuan).toLocaleString('id-ID')}`);
      }
    } catch (err) {
      setRabList([...rabList, { ...newRab, id: String(Date.now()), total_idr: rabKuantitas * rabHargaSatuan }]);
    }

    setRabItem('');
    setRabKuantitas(1);
    setRabSatuan('Pcs');
    setRabHargaSatuan(0);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="border-b border-slate-900 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Laporan & Manajemen Keuangan</h1>
          <p className="text-xs text-slate-400 mt-1">Kelola pembukuan belanja riil, iuran wajib, donatur, dan perencanaan anggaran.</p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-800 space-x-1 overflow-x-auto pb-px">
        {[
          { id: 'expenses', label: '1. Pengeluaran Riil', icon: DollarSign },
          { id: 'warga', label: '2. Iuran Warga (80 KK)', icon: Users },
          { id: 'sponsorship', label: '3. Donatur & Sponsor', icon: Award },
          { id: 'rab', label: '4. Rencana Anggaran (RAB)', icon: ShieldAlert }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-5 py-3 text-xs font-bold whitespace-nowrap rounded-t-xl transition-all border-t-2 ${
                activeTab === tab.id
                  ? 'bg-slate-900/40 border-red-500 text-red-400'
                  : 'border-transparent text-slate-450 hover:text-slate-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT 1: EXPENSES */}
      {activeTab === 'expenses' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
          {/* Add Expense Form */}
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 space-y-6 h-fit">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Input Belanja Baru</h3>
              <p className="text-[10px] text-slate-500">Mencatat pengeluaran riil panitia dan hubungkan ke pos RAB.</p>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-4">
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
                  className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition-all"
                >
                  Simpan Transaksi Belanja
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
                          onClick={() => handleDeleteExpense(e.id, e.item_pembelian, e.nominal_riil)}
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
      )}

      {/* TAB CONTENT 2: WARGA PAYMENT CHECKLIST */}
      {activeTab === 'warga' && (
        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 space-y-6 animate-fadeIn">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h3 className="text-base font-bold text-white">Checklist Status Pembayaran Iuran Warga</h3>
              <p className="text-xs text-slate-500 mt-0.5">Tekan baris kartu warga untuk mengubah status pembayaran iuran wajib Rp 50.000.</p>
            </div>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-bold">
              {wargaList.filter(w => w.is_paid).length} / {wargaList.length} KK Lunas
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {wargaList.map((w) => (
              <div
                key={w.id}
                onClick={() => handleToggleWargaPaid(w.id, w.is_paid, w.nama)}
                className={`p-4 rounded-2xl border flex flex-col justify-between cursor-pointer select-none transition-all hover:scale-[1.01] ${
                  w.is_paid
                    ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-400'
                    : 'bg-slate-950/60 border-slate-850 text-slate-450 hover:border-slate-800'
                }`}
              >
                <div>
                  <div className="font-bold text-white truncate">{w.nama}</div>
                  <div className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">{w.blok}</div>
                </div>
                <div className="flex justify-between items-center mt-4 pt-2 border-t border-slate-900">
                  <span className="text-xs font-extrabold text-slate-400">Rp {Number(w.nominal_iuran).toLocaleString('id-ID')}</span>
                  {w.is_paid ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 animate-pulse" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-slate-700" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: SPONSORSHIP */}
      {activeTab === 'sponsorship' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
          {/* Add Sponsor Form */}
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 space-y-6 h-fit">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Input Sponsor / Donatur</h3>
              <p className="text-[10px] text-slate-500">Mendaftarkan donatur luar atau sponshorship komersial.</p>
            </div>

            <form onSubmit={handleAddSponsor} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Nama Sponsor / Donatur</label>
                <input
                  type="text"
                  required
                  value={spNama}
                  onChange={(e) => setSpNama(e.target.value)}
                  placeholder="e.g. Toko Kelontong Bu Sri"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Kasta Sponsor</label>
                  <select
                    value={spTipe}
                    onChange={(e) => setSpTipe(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="Platinum">Platinum (Besar)</option>
                    <option value="Gold">Gold (Sedang)</option>
                    <option value="Silver">Silver (Kecil)</option>
                    <option value="Donatur Warga">Donatur Warga</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Nominal Uang (Rp)</label>
                  <input
                    type="number"
                    value={spNominal}
                    onChange={(e) => setSpNominal(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 text-right"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Keterangan / Bantuan Barang</label>
                <textarea
                  rows={3}
                  value={spKeterangan}
                  onChange={(e) => setSpKeterangan(e.target.value)}
                  placeholder="e.g. Menyumbang 5 set krayon anak dan voucher belanja..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition-all"
              >
                Simpan Donasi / Sponsor
              </button>
            </form>
          </div>

          {/* Sponsors List View */}
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 lg:col-span-2 space-y-6">
            <h3 className="text-base font-bold text-white">Daftar Sponsor Terdaftar</h3>
            <div className="overflow-x-auto border border-slate-850 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-850 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Nama Sponsor</th>
                    <th className="py-3 px-4 text-center">Kasta</th>
                    <th className="py-3 px-4 text-right">Nominal</th>
                    <th className="py-3 px-4 text-center">Keterangan Barang</th>
                    <th className="py-3 px-4 text-center">Hapus</th>
                  </tr>
                </thead>
                <tbody>
                  {sponsorList.map((s, idx) => (
                    <tr key={idx} className="border-b border-slate-900 hover:bg-slate-900/10">
                      <td className="py-3 px-4 text-white font-bold">{s.nama}</td>
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
                      <td className="py-3 px-4 text-right font-semibold text-white">
                        Rp {Number(s.nominal).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-xs italic">{s.keterangan || '-'}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeleteSponsor(s.id, s.nama)}
                          className="p-1.5 text-slate-650 hover:text-red-400 rounded-lg transition-colors"
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
      )}

      {/* TAB CONTENT 4: TARGET RAB */}
      {activeTab === 'rab' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
          {/* Add RAB Form */}
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 space-y-6 h-fit">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Tambah Target Belanja (RAB)</h3>
              <p className="text-[10px] text-slate-500">Mendaftarkan kebutuhan pengeluaran terencana rapat.</p>
            </div>

            <form onSubmit={handleAddRab} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Kategori Pos Belanja</label>
                <select
                  value={rabKategori}
                  onChange={(e) => setRabKategori(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                >
                  <option value="Hadiah Lomba">Hadiah Lomba</option>
                  <option value="Konsumsi Puncak">Konsumsi Puncak</option>
                  <option value="Perlengkapan">Perlengkapan</option>
                  <option value="Gotong Royong">Gotong Royong</option>
                  <option value="Dana Cadangan">Dana Cadangan</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Nama Item Pekerjaan</label>
                <input
                  type="text"
                  required
                  value={rabItem}
                  onChange={(e) => setRabItem(e.target.value)}
                  placeholder="e.g. Sewa Panggung Utama & Sound System"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Kuantitas</label>
                  <input
                    type="number"
                    required
                    value={rabKuantitas}
                    onChange={(e) => setRabKuantitas(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 text-center"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Satuan</label>
                  <input
                    type="text"
                    required
                    value={rabSatuan}
                    onChange={(e) => setRabSatuan(e.target.value)}
                    placeholder="Set / Pcs / Pax"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 text-center"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Harga Satuan (Rp)</label>
                <input
                  type="number"
                  required
                  value={rabHargaSatuan}
                  onChange={(e) => setRabHargaSatuan(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 text-right"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition-all"
              >
                Simpan Target RAB
              </button>
            </form>
          </div>

          {/* RAB List View */}
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 lg:col-span-2 space-y-6">
            <h3 className="text-base font-bold text-white">Tabel Perencanaan RAB</h3>
            <div className="overflow-x-auto border border-slate-850 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-855 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Nama Item</th>
                    <th className="py-3 px-4 text-center">Kuantitas</th>
                    <th className="py-3 px-4 text-right">Harga Satuan</th>
                    <th className="py-3 px-4 text-right">Total Anggaran</th>
                  </tr>
                </thead>
                <tbody>
                  {rabList.map((r, idx) => (
                    <tr key={idx} className="border-b border-slate-900 hover:bg-slate-900/10">
                      <td className="py-3 px-4 font-bold text-red-400">{r.kategori}</td>
                      <td className="py-3 px-4 text-white">{r.item}</td>
                      <td className="py-3 px-4 text-center font-semibold text-slate-300">
                        {r.kuantitas} {r.satuan}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-400">
                        Rp {Number(r.harga_satuan).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-white">
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
      )}

    </div>
  );
}
