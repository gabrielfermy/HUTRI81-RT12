'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Users, UserPlus, Phone, MapPin, Search, Trash2, Edit2, 
  RotateCcw, CheckCircle, AlertTriangle, X, User
} from 'lucide-react';

interface Attendee {
  id: string;
  nama: string;
  no_telp: string;
  dawis: string;
  is_won: boolean;
  won_at?: string;
  created_at?: string;
}

export default function PanitiaDoorprizePage() {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form input state
  const [nama, setNama] = useState('');
  const [noTelp, setNoTelp] = useState('');
  const [dawis, setDawis] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditingId, setIsEditingId] = useState<string | null>(null);

  // Duplicate Check Modal State
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateMatchInfo, setDuplicateMatchInfo] = useState<{
    newName: string;
    existingName: string;
    phone: string;
    dawis: string;
  } | null>(null);

  // Load data on mount
  useEffect(() => {
    loadAttendees();

    let channel: any;
    try {
      channel = supabase
        .channel('kehadiran-admin-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'kehadiran' }, () => {
          loadAttendees();
        })
        .subscribe();
    } catch (e) {
      console.warn('Realtime subscription not available:', e);
    }

    return () => {
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch (e) {}
      }
    };
  }, []);

  const loadAttendees = async () => {
    setLoading(true);
    let fetchedData: Attendee[] = [];
    let errorOccurred = false;

    try {
      const { data, error } = await supabase
        .from('kehadiran')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (data) {
        fetchedData = data;
      }
    } catch (err) {
      console.warn('Failed to fetch from Supabase. Falling back to LocalStorage.', err);
      errorOccurred = true;
    }

    if (errorOccurred || fetchedData.length === 0) {
      const localData = localStorage.getItem('doorprize_attendees');
      if (localData) {
        fetchedData = JSON.parse(localData);
      }
    }

    setAttendees(fetchedData);
    if (fetchedData.length > 0) {
      localStorage.setItem('doorprize_attendees', JSON.stringify(fetchedData));
    }
    setLoading(false);
  };

  const saveAttendeesList = (updatedList: Attendee[]) => {
    setAttendees(updatedList);
    localStorage.setItem('doorprize_attendees', JSON.stringify(updatedList));
  };

  // Duplicate detection normalizer
  const normalizeName = (name: string) => {
    return name.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  };

  const findDuplicateName = (nameInput: string, phoneInput: string, dawisInput: string) => {
    const normNew = normalizeName(nameInput);
    if (!normNew) return null;

    return attendees.find(att => {
      if (isEditingId && att.id === isEditingId) return false;
      
      const normExist = normalizeName(att.nama);
      const isPhoneMatch = att.no_telp.trim() === phoneInput.trim();
      const isDawisMatch = att.dawis.trim() === dawisInput.trim();

      if (isPhoneMatch && isDawisMatch) {
        const isHighlySimilar = normNew.includes(normExist) || normExist.includes(normNew) || 
                                (normNew.substring(0, 4) === normExist.substring(0, 4));
        return isHighlySimilar;
      }
      return false;
    });
  };

  const handleFormSubmit = async (e: React.FormEvent, forceBypass = false) => {
    e.preventDefault();
    if (!nama.trim()) return;

    if (!forceBypass) {
      const duplicateMatch = findDuplicateName(nama, noTelp, dawis);
      if (duplicateMatch) {
        setDuplicateMatchInfo({
          newName: nama,
          existingName: duplicateMatch.nama,
          phone: noTelp,
          dawis: dawis
        });
        setShowDuplicateModal(true);
        return;
      }
    }

    await saveAttendee();
  };

  const saveAttendee = async () => {
    const cleanedPhone = noTelp.trim();
    const newAttendeeData = {
      nama: nama.trim(),
      no_telp: cleanedPhone,
      dawis: dawis.trim(),
      is_won: false
    };

    if (isEditingId) {
      const updatedList = attendees.map(a => 
        a.id === isEditingId ? { ...a, ...newAttendeeData } : a
      );
      saveAttendeesList(updatedList);

      try {
        await supabase
          .from('kehadiran')
          .update(newAttendeeData)
          .eq('id', isEditingId);
      } catch (err) {
        console.warn('Supabase update error:', err);
      }

      setIsEditingId(null);
    } else {
      const tempId = crypto.randomUUID();
      const newAttendee: Attendee = {
        id: tempId,
        ...newAttendeeData,
        created_at: new Date().toISOString()
      };

      const updatedList = [...attendees, newAttendee];
      saveAttendeesList(updatedList);

      try {
        const { data, error } = await supabase
          .from('kehadiran')
          .insert([newAttendeeData])
          .select();
        
        if (!error && data && data[0]) {
          const syncList = updatedList.map(a => a.id === tempId ? data[0] : a);
          setAttendees(syncList);
          localStorage.setItem('doorprize_attendees', JSON.stringify(syncList));
        }
      } catch (err) {
        console.warn('Supabase insert error:', err);
      }
    }

    setNama('');
    setNoTelp('');
    setDawis('');
    setIsEditingId(null);
  };

  const handleEdit = (att: Attendee) => {
    setIsEditingId(att.id);
    setNama(att.nama);
    setNoTelp(att.no_telp);
    setDawis(att.dawis);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus peserta ini dari daftar?')) return;

    const updatedList = attendees.filter(a => a.id !== id);
    saveAttendeesList(updatedList);

    try {
      await supabase
        .from('kehadiran')
        .delete()
        .eq('id', id);
    } catch (err) {
      console.warn('Supabase delete error:', err);
    }
  };

  const handleResetPool = async () => {
    if (!confirm('PERHATIAN: Ini akan meriset kembali semua status pemenang agar bisa diundi ulang dari awal. Lanjutkan?')) return;

    const updatedList = attendees.map(a => ({ ...a, is_won: false, won_at: undefined }));
    saveAttendeesList(updatedList);

    try {
      await supabase
        .from('kehadiran')
        .update({ is_won: false, won_at: null });
    } catch (err) {
      console.warn('Supabase reset pool error:', err);
    }
  };

  const handleClearAllAttendees = async () => {
    if (!confirm('BAHAYA: Ini akan menghapus SELURUH daftar kehadiran peserta. Ketik OK untuk mengkonfirmasi.')) return;
    const confirmText = prompt('Ketik "HAPUS SEMUA" untuk mengkonfirmasi penghapusan total:');
    if (confirmText !== 'HAPUS SEMUA') return;

    saveAttendeesList([]);

    try {
      await supabase
        .from('kehadiran')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
    } catch (err) {
      console.warn('Supabase clear all error:', err);
    }
  };

  const handleCopyPrevPhone = () => {
    if (attendees.length > 0) {
      const lastAttendee = attendees[attendees.length - 1];
      setNoTelp(lastAttendee.no_telp);
      setDawis(lastAttendee.dawis);
    }
  };

  const filteredAttendees = useMemo(() => {
    return attendees.filter(a => 
      a.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.no_telp.includes(searchTerm) ||
      a.dawis.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [attendees, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Presensi Kehadiran Doorprize</h1>
          <p className="text-xs text-slate-500">Gunakan form di bawah untuk mendaftarkan kehadiran warga dari kertas registrasi fisik.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 flex items-center space-x-2 text-sm">
                <UserPlus className="text-red-600 h-5 w-5" />
                <span>{isEditingId ? 'Edit Data Peserta' : 'Daftarkan Peserta'}</span>
              </h2>
              {isEditingId && (
                <button 
                  onClick={() => {
                    setIsEditingId(null);
                    setNama('');
                    setNoTelp('');
                    setDawis('');
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center space-x-1"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Batal</span>
                </button>
              )}
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Nama Lengkap</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-red-500 text-slate-900 placeholder-slate-400 transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-600">No. HP / Telpon</label>
                  {attendees.length > 0 && !isEditingId && (
                    <button
                      type="button"
                      onClick={handleCopyPrevPhone}
                      className="text-[10px] bg-red-50 border border-red-200 text-red-600 font-bold px-2 py-0.5 rounded hover:bg-red-100 transition-colors"
                    >
                      Salin HP Sebelumnya
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="tel"
                    value={noTelp}
                    onChange={(e) => setNoTelp(e.target.value)}
                    placeholder="Contoh: 08123456789 atau kosongkan"
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-red-500 text-slate-900 placeholder-slate-400 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Dawis (Dasa Wisma)</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={dawis}
                    onChange={(e) => setDawis(e.target.value)}
                    placeholder="Contoh: Dawis Dahlia, Dawis Melati"
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-red-500 text-slate-900 placeholder-slate-400 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-md shadow-red-600/10 active:scale-95"
              >
                {isEditingId ? 'Simpan Perubahan' : 'Daftarkan Kehadiran'}
              </button>
            </form>
          </div>

          {/* Stats & Actions */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Statistik Pool</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center">
                <span className="block text-lg font-black text-slate-900">{attendees.length}</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Total Hadir</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center">
                <span className="block text-lg font-black text-green-600">{attendees.filter(a => !a.is_won).length}</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Aktif di Pool</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <button
                onClick={handleResetPool}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-3 rounded-xl text-xs transition-colors text-center"
              >
                Riset Semua Status Doorprize
              </button>
              <button
                onClick={handleClearAllAttendees}
                className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 py-2 px-3 rounded-xl text-xs transition-colors text-center"
              >
                Hapus Seluruh Daftar Hadir
              </button>
            </div>
          </div>
        </div>

        {/* Table List Column */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col h-[600px]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-3">
            <h2 className="font-bold text-slate-900 flex items-center space-x-2 text-sm">
              <Users className="text-red-600 h-5 w-5" />
              <span>Database Presensi Undian</span>
            </h2>
            
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama, no. HP, atau dawis..."
                className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-red-500 text-slate-900 placeholder-slate-400 transition-colors"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto mt-4 pr-1">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              </div>
            ) : filteredAttendees.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                <Users className="h-8 w-8 mb-2 text-slate-300" />
                <p>{searchTerm ? 'Hasil pencarian kosong.' : 'Belum ada warga yang didaftarkan.'}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                      <th className="py-2 px-3">No</th>
                      <th className="py-2 px-3">Nama</th>
                      <th className="py-2 px-3">No. HP</th>
                      <th className="py-2 px-3">Dawis</th>
                      <th className="py-2 px-3 text-center">Doorprize</th>
                      <th className="py-2 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredAttendees.map((att, idx) => (
                      <tr key={att.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="py-2.5 px-3 font-semibold text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-800">{att.nama}</td>
                        <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                          {att.no_telp || <span className="text-slate-400 italic">Minor/Keluarga</span>}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{att.dawis || '-'}</td>
                        <td className="py-2.5 px-3 text-center">
                          {att.is_won ? (
                            <span className="inline-flex px-2 py-0.5 rounded text-[9px] font-bold bg-yellow-50 text-yellow-600 border border-yellow-100">
                              Sudah Menang
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 rounded text-[9px] font-bold bg-green-50 text-green-600 border border-green-100">
                              Di Pool
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEdit(att)}
                              className="p-1 hover:bg-slate-100 text-slate-500 rounded"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(att.id)}
                              className="p-1 hover:bg-red-50 text-red-500 rounded"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Duplicate Verification Modal */}
      {showDuplicateModal && duplicateMatchInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center space-x-3 text-yellow-600 mb-4 pb-3 border-b border-slate-100">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <h3 className="font-bold text-slate-900 text-base">Duplikasi Nama Terdeteksi</h3>
            </div>

            <p className="text-slate-650 text-xs leading-relaxed mb-4">
              Nama <strong className="text-slate-900">"{duplicateMatchInfo.newName}"</strong> dengan No. HP <strong className="text-slate-900">({duplicateMatchInfo.phone || 'Kosong'})</strong> dan Dawis <strong className="text-slate-900">({duplicateMatchInfo.dawis || 'Kosong'})</strong> sangat mirip dengan data terdaftar berikut:
            </p>

            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-2 mb-6">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Nama Terdaftar:</span>
                <span className="font-bold text-slate-800">{duplicateMatchInfo.existingName}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">No. HP:</span>
                <span className="font-bold text-slate-800 font-mono">{duplicateMatchInfo.phone || 'Kosong'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Dawis:</span>
                <span className="font-bold text-slate-800">{duplicateMatchInfo.dawis || 'Kosong'}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => {
                  setShowDuplicateModal(false);
                  setDuplicateMatchInfo(null);
                  setIsEditingId(null);
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-3 rounded-lg text-xs transition-colors"
              >
                Batal / Batalkan Input
              </button>
              <button
                onClick={() => {
                  setShowDuplicateModal(false);
                  setDuplicateMatchInfo(null);
                  saveAttendee(); // Bypass
                }}
                className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-3 rounded-lg text-xs transition-colors"
              >
                Tetap Simpan (Orang Berbeda)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
