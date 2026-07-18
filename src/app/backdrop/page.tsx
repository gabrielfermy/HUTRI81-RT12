'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function BackdropPage() {
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadSponsors() {
    try {
      const { data, error } = await supabase
        .from('sponsorship')
        .select('*')
        .order('nominal', { ascending: false });

      if (data && !error) {
        setSponsors(data);
      } else {
        setSponsors([
          { nama: 'Toko Kelontong Bu Sri', tipe: 'Platinum' },
          { nama: 'Apotek Sehat Abadi', tipe: 'Gold' },
          { nama: 'Susu Segar Pelem', tipe: 'Silver' },
          { nama: 'Warteg Pelem Kidul', tipe: 'Silver' },
          { nama: 'Donatur Hamba Allah', tipe: 'Donatur Warga' },
          { nama: 'Nescafe', tipe: 'Silver' },
        ]);
      }
    } catch (err) {
      console.error('Error loading sponsors for backdrop:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSponsors();

    const channel = supabase
      .channel('backdrop-sponsor-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sponsorship' }, () => {
        loadSponsors();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter out the main Platinum sponsor if it is already printed in the center (e.g. Honda)
  // Usually we display all other sponsors in the 12 boxes
  const bottomSponsors = sponsors
    .filter(s => s.nama.toLowerCase() !== 'honda')
    .slice(0, 12);

  // Helper to map sponsor name to logo image path if we want to support logo image overlay
  const getSponsorLogo = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('nescafe')) return '/images/logos/nescafe.png';
    if (lowerName.includes('honda')) return '/images/logos/honda.png';
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-0 m-0 overflow-hidden font-sans">
      {/* Main Backdrop Canvas with 5:3 Aspect Ratio (Mathematically sized to prevent cropping/stretching) */}
      <div 
        className="relative w-[100vw] h-[60vw] max-h-[100vh] max-w-[166.67vh] bg-contain bg-no-repeat bg-center shadow-2xl select-none"
        style={{ 
          backgroundImage: "url('/backdrop_bg.png')",
          containerType: 'inline-size'
        }}
      >
        
        {/* Grid Overlay for the 12 Sponsor Boxes at the Bottom (Exactly aligned to backdrop image template) */}
        <div className="absolute left-[6.8%] right-[6.8%] top-[76.8%] bottom-[5.5%] grid grid-cols-6 grid-rows-2 gap-x-[1.8%] gap-y-[6%]">
          {Array.from({ length: 12 }).map((_, index) => {
            const sponsor = bottomSponsors[index];
            if (!sponsor) return <div key={index} className="flex items-center justify-center" />;
            
            const logoPath = getSponsorLogo(sponsor.nama);

            return (
              <div key={index} className="flex items-center justify-center p-1 overflow-hidden text-center">
                {logoPath ? (
                  <img 
                    src={logoPath} 
                    alt={sponsor.nama} 
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <span 
                    className="font-extrabold text-slate-800 uppercase tracking-wide leading-tight select-none break-words"
                    style={{ fontSize: '2.1cqw' }}
                  >
                    {sponsor.nama}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
