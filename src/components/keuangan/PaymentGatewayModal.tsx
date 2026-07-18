import React, { useState } from 'react';
import { X, Upload, MessageCircle, Info, CreditCard } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PaymentGatewayModalProps {
  onClose: () => void;
  wargaList: any[];
}

export const PaymentGatewayModal: React.FC<PaymentGatewayModalProps> = ({ onClose, wargaList }) => {
  const [paymentType, setPaymentType] = useState<'iuran' | 'donasi'>('iuran');
  const [selectedWarga, setSelectedWarga] = useState('');
  const [namaDonatur, setNamaDonatur] = useState('');
  const [nominal, setNominal] = useState(0);
  const [keterangan, setKeterangan] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nominal <= 0) return alert('Nominal harus lebih dari 0');
    if (paymentType === 'iuran' && !selectedWarga) return alert('Pilih nama KK terlebih dahulu');
    if (paymentType === 'donasi' && !namaDonatur) return alert('Masukkan nama Anda');
    if (!file) return alert('Mohon unggah foto bukti transfer');

    setSubmitting(true);
    try {
      // 1. Upload to Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('bukti_transfer')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('bukti_transfer')
        .getPublicUrl(fileName);

      const fileUrl = publicUrlData.publicUrl;

      // 2. Insert into database
      const wName = paymentType === 'iuran' ? wargaList.find((w:any) => w.id === selectedWarga)?.nama : namaDonatur;

      const { error: insertError } = await supabase
        .from('transaksi_online')
        .insert([{
          nama_pengirim: wName,
          jenis_transaksi: paymentType,
          nominal: nominal,
          bukti_url: fileUrl,
          keterangan: keterangan,
          warga_id: paymentType === 'iuran' ? selectedWarga : null
        }]);

      if (insertError) throw insertError;

      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      alert('Terjadi kesalahan: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleWA = () => {
    const wName = paymentType === 'iuran' ? wargaList.find((w:any) => w.id === selectedWarga)?.nama : namaDonatur;
    const text = `Halo Bendahara RT 12, saya ${wName || 'Warga'} ingin mengkonfirmasi transfer sebesar Rp ${nominal.toLocaleString('id-ID')} untuk ${paymentType === 'iuran' ? 'Iuran Wajib' : 'Donasi / Sponsor'}. Berikut bukti transfernya:`;
    const waUrl = `https://wa.me/6281234567890?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-4 shadow-2xl animate-fadeIn">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h3 className="text-2xl font-black text-slate-900">Pembayaran Berhasil Dikirim!</h3>
          <p className="text-sm text-slate-500">Bukti transfer Anda telah dikirim dan sedang menunggu verifikasi dari Bendahara Panitia. Terima kasih atas partisipasinya!</p>
          <button onClick={onClose} className="w-full mt-6 py-3 bg-slate-900 text-white rounded-xl font-bold">Tutup</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl relative my-8 animate-fadeIn overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <CreditCard className="h-6 w-6 text-red-500" />
            <h2 className="text-lg sm:text-xl font-bold tracking-wide">Portal Pembayaran Online</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8 flex flex-col md:flex-row gap-8">
          {/* Kiri: QRIS & Info Rekening */}
          <div className="w-full md:w-5/12 space-y-6">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-4">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-sm">Scan QRIS GoPay</h3>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 inline-block">
                {/* Dummy QRIS Image */}
                <div className="w-48 h-48 bg-slate-200 rounded-xl mx-auto flex items-center justify-center border-2 border-dashed border-slate-300">
                  <span className="text-slate-400 font-bold text-sm">GAMBAR QRIS</span>
                </div>
              </div>
              <p className="text-xs font-bold text-slate-600">Milik: Ashvinlabs (Startup)</p>
              
              <div className="pt-4 border-t border-slate-200">
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-2">Atau Transfer Bank Manual:</p>
                <div className="bg-white border border-slate-200 rounded-xl p-3 text-left">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-900">BCA</span>
                    <span className="text-[10px] text-slate-500">a.n. Gabriel Fermy</span>
                  </div>
                  <p className="font-mono text-sm font-black text-slate-700 tracking-wider">8465 1234 56</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50/50 border border-blue-200 rounded-2xl p-4 flex gap-3 text-blue-700">
              <Info className="h-5 w-5 shrink-0 mt-0.5" />
              <p className="text-xs font-medium leading-relaxed">
                Pembayaran yang dilakukan akan divalidasi oleh bendahara secara manual. Harap **simpan screenshot bukti transfer** Anda untuk diunggah di form sebelah kanan.
              </p>
            </div>
          </div>

          {/* Kanan: Form Konfirmasi */}
          <div className="w-full md:w-7/12">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Konfirmasi Pembayaran</h3>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Jenis Pembayaran Tab */}
              <div className="flex p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPaymentType('iuran')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${paymentType === 'iuran' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Iuran Warga RT 12
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentType('donasi')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${paymentType === 'donasi' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Donasi / Sponsor Bebas
                </button>
              </div>

              {/* Form Iuran */}
              {paymentType === 'iuran' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Pilih Nama Kepala Keluarga (KK)</label>
                    <select
                      required
                      value={selectedWarga}
                      onChange={(e) => {
                        setSelectedWarga(e.target.value);
                        // Auto-fill nominal based on selection (if you want default 150k for instance, or based on db)
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-red-500"
                    >
                      <option value="">-- Cari Nama Anda --</option>
                      {wargaList.map((w: any) => (
                        <option key={w.id} value={w.id}>{w.nama} {w.is_paid ? '(SUDAH LUNAS)' : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Form Donasi */}
              {paymentType === 'donasi' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Nama Donatur / Instansi</label>
                    <input
                      type="text"
                      required
                      value={namaDonatur}
                      onChange={(e) => setNamaDonatur(e.target.value)}
                      placeholder="e.g. Hamba Allah / PT Maju Jaya"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>
              )}

              {/* General Fields */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Nominal Transfer (Rp)</label>
                <input
                  type="number"
                  required
                  value={nominal || ''}
                  onChange={(e) => setNominal(Number(e.target.value))}
                  placeholder="Contoh: 150000"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Unggah Bukti Transfer (Screenshot/Foto)</label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className={`w-full bg-slate-50 border-2 border-dashed ${file ? 'border-green-400 bg-green-50' : 'border-slate-300'} rounded-xl px-4 py-6 text-center transition-colors`}>
                    {file ? (
                      <div className="text-green-600 font-bold text-sm flex items-center justify-center gap-2">
                        <Upload className="h-4 w-4" />
                        {file.name}
                      </div>
                    ) : (
                      <div className="text-slate-500 text-sm flex flex-col items-center gap-2">
                        <Upload className="h-6 w-6 text-slate-400" />
                        <span>Klik atau Drop foto di sini</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-red-600/20"
                >
                  {submitting ? 'Mengirim...' : 'Kirim Bukti Pembayaran'}
                </button>
                <button
                  type="button"
                  onClick={handleWA}
                  className="py-3.5 px-6 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span>Kirim via WA Saja</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
