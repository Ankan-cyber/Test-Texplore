'use client';
import React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') || '';

  const [newPassword, setNewPassword] = React.useState('');
  const [confirmNewPassword, setConfirmNewPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword, confirmNewPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');
      setMessage('Password reset successful. You can now log in.');
      setTimeout(() => router.push('/auth/login'), 1500);
    } catch (e: any) {
      setError(e.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-6 rounded-xl shadow border border-gray-200">
        <h1 className="text-2xl font-bold mb-2">Reset Password</h1>
        <p className="text-sm text-gray-600 mb-6">
          Enter your new password below.
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium mb-1"
            >
              New password
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
              minLength={8}
            />
          </div>
          <div>
            <label
              htmlFor="confirmNewPassword"
              className="block text-sm font-medium mb-1"
            >
              Confirm new password
            </label>
            <input
              id="confirmNewPassword"
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
              minLength={8}
            />
          </div>
          {message && <p className="text-sm text-green-600">{message}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-primary text-white rounded disabled:opacity-60"
          >
            {loading ? 'Updating...' : 'Reset Password'}
          </button>
        </form>
        <div className="mt-4 text-sm text-center">
          <Link href="/auth/login" className="text-primary hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
