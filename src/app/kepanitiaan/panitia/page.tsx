'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Key, Users, Edit2, Check, X, Shield, Lock } from 'lucide-react';

const predefinedPositions = [
  { seksi: 'Inti', jabatan: 'Ketua Panitia', isUnique: true },
  { seksi: 'Inti', jabatan: 'Sekretaris', isUnique: true },
  { seksi: 'Inti', jabatan: 'Bendahara', isUnique: true },
  
  { seksi: 'Perlengkapan & Dekorasi', jabatan: 'Koordinator Perlengkapan', isUnique: true },
  { seksi: 'Perlengkapan & Dekorasi', jabatan: 'Anggota Perlengkapan', isUnique: false },
  
  { seksi: 'Acara', jabatan: 'Koordinator Umum Acara', isUnique: true },
  { seksi: 'Acara', jabatan: 'Koordinator Sesi Pagi', isUnique: true },
  { seksi: 'Acara', jabatan: 'Koordinator Sesi Sore', isUnique: true },
  { seksi: 'Acara', jabatan: 'Anggota Acara', isUnique: false },
  
  { seksi: 'Konsumsi', jabatan: 'Koordinator Konsumsi', isUnique: true },
  { seksi: 'Konsumsi', jabatan: 'Anggota Konsumsi', isUnique: false },
  
  { seksi: 'Humas & Dana', jabatan: 'Koordinator Humas & Dana', isUnique: true },
  { seksi: 'Humas & Dana', jabatan: 'Anggota Humas & Dana', isUnique: false },
  
  { seksi: 'Keamanan & Kebersihan', jabatan: 'Koordinator Keamanan', isUnique: true },
  { seksi: 'Keamanan & Kebersihan', jabatan: 'Anggota Keamanan', isUnique: false },
  
  { seksi: 'Dokumentasi', jabatan: 'Koordinator Dokumentasi', isUnique: true },
  { seksi: 'Dokumentasi', jabatan: 'Anggota Dokumentasi', isUnique: false },
];

