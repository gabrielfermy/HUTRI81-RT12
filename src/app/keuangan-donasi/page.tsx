import HomeClient from '@/components/HomeClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Keuangan & Donasi',
};

export default function Page() {
  return <HomeClient initialTab="keuangan" />;
}
