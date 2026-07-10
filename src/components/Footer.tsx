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
    <footer className="bg-[#7F1D1D] border-t border-red-800/50 py-8 px-4 mt-auto print:hidden">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-red-700/50 rounded-lg border border-red-600/30">
            <Flag className="h-4 w-4 text-red-200" />
          </div>
          <div>
            <span className="font-bold text-white text-sm tracking-wide block">
              Panitia HUT RI Ke-81 RT 12 Pelem Kidul
            </span>
            <span className="text-red-200/70 text-[10px] font-medium">
              Pelem Kidul, Bantul, Yogyakarta · 2026
            </span>
          </div>
        </div>
        <div className="text-center md:text-right">
          <p className="text-red-100/80 text-xs font-medium">© 2026 RT 12 Pelem Kidul. Guyub Rukun Membangun Negeri.</p>
          <p className="text-red-200/50 text-[10px] mt-0.5">Dikembangkan oleh Ashvin Labs Indonesia untuk RT 12 Pelem Kidul</p>
        </div>
      </div>
    </footer>
  );
}
