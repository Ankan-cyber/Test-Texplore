import type { Metadata } from 'next';
import SidebarWrapper from '@/components/Sidebar/SidebarWrapper';
import SessionProvider from '@/components/SessionProvider';

export const metadata: Metadata = {
  title: 'Texplore Admin Portal',
  description: 'Admin Portal for Texplore Club',
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionProvider>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <SidebarWrapper />
        <main className="flex-1 overflow-auto">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </SessionProvider>
  );
}
