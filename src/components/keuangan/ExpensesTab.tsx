import React, { useState, useEffect } from 'react';
import { Trash2, DollarSign, Upload, Image as ImageIcon, Eye, X, Edit2, History } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { compressImage } from '@/lib/imageCompression';

interface ExpensesTabProps {
  rabList: any[];
  expensesList: any[];
  currentUser: any;
  panitiaList: any[];
  onAddExpense: (item: string, nominal: number, tanggal: string, seksi: string, rabId: string, pic: string, buktiUrl?: string) => Promise<void>;
  onEditExpense: (id: string, item: string, nominal: number, tanggal: string, seksi: string, rabId: string, pic: string, buktiUrl?: string) => Promise<void>;
  onDeleteExpense: (id: string, item: string, nominal: number) => Promise<void>;
}

export const ExpensesTab: React.FC<ExpensesTabProps> = ({
  rabList,
  expensesList,
  currentUser,
  panitiaList,
  onAddExpense,
  onEditExpense,
  onDeleteExpense
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expRabId, setExpRabId] = useState('');
  const [expItem, setExpItem] = useState('');
  const [expNominal, setExpNominal] = useState(0);
  const [expTanggal, setExpTanggal] = useState('');
  const [expSeksi, setExpSeksi] = useState(currentUser?.seksi !== 'Inti' ? currentUser?.seksi || 'Acara' : 'Acara');
  const [expPic, setExpPic] = useState('');
  
  // File Upload states
  const [buktiFile, setBuktiFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Lightbox Modal state
  const [activePreviewUrl, setActivePreviewUrl] = useState<string | null>(null);

  // Monitoring/History Modal states
  const [monitoringExpenseId, setMonitoringExpenseId] = useState<string | null>(null);
  const [monitoringExpenseItem, setMonitoringExpenseItem] = useState<string>('');
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Set default PIC when current user is loaded
  useEffect(() => {
    if (currentUser && !editingId && !expPic) {
      setExpPic(currentUser.nama || '');
    }
  }, [currentUser, editingId, expPic]);

  const startEdit = (e: any) => {
    setEditingId(e.id);
    setExpRabId(e.rab_id || '');
    setExpItem(e.item_pembelian);
    setExpNominal(Number(e.nominal_riil));
    setExpTanggal(e.tanggal_pembelian);
    setExpSeksi(e.seksi_pj);
    setExpPic(e.pic);
    setBuktiFile(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setExpRabId('');
    setExpItem('');
    setExpNominal(0);
    setExpTanggal('');
    setExpSeksi(currentUser?.seksi !== 'Inti' ? currentUser?.seksi || 'Acara' : 'Acara');
    setExpPic(currentUser?.nama || '');
    setBuktiFile(null);
    const fileInput = document.getElementById('buktiFile') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const openMonitoring = async (expenseId: string, itemName: string) => {
    setMonitoringExpenseId(expenseId);
    setMonitoringExpenseItem(itemName);
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .ilike('detail', `%[ID: ${expenseId}]%`)
        .order('created_at', { ascending: false });
      if (data && !error) {
        setHistoryLogs(data);
      } else {
        console.error(error);
        setHistoryLogs([]);
      }
    } catch (err) {
      console.error(err);
      setHistoryLogs([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expItem || !expNominal || !expTanggal || submitting || uploading) return;

    setSubmitting(true);
    let uploadedUrl: string | undefined = undefined;

    try {
      if (buktiFile) {
        setUploading(true);
        // 1. Compress image to under 150KB
        const compressedBlob = await compressImage(buktiFile, 1024, 0.7);
        const compressedFile = new File([compressedBlob], `compressed_${buktiFile.name}`, { type: 'image/jpeg' });

        // 2. Generate unique filename
        const fileExt = 'jpg';
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

        // 3. Upload to public bucket 'bukti-transaksi'
        const { error: uploadError } = await supabase.storage
          .from('bukti-transaksi')
          .upload(fileName, compressedFile);

        if (uploadError) {
          console.error('Upload error details:', uploadError);
          alert('Bukti transfer gagal diunggah ke storage, tetapi transaksi akan tetap disimpan.');
        } else {
          // Get public URL
          const { data } = supabase.storage.from('bukti-transaksi').getPublicUrl(fileName);
          uploadedUrl = data.publicUrl;
        }
      }

      if (editingId) {
        await onEditExpense(editingId, expItem, expNominal, expTanggal, expSeksi, expRabId, expPic, uploadedUrl);
        cancelEdit();
      } else {
        await onAddExpense(expItem, expNominal, expTanggal, expSeksi, expRabId, expPic, uploadedUrl);
        setExpItem('');
        setExpNominal(0);
        setExpTanggal('');
        setBuktiFile(null);
        
        // Reset file input element
        const fileInput = document.getElementById('buktiFile') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }

    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
      {/* Add / Edit Expense Form */}
      <div className="bg-slate-100/30 border border-slate-200 rounded-2xl p-6 space-y-6 h-fit">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            {editingId ? 'Edit Transaksi Belanja' : 'Input Belanja Baru'}
          </h3>
          <p className="text-[10px] text-slate-500">
            {editingId ? 'Mengubah rincian pengeluaran riil panitia.' : 'Mencatat pengeluaran riil panitia dan hubungkan ke pos RAB.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Pilih Item Anggaran (RAB)</label>
            <select
              value={expRabId}
              onChange={(e) => setExpRabId(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500"
            >
              <option value="">Pos Belanja Umum (Tanpa RAB)</option>
              {rabList.map(r => (
                <option key={r.id} value={r.id}>
                  [{r.kategori}] {r.item} (Maks: Rp {Number(r.total_idr).toLocaleString('id-ID')})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Detail Belanja Barang</label>
            <input
              type="text"
              required
              value={expItem}
              onChange={(e) => setExpItem(e.target.value)}
              placeholder="e.g. Pembelian 15 piala & pita merah putih"
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-red-500 font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Nominal Belanja (Rp)</label>
              <input
                type="number"
                required
                value={expNominal}
                onChange={(e) => setExpNominal(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500 text-right font-semibold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Tanggal Pembelian</label>
              <input
                type="date"
                required
                value={expTanggal}
                onChange={(e) => setExpTanggal(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500 font-semibold"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Seksi Penanggung Jawab</label>
            <select
              value={expSeksi}
              onChange={(e) => setExpSeksi(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500 font-semibold"
            >
              <option value="Acara">Acara</option>
              <option value="Perlengkapan & Dekorasi">Perlengkapan & Dekorasi</option>
              <option value="Konsumsi">Konsumsi</option>
              <option value="Keamanan & Kebersihan">Keamanan & Kebersihan</option>
              <option value="Dokumentasi">Dokumentasi</option>
              <option value="Humas & Dana">Humas & Dana</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">PIC Pengeluaran Dana</label>
            <select
              value={expPic}
              onChange={(e) => setExpPic(e.target.value)}
              required
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500 font-semibold"
            >
              <option value="">Pilih PIC...</option>
              {panitiaList.map(p => (
                <option key={p.id} value={p.nama}>
                  {p.nama} ({p.seksi})
                </option>
              ))}
            </select>
          </div>

          {/* Receipt Upload Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
              {editingId ? 'Ganti Bukti Nota / Struk (Opsional)' : 'Unggah Bukti Nota / Struk'}
            </label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-200 hover:border-slate-700 bg-white rounded-xl cursor-pointer transition-colors relative overflow-hidden group">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {buktiFile ? (
                    <div className="text-center space-y-1">
                      <ImageIcon className="h-6 w-6 text-emerald-450 mx-auto" />
                      <p className="text-[10px] font-bold text-slate-900 max-w-[200px] truncate">{buktiFile.name}</p>
                      <p className="text-[8px] text-slate-500">{(buktiFile.size / 1024 / 1024).toFixed(2)} MB (Akan dikompresi)</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="h-5 w-5 text-slate-500 group-hover:text-slate-500 mx-auto mb-1 transition-colors" />
                      <p className="text-[9px] text-slate-500 group-hover:text-slate-350 font-bold transition-colors">Pilih File Foto Bukti</p>
                      <p className="text-[7px] text-slate-600 font-medium">JPEG, PNG maks 10MB (Auto kompresi)</p>
                    </div>
                  )}
                </div>
                <input
                  id="buktiFile"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setBuktiFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="w-1/3 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-all"
              >
                Batal
              </button>
            )}
            <button
              type="submit"
              disabled={submitting || uploading}
              className={`py-2.5 text-white font-bold text-xs rounded-xl transition-all disabled:opacity-50 ${editingId ? 'w-2/3 bg-amber-600 hover:bg-amber-500' : 'w-full bg-red-600 hover:bg-red-500'}`}
            >
              {uploading ? 'Mengompres & Mengunggah...' : submitting ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Simpan Transaksi Belanja'}
            </button>
          </div>
        </form>
      </div>

      {/* Expenses List View */}
      <div className="bg-slate-100/30 border border-slate-200 rounded-2xl p-6 lg:col-span-2 space-y-6">
        <h3 className="text-base font-bold text-slate-900">Riwayat Pengeluaran Belanja</h3>
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-white border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Nama Barang</th>
                <th className="py-3 px-4 text-center">Seksi / PIC</th>
                <th className="py-3 px-4 text-center">Tanggal</th>
                <th className="py-3 px-4 text-right">Nominal</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {expensesList.map((e, idx) => (
                <tr key={idx} className="border-b border-slate-200 hover:bg-slate-100">
                  <td className="py-3 px-4 text-slate-900 font-semibold">
                    <div className="flex items-center gap-2">
                      <div>
                        {e.item_pembelian}
                        {e.rab_id && (
                          <span className="block text-[10px] text-slate-500 mt-0.5 font-medium">
                            RAB: {rabList.find(r => r.id === e.rab_id)?.item || 'Terhubung'}
                          </span>
                        )}
                      </div>
                      {/* Show photo preview button if receipt url exists */}
                      {e.bukti_nota_url && (
                        <button
                          onClick={() => setActivePreviewUrl(e.bukti_nota_url)}
                          title="Lihat Bukti Kwitansi"
                          className="p-1 text-red-400 bg-red-500/10 border border-red-500/10 hover:bg-red-500/25 rounded-md transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center text-slate-350">
                    <span className="block text-xs font-semibold">{e.seksi_pj}</span>
                    <span className="block text-[9px] text-slate-550 font-medium">{e.pic}</span>
                  </td>
                  <td className="py-3 px-4 text-center text-slate-500">
                    {new Date(e.tanggal_pembelian).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    Rp {Number(e.nominal_riil).toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => openMonitoring(e.id, e.item_pembelian)}
                        title="Lihat Histori Perubahan"
                        className="p-1.5 text-slate-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all"
                      >
                        <History className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => startEdit(e)}
                        title="Ubah Transaksi"
                        className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-500/10 rounded-lg transition-all"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDeleteExpense(e.id, e.item_pembelian, e.nominal_riil)}
                        title="Hapus Transaksi"
                        className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {expensesList.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500 italic">Belum ada transaksi pengeluaran tercatat.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lightbox Receipt Modal */}
      {activePreviewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative max-w-2xl w-full bg-slate-100 border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4 text-red-500" />
                <span>Bukti Kwitansi / Struk Pembelian</span>
              </h4>
              <button
                onClick={() => setActivePreviewUrl(null)}
                className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex justify-center bg-white p-2.5 rounded-xl border border-slate-200 max-h-[70vh] overflow-y-auto">
              <img
                src={activePreviewUrl}
                alt="Bukti Kwitansi Belanja"
                className="max-w-full h-auto rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Monitoring History Modal */}
      {monitoringExpenseId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative max-w-2xl w-full bg-slate-100 border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <History className="h-4 w-4 text-blue-500" />
                <span>Histori Perubahan: "{monitoringExpenseItem}"</span>
              </h4>
              <button
                onClick={() => setMonitoringExpenseId(null)}
                className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1">
              {loadingHistory ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-blue-500 mx-auto mb-2"></div>
                  Memuat histori...
                </div>
              ) : historyLogs.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 italic">Belum ada catatan histori perubahan untuk item ini.</div>
              ) : (
                <div className="relative border-l-2 border-slate-200 ml-3 space-y-4 py-2">
                  {historyLogs.map((log) => (
                    <div key={log.id} className="relative pl-6">
                      {/* Circle Indicator */}
                      <div className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-blue-500 shadow-sm" />
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                            {log.aksi}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {new Date(log.created_at).toLocaleString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-800 font-semibold">{log.detail}</p>
                        <p className="text-[10px] text-slate-500 font-medium">Oleh: <span className="font-bold text-slate-700">{log.nama_panitia}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