export default function KepanitiaanPanitia() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [panitiaList, setPanitiaList] = useState<any[]>([]);

  // Add Form States
  const [nama, setNama] = useState('');
  const [selectedPosIndex, setSelectedPosIndex] = useState('');

  // Editing State (For Admin)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNama, setEditNama] = useState('');
  const [editPosIndex, setEditPosIndex] = useState('');

  // User Profile Form States (For Non-Inti)
  const [profNama, setProfNama] = useState('');
  const [profPin, setProfPin] = useState('');
  const [profPinConfirm, setProfPinConfirm] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    const userSession = localStorage.getItem('session_panitia');
    if (userSession) {
      const userObj = JSON.parse(userSession);
      setCurrentUser(userObj);
      setProfNama(userObj.nama);
    }

    async function loadPanitia() {
      try {
        const { data, error } = await supabase
          .from('panitia')
          .select('*')
          .order('nama', { ascending: true });

        if (data && !error) {
          setPanitiaList(data);
        }
      } catch (err) {
        console.error('Error loading committee list:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPanitia();

    const channel = supabase
      .channel('panitia-list-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        loadPanitia();
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

  // Helper: check if a position is occupied (excluding a specific member ID if editing)
  const getOccupantName = (pos: any, excludeId?: string) => {
    const match = panitiaList.find(
      (p) => p.seksi === pos.seksi && p.jabatan === pos.jabatan && p.id !== excludeId
    );
    return match ? match.nama : null;
  };

  // ==========================================
  // ADMIN HANDLERS
  // ==========================================
  const handleAddPanitia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama || selectedPosIndex === '') return;

    const pos = predefinedPositions[Number(selectedPosIndex)];
    
    // Safety check for unique positions
    if (pos.isUnique) {
      const occupant = getOccupantName(pos);
      if (occupant) {
        alert(`Gagal: Posisi "${pos.jabatan}" sudah ditempati oleh ${occupant}.`);
        return;
      }
    }

    const newPanitia = {
      nama,
      seksi: pos.seksi,
      jabatan: pos.jabatan,
      pin_akses: '1212', // default pin
    };

    try {
      const { data, error } = await supabase.from('panitia').insert([newPanitia]).select();
      if (data && !error) {
        setPanitiaList([...panitiaList, data[0]].sort((a, b) => a.nama.localeCompare(b.nama)));
        await logAudit('Menambah Panitia Baru', `Mendaftarkan "${nama}" sebagai "${pos.jabatan}" Seksi ${pos.seksi}`);
        setNama('');
        setSelectedPosIndex('');
      } else {
        alert('Gagal menyimpan ke database.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartEdit = (p: any) => {
    setEditingId(p.id);
    setEditNama(p.nama);
    const idx = predefinedPositions.findIndex(
      (pos) => pos.seksi === p.seksi && pos.jabatan === p.jabatan
    );
    setEditPosIndex(String(idx));
  };

  const handleSaveEdit = async (id: string) => {
    if (!editNama || editPosIndex === '') return;
    const pos = predefinedPositions[Number(editPosIndex)];

    // Safety check for unique positions
    if (pos.isUnique) {
      const occupant = getOccupantName(pos, id);
      if (occupant) {
        alert(`Gagal: Posisi "${pos.jabatan}" sudah ditempati oleh ${occupant}.`);
        return;
      }
    }

    try {
      const { error } = await supabase
        .from('panitia')
        .update({
          nama: editNama,
          seksi: pos.seksi,
          jabatan: pos.jabatan,
        })
        .eq('id', id);

      if (!error) {
        // If we edited ourselves, update the localStorage session too
        if (id === currentUser?.id) {
          const updatedSession = { ...currentUser, nama: editNama, seksi: pos.seksi, jabatan: pos.jabatan };
          localStorage.setItem('session_panitia', JSON.stringify(updatedSession));
          setCurrentUser(updatedSession);
        }

        setPanitiaList(
          panitiaList
            .map((p) => (p.id === id ? { ...p, nama: editNama, seksi: pos.seksi, jabatan: pos.jabatan } : p))
            .sort((a, b) => a.nama.localeCompare(b.nama))
        );

        await logAudit('Mengubah Data Panitia', `Mutasi/Edit profil panitia ID ${id}: "${editNama}" menjadi "${pos.jabatan}"`);
        setEditingId(null);
      } else {
        alert('Gagal memperbarui data.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePanitia = async (id: string, name: string) => {
    if (id === currentUser?.id) {
      alert('Anda tidak bisa mengeluarkan diri Anda sendiri yang sedang aktif login!');
      return;
    }
    if (!confirm(`Apakah Anda yakin ingin mengeluarkan "${name}" dari susunan kepanitiaan?`)) return;

    try {
      const { error } = await supabase.from('panitia').delete().eq('id', id);
      if (!error) {
        setPanitiaList(panitiaList.filter((p) => p.id !== id));
        await logAudit('Mengeluarkan Panitia', `Mengeluarkan "${name}" dari susunan kepanitiaan`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetPin = async (id: string, name: string) => {
    const defaultPin = '1212';
    if (!confirm(`Reset PIN akses "${name}" kembali ke PIN default "1212"?`)) return;

    try {
      const { error } = await supabase
        .from('panitia')
        .update({ pin_akses: defaultPin })
        .eq('id', id);

      if (!error) {
        setPanitiaList(panitiaList.map((p) => (p.id === id ? { ...p, pin_akses: defaultPin } : p)));
        await logAudit('Reset PIN Panitia', `Mereset PIN akses "${name}" kembali ke default 1212 (karena lupa PIN)`);
        alert(`PIN akses untuk "${name}" berhasil direset ke "1212".`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ==========================================
  // PROFILE EDIT HANDLERS (Non-Inti members)
  // ==========================================
  const handleUpdateOwnProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');

    if (!profNama.trim()) {
      setProfileError('Nama tidak boleh kosong.');
      return;
    }

    let payload: any = { nama: profNama };

    if (profPin) {
      if (profPin.length !== 4 || !/^\d+$/.test(profPin)) {
        setProfileError('PIN baru harus berupa 4 digit angka.');
        return;
      }
      if (profPin !== profPinConfirm) {
        setProfileError('Konfirmasi PIN baru tidak cocok.');
        return;
      }
      payload.pin_akses = profPin;
    }

    try {
      const { error } = await supabase
        .from('panitia')
        .update(payload)
        .eq('id', currentUser.id);

      if (!error) {
        const updatedSession = { ...currentUser, nama: profNama };
        localStorage.setItem('session_panitia', JSON.stringify(updatedSession));
        setCurrentUser(updatedSession);
        
        await logAudit('Mengedit Profil Mandiri', `Mengubah profil mandiri: ${profNama} ${profPin ? '(dengan perubahan PIN)' : ''}`);
        
        setProfileSuccess('Profil berhasil diperbarui!');
        setProfPin('');
        setProfPinConfirm('');
      } else {
        setProfileError('Gagal memperbarui profil di server.');
      }
    } catch (err) {
      setProfileError('Koneksi bermasalah.');
    }
  };

  const isInti = currentUser?.seksi === 'Inti';

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="border-b border-slate-900 pb-4">
        <h1 className="text-xl sm:text-2xl font-black text-white">
          {isInti ? 'Manajemen Pengguna & Panitia' : 'Profil & Keamanan Saya'}
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          {isInti
            ? 'Mutasikan jabatan, daftarkan anggota baru, dan kelola sandi/PIN akses kepanitiaan.'
            : 'Perbarui nama lengkap dan PIN keamanan 4 digit rahasia Anda secara mandiri.'}
        </p>
      </div>

      {/* RENDER VIEW 1: ADMIN (PANITIA INTI) */}
      {isInti ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Form Add Panitia */}
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 space-y-6 h-fit">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="h-4.5 w-4.5 text-red-500" />
                <span>Daftarkan Anggota Baru</span>
              </h3>
              <p className="text-xs text-slate-500">Pilih salah satu posisi jabatan baku yang masih kosong.</p>
            </div>

            <form onSubmit={handleAddPanitia} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: Pak Bambang Suhendra"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Pilih Posisi Jabatan</label>
                <select
                  required
                  value={selectedPosIndex}
                  onChange={(e) => setSelectedPosIndex(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                >
                  <option value="">-- Pilih Posisi --</option>
                  {predefinedPositions.map((pos, idx) => {
                    const occupant = pos.isUnique ? getOccupantName(pos) : null;
                    return (
                      <option
                        key={idx}
                        value={idx}
                        disabled={!!occupant}
                        className={occupant ? 'text-slate-600 bg-slate-900' : 'text-white'}
                      >
                        [{pos.seksi}] {pos.jabatan} {occupant ? `[Terisi: ${occupant}]` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl text-[10px] text-slate-400">
                * Anggota baru akan dibuat dengan PIN keamanan default **`1212`**. Mereka dapat menggantinya sendiri di halaman profil.
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition-all"
              >
                Daftarkan Anggota
              </button>
            </form>
          </div>

          {/* Panitia List View */}
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 lg:col-span-2 space-y-6">
            <h3 className="text-base font-bold text-white">Susunan & Akun Akses Panitia</h3>
            <div className="grid grid-cols-1 gap-4">
              {panitiaList.map((p) => {
                const isEditing = editingId === p.id;
                return (
                  <div
                    key={p.id}
                    className="bg-slate-950 border border-slate-850 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-800 transition-all"
                  >
                    {isEditing ? (
                      /* Inline Edit Form */
                      <div className="w-full space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={editNama}
                            onChange={(e) => setEditNama(e.target.value)}
                            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
                          />
                          <select
                            value={editPosIndex}
                            onChange={(e) => setEditPosIndex(e.target.value)}
                            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
                          >
                            {predefinedPositions.map((pos, idx) => {
                              const occupant = pos.isUnique ? getOccupantName(pos, p.id) : null;
                              return (
                                <option
                                  key={idx}
                                  value={idx}
                                  disabled={!!occupant}
                                  className={occupant ? 'text-slate-600' : 'text-white'}
                                >
                                  [{pos.seksi}] {pos.jabatan} {occupant ? `[Terisi: ${occupant}]` : ''}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 px-2.5 bg-slate-900 text-slate-400 hover:text-white border border-slate-800 rounded-lg text-xs flex items-center gap-1 font-bold"
                          >
                            <X className="h-3.5 w-3.5" /> Batal
                          </button>
                          <button
                            onClick={() => handleSaveEdit(p.id)}
                            className="p-1 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs flex items-center gap-1 font-bold"
                          >
                            <Check className="h-3.5 w-3.5" /> Simpan
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Normal Row Details */
                      <>
                        <div className="space-y-1">
                          <div className="text-[9px] font-black text-red-400 bg-red-600/10 border border-red-500/20 px-2 py-0.5 rounded-full w-fit uppercase tracking-wider">
                            {p.seksi}
                          </div>
                          <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                            {p.nama}
                            {p.id === currentUser?.id && (
                              <span className="text-[8px] bg-red-650 text-white px-1.5 py-0.5 rounded-full font-black uppercase">Anda</span>
                            )}
                          </h4>
                          <p className="text-xs text-slate-450 font-semibold">{p.jabatan}</p>
                          <p className="text-[9px] text-slate-600 font-mono">KODE PIN: {p.pin_akses}</p>
                        </div>

                        <div className="flex items-center space-x-1.5 sm:self-center">
                          {/* Edit button */}
                          <button
                            onClick={() => handleStartEdit(p)}
                            title="Edit Jabatan/Nama"
                            className="p-2 border border-slate-850 hover:border-slate-800 text-slate-500 hover:text-blue-450 rounded-lg transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          
                          {/* Reset PIN button */}
                          <button
                            onClick={() => handleResetPin(p.id, p.nama)}
                            title="Reset PIN ke 1212"
                            className="p-2 border border-slate-850 hover:border-slate-800 text-slate-500 hover:text-emerald-450 rounded-lg transition-colors"
                          >
                            <Key className="h-4 w-4" />
                          </button>
                          
                          {/* Delete button */}
                          <button
                            onClick={() => handleDeletePanitia(p.id, p.nama)}
                            title="Keluarkan Anggota"
                            className="p-2 border border-slate-850 hover:border-slate-800 text-slate-500 hover:text-red-450 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
              {panitiaList.length === 0 && (
                <p className="text-xs text-slate-500 italic text-center py-6">Belum ada panitia terdaftar.</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* RENDER VIEW 2: NON-INTI PROFILE MANAGER */
        <div className="max-w-xl mx-auto bg-slate-900/30 border border-slate-800 rounded-3xl p-8 backdrop-blur-md shadow-xl space-y-6 animate-fadeIn">
          <div className="text-center space-y-2 border-b border-slate-900 pb-4">
            <div className="inline-flex p-3 bg-red-650/15 border border-red-500/20 rounded-2xl text-red-400 mb-2">
              <Shield className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-white">Sunting Profil & PIN Keamanan</h2>
            <p className="text-xs text-slate-500">Anda dapat merubah nama panggil dan kode PIN mandiri di bawah.</p>
          </div>

          <form onSubmit={handleUpdateOwnProfile} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Nama Lengkap</label>
              <input
                type="text"
                required
                value={profNama}
                onChange={(e) => setProfNama(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wide">Seksi</label>
                <input
                  type="text"
                  disabled
                  value={currentUser?.seksi || ''}
                  className="w-full bg-slate-950/40 border border-slate-900 rounded-xl px-4 py-2.5 text-xs text-slate-500 cursor-not-allowed"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wide">Jabatan</label>
                <input
                  type="text"
                  disabled
                  value={currentUser?.jabatan || ''}
                  className="w-full bg-slate-950/40 border border-slate-900 rounded-xl px-4 py-2.5 text-xs text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="border-t border-slate-900 pt-4 space-y-4">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-red-500" />
                  Ganti PIN Baru (Kosongkan jika tidak diganti)
                </h4>
                <p className="text-[10px] text-slate-500">Masukkan 4 digit angka rahasia untuk memproteksi akun.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">PIN Baru (4 Angka)</label>
                  <input
                    type="password"
                    maxLength={4}
                    pattern="[0-9]*"
                    inputMode="numeric"
                    value={profPin}
                    onChange={(e) => setProfPin(e.target.value)}
                    placeholder="••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white text-center font-mono tracking-widest focus:outline-none focus:border-red-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Konfirmasi PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    pattern="[0-9]*"
                    inputMode="numeric"
                    value={profPinConfirm}
                    onChange={(e) => setProfPinConfirm(e.target.value)}
                    placeholder="••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white text-center font-mono tracking-widest focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>
            </div>

            {profileSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl">
                {profileSuccess}
              </div>
            )}

            {profileError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                {profileError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-red-650 hover:bg-red-600 text-white font-bold text-sm rounded-xl transition-all shadow-lg"
            >
              Simpan Perubahan Profil
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
