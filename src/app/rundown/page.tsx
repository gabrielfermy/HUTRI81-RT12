'use client';

import { useState, useEffect } from 'react';
import { Clock, MapPin, Coffee, Users, Calendar, Award } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Fallback mock rundown details matching rundown.md
const mockMainRundown = [
  { tanggal: 'Minggu, 9 Agustus 2026 (Sesi 1: Pagi)', waktu: '06.00 - 07.30', durasi: 90, kegiatan: 'Senam Kemerdekaan', keterangan: 'Diikuti seluruh warga RT 12', konsumsi: 'Air Mineral Gelas' },
  { tanggal: 'Minggu, 9 Agustus 2026 (Sesi 1: Pagi)', waktu: '07.30 - 10.30', durasi: 180, kegiatan: 'Lomba Anak & Dewasa', keterangan: 'Sesi paralel di Area 1 & Area 2', konsumsi: 'Snack / Bubur Kacang Ijo' },
  { tanggal: 'Minggu, 16 Agustus 2026 (Sesi 2: Malam Puncak)', waktu: '19.30 - 20.00', durasi: 30, kegiatan: 'Kirab Kemerdekaan', keterangan: 'Rute keliling RT 12 dengan lampion & obor', konsumsi: '-' },
  { tanggal: 'Minggu, 16 Agustus 2026 (Sesi 2: Malam Puncak)', waktu: '20.00 - 20.45', durasi: 45, kegiatan: 'Tirakatan, Doa & Makan Soto', keterangan: 'Makan bersama soto ayam & doa syukur kemerdekaan', konsumsi: 'Soto Ayam (Vendor 200 Pax)' },
  { tanggal: 'Minggu, 16 Agustus 2026 (Sesi 2: Malam Puncak)', waktu: '20.45 - 22.30', durasi: 105, kegiatan: 'Pentas Seni & Pembagian Hadiah', keterangan: 'Panggung gembira penampilan warga & penyerahan piala pemenang lomba', konsumsi: 'Teh Hangat' },
];

const mockLombaAnak = [
  { nomor: 1, nama: 'Memasukkan Bola', durasi: 45, detail: 'Gelas di pinggang', deskripsi: 'Memasukkan bola ke wadah dengan gelas di pinggang secara berkelompok.' },
  { nomor: 2, nama: 'Pensil ke Botol', durasi: 45, detail: 'Tali corong', deskripsi: 'Ketangkasan memasukkan pensil ke botol menggunakan tali yang dikaitkan ke corong di kepala.' },
  { nomor: 3, nama: 'Makan Kerupuk', durasi: 45, detail: 'Kecepatan', deskripsi: 'Lomba klasik menguji kecepatan menghabiskan kerupuk gantung tanpa menggunakan tangan.' },
  { nomor: 4, nama: 'Balap Karung', durasi: 45, detail: 'Dengan helm', deskripsi: 'Balap karung menggunakan helm pengaman untuk menjamin keamanan peserta.' },
];

const mockLombaDewasa = [
  { nomor: 1, nama: 'Memaku Paku (Estafet)', durasi: 60, detail: 'Kerja sama tim', deskripsi: 'Kerja sama kelompok memaku kayu secara estafet dengan cepat dan akurat.' },
  { nomor: 2, nama: 'Menarik Kaleng', durasi: 60, detail: 'Kekuatan & Keseimbangan', deskripsi: 'Menarik kaleng yang diikatkan di pinggang dari arah berlawanan untuk menguji kekuatan fisik.' },
  { nomor: 3, nama: 'Tebak Gaya/Logika', durasi: 60, detail: 'Hiburan & Kompak', deskripsi: 'Menguji kekompakan dan nalar tim untuk menebak instruksi gaya atau teka-teki.' },
];

