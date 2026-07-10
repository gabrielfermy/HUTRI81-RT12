'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Layers } from 'lucide-react';
import { PanitiaTab } from '@/components/panitia/PanitiaTab';
import { SeksiTab } from '@/components/panitia/SeksiTab';

export default function KepanitiaanPanitia() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Active Tab (Default to Panitia first for easy management)
  const [activeTab, setActiveTab] = useState<'panitia' | 'seksi'>('panitia');

  // Database lists
  const [panitiaList, setPanitiaList] = useState<any[]>([]);
  const [seksiList, setSeksiList] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const { data: pData } = await supabase
        .from('panitia')
        .select('*')
        .order('created_at', { ascending: true });
      if (pData) setPanitiaList(pData);

      const { data: sData } = await supabase
        .from('seksi')
        .select('*')
        .order('created_at', { ascending: true });
      if (sData) setSeksiList(sData);
    } catch (err) {
      console.error('Error loading database data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userSession = localStorage.getItem('session_panitia');
    if (userSession) {
      setCurrentUser(JSON.parse(userSession));
    }

    loadData();

    const channel = supabase
      .channel('kepanitiaan-panitia-seksi-changes')
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
  // DISPATCHERS FOR COMMITTEE MEMBERS
  // ==========================================

  const handleAddPanitia = async (
    nama: string,
    seksi: string,
    jabatan: string,
    level: string,
    parentId?: string | null,
    no_wa?: string
  ) => {
    const newPanitia: any = {
      nama,
      seksi,
      jabatan,
      level: level || 'Anggota',
      pin_akses: '1212',
    };
    if (no_wa) newPanitia.no_wa = no_wa;
    if (parentId) newPanitia.parent_id = parentId;

    const { data, error } = await supabase.from('panitia').insert([newPanitia]).select();
    if (data && !error) {
      setPanitiaList((prev) =>
        [...prev, data[0]].sort((a, b) => a.nama.localeCompare(b.nama))
      );
      await logAudit(
        'Menambah Panitia Baru',
        `Mendaftarkan "${nama}" sebagai "${jabatan}" (${level}) di Seksi ${seksi}`
      );
    } else {
      alert('Gagal mendaftarkan panitia baru: ' + (error?.message || 'Database error'));
    }
  };

  const handleEditPanitia = async (
    id: string,
    nama: string,
    seksi: string,
    jabatan: string,
    level: string,
    parentId?: string | null,
    no_wa?: string
  ) => {
    const updatePayload: any = { nama, seksi, jabatan, level: level || 'Anggota' };
    if (no_wa !== undefined) updatePayload.no_wa = no_wa;
    updatePayload.parent_id = parentId || null;

    const { error } = await supabase
      .from('panitia')
      .update(updatePayload)
      .eq('id', id);

    if (!error) {
      if (id === currentUser?.id) {
        const updatedSession = { ...currentUser, nama, seksi, jabatan, level };
        localStorage.setItem('session_panitia', JSON.stringify(updatedSession));
        setCurrentUser(updatedSession);
      }
      setPanitiaList((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, nama, seksi, jabatan, level, no_wa, parent_id: parentId || null } : p
        )
      );
      await logAudit(
        'Mengubah Data Panitia',
        `Edit profil "${nama}" — ${jabatan} (${level}) Seksi ${seksi}`
      );
    } else {
      alert('Gagal menyimpan perubahan: ' + error.message);
    }
  };

  const handleDeletePanitia = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin mengeluarkan "${name}" dari kepanitiaan?`)) return;
    const { error } = await supabase.from('panitia').delete().eq('id', id);
    if (!error) {
      setPanitiaList((prev) => prev.filter((p) => p.id !== id));
      await logAudit('Mengeluarkan Panitia', `Mengeluarkan "${name}" dari susunan kepanitiaan`);
    } else {
      alert('Gagal mengeluarkan anggota: ' + error.message);
    }
  };

  const handleResetPin = async (id: string, name: string) => {
    const defaultPin = '1212';
    const { error } = await supabase
      .from('panitia')
      .update({ pin_akses: defaultPin })
      .eq('id', id);

    if (!error) {
      setPanitiaList((prev) =>
        prev.map((p) => (p.id === id ? { ...p, pin_akses: defaultPin } : p))
      );
      await logAudit('Reset PIN Panitia', `Mereset PIN akses "${name}" kembali ke default 1212`);
      alert(`PIN akses untuk "${name}" berhasil direset ke "1212".`);
    } else {
      alert('Gagal mereset PIN: ' + error.message);
    }
  };

  const handleUpdateOwnProfile = async (nama: string, pin?: string) => {
    const payload: any = { nama };
    if (pin) payload.pin_akses = pin;

    const { error } = await supabase.from('panitia').update(payload).eq('id', currentUser.id);

    if (!error) {
      const updatedSession = { ...currentUser, nama };
      localStorage.setItem('session_panitia', JSON.stringify(updatedSession));
      setCurrentUser(updatedSession);
      await logAudit(
        'Mengedit Profil Mandiri',
        `Mengubah profil mandiri: ${nama} ${pin ? '(dengan perubahan PIN)' : ''}`
      );
    } else {
      throw new Error(error.message);
    }
  };

  // ==========================================
  // DISPATCHERS FOR DYNAMIC SECTIONS
  // ==========================================

  const handleAddSeksi = async (
    nama: string,
    deskripsi: string,
    isUnique: boolean,
    kategori: string,
    aksesMenu: string,
    mempunyaiSubKoordinator: boolean
  ) => {
    const newSeksi = {
      nama,
      deskripsi,
      is_unique: isUnique,
      kategori,
      akses_menu: aksesMenu,
      mempunyai_sub_koordinator: mempunyaiSubKoordinator,
    };

    const { data, error } = await supabase.from('seksi').insert([newSeksi]).select();
    if (data && !error) {
      setSeksiList((prev) => [...prev, data[0]]);
      await logAudit(
        'Menambah Seksi Baru',
        `Membuat seksi baru "${nama}" (Kategori: ${kategori}, Sub-Koord: ${mempunyaiSubKoordinator ? 'Ya' : 'Tidak'})`
      );
    } else {
      alert('Gagal membuat seksi baru: ' + (error?.message || 'Database error'));
    }
  };

  const handleEditSeksi = async (
    id: string,
    nama: string,
    deskripsi: string,
    isUnique: boolean,
    kategori: string,
    aksesMenu: string,
    mempunyaiSubKoordinator: boolean
  ) => {
    const { data: oldSeksi } = await supabase
      .from('seksi')
      .select('nama')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('seksi')
      .update({
        nama,
        deskripsi,
        is_unique: isUnique,
        kategori,
        akses_menu: aksesMenu,
        mempunyai_sub_koordinator: mempunyaiSubKoordinator,
      })
      .eq('id', id);

    if (!error) {
      if (oldSeksi && oldSeksi.nama !== nama) {
        await supabase.from('panitia').update({ seksi: nama }).eq('seksi', oldSeksi.nama);
      }
      setSeksiList((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, nama, deskripsi, is_unique: isUnique, kategori, akses_menu: aksesMenu, mempunyai_sub_koordinator: mempunyaiSubKoordinator }
            : s
        )
      );
      await logAudit('Mengubah Data Seksi', `Mengedit seksi: "${nama}"`);
    } else {
      alert('Gagal menyimpan perubahan jabatan: ' + error.message);
    }
  };

  const handleDeleteSeksi = async (id: string, name: string) => {
    if (
      !confirm(
        `Apakah Anda yakin ingin menghapus seksi "${name}"? Semua anggota di seksi ini tidak akan terhapus, hanya definisi seksinya saja.`
      )
    )
      return;

    const { error } = await supabase.from('seksi').delete().eq('id', id);
    if (!error) {
      setSeksiList((prev) => prev.filter((s) => s.id !== id));
      await logAudit('Menghapus Seksi', `Menghapus bidang seksi "${name}" dari kepanitiaan.`);
    } else {
      alert('Gagal menghapus seksi: ' + error.message);
    }
  };

  const isInti = currentUser?.seksi === 'Inti';

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-red-500 border-r-2 mx-auto"></div>
          <p className="text-xs text-slate-400">Memuat Data Kepanitiaan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900">
          {isInti ? 'Manajemen Pengguna & Kepanitiaan' : 'Profil & Keamanan Saya'}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {isInti
            ? 'Kelola struktur kepanitiaan secara hierarki — Seksi, Koordinator, Sub-Koordinator, dan Anggota.'
            : 'Perbarui nama lengkap dan PIN keamanan 4 digit rahasia Anda secara mandiri.'}
        </p>
      </div>

      {/* Tabs Switcher (Only visible to admin/panitia inti) */}
      {isInti && (
        <div className="flex border-b border-slate-200 space-x-1 overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab('panitia')}
            className={`flex items-center space-x-2 px-5 py-3 text-xs font-bold whitespace-nowrap rounded-t-xl transition-all border-b-2 ${
              activeTab === 'panitia'
                ? 'border-red-500 text-red-600 bg-red-50'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>1. Susunan Panitia</span>
          </button>
          <button
            onClick={() => setActiveTab('seksi')}
            className={`flex items-center space-x-2 px-5 py-3 text-xs font-bold whitespace-nowrap rounded-t-xl transition-all border-b-2 ${
              activeTab === 'seksi'
                ? 'border-red-500 text-red-600 bg-red-50'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>2. Kelola Seksi</span>
          </button>
        </div>
      )}

      {/* Tab Panels */}
      {activeTab === 'panitia' ? (
        <PanitiaTab
          panitiaList={panitiaList}
          seksiList={seksiList}
          currentUser={currentUser}
          onAddPanitia={handleAddPanitia}
          onEditPanitia={handleEditPanitia}
          onDeletePanitia={handleDeletePanitia}
          onResetPin={handleResetPin}
          onUpdateOwnProfile={handleUpdateOwnProfile}
        />
      ) : (
        isInti && (
          <SeksiTab
            seksiList={seksiList}
            onAddSeksi={handleAddSeksi}
            onEditSeksi={handleEditSeksi}
            onDeleteSeksi={handleDeleteSeksi}
          />
        )
      )}
    </div>
  );
}
