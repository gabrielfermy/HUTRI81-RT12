'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Lock, LogOut, LayoutDashboard, Calendar, DollarSign, Users, UserCheck, ShieldAlert, FileText, MonitorPlay, Menu, X, ArrowLeft, AlertCircle } from 'lucide-react';

export default function KepanitiaanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [panitiaList, setPanitiaList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Auth States
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedPanitiaId, setSelectedPanitiaId] = useState('');
  const [pin, setPin] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggedInUser, setLoggedInUser] = useState<any>(null);

  // Mobile sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load panitia and check local session
  useEffect(() => {
    async function initAuth() {
      try {
        // Fetch panitia list for login dropdown
        const { data, error } = await supabase
          .from('panitia')
          .select('id, nama, seksi, jabatan, pin_akses')
          .order('nama', { ascending: true });

        if (data && !error) {
          setPanitiaList(data);
        } else {
          // Offline fallbacks
          setPanitiaList([
            { id: '1', nama: 'Gabriel Fermy Aswinta', seksi: 'Inti', jabatan: 'Ketua Panitia', pin_akses: '1212' },
            { id: '2', nama: 'Mas Ikhsan', seksi: 'Inti', jabatan: 'Sekretaris', pin_akses: '1212' },
            { id: '3', nama: 'Pak Tri', seksi: 'Inti', jabatan: 'Bendahara', pin_akses: '1212' },
          ]);
        }

        // Check local session
        const storedSession = localStorage.getItem('session_panitia');
        if (storedSession) {
          const user = JSON.parse(storedSession);
          setLoggedInUser(user);
          setIsLoggedIn(true);
        }
      } catch (err) {
        console.error('Auth initialization failed:', err);
      } finally {
        setLoading(false);
      }
    }
    initAuth();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!selectedPanitiaId || !pin) {
      setLoginError('Silakan pilih nama dan masukkan PIN Anda.');
      return;
    }

    const matched = panitiaList.find((p) => p.id === selectedPanitiaId);
    if (matched && matched.pin_akses === pin) {
      const sessionData = {
        id: matched.id,
        nama: matched.nama,
        seksi: matched.seksi,
        jabatan: matched.jabatan,
      };
      localStorage.setItem('session_panitia', JSON.stringify(sessionData));
      setLoggedInUser(sessionData);
      setIsLoggedIn(true);
      setPin('');
      setLoginError('');
    } else {
      setLoginError('PIN yang Anda masukkan salah.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('session_panitia');
    setLoggedInUser(null);
    setIsLoggedIn(false);
    router.push('/kepanitiaan');
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center bg-slate-950 text-white min-h-[70vh]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-red-500 border-r-2 mx-auto"></div>
          <p className="text-sm text-slate-400">Menyiapkan Akses Panitia...</p>
        </div>
      </div>
    );
  }

  // Render Login Form if not logged in
  if (!isLoggedIn) {
    return (
      <div className="flex-grow flex items-center justify-center bg-[#070A13] px-4 py-20 min-h-[80vh] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-red-950/20 via-[#070A13] to-[#070A13] pointer-events-none" />
        
        <div className="w-full max-w-md bg-slate-900/60 border border-slate-800 rounded-2xl p-8 backdrop-blur-md shadow-2xl relative z-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 mb-2">
              <Lock className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Login Panitia RT 12</h1>
            <p className="text-xs text-slate-400">Silakan pilih nama Anda dan masukkan PIN untuk mengakses dasbor.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Pilih Nama Panitia</label>
              <select
                value={selectedPanitiaId}
                onChange={(e) => setSelectedPanitiaId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
              >
                <option value="">-- Pilih Anggota --</option>
                {panitiaList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nama} ({p.seksi})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">PIN Akses (4 Digit)</label>
              <input
                type="password"
                maxLength={4}
                pattern="[0-9]*"
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white tracking-widest text-center focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>

            {loginError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-red-600/20"
            >
              Masuk Dasbor
            </button>
          </form>

          <div className="text-center pt-2">
            <Link href="/" className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-300 transition-colors">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              Kembali ke Portal Warga
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isInti = loggedInUser?.seksi === 'Inti';

  const menuItems = [
    { name: 'Dashboard', href: '/kepanitiaan', icon: LayoutDashboard },
    { name: 'Rundown & Acara', href: '/kepanitiaan/rundown', icon: Calendar },
    { name: 'Manajemen Warga', href: '/kepanitiaan/warga', icon: Users },
    { name: 'Keuangan & Sponsor', href: '/kepanitiaan/keuangan', icon: DollarSign },
    { name: isInti ? 'Manajemen Panitia' : 'Profil Saya', href: '/kepanitiaan/panitia', icon: UserCheck },
    { name: 'Catatan Penting', href: '/kepanitiaan/catatan', icon: FileText },
    { name: 'Audit Log Aktivitas', href: '/kepanitiaan/logs', icon: ShieldAlert },
  ];

  return (
    <div className="flex-grow flex flex-col md:flex-row min-h-[85vh] bg-[#070A13] text-slate-100">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-950 border-r border-slate-800 shrink-0">
        {/* User Info Header */}
        <div className="p-6 border-b border-slate-900 bg-slate-900/10">
          <div className="text-xs text-red-400 font-bold tracking-wider uppercase">{loggedInUser?.seksi}</div>
          <div className="font-bold text-white text-base truncate">{loggedInUser?.nama}</div>
          <div className="text-[10px] text-slate-500 font-medium truncate">{loggedInUser?.jabatan}</div>
        </div>

        {/* Sidebar Menus */}
        <nav className="flex-grow p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/10 font-bold'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <Icon className="h-4.5 w-4.5" />
                <span>{item.name}</span>
              </Link>
            );
          })}

          <div className="pt-6 border-t border-slate-900/60 my-4 space-y-1">
            <Link
              href="/proposal/print"
              target="_blank"
              className="flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition-colors"
            >
              <FileText className="h-4.5 w-4.5 text-slate-500" />
              <span>Cetak Proposal PDF</span>
            </Link>
            <Link
              href="/backdrop"
              target="_blank"
              className="flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition-colors"
            >
              <MonitorPlay className="h-4.5 w-4.5 text-slate-500" />
              <span>Buka Layar Backdrop</span>
            </Link>
          </div>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-slate-900 mt-auto">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-slate-900/40 border border-slate-800 hover:bg-red-600 hover:border-red-600 hover:text-white transition-all"
          >
            <LogOut className="h-4.5 w-4.5" />
            <span>Keluar Sesi</span>
          </button>
        </div>
      </aside>

      {/* Sidebar - Mobile Toggle & Drawer */}
      <div className="md:hidden bg-slate-950 border-b border-slate-800 px-4 py-3 flex justify-between items-center print:hidden">
        <div className="flex items-center space-x-2">
          <div className="bg-red-600 p-1 rounded-md text-white font-bold text-xs">P</div>
          <span className="font-extrabold text-sm text-white tracking-wide">PANITIA PORTAL</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 border border-slate-800 rounded-lg text-slate-300 hover:text-white"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-950 flex flex-col pt-16">
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-4 right-4 p-2 border border-slate-850 rounded-lg"
          >
            <X className="h-6 w-6" />
          </button>
          
          <div className="p-6 border-b border-slate-900 text-center">
            <div className="text-xs text-red-400 font-bold tracking-wider uppercase">{loggedInUser?.seksi}</div>
            <div className="font-bold text-white text-lg">{loggedInUser?.nama}</div>
            <div className="text-xs text-slate-500 font-medium">{loggedInUser?.jabatan}</div>
          </div>

          <nav className="flex-grow p-6 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center space-x-4 px-4 py-3 rounded-xl text-base font-bold transition-all ${
                    isActive
                      ? 'bg-red-600 text-white'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            <div className="pt-6 border-t border-slate-900 my-4 space-y-2">
              <Link
                href="/proposal/print"
                target="_blank"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center space-x-4 px-4 py-3 rounded-xl text-base font-bold text-slate-450 hover:bg-slate-900"
              >
                <FileText className="h-5 w-5" />
                <span>Cetak Proposal PDF</span>
              </Link>
              <Link
                href="/backdrop"
                target="_blank"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center space-x-4 px-4 py-3 rounded-xl text-base font-bold text-slate-450 hover:bg-slate-900"
              >
                <MonitorPlay className="h-5 w-5" />
                <span>Buka Layar Backdrop</span>
              </Link>
            </div>
          </nav>

          <div className="p-6 border-t border-slate-900">
            <button
              onClick={() => {
                setSidebarOpen(false);
                handleLogout();
              }}
              className="w-full py-3 text-center bg-slate-900 text-slate-300 font-bold border border-slate-800 rounded-xl"
            >
              Keluar Sesi
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-grow p-4 sm:p-8 md:p-10 overflow-y-auto w-full">
        {children}
      </main>
      
    </div>
  );
}
