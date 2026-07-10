'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { DollarSign, Users, Award, ShieldAlert } from 'lucide-react';
import { ExpensesTab } from '@/components/keuangan/ExpensesTab';
import { WargaTab } from '@/components/keuangan/WargaTab';
import { SponsorshipTab } from '@/components/keuangan/SponsorshipTab';
import { RabTab } from '@/components/keuangan/RabTab';
import { PaymentModal } from '@/components/warga/PaymentModal';

export default function KepanitiaanKeuangan() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'expenses' | 'warga' | 'sponsorship' | 'rab' | ''>('');

  // Database lists
  const [rabList, setRabList] = useState<any[]>([]);
  const [wargaList, setWargaList] = useState<any[]>([]);
  const [sponsorList, setSponsorList] = useState<any[]>([]);
  const [expensesList, setExpensesList] = useState<any[]>([]);

  // Detailed Payment Modal States
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [payingWarga, setPayingWarga] = useState<any>(null);

  // Load user & pull databases
  useEffect(() => {
    const userSession = localStorage.getItem('session_panitia');
    let sessionUser: any = null;
    if (userSession) {
      sessionUser = JSON.parse(userSession);
      setCurrentUser(sessionUser);

      // Select first allowed tab as active
      const userAccess = sessionUser?.akses_menu || '';
      const accessArray = userAccess.split(',');
      const hasFullAccess = accessArray.includes('keuangan');
      const allowed = [
        { id: 'expenses', key: 'keuangan_pengeluaran' },
        { id: 'warga', key: 'keuangan_iuran' },
        { id: 'sponsorship', key: 'keuangan_sponsor' },
        { id: 'rab', key: 'keuangan_rab' }
      ].filter((t) => hasFullAccess || accessArray.includes(t.key));

      if (allowed.length > 0) {
        setActiveTab(allowed[0].id as any);
      } else {
        setActiveTab(''); // No tabs allowed
      }
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

    const channel = supabase
      .channel('keuangan-data-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
  // ACTION DISPATCHERS (Supabase API interactions)
  // ==========================================

  const handleAddExpense = async (item: string, nominal: number, tanggal: string, seksi: string, rabId: string, buktiUrl?: string) => {
    const newExpense = {
      rab_id: rabId || null,
      item_pembelian: item,
      nominal_riil: nominal,
      tanggal_pembelian: tanggal,
      seksi_pj: seksi,
      pic: currentUser?.nama || 'Anonim',
      bukti_nota_url: buktiUrl || null,
    };

    try {
      const { data, error } = await supabase.from('pengeluaran').insert([newExpense]).select();
      if (data && !error) {
        setExpensesList([data[0], ...expensesList]);
        const rabMatch = rabList.find(r => r.id === rabId);
        await logAudit('Mencatat Pengeluaran', `Membeli: "${item}" senilai Rp ${nominal.toLocaleString('id-ID')} (RAB: ${rabMatch?.item || 'Umum'})${buktiUrl ? ' [Dengan Bukti Kwitansi]' : ''}`);
      } else {
        alert('Gagal menambahkan pengeluaran: ' + (error?.message || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteExpense = async (id: string, name: string, nominal: number) => {
    if (!confirm(`Hapus pengeluaran "${name}"?`)) return;

    try {
      const { error } = await supabase.from('pengeluaran').delete().eq('id', id);
      if (!error) {
        setExpensesList(expensesList.filter(e => e.id !== id));
        await logAudit('Menghapus Pengeluaran', `Menghapus catatan belanja "${name}" senilai Rp ${nominal.toLocaleString('id-ID')}`);
      } else {
        alert('Gagal menghapus pengeluaran: ' + error.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Tab 2: Warga Payment Modal triggers
  const handleOpenPaymentModal = (warga: any) => {
    setPayingWarga(warga);
    setIsPaymentModalOpen(true);
  };

  const handleSavePayment = async (id: string, nominal: number) => {
    const isPaidNow = nominal > 0;
    const paidAtValue = isPaidNow ? new Date().toISOString() : null;

    try {
      const { error } = await supabase
        .from('warga')
        .update({
          is_paid: isPaidNow,
          nominal_iuran: nominal,
          paid_at: paidAtValue
        })
        .eq('id', id);

      if (!error) {
        setWargaList(wargaList.map(w => w.id === id ? { ...w, is_paid: isPaidNow, nominal_iuran: nominal, paid_at: paidAtValue } : w));
        
        let statusString = isPaidNow 
          ? `Lunas sebesar Rp ${nominal.toLocaleString('id-ID')}` 
          : `Belum Lunas (nominal diatur Rp ${nominal.toLocaleString('id-ID')})`;

        await logAudit('Mengubah Iuran Warga', `Mengubah iuran "${payingWarga?.nama}": ${statusString}`);
        setIsPaymentModalOpen(false);
        setPayingWarga(null);
      } else {
        alert('Gagal menyimpan iuran: ' + error.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Tab 3: Sponsor Handlers
  const handleAddSponsor = async (nama: string, tipe: string, nominal: number, keterangan: string) => {
    const newSponsor = {
      nama,
      tipe,
      nominal,
      keterangan,
      is_paid: true,
    };

    try {
      const { data, error } = await supabase.from('sponsorship').insert([newSponsor]).select();
      if (data && !error) {
        setSponsorList([data[0], ...sponsorList].sort((a, b) => b.nominal - a.nominal));
        await logAudit('Menambah Sponsor', `Mendaftarkan sponsor "${nama}" (${tipe}) senilai Rp ${nominal.toLocaleString('id-ID')}`);
      } else {
        alert('Gagal menambahkan sponsor: ' + (error?.message || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSponsor = async (id: string, name: string) => {
    if (!confirm(`Hapus sponsor "${name}"?`)) return;

    try {
      const { error } = await supabase.from('sponsorship').delete().eq('id', id);
      if (!error) {
        setSponsorList(sponsorList.filter(s => s.id !== id));
        await logAudit('Menghapus Sponsor', `Menghapus data sponsor "${name}"`);
      } else {
        alert('Gagal menghapus sponsor: ' + error.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Tab 4: RAB Handlers
  const handleAddRab = async (kategori: string, item: string, kuantitas: number, satuan: string, hargaSatuan: number) => {
    const newRab = {
      kategori,
      item,
      kuantitas,
      satuan,
      harga_satuan: hargaSatuan,
    };

    try {
      const { data, error } = await supabase.from('rab').insert([newRab]).select();
      if (data && !error) {
        setRabList([...rabList, data[0]].sort((a, b) => a.kategori.localeCompare(b.kategori)));
        await logAudit('Menambah Rencana RAB', `Merencanakan pos belanja "${item}" (kategori: ${kategori}) senilai Rp ${(kuantitas * hargaSatuan).toLocaleString('id-ID')}`);
      } else {
        alert('Gagal menambahkan RAB: ' + (error?.message || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const allowedTabs = React.useMemo(() => {
    const userAccess = currentUser?.akses_menu || '';
    const accessArray = userAccess.split(',');
    const hasFullAccess = accessArray.includes('keuangan');
    return [
      { id: 'expenses', label: '1. Pengeluaran Riil', icon: DollarSign, key: 'keuangan_pengeluaran' },
      { id: 'warga', label: '2. Iuran Warga', icon: Users, key: 'keuangan_iuran' },
      { id: 'sponsorship', label: '3. Donatur & Sponsor', icon: Award, key: 'keuangan_sponsor' },
      { id: 'rab', label: '4. Rencana Anggaran (RAB)', icon: ShieldAlert, key: 'keuangan_rab' }
    ].filter((tab) => hasFullAccess || accessArray.includes(tab.key));
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center bg-white text-slate-900 min-h-[50vh]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-red-500 border-r-2 mx-auto"></div>
          <p className="text-xs text-slate-500">Memuat Data Keuangan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">Laporan & Manajemen Keuangan</h1>
          <p className="text-xs text-slate-500 mt-1">Kelola pembukuan belanja riil, iuran wajib, donatur, dan perencanaan anggaran.</p>
        </div>
      </div>

      {/* Tabs Switcher */}
      {allowedTabs.length > 1 && (
        <div className="flex border-b border-slate-200 space-x-1 overflow-x-auto pb-px">
          {allowedTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-5 py-3 text-xs font-bold whitespace-nowrap rounded-t-xl transition-all border-t-2 ${
                  activeTab === tab.id
                    ? 'bg-slate-100/40 border-red-500 text-red-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Tab Panels */}
      {activeTab === 'expenses' && (
        <ExpensesTab 
          rabList={rabList}
          expensesList={expensesList}
          currentUser={currentUser}
          onAddExpense={handleAddExpense}
          onDeleteExpense={handleDeleteExpense}
        />
      )}

      {activeTab === 'warga' && (
        <WargaTab 
          wargaList={wargaList}
          onOpenPaymentModal={handleOpenPaymentModal}
        />
      )}

      {activeTab === 'sponsorship' && (
        <SponsorshipTab 
          sponsorList={sponsorList}
          onAddSponsor={handleAddSponsor}
          onDeleteSponsor={handleDeleteSponsor}
        />
      )}

      {activeTab === 'rab' && (
        <RabTab 
          rabList={rabList}
          onAddRab={handleAddRab}
        />
      )}

      {/* Payment Modal */}
      <PaymentModal 
        isOpen={isPaymentModalOpen}
        warga={payingWarga}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setPayingWarga(null);
        }}
        onSave={handleSavePayment}
      />
    </div>
  );
}

