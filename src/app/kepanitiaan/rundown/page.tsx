'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Calendar, Plus, Trash2, Clock, MapPin, AlignLeft, Users, Edit, Copy } from 'lucide-react';
import { RundownTaskList } from '@/components/rundown/RundownTaskList';
import { logAuditActivity } from '@/lib/logger';



export default function KepanitiaanRundown() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rundownList, setRundownList] = useState<any[]>([]);

  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tanggal, setTanggal] = useState('');
  const [jamMulai, setJamMulai] = useState('');
  const [jamSelesai, setJamSelesai] = useState('');
  const [kegiatan, setKegiatan] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [kategori, setKategori] = useState('Utama');
  const [seksiPj, setSeksiPj] = useState<string[]>([]);
  const [instruksiInternal, setInstruksiInternal] = useState('');

  // Inline edit state for instructions
  const [editingInstructionsId, setEditingInstructionsId] = useState<string | null>(null);
  const [tempInstructions, setTempInstructions] = useState('');

  // Permission helper: Only 'Acara' or 'Inti' can manage events
  const canManageEvents = currentUser && (
    currentUser.seksi === 'Acara' || 
    currentUser.seksi === 'Inti' || 
    currentUser.level === 'Inti'
  );

  // Database lists
  const [seksiList, setSeksiList] = useState<any[]>([]);

  useEffect(() => {
    const userSession = localStorage.getItem('session_panitia');
    if (userSession) {
      setCurrentUser(JSON.parse(userSession));
    }

    async function loadRundown() {
      try {
        const { data, error } = await supabase
          .from('rundown')
          .select('*')
          .order('tanggal', { ascending: true })
          .order('jam_mulai', { ascending: true });

        if (data && !error) {
          setRundownList(data);
        }

        const { data: sData } = await supabase
          .from('seksi')
          .select('*')
          .order('created_at', { ascending: true });

        if (sData) {
          setSeksiList(sData);
        }
      } catch (err) {
        console.error('Error loading rundown:', err);
      } finally {
        setLoading(false);
      }
    }
    loadRundown();

    const channel = supabase
      .channel('rundown-list-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rundown' }, () => {
        loadRundown();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const logAudit = async (aksi: string, detail: string) => {
    if (!currentUser) return;
    await logAuditActivity(aksi, detail, currentUser);
  };

  const handleCheckboxChange = (section: string) => {
    if (seksiPj.includes(section)) {
      setSeksiPj(seksiPj.filter((s) => s !== section));
    } else {
      setSeksiPj([...seksiPj, section]);
    }
  };

  const handleAddRundown = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tanggal || !jamMulai || !kegiatan) return;

    if (jamSelesai && jamSelesai <= jamMulai) {
      alert("Jam Selesai tidak boleh sebelum atau sama dengan Jam Mulai.");
      return;
    }

    const newItem = {
      tanggal,
      jam_mulai: jamMulai,
      jam_selesai: jamSelesai,
      kegiatan,
      keterangan,
      kategori,
      seksi_pj: seksiPj,
      instruksi_internal: instruksiInternal,
    };

    try {
      if (editingId) {
        const { error } = await supabase.from('rundown').update(newItem).eq('id', editingId);
        if (!error) {
          setRundownList(rundownList.map((r) => r.id === editingId ? { ...r, ...newItem } : r).sort((a, b) => a.tanggal.localeCompare(b.tanggal) || a.jam_mulai.localeCompare(b.jam_mulai)));
          await logAudit('Mengubah Rundown', `Mengubah rundown "${kegiatan}" pada ${tanggal} jam ${jamMulai}`);
        }
      } else {
        const { data, error } = await supabase.from('rundown').insert([newItem]).select();
        if (data && !error) {
          setRundownList([...rundownList, data[0]].sort((a, b) => a.tanggal.localeCompare(b.tanggal) || a.jam_mulai.localeCompare(b.jam_mulai)));
          await logAudit('Menambah Rundown Baru', `Menambahkan rundown "${kegiatan}" pada ${tanggal} jam ${jamMulai}`);
        } else {
          setRundownList([...rundownList, { ...newItem, id: String(Date.now()) }]);
        }
      }
    } catch (err) {
      if (!editingId) {
        setRundownList([...rundownList, { ...newItem, id: String(Date.now()) }]);
      }
    }

    // Reset Form
    handleCancelEdit();
  };

  const handleCancelEdit = () => {
    setTanggal('');
    setJamMulai('');
    setJamSelesai('');
    setKegiatan('');
    setKeterangan('');
    setKategori('Utama');
    setSeksiPj([]);
    setInstruksiInternal('');
    setEditingId(null);
  };

  const handleEditTrigger = (r: any) => {
    setEditingId(r.id);
    setTanggal(r.tanggal);
    setJamMulai(r.jam_mulai || '');
    setJamSelesai(r.jam_selesai || '');
    setKegiatan(r.kegiatan || '');
    setKeterangan(r.keterangan || '');
    setKategori(r.kategori || 'Utama');
    setSeksiPj(r.seksi_pj || []);
    setInstruksiInternal(r.instruksi_internal || '');
    
    // Scroll to form smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopyTrigger = (r: any) => {
    setEditingId(null); // new item
    setTanggal(r.tanggal);
    setJamMulai(r.jam_mulai || '');
    setJamSelesai(r.jam_selesai || '');
    setKegiatan(`${r.kegiatan} (Copy)`);
    setKeterangan(r.keterangan || '');
    setKategori(r.kategori || 'Utama');
    setSeksiPj(r.seksi_pj || []);
    setInstruksiInternal(r.instruksi_internal || '');
    
    // Scroll to form smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteRundown = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus rundown "${name}"?`)) return;

    try {
      const { error } = await supabase.from('rundown').delete().eq('id', id);
      if (!error) {
        setRundownList(rundownList.filter((r) => r.id !== id));
        await logAudit('Menghapus Rundown', `Menghapus jadwal rundown "${name}"`);
      }
    } catch (err) {
      setRundownList(rundownList.filter((r) => r.id !== id));
    }
  };

  const handleSaveInstructions = async (id: string) => {
    try {
      const { error } = await supabase
        .from('rundown')
        .update({ instruksi_internal: tempInstructions })
        .eq('id', id);

      if (!error) {
        setRundownList(rundownList.map((r) => r.id === id ? { ...r, instruksi_internal: tempInstructions } : r));
        setEditingInstructionsId(null);
        await logAudit('Mengubah Panduan Internal', `Mengubah panduan internal untuk acara ID: ${id}`);
      }
    } catch (err) {
      console.error('Error saving instructions:', err);
    }
  };

  return (
    <div className="space-y-10">
      <div className="border-b border-slate-900 pb-4">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900">Manajer Rundown & Kegiatan</h1>
        <p className="text-xs text-slate-500 mt-1">Mengelola poin susunan acara secara dinamis dan mendetail untuk panitia.</p>
      </div>

      <div className={canManageEvents ? "grid grid-cols-1 lg:grid-cols-3 gap-8" : "max-w-4xl mx-auto"}>
        
        {/* Form Add Rundown */}
        {canManageEvents && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 h-fit">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              {editingId ? <Edit className="h-4.5 w-4.5 text-blue-500" /> : <Plus className="h-4.5 w-4.5 text-red-500" />}
              <span>{editingId ? 'Edit Detail Acara' : 'Tambah Acara Baru'}</span>
            </h3>
            <p className="text-xs text-slate-500">
              {editingId ? 'Sesuaikan detail jadwal, penanggung jawab, dan persiapan internal.' : 'Isi detail jadwal, penanggung jawab, dan persiapan internal.'}
            </p>
          </div>

          <form onSubmit={handleAddRundown} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Nama Kegiatan</label>
              <input
                type="text"
                required
                value={kegiatan}
                onChange={(e) => setKegiatan(e.target.value)}
                placeholder="e.g. Makan Malam Soto Prasmanan"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Tanggal Acara</label>
              <input
                type="date"
                required
                min="2026-08-01"
                max="2026-08-31"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Jam Mulai</label>
                <input
                  type="time"
                  required
                  value={jamMulai}
                  onChange={(e) => setJamMulai(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-red-500 text-center cursor-text"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Jam Selesai</label>
                <input
                  type="time"
                  value={jamSelesai}
                  onChange={(e) => setJamSelesai(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-red-500 text-center cursor-text"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Kategori</label>
              <input
                type="text"
                required
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                placeholder="e.g. Utama, Lomba Anak, Lomba Dewasa"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Keterangan Umum (Warga)</label>
              <textarea
                rows={2}
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Informasi acara yang bisa dibaca oleh warga umum..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Seksi Penanggung Jawab (PJ)</label>
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                {seksiList.filter((sec) => sec.kategori !== 'BOD' && sec.kategori !== 'Inti').map((sec) => (
                  <label key={sec.id} className="flex items-center space-x-2 text-[10px] text-slate-600 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={seksiPj.includes(sec.nama)}
                      onChange={() => handleCheckboxChange(sec.nama)}
                      className="rounded border-slate-200 bg-slate-900 text-red-500 focus:ring-0"
                    />
                    <span>{sec.nama}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Instruksi Internal Panitia (Rahasia)</label>
              <textarea
                rows={3}
                value={instruksiInternal}
                onChange={(e) => setInstruksiInternal(e.target.value)}
                placeholder="Catatan persiapan panitia (e.g. Sie Perkap wajib membawa obor minyak H-1 jam...)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex gap-2">
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                >
                  Batal
                </button>
              )}
              <button
                type="submit"
                className={`py-2.5 font-bold text-xs rounded-xl transition-all ${editingId ? 'w-2/3 bg-blue-600 hover:bg-blue-500 text-white' : 'w-full bg-red-600 hover:bg-red-500 text-white'}`}
              >
                {editingId ? 'Perbarui Acara' : 'Simpan Rundown Acara'}
              </button>
            </div>
          </form>
        </div>
        )}

        {/* Rundown List View */}
        <div className={`bg-white border border-slate-200 rounded-2xl p-6 space-y-6 ${canManageEvents ? 'lg:col-span-2' : 'w-full'}`}>
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Daftar Rundown Terjadwal</h3>
              <p className="text-xs text-slate-500">Mencakup instruksi internal dan opsi hapus.</p>
            </div>
            {/* Open Printable Rundown Link */}
            <Link
              href="/proposal/print"
              target="_blank"
              className="text-xs font-bold text-red-400 hover:underline"
            >
              Cetak Rundown Pegangan
            </Link>
          </div>

          <div className="space-y-6">
            {rundownList.map((r, index) => (
              <div key={index} className="bg-slate-50 border border-slate-850 rounded-2xl p-5 space-y-4 hover:border-red-500/15 transition-all">
                <div className="flex justify-between items-start">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        {new Date(r.tanggal).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                      <span className="text-[9px] bg-slate-900 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-md font-bold">
                        {r.jam_mulai} - {r.jam_selesai ? `${r.jam_selesai} WIB` : 'Selesai'}
                      </span>
                      <span className="text-[9px] bg-slate-900 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-md font-bold">
                        Kat: {r.kategori}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900">{r.kegiatan}</h4>
                  </div>
                  
                  {canManageEvents && (
                    <div className="flex items-center space-x-1.5 shrink-0">
                      <button
                        onClick={() => handleEditTrigger(r)}
                        title="Edit Acara"
                        className="p-2 border border-slate-200 hover:border-blue-500/30 text-slate-500 hover:text-blue-500 rounded-lg transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleCopyTrigger(r)}
                        title="Salin ke Form Baru"
                        className="p-2 border border-slate-200 hover:border-emerald-500/30 text-slate-500 hover:text-emerald-500 rounded-lg transition-colors"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRundown(r.id, r.kegiatan)}
                        title="Hapus Acara"
                        className="p-2 border border-slate-200 hover:border-red-500/30 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="text-xs space-y-2 border-t border-slate-900 pt-3">
                  <div>
                    <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wider block mb-0.5">Keterangan Umum:</span>
                    <p className="text-slate-600 leading-relaxed">{r.keterangan || 'Tidak ada keterangan umum.'}</p>
                  </div>

                  <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-red-400 font-bold uppercase text-[9px] tracking-wider">⚠️ Panduan Internal Panitia:</span>
                      {editingInstructionsId !== r.id ? (
                        <button
                          onClick={() => {
                            setEditingInstructionsId(r.id);
                            setTempInstructions(r.instruksi_internal || '');
                          }}
                          className="text-[10px] text-blue-500 hover:underline font-bold"
                        >
                          Ubah Panduan
                        </button>
                      ) : null}
                    </div>

                    {editingInstructionsId === r.id ? (
                      <div className="space-y-2 mt-1">
                        <textarea
                          rows={3}
                          value={tempInstructions}
                          onChange={(e) => setTempInstructions(e.target.value)}
                          placeholder="Tulis instruksi internal panitia..."
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-red-500"
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setEditingInstructionsId(null)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded"
                          >
                            Batal
                          </button>
                          <button
                            onClick={() => handleSaveInstructions(r.id)}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded"
                          >
                            Simpan
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-350 leading-relaxed font-medium font-serif">
                        {r.instruksi_internal || <span className="text-slate-500 italic text-[11px]">Belum ada panduan internal. Klik "Ubah Panduan" untuk menambahkan.</span>}
                      </p>
                    )}
                  </div>

                  {r.seksi_pj && r.seksi_pj.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 items-center pt-2">
                      <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mr-1">PJ Seksi:</span>
                      {r.seksi_pj.map((pj: string, i: number) => (
                        <span key={i} className="text-[9px] font-bold text-slate-600 bg-slate-900 border border-slate-200 px-2 py-0.5 rounded">
                          {pj}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Task list manager for this event */}
                  <RundownTaskList rundownId={r.id} eventName={r.kegiatan} seksiPj={r.seksi_pj} />
                </div>
              </div>
            ))}
            {rundownList.length === 0 && (
              <p className="text-xs text-slate-500 italic text-center py-8">Belum ada rundown terdaftar.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
