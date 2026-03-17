'use client';

import { useEffect } from 'react';
import { useSession } from '@/hooks/useSession';

interface SessionProviderProps {
  children: React.ReactNode;
  timeoutMinutes?: number;
  warningMinutes?: number;
  checkIntervalSeconds?: number;
}

export default function SessionProvider({
  children,
  timeoutMinutes,
  warningMinutes,
  checkIntervalSeconds,
}: SessionProviderProps) {
  const { startMonitoring, stopMonitoring } = useSession({
    autoStart: true,
    timeoutMinutes,
    warningMinutes,
    checkIntervalSeconds,
  });

  useEffect(() => {
    // Start session monitoring when component mounts
    startMonitoring();

    // Cleanup when component unmounts
    return () => {
      stopMonitoring();
    };
  }, [startMonitoring, stopMonitoring]);

  return <>{children}</>;
}
