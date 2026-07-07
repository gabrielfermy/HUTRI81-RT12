'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, Flag, Calendar, Users } from 'lucide-react';

const navItems = [
  { name: 'Portal Warga', href: '/', icon: Flag },
  { name: 'Akses Panitia', href: '/kepanitiaan', icon: Users },
  { name: 'Backdrop Panggung', href: '/backdrop', icon: Calendar },
];

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // If printing proposal or backdrop, hide Navbar entirely
  const isPrint = pathname.startsWith('/proposal/print');
  const isBackdrop = pathname.startsWith('/backdrop');
  if (isPrint || isBackdrop) {
    return null;
  }

  return (
    <nav className="sticky top-0 z-50 bg-[#1D3557]/95 backdrop-blur-md border-b border-red-500/20 text-white shadow-lg print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Title */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative p-1.5 bg-red-600 rounded-lg shadow-md group-hover:scale-105 transition-transform duration-200">
              <Flag className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold tracking-wider text-sm sm:text-base bg-gradient-to-r from-white via-red-200 to-red-400 bg-clip-text text-transparent">
                RT 12 PELEM KIDUL
              </span>
              <span className="text-[10px] text-red-300 font-medium tracking-widest uppercase">
                HUT RI KE-81
              </span>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    isActive
                      ? 'bg-red-600 text-white shadow-md shadow-red-600/30 font-bold scale-[1.02]'
                      : 'hover:bg-white/10 text-slate-200 hover:text-white'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white animate-pulse' : 'text-slate-400 group-hover:text-white'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 focus:outline-none transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-[#1D3557] border-t border-red-500/10">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-semibold transition-all ${
                    isActive
                      ? 'bg-red-600 text-white'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
