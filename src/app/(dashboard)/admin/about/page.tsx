import { getCurrentUser } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, User } from 'lucide-react';
import AboutManagement from '@/components/AboutManagement';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminAboutPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Check permission
  const hasPermission =
    user.permissions?.includes('about:manage') ||
    user.permissions?.includes('*') ||
    user.role === 'admin' ||
    user.role === 'president';
  const canSelfEditAbout =
    user.permissions?.includes('about:self:update') ||
    user.permissions?.includes('*');

  if (!hasPermission) {
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
            <p>You do not have permission to manage About members.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">About Members</h1>
          <p className="text-sm text-gray-600">Manage leadership and department team members</p>
        </div>

        {canSelfEditAbout && (
          <Button asChild variant="outline">
            <Link href="/admin/about/my-profile">
              <User className="mr-2 h-4 w-4" />
              My About Profile
            </Link>
          </Button>
        )}
      </div>

      {canSelfEditAbout && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-gray-900">Edit your own public profile</p>
              <p className="text-sm text-gray-600">
                Update your photo, bio, links, and role shown on the About page.
              </p>
            </div>
            <Button asChild>
              <Link href="/admin/about/my-profile">Open My Profile</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Card>
        <CardContent className="p-0">
          <AboutManagement />
        </CardContent>
      </Card>
    </div>
  );
}
