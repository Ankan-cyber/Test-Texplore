'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function DebugPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        console.log('🔍 Debug: Fetching user data...');
        const response = await fetch('/api/auth/me');
        console.log('🔍 Debug: Response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('🔍 Debug: User data:', data);
          setUser(data.user);
        } else {
          const errorData = await response.json();
          console.log('🔍 Debug: Error data:', errorData);
          setError(errorData.error || 'Failed to fetch user');
        }
      } catch (error) {
        console.error('🔍 Debug: Fetch error:', error);
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
            <CardDescription>Loading user data...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
            <CardDescription>Error occurred</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-red-600">
              <p>
                <strong>Error:</strong> {error}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
          <CardDescription>
            User authentication and permission data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">User Information</h3>
            <div className="space-y-2 text-sm">
              <p>
                <strong>ID:</strong> {user?.id}
              </p>
              <p>
                <strong>Name:</strong> {user?.name}
              </p>
              <p>
                <strong>Email:</strong> {user?.email}
              </p>
              <p>
                <strong>Status:</strong>{' '}
                <Badge variant="outline">{user?.status}</Badge>
              </p>
              <p>
                <strong>Role:</strong>{' '}
                <Badge variant="default" className="capitalize">
                  {user?.role?.replace('_', ' ')}
                </Badge>
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Permissions</h3>
            <div className="space-y-2">
              <p>
                <strong>Permission Count:</strong>{' '}
                {user?.permissions?.length || 0}
              </p>
              <div className="flex flex-wrap gap-2">
                {user?.permissions?.map((permission: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {permission}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Profile</h3>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Full Name:</strong>{' '}
                {user?.profile?.fullName || 'Not set'}
              </p>
              <p>
                <strong>Department:</strong>{' '}
                {user?.profile?.department || 'Not set'}
              </p>
              <p>
                <strong>Year:</strong> {user?.profile?.year || 'Not set'}
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Session Test</h3>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Refresh Page
              </button>
              <button
                onClick={async () => {
                  try {
                    await fetch('/api/auth/logout', { method: 'POST' });
                    window.location.href = '/auth/login';
                  } catch (error) {
                    console.error('Logout error:', error);
                  }
                }}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 ml-2"
              >
                Logout
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
