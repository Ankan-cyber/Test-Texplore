'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  startSessionMonitoring,
  stopSessionMonitoring,
  updateSessionActivity,
  logout as clientLogout,
} from '@/lib/client-session';

interface UseSessionOptions {
  autoStart?: boolean;
  timeoutMinutes?: number;
  warningMinutes?: number;
  checkIntervalSeconds?: number;
}

export function useSession(options: UseSessionOptions = {}) {
  const router = useRouter();
  const {
    autoStart = true,
    timeoutMinutes,
    warningMinutes,
    checkIntervalSeconds,
  } = options;

  // Start session monitoring
  const startMonitoring = useCallback(() => {
    startSessionMonitoring({
      timeoutMinutes,
      warningMinutes,
      checkIntervalSeconds,
    });
  }, [timeoutMinutes, warningMinutes, checkIntervalSeconds]);

  // Stop session monitoring
  const stopMonitoring = useCallback(() => {
    stopSessionMonitoring();
  }, []);

  // Update session activity
  const updateActivity = useCallback(() => {
    updateSessionActivity();
  }, []);

  // Manual logout
  const logout = useCallback(async () => {
    stopMonitoring();
    await clientLogout();
    router.push('/auth/login');
  }, [router, stopMonitoring]);

  // Auto-start monitoring on mount
  useEffect(() => {
    if (autoStart) {
      startMonitoring();
    }

    // Cleanup on unmount
    return () => {
      stopMonitoring();
    };
  }, [autoStart, startMonitoring, stopMonitoring]);

  return {
    startMonitoring,
    stopMonitoring,
    updateActivity,
    logout,
  };
}
