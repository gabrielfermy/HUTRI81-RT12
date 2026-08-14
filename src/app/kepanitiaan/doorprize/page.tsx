'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  History, CheckCircle2, XCircle, UserCheck, RefreshCw, Trash2, Edit3, Save, Search
} from 'lucide-react';

interface AttendeeRow {
  id: string;
  nama: string;
  no_telp: string; // Prize name
  dawis: string;   // Status: 'SAH' or 'GUGUR'
  is_won: boolean;
  won_at?: string;
}

export default function RedesignedAdminDoorprizePage() {
  const [rows, setRows] = useState<AttendeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'SAH' | 'GUGUR'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Inline editing state
  const [editId, setEditId] = useState<string | null>(null);
  const [tempWinnerName, setTempWinnerName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('kehadiran')
        .select('*')
        .order('won_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setRows(data);
      }
    } catch (err) {
      console.warn('Failed to load logs from Supabase', err);
      // Fallback to local storage
      const localData = localStorage.getItem('doorprize_number_history');
      if (localData) {
        const parsed = JSON.parse(localData);
        setRows(parsed.map((item: any) => ({
          id: item.id,
          nama: `${item.number.toString().padStart(3, '0')} - ${item.winnerName || '(Belum ada nama)'}`,
          no_telp: item.prizeName,
          dawis: item.status,
          is_won: item.status === 'SAH',
          won_at: item.drawnAt
        })));
      }
    }
    setLoading(false);
  };

  // Helper to extract number and name
  const parseRowData = (nama: string) => {
    const parts = nama.split(' - ');
    const num = parts[0] || '000';
    let name = parts.slice(1).join(' - ') || '';
    if (name.startsWith('(') && name.endsWith(')')) {
      name = ''; // Clear default placeholder
    }
    return { number: num, name };
  };

  const handleStartEdit = (row: AttendeeRow) => {
    setEditId(row.id);
    const { name } = parseRowData(row.nama);
    setTempWinnerName(name);
  };

  const handleSaveWinnerName = async (id: string, numberStr: string) => {
    const finalNamaField = `${numberStr} - ${tempWinnerName.trim() || '(Belum ada nama)'}`;
    
    // Optimistic update
    setRows(prev => prev.map(r => r.id === id ? { ...r, nama: finalNamaField } : r));
    setEditId(null);

    try {
      const { error } = await supabase
        .from('kehadiran')
        .update({ nama: finalNamaField })
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.warn('Failed to save to database', err);
      alert('Nama disimpan lokal, gagal sinkronisasi ke server.');
    }
  };

  const handleDeleteLog = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data undian ini? Pool angka terkait akan dikembalikan.')) return;
    
    setRows(prev => prev.filter(r => r.id !== id));

    try {
      const { error } = await supabase
        .from('kehadiran')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.warn('Failed to delete from database', err);
    }
  };

  const handleToggleStatus = async (row: AttendeeRow) => {
    const nextStatus = row.dawis === 'SAH' ? 'GUGUR' : 'SAH';
    
    setRows(prev => prev.map(r => r.id === row.id ? { 
      ...r, 
      dawis: nextStatus,
      is_won: nextStatus === 'SAH'
    } : r));

    try {
      const { error } = await supabase
        .from('kehadiran')
        .update({ 
          dawis: nextStatus,
          is_won: nextStatus === 'SAH'
        })
        .eq('id', row.id);

      if (error) throw error;
    } catch (err) {
      console.warn('Failed to toggle status in database', err);
    }
  };

  // Filtered list
  const filteredRows = useMemo(() => {
    return rows.filter(r => {
      const { number, name } = parseRowData(r.nama);
      const matchesSearch = number.includes(searchTerm) || 
                            name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            r.no_telp.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'ALL' || r.dawis === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  }, [rows, searchTerm, filterStatus]);

  // Statistics
  const stats = useMemo(() => {
    const totalSah = rows.filter(r => r.dawis === 'SAH').length;
    const totalGugur = rows.filter(r => r.dawis === 'GUGUR').length;
    return { totalSah, totalGugur };
  }, [rows]);

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Arsip & Pemetaan Doorprize</h1>
          <p className="text-sm text-slate-500">Hubungkan nama warga pemenang dengan nomor undian yang telah sah keluar.</p>
        </div>
        <button
          onClick={loadData}
          className="mt-3 sm:mt-0 px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-350 text-slate-700 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all active:scale-95"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center space-x-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold border border-emerald-100">
            ✓
          </div>
          <div>
            <span className="block text-xs font-bold text-slate-450 uppercase tracking-wider">Total Pemenang Sah</span>
            <span className="text-2xl font-black text-slate-800">{stats.totalSah} Nomor</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center space-x-4">
          <div className="h-12 w-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center text-xl font-bold border border-red-100">
            ✗
          </div>
          <div>
            <span className="block text-xs font-bold text-slate-450 uppercase tracking-wider">Nomor Gugur (Absent)</span>
            <span className="text-2xl font-black text-slate-850">{stats.totalGugur} Nomor</span>
          </div>
        </div>
      </div>

      {/* Table section */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Table Filters & Search */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-1.5 bg-white border border-slate-300 p-1 rounded-xl w-fit">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                filterStatus === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Semua ({rows.length})
            </button>
            <button
              onClick={() => setFilterStatus('SAH')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                filterStatus === 'SAH' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sah ({stats.totalSah})
            </button>
            <button
              onClick={() => setFilterStatus('GUGUR')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                filterStatus === 'GUGUR' ? 'bg-red-600 text-white' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Gugur ({stats.totalGugur})
            </button>
          </div>

          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nomor, nama, atau hadiah..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-1 focus:ring-slate-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Real Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 text-center text-slate-450 flex flex-col items-center justify-center space-y-2">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-slate-700"></div>
              <span className="text-xs font-bold uppercase tracking-wider">Memuat riwayat undian...</span>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="py-20 text-center text-slate-450 italic text-sm">
              Tidak ada data undian ditemukan.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/40 border-b border-slate-150 text-[10px] uppercase font-bold text-slate-450 tracking-wider">
                  <th className="py-3 px-6">Nomor Undian</th>
                  <th className="py-3 px-6">Hadiah</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6">Nama Warga Pemenang</th>
                  <th className="py-3 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredRows.map(row => {
                  const { number, name } = parseRowData(row.nama);
                  const isEditing = editId === row.id;

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 font-mono font-black text-sm text-slate-800">
                        {number}
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-700">
                        {row.no_telp}
                      </td>
                      <td className="py-4 px-6">
                        <button
                          onClick={() => handleToggleStatus(row)}
                          className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-black border transition-all uppercase tracking-wide cursor-pointer hover:scale-105 active:scale-95 ${
                            row.dawis === 'SAH' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-250' 
                              : 'bg-red-50 text-red-700 border-red-250'
                          }`}
                        >
                          {row.dawis === 'SAH' ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Sah</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3.5 w-3.5" />
                              <span>Gugur</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-4 px-6">
                        {isEditing ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={tempWinnerName}
                              onChange={(e) => setTempWinnerName(e.target.value)}
                              className="bg-white border border-slate-350 px-3 py-1.5 rounded-lg text-xs font-semibold focus:outline-none w-64"
                              placeholder="Masukkan nama warga..."
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveWinnerName(row.id, number)}
                              className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                              title="Simpan"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            {name ? (
                              <span className="font-extrabold text-slate-800 flex items-center space-x-1.5">
                                <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                                <span>{name}</span>
                              </span>
                            ) : (
                              <span className="text-slate-400 italic font-medium">Belum ada nama (Klik edit)</span>
                            )}
                            {row.dawis === 'SAH' && (
                              <button
                                onClick={() => handleStartEdit(row)}
                                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                                title="Edit Nama"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleDeleteLog(row.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          title="Hapus Data Undian"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
