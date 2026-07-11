'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Search, Trash2, Edit, CheckCircle, AlertCircle, DollarSign, Users, FileSpreadsheet, Printer } from 'lucide-react';
import { AddWargaModal } from '@/components/warga/AddWargaModal';
import { EditWargaModal } from '@/components/warga/EditWargaModal';
import { PaymentModal } from '@/components/warga/PaymentModal';
import { handlePrintReceipt } from '@/lib/printReceipt';

export default function KepanitiaanWarga() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Database list
  const [wargaList, setWargaList] = useState<any[]>([]);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBlok, setFilterBlok] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Modal Open States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Active records for modals
  const [editingWarga, setEditingWarga] = useState<any>(null);
  const [payingWarga, setPayingWarga] = useState<any>(null);

  const [importing, setImporting] = useState(false);

  // Load user & pull warga database
  useEffect(() => {
    const userSession = localStorage.getItem('session_panitia');
    if (userSession) {
      setCurrentUser(JSON.parse(userSession));
    }

    async function loadWargaData() {
      try {
        const { data, error } = await supabase
          .from('warga')
          .select('*')
          .order('nama', { ascending: true });

        if (data && !error) {
          setWargaList(data);
        }
      } catch (err) {
        console.error('Error loading warga data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadWargaData();

    // Subscribe to realtime database changes
    const channel = supabase
      .channel('warga-management-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'warga' }, () => {
        loadWargaData();
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

  // Add Warga Handler
  const handleAddWarga = async (nama: string, blok: string, nominal: number) => {
    const newWarga = {
      nama,
      blok,
      nominal_iuran: nominal,
      is_paid: false,
    };

    try {
      const { data, error } = await supabase.from('warga').insert([newWarga]).select();
      if (data && !error) {
        setWargaList([...wargaList, data[0]].sort((a, b) => a.nama.localeCompare(b.nama)));
        await logAudit('Menambah Warga Baru', `Menambahkan warga "${nama}" di ${blok} dengan target iuran Rp ${nominal.toLocaleString('id-ID')}`);
        setIsAddModalOpen(false);
      } else {
        alert('Gagal menambahkan warga: ' + (error?.message || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Edit Warga Handlers
  const handleOpenEditModal = (warga: any) => {
    setEditingWarga(warga);
    setIsEditModalOpen(true);
  };

  const handleEditWarga = async (id: string, nama: string, blok: string) => {
    try {
      const { error } = await supabase
        .from('warga')
        .update({ nama, blok })
        .eq('id', id);

      if (!error) {
        setWargaList(wargaList.map(w => w.id === id ? { ...w, nama, blok } : w));
        await logAudit('Mengubah Data Warga', `Mengubah warga "${editingWarga?.nama}" menjadi "${nama}" (${blok})`);
        setIsEditModalOpen(false);
        setEditingWarga(null);
      } else {
        alert('Gagal memperbarui data warga: ' + error.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Warga Handler
  const handleDeleteWarga = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus warga "${name}" dari sistem? Data pembayaran juga akan terhapus.`)) return;

    try {
      const { error } = await supabase.from('warga').delete().eq('id', id);
      if (!error) {
        setWargaList(wargaList.filter(w => w.id !== id));
        await logAudit('Menghapus Warga', `Menghapus data warga "${name}"`);
      } else {
        alert('Gagal menghapus warga: ' + error.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Payment Recording Modal Handlers
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
        
        await logAudit('Mencatat Pembayaran Iuran', `Mengubah iuran "${payingWarga?.nama}": ${statusString}`);
        setIsPaymentModalOpen(false);
        setPayingWarga(null);
      } else {
        alert('Gagal mencatat pembayaran: ' + error.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Import from Google Sheets
  const handleImportGoogleSheets = async () => {
    if (!confirm('Apakah Anda yakin ingin mengimpor data warga dari Google Sheets? Ini akan menyinkronkan data kepala keluarga baru.')) {
      return;
    }

    setImporting(true);
    try {
      const sheetUrl = 'https://docs.google.com/spreadsheets/d/1iaxIff5RCRy9o3Ysu8ECz7NBrERw1pn56Ehd0_f8cU4/export?format=csv&gid=859673034';
      const res = await fetch(sheetUrl);
      if (!res.ok) throw new Error('Gagal mengambil data dari Google Sheets.');

      const csvText = await res.text();
      const lines = csvText.split('\n');
      if (lines.length <= 1) throw new Error('Spreadsheet kosong atau tidak valid.');

      // Parse headers
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const namaIdx = headers.indexOf('Nama');
      const alamatIdx = headers.indexOf('Alamat');
      const kkNumberIdx = headers.indexOf('KK Number');

      if (namaIdx === -1 || alamatIdx === -1 || kkNumberIdx === -1) {
        throw new Error('Kolom "Nama", "Alamat", atau "KK Number" tidak ditemukan dalam spreadsheet.');
      }

      // Group members by KK Number to identify families
      const families: { [key: string]: { headName: string; address: string } } = {};

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        // Simple CSV parser for quoted commas
        const columns: string[] = [];
        let inQuotes = false;
        let currentValue = '';

        for (let charIdx = 0; charIdx < line.length; charIdx++) {
          const char = line[charIdx];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            columns.push(currentValue.trim().replace(/^"|"$/g, ''));
            currentValue = '';
          } else {
            currentValue += char;
          }
        }
        columns.push(currentValue.trim().replace(/^"|"$/g, ''));

        if (columns.length < headers.length) continue;

        const kkNumber = columns[kkNumberIdx];
        const nama = columns[namaIdx];
        const alamat = columns[alamatIdx];

        if (!kkNumber || !nama) continue;

        if (!families[kkNumber]) {
          families[kkNumber] = {
            headName: nama,
            address: alamat
          };
        }
      }

      const familyList = Object.keys(families).map(kkNum => {
        const fam = families[kkNum];
        // Parse block / house no
        let blok = 'Blok A';
        if (fam.address) {
          const matchNo = fam.address.match(/(?:No\.?\s*(\d+[A-Za-z]?)|No\s*(\d+[A-Za-z]?))/i);
          const houseNo = matchNo ? (matchNo[1] || matchNo[2]) : '';
          const matchBlok = fam.address.match(/Blok\s*([A-D])/i);

          if (matchBlok) {
            blok = `Blok ${matchBlok[1].toUpperCase()}`;
          } else if (houseNo) {
            blok = `Blok A (No. ${houseNo})`;
          } else {
            const blocks = ['Blok A', 'Blok B', 'Blok C', 'Blok D'];
            blok = blocks[Number(kkNum) % 4];
          }
        }

        return {
          nama: `Keluarga ${fam.headName}`,
          blok: blok,
          nominal_iuran: 50000,
          is_paid: false
        };
      });

      if (familyList.length === 0) {
        throw new Error('Tidak ada data keluarga valid yang dapat diimpor.');
      }

      if (confirm(`Ditemukan ${familyList.length} keluarga. Hapus data warga di sistem saat ini sebelum mengimpor?`)) {
        await supabase.from('warga').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }

      const { error: insertErr } = await supabase.from('warga').insert(familyList);
      if (insertErr) throw insertErr;

      await logAudit('Mengimpor Warga', `Mengimpor ${familyList.length} KK dari Google Sheets secara massal.`);
      alert(`Berhasil mengimpor ${familyList.length} keluarga!`);
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      alert('Gagal mengimpor data warga: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  // Filter & Search Logic
  const filteredWarga = wargaList.filter((w) => {
    const matchesSearch = w.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          w.blok.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesBlok = filterBlok === 'ALL' || w.blok === filterBlok;
    
    const matchesStatus = filterStatus === 'ALL' || 
                          (filterStatus === 'LUNAS' && w.is_paid) || 
                          (filterStatus === 'BELUM' && !w.is_paid);

    return matchesSearch && matchesBlok && matchesStatus;
  });

  // Calculate statistics
  const totalWarga = wargaList.length;
  const lunasCount = wargaList.filter(w => w.is_paid).length;
  const belumLunasCount = totalWarga - lunasCount;
  const totalCollected = wargaList.filter(w => w.is_paid).reduce((sum, w) => sum + Number(w.nominal_iuran), 0);

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center bg-white text-slate-900 min-h-[50vh]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-500 border-r-2 mx-auto"></div>
          <p className="text-xs text-slate-500">Memuat Data Warga...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">Manajemen Warga RT 12</h1>
          <p className="text-xs text-slate-500 mt-1">Kelola data warga kepala keluarga dan sesuaikan kontribusi iuran wajib / sumbangan.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleImportGoogleSheets}
            disabled={importing}
            className="flex items-center space-x-2 px-4 py-2.5 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all disabled:opacity-50 shrink-0"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
            <span>{importing ? 'Mengimpor...' : 'Import dari Google Sheet'}</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-primary-600/10 shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah KK Baru</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Warga */}
        <div className="bg-slate-100/20 border border-slate-200/80 rounded-2xl p-5 space-y-3">
          <div className="flex justify-between items-center text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>Total Warga</span>
            <Users className="h-4.5 w-4.5 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalWarga} KK</div>
          <p className="text-[10px] text-slate-500 font-medium">Terdaftar di lingkungan RT 12</p>
        </div>

        {/* Sudah Lunas */}
        <div className="bg-slate-100/20 border border-slate-200/80 rounded-2xl p-5 space-y-3">
          <div className="flex justify-between items-center text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>Sudah Lunas</span>
            <CheckCircle className="h-4.5 w-4.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{lunasCount} KK</div>
          <p className="text-[10px] text-slate-500 font-medium">{totalWarga > 0 ? Math.round((lunasCount / totalWarga) * 100) : 0}% Tingkat partisipasi</p>
        </div>

        {/* Belum Lunas */}
        <div className="bg-slate-100/20 border border-slate-200/80 rounded-2xl p-5 space-y-3">
          <div className="flex justify-between items-center text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>Belum Lunas</span>
            <AlertCircle className="h-4.5 w-4.5 text-primary-400" />
          </div>
          <div className="text-2xl font-black text-primary-400">{belumLunasCount} KK</div>
          <p className="text-[10px] text-slate-500 font-medium">Menunggu tindak lanjut iuran</p>
        </div>

        {/* Dana Terkumpul */}
        <div className="bg-slate-100/20 border border-slate-200/80 rounded-2xl p-5 space-y-3">
          <div className="flex justify-between items-center text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>Dana Terkumpul</span>
            <DollarSign className="h-4.5 w-4.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-slate-900">Rp {totalCollected.toLocaleString('id-ID')}</div>
          <p className="text-[10px] text-slate-500 font-medium">Akumulasi iuran lunas warga</p>
        </div>
      </div>

      {/* Filters & Table */}
      <div className="bg-slate-100/10 border border-slate-200 rounded-2xl p-6 space-y-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative flex-grow max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Cari nama kepala keluarga atau blok..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-primary-500"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={filterBlok}
              onChange={(e) => setFilterBlok(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-primary-500"
            >
              <option value="ALL">Semua Blok</option>
              <option value="Blok A">Blok A</option>
              <option value="Blok B">Blok B</option>
              <option value="Blok C">Blok C</option>
              <option value="Blok D">Blok D</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-primary-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="LUNAS">Lunas</option>
              <option value="BELUM">Belum Lunas</option>
            </select>
          </div>
        </div>

        {/* Warga Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-white border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Nama Kepala Keluarga</th>
                <th className="py-3.5 px-4 text-center">Blok</th>
                <th className="py-3.5 px-4 text-right">Nominal Iuran</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Tanggal Pembayaran</th>
                <th className="py-3.5 px-4 text-center">Aksi Manajemen</th>
              </tr>
            </thead>
            <tbody>
              {filteredWarga.map((w) => (
                <tr key={w.id} className="border-b border-slate-200 hover:bg-slate-100">
                  <td className="py-3.5 px-4 text-slate-900 font-bold">{w.nama}</td>
                  <td className="py-3.5 px-4 text-center text-slate-500 font-semibold">{w.blok}</td>
                  <td className="py-3.5 px-4 text-right text-slate-900 font-bold">
                    Rp {Number(w.nominal_iuran).toLocaleString('id-ID')}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      w.is_paid 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                    }`}>
                      {w.is_paid ? 'Lunas' : 'Belum Lunas'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center text-slate-500">
                    {w.paid_at 
                      ? new Date(w.paid_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : '-'
                    }
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex justify-center items-center space-x-2">
                      <button
                        onClick={() => handleOpenPaymentModal(w)}
                        title="Ubah Pembayaran"
                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:text-slate-900 rounded-lg transition-colors flex items-center space-x-1 font-bold text-[10px]"
                      >
                        <DollarSign className="h-3 w-3 text-emerald-400" />
                        <span>Pembayaran</span>
                      </button>
                      {w.is_paid && (
                        <button
                          onClick={() => handlePrintReceipt(w)}
                          title="Cetak Struk Pembayaran (Thermal 80mm)"
                          className="p-1.5 bg-white border border-slate-200 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors"
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenEditModal(w)}
                        title="Edit Profil"
                        className="p-1.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-700 rounded-lg transition-colors"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteWarga(w.id, w.nama)}
                        title="Hapus Warga"
                        className="p-1.5 bg-white border border-slate-200 text-slate-500 hover:text-primary-400 hover:border-primary-500/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredWarga.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 italic">Tidak ada warga terdaftar yang sesuai filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modular Modals */}
      <AddWargaModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddWarga}
      />

      <EditWargaModal 
        isOpen={isEditModalOpen}
        warga={editingWarga}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingWarga(null);
        }}
        onSave={handleEditWarga}
      />

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

