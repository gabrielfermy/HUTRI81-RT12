import { supabase } from './supabase';

export interface PanitiaInfo {
  id?: string;
  nama?: string;
}

export async function logAuditActivity(
  aksi: string, 
  detail: string, 
  panitiaInfo?: PanitiaInfo | null
) {
  try {
    let ipAddress = 'Unknown';
    let userAgent = 'Unknown';

    // Get User Agent (Client Side)
    if (typeof window !== 'undefined' && window.navigator) {
      userAgent = window.navigator.userAgent;
      
      // Try to get IP address
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        if (response.ok) {
          const data = await response.json();
          ipAddress = data.ip;
        }
      } catch (e) {
        console.warn('Gagal mengambil IP address', e);
      }
    }

    const payload = {
      panitia_id: panitiaInfo?.id || null,
      nama_panitia: panitiaInfo?.nama || 'Sistem / Publik',
      aksi,
      detail,
      ip_address: ipAddress,
      user_agent: userAgent
    };

    const { error } = await supabase.from('audit_log').insert([payload]);

    if (error) {
      console.error('Database logging failed:', error);
    }
  } catch (err) {
    console.error('Audit logging encountered an error:', err);
  }
}
