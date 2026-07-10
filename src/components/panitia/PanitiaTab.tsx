'use client';

import React, { useState, useMemo } from 'react';
import {
  Plus, Trash2, Key, Edit2, Check, X, Shield, Lock,
  Users, Crown, Star, User, ChevronRight, ChevronDown,
  UserCog, AlertCircle
} from 'lucide-react';

type GroupType = 'Pelindung' | 'Penasihat' | 'Inti' | 'Harian';
type LevelType = 'Koordinator' | 'Sub-Koordinator' | 'Anggota';

interface PanitiaTabProps {
  panitiaList: any[];
  seksiList: any[];
  currentUser: any;
  onAddPanitia: (nama: string, seksi: string, jabatan: string, level: string, parentId?: string | null) => Promise<void>;
  onEditPanitia: (id: string, nama: string, seksi: string, jabatan: string, level: string, parentId?: string | null) => Promise<void>;
  onDeletePanitia: (id: string, nama: string) => Promise<void>;
  onResetPin: (id: string, nama: string) => Promise<void>;
  onUpdateOwnProfile: (nama: string, pin?: string) => Promise<void>;
}

// ─── LEVEL BADGE ──────────────────────────────────────────
const LevelBadge = ({ level }: { level: string }) => {
  const map: Record<string, string> = {
    'Pelindung':       'bg-purple-100 text-purple-700 border border-purple-200',
    'Penasihat':       'bg-blue-100 text-blue-700 border border-blue-200',
    'Inti':            'bg-red-100 text-red-700 border border-red-200',
    'Koordinator':     'bg-amber-100 text-amber-700 border border-amber-200',
    'Sub-Koordinator': 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    'Anggota':         'bg-slate-100 text-slate-600 border border-slate-200',
  };
  return (
    <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-wide ${map[level] || map['Anggota']}`}>
      {level}
    </span>
  );
};

// ─── MEMBER ROW (small row inside hierarchy) ──────────────
const MemberRow = ({
  p, currentUser, isInti, onEdit, onDelete, onResetPin,
}: {
  p: any; currentUser: any; isInti: boolean;
  onEdit: (p: any) => void;
  onDelete: (id: string, nama: string) => void;
  onResetPin: (id: string, nama: string) => void;
}) => (
  <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 group hover:border-red-200 hover:bg-red-50/30 transition-all">
    <div className="flex items-center gap-2">
      <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
      <div>
        <span className="text-sm font-semibold text-slate-800">
          {p.nama || <span className="text-slate-400 italic text-xs">Belum Ada Penjabat</span>}
        </span>
        {p.id === currentUser?.id && (
          <span className="ml-1.5 text-[8px] bg-red-600 text-white px-1.5 py-0.5 rounded-full font-black uppercase">Anda</span>
        )}
        {p.jabatan && p.jabatan !== p.level && (
          <span className="ml-1.5 text-[10px] text-slate-500">— {p.jabatan}</span>
        )}
      </div>
    </div>
    {isInti && (
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={() => onEdit(p)} title="Edit" className="p-1 text-slate-400 hover:text-blue-500 rounded-lg transition-colors">
          <Edit2 className="h-3 w-3" />
        </button>
        <button onClick={() => onResetPin(p.id, p.nama)} title="Reset PIN" className="p-1 text-slate-400 hover:text-amber-500 rounded-lg transition-colors">
          <Key className="h-3 w-3" />
        </button>
        {p.id !== currentUser?.id && (
          <button onClick={() => onDelete(p.id, p.nama)} title="Hapus" className="p-1 text-slate-400 hover:text-red-500 rounded-lg transition-colors">
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
    )}
  </div>
);

// ─── FLAT SECTION (Pelindung / Penasihat) ─────────────────
const FlatSection = ({
  title, icon: Icon, members, currentUser, isInti, onEdit, onDelete, onResetPin, colorClass,
}: any) => {
  if (members.length === 0) return null;
  return (
    <div className="space-y-2">
      <div className={`flex items-center gap-2 font-bold text-sm ${colorClass}`}>
        <Icon className="h-4 w-4" />
        <span>{title}</span>
        <span className="text-xs font-normal text-slate-400">({members.length} orang)</span>
      </div>
      <div className="space-y-1.5 pl-6">
        {members.map((p: any) => (
          <MemberRow key={p.id} p={p} currentUser={currentUser} isInti={isInti} onEdit={onEdit} onDelete={onDelete} onResetPin={onResetPin} />
        ))}
      </div>
    </div>
  );
};

export const PanitiaTab: React.FC<PanitiaTabProps> = ({
  panitiaList, seksiList, currentUser,
  onAddPanitia, onEditPanitia, onDeletePanitia, onResetPin, onUpdateOwnProfile,
}) => {
  // ─── ADD FORM STATE ───────────────────────────────────────
  const [group, setGroup] = useState<GroupType>('Harian');
  const [nama, setNama] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [selectedSeksi, setSelectedSeksi] = useState('');
  const [level, setLevel] = useState<LevelType>('Koordinator');
  const [intiJabatan, setIntiJabatan] = useState('Ketua Panitia');
  const [parentId, setParentId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ─── EDIT STATE ───────────────────────────────────────────
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNama, setEditNama] = useState('');
  const [editJabatan, setEditJabatan] = useState('');
  const [editSeksi, setEditSeksi] = useState('');
  const [editLevel, setEditLevel] = useState('');
  const [editParentId, setEditParentId] = useState('');

  // ─── PROFILE FORM STATE (non-Inti) ───────────────────────
  const [profNama, setProfNama] = useState(currentUser?.nama || '');
  const [profPin, setProfPin] = useState('');
  const [profPinConfirm, setProfPinConfirm] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // ─── ACCORDION ────────────────────────────────────────────
  const [expandedSeksi, setExpandedSeksi] = useState<Set<string>>(new Set(['all']));

  const toggleSeksi = (name: string) => {
    setExpandedSeksi(prev => {
      const n = new Set(prev);
      n.has(name) ? n.delete(name) : n.add(name);
      return n;
    });
  };

  const isInti = currentUser?.seksi === 'Inti';

  // ─── DERIVED DATA ─────────────────────────────────────────
  const harianSeksiList = useMemo(() =>
    seksiList.filter(s => s.kategori === 'Seksi'),
    [seksiList]
  );

  const pelindungList = useMemo(() =>
    panitiaList.filter(p => p.seksi === 'Pelindung' || p.level === 'Pelindung'),
    [panitiaList]
  );
  const penasihatList = useMemo(() =>
    panitiaList.filter(p => p.seksi === 'Penasihat' || p.level === 'Penasihat'),
    [panitiaList]
  );
  const intiList = useMemo(() => {
    const list = panitiaList.filter(p => p.seksi === 'Inti');
    const order = ['Ketua Panitia', 'Sekretaris', 'Bendahara'];
    return [...list].sort((a, b) => {
      const ia = order.indexOf(a.jabatan), ib = order.indexOf(b.jabatan);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
  }, [panitiaList]);

  const harianMembers = useMemo(() =>
    panitiaList.filter(p =>
      !['Pelindung', 'Penasihat', 'Inti'].includes(p.seksi) &&
      !['Pelindung', 'Penasihat'].includes(p.level)
    ),
    [panitiaList]
  );

  // All unique seksi names in harianMembers + from seksiList
  const harianSeksiNames = useMemo(() => {
    const fromMembers = [...new Set(harianMembers.map(p => p.seksi))];
    const fromList = harianSeksiList.map(s => s.nama);
    return [...new Set([...fromList, ...fromMembers])].filter(Boolean);
  }, [harianMembers, harianSeksiList]);

  // For the add form — parent options
  const koordinatorsInSeksi = useMemo(() =>
    panitiaList.filter(p => p.seksi === selectedSeksi && p.level === 'Koordinator'),
    [panitiaList, selectedSeksi]
  );
  const subKoordsInSeksi = useMemo(() =>
    panitiaList.filter(p => p.seksi === selectedSeksi && p.level === 'Sub-Koordinator'),
    [panitiaList, selectedSeksi]
  );
  const currentSeksiInfo = useMemo(() =>
    harianSeksiList.find(s => s.nama === selectedSeksi),
    [harianSeksiList, selectedSeksi]
  );

  // For edit form — parent options
  const editKoordinatorsInSeksi = useMemo(() =>
    panitiaList.filter(p => p.seksi === editSeksi && p.level === 'Koordinator' && p.id !== editingId),
    [panitiaList, editSeksi, editingId]
  );
  const editSubKoordsInSeksi = useMemo(() =>
    panitiaList.filter(p => p.seksi === editSeksi && p.level === 'Sub-Koordinator' && p.id !== editingId),
    [panitiaList, editSeksi, editingId]
  );

  // ─── HANDLERS ─────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim() || submitting) return;
    setSubmitting(true);
    try {
      if (group === 'Pelindung') {
        await onAddPanitia(nama.trim(), 'Pelindung', jabatan.trim() || 'Pelindung', 'Pelindung', null);
      } else if (group === 'Penasihat') {
        await onAddPanitia(nama.trim(), 'Penasihat', jabatan.trim() || 'Penasihat', 'Penasihat', null);
      } else if (group === 'Inti') {
        await onAddPanitia(nama.trim(), 'Inti', intiJabatan, 'Inti', null);
      } else {
        // Harian
        if (!selectedSeksi || !level) { alert('Pilih seksi dan level terlebih dahulu.'); return; }
        let finalParentId: string | null = null;
        if (level === 'Sub-Koordinator' || level === 'Anggota') {
          finalParentId = parentId || null;
        }
        await onAddPanitia(nama.trim(), selectedSeksi, jabatan.trim() || level, level, finalParentId);
      }
      setNama(''); setJabatan(''); setParentId('');
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const handleStartEdit = (p: any) => {
    setEditingId(p.id);
    setEditNama(p.nama || '');
    setEditJabatan(p.jabatan || '');
    setEditSeksi(p.seksi || '');
    setEditLevel(p.level || 'Anggota');
    setEditParentId(p.parent_id || '');
  };

  const handleSaveEdit = async () => {
    if (!editNama.trim()) return;
    try {
      await onEditPanitia(
        editingId!,
        editNama.trim(),
        editSeksi,
        editJabatan.trim() || editLevel,
        editLevel,
        editParentId || null
      );
      setEditingId(null);
    } catch (err) { console.error(err); }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(''); setProfileError('');
    if (!profNama.trim()) { setProfileError('Nama tidak boleh kosong.'); return; }
    if (profPin) {
      if (profPin.length !== 4 || !/^\d+$/.test(profPin)) { setProfileError('PIN baru harus 4 digit angka.'); return; }
      if (profPin !== profPinConfirm) { setProfileError('Konfirmasi PIN tidak cocok.'); return; }
    }
    try {
      await onUpdateOwnProfile(profNama.trim(), profPin || undefined);
      setProfileSuccess('Profil berhasil diperbarui!');
      setProfPin(''); setProfPinConfirm('');
    } catch (err: any) { setProfileError(err.message || 'Gagal memperbarui profil.'); }
  };

  // ─── NON-INTI VIEW: Profile Only ──────────────────────────
  if (!isInti) {
    return (
      <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6 animate-fadeIn">
        <div className="text-center space-y-2 border-b border-slate-100 pb-4">
          <div className="inline-flex p-3 bg-red-50 border border-red-100 rounded-2xl text-red-500 mb-2">
            <Shield className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Sunting Profil & PIN Keamanan</h2>
          <p className="text-xs text-slate-500">Anda dapat merubah nama panggil dan kode PIN mandiri di bawah.</p>
        </div>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Nama Lengkap</label>
            <input type="text" required value={profNama} onChange={e => setProfNama(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-red-400" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Seksi</label>
              <input type="text" disabled value={currentUser?.seksi || ''}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-400 cursor-not-allowed" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Jabatan</label>
              <input type="text" disabled value={currentUser?.jabatan || ''}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-400 cursor-not-allowed" />
            </div>
          </div>
          <div className="border-t border-slate-100 pt-4 space-y-4">
            <div>
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-red-500" /> Ganti PIN Baru
              </h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Kosongkan jika tidak diganti.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">PIN Baru (4 Angka)</label>
                <input type="password" maxLength={4} pattern="[0-9]*" inputMode="numeric"
                  value={profPin} onChange={e => setProfPin(e.target.value)} placeholder="••••"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-center font-mono tracking-widest focus:outline-none focus:border-red-400" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Konfirmasi PIN</label>
                <input type="password" maxLength={4} pattern="[0-9]*" inputMode="numeric"
                  value={profPinConfirm} onChange={e => setProfPinConfirm(e.target.value)} placeholder="••••"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-center font-mono tracking-widest focus:outline-none focus:border-red-400" />
              </div>
            </div>
          </div>
          {profileSuccess && <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl">{profileSuccess}</div>}
          {profileError && <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl">{profileError}</div>}
          <button type="submit" className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl transition-all shadow-sm">
            Simpan Perubahan Profil
          </button>
        </form>
      </div>
    );
  }

  // ─── INTI VIEW: Full Management ───────────────────────────
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">

      {/* ── LEFT: ADD FORM ──────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 h-fit shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Plus className="h-4 w-4 text-red-500" /> Daftarkan Anggota Baru
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">Pilih grup, seksi, dan level terlebih dahulu.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Group */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Grup / Kelompok</label>
            <div className="grid grid-cols-2 gap-2">
              {(['Pelindung', 'Penasihat', 'Inti', 'Harian'] as GroupType[]).map(g => (
                <button key={g} type="button" onClick={() => { setGroup(g); setNama(''); setJabatan(''); setSelectedSeksi(''); setParentId(''); }}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${group === g ? 'bg-red-600 text-white border-red-600' : 'bg-white border-slate-200 text-slate-600 hover:border-red-300'}`}>
                  {g === 'Harian' ? 'Harian (Seksi)' : g}
                </button>
              ))}
            </div>
          </div>

          {/* Inti: jabatan selection */}
          {group === 'Inti' && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Jabatan Inti</label>
              <select value={intiJabatan} onChange={e => setIntiJabatan(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-red-400">
                <option>Ketua Panitia</option>
                <option>Sekretaris</option>
                <option>Bendahara</option>
              </select>
            </div>
          )}

          {/* Harian: Seksi → Level → Parent */}
          {group === 'Harian' && (
            <>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Seksi</label>
                <select value={selectedSeksi} onChange={e => { setSelectedSeksi(e.target.value); setParentId(''); setLevel('Koordinator'); }}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-red-400" required>
                  <option value="">— Pilih Seksi —</option>
                  {harianSeksiList.map(s => (
                    <option key={s.id} value={s.nama}>{s.nama}</option>
                  ))}
                </select>
              </div>

              {selectedSeksi && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Level Jabatan</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['Koordinator', 'Sub-Koordinator', 'Anggota'] as LevelType[]).map(lv => (
                      <button key={lv} type="button" onClick={() => { setLevel(lv); setParentId(''); }}
                        className={`py-2 px-1 text-[10px] font-bold rounded-xl border transition-all ${level === lv ? 'bg-red-600 text-white border-red-600' : 'bg-white border-slate-200 text-slate-600 hover:border-red-300'}`}>
                        {lv === 'Sub-Koordinator' ? 'Sub-Koord' : lv}
                      </button>
                    ))}
                  </div>
                  {currentSeksiInfo && !currentSeksiInfo.mempunyai_sub_koordinator && level === 'Sub-Koordinator' && (
                    <p className="text-[9px] text-amber-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Seksi ini tidak menggunakan sub-koordinator.
                    </p>
                  )}
                </div>
              )}

              {/* Parent selector */}
              {selectedSeksi && level === 'Sub-Koordinator' && koordinatorsInSeksi.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Di Bawah Koordinator</label>
                  <select value={parentId} onChange={e => setParentId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-red-400">
                    <option value="">— Pilih Koordinator —</option>
                    {koordinatorsInSeksi.map(k => (
                      <option key={k.id} value={k.id}>{k.nama}</option>
                    ))}
                  </select>
                </div>
              )}

              {selectedSeksi && level === 'Anggota' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Atasan Langsung</label>
                  <select value={parentId} onChange={e => setParentId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-red-400" required>
                    <option value="">— Pilih Atasan —</option>
                    {koordinatorsInSeksi.length > 0 && (
                      <optgroup label="Koordinator">
                        {koordinatorsInSeksi.map(k => (
                          <option key={k.id} value={k.id}>{k.nama}</option>
                        ))}
                      </optgroup>
                    )}
                    {subKoordsInSeksi.length > 0 && (
                      <optgroup label="Sub-Koordinator">
                        {subKoordsInSeksi.map(sk => (
                          <option key={sk.id} value={sk.id}>{sk.nama}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
              )}
            </>
          )}

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Lengkap *</label>
            <input type="text" required value={nama} onChange={e => setNama(e.target.value)}
              placeholder="Contoh: Pak Bambang Suhendra"
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-red-400 font-semibold" />
          </div>

          {/* Custom jabatan (optional) */}
          {(group === 'Pelindung' || group === 'Penasihat' || group === 'Harian') && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Jabatan Kustom <span className="font-normal text-slate-400">(opsional)</span></label>
              <input type="text" value={jabatan} onChange={e => setJabatan(e.target.value)}
                placeholder={group === 'Pelindung' ? 'Contoh: Ketua RT' : group === 'Penasihat' ? 'Contoh: Tokoh Masyarakat' : 'Contoh: Koordinator Sesi Pagi'}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-red-400" />
            </div>
          )}

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] text-slate-500">
            Anggota baru akan mendapat PIN default <strong>1212</strong>. Bisa diganti mandiri di halaman profil.
          </div>

          <button type="submit" disabled={submitting}
            className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition-all disabled:opacity-50">
            {submitting ? 'Menyimpan...' : 'Daftarkan Anggota'}
          </button>
        </form>
      </div>

      {/* ── RIGHT: HIERARCHY VIEW ───────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:col-span-2 space-y-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Users className="h-4 w-4 text-red-500" /> Susunan Kepanitiaan
          </h3>
          <span className="text-xs text-slate-400 font-semibold">{panitiaList.length} orang terdaftar</span>
        </div>

        <div className="space-y-6 overflow-y-auto max-h-[70vh] pr-1">

          {/* PELINDUNG */}
          <FlatSection title="Pelindung / Pembina" icon={Crown} members={pelindungList}
            currentUser={currentUser} isInti={isInti} colorClass="text-purple-700"
            onEdit={handleStartEdit} onDelete={onDeletePanitia} onResetPin={onResetPin} />

          {/* PENASIHAT */}
          <FlatSection title="Penasihat" icon={Star} members={penasihatList}
            currentUser={currentUser} isInti={isInti} colorClass="text-blue-700"
            onEdit={handleStartEdit} onDelete={onDeletePanitia} onResetPin={onResetPin} />

          {/* PANITIA INTI */}
          {intiList.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-red-700">
                <Shield className="h-4 w-4" />
                <span>Panitia Inti</span>
                <span className="text-xs font-normal text-slate-400">({intiList.length} orang)</span>
              </div>
              <div className="space-y-1.5 pl-6">
                {intiList.map(p => (
                  <div key={p.id}>
                    {editingId === p.id ? (
                      <EditInlineRow p={p} editNama={editNama} setEditNama={setEditNama}
                        editJabatan={editJabatan} setEditJabatan={setEditJabatan}
                        onSave={handleSaveEdit} onCancel={() => setEditingId(null)} />
                    ) : (
                      <MemberRow p={p} currentUser={currentUser} isInti={isInti}
                        onEdit={handleStartEdit} onDelete={onDeletePanitia} onResetPin={onResetPin} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SEPARATOR */}
          {(pelindungList.length > 0 || penasihatList.length > 0 || intiList.length > 0) && harianSeksiNames.length > 0 && (
            <div className="border-t-2 border-slate-100 pt-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Panitia Harian (Per Seksi)</p>
            </div>
          )}

          {/* PANITIA HARIAN: grouped by seksi */}
          {harianSeksiNames.map(seksiNama => {
            const seksiInfo = harianSeksiList.find(s => s.nama === seksiNama);
            const seksiMembers = harianMembers.filter(p => p.seksi === seksiNama);
            const koordinators = seksiMembers.filter(p => p.level === 'Koordinator');
            const isExpanded = expandedSeksi.has('all') || expandedSeksi.has(seksiNama);

            return (
              <div key={seksiNama} className="border border-slate-200 rounded-2xl overflow-hidden">
                {/* Seksi header */}
                <button onClick={() => toggleSeksi(seksiNama)} type="button"
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-2">
                    <UserCog className="h-4 w-4 text-slate-500" />
                    <span className="font-bold text-sm text-slate-800">Seksi {seksiNama}</span>
                    {seksiInfo?.mempunyai_sub_koordinator && (
                      <span className="text-[8px] bg-emerald-100 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-md font-black uppercase">Sub-Koord</span>
                    )}
                    <span className="text-[10px] text-slate-400 font-semibold">{seksiMembers.length} orang</span>
                  </div>
                  {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                </button>

                {/* Seksi body */}
                {isExpanded && (
                  <div className="p-4 space-y-4">
                    {koordinators.length === 0 && (
                      <p className="text-xs text-slate-400 italic text-center py-2">Belum ada koordinator untuk seksi ini.</p>
                    )}
                    {koordinators.map(koord => {
                      const subKoords = seksiMembers.filter(p => p.level === 'Sub-Koordinator' && p.parent_id === koord.id);
                      const directAnggota = seksiMembers.filter(p => p.level === 'Anggota' && p.parent_id === koord.id);
                      return (
                        <div key={koord.id} className="space-y-2">
                          {/* Koordinator row */}
                          <div className="flex items-center gap-2">
                            <Crown className="h-4 w-4 text-amber-500 shrink-0" />
                            {editingId === koord.id ? (
                              <EditInlineRow p={koord} editNama={editNama} setEditNama={setEditNama}
                                editJabatan={editJabatan} setEditJabatan={setEditJabatan}
                                onSave={handleSaveEdit} onCancel={() => setEditingId(null)}
                                extraFields={
                                  <select value={editParentId} onChange={e => setEditParentId(e.target.value)}
                                    className="bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-[11px] focus:outline-none focus:border-red-400">
                                    <option value="">Tidak ada atasan</option>
                                  </select>
                                } />
                            ) : (
                              <div className="flex-1 flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 group hover:border-amber-300 transition-all">
                                <div>
                                  <span className="text-sm font-bold text-amber-900">{koord.nama}</span>
                                  {koord.jabatan && koord.jabatan !== 'Koordinator' && (
                                    <span className="ml-2 text-xs text-amber-700">— {koord.jabatan}</span>
                                  )}
                                  <LevelBadge level="Koordinator" />
                                </div>
                                {isInti && (
                                  <div className="flex gap-1 shrink-0">
                                    <button onClick={() => handleStartEdit(koord)} className="p-1 text-amber-500 hover:text-blue-500 rounded"><Edit2 className="h-3 w-3" /></button>
                                    <button onClick={() => onResetPin(koord.id, koord.nama)} className="p-1 text-amber-500 hover:text-amber-600 rounded"><Key className="h-3 w-3" /></button>
                                    {koord.id !== currentUser?.id && (
                                      <button onClick={() => onDeletePanitia(koord.id, koord.nama)} className="p-1 text-amber-500 hover:text-red-500 rounded"><Trash2 className="h-3 w-3" /></button>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Sub-Koordinators */}
                          {subKoords.map(sk => {
                            const skAnggota = seksiMembers.filter(p => p.level === 'Anggota' && p.parent_id === sk.id);
                            return (
                              <div key={sk.id} className="pl-8 space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <ChevronRight className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                  {editingId === sk.id ? (
                                    <EditInlineRow p={sk} editNama={editNama} setEditNama={setEditNama}
                                      editJabatan={editJabatan} setEditJabatan={setEditJabatan}
                                      onSave={handleSaveEdit} onCancel={() => setEditingId(null)} />
                                  ) : (
                                    <div className="flex-1 flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 group hover:border-emerald-300 transition-all">
                                      <div>
                                        <span className="text-sm font-bold text-emerald-900">{sk.nama}</span>
                                        {sk.jabatan && sk.jabatan !== 'Sub-Koordinator' && (
                                          <span className="ml-2 text-xs text-emerald-700">— {sk.jabatan}</span>
                                        )}
                                        <span className="ml-1.5 text-[8px] bg-emerald-100 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-md font-black uppercase">Sub-Koord</span>
                                      </div>
                                      {isInti && (
                                        <div className="flex gap-1 shrink-0">
                                          <button onClick={() => handleStartEdit(sk)} className="p-1 text-emerald-500 hover:text-blue-500 rounded"><Edit2 className="h-3 w-3" /></button>
                                          <button onClick={() => onResetPin(sk.id, sk.nama)} className="p-1 text-emerald-500 hover:text-amber-500 rounded"><Key className="h-3 w-3" /></button>
                                          {sk.id !== currentUser?.id && (
                                            <button onClick={() => onDeletePanitia(sk.id, sk.nama)} className="p-1 text-emerald-500 hover:text-red-500 rounded"><Trash2 className="h-3 w-3" /></button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                                {/* Anggota under Sub-Koord */}
                                {skAnggota.length > 0 && (
                                  <div className="pl-8 space-y-1">
                                    {skAnggota.map(a => (
                                      <div key={a.id}>
                                        {editingId === a.id ? (
                                          <EditInlineRow p={a} editNama={editNama} setEditNama={setEditNama}
                                            editJabatan={editJabatan} setEditJabatan={setEditJabatan}
                                            onSave={handleSaveEdit} onCancel={() => setEditingId(null)} />
                                        ) : (
                                          <MemberRow p={a} currentUser={currentUser} isInti={isInti}
                                            onEdit={handleStartEdit} onDelete={onDeletePanitia} onResetPin={onResetPin} />
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {/* Direct Anggota (no sub-koord) */}
                          {directAnggota.length > 0 && (
                            <div className="pl-8 space-y-1">
                              {directAnggota.map(a => (
                                <div key={a.id}>
                                  {editingId === a.id ? (
                                    <EditInlineRow p={a} editNama={editNama} setEditNama={setEditNama}
                                      editJabatan={editJabatan} setEditJabatan={setEditJabatan}
                                      onSave={handleSaveEdit} onCancel={() => setEditingId(null)} />
                                  ) : (
                                    <MemberRow p={a} currentUser={currentUser} isInti={isInti}
                                      onEdit={handleStartEdit} onDelete={onDeletePanitia} onResetPin={onResetPin} />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {panitiaList.length === 0 && (
            <p className="text-xs text-slate-400 italic text-center py-12">Belum ada panitia terdaftar.</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── INLINE EDIT ROW ──────────────────────────────────────
function EditInlineRow({
  p, editNama, setEditNama, editJabatan, setEditJabatan, onSave, onCancel, extraFields
}: {
  p: any; editNama: string; setEditNama: (v: string) => void;
  editJabatan: string; setEditJabatan: (v: string) => void;
  onSave: () => void; onCancel: () => void; extraFields?: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex flex-wrap items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
      <input value={editNama} onChange={e => setEditNama(e.target.value)} placeholder="Nama"
        className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-400 flex-1 min-w-[120px]" />
      <input value={editJabatan} onChange={e => setEditJabatan(e.target.value)} placeholder="Jabatan kustom (opsional)"
        className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-400 flex-1 min-w-[120px]" />
      {extraFields}
      <div className="flex gap-1">
        <button onClick={onSave} className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors">
          <Check className="h-3 w-3" />
        </button>
        <button onClick={onCancel} className="p-1.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors">
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
