'use client';

import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

export default function ChangePasswordCard() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const form = e.currentTarget;
      const formData = new FormData(form);
      const body = {
        currentPassword: String(formData.get('currentPassword') || ''),
        newPassword: String(formData.get('newPassword') || ''),
        confirmNewPassword: String(formData.get('confirmNewPassword') || ''),
      };
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        // Extract specific error message from API response
        const errorMessage = data.error || 'Failed to change password';
        throw new Error(errorMessage);
      }
      setSuccess('Password updated successfully');
      form.reset();
    } catch (e: any) {
      setError(e.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>Update your account password</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="change-password-form"
          onSubmit={onSubmit}
          className="grid gap-4 max-w-lg"
        >
          <div className="grid gap-2">
            <label htmlFor="currentPassword" className="text-sm font-medium">
              Current password
            </label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              className="border rounded px-3 py-2"
              required
              minLength={6}
              autoComplete="current-password"
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="newPassword" className="text-sm font-medium">
              New password
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              className="border rounded px-3 py-2"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="confirmNewPassword" className="text-sm font-medium">
              Confirm new password
            </label>
            <input
              id="confirmNewPassword"
              name="confirmNewPassword"
              type="password"
              className="border rounded px-3 py-2"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary text-white rounded disabled:opacity-60"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
