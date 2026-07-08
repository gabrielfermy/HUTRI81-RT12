'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Layers } from 'lucide-react';
import { PanitiaTab } from '@/components/panitia/PanitiaTab';
import { SeksiTab } from '@/components/panitia/SeksiTab';

export default function KepanitiaanPanitia() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Active Tab (Default to Seksi first)
  const [activeTab, setActiveTab] = useState<'panitia' | 'seksi'>('seksi');

  // Database lists
  const [panitiaList, setPanitiaList] = useState<any[]>([]);
  const [seksiList, setSeksiList] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const { data: pData } = await supabase.from('panitia').select('*').order('nama', { ascending: true });
      if (pData) setPanitiaList(pData);

      const { data: sData } = await supabase.from('seksi').select('*').order('created_at', { ascending: true });
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

    // Subscribe to realtime database changes
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

  const handleAddPanitia = async (nama: string, seksi: string, jabatan: string, isUnique: boolean) => {
    const newPanitia = {
      nama,
      seksi,
      jabatan,
      pin_access: '1212' // PIN login default
    };

    const { data, error } = await supabase.from('panitia').insert([newPanitia]).select();
    if (data && !error) {
      setPanitiaList([...panitiaList, data[0]].sort((a, b) => a.nama.localeCompare(b.nama)));
      await logAudit('Menambah Panitia Baru', `Mendaftarkan "${nama}" sebagai "${jabatan}" Seksi ${seksi}`);
    } else {
      alert('Gagal mendaftarkan panitia baru: ' + (error?.message || 'Database error'));
    }
  };

  const handleEditPanitia = async (id: string, nama: string, seksi: string, jabatan: string, isUnique: boolean) => {
    const { error } = await supabase
      .from('panitia')
      .update({ nama, seksi, jabatan })
      .eq('id', id);

    if (!error) {
      if (id === currentUser?.id) {
        const updatedSession = { ...currentUser, nama, seksi, jabatan };
        localStorage.setItem('session_panitia', JSON.stringify(updatedSession));
        setCurrentUser(updatedSession);
      }
      setPanitiaList(panitiaList.map((p) => (p.id === id ? { ...p, nama, seksi, jabatan } : p)));
      await logAudit('Mengubah Data Panitia', `Mutasi/Edit profil panitia ID ${id}: "${nama}" menjadi "${jabatan}"`);
    } else {
      alert('Gagal menyimpan perubahan: ' + error.message);
    }
  };

  const handleDeletePanitia = async (id: string, name: string) => {
    const { error } = await supabase.from('panitia').delete().eq('id', id);
    if (!error) {
      setPanitiaList(panitiaList.filter((p) => p.id !== id));
      await logAudit('Mengeluarkan Panitia', `Mengeluarkan "${name}" dari susunan kepanitiaan`);
    } else {
      alert('Gagal mengeluarkan anggota: ' + error.message);
    }
  };

  const handleResetPin = async (id: string, name: string) => {
    const defaultPin = '1212';
    const { error } = await supabase.from('panitia').update({ pin_akses: defaultPin }).eq('id', id);

    if (!error) {
      setPanitiaList(panitiaList.map((p) => (p.id === id ? { ...p, pin_akses: defaultPin } : p)));
      await logAudit('Reset PIN Panitia', `Mereset PIN akses "${name}" kembali ke default 1212`);
      alert(`PIN akses untuk "${name}" berhasil direset ke "1212".`);
    } else {
      alert('Gagal mereset PIN: ' + error.message);
    }
  };

  const handleUpdateOwnProfile = async (nama: string, pin?: string) => {
    let payload: any = { nama };
    if (pin) payload.pin_akses = pin;

    const { error } = await supabase.from('panitia').update(payload).eq('id', currentUser.id);

    if (!error) {
      const updatedSession = { ...currentUser, nama };
      localStorage.setItem('session_panitia', JSON.stringify(updatedSession));
      setCurrentUser(updatedSession);
      await logAudit('Mengedit Profil Mandiri', `Mengubah profil mandiri: ${nama} ${pin ? '(dengan perubahan PIN)' : ''}`);
    } else {
      throw new Error(error.message);
    }
  };

  // ==========================================
  // DISPATCHERS FOR DYNAMIC SECTIONS
  // ==========================================

  const handleAddSeksi = async (nama: string, deskripsi: string, isUnique: boolean, kategori: string) => {
    const newSeksi = {
      nama,
      deskripsi,
      is_unique: isUnique,
      kategori
    };

    const { data, error } = await supabase.from('seksi').insert([newSeksi]).select();
    if (data && !error) {
      setSeksiList([...seksiList, data[0]]);
      await logAudit('Menambah Jabatan Baru', `Membuat jabatan baru "${nama}" (Kategori: ${kategori}, Unik: ${isUnique ? 'Ya' : 'Tidak'})`);
    } else {
      alert('Gagal membuat jabatan baru: ' + (error?.message || 'Database error'));
    }
  };

  const handleEditSeksi = async (id: string, nama: string, deskripsi: string, isUnique: boolean, kategori: string) => {
    const { error } = await supabase
      .from('seksi')
      .update({ nama, deskripsi, is_unique: isUnique, kategori })
      .eq('id', id);

    if (!error) {
      setSeksiList(seksiList.map((s) => (s.id === id ? { ...s, nama, deskripsi, is_unique: isUnique, kategori } : s)));
      await logAudit('Mengubah Data Jabatan', `Mengedit jabatan: "${nama}" (Kategori: ${kategori}, Unik: ${isUnique ? 'Ya' : 'Tidak'})`);
    } else {
      alert('Gagal menyimpan perubahan jabatan: ' + error.message);
    }
  };

  const handleDeleteSeksi = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus seksi "${name}"? Ini akan melonggarkan kaitan seksi anggota yang berada di dalamnya.`)) return;

    const { error } = await supabase.from('seksi').delete().eq('id', id);
    if (!error) {
      setSeksiList(seksiList.filter((s) => s.id !== id));
      await logAudit('Menghapus Seksi', `Menghapus bidang seksi "${name}" dari kepanitiaan.`);
    } else {
      alert('Gagal menghapus seksi: ' + error.message);
    }
  };

  const isInti = currentUser?.seksi === 'Inti';

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center bg-slate-950 text-white min-h-[50vh]">
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
      <div className="border-b border-slate-900 pb-4">
        <h1 className="text-xl sm:text-2xl font-black text-white">
          {isInti ? 'Manajemen Pengguna & Kepanitiaan' : 'Profil & Keamanan Saya'}
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          {isInti
            ? 'Kelola struktur kepanitiaan, sesuaikan bidang seksi, daftarkan anggota baru, dan atur sandi/PIN akses.'
            : 'Perbarui nama lengkap dan PIN keamanan 4 digit rahasia Anda secara mandiri.'}
        </p>
      </div>

      {/* Tabs Switcher (Only visible to admin/panitia inti) */}
      {isInti && (
        <div className="flex border-b border-slate-800 space-x-1 overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab('seksi')}
            className={`flex items-center space-x-2 px-5 py-3 text-xs font-bold whitespace-nowrap rounded-t-xl transition-all border-t-2 ${
              activeTab === 'seksi'
                ? 'bg-slate-900/40 border-red-500 text-red-400'
                : 'border-transparent text-slate-450 hover:text-slate-200'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>1. Manajemen Struktur Organisasi</span>
          </button>
          <button
            onClick={() => setActiveTab('panitia')}
            className={`flex items-center space-x-2 px-5 py-3 text-xs font-bold whitespace-nowrap rounded-t-xl transition-all border-t-2 ${
              activeTab === 'panitia'
                ? 'bg-slate-900/40 border-red-500 text-red-400'
                : 'border-transparent text-slate-450 hover:text-slate-200'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>2. Susunan Panitia</span>
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
