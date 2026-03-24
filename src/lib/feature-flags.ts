/**
 * Feature Flags Configuration
 * 
 * Allows toggling features on/off without redeployment
 */

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

export const FEATURE_FLAGS = {
  // About System
  ABOUT_SYSTEM_ENABLED: process.env.NEXT_PUBLIC_ABOUT_SYSTEM_ENABLED !== 'false',
  ABOUT_MEMBER_PUBLIC_PROFILE: process.env.NEXT_PUBLIC_ABOUT_MEMBER_PUBLIC_PROFILE !== 'false',
  
  // Add more flags as needed
  ADMIN_DASHBOARD_ENABLED: process.env.NEXT_PUBLIC_ADMIN_DASHBOARD_ENABLED !== 'false',
} as const;

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return FEATURE_FLAGS[flag];
}

/**
 * Get all enabled features
 */
export function getEnabledFeatures(): FeatureFlag[] {
  return (Object.entries(FEATURE_FLAGS) as [FeatureFlag, boolean][])
    .filter(([, enabled]) => enabled)
    .map(([flag]) => flag);
}

/**
 * Override feature flags (for testing, use with caution)
 */
export function setFeatureFlag(flag: FeatureFlag, enabled: boolean): void {
  if (typeof window !== 'undefined') {
    // Store in localStorage for development/testing
    const flags = JSON.parse(localStorage.getItem('__feature_flags__') || '{}');
    flags[flag] = enabled;
    localStorage.setItem('__feature_flags__', JSON.stringify(flags));
  }
}

/**
 * Get feature flag override (for development/testing)
 */
export function getFeatureFlagOverride(flag: FeatureFlag): boolean | undefined {
  if (typeof window !== 'undefined') {
    const flags = JSON.parse(localStorage.getItem('__feature_flags__') || '{}');
    return flags[flag];
  }
  return undefined;
}
