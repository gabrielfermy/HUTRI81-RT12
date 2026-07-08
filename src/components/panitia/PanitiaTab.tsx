import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Key, Edit2, Check, X, Shield, Lock } from 'lucide-react';

interface PanitiaTabProps {
  panitiaList: any[];
  seksiList: any[];
  currentUser: any;
  onAddPanitia: (nama: string, seksi: string, jabatan: string, isUnique: boolean) => Promise<void>;
  onEditPanitia: (id: string, nama: string, seksi: string, jabatan: string, isUnique: boolean) => Promise<void>;
  onDeletePanitia: (id: string, nama: string) => Promise<void>;
  onResetPin: (id: string, nama: string) => Promise<void>;
  onUpdateOwnProfile: (nama: string, pin?: string) => Promise<void>;
}

export const PanitiaTab: React.FC<PanitiaTabProps> = ({
  panitiaList,
  seksiList,
  currentUser,
  onAddPanitia,
  onEditPanitia,
  onDeletePanitia,
  onResetPin,
  onUpdateOwnProfile
}) => {
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
    if (currentUser) {
      setProfNama(currentUser.nama);
    }
  }, [currentUser]);

  // Dynamically build predefined positions from loaded sections
  const dynamicPositions = React.useMemo(() => {
    const list: Array<{ seksi: string; jabatan: string; isUnique: boolean }> = [];
    seksiList.forEach((s) => {
      if (s.kategori === 'BOD') {
        list.push({ seksi: s.nama, jabatan: 'Penanggung Jawab', isUnique: true });
        list.push({ seksi: s.nama, jabatan: 'Pengawas', isUnique: true });
      } else if (s.kategori === 'Inti') {
        if (s.nama === 'Inti') {
          list.push({ seksi: 'Inti', jabatan: 'Ketua Panitia', isUnique: true });
          list.push({ seksi: 'Inti', jabatan: 'Sekretaris', isUnique: true });
          list.push({ seksi: 'Inti', jabatan: 'Bendahara', isUnique: true });
        } else {
          list.push({ seksi: s.nama, jabatan: `Ketua ${s.nama}`, isUnique: true });
          list.push({ seksi: s.nama, jabatan: `Sekretaris ${s.nama}`, isUnique: true });
          list.push({ seksi: s.nama, jabatan: `Bendahara ${s.nama}`, isUnique: true });
        }
      } else {
        list.push({ seksi: s.nama, jabatan: `Koordinator ${s.nama}`, isUnique: true });
        if (s.mempunyai_sub_koordinator) {
          list.push({ seksi: s.nama, jabatan: `Sub Koordinator ${s.nama}`, isUnique: false });
        }
        list.push({ seksi: s.nama, jabatan: `Anggota ${s.nama}`, isUnique: false });
      }
    });
    return list;
  }, [seksiList]);

  // Dynamic sorting for committee list based on dynamic sections
  const sortedPanitiaList = React.useMemo(() => {
    return [...panitiaList].sort((a, b) => {
      const secA = seksiList.find(s => s.nama === a.seksi);
      const secB = seksiList.find(s => s.nama === b.seksi);

      const catRank: Record<string, number> = { 'BOD': 1, 'Inti': 2, 'Seksi': 3 };
      const rankA = secA ? (catRank[secA.kategori] || 99) : 99;
      const rankB = secB ? (catRank[secB.kategori] || 99) : 99;

      if (rankA !== rankB) return rankA - rankB;

      // Same category, sort by section order
      const sectionOrder = seksiList.map(s => s.nama);
      const sIdxA = sectionOrder.indexOf(a.seksi);
      const sIdxB = sectionOrder.indexOf(b.seksi);
      if (sIdxA !== sIdxB) return sIdxA - sIdxB;

      // Same section, sort by jabatan priority
      if (a.seksi === 'Inti') {
        const intiOrder = ['Ketua Panitia', 'Sekretaris', 'Bendahara'];
        const rA = intiOrder.indexOf(a.jabatan);
        const rB = intiOrder.indexOf(b.jabatan);
        return (rA === -1 ? 99 : rA) - (rB === -1 ? 99 : rB);
      }
      if (a.seksi === 'BOD') {
        const bodOrder = ['Penanggung Jawab', 'Pengawas'];
        const rA = bodOrder.indexOf(a.jabatan);
        const rB = bodOrder.indexOf(b.jabatan);
        return (rA === -1 ? 99 : rA) - (rB === -1 ? 99 : rB);
      }

      const isKoordA = a.jabatan.toLowerCase().includes('koordinator');
      const isKoordB = b.jabatan.toLowerCase().includes('koordinator');
      if (isKoordA && !isKoordB) return -1;
      if (!isKoordA && isKoordB) return 1;

      return a.nama.localeCompare(b.nama);
    });
  }, [panitiaList, seksiList]);

  const getOccupantName = (pos: any, excludeId?: string) => {
    const match = panitiaList.find(
      (p) => p.seksi === pos.seksi && p.jabatan === pos.jabatan && p.id !== excludeId
    );
    return match ? (match.nama || '(Belum Ada)') : null;
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim() || selectedPosIndex === '') return;

    const pos = dynamicPositions[Number(selectedPosIndex)];
    if (pos.isUnique) {
      const occupant = getOccupantName(pos);
      if (occupant && occupant !== '(Belum Ada)') {
        alert(`Gagal: Posisi "${pos.jabatan}" sudah ditempati oleh ${occupant}.`);
        return;
      }
    }

    try {
      await onAddPanitia(nama.trim(), pos.seksi, pos.jabatan, pos.isUnique);
      setNama('');
      setSelectedPosIndex('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartEdit = (p: any) => {
    setEditingId(p.id);
    setEditNama(p.nama);
    const idx = dynamicPositions.findIndex(
      (pos) => pos.seksi === p.seksi && pos.jabatan === p.jabatan
    );
    setEditPosIndex(String(idx));
  };

  const handleSaveEditSubmit = async (id: string) => {
    if (editNama.trim() === '' && editingId !== id) return; // Keep blank support for vacant roles
    const pos = dynamicPositions[Number(editPosIndex)];

    if (pos.isUnique) {
      const occupant = getOccupantName(pos, id);
      if (occupant && occupant !== '(Belum Ada)') {
        alert(`Gagal: Posisi "${pos.jabatan}" sudah ditempati oleh ${occupant}.`);
        return;
      }
    }

    try {
      await onEditPanitia(id, editNama.trim(), pos.seksi, pos.jabatan, pos.isUnique);
      setEditingId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');

    if (!profNama.trim()) {
      setProfileError('Nama tidak boleh kosong.');
      return;
    }

    if (profPin) {
      if (profPin.length !== 4 || !/^\d+$/.test(profPin)) {
        setProfileError('PIN baru harus berupa 4 digit angka.');
        return;
      }
      if (profPin !== profPinConfirm) {
        setProfileError('Konfirmasi PIN baru tidak cocok.');
        return;
      }
    }

    try {
      await onUpdateOwnProfile(profNama.trim(), profPin || undefined);
      setProfileSuccess('Profil berhasil diperbarui!');
      setProfPin('');
      setProfPinConfirm('');
    } catch (err: any) {
      setProfileError(err.message || 'Gagal memperbarui profil.');
    }
  };

  const isInti = currentUser?.seksi === 'Inti';

  if (!isInti) {
    /* RENDER VIEW FOR NON-INTI (ONLY PROFILE SETTINGS) */
    return (
      <div className="max-w-xl mx-auto bg-slate-900/30 border border-slate-800 rounded-3xl p-8 backdrop-blur-md shadow-xl space-y-6 animate-fadeIn">
        <div className="text-center space-y-2 border-b border-slate-900 pb-4">
          <div className="inline-flex p-3 bg-red-650/15 border border-red-500/20 rounded-2xl text-red-400 mb-2">
            <Shield className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Sunting Profil & PIN Keamanan</h2>
          <p className="text-xs text-slate-500">Anda dapat merubah nama panggil dan kode PIN mandiri di bawah.</p>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
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
            className="w-full py-3 bg-red-650 hover:bg-red-650/80 text-white font-bold text-sm rounded-xl transition-all shadow-lg"
          >
            Simpan Perubahan Profil
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
      {/* Form Add Panitia */}
      <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 space-y-6 h-fit">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Plus className="h-4.5 w-4.5 text-red-500" />
            <span>Daftarkan Anggota Baru</span>
          </h3>
          <p className="text-xs text-slate-500">Pilih salah satu posisi jabatan yang masih kosong.</p>
        </div>

        <form onSubmit={handleAddSubmit} className="space-y-4">
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
              {dynamicPositions.map((pos, idx) => {
                const occupant = pos.isUnique ? getOccupantName(pos) : null;
                return (
                  <option
                    key={idx}
                    value={idx}
                    disabled={!!occupant}
                    className={occupant ? 'text-slate-650 bg-slate-900/50' : 'text-white'}
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
          {sortedPanitiaList.map((p) => {
            const isEditing = editingId === p.id;
            const matchSeksi = seksiList.find(s => s.nama === p.seksi);
            const categoryLabel = matchSeksi ? matchSeksi.kategori : 'Seksi';

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
                        placeholder="Nama Penjabat"
                        className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
                      />
                      <select
                        value={editPosIndex}
                        onChange={(e) => setEditPosIndex(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
                      >
                        {dynamicPositions.map((pos, idx) => {
                          const occupant = pos.isUnique ? getOccupantName(pos, p.id) : null;
                          return (
                            <option
                              key={idx}
                              value={idx}
                              disabled={!!occupant}
                              className={occupant ? 'text-slate-650 bg-slate-900/50' : 'text-white'}
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
                        onClick={() => handleSaveEditSubmit(p.id)}
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
                      <div className="flex items-center gap-2">
                        <div className="text-[9px] font-black text-red-405 bg-red-650/10 border border-red-500/20 px-2 py-0.5 rounded-full w-fit uppercase tracking-wider">
                          {p.seksi}
                        </div>
                        {categoryLabel === 'BOD' && (
                          <span className="text-[8px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded-md font-black uppercase">BOD</span>
                        )}
                        {categoryLabel === 'Inti' && (
                          <span className="text-[8px] bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded-md font-black uppercase">Inti</span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                        {p.nama || <span className="text-slate-500 italic font-medium">(Belum Ada Penjabat)</span>}
                        {p.id === currentUser?.id && (
                          <span className="text-[8px] bg-red-650 text-white px-1.5 py-0.5 rounded-full font-black uppercase">Anda</span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-450 font-semibold">{p.jabatan}</p>
                      <p className="text-[9px] text-slate-600 font-mono">KODE PIN: {p.pin_akses}</p>
                    </div>

                    <div className="flex items-center space-x-1.5 sm:self-center">
                      <button
                        onClick={() => handleStartEdit(p)}
                        title="Edit Jabatan/Nama"
                        className="p-2 border border-slate-850 hover:border-slate-800 text-slate-500 hover:text-blue-400 rounded-lg transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onResetPin(p.id, p.nama)}
                        title="Reset PIN ke 1212"
                        className="p-2 border border-slate-850 hover:border-slate-800 text-slate-500 hover:text-emerald-450 rounded-lg transition-colors"
                      >
                        <Key className="h-4 w-4" />
                      </button>
                      {p.id !== currentUser?.id && (
                        <button
                          onClick={() => onDeletePanitia(p.id, p.nama)}
                          title="Keluarkan Anggota"
                          className="p-2 border border-slate-850 hover:border-slate-800 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
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
  );
};
