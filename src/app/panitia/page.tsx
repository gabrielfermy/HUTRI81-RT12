'use client';

import { useState, useEffect } from 'react';
import { Users, Phone, ShieldCheck, Mail, ShieldAlert, Sparkles, MessageCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Member {
  nama: string;
  seksi: string;
  jabatan: string;
}

// Fallback mock committee data matching README.md
const mockCommittee: Member[] = [
  { nama: 'Gabriel Fermy Aswinta', seksi: 'Inti', jabatan: 'Ketua Panitia' },
  { nama: 'Mas Ikhsan', seksi: 'Inti', jabatan: 'Sekretaris' },
  { nama: 'Pak Tri', seksi: 'Inti', jabatan: 'Bendahara' },
  { nama: 'Pak Yudhi', seksi: 'Perlengkapan & Dekorasi', jabatan: 'Koordinator' },
  { nama: 'Pak Asbani', 'seksi': 'Perlengkapan & Dekorasi', jabatan: 'Anggota' },
  { nama: 'Pak Heribertus', seksi: 'Acara', jabatan: 'Koordinator Umum' },
  { nama: 'Bu Agus', seksi: 'Acara', jabatan: 'Koordinator Sesi Pagi' },
  { nama: '[TBD - Segera Diisi]', seksi: 'Acara', jabatan: 'Koordinator Sesi Sore' },
  { nama: 'Ibu Ketua Dasawisma', seksi: 'Konsumsi', jabatan: 'Koordinator' },
  { nama: 'Ibu Dasawisma 1', seksi: 'Konsumsi', jabatan: 'Anggota' },
  { nama: 'Ibu Dasawisma 2', seksi: 'Konsumsi', jabatan: 'Anggota' },
  { nama: '[TBD - Segera Diisi]', seksi: 'Humas & Dana', jabatan: 'Koordinator' },
  { nama: 'Humas Warga 1', seksi: 'Humas & Dana', jabatan: 'Anggota' },
  { nama: 'Humas Warga 2', seksi: 'Humas & Dana', jabatan: 'Anggota' },
  { nama: 'Pak Randy', seksi: 'Keamanan & Kebersihan', jabatan: 'Koordinator' },
  { nama: 'Pak Mardi', seksi: 'Dokumentasi', jabatan: 'Koordinator' },
];

export default function Panitia() {
  const [committee, setCommittee] = useState<Member[]>(mockCommittee);
  const [loading, setLoading] = useState(true);

  // Fetch committee from Supabase if available
  useEffect(() => {
    async function fetchCommittee() {
      try {
        const { data, error } = await supabase
          .from('panitia')
          .select('nama, seksi, jabatan')
          .order('seksi', { ascending: true });

        if (data && !error && data.length > 0) {
          setCommittee(data);
        }
      } catch (err) {
        console.warn('Using offline mock committee data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCommittee();
  }, []);

  // Group members by section (Seksi)
  const sections = committee.reduce((acc: { [key: string]: Member[] }, member) => {
    const seksi = member.seksi;
    if (!acc[seksi]) {
      acc[seksi] = [];
    }
    acc[seksi].push(member);
    return acc;
  }, {});

  // Define section ordering to put "Inti" first
  const sectionKeys = Object.keys(sections).sort((a, b) => {
    if (a === 'Inti') return -1;
    if (b === 'Inti') return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 w-full space-y-10 flex-grow">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center space-x-2 bg-red-600/10 border border-red-500/30 px-3 py-1 rounded-full text-red-400 text-xs sm:text-sm font-semibold uppercase tracking-wider">
          <Users className="h-4 w-4" />
          <span>Struktur Kepanitiaan RT 12</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Susunan Organisasi Panitia</h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
          Susunan panitia fungsional yang dibentuk secara lean & agile. Hubungi koordinator seksi masing-masing jika memiliki pertanyaan atau kendala.
        </p>
      </div>

      {/* Grid of Divisions */}
      <div className="space-y-12">
        {sectionKeys.map((sectionName) => (
          <div key={sectionName} className="space-y-6">
            <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <h2 className="text-xl sm:text-2xl font-bold tracking-wide text-white">
                {sectionName === 'Inti' ? 'Pengurus Inti' : `Seksi ${sectionName}`}
              </h2>
              <span className="text-xs font-semibold text-slate-500">
                ({sections[sectionName].length} orang)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sections[sectionName].map((member, index) => {
                const isTBD = member.nama.includes('TBD');
                return (
                  <div
                    key={index}
                    className={`relative rounded-2xl border p-5 transition-all duration-300 flex flex-col justify-between ${
                      sectionName === 'Inti'
                        ? 'bg-gradient-to-br from-[#1D3557]/40 to-slate-900/60 border-[#1D3557] hover:border-red-500/30'
                        : isTBD
                        ? 'bg-slate-950/20 border-dashed border-slate-800/80'
                        : 'bg-slate-900/30 border-slate-800/80 hover:border-red-500/20'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-md ${
                          member.jabatan.includes('Ketua') || member.jabatan.includes('Koordinator')
                            ? 'bg-red-600/10 text-red-400 border border-red-500/20'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {member.jabatan}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h4 className={`text-lg font-bold ${isTBD ? 'text-slate-500 italic' : 'text-white'}`}>
                          {member.nama}
                        </h4>
                        <p className="text-xs text-slate-400">
                          {sectionName === 'Inti' ? 'Pengurus Utama' : `Divisi ${sectionName}`}
                        </p>
                      </div>
                    </div>

                    {/* WhatsApp Contact Action */}
                    {!isTBD && (
                      <a
                        href={`https://wa.me/6281234567890?text=Halo%20${encodeURIComponent(
                          member.nama
                        )},%20saya%20warga%20RT%2012%20ingin%20bertanya%20mengenai%20persiapan%20HUT%20RI.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-6 flex items-center justify-center space-x-2 w-full py-2 bg-slate-900 hover:bg-red-600 border border-slate-800 hover:border-red-500 hover:shadow-lg hover:shadow-red-600/10 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all duration-300"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>Hubungi Via WhatsApp</span>
                      </a>
                    )}

                    {isTBD && (
                      <div className="mt-6 flex items-center justify-center space-x-2 w-full py-2 border border-dashed border-slate-800/80 text-slate-500 rounded-xl text-xs font-medium cursor-not-allowed">
                        <span>Menunggu Relawan</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Recruitment Callout Banner */}
      <div className="bg-gradient-to-r from-red-600/10 to-transparent border border-red-500/20 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between space-y-6 md:space-y-0 md:space-x-8">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center space-x-2 text-red-400 font-bold text-sm tracking-wide">
            <Sparkles className="h-4 w-4 animate-pulse" />
            <span>OPEN RECRUITMENT RELAWAN</span>
          </div>
          <h4 className="font-extrabold text-white text-lg">Tertarik bergabung menjadi panitia?</h4>
          <p className="text-slate-400 text-sm leading-relaxed">
            Kami masih membutuhkan koordinator/anggota untuk **Seksi Humas & Dana** serta **Seksi Acara Sore**. Jika Anda berminat membantu lingkungan RT 12, segera kabari Ketua Panitia via WhatsApp.
          </p>
        </div>
        <a
          href="https://wa.me/6281234567890?text=Halo%20Gabriel,%20saya%20berminat%20menjadi%20relawan%20panitia%20HUT%20RI%20RT%2012."
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm tracking-wide shadow-lg shadow-red-600/20 transition-all hover:scale-105 active:scale-95 flex items-center space-x-2"
        >
          <Phone className="h-4 w-4" />
          <span>Daftar Relawan</span>
        </a>
      </div>
    </div>
  );
}
