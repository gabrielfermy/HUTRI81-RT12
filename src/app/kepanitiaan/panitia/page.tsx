'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Key, Users, UserCheck } from 'lucide-react';

export default function KepanitiaanPanitia() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [panitiaList, setPanitiaList] = useState<any[]>([]);

  // Form states
  const [nama, setNama] = useState('');
  const [seksi, setSeksi] = useState('Acara');
  const [jabatan, setJabatan] = useState('Anggota');
  const [pinAkses, setPinAkses] = useState('1212');

  useEffect(() => {
    const userSession = localStorage.getItem('session_panitia');
    if (userSession) {
      setCurrentUser(JSON.parse(userSession));
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

  const handleAddPanitia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama || !seksi || !jabatan || !pinAkses) return;

    const newPanitia = {
      nama,
      seksi,
      jabatan,
      pin_akses: pinAkses,
    };

    try {
      const { data, error } = await supabase.from('panitia').insert([newPanitia]).select();
      if (data && !error) {
        setPanitiaList([...panitiaList, data[0]].sort((a,b) => a.nama.localeCompare(b.nama)));
        await logAudit('Menambah Panitia Baru', `Mendaftarkan "${nama}" sebagai ${jabatan} ${seksi} dengan PIN awal`);
      } else {
        setPanitiaList([...panitiaList, { ...newPanitia, id: String(Date.now()) }]);
      }
    } catch (err) {
      setPanitiaList([...panitiaList, { ...newPanitia, id: String(Date.now()) }]);
    }

    setNama('');
    setSeksi('Acara');
    setJabatan('Anggota');
    setPinAkses('1212');
  };

  const handleDeletePanitia = async (id: string, name: string) => {
    if (id === currentUser?.id) {
      alert('Anda tidak bisa menghapus diri Anda sendiri yang sedang aktif login!');
      return;
    }
    if (!confirm(`Apakah Anda yakin ingin mengeluarkan "${name}" dari susunan kepanitiaan?`)) return;

    try {
      const { error } = await supabase.from('panitia').delete().eq('id', id);
      if (!error) {
        setPanitiaList(panitiaList.filter(p => p.id !== id));
        await logAudit('Mengeluarkan Panitia', `Mengeluarkan "${name}" dari susunan kepanitiaan`);
      }
    } catch (err) {
      setPanitiaList(panitiaList.filter(p => p.id !== id));
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
        setPanitiaList(panitiaList.map(p => p.id === id ? { ...p, pin_akses: defaultPin } : p));
        await logAudit('Reset PIN Panitia', `Mereset PIN akses "${name}" kembali ke default 1212 (karena lupa PIN)`);
        alert(`PIN akses untuk "${name}" berhasil direset ke "1212".`);
      }
    } catch (err) {
      alert('Gagal mereset PIN.');
    }
  };

  return (
    <div className="space-y-10">
      <div className="border-b border-slate-900 pb-4">
        <h1 className="text-xl sm:text-2xl font-black text-white">Manajemen Pengguna & Panitia</h1>
        <p className="text-xs text-slate-400 mt-1">Daftarkan kepanitiaan baru, atur jabatan, dan lakukan pemulihan/reset PIN jika lupa.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Add Panitia */}
        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 space-y-6 h-fit">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="h-4.5 w-4.5 text-red-500" />
              <span>Daftarkan Anggota Baru</span>
            </h3>
            <p className="text-xs text-slate-500">Mendaftarkan personel panitia baru dan mengeset PIN awal.</p>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Seksi Kerja</label>
                <select
                  value={seksi}
                  onChange={(e) => setSeksi(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                >
                  <option value="Inti">Inti</option>
                  <option value="Acara">Acara</option>
                  <option value="Perlengkapan & Dekorasi">Perlengkapan & Dekorasi</option>
                  <option value="Konsumsi">Konsumsi</option>
                  <option value="Keamanan & Kebersihan">Keamanan & Kebersihan</option>
                  <option value="Dokumentasi">Dokumentasi</option>
                  <option value="Humas & Dana">Humas & Dana</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Jabatan</label>
                <input
                  type="text"
                  required
                  value={jabatan}
                  onChange={(e) => setJabatan(e.target.value)}
                  placeholder="e.g. Koordinator / Anggota"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">PIN Akses Awal (4 Digit)</label>
              <input
                type="text"
                required
                maxLength={4}
                pattern="[0-9]*"
                inputMode="numeric"
                value={pinAkses}
                onChange={(e) => setPinAkses(e.target.value)}
                placeholder="1212"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white tracking-widest text-center focus:outline-none focus:border-red-500"
              />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {panitiaList.map((p) => (
              <div
                key={p.id}
                className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex justify-between items-center"
              >
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider">{p.seksi}</div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    {p.nama}
                    {p.id === currentUser?.id && (
                      <span className="text-[8px] bg-red-600 text-white px-1.5 py-0.5 rounded-full font-black uppercase">Anda</span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-500">{p.jabatan}</p>
                  <p className="text-[10px] text-slate-600 font-mono">PIN: {p.pin_akses}</p>
                </div>

                <div className="flex items-center space-x-1.5">
                  {/* Reset PIN button */}
                  <button
                    onClick={() => handleResetPin(p.id, p.nama)}
                    title="Reset PIN ke 1212"
                    className="p-2 border border-slate-850 hover:border-slate-800 text-slate-500 hover:text-emerald-400 rounded-lg transition-colors"
                  >
                    <Key className="h-4 w-4" />
                  </button>
                  
                  {/* Delete button */}
                  <button
                    onClick={() => handleDeletePanitia(p.id, p.nama)}
                    title="Keluarkan Anggota"
                    className="p-2 border border-slate-850 hover:border-slate-800 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {panitiaList.length === 0 && (
              <p className="text-xs text-slate-500 italic text-center py-6 col-span-2">Belum ada panitia terdaftar.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
