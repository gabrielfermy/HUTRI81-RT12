import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle, XCircle, FileImage, CreditCard, MessageCircle, ExternalLink } from 'lucide-react';

interface VerifikasiTabProps {
  currentUser: any;
  wargaList: any[];
}

export const VerifikasiTab: React.FC<VerifikasiTabProps> = ({ currentUser, wargaList }) => {
  const [transaksiList, setTransaksiList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadTransaksi();
    
    // Subscribe to realtime changes on transaksi_online
    const channel = supabase
      .channel('transaksi-online-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transaksi_online' }, () => {
        loadTransaksi();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadTransaksi = async () => {
    try {
      const { data, error } = await supabase
        .from('transaksi_online')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTransaksiList(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (tx: any) => {
    if (!confirm(`Setujui pembayaran dari ${tx.nama_pengirim}?`)) return;
    
    setProcessingId(tx.id);
    try {
      if (tx.jenis_transaksi === 'iuran') {
        // Update warga to paid
        if (tx.warga_id) {
          await supabase.from('warga').update({ is_paid: true, nominal_iuran: tx.nominal }).eq('id', tx.warga_id);
        }
      } else {
        // Insert as sponsor / donatur
        await supabase.from('sponsorship').insert([{
          nama: tx.nama_pengirim,
          tipe: 'Donatur Warga',
          nominal: tx.nominal,
          keterangan: tx.keterangan || 'Dari Pembayaran Online'
        }]);
      }

      // Mark transaction as approved
      await supabase.from('transaksi_online').update({ 
        status: 'approved',
        diubah_oleh: currentUser?.nama || 'Admin'
      }).eq('id', tx.id);
      
    } catch (err: any) {
      alert('Gagal menyetujui: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (tx: any) => {
    if (!confirm(`Tolak pembayaran dari ${tx.nama_pengirim}?`)) return;
    
    setProcessingId(tx.id);
    try {
      await supabase.from('transaksi_online').update({ 
        status: 'rejected',
        diubah_oleh: currentUser?.nama || 'Admin'
      }).eq('id', tx.id);
    } catch (err: any) {
      alert('Gagal menolak: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <div className="text-center py-10 text-slate-500">Memuat data transaksi...</div>;
  }

  const pendingList = transaksiList.filter(t => t.status === 'pending');
  const historyList = transaksiList.filter(t => t.status !== 'pending');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Verifikasi Pembayaran Online</h2>
          <p className="text-xs text-slate-500 mt-1">Daftar warga yang mengunggah bukti transfer melalui portal web.</p>
        </div>
        <div className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-xs font-bold border border-red-200 flex items-center">
          <CreditCard className="h-4 w-4 mr-2" />
          {pendingList.length} Menunggu Verifikasi
        </div>
      </div>

      {pendingList.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-700">Menunggu Verifikasi</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingList.map(tx => (
              <div key={tx.id} className="bg-white border-2 border-amber-400/50 rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-wider bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                      {tx.jenis_transaksi}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 mt-2">{tx.nama_pengirim}</h4>
                    <p className="text-xs text-slate-500">{new Date(tx.created_at).toLocaleString('id-ID')}</p>
                  </div>
                  <span className="text-lg font-black text-amber-500">Rp {Number(tx.nominal).toLocaleString('id-ID')}</span>
                </div>
                
                {tx.bukti_url && (
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                    <a href={tx.bukti_url} target="_blank" rel="noreferrer" className="flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700">
                      <FileImage className="h-4 w-4 mr-2" />
                      Lihat Bukti Transfer
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </div>
                )}
                
                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => handleApprove(tx)}
                    disabled={processingId === tx.id}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg text-xs font-bold transition-colors flex justify-center items-center"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" /> Setujui
                  </button>
                  <button 
                    onClick={() => handleReject(tx)}
                    disabled={processingId === tx.id}
                    className="flex-1 bg-red-100 hover:bg-red-200 text-red-600 py-2 rounded-lg text-xs font-bold transition-colors flex justify-center items-center"
                  >
                    <XCircle className="h-4 w-4 mr-1" /> Tolak
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {historyList.length > 0 && (
        <div className="space-y-4 pt-8 border-t border-slate-200">
          <h3 className="text-sm font-bold text-slate-700">Riwayat Verifikasi</h3>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">Tanggal</th>
                  <th className="px-4 py-3 font-semibold">Pengirim</th>
                  <th className="px-4 py-3 font-semibold">Nominal</th>
                  <th className="px-4 py-3 font-semibold">Jenis</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Verifier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historyList.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-slate-500">{new Date(tx.created_at).toLocaleDateString('id-ID')}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{tx.nama_pengirim}</td>
                    <td className="px-4 py-3 font-semibold text-slate-700">Rp {Number(tx.nominal).toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3 uppercase text-[10px] tracking-wider font-bold text-slate-500">{tx.jenis_transaksi}</td>
                    <td className="px-4 py-3">
                      {tx.status === 'approved' ? (
                        <span className="text-green-600 font-bold bg-green-50 px-2 py-1 rounded-md text-[10px]">DISETUJUI</span>
                      ) : (
                        <span className="text-red-600 font-bold bg-red-50 px-2 py-1 rounded-md text-[10px]">DITOLAK</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-[10px]">{tx.diubah_oleh}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {transaksiList.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
          <CreditCard className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500">Belum ada transaksi online</p>
        </div>
      )}
    </div>
  );
};
