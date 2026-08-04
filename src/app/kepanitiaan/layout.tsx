'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Lock, LogOut, LayoutDashboard, Calendar, DollarSign, Users, UserCheck, ShieldAlert, FileText, MonitorPlay, Menu, X, ArrowLeft, AlertCircle, Package } from 'lucide-react';
import { logAuditActivity } from '@/lib/logger';

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
          .select('id, nama, seksi, jabatan, level, pin_akses')
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

          // Fetch dynamic permissions for user's seksi
          const { data: sData } = await supabase
            .from('seksi')
            .select('akses_menu')
            .eq('nama', user.seksi)
            .maybeSingle();

          if (user.seksi === 'Inti') {
            user.akses_menu = 'dashboard,rundown,warga,keuangan,panitia,catatan,logs,proposal,backdrop,rapat,baksos';
          } else if (user.level === 'Anggota') {
            // Anggota hanya bisa membuka dashboard, catatan, profil
            if (user.seksi === 'Humas & Dana') {
              user.akses_menu = 'dashboard,catatan,panitia,baksos';
            } else {
              user.akses_menu = 'dashboard,catatan,panitia';
            }
          } else if (sData) {
            user.akses_menu = sData.akses_menu + (sData.akses_menu.includes('panitia') ? '' : ',panitia');
          } else {
            // Fallback
            user.akses_menu = 'dashboard,catatan,panitia';
          }

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

  // Access control interceptor
  useEffect(() => {
    if (isLoggedIn && loggedInUser && !loading) {
      const userAccess = loggedInUser.akses_menu || '';

      let pathKey = '';
      if (pathname === '/kepanitiaan') pathKey = 'dashboard';
      else if (pathname.startsWith('/kepanitiaan/rundown')) pathKey = 'rundown';
      else if (pathname.startsWith('/kepanitiaan/warga')) pathKey = 'warga';
      else if (pathname.startsWith('/kepanitiaan/keuangan')) pathKey = 'keuangan';
      else if (pathname.startsWith('/kepanitiaan/laporan')) pathKey = 'keuangan';
      else if (pathname.startsWith('/kepanitiaan/panitia')) pathKey = 'panitia';
      else if (pathname.startsWith('/kepanitiaan/catatan')) pathKey = 'catatan';
      else if (pathname.startsWith('/kepanitiaan/logs')) pathKey = 'logs';
      else if (pathname.startsWith('/kepanitiaan/rapat')) pathKey = 'rapat';

      if (pathKey && !userAccess.includes(pathKey) && pathKey !== 'panitia') {
        alert('Akses Ditolak: Anda tidak memiliki izin untuk membuka halaman ini.');
        router.push('/kepanitiaan');
      }
    }
  }, [pathname, isLoggedIn, loggedInUser, loading, router]);

  // Dynamically set page title in browser tab
  useEffect(() => {
    let pageTitle = 'Portal Panitia';
    if (pathname === '/kepanitiaan') pageTitle = 'Dashboard Panitia';
    else if (pathname.startsWith('/kepanitiaan/rundown')) pageTitle = 'Rundown & Acara';
    else if (pathname.startsWith('/kepanitiaan/warga')) pageTitle = 'Manajemen Warga';
    else if (pathname.startsWith('/kepanitiaan/keuangan')) pageTitle = 'Keuangan & Sponsor';
    else if (pathname.startsWith('/kepanitiaan/laporan')) pageTitle = 'Laporan & LPJ';
    else if (pathname.startsWith('/kepanitiaan/panitia')) pageTitle = 'Manajemen Panitia';
    else if (pathname.startsWith('/kepanitiaan/catatan')) pageTitle = 'Catatan Pribadi';
    else if (pathname.startsWith('/kepanitiaan/logs')) pageTitle = 'Audit Log';
    else if (pathname.startsWith('/kepanitiaan/rapat')) pageTitle = 'Manajemen Rapat';
    else if (pathname.startsWith('/kepanitiaan/baksos')) pageTitle = 'Bakti Sosial';
    else if (pathname.startsWith('/kepanitiaan/profil')) pageTitle = 'Profil Saya';

    document.title = `${pageTitle} - Aplikasi HUT RI ke-81 RT 12 Pelem Kidul`;
  }, [pathname]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!selectedPanitiaId || !pin) {
      setLoginError('Silakan pilih nama dan masukkan PIN Anda.');
      return;
    }

    try {
      const { data: matched, error } = await supabase
        .from('panitia')
        .select('id, nama, seksi, jabatan, level, pin_akses')
        .eq('id', selectedPanitiaId)
        .single();

      if (matched && matched.pin_akses === pin) {
        const sessionData: any = {
        id: matched.id,
        nama: matched.nama,
        seksi: matched.seksi,
        jabatan: matched.jabatan,
        level: matched.level || 'Anggota',
      };

      // Fetch dynamic permissions for matched seksi on login
      try {
        const searchName = matched.seksi === 'Inti' ? matched.jabatan : matched.seksi;
        
        const { data: sData } = await supabase
          .from('seksi')
          .select('akses_menu')
          .eq('nama', searchName)
          .maybeSingle();

        if (matched.jabatan === 'Ketua Panitia') {
          sessionData.akses_menu = 'dashboard,rundown,warga,keuangan,panitia,catatan,logs,proposal,backdrop,rapat,baksos';
        } else if (matched.level === 'Anggota') {
          // Anggota hanya bisa membuka dashboard, catatan, dan profil (kecuali Humas & Dana untuk Baksos)
          if (matched.seksi === 'Humas & Dana') {
            sessionData.akses_menu = 'dashboard,catatan,panitia,baksos';
          } else {
            sessionData.akses_menu = 'dashboard,catatan,panitia';
          }
        } else if (sData) {
          sessionData.akses_menu = sData.akses_menu + (sData.akses_menu.includes('panitia') ? '' : ',panitia');
        } else {
          sessionData.akses_menu = 'dashboard,catatan,panitia';
        }
      } catch (err) {
        console.error('Failed to load permissions during login:', err);
      }

      localStorage.setItem('session_panitia', JSON.stringify(sessionData));
      setLoggedInUser(sessionData);
      setIsLoggedIn(true);
      setPin('');
      setLoginError('');

      // Catat log audit login
      logAuditActivity('Login Sistem', 'Melakukan login ke portal panitia', sessionData);
    } else {
      setLoginError('PIN yang Anda masukkan salah.');
    }
    } catch (err) {
      console.error('Login error:', err);
      setLoginError('Terjadi kesalahan saat memverifikasi PIN.');
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
      <div className="flex-grow flex items-center justify-center bg-white text-slate-900 min-h-[70vh]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-red-500 border-r-2 mx-auto"></div>
          <p className="text-sm text-slate-500">Menyiapkan Akses Panitia...</p>
        </div>
      </div>
    );
  }

  // Render Login Form if not logged in
  if (!isLoggedIn) {
    return (
      <div className="flex-grow flex items-center justify-center bg-slate-50 px-4 py-20 min-h-[80vh] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-100 to-white pointer-events-none" />
        
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 backdrop-blur-md shadow-2xl relative z-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 mb-2">
              <Lock className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Login Panitia RT 12</h1>
            <p className="text-xs text-slate-500">Silakan pilih nama Anda dan masukkan PIN untuk mengakses dasbor.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">Pilih Nama Panitia</label>
              <select
                value={selectedPanitiaId}
                onChange={(e) => setSelectedPanitiaId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-red-500 transition-colors"
              >
                <option value="">-- Pilih Anggota --</option>

                {Object.keys(panitiaList.reduce((acc: any, p: any) => {
                  if (!acc[p.seksi]) acc[p.seksi] = [];
                  acc[p.seksi].push(p);
                  return acc;
                }, {})).sort((a: string, b: string) => {
                  const orderMap: Record<string, number> = { 'Pelindung': 1, 'Pembina': 1, 'Penasihat': 2, 'Inti': 3 };
                  const orderA = orderMap[a] || 99;
                  const orderB = orderMap[b] || 99;
                  if (orderA !== orderB) return orderA - orderB;
                  return a.localeCompare(b);
                }).map(seksi => {
                  const grouped = panitiaList.reduce((acc: any, p: any) => {
                    if (!acc[p.seksi]) acc[p.seksi] = [];
                    acc[p.seksi].push(p);
                    return acc;
                  }, {});
                  const members = grouped[seksi].sort((a: any, b: any) => a.nama.localeCompare(b.nama));
                  
                  let label = `Seksi ${seksi}`;
                  if (seksi === 'Inti') label = 'Panitia Inti';
                  if (seksi === 'Penasihat') label = 'Kelompok Penasihat';
                  if (seksi === 'Pelindung' || seksi === 'Pembina') label = 'Pembina / Pelindung';

                  return (
                    <optgroup key={seksi} label={label}>
                      {members.map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.nama}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">PIN Akses (4 Digit)</label>
              <input
                type="password"
                maxLength={4}
                pattern="[0-9]*"
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 tracking-widest text-center focus:outline-none focus:border-red-500 transition-colors"
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
            <Link href="/" className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-600 transition-colors">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              Kembali ke Portal Warga
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isInti = loggedInUser?.seksi === 'Inti';
  const userAccess = loggedInUser?.akses_menu || '';

  const menuGroups = [
    {
      group: 'Utama',
      items: [
        { name: 'Dashboard', href: '/kepanitiaan', icon: LayoutDashboard, key: 'dashboard' },
        { name: 'Audit Log Aktivitas', href: '/kepanitiaan/logs', icon: ShieldAlert, key: 'logs' },
      ]
    },
    {
      group: 'Manajemen Panitia & Rapat',
      items: [
        { name: isInti ? 'Manajemen Panitia' : 'Buku Kontak (WA)', href: '/kepanitiaan/panitia', icon: UserCheck, key: 'panitia' },
        { name: 'Manajemen Rapat', href: '/kepanitiaan/rapat', icon: FileText, key: 'rapat' },
        { name: 'Rundown & Acara', href: '/kepanitiaan/rundown', icon: Calendar, key: 'rundown' },
      ]
    },
    {
      group: 'Warga & Keuangan',
      items: [
        { name: 'Manajemen Warga', href: '/kepanitiaan/warga', icon: Users, key: 'warga' },
        { name: 'Bakti Sosial (Sembako)', href: '/kepanitiaan/baksos', icon: Package, key: 'baksos' },
        { name: 'Keuangan & Sponsor', href: '/kepanitiaan/keuangan', icon: DollarSign, key: 'keuangan' },
        { name: 'Laporan & LPJ', href: '/kepanitiaan/laporan', icon: FileText, key: 'keuangan' },
      ]
    }
  ];

  return (
    <div className="flex-grow flex flex-col md:flex-row min-h-[85vh] bg-slate-50 text-slate-900">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 shrink-0">
        {/* User Info Header */}
        <div className="p-6 border-b border-slate-200 bg-slate-50 space-y-0.5">
          <div className="text-xs text-red-400 font-bold tracking-wider uppercase">{loggedInUser?.seksi}</div>
          <div className="font-bold text-slate-900 text-base truncate">{loggedInUser?.nama}</div>
          <div className="text-[10px] text-slate-500 font-medium truncate pb-3">{loggedInUser?.jabatan}</div>
          <div className="space-y-2">
            <Link href="/kepanitiaan/profil" className="inline-flex items-center justify-center w-full px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm">
              <UserCheck className="h-3.5 w-3.5 mr-1.5" />
              Profil Saya
            </Link>
            {userAccess.includes('catatan') && (
              <Link href="/kepanitiaan/catatan" className="inline-flex items-center justify-center w-full px-3 py-1.5 bg-white border border-slate-200 hover:border-red-300 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-lg text-xs font-bold transition-all shadow-sm">
                <FileText className="h-3.5 w-3.5 mr-1.5" />
                Catatan Pribadi
              </Link>
            )}
            <Link href="/kepanitiaan/kontak" className="inline-flex items-center justify-center w-full px-3 py-1.5 bg-white border border-slate-200 hover:border-red-300 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-lg text-xs font-bold transition-all shadow-sm">
              <Users className="h-3.5 w-3.5 mr-1.5" />
              Susunan Panitia
            </Link>
          </div>
        </div>

        {/* Sidebar Menus */}
        <nav className="flex-grow p-4 space-y-4 overflow-y-auto">
          {menuGroups.map((group, idx) => {
            const visibleItems = group.items.filter(item => userAccess.includes(item.key) || item.key === 'panitia');
            if (visibleItems.length === 0) return null;
            return (
              <div key={idx} className="space-y-1">
                {idx > 0 && <div className="border-t border-slate-200 my-2 pt-2"></div>}
                {visibleItems.map(item => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-red-600 text-white shadow-md shadow-red-600/10 font-bold'
                          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                      }`}
                    >
                      <Icon className="h-4.5 w-4.5" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            );
          })}

          <div className="pt-6 border-t border-slate-200 my-4 space-y-1">
            {userAccess.includes('proposal') && (
              <Link
                href="/proposal/print"
                target="_blank"
                className="flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <FileText className="h-4.5 w-4.5 text-slate-500" />
                <span>Cetak Proposal PDF</span>
              </Link>
            )}
            {userAccess.includes('backdrop') && (
              <Link
                href="/backdrop"
                target="_blank"
                className="flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <MonitorPlay className="h-4.5 w-4.5 text-slate-500" />
                <span>Buka Layar Backdrop</span>
              </Link>
            )}
          </div>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-slate-200 mt-auto">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-white text-slate-700 border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all shadow-sm"
          >
            <LogOut className="h-4.5 w-4.5" />
            <span>Keluar Sesi</span>
          </button>
        </div>
      </aside>

      {/* Sidebar - Mobile Toggle & Drawer */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex justify-between items-center print:hidden">
        <div className="flex items-center space-x-2">
          <div className="bg-red-600 p-1 rounded-md text-white font-bold text-xs">P</div>
          <span className="font-extrabold text-sm text-slate-900 tracking-wide">PANITIA PORTAL</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-white flex flex-col pt-16">
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-4 right-4 p-2 border border-slate-850 rounded-lg"
          >
            <X className="h-6 w-6" />
          </button>
          
          <div className="p-6 border-b border-slate-200 text-center space-y-1">
            <div className="text-xs text-red-400 font-bold tracking-wider uppercase">{loggedInUser?.seksi}</div>
            <div className="font-bold text-slate-900 text-lg">{loggedInUser?.nama}</div>
            <div className="text-xs text-slate-500 font-medium pb-3">{loggedInUser?.jabatan}</div>
            <div className="space-y-2">
              <Link href="/kepanitiaan/profil" onClick={() => setSidebarOpen(false)} className="inline-flex items-center justify-center w-full px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-bold transition-all shadow-sm">
                <UserCheck className="h-4 w-4 mr-2" />
                Profil Saya
              </Link>
              {userAccess.includes('catatan') && (
                <Link href="/kepanitiaan/catatan" onClick={() => setSidebarOpen(false)} className="inline-flex items-center justify-center w-full px-4 py-2 bg-white border border-slate-200 hover:border-red-300 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-lg text-sm font-bold transition-all shadow-sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Catatan Pribadi
                </Link>
              )}
              <Link href="/kepanitiaan/kontak" onClick={() => setSidebarOpen(false)} className="inline-flex items-center justify-center w-full px-4 py-2 bg-white border border-slate-200 hover:border-red-300 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-lg text-sm font-bold transition-all shadow-sm">
                <Users className="h-4 w-4 mr-2" />
                Susunan Panitia
              </Link>
            </div>
          </div>

          <nav className="flex-grow p-6 space-y-4 overflow-y-auto">
            {menuGroups.map((group, idx) => {
              const visibleItems = group.items.filter(item => userAccess.includes(item.key) || item.key === 'panitia');
              if (visibleItems.length === 0) return null;
              return (
                <div key={idx} className="space-y-1">
                  {idx > 0 && <div className="border-t border-slate-200 my-2 pt-2"></div>}
                  {visibleItems.map(item => {
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
                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              );
            })}

            <div className="pt-6 border-t border-slate-200 my-4 space-y-2">
              {userAccess.includes('proposal') && (
                <Link
                  href="/proposal/print"
                  target="_blank"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center space-x-4 px-4 py-3 rounded-xl text-base font-bold text-slate-450 hover:bg-slate-100"
                >
                  <FileText className="h-5 w-5" />
                  <span>Cetak Proposal PDF</span>
                </Link>
              )}
              {userAccess.includes('backdrop') && (
                <Link
                  href="/backdrop"
                  target="_blank"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center space-x-4 px-4 py-3 rounded-xl text-base font-bold text-slate-450 hover:bg-slate-100"
                >
                  <MonitorPlay className="h-5 w-5" />
                  <span>Buka Layar Backdrop</span>
                </Link>
              )}
            </div>
          </nav>

          <div className="p-6 border-t border-slate-200">
            <button
              onClick={() => {
                setSidebarOpen(false);
                handleLogout();
              }}
              className="w-full py-3 flex items-center justify-center space-x-2 bg-white text-slate-700 font-bold border border-slate-200 rounded-xl hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all shadow-sm"
            >
              <LogOut className="h-4.5 w-4.5" />
              <span>Keluar Sesi</span>
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
