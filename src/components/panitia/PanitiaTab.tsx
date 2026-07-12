'use client';

import React, { useState, useMemo } from 'react';
import Swal from 'sweetalert2';
import {
  Plus, Trash2, Key, Edit2, Check, X, Shield, Lock,
  Crown, Star, User, Users, ChevronRight, ChevronDown,
  UserCog, AlertCircle, MessageCircle, Download
} from 'lucide-react';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type GroupType = 'Pelindung' | 'Penasihat' | 'Inti' | 'Harian';
type LevelType = 'Koordinator' | 'Sub-Koordinator' | 'Anggota';

interface PanitiaTabProps {
  panitiaList: any[];
  seksiList: any[];
  currentUser: any;
  onAddPanitia: (nama: string, seksi: string, jabatan: string, level: string, parentId?: string | null, no_wa?: string) => Promise<void>;
  onEditPanitia: (id: string, nama: string, seksi: string, jabatan: string, level: string, parentId?: string | null, no_wa?: string) => Promise<void>;
  onDeletePanitia: (id: string, nama: string) => Promise<void>;
  onResetPin: (id: string, nama: string) => Promise<void>;
  onUpdateOwnProfile: (nama: string, pin?: string, oldPin?: string, noWa?: string) => Promise<void>;
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
    <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-wide shrink-0 ${map[level] || map['Anggota']}`}>
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
}) => {
  const handleDeleteClick = () => {
    Swal.fire({
      title: 'Apakah Anda yakin?',
      text: `Ingin mengeluarkan "${p.nama}" dari kepanitiaan?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Keluarkan!',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        onDelete(p.id, p.nama);
      }
    });
  };

  const handleResetPinClick = () => {
    Swal.fire({
      title: 'Reset PIN Akses',
      text: `Ingin mereset PIN keamanan "${p.nama}" kembali ke default 1212?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#f59e0b',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Reset PIN!',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        onResetPin(p.id, p.nama);
      }
    });
  };

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-red-200 hover:bg-red-50/30 transition-all gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
        <div className="truncate">
          <span className="text-sm font-semibold text-slate-800">
            {p.nama || <span className="text-slate-400 italic text-xs">Belum Ada Penjabat</span>}
          </span>
          {p.id === currentUser?.id && (
            <span className="ml-1.5 text-[8px] bg-red-600 text-white px-1.5 py-0.5 rounded-full font-black uppercase inline-block">Anda</span>
          )}
          {p.jabatan && p.jabatan !== p.level && (
            <span className="ml-1.5 text-[10px] text-slate-500">— {p.jabatan}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">

        {p.no_wa && (
          <a href={`https://wa.me/${p.no_wa.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-1 text-slate-400 hover:text-green-500 rounded-lg transition-colors" title="Chat WhatsApp">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </a>
        )}

        {isInti && (
          <>
          <button onClick={() => onEdit(p)} title="Edit" className="p-1 text-slate-400 hover:text-blue-500 rounded-lg transition-colors">
            <Edit2 className="h-3 w-3" />
          </button>
          <button onClick={handleResetPinClick} title="Reset PIN" className="p-1 text-slate-400 hover:text-amber-500 rounded-lg transition-colors">
            <Key className="h-3 w-3" />
          </button>
          {p.id !== currentUser?.id && (
            <button onClick={handleDeleteClick} title="Hapus" className="p-1 text-slate-400 hover:text-red-500 rounded-lg transition-colors">
              <Trash2 className="h-3 w-3" />
            </button>
          )}
          </>
        )}
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
  const [noWa, setNoWa] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ─── EDIT STATE ───────────────────────────────────────────
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNama, setEditNama] = useState('');
  const [editJabatan, setEditJabatan] = useState('');
  const [editSeksi, setEditSeksi] = useState('');
  const [editLevel, setEditLevel] = useState('');
  const [editParentId, setEditParentId] = useState('');
  const [editNoWa, setEditNoWa] = useState('');

  // ─── PROFILE FORM STATE (non-Inti) ───────────────────────
  const [profNama, setProfNama] = useState(currentUser?.nama || '');
  const [profNoWa, setProfNoWa] = useState(currentUser?.no_wa || '');
  const [profOldPin, setProfOldPin] = useState('');
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
  const handleExport = (format: 'md' | 'csv' | 'pdf') => {
    const exportRows: { grup: string, jabatan: string, nama: string, no_wa: string }[] = [];
    
    pelindungList.forEach(p => exportRows.push({ grup: 'Pelindung / Pembina', jabatan: p.jabatan || 'Pelindung', nama: p.nama, no_wa: p.no_wa || '-' }));
    penasihatList.forEach(p => exportRows.push({ grup: 'Penasihat', jabatan: p.jabatan || 'Penasihat', nama: p.nama, no_wa: p.no_wa || '-' }));
    intiList.forEach(p => exportRows.push({ grup: 'Panitia Inti', jabatan: p.jabatan, nama: p.nama, no_wa: p.no_wa || '-' }));
    
    harianSeksiNames.forEach(seksiNama => {
      const seksiMembers = harianMembers.filter(p => p.seksi === seksiNama);
      const koordinators = seksiMembers.filter(p => p.level === 'Koordinator');
      koordinators.forEach(k => {
        exportRows.push({ grup: `Seksi ${seksiNama}`, jabatan: k.jabatan || 'Koordinator', nama: k.nama, no_wa: k.no_wa || '-' });
        const subKoords = seksiMembers.filter(p => p.level === 'Sub-Koordinator' && p.parent_id === k.id);
        subKoords.forEach(sk => {
          exportRows.push({ grup: `Seksi ${seksiNama}`, jabatan: sk.jabatan || 'Sub-Koordinator', nama: sk.nama, no_wa: sk.no_wa || '-' });
          const anggotas = seksiMembers.filter(p => p.level === 'Anggota' && p.parent_id === sk.id);
          anggotas.forEach(a => exportRows.push({ grup: `Seksi ${seksiNama}`, jabatan: a.jabatan || 'Anggota', nama: a.nama, no_wa: a.no_wa || '-' }));
        });
        const directAnggota = seksiMembers.filter(p => p.level === 'Anggota' && p.parent_id === k.id);
        directAnggota.forEach(a => exportRows.push({ grup: `Seksi ${seksiNama}`, jabatan: a.jabatan || 'Anggota', nama: a.nama, no_wa: a.no_wa || '-' }));
      });
      const validKoordIds = new Set(koordinators.map(k => k.id));
      const validSubKoordIds = new Set(seksiMembers.filter(p => p.level === 'Sub-Koordinator' && validKoordIds.has(p.parent_id)).map(sk => sk.id));
      const orphanedMembers = seksiMembers.filter(p => {
        if (p.level === 'Koordinator') return false;
        if (p.level === 'Sub-Koordinator') return !validKoordIds.has(p.parent_id);
        if (p.level === 'Anggota') return !validKoordIds.has(p.parent_id) && !validSubKoordIds.has(p.parent_id);
        return true;
      });
      orphanedMembers.forEach(o => exportRows.push({ grup: `Seksi ${seksiNama} (Tanpa Atasan)`, jabatan: o.jabatan || o.level, nama: o.nama, no_wa: o.no_wa || '-' }));
    });

    if (format === 'csv') {
      const header = 'Grup/Seksi,Jabatan,Nama Lengkap,No WA\n';
      const csvContent = header + exportRows.map(r => `"${r.grup}","${r.jabatan}","${r.nama}","${r.no_wa}"`).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Susunan_Panitia_HUTRI81.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === 'md') {
      let mdContent = '# Susunan Kepanitiaan HUT RI Ke-81 RT 12\n\n';
      let currentGrup = '';
      exportRows.forEach(r => {
        if (r.grup !== currentGrup) {
          mdContent += `\n### ${r.grup}\n\n`;
          currentGrup = r.grup;
        }
        mdContent += `- **${r.nama}** (${r.jabatan}) ${r.no_wa !== '-' ? '- WA: ' + r.no_wa : ''}\n`;
      });
      const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Susunan_Panitia_HUTRI81.md';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === 'pdf') {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text('Susunan Kepanitiaan HUT RI Ke-81', 14, 15);
      doc.setFontSize(10);
      doc.text('RT 12 Pelem Kidul', 14, 21);
      
      const tableData = exportRows.map(r => [r.grup, r.jabatan, r.nama, r.no_wa]);
      autoTable(doc, {
        startY: 28,
        head: [['Grup / Seksi', 'Jabatan', 'Nama Lengkap', 'No WhatsApp']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [220, 38, 38] }, // Red-600
        styles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 40 },
          2: { cellWidth: 50 },
          3: { cellWidth: 'auto' }
        },
      });
      
      doc.save('Susunan_Panitia_HUTRI81.pdf');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim() || submitting) return;
    setSubmitting(true);
    try {
      if (group === 'Pelindung') {
        await onAddPanitia(nama.trim(), 'Pelindung', jabatan.trim() || 'Pelindung', 'Pelindung', null, noWa.trim());
      } else if (group === 'Penasihat') {
        await onAddPanitia(nama.trim(), 'Penasihat', jabatan.trim() || 'Penasihat', 'Penasihat', null, noWa.trim());
      } else if (group === 'Inti') {
        await onAddPanitia(nama.trim(), 'Inti', intiJabatan, 'Inti', null, noWa.trim());
      } else {
        // Harian
        if (!selectedSeksi || !level) {
          Swal.fire('Error', 'Pilih seksi dan level terlebih dahulu.', 'error');
          setSubmitting(false);
          return;
        }
        let finalParentId: string | null = null;
        if (level === 'Sub-Koordinator' || level === 'Anggota') {
          finalParentId = parentId || null;
        }
        await onAddPanitia(nama.trim(), selectedSeksi, jabatan.trim() || level, level, finalParentId, noWa.trim());
      }
      setNama(''); setJabatan(''); setParentId(''); setNoWa('');
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Anggota berhasil ditambahkan',
        showConfirmButton: false,
        timer: 3000
      });
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
    setEditNoWa(p.no_wa || '');
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
        editParentId || null,
        editNoWa.trim()
      );
      setEditingId(null);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Perubahan berhasil disimpan',
        showConfirmButton: false,
        timer: 3000
      });
    } catch (err) { console.error(err); }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(''); setProfileError('');
    if (!profNama.trim()) { setProfileError('Nama tidak boleh kosong.'); return; }
    if (profPin) {
      if (!profOldPin) { setProfileError('Anda harus memasukkan PIN lama untuk merubah PIN.'); return; }
      if (profPin.length !== 4 || !/^\d+$/.test(profPin)) { setProfileError('PIN baru harus 4 digit angka.'); return; }
      if (profPin !== profPinConfirm) { setProfileError('Konfirmasi PIN tidak cocok.'); return; }
    }
    try {
      await onUpdateOwnProfile(profNama.trim(), profPin || undefined, profOldPin || undefined, profNoWa.trim());
      setProfileSuccess('Profil berhasil diperbarui!');
      setProfPin(''); setProfPinConfirm(''); setProfOldPin('');
    } catch (err: any) { setProfileError(err.message || 'Gagal memperbarui profil.'); }
  };

  const handleSweetDelete = (id: string, name: string) => {
    Swal.fire({
      title: 'Apakah Anda yakin?',
      text: `Ingin mengeluarkan "${name}" dari kepanitiaan?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Keluarkan!',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        onDeletePanitia(id, name);
      }
    });
  };

  const handleSweetResetPin = (id: string, name: string) => {
    Swal.fire({
      title: 'Reset PIN Akses',
      text: `Ingin mereset PIN keamanan "${name}" kembali ke default 1212?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#f59e0b',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Reset PIN!',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        onResetPin(id, name);
      }
    });
  };



  // ─── INTI VIEW: Full Management ───────────────────────────
  return (
    <div className={`grid grid-cols-1 ${isInti ? "lg:grid-cols-3" : ""} gap-8 animate-fadeIn`}>

      {/* ── LEFT: FORM COLUMN ──────────────────────────── */}
      {isInti && (
      <div className="space-y-6">
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
        </div>
      )}

      {/* ── RIGHT: HIERARCHY VIEW ───────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:col-span-2 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Users className="h-4 w-4 text-red-500" /> Susunan Kepanitiaan
            </h3>
            <span className="text-xs text-slate-400 font-semibold">{panitiaList.length} orang terdaftar</span>
          </div>

          <div className="relative group">
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors">
              <Download className="h-3.5 w-3.5" />
              <span>Export</span>
            </button>
            <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-lg border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 overflow-hidden">
              <button onClick={() => handleExport('pdf')} className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-red-50 hover:text-red-600 transition-colors">📄 File PDF</button>
              <button onClick={() => handleExport('csv')} className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-green-50 hover:text-green-600 transition-colors">📊 File CSV</button>
              <button onClick={() => handleExport('md')} className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">📝 File MD</button>
            </div>
          </div>
        </div>

        <div className="space-y-6 overflow-y-auto max-h-[70vh] pr-1">

          {/* PELINDUNG */}
          {pelindungList.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-purple-700">
                <Crown className="h-4 w-4" />
                <span>Pelindung / Pembina</span>
                <span className="text-xs font-normal text-slate-400">({pelindungList.length} orang)</span>
              </div>
              <div className="space-y-1.5 pl-6">
                {pelindungList.map(p => (
                  <div key={p.id}>
                    {false && editingId === p.id ? (
                      <EditInlineRow p={p} editNama={editNama} setEditNama={setEditNama}
                        editJabatan={editJabatan} setEditJabatan={setEditJabatan}
                        onSave={handleSaveEdit} onCancel={() => setEditingId(null)} extraFields={<input value={editNoWa} onChange={e => setEditNoWa(e.target.value)} placeholder="Nomor WA (opsional)" className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-400 w-32" />} />
                    ) : (
                      <MemberRow p={p} currentUser={currentUser} isInti={isInti}
                        onEdit={handleStartEdit} onDelete={handleSweetDelete} onResetPin={handleSweetResetPin} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PENASIHAT */}
          {penasihatList.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-blue-700">
                <Star className="h-4 w-4" />
                <span>Penasihat</span>
                <span className="text-xs font-normal text-slate-400">({penasihatList.length} orang)</span>
              </div>
              <div className="space-y-1.5 pl-6">
                {penasihatList.map(p => (
                  <div key={p.id}>
                    {false && editingId === p.id ? (
                      <EditInlineRow p={p} editNama={editNama} setEditNama={setEditNama}
                        editJabatan={editJabatan} setEditJabatan={setEditJabatan}
                        onSave={handleSaveEdit} onCancel={() => setEditingId(null)} extraFields={<input value={editNoWa} onChange={e => setEditNoWa(e.target.value)} placeholder="Nomor WA (opsional)" className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-400 w-32" />} />
                    ) : (
                      <MemberRow p={p} currentUser={currentUser} isInti={isInti}
                        onEdit={handleStartEdit} onDelete={handleSweetDelete} onResetPin={handleSweetResetPin} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

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
                    {false && editingId === p.id ? (
                      <EditInlineRow p={p} editNama={editNama} setEditNama={setEditNama}
                        editJabatan={editJabatan} setEditJabatan={setEditJabatan}
                        onSave={handleSaveEdit} onCancel={() => setEditingId(null)} extraFields={<input value={editNoWa} onChange={e => setEditNoWa(e.target.value)} placeholder="Nomor WA (opsional)" className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-400 w-32" />} />
                    ) : (
                      <MemberRow p={p} currentUser={currentUser} isInti={isInti}
                        onEdit={handleStartEdit} onDelete={handleSweetDelete} onResetPin={handleSweetResetPin} />
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

            // Find orphaned members (those whose parent_id doesn't link to a valid rendered koord/subkoord)
            const validKoordIds = new Set(koordinators.map(k => k.id));
            const validSubKoordIds = new Set(seksiMembers.filter(p => p.level === 'Sub-Koordinator' && validKoordIds.has(p.parent_id)).map(sk => sk.id));
            
            const orphanedMembers = seksiMembers.filter(p => {
              if (p.level === 'Koordinator') return false;
              if (p.level === 'Sub-Koordinator') return !validKoordIds.has(p.parent_id);
              if (p.level === 'Anggota') return !validKoordIds.has(p.parent_id) && !validSubKoordIds.has(p.parent_id);
              return true;
            });

            return (
              <div key={seksiNama} className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                {/* Seksi header */}
                <button onClick={() => toggleSeksi(seksiNama)} type="button"
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-2">
                    <UserCog className="h-4 w-4 text-slate-500 animate-pulse" />
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
                        <div key={koord.id} className="space-y-2 border-l-2 border-amber-300/40 pl-3">
                          {/* Koordinator row */}
                          <div className="flex items-center gap-2">
                            <Crown className="h-4 w-4 text-amber-500 shrink-0" />
                            {false && editingId === koord.id ? (
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
                              <div className="flex-1 flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 hover:border-amber-300 transition-all gap-2">
                                <div className="truncate">
                                  <span className="text-sm font-bold text-amber-900">{koord.nama}</span>
                                  {koord.jabatan && koord.jabatan !== 'Koordinator' && (
                                    <span className="ml-2 text-xs text-amber-700">— {koord.jabatan}</span>
                                  )}
                                  <span className="ml-2"><LevelBadge level="Koordinator" /></span>
                                  {koord.no_wa && (
                                    <a href={`https://wa.me/${koord.no_wa.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="ml-3 inline-flex text-emerald-500 hover:text-emerald-400" title={`Chat WA ${koord.nama}`}>
                                      <MessageCircle className="h-4 w-4" />
                                    </a>
                                  )}
                                </div>
                                {isInti && (
                                  <div className="flex gap-1 shrink-0">
                                    <button onClick={() => handleStartEdit(koord)} className="p-1 text-amber-500 hover:text-blue-500 rounded"><Edit2 className="h-3 w-3" /></button>
                                    <button onClick={() => handleSweetResetPin(koord.id, koord.nama)} className="p-1 text-amber-500 hover:text-amber-600 rounded"><Key className="h-3 w-3" /></button>
                                    {koord.id !== currentUser?.id && (
                                      <button onClick={() => handleSweetDelete(koord.id, koord.nama)} className="p-1 text-amber-500 hover:text-red-500 rounded"><Trash2 className="h-3 w-3" /></button>
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
                              <div key={sk.id} className="pl-8 space-y-1.5 border-l border-emerald-250 ml-2">
                                <div className="flex items-center gap-2">
                                  <ChevronRight className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                  {false && editingId === sk.id ? (
                                    <EditInlineRow p={sk} editNama={editNama} setEditNama={setEditNama}
                                      editJabatan={editJabatan} setEditJabatan={setEditJabatan}
                                      onSave={handleSaveEdit} onCancel={() => setEditingId(null)} extraFields={<input value={editNoWa} onChange={e => setEditNoWa(e.target.value)} placeholder="Nomor WA (opsional)" className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-400 w-32" />} />
                                  ) : (
                                    <div className="flex-1 flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 hover:border-emerald-300 transition-all gap-2">
                                      <div className="truncate">
                                        <span className="text-sm font-bold text-emerald-900">{sk.nama}</span>
                                        {sk.jabatan && sk.jabatan !== 'Sub-Koordinator' && (
                                          <span className="ml-2 text-xs text-emerald-700">— {sk.jabatan}</span>
                                        )}
                                        <span className="ml-2"><LevelBadge level="Sub-Koordinator" /></span>
                                        {sk.no_wa && (
                                          <a href={`https://wa.me/${sk.no_wa.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="ml-3 inline-flex text-emerald-500 hover:text-emerald-400" title={`Chat WA ${sk.nama}`}>
                                            <MessageCircle className="h-4 w-4" />
                                          </a>
                                        )}
                                      </div>
                                      {isInti && (
                                        <div className="flex gap-1 shrink-0">
                                          <button onClick={() => handleStartEdit(sk)} className="p-1 text-emerald-500 hover:text-blue-500 rounded"><Edit2 className="h-3 w-3" /></button>
                                          <button onClick={() => handleSweetResetPin(sk.id, sk.nama)} className="p-1 text-emerald-500 hover:text-amber-500 rounded"><Key className="h-3 w-3" /></button>
                                          {sk.id !== currentUser?.id && (
                                            <button onClick={() => handleSweetDelete(sk.id, sk.nama)} className="p-1 text-emerald-500 hover:text-red-500 rounded"><Trash2 className="h-3 w-3" /></button>
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
                                        {false && editingId === a.id ? (
                                          <EditInlineRow p={a} editNama={editNama} setEditNama={setEditNama}
                                            editJabatan={editJabatan} setEditJabatan={setEditJabatan}
                                            onSave={handleSaveEdit} onCancel={() => setEditingId(null)} extraFields={<input value={editNoWa} onChange={e => setEditNoWa(e.target.value)} placeholder="Nomor WA (opsional)" className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-400 w-32" />} />
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
                                  {false && editingId === a.id ? (
                                    <EditInlineRow p={a} editNama={editNama} setEditNama={setEditNama}
                                      editJabatan={editJabatan} setEditJabatan={setEditJabatan}
                                      onSave={handleSaveEdit} onCancel={() => setEditingId(null)} extraFields={<input value={editNoWa} onChange={e => setEditNoWa(e.target.value)} placeholder="Nomor WA (opsional)" className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-400 w-32" />} />
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

                    {/* Orphaned Members (No valid parent) */}
                    {orphanedMembers.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-red-100 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                          <AlertCircle className="h-4 w-4" />
                          <span>Anggota Tanpa Atasan ({orphanedMembers.length})</span>
                          <span className="text-[10px] font-normal text-red-400 ml-auto">(Silakan Edit untuk memilih atasan)</span>
                        </div>
                        <div className="space-y-1.5">
                          {orphanedMembers.map(orphan => (
                            <div key={orphan.id}>
                              {false && editingId === orphan.id ? (
                                <EditInlineRow p={orphan} editNama={editNama} setEditNama={setEditNama}
                                  editJabatan={editJabatan} setEditJabatan={setEditJabatan}
                                  onSave={handleSaveEdit} onCancel={() => setEditingId(null)} extraFields={<input value={editNoWa} onChange={e => setEditNoWa(e.target.value)} placeholder="Nomor WA (opsional)" className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-400 w-32" />} />
                              ) : (
                                <MemberRow p={orphan} currentUser={currentUser} isInti={isInti}
                                  onEdit={handleStartEdit} onDelete={handleSweetDelete} onResetPin={handleSweetResetPin} />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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

      {/* ── EDIT MODAL ────────────────────────────────────── */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Edit2 className="h-4 w-4 text-blue-500" /> Edit Panitia
              </h3>
              <button onClick={() => setEditingId(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Lengkap</label>
                <input type="text" value={editNama} onChange={e => setEditNama(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 font-semibold" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Grup / Kelompok</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Pelindung', 'Penasihat', 'Inti', 'Harian']).map(g => {
                     const currentGroup = ['Pelindung', 'Penasihat', 'Inti'].includes(editSeksi) ? editSeksi : 'Harian';
                     return (
                      <button key={g} type="button" onClick={() => { 
                          if (g === 'Harian') {
                              setEditSeksi(harianSeksiList[0]?.nama || '');
                              setEditLevel('Koordinator');
                              setEditJabatan('');
                          } else {
                              setEditSeksi(g);
                              setEditLevel(g);
                              setEditJabatan(g === 'Inti' ? 'Ketua Panitia' : g);
                          }
                          setEditParentId('');
                      }}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${currentGroup === g ? 'bg-red-600 text-white border-red-600' : 'bg-white border-slate-200 text-slate-600 hover:border-red-300'}`}>
                        {g === 'Harian' ? 'Harian (Seksi)' : g}
                      </button>
                     );
                  })}
                </div>
              </div>

              {['Pelindung', 'Penasihat', 'Inti'].includes(editSeksi) ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Jabatan</label>
                    {editSeksi === 'Inti' ? (
                      <select value={editJabatan} onChange={e => setEditJabatan(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                        <option>Ketua Panitia</option><option>Sekretaris</option><option>Bendahara</option>
                      </select>
                    ) : (
                      <input type="text" value={editJabatan} onChange={e => setEditJabatan(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Seksi</label>
                      <select value={editSeksi} onChange={e => { setEditSeksi(e.target.value); setEditParentId(''); }} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                        {harianSeksiList.map((s: any) => <option key={s.id} value={s.nama}>{s.nama}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Level</label>
                      <select value={editLevel} onChange={e => { setEditLevel(e.target.value); setEditParentId(''); }} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                        <option value="Koordinator">Koordinator</option>
                        <option value="Sub-Koordinator">Sub-Koordinator</option>
                        <option value="Anggota">Anggota</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Jabatan Kustom (opsional)</label>
                    <input type="text" value={editJabatan} onChange={e => setEditJabatan(e.target.value)} placeholder="Opsional (mengikuti level jika kosong)" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                  </div>
                  
                  {editLevel === 'Sub-Koordinator' && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Di Bawah Koordinator</label>
                      <select value={editParentId || ''} onChange={e => setEditParentId(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                        <option value="">— Pilih Koordinator —</option>
                        {editKoordinatorsInSeksi.map((k: any) => <option key={k.id} value={k.id}>{k.nama}</option>)}
                      </select>
                    </div>
                  )}

                  {editLevel === 'Anggota' && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Atasan Langsung</label>
                      <select value={editParentId || ''} onChange={e => setEditParentId(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                        <option value="">— Pilih Atasan —</option>
                        {editKoordinatorsInSeksi.length > 0 && (
                          <optgroup label="Koordinator">
                            {editKoordinatorsInSeksi.map((k: any) => <option key={k.id} value={k.id}>{k.nama}</option>)}
                          </optgroup>
                        )}
                        {editSubKoordsInSeksi.length > 0 && (
                          <optgroup label="Sub-Koordinator">
                            {editSubKoordsInSeksi.map((sk: any) => <option key={sk.id} value={sk.id}>{sk.nama}</option>)}
                          </optgroup>
                        )}
                      </select>
                    </div>
                  )}
                </>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Nomor WhatsApp (Opsional)</label>
                <input type="text" value={editNoWa} onChange={e => setEditNoWa(e.target.value)} placeholder="08xxxxxxxxxx"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <button onClick={handleSaveEdit} className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-all shadow-sm">
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
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
          <Check className="h-3.5 w-3.5" />
        </button>
        <button onClick={onCancel} className="p-1.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