export default function Rundown() {
  const [activeTab, setActiveTab] = useState<'main' | 'kids' | 'adults'>('main');
  const [mainRundown, setMainRundown] = useState(mockMainRundown);
  const [loading, setLoading] = useState(true);

  // Fetch rundown from Supabase if available
  useEffect(() => {
    async function fetchRundown() {
      try {
        const { data, error } = await supabase
          .from('rundown')
          .select('*')
          .order('sort_order', { ascending: true });

        if (data && !error && data.length > 0) {
          // Map to match mock layout with tanggal grouping
          const mapped = data.map((d: any) => {
            const isAug9 = d.waktu.startsWith('06') || d.waktu.startsWith('07');
            return {
              tanggal: isAug9 ? 'Minggu, 9 Agustus 2026 (Sesi 1: Pagi)' : 'Minggu, 16 Agustus 2026 (Sesi 2: Malam Puncak)',
              waktu: d.waktu,
              durasi: d.durasi,
              kegiatan: d.kegiatan,
              keterangan: d.keterangan || '',
              konsumsi: d.kegiatan.includes('Soto') ? 'Soto Ayam (Vendor 200 Pax)' : (d.kegiatan.includes('Senam') ? 'Air Mineral Gelas' : '-')
            };
          });
          setMainRundown(mapped);
        }
      } catch (err) {
        console.warn('Using offline mock rundown data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchRundown();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 w-full space-y-10 flex-grow">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center space-x-2 bg-red-600/10 border border-red-500/30 px-3 py-1 rounded-full text-red-400 text-xs sm:text-sm font-semibold uppercase tracking-wider">
          <Calendar className="h-4 w-4" />
          <span>Agenda & Jadwal Kegiatan</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Jadwal Rangkaian Acara</h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
          Berikut adalah jadwal lengkap rangkaian kegiatan HUT RI Ke-81 yang terbagi menjadi Sesi 1 (9 Agustus) dan Sesi 2 (16 Agustus). Gunakan tab di bawah ini untuk melihat detail perlombaan.
        </p>
      </div>

      {/* Interactive Tabs */}
      <div className="flex justify-center p-1 bg-slate-900 border border-slate-800 rounded-xl max-w-md mx-auto">
        <button
          onClick={() => setActiveTab('main')}
          className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-all duration-200 ${
            activeTab === 'main'
              ? 'bg-red-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          Jadwal Utama
        </button>
        <button
          onClick={() => setActiveTab('kids')}
          className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-all duration-200 ${
            activeTab === 'kids'
              ? 'bg-red-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          Lomba Anak
        </button>
        <button
          onClick={() => setActiveTab('adults')}
          className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-all duration-200 ${
            activeTab === 'adults'
              ? 'bg-red-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          Lomba Dewasa
        </button>
      </div>

      {/* Content Container */}
      <div className="bg-slate-900/20 border border-slate-800 rounded-2xl p-6 sm:p-8">
        {activeTab === 'main' && (
          <div className="space-y-12">
            {/* Group mainRundown by tanggal */}
            {Array.from(new Set(mainRundown.map(item => item.tanggal))).map((tanggal) => {
              const itemsForDay = mainRundown.filter(item => item.tanggal === tanggal);
              return (
                <div key={tanggal} className="space-y-6">
                  <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                    <Calendar className="h-5 w-5 text-red-500" />
                    <h2 className="text-lg font-bold text-white tracking-wide">{tanggal}</h2>
                  </div>
                  
                  <div className="relative border-l border-red-500/30 ml-4 md:ml-32 space-y-8">
                    {itemsForDay.map((item, index) => (
                      <div key={index} className="relative pl-6 sm:pl-8 group">
                        {/* Timeline node */}
                        <div className="absolute -left-[9px] top-1.5 h-4 w-4 rounded-full border-2 border-red-500 bg-slate-900 group-hover:scale-125 transition-transform" />

                        {/* Left Timestamp for desktop view */}
                        <div className="hidden md:block absolute -left-32 top-0.5 w-24 text-right">
                          <span className="font-extrabold text-white text-sm tracking-wide">{item.waktu}</span>
                          <span className="block text-[10px] text-red-400 font-bold uppercase tracking-wider mt-0.5">{item.durasi} Menit</span>
                        </div>

                        {/* Main Card */}
                        <div className="bg-slate-900/50 hover:bg-slate-900/80 border border-slate-800/60 rounded-xl p-5 space-y-3 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-1 sm:space-y-0">
                            <h3 className="text-lg font-bold text-white group-hover:text-red-400 transition-colors">
                              {item.kegiatan}
                            </h3>
                            {/* Timestamp for mobile view */}
                            <div className="md:hidden flex items-center space-x-2 text-xs font-bold text-red-400">
                              <Clock className="h-3.5 w-3.5" />
                              <span>{item.waktu} ({item.durasi} menit)</span>
                            </div>
                          </div>

                          <p className="text-slate-400 text-sm leading-relaxed">{item.keterangan}</p>

                          {item.konsumsi !== '-' && (
                            <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md w-fit">
                              <Coffee className="h-3.5 w-3.5" />
                              <span>Fokus Konsumsi: {item.konsumsi}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'kids' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mockLombaAnak.map((lomba) => (
              <div key={lomba.nomor} className="bg-slate-900/40 border border-slate-800 hover:border-red-500/30 rounded-xl p-6 space-y-4 transition-all flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold text-red-400 tracking-wider uppercase bg-red-600/10 border border-red-500/20 px-2.5 py-0.5 rounded-full">
                      Lomba {lomba.nomor}
                    </span>
                    <span className="flex items-center text-xs font-bold text-slate-400">
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      {lomba.durasi} Menit
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white">{lomba.nama}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{lomba.deskripsi}</p>
                </div>
                <div className="flex items-center space-x-2 text-xs font-semibold text-red-300 mt-4">
                  <MapPin className="h-3.5 w-3.5 text-red-500" />
                  <span>Area Lomba: Area 1 (Lapangan/Depan Pos)</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'adults' && (
          <div className="grid grid-cols-1 gap-6">
            {mockLombaDewasa.map((lomba) => (
              <div key={lomba.nomor} className="bg-slate-900/40 border border-slate-800 hover:border-red-500/30 rounded-xl p-6 space-y-4 transition-all flex flex-col md:flex-row md:items-center justify-between">
                <div className="space-y-2 md:max-w-2xl">
                  <div className="flex items-center space-x-4">
                    <span className="text-xs font-extrabold text-red-400 tracking-wider uppercase bg-red-600/10 border border-red-500/20 px-2.5 py-0.5 rounded-full">
                      Lomba {lomba.nomor}
                    </span>
                    <span className="flex items-center text-xs font-bold text-slate-400">
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      {lomba.durasi} Menit
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white">{lomba.nama}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{lomba.deskripsi}</p>
                </div>
                <div className="flex flex-col space-y-2 md:items-end justify-center mt-4 md:mt-0">
                  <span className="flex items-center text-xs font-semibold text-red-300">
                    <Users className="h-3.5 w-3.5 mr-1.5 text-red-500" />
                    Kategori: {lomba.detail}
                  </span>
                  <span className="flex items-center text-xs font-semibold text-slate-400">
                    <MapPin className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                    Area Lomba: Area 2 (Halaman Balai RT)
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Acara Info Banner */}
      <div className="bg-gradient-to-r from-red-600/10 to-transparent border border-red-500/20 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
        <div className="p-3 bg-red-600 rounded-xl shadow-lg">
          <Award className="h-6 w-6 text-white" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-white">Catatan Penting Untuk Peserta & Panitia</h4>
          <p className="text-slate-400 text-sm leading-relaxed">
            Semua alat peraga wajib siap di area lomba pada pukul 07.00 WIB. Lomba akan dilaksanakan secara paralel antara Kategori Anak (Area 1) dan Kategori Dewasa (Area 2). Mohon datang tepat waktu!
          </p>
        </div>
      </div>
    </div>
  );
}
