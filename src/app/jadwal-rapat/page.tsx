import HomeClient from '@/components/HomeClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Jadwal Rapat',
};

export default function Page() {
  return <HomeClient initialTab="notulen" />;
}
