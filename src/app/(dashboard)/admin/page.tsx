import React from 'react';
import {
  canAccessAdmin,
  getCurrentUser,
  getFirstAccessibleAdminRoute,
} from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardContent from '@/components/Dashboard/DashboardContent';

export default async function AdminDashboard() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Check if user can access admin dashboard
  if (!canAccessAdmin(user)) {
    // Instead of redirecting to unauthorized, check if they have access to any admin features
    const firstAccessibleRoute = getFirstAccessibleAdminRoute(user);

    if (firstAccessibleRoute && firstAccessibleRoute !== '/admin') {
      // Redirect to their first accessible admin route
      redirect(firstAccessibleRoute);
    } else if (!firstAccessibleRoute) {
      // Only redirect to unauthorized if they have no admin access at all
      redirect('/admin/unauthorized');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Welcome back, {user.profile?.fullName || user.name}!
        </p>
      </div>

      <DashboardContent />
    </div>
  );
}
