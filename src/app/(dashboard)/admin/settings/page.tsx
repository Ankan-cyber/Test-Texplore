import React from 'react';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getAccessibleFeatures } from '@/lib/permissions';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { Settings } from 'lucide-react';
import ChangePasswordCard from '@/components/ChangePasswordCard';

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login');

  const features = getAccessibleFeatures(user);
  if (!features.websiteSettings) {
    redirect('/admin/unauthorized');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          System Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Configure club system preferences and options.
        </p>
      </div>
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <Settings className="h-5 w-5" /> Settings Overview
          </CardTitle>
          <CardDescription>
            Manage system configuration and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              Settings available
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Website settings and configuration options will appear here.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <ChangePasswordCard />
    </div>
  );
}
