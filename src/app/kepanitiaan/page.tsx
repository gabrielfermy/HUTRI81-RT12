'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar, DollarSign, FileText, Plus, CheckCircle, Clock } from 'lucide-react';

export default function KepanitiaanDashboard() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // States for stats
  const [panitiaCount, setPanitiaCount] = useState(0);
  const [totalCollected, setTotalCollected] = useState(12000000); // default
  const [totalSpent, setTotalSpent] = useState(0);
  const [lunasCount, setLunasCount] = useState(0);
  
  // Rapat states
  const [rapatList, setRapatList] = useState<any[]>([]);
  const [agenda, setAgenda] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [waktu, setWaktu] = useState('');
  const [tempat, setTempat] = useState('');

  // Active meeting notulen edit state
  const [activeRapatId, setActiveRapatId] = useState<string | null>(null);
  const [notulenContent, setNotulenContent] = useState('');

  // Load user from local storage and fetch stats/rapat
  useEffect(() => {
    const userSession = localStorage.getItem('session_panitia');
    if (userSession) {
      setCurrentUser(JSON.parse(userSession));
    }

    async function loadDashboardData() {
      try {
        // Fetch panitia count
        const { count: pCount } = await supabase.from('panitia').select('*', { count: 'exact', head: true });
        if (pCount) setPanitiaCount(pCount);

        // Fetch warga stats
        const { data: warga } = await supabase.from('warga').select('nominal_iuran, is_paid');
        if (warga) {
          const lunas = warga.filter((w: any) => w.is_paid);
          setLunasCount(lunas.length);
          const iuranSum = lunas.reduce((sum: number, w: any) => sum + Number(w.nominal_iuran), 0);
          
          // Fetch sponsor stats
          const { data: sponsors } = await supabase.from('sponsorship').select('nominal');
          const sponsorSum = sponsors ? sponsors.reduce((sum: number, s: any) => sum + Number(s.nominal || 0), 0) : 0;
          
          setTotalCollected(2000000 + iuranSum + sponsorSum); // 2M initial kas RT
        }

        // Fetch actual spent stats
        const { data: expenses } = await supabase.from('pengeluaran').select('nominal_riil');
        if (expenses) {
          setTotalSpent(expenses.reduce((sum: number, e: any) => sum + Number(e.nominal_riil), 0));
        }

        // Fetch rapat list
        const { data: rapat } = await supabase.from('rapat').select('*').order('tanggal', { ascending: false });
        if (rapat) setRapatList(rapat);

      } catch (err) {
        console.error('Error loading dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
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

  const handleAddRapat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agenda || !tanggal || !waktu || !tempat) return;

    const newRapat = {
      agenda,
      tanggal,
      waktu,
      tempat,
      notulen: '',
    };

    try {
      const { data, error } = await supabase.from('rapat').insert([newRapat]).select();
      if (data && !error) {
        setRapatList([data[0], ...rapatList]);
        await logAudit('Menambah Rapat Baru', `Menjadwalkan rapat: "${agenda}" pada tanggal ${tanggal}`);
      } else {
        // Fallback local addition
        setRapatList([{ ...newRapat, id: String(Date.now()) }, ...rapatList]);
      }
    } catch (err) {
      setRapatList([{ ...newRapat, id: String(Date.now()) }, ...rapatList]);
    }

    // Reset Form
    setAgenda('');
    setTanggal('');
    setWaktu('');
    setTempat('');
  };

  const handleOpenNotulenEditor = (rapat: any) => {
    setActiveRapatId(rapat.id);
    setNotulenContent(rapat.notulen || '');
  };

  const handleSaveNotulen = async () => {
    if (!activeRapatId) return;

    try {
      const { error } = await supabase
        .from('rapat')
        .update({ notulen: notulenContent })
        .eq('id', activeRapatId);

      if (!error) {
        setRapatList(
          rapatList.map((r) => (r.id === activeRapatId ? { ...r, notulen: notulenContent } : r))
        );
        const rapatObj = rapatList.find(r => r.id === activeRapatId);
        await logAudit('Memperbarui Notulen', `Mengedit hasil notulen untuk rapat agenda: "${rapatObj?.agenda}"`);
      }
    } catch (err) {
      setRapatList(
        rapatList.map((r) => (r.id === activeRapatId ? { ...r, notulen: notulenContent } : r))
      );
    }

    setActiveRapatId(null);
    setNotulenContent('');
  };

  return (
    <div className="space-y-10">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-900/40 border border-slate-800 rounded-2xl p-6 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Selamat Datang, {currentUser?.nama || 'Panitia'}!</h1>
          <p className="text-xs text-slate-400 mt-1">Dasbor koordinasi terpusat HUT RI Ke-81 RT 12 Pelem Kidul.</p>
        </div>
        <div className="text-xs font-bold text-red-400 bg-red-600/10 border border-red-500/20 px-3 py-1.5 rounded-xl uppercase tracking-wider">
          Akses: {currentUser?.jabatan || 'Anggota'}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900/20 border border-slate-800/80 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Kas Terkumpul</span>
            <DollarSign className="h-4.5 w-4.5 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">Rp {totalCollected.toLocaleString('id-ID')}</div>
          <div className="text-[10px] text-slate-500 font-semibold">RT Kas + Iuran KK Lunas + Sponsor</div>
        </div>

        <div className="bg-slate-900/20 border border-slate-800/80 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Realisasi Belanja</span>
            <DollarSign className="h-4.5 w-4.5 text-indigo-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">Rp {totalSpent.toLocaleString('id-ID')}</div>
          <div className="text-[10px] text-slate-500 font-semibold">Belanja riil terpakai panitia</div>
        </div>

        <div className="bg-slate-900/20 border border-slate-800/80 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Iuran Warga</span>
            <CheckCircle className="h-4.5 w-4.5 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">{lunasCount} / 80 KK</div>
          <div className="text-[10px] text-slate-500 font-semibold">Tingkat pelunasan iuran wajib warga</div>
        </div>

        <div className="bg-slate-900/20 border border-slate-800/80 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Agenda Rapat</span>
            <Calendar className="h-4.5 w-4.5 text-red-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">{rapatList.length} Kali</div>
          <div className="text-[10px] text-slate-500 font-semibold">Total rapat evaluasi kepanitiaan</div>
        </div>
      </div>

      {/* Main Grid: Add Meeting & Meeting List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Add Meeting Form */}
        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 space-y-6 h-fit">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="h-5 w-5 text-red-500" />
              <span>Jadwalkan Rapat</span>
            </h3>
            <p className="text-xs text-slate-500">Mendaftarkan agenda rapat koordinasi selanjutnya.</p>
          </div>

          <form onSubmit={handleAddRapat} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Agenda Rapat</label>
              <input
                type="text"
                required
                value={agenda}
                onChange={(e) => setAgenda(e.target.value)}
                placeholder="Contoh: Rapat Pleno 2 Hadiah Lomba"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tanggal</label>
                <input
                  type="date"
                  required
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Waktu</label>
                <input
                  type="text"
                  required
                  value={waktu}
                  onChange={(e) => setWaktu(e.target.value)}
                  placeholder="Contoh: 19:30 - selesai"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tempat Pertemuan</label>
              <input
                type="text"
                required
                value={tempat}
                onChange={(e) => setTempat(e.target.value)}
                placeholder="Contoh: Rumah Pak RT 12"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition-all"
            >
              Simpan Jadwal Rapat
            </button>
          </form>
        </div>

        {/* Meeting Minutes Editor & List */}
        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 lg:col-span-2 space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-red-500" />
              <span>Notulen Rapat Resmi</span>
            </h3>
            <p className="text-xs text-slate-500">Tulis dan edit hasil keputusan koordinasi kepanitiaan di bawah.</p>
          </div>

          {activeRapatId ? (
            /* Markdown Editor view */
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-red-400">Menyunting Notulen</span>
                <span className="text-[10px] text-slate-500">Format teks bebas (mendukung Markdown)</span>
              </div>
              <textarea
                rows={10}
                value={notulenContent}
                onChange={(e) => setNotulenContent(e.target.value)}
                placeholder="Tulis keputusan di sini (e.g. ## Kesepakatan:\n1. Beli soto ayam 200 porsi...)"
                className="w-full bg-slate-900 border border-slate-850 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-red-500 font-mono"
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setActiveRapatId(null);
                    setNotulenContent('');
                  }}
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-white rounded-lg text-xs font-bold transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveNotulen}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all"
                >
                  Simpan Notulen
                </button>
              </div>
            </div>
          ) : (
            /* Meeting List View */
            <div className="space-y-4">
              {rapatList.map((r, index) => (
                <div key={index} className="bg-slate-950/40 border border-slate-850 rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-red-500/10 transition-colors">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-3.5 w-3.5 text-slate-500" />
                      <span className="text-xs text-slate-400 font-semibold">
                        {new Date(r.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      <span className="text-[9px] bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full font-bold">
                        {r.waktu}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white">{r.agenda}</h4>
                    <p className="text-xs text-slate-500">Tempat: <span className="text-slate-400 font-medium">{r.tempat}</span></p>
                  </div>

                  <button
                    onClick={() => handleOpenNotulenEditor(r)}
                    className="px-3.5 py-2 bg-red-600/10 hover:bg-red-650 border border-red-500/20 text-red-400 hover:text-white text-xs font-bold rounded-xl transition-all"
                  >
                    {r.notulen ? 'Edit Notulen' : 'Tulis Notulen'}
                  </button>
                </div>
              ))}
              {rapatList.length === 0 && (
                <p className="text-xs text-slate-500 italic text-center py-6">Belum ada rapat terdaftar.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
