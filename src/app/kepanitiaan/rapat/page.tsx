'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { FileText, Plus, Edit2, Trash2, Calendar, Clock, MapPin, X } from 'lucide-react';

export default function KepanitiaanRapat() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rapatList, setRapatList] = useState<any[]>([]);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [tanggal, setTanggal] = useState('');
  const [waktu, setWaktu] = useState('');
  const [tempat, setTempat] = useState('');
  const [agenda, setAgenda] = useState('');
  const [notulen, setNotulen] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const { data } = await supabase
        .from('rapat')
        .select('*')
        .order('tanggal', { ascending: false });
      if (data) setRapatList(data);
    } catch (err) {
      console.error('Error loading rapat:', err);
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
      .channel('rapat-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rapat' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const resetForm = () => {
    setTanggal('');
    setWaktu('');
    setTempat('');
    setAgenda('');
    setNotulen('');
    setEditingId(null);
    setShowForm(false);
  };

  const handleEditClick = (r: any) => {
    setTanggal(r.tanggal);
    setWaktu(r.waktu);
    setTempat(r.tempat);
    setAgenda(r.agenda);
    setNotulen(r.notulen || '');
    setEditingId(r.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      const payload = {
        tanggal,
        waktu,
        tempat,
        agenda,
        notulen
      };

      if (editingId) {
        const { error } = await supabase.from('rapat').update(payload).eq('id', editingId);
        if (error) throw error;
        // Audit log
        await supabase.from('audit_log').insert([{ panitia_id: currentUser?.id, nama_panitia: currentUser?.nama, aksi: 'Update Rapat', detail: `Mengubah notulen rapat: ${agenda}` }]);
      } else {
        const { error } = await supabase.from('rapat').insert([payload]);
        if (error) throw error;
        // Audit log
        await supabase.from('audit_log').insert([{ panitia_id: currentUser?.id, nama_panitia: currentUser?.nama, aksi: 'Tambah Rapat', detail: `Menambahkan rapat baru: ${agenda}` }]);
      }
      
      resetForm();
      loadData();
    } catch (err: any) {
      alert('Gagal menyimpan: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, judul: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus notulen rapat "${judul}"?`)) return;

    try {
      const { error } = await supabase.from('rapat').delete().eq('id', id);
      if (error) throw error;
      
      await supabase.from('audit_log').insert([{ panitia_id: currentUser?.id, nama_panitia: currentUser?.nama, aksi: 'Hapus Rapat', detail: `Menghapus rapat: ${judul}` }]);
      loadData();
    } catch (err: any) {
      alert('Gagal menghapus: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-500 border-r-2 mx-auto"></div>
          <p className="text-xs text-slate-500">Memuat Notulen Rapat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <FileText className="text-primary-500 h-6 w-6" />
            Manajemen Notulen Rapat
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Catat hasil rapat dan keputusan penting untuk transparansi panitia.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-primary-600/10"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Rapat Baru</span>
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-slate-900">
              {editingId ? 'Edit Notulen Rapat' : 'Tambah Notulen Rapat'}
            </h3>
            <button onClick={resetForm} className="p-2 text-slate-500 hover:text-slate-900 rounded-lg">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Tanggal</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <input type="date" required value={tanggal} onChange={e => setTanggal(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-primary-500" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Waktu</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <input type="text" required value={waktu} onChange={e => setWaktu(e.target.value)}
                    placeholder="Mis. 19:30 - 21:00 WIB"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-primary-500" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Tempat</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <input type="text" required value={tempat} onChange={e => setTempat(e.target.value)}
                    placeholder="Mis. Rumah Pak RT"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-primary-500" />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Agenda Utama</label>
              <input type="text" required value={agenda} onChange={e => setAgenda(e.target.value)}
                placeholder="Mis. Rapat Pembentukan Kepanitiaan"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-primary-500 font-bold" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Isi Notulen & Keputusan</label>
              <textarea rows={8} value={notulen} onChange={e => setNotulen(e.target.value)}
                placeholder="Tuliskan hasil keputusan rapat di sini (mendukung format Markdown)..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-primary-500 leading-relaxed" />
              <p className="text-[9px] text-slate-500 italic">Gunakan *, -, atau angka untuk membuat daftar list.</p>
            </div>

            <div className="flex justify-end pt-2">
              <button type="submit" disabled={submitting}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all disabled:opacity-50">
                {submitting ? 'Menyimpan...' : (editingId ? 'Simpan Perubahan' : 'Terbitkan Notulen')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rapat List */}
      <div className="space-y-4">
        {rapatList.map((r) => (
          <div key={r.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="p-5 flex justify-between items-start md:items-center flex-col md:flex-row gap-4 bg-slate-50">
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider bg-primary-600/10 border border-primary-500/20 px-3 py-1 rounded-full">
                    {new Date(r.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-bold flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {r.waktu}
                  </span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-bold flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {r.tempat}
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900 mt-2">{r.agenda}</h3>
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => handleEditClick(r)} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors">
                  <Edit2 className="h-3.5 w-3.5" /> Edit
                </button>
                <button onClick={() => handleDelete(r.id, r.agenda)} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 hover:bg-primary-500/10 text-slate-500 hover:text-primary-400 border border-transparent hover:border-primary-500/30 rounded-lg transition-colors">
                  <Trash2 className="h-3.5 w-3.5" /> Hapus
                </button>
              </div>
            </div>
            
            <div className="px-5 pb-5 pt-4 border-t border-slate-200">
              <div className="text-xs text-slate-500 uppercase tracking-widest font-black mb-2">Hasil & Notulen Rapat</div>
              <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-line prose  max-w-none">
                {r.notulen || <span className="italic text-slate-500">Belum ada catatan notulen yang disimpan.</span>}
              </div>
            </div>
          </div>
        ))}

        {rapatList.length === 0 && (
          <div className="text-center py-12 border border-slate-200 border-dashed rounded-2xl bg-slate-50">
            <FileText className="h-8 w-8 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-medium">Belum ada rekam notulen rapat.</p>
          </div>
        )}
      </div>
    </div>
  );
}
