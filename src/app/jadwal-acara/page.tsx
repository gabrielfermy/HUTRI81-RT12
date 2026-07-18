import HomeClient from '@/components/HomeClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Jadwal Acara',
};

export default function Page() {
  return <HomeClient initialTab="jadwal" />;
}
