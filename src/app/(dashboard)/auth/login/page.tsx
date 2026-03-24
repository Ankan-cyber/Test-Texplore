'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, Shield } from 'lucide-react';

function getApiErrorMessage(payload: unknown): string {
  if (!payload || typeof payload !== 'object') {
    return 'Login failed';
  }

  const data = payload as {
    error?: string | { message?: string };
    message?: string;
  };

  if (typeof data.error === 'string' && data.error.trim()) {
    return data.error;
  }

  if (
    data.error &&
    typeof data.error === 'object' &&
    typeof data.error.message === 'string' &&
    data.error.message.trim()
  ) {
    return data.error.message;
  }

  if (typeof data.message === 'string' && data.message.trim()) {
    return data.message;
  }

  return 'Login failed';
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(getApiErrorMessage(data));
      }

      // Redirect to the user's first accessible admin route
      router.push(data.redirectTo || '/admin');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-4xl">
        <div className="bg-white rounded-xl md:rounded-2xl shadow-lg md:shadow-2xl overflow-hidden border border-gray-200">
          <div className="flex flex-col md:flex-row">
            {/* Left Side - Welcome Panel (Hidden on mobile, shown on desktop) */}
            <div className="hidden md:flex w-full md:w-1/2 bg-primary items-center justify-center p-8 text-white">
              <div className="text-center">
                <div className="mb-6">
                  <Shield className="h-16 w-16 mx-auto mb-4" />
                </div>
                <h1 className="text-3xl font-bold mb-4">
                  Welcome to Texplore Admin
                </h1>
                <p className="text-lg opacity-90 mb-6">
                  Manage your club&apos;s events, members, and content with our
                  powerful admin dashboard.
                </p>
                <div className="space-y-3 text-sm opacity-80">
                  <div className="flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                    Event Management
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                    Member Analytics
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                    Content Control
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile: Compact header */}
            <div className="md:hidden bg-primary text-white p-6 text-center">
              <Shield className="h-12 w-12 mx-auto mb-3" />
              <h1 className="text-xl font-bold mb-2">Texplore Admin</h1>
              <p className="text-sm opacity-90">
                Sign in to access the dashboard
              </p>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full md:w-1/2 p-5 md:p-8">
              <div className="mb-4 md:mb-6">
                <Link
                  href="/"
                  className="inline-flex items-center text-sm md:text-base text-gray-600 hover:text-primary transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Link>
              </div>

              <div className="mb-6 md:mb-8">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1 md:mb-2">
                  Admin Login
                </h2>
                <p className="text-sm md:text-base text-gray-600">
                  Sign in to access the admin dashboard
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                {error && (
                  <div className="p-3 md:p-4 text-xs md:text-sm text-red-600 bg-red-50 rounded-lg md:rounded-xl border border-red-200">
                    {error}
                  </div>
                )}

                <div className="space-y-1.5 md:space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-gray-700 text-xs md:text-sm font-medium"
                  >
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11 md:h-12 text-sm md:text-base border-2 border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 rounded-lg md:rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5 md:space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-gray-700 text-xs md:text-sm font-medium"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-11 md:h-12 text-sm md:text-base border-2 border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 rounded-lg md:rounded-xl"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 md:h-12 bg-primary hover:bg-primary/90 text-white text-sm md:text-base font-semibold rounded-lg md:rounded-xl"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
                <div className="text-xs md:text-sm text-center">
                  <Link
                    href="/auth/forgot-password"
                    className="text-primary hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
