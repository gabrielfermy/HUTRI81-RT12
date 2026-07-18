import HomeClient from '@/components/HomeClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Susunan Panitia',
};

export default function Page() {
  return <HomeClient initialTab="panitia" />;
}
