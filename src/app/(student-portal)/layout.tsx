import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Texplore Club',
  description: 'Tech Entrepreneurship & Innovation',
};

export default function StudentPortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <Header />
      {children}
      <Footer />
    </div>
  );
}
