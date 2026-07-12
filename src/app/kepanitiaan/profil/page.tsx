'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { PanitiaTab } from '@/components/panitia/PanitiaTab';
import { logAuditActivity } from '@/lib/logger';

export default function ProfilPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userSession = localStorage.getItem('session_panitia');
    if (userSession) {
      setCurrentUser(JSON.parse(userSession));
    }
    setLoading(false);
  }, []);

  const handleUpdateOwnProfile = async (nama: string, pin?: string, oldPin?: string, noWa?: string) => {
    if (pin) {
      if (!oldPin) throw new Error('Anda harus memasukkan PIN lama untuk mengganti PIN.');
      const { data: userData } = await supabase.from('panitia').select('pin_akses').eq('id', currentUser.id).single();
      if (userData?.pin_akses !== oldPin) {
        throw new Error('PIN lama yang Anda masukkan salah.');
      }
    }

    const payload: any = { nama };
    if (pin) payload.pin_akses = pin;
    if (noWa !== undefined) payload.no_wa = noWa;

    const { error } = await supabase.from('panitia').update(payload).eq('id', currentUser.id);

    if (!error) {
      const updatedSession = { ...currentUser, nama, no_wa: noWa };
      localStorage.setItem('session_panitia', JSON.stringify(updatedSession));
      setCurrentUser(updatedSession);
      await logAuditActivity(
        'Mengedit Profil Mandiri',
        `Mengubah profil mandiri: ${nama} ${pin ? '(dengan perubahan PIN)' : ''}`,
        updatedSession
      );
    } else {
      throw new Error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-red-500 border-r-2 mx-auto"></div>
          <p className="text-xs text-slate-500">Memuat Data Profil...</p>
        </div>
      </div>
    );
  }

  // Render the PanitiaTab strictly in Profile Mode (so Inti members also see the profile)
  // We use dummy handlers for management functions since they are not used in profile mode.
  return (
    <div className="space-y-8">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900">
          Profil & Keamanan Saya
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Perbarui nama lengkap dan PIN keamanan 4 digit rahasia Anda secara mandiri.
        </p>
      </div>

      <div className="max-w-2xl bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <form onSubmit={async (e) => {
          e.preventDefault();
          const btn = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement;
          const originalText = btn.innerText;
          btn.disabled = true;
          btn.innerText = 'Menyimpan...';

          const form = e.target as HTMLFormElement;
          const nama = (form.elements.namedItem('nama') as HTMLInputElement).value;
          const noWa = (form.elements.namedItem('noWa') as HTMLInputElement).value;
          const oldPin = (form.elements.namedItem('oldPin') as HTMLInputElement).value;
          const newPin = (form.elements.namedItem('newPin') as HTMLInputElement).value;
          const confirmPin = (form.elements.namedItem('confirmPin') as HTMLInputElement).value;

          try {
            if (newPin) {
              if (newPin.length !== 4 || !/^\d+$/.test(newPin)) throw new Error('PIN baru harus 4 digit angka.');
              if (newPin !== confirmPin) throw new Error('Konfirmasi PIN tidak cocok.');
            }
            await handleUpdateOwnProfile(nama.trim(), newPin || undefined, oldPin || undefined, noWa.trim());
            alert('Profil berhasil diperbarui!');
            if (newPin) {
              (form.elements.namedItem('oldPin') as HTMLInputElement).value = '';
              (form.elements.namedItem('newPin') as HTMLInputElement).value = '';
              (form.elements.namedItem('confirmPin') as HTMLInputElement).value = '';
            }
          } catch (err: any) {
            alert(err.message || 'Terjadi kesalahan saat memperbarui profil.');
          } finally {
            btn.disabled = false;
            btn.innerText = originalText;
          }
        }} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Informasi Dasar</h3>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Lengkap</label>
              <input type="text" name="nama" defaultValue={currentUser?.nama} required
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-red-400 font-semibold" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Nomor WhatsApp</label>
              <input type="text" name="noWa" defaultValue={currentUser?.no_wa} placeholder="08xxxxxxxxxx"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-red-400" />
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Ganti PIN Keamanan <span className="text-slate-400 font-normal">(Opsional)</span></h3>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase">PIN Lama</label>
              <input type="password" name="oldPin" maxLength={4} placeholder="Masukkan PIN saat ini"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-400 font-mono tracking-widest" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">PIN Baru (4 Digit)</label>
                <input type="password" name="newPin" maxLength={4} placeholder="PIN Baru"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-400 font-mono tracking-widest" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Konfirmasi PIN Baru</label>
                <input type="password" name="confirmPin" maxLength={4} placeholder="Ulangi PIN Baru"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-400 font-mono tracking-widest" />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button type="submit" className="w-full sm:w-auto px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl transition-all shadow-sm">
              Simpan Profil Saya
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
