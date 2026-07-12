'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Package, ArrowDownToLine, ArrowUpFromLine, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { logAuditActivity } from '@/lib/logger';
import { useRouter } from 'next/navigation';

export default function BaksosPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<any[]>([]);

  // Form states
  const [tipe, setTipe] = useState<'masuk' | 'keluar'>('masuk');
  const [jenisBarang, setJenisBarang] = useState('Beras');
  const [keterangan, setKeterangan] = useState('');
  const [jumlah, setJumlah] = useState<number | ''>('');
  const [satuan, setSatuan] = useState('Kg');
  const [submitting, setSubmitting] = useState(false);

  // Authentication & RBAC
  useEffect(() => {
    const userSession = localStorage.getItem('session_panitia');
    if (userSession) {
      const user = JSON.parse(userSession);
      setCurrentUser(user);
      
      // Strict Check Access
      const hasAccess = user.akses_menu?.includes('baksos');
      if (!hasAccess) {
        alert('Anda tidak memiliki akses ke modul Bakti Sosial.');
        router.push('/kepanitiaan');
        return;
      }
    } else {
      router.push('/');
      return;
    }

    loadData();

    // Realtime subscription
    const channel = supabase
      .channel('baksos-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'baksos_records' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('baksos_records')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setRecords(data || []);
      
      if (currentUser) {
        logAuditActivity('Akses Baca', 'Melihat modul Bakti Sosial (Sembako)', currentUser);
      }
    } catch (err) {
      console.error('Error loading baksos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jumlah || Number(jumlah) <= 0) return alert('Jumlah tidak valid');

    setSubmitting(true);
    try {
      const { error } = await supabase.from('baksos_records').insert([
        {
          tipe,
          jenis_barang: jenisBarang,
          keterangan,
          jumlah: Number(jumlah),
          satuan,
          pic: currentUser?.nama || 'Anonim'
        }
      ]);

      if (error) throw error;

      await logAuditActivity(
        'Bakti Sosial',
        `Mencatat barang ${tipe.toUpperCase()}: ${jenisBarang} sebanyak ${jumlah} ${satuan} - ${keterangan}`,
        currentUser
      );

      // Reset form
      setKeterangan('');
      setJumlah('');
    } catch (err: any) {
      alert('Gagal menyimpan data: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, desc: string) => {
    if (!confirm(`Hapus pencatatan: ${desc}?`)) return;
    
    try {
      const { error } = await supabase.from('baksos_records').delete().eq('id', id);
      if (error) throw error;
      
      await logAuditActivity('Menghapus Baksos', `Menghapus record: ${desc}`, currentUser);
    } catch (err: any) {
      alert('Gagal menghapus: ' + err.message);
    }
  };

  const inventorySummary = useMemo(() => {
    const summary: Record<string, { masuk: number, keluar: number, satuan: string }> = {};
    
    records.forEach(r => {
      const key = `${r.jenis_barang} (${r.satuan})`;
      if (!summary[key]) {
        summary[key] = { masuk: 0, keluar: 0, satuan: r.satuan };
      }
      
      if (r.tipe === 'masuk') summary[key].masuk += Number(r.jumlah);
      if (r.tipe === 'keluar') summary[key].keluar += Number(r.jumlah);
    });

    return summary;
  }, [records]);

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 text-red-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-grow p-4 md:p-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Package className="h-6 w-6 text-red-600" />
          Bakti Sosial (Sembako)
        </h1>
        <p className="text-slate-500 text-sm">
          Pencatatan inventaris barang sembako donasi masuk dan penyaluran untuk warga.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(inventorySummary).map(([key, data]) => {
          const saldo = data.masuk - data.keluar;
          return (
            <div key={key} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{key.split(' (')[0]}</div>
              <div className="mt-2 text-2xl font-black text-slate-800">
                {saldo} <span className="text-xs text-slate-500 font-medium">{data.satuan}</span>
              </div>
              <div className="mt-2 flex items-center gap-3 text-[10px] font-medium text-slate-500">
                <span className="flex items-center gap-1 text-emerald-600"><ArrowDownToLine className="h-3 w-3" /> {data.masuk}</span>
                <span className="flex items-center gap-1 text-rose-600"><ArrowUpFromLine className="h-3 w-3" /> {data.keluar}</span>
              </div>
            </div>
          );
        })}
        {Object.keys(inventorySummary).length === 0 && (
          <div className="col-span-full py-8 text-center border border-dashed border-slate-300 rounded-2xl text-slate-500 text-sm italic">
            Belum ada inventaris tercatat.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Input */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 h-fit shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-emerald-600" /> Catat Pergerakan Barang
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="flex gap-2">
              <label className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-xl cursor-pointer transition-all ${tipe === 'masuk' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold' : 'border-slate-200 text-slate-500'}`}>
                <input type="radio" className="hidden" checked={tipe === 'masuk'} onChange={() => setTipe('masuk')} />
                <ArrowDownToLine className="h-4 w-4" /> Masuk
              </label>
              <label className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-xl cursor-pointer transition-all ${tipe === 'keluar' ? 'border-rose-500 bg-rose-50 text-rose-700 font-bold' : 'border-slate-200 text-slate-500'}`}>
                <input type="radio" className="hidden" checked={tipe === 'keluar'} onChange={() => setTipe('keluar')} />
                <ArrowUpFromLine className="h-4 w-4" /> Keluar
              </label>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Jenis Barang</label>
              <select value={jenisBarang} onChange={(e) => setJenisBarang(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-red-500">
                <option value="Beras">Beras</option>
                <option value="Gula">Gula</option>
                <option value="Minyak Goreng">Minyak Goreng</option>
                <option value="Indomie">Indomie</option>
                <option value="Telur">Telur</option>
                <option value="Lain-lain">Lain-lain</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Jumlah</label>
                <input type="number" required value={jumlah} onChange={(e) => setJumlah(e.target.value ? Number(e.target.value) : '')} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-center focus:outline-none focus:border-red-500" placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Satuan</label>
                <select value={satuan} onChange={(e) => setSatuan(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-red-500">
                  <option value="Kg">Kg</option>
                  <option value="Liter">Liter</option>
                  <option value="Karton">Karton / Dus</option>
                  <option value="Pack">Pack</option>
                  <option value="Pcs">Pcs</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Keterangan / Merk</label>
              <textarea 
                required
                rows={2}
                value={keterangan} 
                onChange={(e) => setKeterangan(e.target.value)} 
                placeholder="Misal: Beras Rojolele Donasi Warga No.12 / Indomie Goreng"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-red-500 resize-none"
              />
            </div>

            <button type="submit" disabled={submitting} className={`w-full py-3 text-white font-bold text-xs rounded-xl transition-all ${tipe === 'masuk' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'} disabled:opacity-50`}>
              {submitting ? 'Menyimpan...' : (tipe === 'masuk' ? 'Simpan Penerimaan' : 'Simpan Penyaluran')}
            </button>
          </form>
        </div>

        {/* History Table */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:col-span-2 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Riwayat Mutasi Barang</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-3 px-2">Waktu</th>
                  <th className="py-3 px-2">Tipe</th>
                  <th className="py-3 px-2">Barang</th>
                  <th className="py-3 px-2">Jml</th>
                  <th className="py-3 px-2">Keterangan</th>
                  <th className="py-3 px-2 text-right">PIC</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50 group">
                    <td className="py-3 px-2 whitespace-nowrap text-slate-500">
                      {new Date(r.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${r.tipe === 'masuk' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {r.tipe.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-2 font-bold text-slate-800">{r.jenis_barang}</td>
                    <td className="py-3 px-2 font-semibold text-slate-900">{r.jumlah} {r.satuan}</td>
                    <td className="py-3 px-2 text-slate-600 max-w-[200px] truncate">{r.keterangan}</td>
                    <td className="py-3 px-2 text-right text-slate-500 flex items-center justify-end gap-2">
                      {r.pic}
                      <button onClick={() => handleDelete(r.id, `${r.tipe} ${r.jenis_barang} ${r.jumlah}`)} className="text-rose-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        <AlertCircle className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 italic">Belum ada riwayat tercatat.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
