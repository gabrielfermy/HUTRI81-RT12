'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Calendar, Plus, Trash2, Clock, MapPin, AlignLeft, Users } from 'lucide-react';
import { RundownTaskList } from '@/components/rundown/RundownTaskList';
import { logAuditActivity } from '@/lib/logger';



export default function KepanitiaanRundown() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rundownList, setRundownList] = useState<any[]>([]);

  // Form states
  const [tanggal, setTanggal] = useState('');
  const [jamMulai, setJamMulai] = useState('');
  const [jamSelesai, setJamSelesai] = useState('');
  const [kegiatan, setKegiatan] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [kategori, setKategori] = useState('Utama');
  const [seksiPj, setSeksiPj] = useState<string[]>([]);
  const [instruksiInternal, setInstruksiInternal] = useState('');

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
      const { data, error } = await supabase.from('rundown').insert([newItem]).select();
      if (data && !error) {
        setRundownList([...rundownList, data[0]].sort((a, b) => a.tanggal.localeCompare(b.tanggal) || a.jam_mulai.localeCompare(b.jam_mulai)));
        await logAudit('Menambah Rundown Baru', `Menambahkan rundown "${kegiatan}" pada ${tanggal} jam ${jamMulai}`);
      } else {
        setRundownList([...rundownList, { ...newItem, id: String(Date.now()) }]);
      }
    } catch (err) {
      setRundownList([...rundownList, { ...newItem, id: String(Date.now()) }]);
    }

    // Reset Form
    setTanggal('');
    setJamMulai('');
    setJamSelesai('');
    setKegiatan('');
    setKeterangan('');
    setKategori('Utama');
    setSeksiPj([]);
    setInstruksiInternal('');
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

  return (
    <div className="space-y-10">
      <div className="border-b border-slate-900 pb-4">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900">Manajer Rundown & Kegiatan</h1>
        <p className="text-xs text-slate-500 mt-1">Mengelola poin susunan acara secara dinamis dan mendetail untuk panitia.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Add Rundown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 h-fit">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Plus className="h-4.5 w-4.5 text-red-500" />
              <span>Tambah Acara Baru</span>
            </h3>
            <p className="text-xs text-slate-500">Isi detail jadwal, penanggung jawab, dan persiapan internal.</p>
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

            <button
              type="submit"
              className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition-all"
            >
              Simpan Rundown Acara
            </button>
          </form>
        </div>

        {/* Rundown List View */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:col-span-2 space-y-6">
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
                  
                  <button
                    onClick={() => handleDeleteRundown(r.id, r.kegiatan)}
                    className="p-2 border border-slate-200 hover:border-red-500/30 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>

                <div className="text-xs space-y-2 border-t border-slate-900 pt-3">
                  <div>
                    <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wider block mb-0.5">Keterangan Umum:</span>
                    <p className="text-slate-600 leading-relaxed">{r.keterangan || 'Tidak ada keterangan umum.'}</p>
                  </div>

                  {r.instruksi_internal && (
                    <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3">
                      <span className="text-red-400 font-bold uppercase text-[9px] tracking-wider block mb-0.5">⚠️ Panduan Internal Panitia:</span>
                      <p className="text-slate-350 leading-relaxed font-medium">{r.instruksi_internal}</p>
                    </div>
                  )}

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
