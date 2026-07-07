'use client';

import { Flag } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();

  // Hide footer on print or backdrop page
  const isPrint = pathname.startsWith('/proposal/print');
  const isBackdrop = pathname.startsWith('/backdrop');
  if (isPrint || isBackdrop) {
    return null;
  }

  return (
    <footer className="bg-[#1D3557] border-t border-red-500/20 text-slate-400 py-8 px-4 mt-auto print:hidden">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
        <div className="flex items-center space-x-2">
          <Flag className="h-5 w-5 text-red-500" />
          <span className="font-semibold text-white tracking-wide">
            Panitia HUT RI Ke-81 RT 12 Pelem Kidul
          </span>
        </div>
        <div className="text-center md:text-right text-xs">
          <p>© 2026 RT 12 Pelem Kidul. Guyub Rukun Membangun Negeri.</p>
          <p className="text-slate-500 mt-1">Dikembangkan oleh Ashvin Labs Indonesia untuk RT 12 Pelem Kidul</p>
        </div>
      </div>
    </footer>
  );
}
