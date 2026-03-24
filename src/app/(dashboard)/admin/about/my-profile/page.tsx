import { getCurrentUser } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import AboutProfileEditor from '@/components/AboutProfileEditor';
import { redirect } from 'next/navigation';

export default async function MyAboutProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Check permission
  const hasPermission =
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
            <p>You do not have permission to edit About profile.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">My About Profile</h1>
        <p className="text-sm text-gray-600">Update your profile information displayed on the About page</p>
      </div>

      {/* Editor */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <AboutProfileEditor userId={user.id} />
        </CardContent>
      </Card>
    </div>
  );
}
