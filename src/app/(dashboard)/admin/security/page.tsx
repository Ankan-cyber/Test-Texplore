import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import SecurityLogsDashboard from '@/components/SecurityLogsDashboard';

export const metadata = {
  title: 'Security Logs · Texplore Admin',
};

export default async function SecurityLogsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Gate on `security:logs:read`. Admins have it by default; any user
  // assigned this permission (e.g., a future "security researcher")
  // will see this page without needing any other admin capability.
  const canView =
    hasPermission(user.permissions, 'security:logs:read') ||
    user.role === 'admin';

  if (!canView) {
    return (
      <div className="p-4 sm:p-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertCircle className="h-5 w-5" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent className="text-red-800">
            <p>
              You do not have permission to view security logs. Contact an
              administrator to request the{' '}
              <code className="font-mono">security:logs:read</code> permission.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <SecurityLogsDashboard />;
}
