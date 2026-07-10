'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ShieldAlert, Clock, RefreshCw } from 'lucide-react';

export default function KepanitiaanLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="border-b border-slate-900 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <ShieldAlert className="text-red-500" />
            <span>Audit Log Aktivitas Panitia</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">Daftar rekaman perubahan data penting di dalam sistem secara real-time.</p>
        </div>
        <button
          onClick={loadLogs}
          className="flex items-center space-x-2 text-xs font-bold text-slate-500 hover:text-slate-900 bg-slate-900 border border-slate-200 hover:border-slate-700 px-3.5 py-2 rounded-xl transition-all"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Segarkan Log</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-500 italic">Memuat log aktivitas...</div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-4">
          {logs.map((log) => (
            <div
              key={log.id}
              className="bg-slate-50 border border-slate-850 rounded-xl p-5 hover:border-red-500/10 transition-colors"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-black text-red-400 bg-red-600/10 border border-red-500/20 px-2 py-0.5 rounded-md uppercase tracking-wider">
                      {log.aksi}
                    </span>
                    <span className="text-xs font-extrabold text-slate-900">
                      {log.nama_panitia}
                    </span>
                  </div>
                  <p className="text-xs text-slate-350 leading-relaxed font-medium">{log.detail}</p>
                </div>

                <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 font-semibold bg-slate-50 border border-slate-900 px-2.5 py-1 rounded-lg shrink-0">
                  <Clock className="h-3.5 w-3.5 text-slate-500" />
                  <span>
                    {new Date(log.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}{' '}
                    -{' '}
                    {new Date(log.created_at).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    WIB
                  </span>
                </div>
              </div>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="py-20 text-center text-xs text-slate-500 italic">Belum ada aktivitas tercatat di sistem.</div>
          )}
        </div>
      )}
    </div>
  );
}
