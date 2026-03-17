// Client-side session management utilities

export interface SessionTimeoutConfig {
  timeoutMinutes: number;
  warningMinutes: number;
  checkIntervalSeconds: number;
}

// Default configuration
const DEFAULT_CONFIG: SessionTimeoutConfig = {
  timeoutMinutes: parseInt(
    process.env.NEXT_PUBLIC_SESSION_TIMEOUT_MINUTES || '60',
  ),
  warningMinutes: parseInt(
    process.env.NEXT_PUBLIC_SESSION_WARNING_MINUTES || '5',
  ),
  checkIntervalSeconds: parseInt(
    process.env.NEXT_PUBLIC_SESSION_CHECK_INTERVAL || '30',
  ),
};

class SessionManager {
  private config: SessionTimeoutConfig;
  private checkInterval: NodeJS.Timeout | null = null;
  private warningTimeout: NodeJS.Timeout | null = null;
  private logoutTimeout: NodeJS.Timeout | null = null;
  private lastActivity: number = Date.now();
  private isWarningShown: boolean = false;

  constructor(config: Partial<SessionTimeoutConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.setupActivityListeners();
  }

  /**
   * Start session monitoring
   */
  start(): void {
    this.lastActivity = Date.now();
    this.isWarningShown = false;

    // Clear any existing intervals
    this.stop();

    // Start checking session status
    this.checkInterval = setInterval(() => {
      this.checkSessionStatus();
    }, this.config.checkIntervalSeconds * 1000);
  }

  /**
   * Stop session monitoring
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    if (this.warningTimeout) {
      clearTimeout(this.warningTimeout);
      this.warningTimeout = null;
    }

    if (this.logoutTimeout) {
      clearTimeout(this.logoutTimeout);
      this.logoutTimeout = null;
    }
  }

  /**
   * Update last activity timestamp
   */
  updateActivity(): void {
    this.lastActivity = Date.now();

    // Reset warning if it was shown
    if (this.isWarningShown) {
      this.isWarningShown = false;
      if (this.warningTimeout) {
        clearTimeout(this.warningTimeout);
        this.warningTimeout = null;
      }
      if (this.logoutTimeout) {
        clearTimeout(this.logoutTimeout);
        this.logoutTimeout = null;
      }
    }
  }

  /**
   * Check session status and handle timeouts
   */
  private checkSessionStatus(): void {
    const now = Date.now();
    const inactiveTime = now - this.lastActivity;
    const inactiveMinutes = inactiveTime / (1000 * 60);

    // Check if warning should be shown
    if (
      !this.isWarningShown &&
      inactiveMinutes >= this.config.timeoutMinutes - this.config.warningMinutes
    ) {
      this.showWarning();
    }

    // Check if session should be expired
    if (inactiveMinutes >= this.config.timeoutMinutes) {
      this.logout();
    }
  }

  /**
   * Show session timeout warning
   */
  private showWarning(): void {
    this.isWarningShown = true;

    // Show warning dialog
    const shouldExtend = window.confirm(
      `Your session will expire in ${this.config.warningMinutes} minutes due to inactivity. Would you like to extend your session?`,
    );

    if (shouldExtend) {
      this.extendSession();
    } else {
      this.logout();
    }
  }

  /**
   * Extend session by calling the API
   */
  private async extendSession(): Promise<void> {
    try {
      const response = await fetch('/api/auth/update-session', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        this.updateActivity();
        console.log('Session extended successfully');
      } else {
        this.logout();
      }
    } catch (error) {
      console.error('Failed to extend session:', error);
      this.logout();
    }
  }

  /**
   * Logout user
   */
  private async logout(): Promise<void> {
    try {
      // Call logout API
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Redirect to login page
      window.location.href = '/auth/login';
    }
  }

  /**
   * Setup activity listeners
   */
  private setupActivityListeners(): void {
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    events.forEach((event) => {
      document.addEventListener(
        event,
        () => {
          this.updateActivity();
        },
        { passive: true },
      );
    });
  }
}

// Global session manager instance
let sessionManager: SessionManager | null = null;

/**
 * Initialize session manager
 */
export function initSessionManager(
  config?: Partial<SessionTimeoutConfig>,
): SessionManager {
  if (!sessionManager) {
    sessionManager = new SessionManager(config);
  }
  return sessionManager;
}

/**
 * Get session manager instance
 */
export function getSessionManager(): SessionManager | null {
  return sessionManager;
}

/**
 * Start session monitoring
 */
export function startSessionMonitoring(
  config?: Partial<SessionTimeoutConfig>,
): void {
  const manager = initSessionManager(config);
  manager.start();
}

/**
 * Stop session monitoring
 */
export function stopSessionMonitoring(): void {
  if (sessionManager) {
    sessionManager.stop();
  }
}

/**
 * Update session activity
 */
export function updateSessionActivity(): void {
  if (sessionManager) {
    sessionManager.updateActivity();
  }
}

/**
 * Manual logout function
 */
export async function logout(): Promise<void> {
  stopSessionMonitoring();

  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    window.location.href = '/auth/login';
  }
}
