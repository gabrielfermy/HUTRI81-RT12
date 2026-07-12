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

      <PanitiaTab
        panitiaList={[]}
        seksiList={[]}
        currentUser={currentUser}

        onAddPanitia={async () => {}}
        onEditPanitia={async () => {}}
        onDeletePanitia={async () => {}}
        onResetPin={async () => {}}
        onUpdateOwnProfile={handleUpdateOwnProfile}
      />
    </div>
  );
}
