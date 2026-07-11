'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ShieldAlert, Clock, RefreshCw, Search, Monitor, Globe, Filter } from 'lucide-react';

// Kategori Map
const KATEGORI_OPTIONS = [
  'Semua Kategori',
  'Warga',
  'Keuangan',
  'Acara & Rundown',
  'Rapat & Notulen',
  'Kepanitiaan',
  'Keamanan & Sistem',
  'Lainnya'
];

function determineKategori(aksi: string): string {
  const a = aksi.toLowerCase();
  if (a.includes('warga') || a.includes('impor')) return 'Warga';
  if (a.includes('iuran') || a.includes('pengeluaran') || a.includes('sponsor') || a.includes('rab')) return 'Keuangan';
  if (a.includes('rundown') || a.includes('acara')) return 'Acara & Rundown';
  if (a.includes('rapat') || a.includes('notulen') || a.includes('kehadiran')) return 'Rapat & Notulen';
  if (a.includes('panitia') || a.includes('seksi') || a.includes('profil')) return 'Kepanitiaan';
  if (a.includes('akses') || a.includes('sistem') || a.includes('database') || a.includes('inisialisasi')) return 'Keamanan & Sistem';
  return 'Lainnya';
}

export default function KepanitiaanLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKategori, setSelectedKategori] = useState('Semua Kategori');

  async function loadLogs() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && !error) {
        setLogs(data);
      }
    } catch (err) {
      console.error('Error loading audit logs:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      (log.nama_panitia?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (log.detail?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (log.aksi?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      
    const matchesKategori = 
      selectedKategori === 'Semua Kategori' || 
      determineKategori(log.aksi) === selectedKategori;

    return matchesSearch && matchesKategori;
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="border-b border-slate-900 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <ShieldAlert className="text-red-500" />
            <span>Audit Log & Aktivitas Sistem</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">Daftar rekaman perubahan data penting, akses sensitif, dan jejak audit secara real-time.</p>
        </div>
        <button
          onClick={loadLogs}
          className="flex items-center space-x-2 text-xs font-bold text-slate-500 hover:text-white bg-slate-900 border border-slate-200 hover:border-slate-700 px-4 py-2.5 rounded-xl transition-all shrink-0 shadow-sm hover:shadow-md"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Segarkan Log</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:w-1/2">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Cari aktivitas, nama panitia, atau detail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-red-500 shadow-sm"
          />
        </div>
        
        <div className="relative w-full md:w-1/2 flex items-center gap-3">
          <Filter className="h-4 w-4 text-slate-500 shrink-0" />
          <select
            value={selectedKategori}
            onChange={(e) => setSelectedKategori(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-red-500 font-bold shadow-sm cursor-pointer"
          >
            {KATEGORI_OPTIONS.map((cat, idx) => (
              <option key={idx} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center text-center space-y-4">
          <RefreshCw className="h-8 w-8 text-red-500 animate-spin" />
          <span className="text-xs text-slate-500 italic">Memuat jejak audit dari database...</span>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto space-y-4">
          {filteredLogs.map((log) => {
            const kategori = determineKategori(log.aksi);
            // Parse User Agent to a readable format minimally
            const isMobile = (log.user_agent || '').toLowerCase().includes('mobile');
            const uaString = (log.user_agent || 'Unknown').substring(0, 40) + ((log.user_agent?.length > 40) ? '...' : '');

            return (
              <div
                key={log.id}
                className="bg-white border border-slate-200 rounded-xl p-5 hover:border-red-500/30 hover:shadow-md transition-all group"
              >
                <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                  
                  {/* Left Section: Action & Detail */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-black text-red-600 bg-red-50 border border-red-500/20 px-2.5 py-1 rounded-md uppercase tracking-wider">
                        {log.aksi}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">
                        {kategori}
                      </span>
                    </div>
                    
                    <p className="text-sm text-slate-900 leading-relaxed font-semibold">
                      {log.detail}
                    </p>
                    
                    <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
                      <span>Oleh: </span>
                      <span className="font-extrabold text-slate-900">{log.nama_panitia}</span>
                    </div>
                  </div>

                  {/* Right Section: Metadata (Time, IP, Device) */}
                  <div className="flex flex-col items-start lg:items-end gap-2 shrink-0 min-w-[200px] w-full lg:w-auto bg-slate-50 lg:bg-transparent p-3 lg:p-0 rounded-lg lg:rounded-none">
                    
                    <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 font-semibold bg-white lg:bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg w-full lg:w-auto justify-start lg:justify-end">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>
                        {new Date(log.created_at).toLocaleDateString('id-ID', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })} - {new Date(log.created_at).toLocaleTimeString('id-ID', {
                          hour: '2-digit', minute: '2-digit', second: '2-digit'
                        })} WIB
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 font-medium w-full lg:w-auto justify-start lg:justify-end">
                      <Globe className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                      <span>IP: <span className="font-bold text-slate-700">{log.ip_address || 'Tdk tercatat'}</span></span>
                    </div>

                    <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 font-medium w-full lg:w-auto justify-start lg:justify-end" title={log.user_agent}>
                      <Monitor className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                      <span className="truncate max-w-[150px]">{isMobile ? 'Mobile Device' : 'Desktop / PC'}</span>
                    </div>
                    
                  </div>

                </div>
              </div>
            );
          })}
          
          {filteredLogs.length === 0 && !loading && (
            <div className="py-20 text-center flex flex-col items-center justify-center bg-slate-50 border border-slate-200 border-dashed rounded-2xl">
              <ShieldAlert className="h-8 w-8 text-slate-300 mb-3" />
              <p className="text-sm font-bold text-slate-500">Tidak ada log aktivitas.</p>
              <p className="text-xs text-slate-400 mt-1">Coba ubah kata kunci pencarian atau filter kategori Anda.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
