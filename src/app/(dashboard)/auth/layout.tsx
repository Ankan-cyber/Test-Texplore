import { getCurrentUser, getFirstAccessibleAdminRoute } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // If user is already logged in, redirect to their first accessible admin route
  if (user) {
    const firstAccessibleRoute = getFirstAccessibleAdminRoute(user);
    redirect(firstAccessibleRoute || '/admin');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
      {children}
    </div>
  );
}
